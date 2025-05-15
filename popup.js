// popup.js
const statusEl    = document.getElementById('status');
const toggleBtn   = document.getElementById('toggle-btn');
const controlsDiv = document.getElementById('controls');
const gatherBtn   = document.getElementById('gather-btn');

// Helpers
function updateUI(enabled) {
  statusEl.textContent = enabled ? 'Enabled ✅' : 'Disabled ❌';
  toggleBtn.textContent = enabled ? 'Disable' : 'Enable';
  controlsDiv.style.display = enabled ? 'block' : 'none';
}

// Toggle handler
toggleBtn.addEventListener('click', async () => {
  const now = Date.now();
  const expires = now + 10*60*1000; // 10 minutes
  const enabled = statusEl.textContent.startsWith('Disabled');
  if (enabled) {
    // Set cookie-like entry
    chrome.storage.local.set({ enabled: true, expires });
  } else {
    chrome.storage.local.remove(['enabled','expires']);
  }
  updateUI(enabled);
});

// Gather media action
gatherBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'gatherMedia' });
  });
});

// Init
(async function init() {
  const { enabled = false, expires = 0 } = await chrome.storage.local.get(['enabled','expires']);
  // auto-disable if expired or if URL changed
  if (!enabled || Date.now() > expires) {
    chrome.storage.local.remove(['enabled','expires']);
    updateUI(false);
  } else {
    updateUI(true);
  }
})();
