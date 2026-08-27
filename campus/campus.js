/* ===========================================================
   Navatiwat International School — 3D Campus (low-poly blocks)
   Deliberately "dumb": every building is just a colored
   BoxGeometry block, positioned to match the reference 2D
   campus map. No shadows, no trees, no roads — kept light
   on the GPU while still being a real interactive 3D scene
   (OrbitControls: rotate / pan / zoom).
   =========================================================== */

import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from './vendor/CSS2DRenderer.js';

/* -----------------------------------------------------------
   1. Block data — x/y are % positions taken straight from the
   reference campus map image (same coordinate source as the
   2D version). w/d/h are just block size in world units.
   ----------------------------------------------------------- */
const GROUND_W = 110; // world units, matches the map's ~1.83 aspect ratio
const GROUND_D = 60;

const BLOCKS = [
  { id:'A', name:'Building A — Nava Hall', category:'support', x:19.0, y:51.9, w:9, d:9, h:8,
    desc:'อาคารบริหาร (Administration Building) — สำนักผู้อำนวยการ ฝ่ายทะเบียน ห้องรับรอง และประตูรักษาความปลอดภัยหลักของโรงเรียน', major:true },
  { id:'B', name:'Building B — Academic Center I', category:'academic', x:32.2, y:26.8, w:10, d:7, h:7,
    desc:'ศูนย์วิชาการมัธยมต้น (Junior Secondary) — ห้องเรียนวิทยาศาสตร์ อังกฤษ ไทย ญี่ปุ่น และห้องเรียนสังคมศึกษา' },
  { id:'C', name:'Building C — Academic Center II', category:'academic', x:47.9, y:26.8, w:10, d:7, h:7.5,
    desc:'ศูนย์วิชาการมัธยมปลาย (Senior Secondary) — ห้องประชุมมาตรฐาน ห้องเรียนขั้นสูง และห้องเรียนภาษาต่างประเทศ' },
  { id:'D', name:'Building D — STEM & Innovation Center', category:'academic', x:61.5, y:26.8, w:10, d:7.5, h:9,
    desc:'ศูนย์นวัตกรรม STEM — ห้องปฏิบัติการชีววิทยา เคมี ฟิสิกส์ ห้อง Exosuit Lab, AI Laboratory, Engineering Workshop และ Innovation Hub', major:true },
  { id:'J', name:'Building J — Sports Complex', category:'activity', x:85.0, y:25.0, w:11, d:9, h:6.5,
    desc:'อาคารกีฬาในร่ม — สนามบาสเกตบอล วอลเลย์บอล แบดมินตัน สระว่ายน้ำ และห้องล็อกเกอร์', major:true },
  { id:'Lake', name:'Central Lake & Riverside Walkway', category:'water', x:64.5, y:46.5, w:14, d:12, h:0.3,
    desc:'ทะเลสาบกลางแคมปัส พร้อมสวนสมาธิ (Meditation Garden), อัฒจันทร์กลางแจ้ง (Outdoor Amphitheater) และทางเดินริมน้ำ' },
  { id:'F', name:'Building F — Navatiwat Learning Commons', category:'academic', x:39.1, y:66.2, w:8, d:8, h:6,
    desc:'หอสมุดกลาง (Library) — Digital Library, Reading Hall, Discussion Rooms, Storytelling Theatre และ Explore Library', major:true },
  { id:'G', name:'Building G — Student Center', category:'support', x:51.8, y:60.8, w:7, d:6.5, h:5.5,
    desc:'ศูนย์กิจกรรมนักเรียน — สำนักงานสภานักเรียน ห้องชมรม ห้องประชุมนักเรียน และ Handa Rope' },
  { id:'E', name:'Building E — Creative Arts Center', category:'activity', x:19.0, y:75.1, w:9, d:8, h:6,
    desc:'ศูนย์ศิลปะสร้างสรรค์ — Fine Arts Atelier Studio, Graphic Design Studio, Orchestra Hall, Choir Room และ Black Box Theatre', major:true },
  { id:'H', name:'Building H — Wellness Center', category:'support', x:51.8, y:82.3, w:6, d:6, h:5,
    desc:'ศูนย์สุขภาพนักเรียน — ห้องพยาบาล ห้องปฐมพยาบาล ห้องให้คำปรึกษา และห้องพักครู' },
  { id:'I', name:'Building I — Dining Hall', category:'support', x:66.4, y:75.1, w:8, d:7, h:5.5,
    desc:'โรงอาหารกลาง — เคาน์เตอร์อาหารนานาชาติ International Food Court, Cafe Shop และ Convenience Store', major:true },
  { id:'Sports', name:'Outdoor Sports Zone', category:'activity', x:85.0, y:53.7, w:13, d:10, h:0.3,
    desc:'สนามฟุตบอลมาตรฐาน FIFA, ลู่วิ่ง 400 เมตร, สนามบาสเกตบอล และสนามเทนนิส' },
  { id:'K', name:'Building K — Faculty Center', category:'support', x:81.1, y:84.1, w:6, d:5.5, h:5,
    desc:'อาคารคณาจารย์ — Teacher Lounge และ Meeting Rooms' },
  { id:'L', name:'Building L — Maintenance Building', category:'support', x:92.8, y:84.1, w:5, d:4.5, h:4,
    desc:'อาคารซ่อมบำรุงและงานบริการ — Facilities Team และ Waste Management / Recycling Area' },
  { id:'Parking', name:'Visitor Parking', category:'support', x:11.7, y:19.7, w:9, d:6, h:0.2,
    desc:'ลานจอดรถสำหรับผู้มาเยือน' },
  { id:'Dropoff', name:'Student Drop-off Area', category:'support', x:5.9, y:31.3, w:6, d:7, h:0.2,
    desc:'จุดรับ-ส่งนักเรียน' },
];

