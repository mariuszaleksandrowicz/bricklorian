/* BRICKLORIAN
   Created by Mariusz Aleksandrowicz via AI-driven workflows.
   Licensed under the MIT License.

   sfx.js — line-clear jingles, 8-bit chiptune synthesized live in the browser
   (Web Audio API — square & triangle waves, zero audio files).
   16 one-shots: 4 themes x { 1, 2, 3, 4 } cleared lines.
   NOTE tuple: [delay s, midi, dur s, 'sq'|'tri', vol, slide semitones] */
const SFX = (function () {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, master = null;

  function ensure() {
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.3; // jingles sit below the OST
      const amp = ctx.createBiquadFilter(); // slight low-pass = "chiptune through the console"
      amp.type = 'lowpass'; amp.frequency.value = 5200;
      master.connect(amp); amp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {}); // autoplay policy
    return ctx;
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function voice(when, midi, dur, wave, vol, slide) {
    const o = ctx.createOscillator();
    o.type = wave === 'tri' ? 'triangle' : 'square';
    o.frequency.setValueAtTime(mtof(midi), when);
    if (slide) o.frequency.exponentialRampToValueAtTime(mtof(midi + slide), when + dur); // glissando
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.012); // fast attack, chiptune snap
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(master);
    o.start(when); o.stop(when + dur + 0.05);
  }

  /* Each theme owns a distinct voice & scale — the same 1/2/3/4 arc, four temperaments. */
  const J = {
    /* CLASSIC — 80s arcade: crisp square, C-major arpeggios, ever faster per line */
    classic: {
      1: [[0, 72, .09, 'sq', .5], [.08, 76, .09, 'sq', .5], [.16, 79, .18, 'sq', .58]],
      2: [[0, 72, .07, 'sq', .5], [.06, 76, .07, 'sq', .5], [.12, 79, .07, 'sq', .5], [.18, 84, .24, 'sq', .6]],
      3: [[0, 72, .055, 'sq', .5], [.055, 76, .055, 'sq', .5], [.11, 79, .055, 'sq', .5], [.165, 84, .055, 'sq', .5], [.22, 88, .3, 'sq', .62]],
      4: [[0, 72, .055, 'sq', .5], [.055, 76, .055, 'sq', .5], [.11, 79, .055, 'sq', .5], [.165, 84, .055, 'sq', .5],
          [.24, 79, .07, 'sq', .5], [.31, 84, .07, 'sq', .5], [.38, 88, .07, 'sq', .55], [.45, 91, .42, 'sq', .62]],
    },
    /* NEON — synthwave: driving A-minor sixteenths (square) over a low triangle bass */
    neon: {
      1: [[0, 45, .22, 'tri', .85], [0, 69, .08, 'sq', .5], [.07, 72, .08, 'sq', .5], [.14, 81, .18, 'sq', .55]],
      2: [[0, 45, .15, 'tri', .85], [.2, 45, .15, 'tri', .85],
          [0, 69, .065, 'sq', .5], [.065, 72, .065, 'sq', .5], [.13, 76, .065, 'sq', .5], [.195, 81, .2, 'sq', .55]],
      3: [[0, 45, .13, 'tri', .85], [.26, 53, .13, 'tri', .85],
          [0, 69, .06, 'sq', .5], [.06, 70, .06, 'sq', .5], [.12, 72, .06, 'sq', .5], [.18, 76, .06, 'sq', .5],
          [.24, 79, .06, 'sq', .55], [.3, 81, .3, 'sq', .6]],
      4: [[0, 45, .12, 'tri', .85], [.3, 53, .12, 'tri', .85], [.6, 45, .4, 'tri', .9],
          [0, 69, .055, 'sq', .5], [.055, 72, .055, 'sq', .5], [.11, 76, .055, 'sq', .5], [.165, 79, .055, 'sq', .5],
          [.22, 81, .055, 'sq', .55], [.275, 79, .055, 'sq', .5], [.33, 81, .055, 'sq', .55], [.385, 84, .55, 'sq', .65]],
    },
    /* RUNE — mystic bells: triangle-led wide 7ths & 9ths, slow shimmering decays */
    rune: {
      1: [[0, 74, .45, 'tri', .7], [.1, 81, .6, 'tri', .7]],
      2: [[0, 74, .35, 'tri', .65], [.07, 78, .35, 'tri', .65], [.14, 81, .45, 'tri', .68], [.21, 87, .65, 'tri', .68]],
      3: [[0, 74, .4, 'tri', .65], [.08, 76, .4, 'tri', .65], [.16, 81, .5, 'tri', .68],
          [.24, 82, .5, 'tri', .68], [.34, 74, .6, 'tri', .6], [.44, 87, .9, 'tri', .7]],
      4: [[0, 50, .9, 'tri', .55], [0, 74, .5, 'tri', .65], [.09, 79, .5, 'tri', .65], [.18, 82, .55, 'tri', .68],
          [.27, 87, .65, 'tri', .7], [.36, 91, .95, 'tri', .7], [.5, 94, 1.1, 'tri', .6]],
    },
    /* STAR DRIFT — launches & warps: open 5ths, rising glides, low triangle drones */
    space: {
      1: [[0, 48, .25, 'tri', .7], [0, 72, .1, 'sq', .5], [.09, 76, .12, 'sq', .5], [.13, 79, .22, 'sq', .55, 3]],
      2: [[0, 48, .35, 'tri', .7], [0, 60, .08, 'sq', .5], [.07, 67, .08, 'sq', .5], [.14, 72, .08, 'sq', .5],
          [.21, 74, .09, 'sq', .55], [.28, 79, .12, 'sq', .55], [.36, 84, .34, 'sq', .6, 4]],
      3: [[0, 36, .55, 'tri', .8], [0, 48, .5, 'tri', .55],
          [0, 67, .07, 'sq', .5], [.055, 72, .07, 'sq', .5], [.11, 69, .07, 'sq', .5], [.165, 74, .07, 'sq', .55],
          [.22, 76, .07, 'sq', .55], [.275, 79, .1, 'sq', .55], [.34, 84, .45, 'sq', .6, 5]],
      4: [[0, 36, .95, 'tri', .6],
          [0, 60, .06, 'sq', .5], [.055, 62, .06, 'sq', .5], [.11, 64, .06, 'sq', .5], [.165, 67, .06, 'sq', .5],
          [.22, 69, .06, 'sq', .5], [.275, 72, .06, 'sq', .55], [.33, 74, .06, 'sq', .55], [.385, 76, .06, 'sq', .55],
          [.44, 79, .06, 'sq', .55], [.495, 84, .08, 'sq', .6], [.575, 91, .95, 'sq', .68, 7]],
    },
  };

  return {
    themes: Object.keys(J),
    /** Play the jingle for a theme + line count (1..4). No-op if unknown. */
    play(theme, rows) {
      const seq = J[theme] && J[theme][rows];
      if (!seq) return;
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime + 0.02;
      for (const n of seq) voice(t0 + n[0], n[1], n[2], n[3], n[4] || .5, n[5] || 0);
    },
  };
})();

/** Hook used by engine.js at the moment a line clear scores. */
function playClearSFX(theme, rows) { SFX.play(theme, rows); }
