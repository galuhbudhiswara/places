let activePlaceIndex = 0;
let activeMediaIndex = 0;
const markers = {};

const JAVA_BOUNDS = L.latLngBounds(
  L.latLng(-8.8, 105.0),
  L.latLng(-5.8, 115.0)
);

const map = L.map('map', {
  center: [-7.5, 110.0],
  zoom: 7,
  minZoom: 7,
  maxZoom: 9,
  zoomControl: false,
  maxBounds: JAVA_BOUNDS,
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

function openModal(placeIndex) {
  activePlaceIndex = placeIndex;
  activeMediaIndex = 0;         
  renderModal();
  document.getElementById('modal-overlay').classList.add('open');
  setActive(placeIndex);
}

function renderModal() {
  const place  = places[activePlaceIndex];
  const media  = place.media;
  const item   = media[activeMediaIndex];
  const total  = media.length;

  const container = document.getElementById('media-container');
  container.innerHTML = '';   

  if (item.type === 'video') {
    const vid = document.createElement('video');
    vid.src      = item.src;
    vid.controls = true;
    vid.autoplay = true;
    vid.muted    = false;
    vid.loop     = false;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('controlsList', 'nodownload');
    vid.setAttribute('disablePictureInPicture', '');
    container.appendChild(vid);
  } else {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = place.name;
    container.appendChild(img);
  }

  const typeLabel = item.type === 'video' ? 'Video' : 'Photo';
  document.getElementById('modal-badge').textContent =
    total > 1
      ? `${typeLabel} ${activeMediaIndex + 1} of ${total}`
      : place.name;

  document.getElementById('modal-loc-text').textContent = place.location;
  document.getElementById('modal-title').textContent    = place.name;
  document.getElementById('modal-date').textContent     = place.date ? `${place.note}` : '';
  document.getElementById('modal-note').textContent     = place.note ? `${place.note}` : '';

  document.getElementById('modal-counter').textContent =
    total > 1 ? `${activeMediaIndex + 1} / ${total}` : '';

  document.getElementById('nav-prev').disabled = activeMediaIndex === 0;
  document.getElementById('nav-next').disabled = activeMediaIndex === total - 1;
}

function navigateMedia(dir) {
  const total = places[activePlaceIndex].media.length;
  const next  = activeMediaIndex + dir;
  if (next < 0 || next >= total) return;
  activeMediaIndex = next;
  renderModal();
}

function closeModal() {
  const vid = document.querySelector('#media-container video');
  if (vid) vid.pause();
  document.getElementById('modal-overlay').classList.remove('open');
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape')     closeModal();
  if (e.key === 'ArrowLeft')  navigateMedia(-1);
  if (e.key === 'ArrowRight') navigateMedia(1);
});
