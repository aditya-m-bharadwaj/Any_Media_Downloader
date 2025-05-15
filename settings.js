// settings.js
const qualityEl = document.getElementById('default-quality');
const metaEl = document.getElementById('show-metadata');
const durationEl = document.getElementById('session-duration');
const saveBtn = document.getElementById('save');

chrome.storage.local.get(
  ['defaultQuality','showMetadata','sessionDuration'],
  ({ defaultQuality, showMetadata, sessionDuration }) => {
    if (defaultQuality) qualityEl.value = defaultQuality;
    metaEl.checked = showMetadata;
    if (sessionDuration) durationEl.value = sessionDuration;
  }
);

saveBtn.addEventListener('click', () => {
  chrome.storage.local.set({
    defaultQuality: qualityEl.value,
    showMetadata: metaEl.checked,
    sessionDuration: parseInt(durationEl.value,10)
  }, () => window.close());
});
