// background.js

const cache = {};
const MEDIA_MIME = ["image/", "video/"];

// Bootstrap defaults
async function bootstrapDefaults() {
  const { defaultQuality } = await chrome.storage.local.get("defaultQuality");
  if (defaultQuality === undefined) {
    const resp = await fetch(chrome.runtime.getURL("settings.json"));
    const defs = await resp.json();
    await chrome.storage.local.set(defs);
  }
}

// Check on/off & timeout
function isEnabled() {
  return new Promise(resolve => {
    chrome.storage.local.get(["enabled", "expires"], ({ enabled, expires }) => {
      const now = Date.now();
      if (!enabled || !expires || now > expires) {
        chrome.storage.local.remove(["enabled", "expires"]);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Capture network media
function onRequest(details) {
  const tid = details.tabId;
  if (tid < 0) return;
  const header = details.responseHeaders.find(h => h.name.toLowerCase() === "content-type");
  const ct = header?.value || "";
  if (MEDIA_MIME.some(m => ct.startsWith(m))) {
    cache[tid] = cache[tid] || [];
    cache[tid].push(details.url);
  }
}

// Start a scan
async function startScan(tab) {
  if (!(await isEnabled())) return;
  const tid = tab.id;
  cache[tid] = [];
  chrome.webRequest.onCompleted.addListener(onRequest, { urls: ["<all_urls>"] }, ["responseHeaders"]);
  chrome.tabs.reload(tid, () => {
    chrome.tabs.create({ url: chrome.runtime.getURL(`found_media_list.html?tabId=${tid}`) });
    chrome.scripting.executeScript({
      target: { tabId: tid },
      func: () => chrome.runtime.sendMessage({ action: "gatherMedia" })
    });
  });
}

// Listen for toolbar click
chrome.action.onClicked.addListener(startScan);

// Message handler
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === "triggerScan") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    startScan(tab);
    return;
  }
  if (msg.action === "getCache") {
    // reply with cached URLs
    const arr = cache[msg.tabId] || [];
    sendResponse({ urls: arr });
    return true; // keep channel open for sendResponse
  }
  if (!(await isEnabled())) return;
  const tid = sender.tab?.id;
  if (msg.action === "mediaFound" || msg.action === "xhrMedia") {
    cache[tid] = cache[tid] || [];
    cache[tid].push(...msg.urls);
  }
  if (msg.action === "download") {
    for (const u of msg.urls) chrome.downloads.download({ url: u, conflictAction: "uniquify" });
  }
});

// React to enable flag changes
chrome.storage.onChanged.addListener(changes => {
  if ("enabled" in changes) {
    if (changes.enabled.newValue) {
      chrome.webRequest.onCompleted.addListener(onRequest, { urls: ["<all_urls>"] }, ["responseHeaders"]);
    } else {
      chrome.webRequest.onCompleted.removeListener(onRequest);
    }
  }
});

// Init
chrome.runtime.onInstalled.addListener(bootstrapDefaults);
bootstrapDefaults();
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get("enabled", ({ enabled }) => {
    if (enabled) {
      chrome.webRequest.onCompleted.addListener(onRequest, { urls: ["<all_urls>"] }, ["responseHeaders"]);
    }
  });
});
chrome.runtime.onSuspend.addListener(() => {
  for (const tid in cache) {
    if (cache[tid].length > 0) {
      chrome.storage.local.set({ [tid]: cache[tid] });
    }
  }
});