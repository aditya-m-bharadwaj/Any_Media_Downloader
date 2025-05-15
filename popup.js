// popup.js
const statusEl = document.getElementById('status');
const toggleBtn = document.getElementById('toggle-btn');
const controlsDiv = document.getElementById('controls');
const gatherBtn = document.getElementById('gather-btn');

function updateUI(enabled) {
  statusEl.textContent = enabled ? 'Enabled ✅' : 'Disabled ❌';
  toggleBtn.textContent = enabled ? 'Disable' : 'Enable';
  controlsDiv.style.display = enabled ? 'block' : 'none';
}

toggleBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.storage.local.get(['enabled','expires'], ({ enabled }) => {
      const enabling = !enabled;
      if (enabling) {
        const now = Date.now();
        chrome.storage.local.set({ enabled: true, expires: now + (10*60*1000) }, () => {
          updateUI(true);
        });
      } else {
        chrome.storage.local.remove(['enabled','expires'], () => {
          updateUI(false);
        });
      }
    });
  });
});

gatherBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'triggerScan' });
  window.close();
});

(function init() {
  chrome.storage.local.get(['enabled','expires'], ({ enabled, expires }) => {
    const now = Date.now();
    if (!enabled || !expires || now > expires) {
      chrome.storage.local.remove(['enabled','expires']);
      updateUI(false);
    } else {
      updateUI(true);
    }
  });
})();
