// ── Configuration & State ────────────────────────────────────────
let config = {
  ip: localStorage.getItem('espIP') || '',
  port: localStorage.getItem('espPort') || '80',
  path: localStorage.getItem('espPath') || '/data',
  interval: parseInt(localStorage.getItem('espInterval') || '5000')
};

let fetchTimer = null;
let isRunning = false;

// Pre-fill form
document.getElementById('espIP').value       = config.ip;
document.getElementById('espPort').value     = config.port;
document.getElementById('espPath').value     = config.path;
document.getElementById('pollInterval').value = config.interval;


// ── Modal Controls ───────────────────────────────────────────────
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

function saveConfig() {
  config.ip       = document.getElementById('espIP').value.trim();
  config.port     = document.getElementById('espPort').value.trim() || '80';
  config.path     = document.getElementById('espPath').value.trim() || '/data';
  config.interval = parseInt(document.getElementById('pollInterval').value);

  localStorage.setItem('espIP',       config.ip);
  localStorage.setItem('espPort',     config.port);
  localStorage.setItem('espPath',     config.path);
  localStorage.setItem('espInterval', config.interval);

  closeModal();

  if (isRunning) {
    stopFetch();
    startFetch();
  }
}


// ── Fetch Control ────────────────────────────────────────────────
function toggleFetch() {
  isRunning ? stopFetch() : startFetch();
}

function startFetch() {
  if (!config.ip) {
    openModal();
    return;
  }

  isRunning = true;
  document.getElementById('fetchBtn').textContent = '⏹ Stop Feed';
  setConnStatus('connecting', 'Connecting to ESP32...');

  fetchData();
  fetchTimer = setInterval(fetchData, config.interval);
}

function stopFetch() {
  isRunning = false;
  clearInterval(fetchTimer);
  fetchTimer = null;
  document.getElementById('fetchBtn').textContent = '▶ Start Live Feed';
  setConnStatus('disconnected', 'Feed stopped');
}

async function fetchData() {
  const url = `http://${config.ip}:${config.port}${config.path}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    setConnStatus('connected', `Connected — updating every ${config.interval/1000} s`);
    updateSensors(data);
  } catch (err) {
    setConnStatus('disconnected', `Connection failed: ${err.message}`);
  }
}


// ── Helpers ──────────────────────────────────────────────────────
function setConnStatus(state, message) {
  const el = document.getElementById('connStatus');
  el.className = `conn-status ${state}`;
  document.getElementById('connText').textContent = message;
}

function now() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function updateSensors(d) {
  const t = now();

  // NPK
  const N = d.n ?? d.N ?? null;
  const P = d.p ?? d.P ?? null;
  const K = d.k ?? d.K ?? null;

  if (N !== null && P !== null && K !== null) {
    document.getElementById('npk-n').textContent = Math.round(N);
    document.getElementById('npk-p').textContent = Math.round(P);
    document.getElementById('npk-k').textContent = Math.round(K);

    const avg = Math.round((N + P + K) / 3);
    document.getElementById('npk-total').innerHTML = `${avg}<span class="sensor-unit"> mg/kg</span>`;
    document.getElementById('npk-time').textContent = `🕐 ${t}`;

    let cls, txt;
    if (avg > 180)    { cls = 'status-good'; txt = 'Good nutrient levels'; }
    else if (avg > 100) { cls = 'status-warn';  txt = 'Moderate — consider fertilizer'; }
    else              { cls = 'status-bad';   txt = 'Low — fertilizer recommended'; }
    document.getElementById('npk-status').className = `sensor-status ${cls}`;
    document.getElementById('npk-status').textContent = txt;
  }

  // pH
  const ph = d.ph ?? d.pH ?? null;
  if (ph !== null) {
    document.getElementById('ph-val').innerHTML = `${ph.toFixed(1)}<span class="sensor-unit"> pH</span>`;
    document.getElementById('ph-gauge').style.width = `${(ph / 14) * 100}%`;
    document.getElementById('ph-time').textContent = `🕐 ${t}`;

    let cls, txt;
    if (ph >= 6 && ph <= 7.5)       { cls = 'status-good'; txt = 'Ideal range'; }
    else if (ph < 5.5 || ph > 8.0)  { cls = 'status-bad';  txt = ph < 5.5 ? 'Too acidic' : 'Too alkaline'; }
    else                            { cls = 'status-warn'; txt = 'Slightly off — monitor'; }
    document.getElementById('ph-status').className = `sensor-status ${cls}`;
    document.getElementById('ph-status').textContent = txt;
  }

  // Moisture
  const m = d.moisture ?? d.Moisture ?? null;
  if (m !== null) {
    document.getElementById('moist-val').innerHTML = `${Math.round(m)}<span class="sensor-unit">%</span>`;
    document.getElementById('moist-gauge').style.width = `${Math.min(m, 100)}%`;
    document.getElementById('moist-time').textContent = `🕐 ${t}`;

    let cls, txt;
    if (m >= 40 && m <= 70)      { cls = 'status-good'; txt = 'Adequate'; }
    else if (m < 25)             { cls = 'status-bad';  txt = 'Very dry — irrigate'; }
    else if (m < 40)             { cls = 'status-warn'; txt = 'Low — water soon'; }
    else if (m > 85)             { cls = 'status-bad';  txt = 'Waterlogged'; }
    else                         { cls = 'status-warn'; txt = 'High — reduce watering'; }
    document.getElementById('moist-status').className = `sensor-status ${cls}`;
    document.getElementById('moist-status').textContent = txt;
  }

  // Temperature
  const temp = d.temperature ?? d.temp ?? null;
  if (temp !== null) {
    document.getElementById('temp-val').innerHTML = `${temp.toFixed(1)}<span class="sensor-unit">°C</span>`;
    const pct = Math.min(Math.max(((temp - 5) / 45) * 100, 0), 100);
    document.getElementById('temp-gauge').style.width = `${pct}%`;
    document.getElementById('temp-time').textContent = `🕐 ${t}`;

    let cls, txt;
    if (temp >= 15 && temp <= 32)     { cls = 'status-good'; txt = 'Optimal range'; }
    else if (temp < 10 || temp > 38)  { cls = 'status-bad';  txt = temp < 10 ? 'Too cold' : 'Too hot'; }
    else                              { cls = 'status-warn'; txt = 'Suboptimal'; }
    document.getElementById('temp-status').className = `sensor-status ${cls}`;
    document.getElementById('temp-status').textContent = txt;
  }
}

// Auto-open modal hint if never configured
if (!config.ip) {
  setTimeout(() => {
    document.getElementById('connText').textContent =
      'No ESP32 configured yet — click "Configure ESP32" to begin.';
  }, 800);
}