const categoryColor = {
  academic: 0x7C93D9,
  activity: 0x4E8F6B,
  support: 0xE7B24B,
  water: 0x5FA8D3,
};

// map map-image % coordinates straight to world X/Z
function toWorld(xPct, yPct) {
  return {
    x: (xPct / 100 - 0.5) * GROUND_W,
    z: (yPct / 100 - 0.5) * GROUND_D,
  };
}

/* -----------------------------------------------------------
   2. Renderer / Scene / Camera — kept deliberately simple:
   no shadow maps, no fog tricks, minimal lighting.

   Everything below is wrapped in try/catch: if anything fails
   (most commonly: WebGL unavailable / hardware acceleration
   disabled), we stop the spinner and print the real reason on
   screen instead of leaving it spinning forever silently.
   ----------------------------------------------------------- */
const overlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const loadingHint = document.getElementById('loading-hint');
const loadingWheel = document.querySelector('.loading-wheel');

function showFatalError(message) {
  if (loadingWheel) loadingWheel.style.display = 'none';
  if (loadingText) {
    loadingText.textContent = 'โหลดแผนที่ 3 มิติไม่สำเร็จ';
    loadingText.style.color = '#B23A3A';
    loadingText.style.fontWeight = '700';
  }
  if (loadingHint) {
    loadingHint.classList.add('show');
    loadingHint.innerHTML = message;
  }
  console.error('[Campus 3D] fatal init error:', message);
}

// quick capability check before touching Three.js at all
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

