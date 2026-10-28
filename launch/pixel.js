// Pixel-art toolkit for the SUBTEXT video. Art is drawn at 270x338 with colour roles, then scaled 4x with no smoothing,
// so one drawing can be shown in any of the four styles below (each style is a hand-picked palette, not a filter).
(() => {
'use strict';

const NW = 270, NH = 338, SCALE = 4;

const GB = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
const P8 = ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
            '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'];

const STYLES = {
  booth: {
    name: 'Papers, Please booth', dither: true,
    roles: {
      outline: '#1a1916', wallDark: '#2f3328', wall: '#454a39', wallLight: '#575d47', trim: '#363a2d', sign: '#26281f', signText: '#c9bb8e',
      sky: '#1f2433', skyLow: '#2e3549', city: '#141720', cityLight: '#d9a95b', frame: '#5b5f4c',
      deskDark: '#3a2a1e', desk: '#5c4330', deskLight: '#76573a', deskLine: '#4c3727',
      counter: '#6d7066', counterLight: '#8b8e82', counterDark: '#4b4d46',
      paperShade: '#b3a582', paper: '#ddd0ad', paperLine: '#c2b48f', inkText: '#2a2622',
      pcDark: '#5e5645', pcShade: '#8f8468', pc: '#b8ab88', pcLight: '#d3c7a4', screenDark: '#0c110d', screen: '#16201a', face: '#f0b85a', faceDim: '#7a5a2a',
      tie: '#8a3328', tieDark: '#5e2119', strap: '#41597a', card: '#ddd0ad', cardText: '#2a2622',
      metalDark: '#33383c', metal: '#566068', metalLight: '#7a858c', mug: '#7d3f32', mugDark: '#5a2c23', coffee: '#2a1a12',
      plant: '#55703d', plantDark: '#3a4d2b', pot: '#7a4a32', clockFace: '#d6cba8', clockHand: '#1a1916',
      uiBg: '#1d1e1a', uiEdge: '#8b8e82', uiText: '#ddd0ad', uiName: '#f0b85a', uiShadow: '#0e0e0c', blush: '#c46a5a', sweat: '#7fa8c9',
      pipe: '#4a5a52', pipeDark: '#2f3a35', pipeLight: '#6f8278', crate: '#8a6a3e', crateDark: '#5e4527', crateLight: '#a9874f',
      glass: '#5f767a', glassLight: '#a9c2c4', alarm: '#c8473a', alarmDark: '#7e2a22', black: '#0b0b0a', amberDark: '#9a6a26',
      bert: '#7d8288', bertShade: '#5a5f64', bertLight: '#9da2a7', bertScreen: '#1b2226', bertFace: '#9fc4d6', flame: '#d9783a', flameHot: '#f0c45a',
    },
    ink: { gratitude: '#3f8f57', love: '#b8485f', optimism: '#c49a2e', remorse: '#5a64b0', confusion: '#2f8a84', disappointment: '#5f6f8f',
      nervousness: '#8a5fb0', curiosity: '#3f7f9a', surprise: '#2f8f99', sadness: '#4a6a9a', amusement: '#c47a2e', default: '#9a3a2e' },
  },
  cozy: {
    name: 'Stardew cozy office',
    roles: {
      outline: '#3a2229', wallDark: '#8a5236', wall: '#b8754a', wallLight: '#d4945e', trim: '#6e3f2a', sign: '#5a3322', signText: '#ffe6a8',
      sky: '#f3a46a', skyLow: '#ea7a6b', city: '#6c3f5e', cityLight: '#ffe08a', frame: '#6e3f2a',
      deskDark: '#6a3d22', desk: '#9a5f35', deskLight: '#c07e47', deskLine: '#7f4c2b',
      counter: '#c9a26b', counterLight: '#e6c48c', counterDark: '#9c7748',
      paperShade: '#e3c995', paper: '#fff4d8', paperLine: '#efd9ab', inkText: '#4a2a2a',
      pcDark: '#a8916a', pcShade: '#d8c49c', pc: '#f2e4c2', pcLight: '#fffaea', screenDark: '#162238', screen: '#22344f', face: '#8ff0c8', faceDim: '#3f7f78',
      tie: '#e0504a', tieDark: '#a83a3a', strap: '#4b8fd1', card: '#fff4d8', cardText: '#4a2a2a',
      metalDark: '#5a5f78', metal: '#8a90a8', metalLight: '#b9bfd4', mug: '#4b8fd1', mugDark: '#356aa0', coffee: '#5a3320',
      plant: '#6fbf4a', plantDark: '#3f8a3a', pot: '#c0603a', clockFace: '#fff4d8', clockHand: '#3a2229',
      uiBg: '#fbe5b6', uiEdge: '#8a4b2a', uiText: '#4a2a2a', uiName: '#b0502e', uiShadow: '#6e3f2a', blush: '#ff8a8a', sweat: '#8fd3ff',
    },
    ink: { gratitude: '#2fa35f', love: '#e0446e', optimism: '#e3a51c', remorse: '#6a6ae0', confusion: '#1f9e96', disappointment: '#6f80b0', nervousness: '#a467d8', default: '#d0453a' },
  },
  gameboy: {
    name: 'Game Boy 4-colour',
    roles: Object.fromEntries(Object.entries({
      outline: 0, wallDark: 0, wall: 1, wallLight: 1, trim: 0, sign: 0, signText: 3, sky: 0, skyLow: 1, city: 0, cityLight: 3, frame: 0,
      deskDark: 0, desk: 1, deskLight: 2, deskLine: 0, counter: 2, counterLight: 3, counterDark: 1,
      paperShade: 2, paper: 3, paperLine: 2, inkText: 0, pcDark: 1, pcShade: 2, pc: 3, pcLight: 3, screenDark: 0, screen: 0, face: 3, faceDim: 1,
      tie: 1, tieDark: 0, strap: 1, card: 3, cardText: 0, metalDark: 0, metal: 1, metalLight: 2, mug: 1, mugDark: 0, coffee: 0,
      plant: 2, plantDark: 1, pot: 1, clockFace: 3, clockHand: 0, uiBg: 3, uiEdge: 0, uiText: 0, uiName: 0, uiShadow: 1, blush: 1, sweat: 2,
    }).map(([k, v]) => [k, GB[v]])),
    ink: { default: GB[0] },
  },
  pico: {
    name: 'PICO-8 arcade',
    roles: Object.fromEntries(Object.entries({
      outline: 0, wallDark: 0, wall: 1, wallLight: 13, trim: 5, sign: 2, signText: 15, sky: 0, skyLow: 1, city: 0, cityLight: 10, frame: 5,
      deskDark: 2, desk: 4, deskLight: 15, deskLine: 2, counter: 6, counterLight: 7, counterDark: 5,
      paperShade: 6, paper: 7, paperLine: 6, inkText: 0, pcDark: 5, pcShade: 6, pc: 15, pcLight: 7, screenDark: 0, screen: 1, face: 11, faceDim: 3,
      tie: 8, tieDark: 2, strap: 12, card: 7, cardText: 0, metalDark: 5, metal: 13, metalLight: 6, mug: 12, mugDark: 1, coffee: 2,
      plant: 11, plantDark: 3, pot: 4, clockFace: 7, clockHand: 0, uiBg: 0, uiEdge: 7, uiText: 7, uiName: 10, uiShadow: 5, blush: 14, sweat: 12,
    }).map(([k, v]) => [k, P8[v]])),
    ink: { gratitude: P8[11], love: P8[14], optimism: P8[10], remorse: P8[12], confusion: P8[12], disappointment: P8[13], nervousness: P8[14], default: P8[8] },
  },
};

// 5x7 font (rows 7-8 are descenders), shared with the dot-matrix engine.
const FONT = {
  A: '.###. #...# #...# ##### #...# #...# #...#', B: '####. #...# #...# ####. #...# #...# ####.',
  C: '.###. #...# #.... #.... #.... #...# .###.', D: '####. #...# #...# #...# #...# #...# ####.',
  E: '##### #.... #.... ####. #.... #.... #####', F: '##### #.... #.... ####. #.... #.... #....',
  G: '.###. #...# #.... #.### #...# #...# .####', H: '#...# #...# #...# ##### #...# #...# #...#',
  I: '.###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.', J: '..### ...#. ...#. ...#. ...#. #..#. .##..',
  K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#', L: '#.... #.... #.... #.... #.... #.... #####',
  M: '#...# ##.## #.#.# #.#.# #...# #...# #...#', N: '#...# #...# ##..# #.#.# #..## #...# #...#',
  O: '.###. #...# #...# #...# #...# #...# .###.', P: '####. #...# #...# ####. #.... #.... #....',
  Q: '.###. #...# #...# #...# #.#.# #..#. .##.#', R: '####. #...# #...# ####. #.#.. #..#. #...#',
  S: '.#### #.... #.... .###. ....# ....# ####.', T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..',
  U: '#...# #...# #...# #...# #...# #...# .###.', V: '#...# #...# #...# #...# #...# .#.#. ..#..',
  W: '#...# #...# #...# #.#.# #.#.# #.#.# .#.#.', X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
  Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', Z: '##### ....# ...#. ..#.. .#... #.... #####',
  a: '..... ..... .###. ....# .#### #...# .####', b: '#.... #.... #.##. ##..# #...# #...# ####.',
  c: '..... ..... .###. #.... #.... #...# .###.', d: '....# ....# .##.# #..## #...# #...# .####',
  e: '..... ..... .###. #...# ##### #.... .###.', f: '..##. .#..# .#... ###.. .#... .#... .#...',
  g: '..... ..... .#### #...# #...# .#### ....# ....# .###.', h: '#.... #.... #.##. ##..# #...# #...# #...#',
  i: '..#.. ..... .##.. ..#.. ..#.. ..#.. .###.', j: '...#. ..... ..##. ...#. ...#. ...#. ...#. #..#. .##..',
  k: '#.... #.... #..#. #.#.. ##... #.#.. #..#.', l: '.##.. ..#.. ..#.. ..#.. ..#.. ..#.. .###.',
  m: '..... ..... ##.#. #.#.# #.#.# #.#.# #.#.#', n: '..... ..... #.##. ##..# #...# #...# #...#',
  o: '..... ..... .###. #...# #...# #...# .###.', p: '..... ..... ####. #...# #...# ####. #.... #.... #....',
  q: '..... ..... .#### #...# #...# .#### ....# ....# ....#', r: '..... ..... #.##. ##..# #.... #.... #....',
  s: '..... ..... .###. #.... .###. ....# ####.', t: '.#... .#... ###.. .#... .#... .#..# ..##.',
  u: '..... ..... #...# #...# #...# #..## .##.#', v: '..... ..... #...# #...# #...# .#.#. ..#..',
  w: '..... ..... #...# #...# #.#.# #.#.# .#.#.', x: '..... ..... #...# .#.#. ..#.. .#.#. #...#',
  y: '..... ..... #...# #...# #...# .#### ....# ....# .###.', z: '..... ..... ##### ...#. ..#.. .#... #####',
  0: '.###. #...# #..## #.#.# ##..# #...# .###.', 1: '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.',
  2: '.###. #...# ....# ...#. ..#.. .#... #####', 3: '##### ...#. ..#.. ...#. ....# #...# .###.',
  4: '...#. ..##. .#.#. #..#. ##### ...#. ...#.', 5: '##### #.... ####. ....# ....# #...# .###.',
  6: '..##. .#... #.... ####. #...# #...# .###.', 7: '##### ....# ...#. ..#.. .#... .#... .#...',
  8: '.###. #...# #...# .###. #...# #...# .###.', 9: '.###. #...# #...# .#### ....# ...#. .##..',
  '.': '..... ..... ..... ..... ..... .##.. .##..', ',': '..... ..... ..... ..... ..... .##.. ..#.. .#...',
  '?': '.###. #...# ....# ...#. ..#.. ..... ..#..', '!': '..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..',
  "'": '..#.. ..#.. .#... ..... ..... ..... .....', '(': '...#. ..#.. .#... .#... .#... ..#.. ...#.',
  ')': '.#... ..#.. ...#. ...#. ...#. ..#.. .#...', '-': '..... ..... ..... ##### ..... ..... .....',
  ':': '..... .##.. .##.. ..... .##.. .##.. .....', '%': '##... ##..# ...#. ..#.. .#... #..## ...##',
  '/': '..... ....# ...#. ..#.. .#... #.... .....', '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....',
  '&': '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#', '_': '..... ..... ..... ..... ..... ..... #####',
  '>': '.#... ..#.. ...#. ....# ...#. ..#.. .#...', '#': '.#.#. ##### .#.#. .#.#. ##### .#.#. .....',
  '·': '..... ..... ..... ..#.. ..... ..... .....', '=': '..... ..... ##### ..... ##### ..... .....', ' ': '..... ..... ..... ..... ..... ..... .....',
};

// 3x5 capitals for small print.
const TINY = {
  A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.', E: '### #.. ##. #.. ###',
  F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#', I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.',
  K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###', M: '#.# ### ### #.# #.#', N: '##. #.# #.# #.# #.#', O: '.#. #.# #.# #.# .#.',
  P: '##. #.# ##. #.. #..', Q: '.#. #.# #.# ##. .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#', X: '#.# #.# .#. #.# #.#', Y: '#.# #.# .#. .#. .#.',
  Z: '### ..# .#. #.. ###', 0: '### #.# #.# #.# ###', 1: '.#. ##. .#. .#. ###', 2: '##. ..# .#. #.. ###', 3: '##. ..# .#. ..# ##.',
  4: '#.# #.# ### ..# ..#', 5: '### #.. ##. ..# ##.', 6: '.## #.. ### #.# ###', 7: '### ..# .#. .#. .#.', 8: '### #.# ### #.# ###',
  9: '### #.# ### ..# ##.', '.': '... ... ... ... .#.', ',': '... ... ... .#. #..', ':': '... .#. ... .#. ...', '/': '..# ..# .#. #.. #..',
  '-': '... ... ### ... ...', '(': '.#. #.. #.. #.. .#.', ')': '.#. ..# ..# ..# .#.', '%': '#.# ..# .#. #.. #.#', '!': '.#. .#. .#. ... .#.',
  '?': '##. ..# .#. ... .#.', "'": '.#. .#. ... ... ...', '+': '... .#. ### .#. ...', '&': '.#. #.# .#. #.# .##', '#': '#.# ### #.# ### #.#',
  '=': '... ### ... ### ...', '>': '#.. .#. ..# .#. #..', '·': '... ... .#. ... ...', '<': '..# .#. #.. .#. ..#', '_': '... ... ... ... ###', ' ': '... ... ... ... ...',
};
function tinyWidth(s) { return s.length * 4 - 1; }
function tiny(s, x, y, role, { align = 'left', upto = Infinity } = {}) {
  s = s.toUpperCase();
  const w = tinyWidth(s), x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
  [...s].slice(0, upto).forEach((ch, i) => (TINY[ch] || TINY['?']).split(' ').forEach((row, r) => [...row].forEach((b, c) => { if (b === '#') px(x0 + i * 4 + c, y + r, role); })));
  return w;
}

// ---------- drawing state
let cv, ctx, style;
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
// The video is 270x338; covers ask for their own native size.
function begin(styleKey, w = NW, h = NH) {
  style = STYLES[styleKey];
  if (!cv) { cv = document.createElement('canvas'); ctx = cv.getContext('2d', { willReadFrequently: true }); }
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return ctx;
}
let aliases = null;   // temporary role swaps, e.g. to draw a grey monitor with the beige monitor's code
const col = role => {
  if (role[0] === '#') return role;
  const r = (aliases && aliases[role]) || role;
  return style.roles[r] || STYLES.booth.roles[r];
};
function withRoles(map, fn) { const prev = aliases; aliases = map; try { fn(); } finally { aliases = prev; } }
function rect(x, y, w, h, role) { ctx.fillStyle = col(role); ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function px(x, y, role) { rect(x, y, 1, 1, role); }
function line(x0, y0, x1, y1, role) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(x0, y0, role);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function disc(cx, cy, r, role) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .8) px(cx + x, cy + y, role);
}
function ring(cx, cy, r, role) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (d <= r * r + r * .8 && d >= (r - 1) * (r - 1) + (r - 1) * .8) px(cx + x, cy + y, role); }
}
// Bevelled box: light top-left, dark bottom-right, 1px outline.
function box(x, y, w, h, base, light, dark, outline = 'outline') {
  rect(x, y, w, h, outline);
  rect(x + 1, y + 1, w - 2, h - 2, dark);
  rect(x + 1, y + 1, w - 3, h - 3, light);
  rect(x + 2, y + 2, w - 4, h - 4, base);
}
function textWidth(s) { return s.length * 6 - 1; }
function text(s, x, y, role, { align = 'left', upto = Infinity, scale = 1 } = {}) {
  const w = textWidth(s) * scale, x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
  [...s].slice(0, upto).forEach((ch, i) => {
    (FONT[ch] || FONT['?']).split(' ').forEach((row, r) => [...row].forEach((b, c) => { if (b === '#') rect(x0 + (i * 6 + c) * scale, y + r * scale, scale, scale, role); }));
  });
  return w;
}
// Word-wrap to a character budget.
function wrap(s, max) {
  const lines = [];
  for (const word of s.split(' ')) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word; else lines.push(word);
  }
  return lines;
}
// Rasterise a real font with no anti-aliasing, so it sits on the pixel grid.
const rasters = new Map();
function rasterText(s, font) {
  const key = s + '|' + font;
  if (rasters.has(key)) return rasters.get(key);
  const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  c.font = font;
  const w = Math.ceil(c.measureText(s).width) + 2, h = 40;
  c.canvas.width = w; c.canvas.height = h;
  c.font = font; c.fillStyle = '#fff'; c.textBaseline = 'alphabetic';
  c.fillText(s, 1, 30);
  const d = c.getImageData(0, 0, w, h).data, pts = [];
  let top = h, bottom = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 120) { pts.push([x, y]); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  const r = { w, top, h: bottom - top + 1, pts: pts.map(([x, y]) => [x, y - top]) };
  rasters.set(key, r);
  return r;
}

