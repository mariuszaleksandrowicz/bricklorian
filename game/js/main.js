/* BRICKLORIAN
   Created by Mariusz Aleksandrowicz via AI-driven workflows.
   Licensed under the MIT License. */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (menuEl.classList.contains('open')) startGame(); else showMenu();
    e.preventDefault();
    return;
  }
  if ((e.key === 'c' || e.key === 'C') && gameOver) {
    try { localStorage.setItem('bcx-go', JSON.stringify({ s: score, l: lines, t: Date.now() })); } catch (e2) {}
    location.href = 'credits.html'; return;
  }
  if (menuEl.classList.contains('open')) return;
  if (e.key === 'r' || e.key === 'R') { reset(); playTrack(themeKey); return; }
  if (e.key === 'p' || e.key === 'P') { paused = !paused; return; }
  if (gameOver) {
    // Game over: only R and C answer — Space/Enter must not (re-)activate any focused button
    if (e.key === ' ' || e.key === 'Enter') {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      e.preventDefault();
    }
    return;
  }
  if (clearRows.length) return; // line-clear animation in progress
  if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { softDrop(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { rotate(); e.preventDefault(); }
  else if (e.key === ' ') { hardDrop(); e.preventDefault(); }
});

reset();
applyBg('static');
applyLang(lang);
update();

/* Returning from credits: if the browser RELOADED this page (playing audio
   blocks bfcache), restore the game-over screen with the final score */
let restored = false;
try {
  const g = JSON.parse(localStorage.getItem('bcx-go') || 'null');
  if (g && typeof g.s === 'number') {
    if (Date.now() - (g.t || 0) < 10 * 60 * 1000) {
      gameOver = true;
      score = g.s; lines = g.l || 0;
      scoreEl.textContent = String(g.s);
      linesEl.textContent = String(g.l || 0);
      gameoverEl.style.display = 'flex';
      selectTheme('classic'); // the restored session is the Classic profile — unlock PLAY & R
      playTrack('gameover');
      restored = true;
    }
    localStorage.removeItem('bcx-go');
  }
} catch (e) {}

/* Fresh start: menu with the profile picker.
   No profile is pre-selected and PLAY stays locked until one is chosen. */
if (!restored) {
  playTrack('menu');
  showMenu();
}

/* If the page came back from bfcache (state preserved), drop any stale restore marker */
window.addEventListener('pageshow', e => {
  if (e.persisted) { try { localStorage.removeItem('bcx-go'); } catch (e2) {} }
});
