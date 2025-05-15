// popup.js

const statusEl    = document.getElementById('status');
const toggleBtn   = document.getElementById('toggle-btn');
const controlsDiv = document.getElementById('controls');
const gatherBtn   = document.getElementById('gather-btn');

/**
 * Update the popup UI based on enabled state
 * @param {boolean} enabled 
 */
function updateUI(enabled) {
  statusEl.textContent        = enabled ? 'Enabled ✅'  : 'Disabled ❌';
  toggleBtn.textContent       = enabled ? 'Disable'     : 'Enable';
  controlsDiv.style.display   = enabled ? 'block'       : 'none';
}

// Toggle Extension on/off
toggleBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    // Determine new state
    const enabling = statusEl.textContent.startsWith('Disabled');
    if (enabling) {
      const now     = Date.now();
      const expires = now + 10 * 60 * 1000; // 10 minutes from now
      // Store enabled flag, expiration, and current tab
      chrome.storage.local.set({ enabled: true, expires, lastTab: tabId }, () => {
        updateUI(true);
      });
    } else {
      // Disable and clear stored state
      chrome.storage.local.remove(['enabled', 'expires', 'lastTab'], () => {
        updateUI(false);
      });
    }
  });
});

// Gather media on page
gatherBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'triggerScan' });
  window.close();
});

// Initialise popup on load
(function init() {
  chrome.storage.local.get(['enabled', 'expires', 'lastTab'], (prefs) => {
    const now       = Date.now();
    const { enabled = false, expires = 0, lastTab } = prefs;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTabId = tabs[0].id;
      // Auto-disable if expired or if user navigated away from the tab that was activated
      const stillValid = enabled && now < expires && lastTab === currentTabId;
      if (!stillValid) {
        chrome.storage.local.remove(['enabled', 'expires', 'lastTab']);
      }
      updateUI(stillValid);
    });
  });
})();
