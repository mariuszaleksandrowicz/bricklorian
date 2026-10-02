/* BRICKLORIAN
   Created by Mariusz Aleksandrowicz via AI-driven workflows.
   Licensed under the MIT License. */
const TRACKS = {
  menu:     'Briclorian_Theme',
  gameover: 'Beyond_the_Stellar_Rim',
  classic:  'The_Last_Quarter',
  neon:     'Hardwired_Pursuit',
  rune:     'Beneath_the_Crowned_Stone',
  space:    'Beyond_The_Last_Horizon',
};

const music = new Audio();
music.loop = true;
music.volume = 0.6;
music.preload = 'auto';
let currentTrack = null;
let musicStarted = false;

function playTrack(key) {
  const name = TRACKS[key];
  if (!name || currentTrack === key) return;
  currentTrack = key;
  music.src = '../music/' + name + '.mp3';
  music.play().catch(() => {}); // starts if allowed; otherwise the first click/key does it
}

/* Browsers block autoplay with sound — start on the first user interaction */
function musicResume() {
  if (musicStarted) return;
  musicStarted = true;
  music.play().catch(() => {});
  window.removeEventListener('pointerdown', musicResume);
  window.removeEventListener('keydown', musicResume);
}
window.addEventListener('pointerdown', musicResume);
window.addEventListener('keydown', musicResume);

/* Handoff from the title page: resume Briclorian_Theme at the saved position,
   so the music does not restart from 0:00 when entering the profile selection */
(function () {
  let t = 0;
  try {
    const h = localStorage.getItem('bcx-handoff');
    if (!h) return;
    const j = JSON.parse(h);
    if (typeof j.t !== 'number' || !isFinite(j.t)) return;
    t = j.t;
  } catch (e) { return; }
  try { localStorage.removeItem('bcx-handoff'); } catch (e) {}
  if (music.readyState >= 1) music.currentTime = t;
  else music.addEventListener('loadedmetadata', () => { music.currentTime = t; }, { once: true });
})();
