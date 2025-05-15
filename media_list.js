const tabId = new URLSearchParams(location.search).get("tabId");
const grid = document.getElementById("grid");
const downloadAllBtn = document.getElementById("download-all");

chrome.runtime.getBackgroundPage(bg => {
  const items = bg.cache[tabId] || [];
  const uniqueUrls = Array.from(new Set(items));
  uniqueUrls.forEach((url, i) => {
    const div = document.createElement("div");
    div.innerHTML = `<label><input type="checkbox" value="${url}"><img src="${url}" style="width:100%;height:auto;"></label>`;
    grid.appendChild(div);
  });
});

downloadAllBtn.addEventListener("click", () => {
  const urls = Array.from(grid.querySelectorAll("input:checked")).map(cb => cb.value);
  chrome.runtime.sendMessage({ action: "download", urls });
});
