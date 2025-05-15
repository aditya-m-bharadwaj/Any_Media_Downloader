// settings.js
const qualityEl = document.getElementById('default-quality');
const metaEl    = document.getElementById('show-metadata');
const durationEl= document.getElementById('session-duration');
const scopeEl   = document.getElementById('activation-scope');
const saveBtn   = document.getElementById('save');

// Load current settings
chrome.storage.local.get(
  ['defaultQuality','showMetadata','sessionDuration','activationScope'],
  prefs => {
    if (prefs.defaultQuality) qualityEl.value = prefs.defaultQuality;
    metaEl.checked = prefs.showMetadata;
    if (prefs.sessionDuration) durationEl.value = prefs.sessionDuration;
    if (prefs.activationScope) scopeEl.value = prefs.activationScope;
  }
);

// Save handler
saveBtn.addEventListener('click', () => {
  chrome.storage.local.set({
    defaultQuality: qualityEl.value,
    showMetadata:  metaEl.checked,
    sessionDuration: parseInt(durationEl.value,10),
    activationScope: scopeEl.value
  }, () => window.close());
});
