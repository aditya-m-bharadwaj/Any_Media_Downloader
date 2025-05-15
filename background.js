// background.js
const cache = {};
const MEDIA_MIME = ["image/", "video/"];

// Bootstrap defaults from settings.json if storage is empty
async function bootstrapDefaults() {
  const storage = await chrome.storage.local.get(['defaultQuality','showMetadata','sessionDuration']);
  if (storage.defaultQuality === undefined) {
    const response = await fetch(chrome.runtime.getURL('settings.json'));
    const defaults = await response.json();
    await chrome.storage.local.set(defaults);
  }
}

// Check if extension is enabled and session unexpired
function isEnabled() {
  return new Promise(resolve => {
    chrome.storage.local.get(["enabled", "expires"], ({ enabled, expires }) => {
      const now = Date.now();
      if (!enabled || !expires || now > expires) {
        chrome.storage.local.remove(["enabled", "expires"]);
        return resolve(false);
      }
      resolve(true);
    });
  });
}

// Handle completed network requests
function onRequest(details) {
  const tabId = details.tabId;
  if (tabId < 0) return;
  const header = details.responseHeaders.find(h => h.name.toLowerCase() === "content-type");
  const contentType = header?.value || "";
  if (MEDIA_MIME.some(mime => contentType.startsWith(mime))) {
    cache[tabId] = cache[tabId] || [];
    cache[tabId].push(details.url);
  }
}

// Orchestrate a media scan on the given tab
async function startScan(tab) {
  if (!(await isEnabled())) return;
  const tabId = tab.id;
  cache[tabId] = [];

  chrome.webRequest.onCompleted.addListener(
    onRequest,
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  );

  chrome.tabs.reload(tabId, () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL(`found_media_list.html?tabId=${tabId}`)
    });
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => chrome.runtime.sendMessage({ action: 'gatherMedia' })
    });
  });
}

// Toolbar icon click → start scan
chrome.action.onClicked.addListener(startScan);

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  const { action, urls } = msg;
  if (action === 'triggerScan') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return startScan(tab);
  }
  if (!(await isEnabled())) return;
  const tabId = sender.tab?.id;
  if (action === 'mediaFound' || action === 'xhrMedia') {
    cache[tabId] = cache[tabId] || [];
    cache[tabId].push(...urls);
    return;
  }
  if (action === 'download') {
    for (const url of urls) {
      chrome.downloads.download({ url, conflictAction: 'uniquify' });
    }
    return;
  }
});

// Re-register or remove network listener when enabled flag changes
chrome.storage.onChanged.addListener(changes => {
  if ('enabled' in changes) {
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

// Initialize defaults on install and startup
chrome.runtime.onInstalled.addListener(bootstrapDefaults);
bootstrapDefaults();
