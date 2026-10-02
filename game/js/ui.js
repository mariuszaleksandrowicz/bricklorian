/* BRICKLORIAN
   Created by Mariusz Aleksandrowicz via AI-driven workflows.
   Licensed under the MIT License. */
function update(time = 0) {
  const dt = Math.max(0, Math.min(60, time - lastTime));
  lastTime = time;

  if (clearRows.length) {
    // Line-clear animation in progress: hold the falling piece, end it after CLEAR_MS
    if (!paused && time - clearStart >= CLEAR_MS) finishClearing();
  } else if (!paused && !gameOver) {
    dropCounter += dt;
    if (dropCounter >= dropInterval) {
      dropCounter = 0;
      softDrop();
    }
  }

  // Fragment physics (explosion debris with gravity)
  if (parts.length && !paused) {
    const g = THEMES[themeKey].fx.g;
    for (const p of parts) {
      p.vy += g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    parts = parts.filter(p => time - p.born < p.life);
  }

  if (shake > 0) shake = Math.max(0, shake - dt * 0.025);

  draw(time);
  requestAnimationFrame(update);
}

function reset() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  current = randomPiece();
  next = randomPiece();
  score = 0; lines = 0;
  dropInterval = 1000; dropCounter = 0;
  lastTime = performance.now();
  paused = false; gameOver = false;
  clearRows = []; parts = []; shake = 0; clearLabel = '';
  scoreEl.textContent = '0'; linesEl.textContent = '0';
  gameoverEl.style.display = 'none';
  drawNext();
}

/* ============ THEMES & MENU ============ */
const tcards = [...document.querySelectorAll('.tcard')];
const playBtnEl = document.getElementById('play');
let profilePicked = false; // no profile is pre-selected — PLAY stays locked until one is chosen

function selectTheme(key) {
  if (!THEMES[key]) return;
  themeKey = key;
  document.body.dataset.theme = key;
  tcards.forEach(b => b.classList.toggle('selected', b.dataset.theme === key));
  profilePicked = true;
  playBtnEl.disabled = false;
  applyBg(backgroundDefault(key));
  playTrack(key);
  drawNext();
}
tcards.forEach(b => b.addEventListener('click', () => selectTheme(b.dataset.theme)));

function showMenu() {
  menuEl.classList.add('open');
  paused = true;
}
function startGame() {
  if (!profilePicked) return; // PLAY is locked until a profile is chosen
  menuEl.classList.remove('open');
  reset();
  playTrack(themeKey);
  // Drop focus so Space/Enter can't "re-click" the button that started the game
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}
playBtnEl.addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', showMenu);

/* background mode: static / animated (classic is always static) */
const segBtns = [...document.querySelectorAll('.seg')];
let bgMode = 'static';
/* Default per profile: every theme that HAS an animated background starts with it ON */
function backgroundDefault(key) { return key === 'classic' ? 'static' : 'anim'; }
function applyBg(mode) {
  if (themeKey === 'classic' && mode === 'anim') mode = 'static';
  bgMode = mode;
  document.body.classList.toggle('bg-anim', mode === 'anim');
  segBtns.forEach(b => b.classList.toggle('active', b.dataset.bg === mode));
  if (themeKey === 'neon' && mode === 'anim') startNeonFlicker(); else stopNeonFlicker();
}
segBtns.forEach(b => b.addEventListener('click', () => {
  if (themeKey === 'classic' && b.dataset.bg === 'anim') return;
  applyBg(b.dataset.bg);
}));

/* ============ NEON CITY — random window lights ============
   Rules: each building shows a RANDOM number of lit windows from 1 to 5
   (inclusive) — re-rolled independently per building: sometimes 1, sometimes
   4, sometimes 2 — and no 3 lit in a row (vertical or horizontal).
   Active only while the ANIMATED neon background is enabled. */