function rng(seed) {
  let a = seed | 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// ---------- the ink stamp (Anton, the font that stays)
function stamp(label, value, emo, cx, cy, { wear = .05, seed = 3, color } = {}) {
  const ink = color || style.ink[emo] || style.ink.default;
  const t = rasterText(value ? `${label.toUpperCase()} ${value}` : label.toUpperCase(), '400 21px Anton');
  const padX = 6, padY = 5, w = t.w + padX * 2, h = t.h + padY * 2 + 2;
  const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2), r = rng(seed);
  const dab = (x, y) => { if (r() > wear) px(x, y, ink); };
  for (let x = 0; x < w; x++) { dab(x0 + x, y0); dab(x0 + x, y0 + 1); dab(x0 + x, y0 + h - 1); dab(x0 + x, y0 + h - 2); }
  for (let y = 0; y < h; y++) { dab(x0, y0 + y); dab(x0 + 1, y0 + y); dab(x0 + w - 1, y0 + y); dab(x0 + w - 2, y0 + y); }
  for (const [x, y] of t.pts) dab(x0 + padX + x, y0 + padY + 1 + y);
  return { w, h };
}

// ---------- SUBTEXT's face. Features are placed on the screen in fractions and sized in whole pixels times k.
const EXPR = {
  deadpan:  { eyes: ['half', 'half'], brows: 'flat', mouth: 'flat' },
  happy:    { eyes: ['happy', 'happy'], brows: 'raised', mouth: 'grin' },
  smug:     { eyes: ['half', 'half'], brows: 'smug', mouth: 'smirk' },
  confused: { eyes: ['dot', 'small'], brows: 'oneup', mouth: 'wavy', extra: 'question' },
  squint:   { eyes: ['squint', 'squint'], brows: 'angry', mouth: 'flat' },
  shocked:  { eyes: ['wide', 'wide'], brows: 'high', mouth: 'o', extra: 'exclaim' },
  proud:    { eyes: ['happy', 'happy'], brows: 'raised', mouth: 'smile', extra: 'sparkle' },
  sheepish: { eyes: ['side', 'side'], brows: 'worried', mouth: 'smile', extra: 'blush' },
  nervous:  { eyes: ['dot', 'dot'], brows: 'worried', mouth: 'wavy', extra: 'sweat' },
  wink:     { eyes: ['happy', 'dot'], brows: 'flat', mouth: 'grin', extra: 'sparkle' },
  sad:      { eyes: ['dot', 'dot'], brows: 'worried', mouth: 'frown' },
  neutral:  { eyes: ['dot', 'dot'], brows: 'none', mouth: 'flat' },
};
function face(sx, sy, sw, sh, exprKey, { blink = 0, gaze = 0, gazeY = 0 } = {}) {
  const e = EXPR[exprKey] || EXPR.neutral, k = Math.max(1, Math.min(Math.round(sw / 28), Math.floor(sh / 19)));   // features need ~19k rows
  const F = 'face', S = 'screen';
  const R = (x, y, w, h, role = F) => rect(Math.round(x), Math.round(y), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)), role);
  const eyes = [[sx + sw * .31 + gaze * k, sy + sh * .42 + gazeY * k], [sx + sw * .69 + gaze * k, sy + sh * .42 + gazeY * k]];
  eyes.forEach(([ex, ey], i) => {
    let kind = e.eyes[i];
    if (blink > .5 && (kind === 'dot' || kind === 'wide' || kind === 'side')) kind = 'closed';
    const at = (w, h, dx = 0, dy = 0) => [ex - w * k / 2 + dx * k, ey - h * k / 2 + dy * k];
    switch (kind) {
      case 'dot': { const [x, y] = at(4, 6); R(x, y, 4, 6); R(x + k, y + k, 1, 1, S); break; }
      case 'side': { const [x, y] = at(4, 6, 2); R(x, y, 4, 6); R(x + 2 * k, y + k, 1, 1, S); break; }
      case 'small': { const [x, y] = at(3, 3, 0, 1); R(x, y, 3, 3); break; }
      case 'wide': { const [x, y] = at(6, 8); R(x, y, 6, 8); R(x + k, y + k, 2, 2, S); break; }
      case 'half': { const [x, y] = at(6, 3, 0, 1); R(x, y, 6, 3); R(x, y - 2 * k, 6, 1, 'faceDim'); break; }
      case 'squint': { const [x, y] = at(6, 2, 0, 1); R(x, y, 6, 2); break; }
      case 'closed': { const [x, y] = at(6, 1, 0, 1); R(x, y, 6, 1.5); break; }
      case 'happy': {
        const [x, y] = at(6, 4, 0, 1);
        R(x + k, y, 4, 1.5); R(x, y + k, 1.5, 3); R(x + 4.5 * k, y + k, 1.5, 3);
        break;
      }
    }
  });
  // Brows: [left (dy outer, dy inner)], mirrored for the right eye.
  const browShape = { flat: [-5, -5, -5, -5], raised: [-6, -6, -6, -6], high: [-7, -7, -7, -7], worried: [-5, -7, -7, -5],
    angry: [-6, -4, -4, -6], oneup: [-5, -5, -7, -6], smug: [-5, -5, -6, -5] }[e.brows];
  if (browShape) {
    const [lo, li, ri, ro] = browShape;
    const [[lx, ly], [rx, ry]] = eyes;
    line(lx - 3 * k, ly + lo * k, lx + 3 * k, ly + li * k, F); line(lx - 3 * k, ly + lo * k + 1, lx + 3 * k, ly + li * k + 1, F);
    line(rx - 3 * k, ry + ri * k, rx + 3 * k, ry + ro * k, F); line(rx - 3 * k, ry + ri * k + 1, rx + 3 * k, ry + ro * k + 1, F);
  }
  const mx = sx + sw * .5 + gaze * k * .5, my = sy + sh * .74;
  const M = (pts) => pts.forEach(([x, y, w = 1, h = 1]) => R(mx + x * k, my + y * k, w, h));
  switch (e.mouth) {
    case 'flat': M([[-5, 0, 10, 1.5]]); break;
    case 'smile': M([[-6, -2, 1.5, 2], [4.5, -2, 1.5, 2], [-5, 0, 10, 1.5]]); break;
    case 'frown': M([[-5, -2, 10, 1.5], [-6, -1, 1.5, 2], [4.5, -1, 1.5, 2]]); break;
    case 'grin': M([[-6, -3, 12, 1.5], [-6, -2, 1.5, 2], [4.5, -2, 1.5, 2], [-5, 0, 10, 1.5], [-3, 1, 6, 1.5]]); break;
    case 'smirk': M([[-5, 0, 7, 1.5], [2, -1, 3, 1.5], [4, -2, 1.5, 1.5]]); break;
    case 'o': M([[-2, -2, 4, 1], [-2, 1, 4, 1], [-3, -1, 1, 2], [2, -1, 1, 2]]); break;
    case 'wavy': M([[-6, 0, 2, 1.5], [-4, -1, 2, 1.5], [-2, 0, 2, 1.5], [0, -1, 2, 1.5], [2, 0, 2, 1.5], [4, -1, 2, 1.5]]); break;
  }
  const ex = sx + sw - 7, ey = sy + 2, ry = eyes[1][1];
  switch (e.extra) {
    case 'question': text('?', ex, ey, F); break;
    case 'exclaim': text('!', ex, ey, F); break;
    case 'sparkle': R(ex + 1, ry - 2 * k, 1, 3); R(ex + 1 - k, ry - k, 3, 1); break;
    case 'blush': eyes.forEach(([x, y]) => R(x - 3 * k, y + 5 * k, 5, 1, 'blush')); break;
    case 'sweat': R(ex + 2, ry - 3 * k, 1, 1, 'sweat'); R(ex + 2 - k, ry - 2 * k, 3, 2, 'sweat'); R(ex + 2, ry, 1, 1, 'sweat'); break;
  }
}
// Scanlines on a CRT screen: every other row one step darker.
function screen(x, y, w, h) {
  rect(x, y, w, h, 'screen');
  for (let r = 1; r < h; r += 2) rect(x, y + r, w, 1, 'screenDark');
}
// The beige office PC. (x, y) is the top-left of the monitor case.
function monitor(x, y, w, h, expr, opts = {}) {
  box(x, y, w, h, 'pc', 'pcLight', 'pcShade');
  const bx = x + 5, by = y + 5, bw = w - 10, bh = Math.round(h * .66);
  rect(bx - 1, by - 1, bw + 2, bh + 2, 'pcDark');
  screen(bx, by, bw, bh);
  const power = opts.power === undefined ? 1 : opts.power;
  if (power >= 1) face(bx, by, bw, bh, expr, opts);
  else if (power > .5) { const h2 = Math.max(1, Math.round(bh * (power - .5) * 2)); rect(bx, by + (bh - h2) / 2, bw, h2, 'faceDim'); }
  else if (power > 0) { const w2 = Math.max(1, Math.round(bw * power * 2)); rect(bx + (bw - w2) / 2, by + bh / 2, w2, 1, 'face'); }
  rect(bx, by, bw, 1, 'pcDark');
  const ly = by + bh + Math.max(3, Math.round((h - bh - 10) / 2) - 1);
  if (h > 50) text(opts.label || 'SUBTEXT', x + w / 2, ly, 'pcDark', { align: 'center' });
  rect(x + w - 9, ly + 2, 3, 2, 'face');
  if (w >= 76) for (let i = 0; i < 3; i++) rect(x + 6, ly + 1 + i * 2, 6, 1, 'pcShade');
}

