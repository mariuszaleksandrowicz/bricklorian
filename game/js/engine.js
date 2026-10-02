/* BRICKLORIAN
   Created by Mariusz Aleksandrowicz via AI-driven workflows.
   Licensed under the MIT License. */
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const gameoverEl = document.getElementById('gameover');
const menuEl = document.getElementById('menu');

let grid, current, next, score, lines, dropInterval, dropCounter, lastTime, paused, gameOver;
const CLEAR_MS = 550;
let clearRows = [], clearStart = 0, clearLabel = '', parts = [], shake = 0;

function randomPiece() {
  const i = Math.floor(Math.random() * SHAPES.length);
  return {
    cells: SHAPES[i].cells.map(c => [...c]),
    ci: i,
    x: Math.floor((COLS - 4) / 2),
    y: -1,
  };
}

function collides(piece, dx = 0, dy = 0) {
  for (const [cx, cy] of piece.cells) {
    const x = piece.x + cx + dx;
    const y = piece.y + cy + dy;
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y >= 0 && grid[y][x] !== null) return true;
  }
  return false;
}

function endGame() {
  gameOver = true;
  gameoverEl.style.display = 'flex';
  playTrack('gameover');
  // Game over: only R and C may answer — no button may keep focus
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

function merge() {
  let topOut = false;
  for (const [cx, cy] of current.cells) {
    const y = current.y + cy;
    if (y < 0) { topOut = true; continue; }
    grid[y][current.x + cx] = current.ci;
  }
  if (topOut) endGame();
}

function spawnFragments(rows, now) {
  const fx = THEMES[themeKey].fx;
  for (const y of rows) {
    for (let x = 0; x < COLS; x++) {
      const ci = grid[y][x];
      const cx = (x + .5) * SIZE, cy = (y + .5) * SIZE;
      for (let i = 0; i < fx.count; i++) {
        let vx, vy;
        if (fx.type === 'spark') {
          // radial burst
          const ang = Math.random() * Math.PI * 2;
          const sp = .06 + Math.random() * .3;
          vx = Math.cos(ang) * sp;
          vy = Math.sin(ang) * sp - .04;
        } else {
          vx = (Math.random() - .5) * fx.side;
          vy = -(fx.up[0] + Math.random() * (fx.up[1] - fx.up[0]));
        }
        parts.push({
          x: cx + (Math.random() - .5) * SIZE,
          y: cy + (Math.random() - .5) * SIZE,
          vx, vy,
          size: fx.size[0] + Math.random() * (fx.size[1] - fx.size[0]),
          rot: Math.random() * Math.PI,
          vr: (Math.random() - .5) * (fx.type === 'ember' ? .004 : .015),
          ci,
          seed: Math.random() * 10,
          born: now,
          life: fx.life[0] + Math.random() * (fx.life[1] - fx.life[0]),
        });
      }
    }
  }
}

// Detects full rows, starts the crumble/explosion animation. Returns true if it started.
function startClearing(now) {
  const rows = [];
  for (let y = 0; y < ROWS; y++) if (grid[y].every(c => c !== null)) rows.push(y);
  if (!rows.length) return false;
  clearRows = rows;
  clearStart = now;
  const dic = L10N[lang] || L10N.en;
  clearLabel = ({ 4: 'BRICKLORIAN!', 3: dic.triple, 2: dic.double }[rows.length]) || dic.cleared;
  shake = 3 + rows.length * 2;
  spawnFragments(rows, now);
  if (typeof playClearSFX === 'function') playClearSFX(themeKey, rows.length); // 8-bit chiptune jingle (sfx.js)
  score += rows.length * rows.length; // 1 line=1, 2=4, 3=9, 4 (full clear)=16
  lines += rows.length;
  dropInterval = Math.max(100, 1000 - Math.floor(lines / 10) * 100); // co 10 linii = 1 poziom, −100 ms; limit 100 ms
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  return true;
}

// Called when the animation finishes: collapse rows and spawn the next piece
function finishClearing() {
  const rows = [...clearRows].sort((a, b) => a - b);
  for (const y of rows) {
    grid.splice(y, 1);
    grid.unshift(Array(COLS).fill(null));
  }
  clearRows = [];
  spawnNext();
}

function spawnNext() {
  current = next;
  next = randomPiece();
  if (collides(current)) endGame();
  drawNext();
  dropCounter = 0;
}

function rotate() {
  if (SHAPES[current.ci].name === 'O') return;
  // Rotate 90 deg clockwise: in the piece's bounding box (x,y) -> (h - y, x)
  const xs = current.cells.map(c => c[0]);
  const ys = current.cells.map(c => c[1]);
  const xMin = Math.min(...xs), yMin = Math.min(...ys);
  const h = Math.max(...ys) - yMin;
  const rotated = current.cells.map(([x, y]) => [h - (y - yMin), x - xMin]);
  // Remember original state (in case no kick position fits)
  const origCells = current.cells.map(c => [...c]);
  const origX = current.x;
  current.cells = rotated;
  // Wall kicks: test every shift against the ROTATED shape
  for (const k of [0, -1, 1, -2, 2]) {
    if (!collides(current, k, 0)) { current.x += k; return; }
  }
  // No valid position: revert
  current.cells = origCells;
  current.x = origX;
}

function move(dx) {
  if (!collides(current, dx, 0)) current.x += dx;
}

function softDrop() {
  if (!collides(current, 0, 1)) current.y++;
  else lock();
}

function hardDrop() {
  while (!collides(current, 0, 1)) current.y++;
  lock();
}

function lock() {
  merge();
  // If a line cleared, play the animation; otherwise spawn the next piece right away
  if (!startClearing(performance.now())) spawnNext();
}
