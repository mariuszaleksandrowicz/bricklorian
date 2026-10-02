/* BRICKLORIAN
   Created by Mariusz Aleksandrowicz via AI-driven workflows.
   Licensed under the MIT License. */
const COLS = 10, ROWS = 20, SIZE = 30;

const SHAPES = [
  { name: 'I', cells: [[0,0],[1,0],[2,0],[3,0]] },
  { name: 'O', cells: [[0,0],[1,0],[0,1],[1,1]] },
  { name: 'T', cells: [[0,0],[1,0],[2,0],[1,1]] },
  { name: 'S', cells: [[1,0],[2,0],[0,1],[1,1]] },
  { name: 'Z', cells: [[0,0],[1,0],[1,1],[2,1]] },
  { name: 'J', cells: [[0,0],[0,1],[1,1],[2,1]] },
  { name: 'L', cells: [[2,0],[0,1],[1,1],[2,1]] },
];

const THEMES = {
  classic: {
    colors: ['#b48cff', '#ff5c9e', '#d8e84f', '#e0913f', '#2fd4b5', '#d64f6d', '#aab6c4'], grid: '#222',
    // crumbled blocks + white flash
    fx: { type: 'debris', extra: null, flash: ['#ffffff'], fade: 260, flicker: 1, cycle: 0,
      g: .0018, up: [.08, .40], side: .30, life: [500, 850], size: [3, 9], count: 6 },
  },
  neon: {
    colors: ['#ff2fd6', '#00f8ff', '#23ff66', '#ffde00', '#ff8a00', '#8c46ff', '#ff3b3b'], grid: 'rgba(0,255,255,.16)',
    // glitch slices + neon streaks
    fx: { type: 'streak', extra: 'glitch', flash: ['#00f8ff', '#ff2fd6'], fade: 300, flicker: .55, cycle: 70,
      g: .0006, up: [.10, .55], side: .45, life: [350, 700], size: [4, 8], count: 5 },
  },
  rune: {
    colors: ['#cfc2a5', '#4f8f42', '#d9b34a', '#8f4a63', '#5a6b8f', '#c07a45', '#7a5fa8'], grid: '#4a3319',
    // magic ring burst + rising glowing embers
    fx: { type: 'ember', extra: 'ring', flash: ['#ffd77a', '#ff9b3d'], fade: 320, flicker: .3, cycle: 90,
      g: .0005, up: [.14, .50], side: .18, life: [550, 1000], size: [2, 4.5], count: 7 },
  },
  space: {
    colors: ['#c8a8e8', '#6fd8a8', '#c4ccd8', '#ff9d5c', '#8f7ae8', '#b8863f', '#3f8fc8'], grid: '#233047',
    // energy beam sweep + radial star sparks
    fx: { type: 'spark', extra: 'beam', flash: ['#ffffff', '#c8a8e8'], fade: 200, flicker: .5, cycle: 60,
      g: .0012, up: [.05, .30], side: .50, life: [400, 750], size: [3, 8], count: 6 },
  },
};

let themeKey = 'classic'; // always start in the Classic profile (per-session choice only)
function colorsOf() { return THEMES[themeKey].colors; }
