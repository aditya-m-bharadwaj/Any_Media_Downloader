// settings.js
const qualityEl = document.getElementById('default-quality');
const metaEl    = document.getElementById('show-metadata');
const saveBtn   = document.getElementById('save');

// Load existing
chrome.storage.local.get(['defaultQuality','showMeta'], prefs => {
  if (prefs.defaultQuality) qualityEl.value = prefs.defaultQuality;
  metaEl.checked = !!prefs.showMeta;
});

// Save handler
saveBtn.addEventListener('click', () => {
  chrome.storage.local.set({
    defaultQuality: qualityEl.value,
    showMeta: metaEl.checked
  }, () => window.close());
});
