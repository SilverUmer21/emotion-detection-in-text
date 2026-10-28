// Pixel scene pieces for the SUBTEXT video, drawn with window.PIX at 270x338. Pure drawing: video.js owns the timing.
(() => {
'use strict';
const P = window.PIX;
const { rect, px, line, disc, ring, box, text, tiny, wrap } = P;
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const bayer = (x, y) => BAYER[y & 3][x & 3] / 16;

// ---------- the booth: SUBTEXT behind the counter (top), the desk seen from above (bottom)
function wall() {
  rect(0, 0, 270, 140, 'wall');
  for (let x = 44; x < 270; x += 45) { rect(x, 0, 1, 100, 'wallDark'); rect(x + 1, 0, 1, 100, 'wallLight'); }
  rect(0, 100, 270, 40, 'wallDark'); rect(0, 100, 270, 2, 'trim');
  for (let x = 9; x < 270; x += 18) rect(x, 102, 1, 38, 'trim');
}
function sign() {
  rect(61, 4, 148, 17, 'outline'); rect(62, 5, 146, 15, 'sign');
  text('DEPT OF HIDDEN FEELINGS', 135, 9, 'signText', { align: 'center' });
}
function windowView() {
  rect(12, 28, 72, 66, 'frame'); rect(15, 31, 66, 60, 'sky');
  for (let y = 58; y < 91; y++) for (let x = 15; x < 81; x++) if (bayer(x, y) < (y - 58) / 30) px(x, y, 'skyLow');
  disc(70, 41, 4, 'cityLight'); disc(72, 40, 3, 'sky');
  const r = P.rng(11);
  for (const [x, w, h] of [[15, 9, 22], [24, 8, 34], [32, 11, 18], [43, 9, 41], [52, 11, 26], [63, 8, 31], [71, 10, 19]]) {
    rect(x, 91 - h, w, h, 'city');
    for (let yy = 91 - h + 3; yy < 89; yy += 3) for (let xx = x + 2; xx < x + w - 1; xx += 3) if (r() < .32) px(xx, yy, 'cityLight');
  }
  rect(47, 31, 2, 60, 'frame'); rect(15, 59, 66, 2, 'frame');
  rect(10, 94, 76, 3, 'trim'); rect(10, 94, 76, 1, 'wallLight');
  rect(20, 85, 11, 9, 'pot'); rect(19, 84, 13, 2, 'pot'); rect(19, 84, 13, 1, 'deskLight');
  for (const [x, y, role] of [[25, 74, 'plant'], [22, 77, 'plant'], [28, 77, 'plantDark'], [20, 80, 'plantDark'], [30, 80, 'plant'], [25, 79, 'plantDark'], [23, 82, 'plant'], [27, 82, 'plant']])
    rect(x, y, 3, 3, role);
}
function clock(minute = 41) {
  disc(236, 33, 11, 'clockFace'); ring(236, 33, 11, 'outline');
  for (const [dx, dy] of [[0, -9], [9, 0], [0, 9], [-9, 0]]) px(236 + dx, 33 + dy, 'clockHand');
  const a = minute / 60 * Math.PI * 2;
  line(236, 33, 236 + Math.round(Math.sin(a) * 7), 33 - Math.round(Math.cos(a) * 7), 'clockHand'); line(236, 33, 241, 36, 'clockHand');
}
function cabinet() {
  box(206, 56, 46, 84, 'metal', 'metalLight', 'metalDark');
  for (const y of [84, 112]) { rect(207, y, 44, 1, 'metalDark'); rect(207, y + 1, 44, 1, 'metalLight'); }
  for (const y of [66, 94, 122]) { rect(221, y, 16, 4, 'outline'); rect(222, y + 1, 14, 2, 'metalLight'); rect(224, y - 5, 10, 3, 'paper'); }
  rect(211, 49, 34, 7, 'outline'); rect(212, 50, 32, 5, 'paper'); rect(212, 52, 32, 1, 'paperLine');
}
// The PC on its desk. dy lifts the monitor for a hop; the stand stretches to follow.
function pc(expr, faceOpts = {}, { dy = 0 } = {}) {
  rect(60, 112, 150, 18, 'desk'); rect(60, 112, 150, 2, 'deskLight'); rect(60, 129, 150, 1, 'outline');
  rect(124, 94 + dy, 22, 7 - dy, 'outline'); rect(125, 94 + dy, 20, 6 - dy, 'pcShade');
  P.monitor(97, 30 + dy, 76, 64, expr, faceOpts);
  box(108, 100, 54, 12, 'pc', 'pcLight', 'pcShade');
  rect(130, 95, 10, 6, 'outline'); rect(131, 96, 8, 4, 'tie');
  for (let y = 0; y < 28; y++) {
    const w = y < 22 ? 5 + Math.min(y, 10) * .5 : 10 - (y - 22) * 1.7, x0 = 135 - w / 2 + y * .12;
    rect(x0 - 1, 101 + y, w + 2, 1, 'outline');
    for (let x = 0; x < w; x++) px(x0 + x, 101 + y, (x + y) % 6 < 2 ? 'tieDark' : 'tie');
  }
  line(103, 92 + dy, 110, 114, 'strap'); line(104, 92 + dy, 111, 114, 'strap');
  rect(101, 113, 20, 16, 'outline'); rect(102, 114, 18, 14, 'card');
  rect(104, 116, 6, 7, 'screen'); px(105, 118, 'face'); px(108, 118, 'face'); rect(105, 121, 4, 1, 'face');
  rect(112, 117, 6, 1, 'cardText'); rect(112, 120, 5, 1, 'cardText'); rect(112, 123, 6, 1, 'cardText');
}
function counter() {
  rect(0, 130, 270, 18, 'counter'); rect(0, 130, 270, 2, 'counterLight'); rect(0, 146, 270, 2, 'counterDark'); rect(0, 148, 270, 1, 'outline');
  for (let i = 0; i < 10; i++) rect(116 + i * 4, 138, 2, 2, 'counterDark');
}
function desk() {
  rect(0, 149, 270, 189, 'desk'); rect(0, 149, 270, 3, 'deskDark');
  const r = P.rng(5);
  for (let y = 156; y < 338; y += 7) { let x = Math.floor(r() * 20) - 10; while (x < 270) { const len = 18 + Math.floor(r() * 50); rect(x, y, len, 1, r() < .2 ? 'deskLight' : 'deskLine'); x += len + 6 + Math.floor(r() * 20); } }
  disc(28, 178, 11, 'outline'); disc(28, 178, 10, 'mug'); disc(28, 178, 7, 'coffee'); rect(24, 172, 2, 1, 'mugDark');
  rect(38, 174, 6, 9, 'outline'); rect(39, 175, 4, 7, 'mug'); rect(40, 176, 2, 5, 'desk');
}
function inkPad(ink) {
  box(222, 206, 36, 22, 'metal', 'metalLight', 'metalDark'); rect(226, 210, 28, 14, ink);
}
// The rubber stamp from above. lift (0..8 px) raises it towards the camera: it grows a touch and casts a shadow.
function stampTool(x, y, lift = 0) {
  x = Math.round(x); y = Math.round(y);
  const s = Math.round(lift / 4);
  if (lift > 0) rect(x - 10 + Math.round(lift * .7), y - 7 + Math.round(lift * .9), 22, 16, 'deskDark');
  box(x - 11 - s, y - 9 - s - lift, 22 + 2 * s, 18 + 2 * s, 'metal', 'metalLight', 'metalDark');
  disc(x, y - 1 - lift, 7 + s, 'outline'); disc(x, y - 1 - lift, 6 + s, 'deskLight'); disc(x - 1, y - 2 - lift, 3, 'pcLight');
}

const MEMO_W = 170, MEMO_H = 92;
// A memo seen from above at (x, y). stamp = { label, value, color, seed }.
function memo(m, x, y, { stamp = null, footnote = '' } = {}) {
  x = Math.round(x); y = Math.round(y);
  rect(x + 2, y + 2, MEMO_W, MEMO_H, 'deskDark'); rect(x, y, MEMO_W, MEMO_H, 'outline'); rect(x + 1, y + 1, MEMO_W - 2, MEMO_H - 2, 'paper');
  rect(x + 1, y + MEMO_H - 2, MEMO_W - 2, 1, 'paperShade'); rect(x + MEMO_W - 2, y + 1, 1, MEMO_H - 2, 'paperShade');
  text('MEMO', x + 8, y + 6, 'inkText'); text(m.time, x + MEMO_W - 8, y + 6, 'inkText', { align: 'right' });
  rect(x + 8, y + 16, MEMO_W - 16, 1, 'paperLine');
  text(`FROM: ${m.from}`, x + 8, y + 21, 'inkText');
  const lines = wrap(m.text, 26);
  lines.forEach((l, i) => text(l, x + 8, y + 34 + i * 10, 'inkText'));
  if (stamp) P.stamp(stamp.label, stamp.value, null, x + MEMO_W / 2, y + stampY(m), { color: stamp.color, seed: stamp.seed });
  if (footnote) tiny(footnote, x + MEMO_W / 2, y + 84, 'inkText', { align: 'center' });
}
const stampY = m => (wrap(m.text, 26).length > 1 ? 68 : 62);

// RPG dialogue box with a portrait. open < 1 draws the box growing from its middle line.
function dialogue(expr, who, says, { upto = Infinity, faceOpts = {}, arrow = true, open = 1 } = {}) {
  if (open <= 0) return;
  if (open < 1) {
    const h = Math.max(4, Math.round(88 * open)), y = 290 - Math.round(h / 2);
    rect(6, y, 258, h, 'uiEdge'); rect(8, y + 2, 254, h - 4, 'uiBg');
    return;
  }
  rect(8, 248, 258, 88, 'uiShadow'); rect(6, 246, 258, 88, 'uiEdge'); rect(8, 248, 254, 84, 'uiBg');
  rect(13, 253, 72, 72, 'uiEdge'); rect(14, 254, 70, 70, 'uiBg');
  P.monitor(17, 257, 64, 64, expr, faceOpts);
  text(who, 92, 256, 'uiName'); rect(92, 265, P.textWidth(who), 1, 'uiName');
  let left = upto;
  wrap(says, 28).forEach((l, i) => { if (left > 0) text(l, 92, 273 + i * 12, 'uiText', { upto: left }); left -= l.length + 1; });
  if (arrow && upto >= says.length) { rect(250, 321, 7, 1, 'uiText'); rect(251, 322, 5, 1, 'uiText'); rect(252, 323, 3, 1, 'uiText'); px(253, 324, 'uiText'); }
}

// A speech bubble whose tail tip is at (x, y), opening to the right.
function bubble(s, x, y, open = 1) {
  if (open <= 0) return;
  const bx = x + 5, by = y - 9;
  if (open < 1) { rect(bx, by + 3, 9, 9, 'outline'); rect(bx + 1, by + 4, 7, 7, 'paper'); return; }
  const w = P.textWidth(s) + 10, h = 15;
  rect(bx, by, w, h, 'outline'); rect(bx + 1, by + 1, w - 2, h - 2, 'paper');
  rect(x, y, 6, 2, 'outline'); rect(x + 2, y - 1, 4, 2, 'paper');
  text(s, bx + 5, by + 4, 'inkText');
}

// Arcade combo counter over the window.
function comboCounter(n, pop) {
  rect(13, 29, 72, 46, 'outline'); rect(14, 30, 70, 44, 'black'); rect(14, 30, 70, 1, 'amberDark');
  text('COMBO', 49, 34, 'face', { align: 'center' });
  const sc = pop ? 4 : 3, label = 'x' + n;
  text(label, 49 + 2, 46 + 2 - (pop ? 3 : 0), 'amberDark', { align: 'center', scale: sc });
  text(label, 49, 46 - (pop ? 3 : 0), 'face', { align: 'center', scale: sc });
}

// Pixel dissolve to black (amount 0..1) over a region.
function fade(amount, x0 = 0, y0 = 0, w = 270, h = 338, role = 'black') {
  if (amount <= 0) return;
  if (amount >= 1) { rect(x0, y0, w, h, role); return; }
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (bayer(x, y) < amount) px(x, y, role);
}

function booth({ expr = 'happy', msg, stampLabel, stampValue, emo, says, faceOpts }) {
  wall(); sign(); windowView(); clock(); cabinet(); pc(expr, faceOpts); counter(); desk();
  const color = P.style.ink[emo] || P.style.ink.default;
  inkPad(color); stampTool(240, 184);
  memo(msg, 50, 152, { stamp: stampLabel ? { label: stampLabel, value: stampValue, color, seed: 3 } : null });
  if (P.style.dither) P.dither(.45, 246);
  if (says) dialogue(expr, 'SUBTEXT', says);
}

function expressionSheet() {
  rect(0, 0, 270, 338, 'uiBg');
  text('SUBTEXT: EXPRESSIONS', 135, 7, 'uiName', { align: 'center' });
  const keys = ['deadpan', 'happy', 'smug', 'confused', 'squint', 'shocked', 'proud', 'sheepish', 'nervous', 'wink', 'sad', 'neutral'];
  keys.forEach((k, i) => {
    const cx = 6 + (i % 3) * 88, cy = 22 + Math.floor(i / 3) * 79;
    rect(cx + 11, cy, 66, 62, 'uiEdge');
    P.monitor(cx + 12, cy + 1, 64, 60, k);
    text(k, cx + 44, cy + 66, 'uiText', { align: 'center' });
  });
}

window.PIXSCENES = { booth, expressionSheet, wall, sign, windowView, clock, cabinet, pc, counter, desk, inkPad, stampTool, memo, stampY, dialogue, bubble, comboCounter, fade, bayer, MEMO_W, MEMO_H };
})();
