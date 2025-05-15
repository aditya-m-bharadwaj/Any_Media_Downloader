// background.js
const cache = {};
const MEDIA_MIME = ["image/","video/"];

function isEnabled() {
  return chrome.storage.local.get('enabled').then(r => !!r.enabled);
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!await isEnabled()) return;
  cache[tab.id] = [];
  chrome.webRequest.onCompleted.addListener(onRequest, {urls: ["<all_urls>"]}, ["responseHeaders"]);
  chrome.tabs.reload(tab.id, () => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => chrome.runtime.sendMessage({ action: "gatherMedia" })
    });
  });
});

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (!await isEnabled()) return;
  const tid = sender.tab.id;
  if (msg.action === "mediaFound" || msg.action === "xhrMedia") {
    cache[tid] = cache[tid] || [];
    cache[tid].push(...msg.urls);
    if (!cache[tid].listOpened) {
      cache[tid].listOpened = true;
      chrome.tabs.create({ url: chrome.runtime.getURL(`media_list.html?tabId=${tid}`) });
    }
  }
  if (msg.action === "download") {
    for (const url of msg.urls) {
      chrome.downloads.download({ url, conflictAction: "uniquify" });
    }
  }
});

function onRequest(details) {
  const tid = details.tabId;
  if (tid < 0) return;
  const ct = (details.responseHeaders.find(h => h.name.toLowerCase()==="content-type")||{}).value || "";
  if (MEDIA_MIME.some(m => ct.startsWith(m))) {
    cache[tid] = cache[tid] || [];
    cache[tid].push(details.url);
  }
}

chrome.storage.onChanged.addListener((changes) => {
  if ('enabled' in changes) {
    if (changes.enabled.newValue) {
      chrome.webRequest.onCompleted.addListener(onRequest, {urls: ["<all_urls>"]}, ["responseHeaders"]);
    } else {
      chrome.webRequest.onCompleted.removeListener(onRequest);
    }
  }
});
