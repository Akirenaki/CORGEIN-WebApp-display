/* =============================================
   LOGO INJECTION
   ============================================= */
function injectLogo(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="corgein-logo">
      <div class="wordmark"><span class="cor">COR</span><span class="gein">GEIN</span></div>
      <div class="tagline"><span class="cor">COR</span>ONA DISCHAR<span class="gein">GE IN</span>CINERATOR</div>
    </div>`;
}

injectLogo('launch-logo');
injectLogo('boot-logo');
injectLogo('shutdown-logo');
injectLogo('nav-logo');

/* =============================================
   SCREEN MANAGEMENT
   ============================================= */
let currentOverlayScreen = 'screen-launch';
let currentAppScreen = 'screen-option';

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active', 'fade-out');
    s.style.pointerEvents = 'none';
  });
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    el.style.pointerEvents = 'all';
  }
  currentOverlayScreen = id;
}

function hideOverlays() {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.pointerEvents = 'none';
  });
}

function showAppScreen(id) {
  document.querySelectorAll('.app-screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'block';
    setTimeout(() => el.classList.add('active'), 10);
  }
  currentAppScreen = id;

  // Sync nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.screen === id);
  });
}

/* =============================================
   DATA MODEL
   ============================================= */
// PM2.5 raw range: 80–350 µg/m³ (post-burn, unfiltered)
// CO raw range: 30–150 ppm (post-burn, unfiltered)
// ESP efficiency for PM2.5: 85–99%
// ESP efficiency for CO: 40–75% (CO less efficiently removed by ESP)

const DATA = {
  unfPm25: 0,
  unfCo: 0,
  filtPm25: 0,
  filtCo: 0,
  effPm25: 0,
  effCo: 0,
  history: {
    unfPm25: [], unfCo: [],
    filtPm25: [], filtCo: []
  }
};

const HISTORY_LEN = 20;

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function generateData() {
  const pm = randBetween(80, 350);
  const co = randBetween(30, 150);
  const effPm = randBetween(85, 99);
  const effCo = randBetween(40, 75);
  const filtPm = pm * (1 - effPm / 100);
  const filtCo = co * (1 - effCo / 100);

  DATA.unfPm25 = pm;
  DATA.unfCo = co;
  DATA.filtPm25 = filtPm;
  DATA.filtCo = filtCo;
  DATA.effPm25 = effPm;
  DATA.effCo = effCo;

  // Push to history
  const push = (arr, val) => { arr.push(val); if (arr.length > HISTORY_LEN) arr.shift(); };
  push(DATA.history.unfPm25, pm);
  push(DATA.history.unfCo, co);
  push(DATA.history.filtPm25, filtPm);
  push(DATA.history.filtCo, filtCo);
}

/* =============================================
   RISK ASSESSMENT
   ============================================= */
function assessPm25(val) {
  // WHO: >15 µg/m³ concern; >55 unhealthy; >150 very unhealthy
  // We're dealing with high-concentration burn environment
  if (val < 35) {
    return { level: 'aman', title: 'Aman', desc: 'Konsentrasi PM2.5 dalam batas aman. Tidak ada risiko kesehatan jangka pendek yang signifikan.', effects: ['Tidak ada keluhan'], efftags: ['green'] };
  } else if (val < 150) {
    return { level: 'waspada', title: 'Waspada — PM2.5', desc: 'Konsentrasi PM2.5 di atas batas aman. Paparan berkelanjutan dapat menyebabkan iritasi saluran pernapasan dan gangguan ringan.', effects: ['Iritasi tenggorokan', 'Batuk ringan', 'Mata perih', 'Kulit kering'], efftags: ['amber','amber','amber','amber'] };
  } else {
    return { level: 'bahaya', title: 'BAHAYA — PM2.5', desc: 'Konsentrasi PM2.5 sangat tinggi. Paparan terhadap level ini menyebabkan kerusakan paru-paru permanen dan meningkatkan risiko kanker serta penyakit jantung.', effects: ['Kerusakan paru permanen', 'Risiko kanker paru', 'Gagal jantung', 'Kematian dini'], efftags: ['red','red','red','red'] };
  }
}

function assessCo(val) {
  // OSHA: 50 ppm TWA; 200 ppm immediately dangerous; >400 lethal
  if (val < 35) {
    return { level: 'aman', title: 'Aman', desc: 'Konsentrasi CO dalam batas aman. Tidak ada risiko keracunan.', effects: ['Tidak ada keluhan'], efftags: ['green'] };
  } else if (val < 100) {
    return { level: 'waspada', title: 'Waspada — CO', desc: 'Konsentrasi CO di atas ambang aman. Paparan sedang dapat menyebabkan gejala ringan hingga sedang pada individu sensitif.', effects: ['Pusing', 'Sakit kepala', 'Mual', 'Kelelahan'], efftags: ['amber','amber','amber','amber'] };
  } else {
    return { level: 'bahaya', title: 'BAHAYA — CO', desc: 'Konsentrasi CO sangat berbahaya. CO mengikat hemoglobin 240× lebih kuat dari oksigen, menyebabkan hipoksia berat yang dapat berakibat fatal.', effects: ['Keracunan akut', 'Gagal jantung', 'Koma', 'Kematian'], efftags: ['red','red','red','red'] };
  }
}

function renderRiskCard(el, assessment, forLabel) {
  const tagHtml = assessment.effects.map((e, i) =>
    `<span class="risk-effect-tag ${assessment.efftags[i]}">${e}</span>`
  ).join('');
  el.className = `risk-card ${assessment.level}`;
  el.innerHTML = `
    <div class="risk-header">
      <span class="risk-badge ${assessment.level}">${assessment.level === 'bahaya' ? '⚠ ' : assessment.level === 'waspada' ? '⚡ ' : '✓ '}${assessment.level.toUpperCase()}</span>
      <span class="risk-for">Penilaian ${forLabel}</span>
    </div>
    <div class="risk-title">${assessment.title}</div>
    <div class="risk-desc">${assessment.desc}</div>
    <div class="risk-effects">${tagHtml}</div>
  `;
}

/* =============================================
   SPARKLINE CHARTS
   ============================================= */
const sparklines = {};

function initSparkline(canvasId, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width = canvas.offsetWidth || 300;
  canvas.height = 44;
  sparklines[canvasId] = { canvas, color, data: [] };
}

function drawSparkline(id, data) {
  const s = sparklines[id];
  if (!s || !s.canvas) return;
  const canvas = s.canvas;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 300;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (data.length < 2) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 8) - 4
  }));

  // Fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, s.color + '33');
  grad.addColorStop(1, s.color + '00');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, h);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length-1].x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = s.color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* =============================================
   UPDATE UI
   ============================================= */
function fmt1(v) { return v.toFixed(1); }
function fmt0(v) { return Math.round(v).toString(); }
function ts() {
  const d = new Date();
  return [d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,'0')).join(':');
}

function flashCard(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('updating');
  void el.offsetWidth;
  el.classList.add('updating');
  setTimeout(() => el.classList.remove('updating'), 500);
}

function updateAllUI() {
  const now = ts();

  // Unfiltered screen
  document.getElementById('unf-pm25-val').textContent = fmt1(DATA.unfPm25);
  document.getElementById('unf-co-val').textContent   = fmt1(DATA.unfCo);
  document.getElementById('ts-unfiltered').textContent = now;
  flashCard('unf-pm25-card'); flashCard('unf-co-card');

  // Risk assessments
  renderRiskCard(document.getElementById('risk-pm25'), assessPm25(DATA.unfPm25), 'PM2.5');
  renderRiskCard(document.getElementById('risk-co'),   assessCo(DATA.unfCo), 'CO');

  // Filtered screen
  document.getElementById('filt-pm25-val').textContent = fmt1(DATA.filtPm25);
  document.getElementById('filt-co-val').textContent   = fmt1(DATA.filtCo);
  document.getElementById('ts-filtered').textContent   = now;
  document.getElementById('eff-pm25-val').textContent  = fmt0(DATA.effPm25);
  document.getElementById('eff-co-val').textContent    = fmt0(DATA.effCo);
  document.getElementById('eff-pm25-bar').style.width  = DATA.effPm25 + '%';
  document.getElementById('eff-co-bar').style.width    = DATA.effCo + '%';
  document.getElementById('eff-pm25-before').textContent = fmt1(DATA.unfPm25);
  document.getElementById('eff-pm25-after').textContent  = fmt1(DATA.filtPm25);
  document.getElementById('eff-co-before').textContent   = fmt1(DATA.unfCo);
  document.getElementById('eff-co-after').textContent    = fmt1(DATA.filtCo);
  flashCard('filt-pm25-card'); flashCard('filt-co-card');

  // Side-by-side screen
  document.getElementById('side-unf-pm25-val').textContent = fmt1(DATA.unfPm25);
  document.getElementById('side-unf-co-val').textContent   = fmt1(DATA.unfCo);
  document.getElementById('side-filt-pm25-val').textContent= fmt1(DATA.filtPm25);
  document.getElementById('side-filt-co-val').textContent  = fmt1(DATA.filtCo);
  document.getElementById('side-eff-pm25').textContent     = fmt0(DATA.effPm25);
  document.getElementById('side-eff-co').textContent       = fmt0(DATA.effCo);
  document.getElementById('side-eff-pm25-bar').style.width = DATA.effPm25 + '%';
  document.getElementById('side-eff-co-bar').style.width   = DATA.effCo + '%';
  document.getElementById('ts-side').textContent           = now;
  renderRiskCard(document.getElementById('side-risk-pm25'), assessPm25(DATA.unfPm25), 'PM2.5');
  renderRiskCard(document.getElementById('side-risk-co'),   assessCo(DATA.unfCo), 'CO');
  flashCard('side-unf-pm25-card'); flashCard('side-unf-co-card');
  flashCard('side-filt-pm25-card'); flashCard('side-filt-co-card');

  // Draw sparklines
  drawSparkline('spark-unf-pm25',     DATA.history.unfPm25);
  drawSparkline('spark-unf-co',       DATA.history.unfCo);
  drawSparkline('spark-filt-pm25',    DATA.history.filtPm25);
  drawSparkline('spark-filt-co',      DATA.history.filtCo);
  drawSparkline('spark-side-unf-pm25',DATA.history.unfPm25);
  drawSparkline('spark-side-unf-co',  DATA.history.unfCo);
  drawSparkline('spark-side-filt-pm25',DATA.history.filtPm25);
  drawSparkline('spark-side-filt-co', DATA.history.filtCo);
}

/* =============================================
   BOOT SEQUENCE
   ============================================= */
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function randInterval(min, max) { return min + Math.random() * (max - min); }

async function animateText(elId, baseText, durationMs) {
  const el = document.getElementById(elId);
  const barEl = elId === 'boot-text' ? document.getElementById('boot-bar') : document.getElementById('shutdown-bar');
  const dots = ['.', '..', '...'];
  const tick = durationMs / 3;
  let elapsed = 0;
  let dotIdx = 0;
  const startProgress = parseFloat(barEl?.style.width) || 0;
  return new Promise(resolve => {
    const interval = setInterval(() => {
      elapsed += 200;
      dotIdx = Math.min(Math.floor(elapsed / tick), 2);
      if (el) el.textContent = baseText + dots[dotIdx];
      if (barEl) {
        const prog = startProgress + (elapsed / durationMs) * 33;
        barEl.style.width = Math.min(prog, 100) + '%';
      }
      if (elapsed >= durationMs) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
}

async function runBoot() {
  showScreen('screen-boot');
  document.getElementById('boot-bar').style.width = '0%';

  const d1 = randInterval(2000, 5000);
  const d2 = randInterval(2000, 5000);
  const d3 = randInterval(2000, 5000);

  await animateText('boot-text', 'Booting', d1);
  await sleep(200);
  await animateText('boot-text', 'Menghubungkan dengan Sensor', d2);
  await sleep(200);
  await animateText('boot-text', 'Menganalisis Data', d3);
  document.getElementById('boot-bar').style.width = '100%';
  await sleep(300);

  // Show logo moment
  document.getElementById('boot-text').textContent = '';
  await sleep(1000);

  // Enter app
  bootIntoApp();
}

function bootIntoApp() {
  hideOverlays();
  document.getElementById('navbar').classList.add('visible');

  // Make all app screens visible (hidden by CSS, not display:none)
  document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'block');

  showAppScreen('screen-option');

  // Init sparklines
  setTimeout(() => {
    initSparkline('spark-unf-pm25',     '#00c2a8');
    initSparkline('spark-unf-co',       '#f59e0b');
    initSparkline('spark-filt-pm25',    '#00c2a8');
    initSparkline('spark-filt-co',      '#f59e0b');
    initSparkline('spark-side-unf-pm25','#00c2a8');
    initSparkline('spark-side-unf-co',  '#f59e0b');
    initSparkline('spark-side-filt-pm25','#00c2a8');
    initSparkline('spark-side-filt-co', '#f59e0b');

    // Initial data
    generateData();
    updateAllUI();

    // Start simulation loop
    setInterval(() => {
      generateData();
      updateAllUI();
    }, 5000);
  }, 400);
}

/* =============================================
   SHUTDOWN SEQUENCE
   ============================================= */
let isShuttingDown = false;

async function runShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // Hide navbar & app screens
  document.getElementById('navbar').classList.remove('visible');
  document.querySelectorAll('.app-screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  showScreen('screen-shutdown');
  document.getElementById('shutdown-bar').style.width = '0%';

  const d1 = randInterval(2000, 5000);
  const d2 = randInterval(2000, 5000);

  await animateText('shutdown-text', 'Membersihkan Sesi', d1);
  await sleep(200);
  await animateText('shutdown-text', 'Mematikan Sistem', d2);
  document.getElementById('shutdown-bar').style.width = '100%';
  await sleep(300);

  // Show logo
  document.getElementById('shutdown-text').textContent = '';
  await sleep(1000);

  // Black screen
  showScreen('screen-black');
}

/* =============================================
   NAV TABS
   ============================================= */
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    showAppScreen(tab.dataset.screen);
  });
});

/* =============================================
   OPTION CARD SHORTCUTS
   ============================================= */
document.getElementById('opt-unfiltered').addEventListener('click', () => {
  showAppScreen('screen-unfiltered');
});
document.getElementById('opt-filtered').addEventListener('click', () => {
  showAppScreen('screen-filtered');
});
['opt-unfiltered','opt-filtered'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
  });
});

/* =============================================
   EVENT LISTENERS
   ============================================= */
document.getElementById('btn-start').addEventListener('click', runBoot);
document.getElementById('btn-shutdown').addEventListener('click', runShutdown);

// Also handle window resize for sparklines
window.addEventListener('resize', () => {
  Object.keys(sparklines).forEach(id => {
    const s = sparklines[id];
    if (s && s.canvas) {
      s.canvas.width = s.canvas.offsetWidth || 300;
    }
  });
});