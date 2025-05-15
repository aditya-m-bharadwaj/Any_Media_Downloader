// media_list.js
const params = new URLSearchParams(location.search);
const tabId = params.get('tabId');
const grid = document.getElementById('grid');
const searchEl = document.getElementById('search');
const sortEl = document.getElementById('sort');
const downloadAllBtn = document.getElementById('download-all');

let items = [];

chrome.runtime.getBackgroundPage(bg => {
  items = (bg.cache[tabId] || []).map((url, i) => ({
    id: i,
    url,
    name: url.split('/').pop().split('?')[0],
    size: 0,
    width: 0,
    height: 0,
    duration: 0,
    format: url.match(/\.(jpe?g|png|gif)$/i) ? 'image' :
            url.match(/\.(mp4|webm)$/i) ? 'video' : 'other'
  }));
  renderGrid(items);
  fetchMetadata(items);
});

function fetchMetadata(arr) {
  arr.forEach(item => {
    fetch(item.url, { method: 'HEAD' }).then(res => {
      item.size = parseInt(res.headers.get('content-length')) || 0;
      renderGrid(filterAndSort(items));
    });
  });
}

function filterAndSort(arr) {
  let result = arr.filter(it => it.name.includes(searchEl.value));
  const [type, dir] = sortEl.value.split('_');
  result.sort((a,b) => dir === 'asc' ? a[type]-b[type] : b[type]-a[type]);
  return result;
}

function renderGrid(arr) {
  grid.innerHTML = '';
  arr.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.innerHTML = `
      <input type="checkbox" data-id="${item.id}" class="select-item">
      <img src="${item.url}" loading="lazy">
      <div class="info">
        <p>${item.name}</p>
        <p>${(item.size/1024).toFixed(1)} KB</p>
        <p>${item.format}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

downloadAllBtn.addEventListener('click', () => {
  const selected = Array.from(document.querySelectorAll('.select-item:checked'))
    .map(cb => items[cb.dataset.id].url);
  chrome.runtime.sendMessage({ action: 'download', urls: selected });
});

searchEl.addEventListener('input', () => renderGrid(filterAndSort(items)));
sortEl.addEventListener('change', () => renderGrid(filterAndSort(items)));