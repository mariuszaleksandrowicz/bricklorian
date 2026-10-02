/* BRICKLORIAN
   Created by Mariusz Aleksandrowicz via AI-driven workflows.
   Licensed under the MIT License. */
function drawCell(context, x, y, size, color) {
  context.fillStyle = color;
  context.fillRect(x * size, y * size, size, size);
  context.strokeStyle = 'rgba(255,255,255,.25)';
  context.strokeRect(x * size, y * size, size, size);
}

function draw(time = performance.now()) {
  const cols = colorsOf();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (shake > .4) {
    ctx.translate((Math.random() - .5) * shake * 2, (Math.random() - .5) * shake * 2);
  }
  // grid lines
  ctx.strokeStyle = THEMES[themeKey].grid;
  for (let x = 1; x < COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * SIZE, 0); ctx.lineTo(x * SIZE, ROWS * SIZE); ctx.stroke();
  }
  for (let y = 1; y < ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * SIZE); ctx.lineTo(COLS * SIZE, y * SIZE); ctx.stroke();
  }
  // fixed blocks
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (grid[y][x] !== null) drawCell(ctx, x, y, SIZE, cols[grid[y][x]]);
  // ghost
  const ghost = { ...current, cells: current.cells.map(c => [...c]) };
  while (!collides(ghost, 0, 1)) ghost.y++;
  ctx.globalAlpha = 0.3;
  for (const [cx, cy] of ghost.cells) {
    const y = ghost.y + cy;
    if (y >= 0) drawCell(ctx, ghost.x + cx, y, SIZE, cols[current.ci]);
  }
  ctx.globalAlpha = 1;
  // current piece
  for (const [cx, cy] of current.cells) {
    const y = current.y + cy;
    if (y >= 0) drawCell(ctx, current.x + cx, y, SIZE, cols[current.ci]);
  }
  // themed line-clear effects
  drawLineFX(time);
  ctx.restore();
}

function drawLineFX(time) {
  if (!clearRows.length && !parts.length) return;
  const fx = THEMES[themeKey].fx;

  if (clearRows.length) {
    const t = time - clearStart;
    // themed flash over the crumbling rows
    const a = Math.max(0, 1 - t / fx.fade);
    if (a > 0) {
      const ci = fx.cycle ? Math.floor(t / fx.cycle) % fx.flash.length : 0;
      const flick = fx.flicker > 0
        ? (1 - fx.flicker + fx.flicker * (0.5 + 0.5 * Math.sin(t / 20))) : 1;
      ctx.globalAlpha = a * .9 * flick;
      ctx.fillStyle = fx.flash[ci];
      for (const y of clearRows) ctx.fillRect(0, y * SIZE, COLS * SIZE, SIZE);
      ctx.globalAlpha = 1;
    }
    // signature effect of the theme
    if (fx.extra === 'glitch') glitchFX(t);
    else if (fx.extra === 'ring') ringFX(t);
    else if (fx.extra === 'beam') beamFX(t);
    // label popup
    ctx.globalAlpha = Math.max(0, 1 - t / CLEAR_MS);
    ctx.fillStyle = clearRows.length >= 4 ? '#ffd700' : '#fff';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(clearLabel, COLS * SIZE / 2,
      Math.max(24, Math.min(...clearRows) * SIZE - 10));
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
  }

  // themed particles
  for (const p of parts) {
    const a = Math.max(0, 1 - (time - p.born) / p.life);
    if (a <= 0) continue;
    const col = colorsOf()[p.ci];
    ctx.save();
    ctx.translate(p.x, p.y);
    if (fx.type === 'debris') {
      // classic: tumbling blocks
      ctx.rotate(p.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = col;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    } else if (fx.type === 'streak') {
      // neon: glowing light streaks
      ctx.rotate(p.rot);
      ctx.globalAlpha = a;
      ctx.shadowColor = col;
      ctx.shadowBlur = 9;
      ctx.fillStyle = col;
      ctx.fillRect(-1.5, -p.size, 3, p.size * 2);
    } else if (fx.type === 'ember') {
      // rune: flickering fire embers rising
      ctx.globalAlpha = a * (.7 + .3 * Math.sin(time / 28 + p.seed * 9));
      ctx.shadowColor = '#ffb347';
      ctx.shadowBlur = 10;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
    } else {
      // space: four-point star sparks
      ctx.rotate(p.rot);
      ctx.globalAlpha = a;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#bfe9ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0); ctx.lineTo(p.size, 0);
      ctx.moveTo(0, -p.size); ctx.lineTo(0, p.size);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// NEON CITY: offset horizontal slices of the row + glitch lines
function glitchFX(t) {
  if (t > 380) return;
  const W = COLS * SIZE;
  for (const y of clearRows) {
    for (let i = 0; i < 3; i++) {
      const sh = 5 + Math.random() * 9;
      const y0 = y * SIZE + Math.random() * Math.max(0, SIZE - sh);
      const off = (Math.random() - .5) * 16 * (1 + t / 90);
      ctx.drawImage(canvas, 0, y0, W, sh, off, y0, W, sh);
    }
    if (Math.random() < .5) {
      ctx.fillStyle = Math.random() < .5 ? 'rgba(0,248,255,.6)' : 'rgba(255,47,214,.6)';
      ctx.fillRect(0, y * SIZE + Math.random() * SIZE, W, 2);
    }
  }
}

// RUNE REALM: expanding magic rings over the rows
function ringFX(t) {
  const p = Math.min(1, t / CLEAR_MS);
  for (const y of clearRows) {
    const cx = COLS * SIZE / 2, cy = (y + .5) * SIZE;
    const r = 24 + p * 150;
    ctx.strokeStyle = '#ffcf7a';
    ctx.lineWidth = 3;
    ctx.globalAlpha = (1 - p) * .65;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.globalAlpha = (1 - p) * .35;
    ctx.beginPath(); ctx.arc(cx, cy, r * .62, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// STAR DRIFT: energy beam sweeping across the cleared rows
function beamFX(t) {
  if (t > 300) return;
  const W = COLS * SIZE;
  const x = (t / 300) * (W + 140) - 70;
  const g = ctx.createLinearGradient(x - 60, 0, x + 60, 0);
  g.addColorStop(0, 'rgba(200,168,232,0)');
  g.addColorStop(.5, 'rgba(255,255,255,.85)');
  g.addColorStop(1, 'rgba(200,168,232,0)');
  ctx.fillStyle = g;
  for (const y of clearRows) ctx.fillRect(x - 60, y * SIZE, 120, SIZE);
}

function drawNext() {
  nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const w = Math.max(...next.cells.map(c => c[0])) + 1;
  const h = Math.max(...next.cells.map(c => c[1])) + 1;
  const offX = Math.floor((nextCanvas.width - w * 20) / 2);
  const offY = Math.floor((nextCanvas.height - h * 20) / 2);
  for (const [cx, cy] of next.cells) {
    nctx.fillStyle = colorsOf()[next.ci];
    nctx.fillRect(offX + cx * 20, offY + cy * 20, 20, 20);
    nctx.strokeStyle = 'rgba(255,255,255,.25)';
    nctx.strokeRect(offX + cx * 20, offY + cy * 20, 20, 20);
  }
}
