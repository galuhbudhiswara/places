let activeIndex = 0;
const markers = {};

const INDONESIA_BOUNDS = L.latLngBounds(
  L.latLng(-11.5,  94.0),  // south-west
  L.latLng(  6.5, 141.5)   // north-east
);

const map = L.map('map', {
  center: [-2.5, 118.0],
  zoom: 5,
  minZoom: 5,               
  maxZoom: 13,              
  zoomControl: false,
  maxBounds: INDONESIA_BOUNDS,
  maxBoundsViscosity: 1.0,  
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 13,
  keepBuffer: 2,            
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

L.polyline(places.map(p => [p.lat, p.lng]), {
  color: '#f472a8',
  weight: 1.8,
  dashArray: '5,9',
  opacity: 0.5,
}).addTo(map);

function makeIcon(place, active) {
  const s = active ? 48 : 38;
  const r = active ? 18 : 14;
  return L.divIcon({
    html: `<div style="width:${s}px;height:${s}px;position:relative;cursor:pointer">
      <svg width="${s}" height="${s}" viewBox="0 0 48 48"
        style="filter:drop-shadow(0 4px 10px rgba(200,50,90,${active ? .5 : .22}))">
        <circle cx="24" cy="22" r="${r}" fill="${active ? place.color : 'white'}" stroke="${place.color}" stroke-width="${active ? 0 : 2.2}"/>
        <polygon points="18,28 24,40 30,28" fill="${active ? place.color : 'white'}" stroke="${place.color}" stroke-width="${active ? 0 : 2.2}" stroke-linejoin="round"/>
        <circle cx="24" cy="22" r="${r}" fill="${active ? place.color : 'white'}"/>
      </svg>
      <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-62%);font-size:${active ? 19 : 15}px;line-height:1;pointer-events:none">${place.emoji}</span>
    </div>`,
    className: '',
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
    popupAnchor: [0, -s],
  });
}

places.forEach((place, i) => {
  const m = L.marker([place.lat, place.lng], { icon: makeIcon(place, false) }).addTo(map);
  m.bindPopup(L.popup({ closeButton: false, maxWidth: 195 }).setContent(`
    <div class="popup-inner">
      <div class="popup-emoji">${place.emoji}</div>
      <div class="popup-name">${place.name}</div>
      <div class="popup-sub">${place.location}</div>
      <button class="popup-btn" onclick="openModal(${i})">See Memory &#x2661;</button>
    </div>`));
  m.on('click', () => setActive(i));
  markers[i] = m;
});

function setActive(i) {
  places.forEach((p, j) => markers[j].setIcon(makeIcon(p, j === i)));
}

const legendEl = document.getElementById('legend');
places.forEach((place, i) => {
  const el = document.createElement('div');
  el.className = 'legend-item';
  el.innerHTML = `<div class="legend-dot" style="background:${place.color}"></div><span>${place.name}</span>`;
  el.onclick = () => {
    map.setView([place.lat, place.lng], 8, { animate: true });
    setTimeout(() => markers[i].openPopup(), 600);
    setActive(i);
  };
  legendEl.appendChild(el);
});

function openModal(i) {
  activeIndex = i;
  renderModal();
  document.getElementById('modal-overlay').classList.add('open');
  setActive(i);
}

function renderModal() {
  const p = places[activeIndex];
  document.getElementById('modal-img').src = p.image;
  document.getElementById('modal-badge').textContent = `Memory ${activeIndex + 1} of ${places.length}`;
  document.getElementById('modal-loc-text').textContent = p.location;
  document.getElementById('modal-title').textContent = p.name;
  document.getElementById('modal-date').textContent = p.date;
  document.getElementById('modal-note').textContent = `"${p.note}"`;
  document.getElementById('modal-counter').textContent = `${activeIndex + 1} / ${places.length}`;
  document.getElementById('nav-prev').disabled = activeIndex === 0;
  document.getElementById('nav-next').disabled = activeIndex === places.length - 1;
}

function navigateModal(dir) {
  const n = activeIndex + dir;
  if (n < 0 || n >= places.length) return;
  activeIndex = n;
  renderModal();
  setActive(n);
  map.setView([places[n].lat, places[n].lng], 7, { animate: true });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape')     closeModal();
  if (e.key === 'ArrowLeft')  navigateModal(-1);
  if (e.key === 'ArrowRight') navigateModal(1);
});
