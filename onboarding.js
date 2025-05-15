// onboarding.js
const qualityEl = document.getElementById('default-quality');
const metaEl = document.getElementById('show-metadata');
const durationEl = document.getElementById('session-duration');
const saveBtn = document.getElementById('save');

saveBtn.addEventListener('click', () => {
  const prefs = {
    defaultQuality: qualityEl.value,
    showMetadata: metaEl.checked,
    sessionDuration: parseInt(durationEl.value, 10)
  };
  chrome.storage.local.set(prefs, () => {
    window.location.href = 'popup.html';
  });
});
