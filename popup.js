// popup.js

// DOM references
const statusEl   = document.getElementById('status');
const toggleBtn  = document.getElementById('toggle-btn');
const controlsEl = document.getElementById('controls');
const gatherBtn  = document.getElementById('gather-btn');

/**
 * Update the popup UI based on whether the extension is enabled.
 */
function updateUI(enabled) {
  statusEl.textContent = enabled ? 'Enabled ✅' : 'Disabled ❌';
  toggleBtn.textContent = enabled ? 'Disable'     : 'Enable';
  controlsEl.style.display = enabled ? 'flex'     : 'none';
}

/**
 * Initialize popup: handle first-run onboarding or show normal UI.
 */
function init() {
  // Check if onboarding has been completed
  chrome.storage.local.get(['onboarded'], ({ onboarded }) => {
    if (!onboarded && location.pathname.endsWith('popup.html')) {
      // First run → redirect to onboarding
      window.location.href = 'onboarding.html';
      return;
    }

    // Otherwise, show regular toggle/Gather controls
    chrome.storage.local.get(['enabled','expires'], ({ enabled, expires }) => {
      const now = Date.now();
      if (!enabled || !expires || now > expires) {
        // Not enabled or session expired
        chrome.storage.local.remove(['enabled','expires'], () => {
          updateUI(false);
        });
      } else {
        updateUI(true);
      }
    });
  });
}

// Toggle On/Off button handler
toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['enabled','sessionDuration'], ({ enabled, sessionDuration }) => {
    if (!enabled) {
      // Turn on: set expiry based on sessionDuration
      const now = Date.now();
      const expires = now + ((sessionDuration || 10) * 60 * 1000);
      chrome.storage.local.set({ enabled: true, expires }, () => {
        updateUI(true);
      });
    } else {
      // Turn off: clear flags
      chrome.storage.local.remove(['enabled','expires'], () => {
        updateUI(false);
      });
    }
  });
});

// Gather Media button handler
gatherBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'triggerScan' });
  window.close();
});

// Run initialization when the popup loads
init();