function dither(strength = .45, maxY = cv.height) {
  const w = cv.width, h = cv.height;
  for (let y = 0; y < maxY; y++) for (let x = 0; x < w; x++) {
    const dx = (x - w / 2) / (w / 2), dy = (y - h * .42) / (h * .62);
    const v = clamp((Math.sqrt(dx * dx + dy * dy) - .8) / .5) * strength;
    if (BAYER[y & 3][x & 3] / 16 < v) px(x, y, 'outline');
  }
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// Copy the native canvas onto the output canvas at 4x with hard pixels.
// zoom is a whole number (4, 5 or 6) so every art pixel stays square; (fx, fy) is the native point to centre on.
function present(out, { zoom = SCALE, fx = cv.width / 2, fy = cv.height / 2, sx = 0, sy = 0 } = {}) {
  const o = out.getContext('2d');
  o.imageSmoothingEnabled = false;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.fillStyle = col('black'); o.fillRect(0, 0, out.width, out.height);
  const vw = out.width / zoom, vh = out.height / zoom;
  const x0 = Math.round(clamp(fx - vw / 2, 0, cv.width - vw)) + sx, y0 = Math.round(clamp(fy - vh / 2, 0, cv.height - vh)) + sy;
  o.drawImage(cv, x0, y0, vw, vh, 0, 0, out.width, out.height);
}

window.PIX = { NW, NH, SCALE, STYLES, FONT, TINY, EXPR, begin, rect, px, line, disc, ring, box, text, textWidth, tiny, tinyWidth, wrap, rasterText, stamp, face, screen, monitor, dither, present, rng, clamp, col, withRoles, get ctx() { return ctx; }, get style() { return style; } };
})();
