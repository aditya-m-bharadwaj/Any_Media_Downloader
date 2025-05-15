// content.js
(function() {
  function extractMediaUrls(obj, found = []) {
    if (typeof obj === "string" && obj.match(/\.(jpe?g|png|mp4|webm)(\?.*)?$/i)) { found.push(obj); }
    else if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (/display_url|video_url|src|url/i.test(key)) {
          const val = obj[key];
          if (typeof val === "string") found.push(val);
          else if (Array.isArray(val)) val.forEach(v => typeof v === "string" && found.push(v));
        }
        extractMediaUrls(obj[key], found);
      }
    }
    return Array.from(new Set(found));
  }

  // Wrap fetch
  const origFetch = window.fetch;
  window.fetch = (...args) => origFetch(...args).then(async res => {
    try {
      const clone = res.clone();
      const ct = clone.headers.get("content-type")||"";
      if (ct.includes("application/json")) {
        const json = await clone.json();
        const urls = extractMediaUrls(json);
        if (urls.length) chrome.runtime.sendMessage({ action: "xhrMedia", urls });
      }
    } catch(e){}
    return res;
  });

  // Wrap XHR
  const OrigXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OrigXHR();
    xhr.addEventListener("load", function() {
      try {
        const ct = xhr.getResponseHeader("content-type")||"";
        if (ct.includes("application/json")) {
          const json = JSON.parse(xhr.responseText);
          const urls = extractMediaUrls(json);
          if (urls.length) chrome.runtime.sendMessage({ action: "xhrMedia", urls });
        }
      } catch(e){}
    });
    return xhr;
  };

  // DOM collect
  function collectMedia() {
    const urls = new Set();
    document.querySelectorAll("img,video,source").forEach(el => {
      const src = el.currentSrc||el.src;
      if (src) urls.add(src);
    });
    document.querySelectorAll("*").forEach(el => {
      const bg = getComputedStyle(el).backgroundImage.match(/url\((['"]?)([^"')]+)\1\)/);
      if (bg) urls.add(bg[2]);
    });
    chrome.runtime.sendMessage({ action: "mediaFound", urls: [...urls] });
  }

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === "gatherMedia") {
      chrome.storage.local.get('enabled', ({enabled}) => {
        if (enabled) collectMedia();
      });
    }
  });
})();