if (!webglAvailable()) {
  showFatalError(
    'เบราว์เซอร์นี้ไม่สามารถสร้าง WebGL context ได้ — มักเกิดจาก hardware acceleration ถูกปิดอยู่ หรือ GPU/ไดรเวอร์ของเครื่องไม่รองรับ<br><br>' +
    'ลองเช็คที่ <code>chrome://gpu</code> → มองหา "WebGL: Hardware accelerated" หากขึ้นสีแดงว่า Software only หรือ Disabled ให้เปิด hardware acceleration ในหน้า Settings → System แล้วรีสตาร์ทเบราว์เซอร์'
  );
} else {
  try {
    initCampusScene();
  } catch (err) {
    showFatalError('เกิดข้อผิดพลาดขณะสร้างฉาก 3 มิติ: <code>' + (err && err.message ? err.message : err) + '</code>');
  }
}

function initCampusScene() {

const stage = document.getElementById('campus-stage');
const canvas = document.getElementById('campus-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd7e6ee);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
camera.position.set(70, 62, 78); // ~45° isometric-style angle
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
// no shadow map — this is the single biggest GPU cost, and we
// don't need it for a "dumb blocks" look.

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('campus-labels').appendChild(labelRenderer.domElement);

function resize() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  labelRenderer.setSize(w, h);
}
new ResizeObserver(resize).observe(stage);
resize();

/* -----------------------------------------------------------
   3. Controls — rotate / pan / zoom, damping, camera locked
   above ground.
   ----------------------------------------------------------- */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 25;
controls.maxDistance = 150;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.target.set(0, 1, 0);
controls.update();

/* ---- initial camera state, for the "reset view" control ---- */
const INITIAL_CAMERA_POS = camera.position.clone();
const INITIAL_TARGET = controls.target.clone();
function resetView() {
  camera.position.copy(INITIAL_CAMERA_POS);
  controls.target.copy(INITIAL_TARGET);
  controls.update();
}

/* ---- toolbar: reset view + fullscreen (mouse + touch) ---- */
const resetBtn = document.getElementById('campusReset');
if (resetBtn) resetBtn.addEventListener('click', resetView);

const fullscreenBtn = document.getElementById('campusFullscreen');
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      (stage.requestFullscreen || stage.webkitRequestFullscreen || function(){}).call(stage);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function(){}).call(document);
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.querySelector('.icon').textContent = document.fullscreenElement ? '✕' : '⛶';
    fullscreenBtn.querySelector('.label').textContent = document.fullscreenElement ? 'ออกจากเต็มจอ' : 'เต็มจอ';
    resize();
  });
}

// double-tap / double-click on the canvas itself also resets the view —
// a quick, discoverable shortcut once someone has dragged the camera
// far away, especially handy on mobile.
let lastTapTime = 0;
renderer.domElement.addEventListener('pointerup', () => {
  const now = Date.now();
  if (now - lastTapTime < 320) resetView();
  lastTapTime = now;
});

/* -----------------------------------------------------------
   4. Lighting — flat, no shadows
   ----------------------------------------------------------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const sun = new THREE.DirectionalLight(0xfff3d6, 0.6);
sun.position.set(40, 60, 30);
scene.add(sun);

/* -----------------------------------------------------------
   5. Ground
   ----------------------------------------------------------- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(GROUND_W, GROUND_D),
  new THREE.MeshLambertMaterial({ color: 0xbfe0ac })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------------------------------------
   6. Blocks — every single element (buildings, lake, sports
   zone, parking) is just a BoxGeometry mesh with an edge
   outline, positioned from the map's % coordinates.
   ----------------------------------------------------------- */
const raycastTargets = [];

BLOCKS.forEach(b => {
  const { x, z } = toWorld(b.x, b.y);
  const mat = new THREE.MeshLambertMaterial({
    color: categoryColor[b.category] || 0x999999,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
  mesh.position.set(x, b.h / 2, z);
  mesh.userData = { ...b };
  scene.add(mesh);
  raycastTargets.push(mesh);

  // cheap low-poly outline (just line segments, near-zero GPU cost)
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color: 0x1E2A4A, transparent: true, opacity: 0.35 })
  );
  mesh.add(edges);

  // CSS2D label above the block, always facing the camera —
  // only for "major" buildings, otherwise labels overlap and
  // become unreadable once several blocks are close together.
  if (b.major) {
    const div = document.createElement('div');
    div.className = 'building-label major';
    const shortName = b.name.includes('—') ? b.name.split('— ')[1] : b.name;
    div.textContent = `${b.id} · ${shortName}`;
    const label = new CSS2DObject(div);
    label.position.set(0, b.h / 2 + 1.4, 0);
    mesh.add(label);
  }
});