const NWIN = { pitchX: 16, pitchY: 12, mx: 6, my: 10, min: 1, max: 5, timer: null, B: [] };
function nwinLit(B) {
  let n = 0;
  for (let r = 0; r < B.R; r++) for (let c = 0; c < B.C; c++) if (B.grid[r][c].lit) n++;
  return n;
}
function nwinFits(B, r, c) {
  const { grid, R, C } = B;
  if (grid[r][c].lit) return false;
  let l = 0; while (c - 1 - l >= 0 && grid[r][c - 1 - l].lit) l++;
  let rt = 0; while (c + 1 + rt < C && grid[r][c + 1 + rt].lit) rt++;
  if (l + rt >= 2) return false; // would make 3 in a horizontal row
  let u = 0; while (r - 1 - u >= 0 && grid[r - 1 - u][c].lit) u++;
  let d = 0; while (r + 1 + d < R && grid[r + 1 + d][c].lit) d++;
  if (u + d >= 2) return false; // would make 3 in a vertical column
  return true;
}
function nwinLightRandom(B, n) {
  let tries = 0;
  while (n > 0 && tries < 600) {
    tries++;
    const r = (Math.random() * B.R) | 0, c = (Math.random() * B.C) | 0;
    if (!nwinFits(B, r, c)) continue;
    B.grid[r][c].lit = true;
    B.grid[r][c].el.classList.add('lit');
    n--;
  }
}
function nwinUnlightRandom(B, n) {
  const lit = [];
  for (let r = 0; r < B.R; r++) for (let c = 0; c < B.C; c++) if (B.grid[r][c].lit) lit.push(B.grid[r][c]);
  for (let i = 0; i < n && lit.length; i++) {
    const cell = lit[(Math.random() * lit.length) | 0];
    cell.lit = false;
    cell.el.classList.remove('lit');
    lit.splice(lit.indexOf(cell), 1);
  }
}
/* Move a building toward its target count (light some on, or switch some off). */
function nwinSetCount(B, target) {
  const cur = nwinLit(B);
  if (target > cur) nwinLightRandom(B, target - cur);
  else if (target < cur) nwinUnlightRandom(B, cur - target);
}
function nwinRandomTarget() {
  return NWIN.min + ((Math.random() * (NWIN.max - NWIN.min + 1)) | 0); // 1..5 inclusive
}
function nwinInit() {
  if (NWIN.B.length) return;
  document.querySelectorAll('.sc-neon .nbdg').forEach(el => {
    const w = parseInt(el.style.width, 10) || 60;
    const h = parseInt(el.style.height, 10) || 100;
    const C = Math.max(1, Math.floor((w - NWIN.mx - 4) / NWIN.pitchX) + 1);
    const R = Math.max(2, Math.floor((h - NWIN.my - 3) / NWIN.pitchY) + 1);
    const grid = [];
    for (let r = 0; r < R; r++) {
      const row = [];
      for (let c = 0; c < C; c++) {
        const cell = document.createElement('i');
        cell.className = 'nwin';
        cell.style.left = (NWIN.mx + c * NWIN.pitchX) + 'px';
        cell.style.top = (NWIN.my + r * NWIN.pitchY) + 'px';
        el.appendChild(cell);
        row.push({ el: cell, lit: false });
      }
      grid.push(row);
    }
    const B = { R, C, grid };
    NWIN.B.push(B);
    nwinSetCount(B, nwinRandomTarget()); // each building starts with its own random count (1..5)
  });
}
function nwinTick() {
  // Every building decides for itself — on roughly half of the ticks it
  // re-rolls its own random count (1..5), so the city shimmers building by
  // building instead of stepping all lights up/down in lockstep.
  for (const B of NWIN.B) {
    if (Math.random() < 0.5) nwinSetCount(B, nwinRandomTarget());
  }
}
function startNeonFlicker() {
  if (NWIN.timer) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  nwinInit();
  NWIN.timer = setInterval(nwinTick, 750);
}
function stopNeonFlicker() {
  if (NWIN.timer) { clearInterval(NWIN.timer); NWIN.timer = null; }
}
