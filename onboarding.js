// onboarding.js

// DOM references
const qualityEl  = document.getElementById('default-quality');
const metaEl     = document.getElementById('show-metadata');
const durationEl = document.getElementById('session-duration');
const saveBtn    = document.getElementById('save');

saveBtn.addEventListener('click', () => {
  // Gather preferences
  const prefs = {
    defaultQuality:   qualityEl.value,
    showMetadata:     metaEl.checked,
    sessionDuration:  parseInt(durationEl.value, 10)
  };

  // Save prefs
  chrome.storage.local.set(prefs, () => {
    // Mark onboarding complete
    chrome.storage.local.set({ onboarded: true }, () => {
      // Redirect back to popup
      window.location.href = 'popup.html';
    });
  });
});
