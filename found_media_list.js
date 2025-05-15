// media_list.js
const params = new URLSearchParams(location.search);
const tabId = Number(params.get("tabId"));
const grid = document.getElementById("grid");

// Fetch cache from background
chrome.runtime.sendMessage({ action: "getCache", tabId }, resp => {
  const urls = resp.urls || [];
  renderGrid(urls);
});

// Simple grid render
function renderGrid(urls) {
  grid.innerHTML = "";
  urls.forEach((url, i) => {
    const div = document.createElement("div");
    div.className = "media-card";
    div.innerHTML = `
      <input type="checkbox" data-url="${url}" class="select-item">
      <img src="${url}" loading="lazy">
    `;
    grid.appendChild(div);
  });
  // you can layer in metadata fetch, sort/filter etc.
}