/* -----------------------------------------------------------
   7. Raycaster — hover scale + cursor, click opens info panel
   ----------------------------------------------------------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let selected = null;

const infoPanel = document.getElementById('info-panel');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-desc');
const infoCode = document.getElementById('info-code');
const infoClose = document.getElementById('info-close');

function setPointerFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
}
function pickBlock() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(raycastTargets, false);
  return hits.length ? hits[0].object : null;
}

// simple follow-cursor tooltip — shown for ANY hovered block,
// so minor buildings (no persistent label) are still readable
const hoverTip = document.createElement('div');
hoverTip.className = 'building-label hover-tip';
hoverTip.style.display = 'none';
document.getElementById('campus-labels').appendChild(hoverTip);

renderer.domElement.addEventListener('pointermove', (e) => {
  setPointerFromEvent(e);
  const hit = pickBlock();
  if (hit !== hovered) {
    hovered = hit;
    renderer.domElement.classList.toggle('hover-building', !!hovered);
  }
  if (hovered) {
    const shortName = hovered.userData.name.includes('—')
      ? hovered.userData.name.split('— ')[1]
      : hovered.userData.name;
    hoverTip.textContent = /^[A-Z]$/.test(hovered.userData.id) ? `${hovered.userData.id} · ${shortName}` : shortName;
    const rect = renderer.domElement.getBoundingClientRect();
    hoverTip.style.left = (e.clientX - rect.left) + 'px';
    hoverTip.style.top = (e.clientY - rect.top - 16) + 'px';
    hoverTip.style.display = 'block';
  } else {
    hoverTip.style.display = 'none';
  }
});

function openPanel(block) {
  infoCode.textContent = /^[A-Z]$/.test(block.userData.id) ? `Building ${block.userData.id}` : 'Campus';
  infoTitle.textContent = block.userData.name;
  infoDesc.textContent = block.userData.desc;
  infoPanel.classList.add('open');
  selected = block;
}
function closePanel() {
  infoPanel.classList.remove('open');
  selected = null;
}
infoClose.addEventListener('click', closePanel);

renderer.domElement.addEventListener('click', (e) => {
  setPointerFromEvent(e);
  const hit = pickBlock();
  if (hit) openPanel(hit);
  else closePanel();
});

/* -----------------------------------------------------------
   8. Animate — only a tiny hover-scale lerp runs every frame;
   everything else is static (no continuous heavy work).
   ----------------------------------------------------------- */
function animate() {
  requestAnimationFrame(animate);
  raycastTargets.forEach(mesh => {
    const target = (mesh === hovered || mesh === selected) ? 1.08 : 1.0;
    mesh.scale.x += (target - mesh.scale.x) * 0.15;
    mesh.scale.y += (target - mesh.scale.y) * 0.15;
    mesh.scale.z += (target - mesh.scale.z) * 0.15;
  });
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

/* -----------------------------------------------------------
   9. Reveal once the first frame is ready. If it's taking an
   unusually long time, surface a hint — the most common real
   cause is the browser falling back to software rendering
   (hardware acceleration disabled), not a bug in the scene.
   ----------------------------------------------------------- */
const slowLoadTimer = setTimeout(() => {
  if (loadingHint) loadingHint.classList.add('show');
}, 4000);

requestAnimationFrame(() => {
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  clearTimeout(slowLoadTimer);
  setTimeout(() => overlay.classList.add('hide'), 200);
  animate();
});

} // end initCampusScene()
