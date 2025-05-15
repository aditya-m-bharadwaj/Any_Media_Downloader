// background.js

// In-memory cache of media URLs per tab
const cache = {};
const MEDIA_MIME = ["image/", "video/"];

/**
 * Checks if the extension session is enabled and unexpired.
 * Auto-clears the flag if it’s expired.
 * @returns {Promise<boolean>}
 */
function isEnabled() {
  return new Promise(resolve => {
    chrome.storage.local.get(["enabled", "expires"], ({ enabled, expires }) => {
      const now = Date.now();
      if (!enabled || !expires || now > expires) {
        // Session expired or never enabled
        chrome.storage.local.remove(["enabled", "expires"]);
        return resolve(false);
      }
      resolve(true);
    });
  });
}

/**
 * Handles completed network requests, capturing any image/video URLs.
 */
function onRequest(details) {
  const tabId = details.tabId;
  if (tabId < 0) return;

  const header = details.responseHeaders.find(
    h => h.name.toLowerCase() === "content-type"
  );
  const contentType = header?.value || "";

  if (MEDIA_MIME.some(mime => contentType.startsWith(mime))) {
    cache[tabId] = cache[tabId] || [];
    cache[tabId].push(details.url);
  }
}

/**
 * Orchestrates a media scan on the given tab:
 * 1) Clears cache
 * 2) Registers network listener
 * 3) Reloads the page
 * 4) Opens the media-list UI immediately
 * 5) Injects the DOM crawler
 * @param {chrome.tabs.Tab} tab
 */
async function startScan(tab) {
  if (!(await isEnabled())) {
    return;
  }

  const tabId = tab.id;
  cache[tabId] = [];

  // 1) Listen for media network requests
  chrome.webRequest.onCompleted.addListener(
    onRequest,
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  );

  // 2) Reload the page to trigger fresh requests
  chrome.tabs.reload(tabId, () => {
    // 3) Open the media-list UI right away
    chrome.tabs.create({
      url: chrome.runtime.getURL(`media_list.html?tabId=${tabId}`)
    });

    // 4) Inject the DOM crawler to pick up inline media
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => chrome.runtime.sendMessage({ action: "gatherMedia" })
    });
  });
}

// --------------------------------------------------------
// Listeners
// --------------------------------------------------------

// Toolbar icon click → start the scan
chrome.action.onClicked.addListener(startScan);

// Messages from popup/content scripts
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  const { action, urls } = msg;

  if (action === "triggerScan") {
    // Popup button clicked
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return startScan(activeTab);
  }

  // Other actions require the session to be enabled
  if (!(await isEnabled())) {
    return;
  }

  const tabId = sender.tab?.id;
  if (tabId === undefined) {
    return;
  }

  if (action === "mediaFound" || action === "xhrMedia") {
    // Accumulate discovered URLs
    cache[tabId] = cache[tabId] || [];
    cache[tabId].push(...urls);
    return;
  }

  if (action === "download") {
    // Trigger downloads
    for (const url of urls) {
      chrome.downloads.download({ url, conflictAction: "uniquify" });
    }
    return;
  }
});

// Dynamically add/remove network listener when the enable flag changes
chrome.storage.onChanged.addListener(changes => {
  if ("enabled" in changes) {
    if (changes.enabled.newValue) {
      chrome.webRequest.onCompleted.addListener(
        onRequest,
        { urls: ["<all_urls>"] },
        ["responseHeaders"]
      );
    } else {
      chrome.webRequest.onCompleted.removeListener(onRequest);
    }
  }
});
