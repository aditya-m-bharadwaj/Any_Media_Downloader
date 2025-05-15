// content.js
(function() {
  function extractMediaUrls(obj, found = []) {
    if (typeof obj === 'string' && obj.match(/\.(jpe?g|png|gif|mp4|webm)(\?.*)?$/i)) {
      found.push(obj);
    } else if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (/display_url|video_url|src|url/i.test(key)) {
          const val = obj[key];
          if (typeof val === 'string') found.push(val);
          else if (Array.isArray(val)) val.forEach(v => typeof v === 'string' && found.push(v));
        }
        extractMediaUrls(obj[key], found);
      }
    }
    return Array.from(new Set(found));
  }

  const origFetch = window.fetch;
  window.fetch = (...args) => origFetch(...args).then(async res => {
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = await res.clone().json();
        const urls = extractMediaUrls(json);
        if (urls.length) chrome.runtime.sendMessage({ action: 'xhrMedia', urls });
      }
    } catch {}
    return res;
  });

  const OrigXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OrigXHR();
    xhr.addEventListener('load', () => {
      try {
        const ct = xhr.getResponseHeader('content-type') || '';
        if (ct.includes('application/json')) {
          const json = JSON.parse(xhr.responseText);
          const urls = extractMediaUrls(json);
          if (urls.length) chrome.runtime.sendMessage({ action: 'xhrMedia', urls });
        }
      } catch {}
    });
    return xhr;
  };

  function collectMedia() {
    const urls = new Set();
    document.querySelectorAll('img, video, source').forEach(el => {
      const src = el.currentSrc || el.src;
      if (src) urls.add(src);
    });
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage.match(/url\((['"]?)([^"')]+)\1\)/);
      if (bg) urls.add(bg[2]);
    });
    chrome.runtime.sendMessage({ action: 'mediaFound', urls: [...urls] });
  }

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === 'gatherMedia') collectMedia();
  });
})();
