// background.js

// In-memory cache of media URLs per tab
const cache = {};
const MEDIA_MIME = ["image/", "video/"];

// Helper to check if extension is enabled and session not expired
define isEnabled = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['enabled', 'expires', 'lastTab'], (res) => {
      const { enabled, expires, lastTab } = res;
      // Disable if expired or tab changed
      const now = Date.now();
      if (!enabled || now > expires || lastTab !== currentTabId) {
        chrome.storage.local.remove(['enabled', 'expires', 'lastTab']);
        return resolve(false);
      }
      resolve(true);
    });
  });
};

// Core scan logic
async function startScan(tab) {
  const enabled = await isEnabled();
  if (!enabled) return;
  const tid = tab.id;
  // Initialize cache
  cache[tid] = [];
  // Register network listener
  chrome.webRequest.onCompleted.addListener(onRequest, { urls: ["<all_urls>"] }, ["responseHeaders"]);
  // Reload page to capture network events
  chrome.tabs.reload(tid, () => {
    // Inject DOM crawler after reload
    chrome.scripting.executeScript({
      target: { tabId: tid },
      func: () => chrome.runtime.sendMessage({ action: 'gatherMedia' })
    });
  });
}

// Listen for toolbar icon clicks
chrome.action.onClicked.addListener((tab) => {
  startScan(tab);
});

// Handle incoming messages
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  const { action, urls } = msg;
  const tid = sender.tab?.id;
  if (!tid) return;
  if (action === 'triggerScan') {
    // From popup gather button
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    startScan(tabs[0]);
    return;
  }
  if (action === 'mediaFound' || action === 'xhrMedia') {
    if (!await isEnabled()) return;
    cache[tid] = cache[tid] || [];
    cache[tid].push(...urls);
    if (!cache[tid].listOpened) {
      cache[tid].listOpened = true;
      chrome.tabs.create({ url: chrome.runtime.getURL(`media_list.html?tabId=${tid}`) });
    }
    return;
  }
  if (action === 'download') {
    for (const url of urls) {
      chrome.downloads.download({ url, conflictAction: 'uniquify' });
    }
    return;
  }
});

// Network request listener
function onRequest(details) {
  const tid = details.tabId;
  if (tid < 0) return;
  const header = details.responseHeaders.find(h => h.name.toLowerCase() === 'content-type');
  const ct = header?.value || '';
  if (MEDIA_MIME.some(m => ct.startsWith(m))) {
    cache[tid] = cache[tid] || [];
    cache[tid].push(details.url);
  }
}

// React to enable flag changes to register/unregister webRequest listener
gchrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    if (changes.enabled.newValue) {
      // record the tab and expiration
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const now = Date.now();
        const expires = now + 10 * 60 * 1000;
        chrome.storage.local.set({ lastTab: tabs[0].id, expires });
      });
      chrome.webRequest.onCompleted.addListener(onRequest, { urls: ["<all_urls>"] }, ["responseHeaders"]);
    } else {
      chrome.webRequest.onCompleted.removeListener(onRequest);
    }
  }
});
