// SUBTEXT launch video: a 45 s pixel-art edit drawn at 270x338 and shown at 4x (1080x1350).
// render(t) draws one frame. EVENTS lists every sound cue, so soundtrack.py lands each hit on its frame.
// Scores come from scores.js (launch/predict_lines.py); reactions and jokes adapt to whatever the model says.
(() => {
'use strict';
const P = window.PIX, X = window.PIXSCENES, SC = window.SCORES;
const { rect, px, line, disc, box, text, tiny, wrap } = P;

const BPM = 105, B = 60 / BPM, BAR = 4 * B, T0 = 4.6;   // the cold open runs before the music starts at T0
const S = { title: T0, combo: T0 + BAR, factory: T0 + 5 * BAR, vs: T0 + 9 * BAR, sheet: T0 + 12 * BAR, cont: T0 + 15 * BAR };
const END = +(T0 + 17.5 * BAR + .4).toFixed(3);

const clamp = P.clamp, seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const E = {
  out: k => 1 - (1 - k) ** 3, in: k => k ** 3,
  inOut: k => (k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2),
  back: k => { const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; },
};

const EVENTS = [], IMPACTS = [];
const ev = (t, type, extra = {}) => EVENTS.push({ t: +t.toFixed(4), type, ...extra });
// A hit: the sound, a short freeze (stop), a camera punch (zoom held for `hold`) and shake.
function impact(t, fx, fy, { zoom = 5, hold = .18, stop = .1, kind = 'stamp' } = {}) { IMPACTS.push({ t, fx, fy, zoom, hold, stop }); ev(t, kind); }

// ---------- scores
const ranked = s => Object.entries(SC.lines[s].scores).sort((a, b) => b[1] - a[1]);
const pct = v => (v < .005 ? '<1%' : Math.round(v * 100) + '%');
const POSITIVE = new Set(['admiration', 'amusement', 'approval', 'caring', 'excitement', 'gratitude', 'joy', 'love', 'optimism', 'pride', 'relief']);
const EMO = {
  admiration: '#E9A23B', amusement: '#FF9F1C', anger: '#E5483B', annoyance: '#F07A2B', approval: '#8BC34A', caring: '#E58FB0',
  confusion: '#19B5AC', curiosity: '#2BB3D9', desire: '#D94F8A', disappointment: '#8494B8', disapproval: '#C8643F', disgust: '#7FA33A',
  embarrassment: '#FF8A80', excitement: '#FF6B35', fear: '#9A6AE0', gratitude: '#2FB36B', grief: '#6B7194', joy: '#FFD23F', love: '#F0507A',
  nervousness: '#B57BE8', optimism: '#F2C230', pride: '#C9A227', realization: '#40C4FF', relief: '#7ED7A8', remorse: '#7C8BFF',
  sadness: '#4F86D9', surprise: '#00C2D1', neutral: '#A29E94',
};
const LABELS = Object.keys(EMO).sort().filter(k => k !== 'neutral').concat('neutral');
const ABBR = { admiration: 'ADM', amusement: 'AMU', anger: 'ANG', annoyance: 'ANN', approval: 'APP', caring: 'CAR', confusion: 'CON', curiosity: 'CUR',
  desire: 'DES', disappointment: 'DSA', disapproval: 'DSP', disgust: 'DSG', embarrassment: 'EMB', excitement: 'EXC', fear: 'FEA', gratitude: 'GRA',
  grief: 'GRI', joy: 'JOY', love: 'LOV', nervousness: 'NER', optimism: 'OPT', pride: 'PRI', realization: 'REA', relief: 'REL', remorse: 'REM',
  sadness: 'SAD', surprise: 'SUR', neutral: 'NEU' };
// Ink: the booth palette's hand-picked inks, or the emotion colour muted towards the booth's olive.
function ink(emo) {
  const own = P.STYLES.booth.ink[emo];
  if (own) return own;
  const n = parseInt((EMO[emo] || '#9a3a2e').slice(1), 16), g = [0x6b, 0x66, 0x56];
  return '#' + [16, 8, 0].map((s, i) => Math.round(((n >> s) & 255) * .7 + g[i] * .3).toString(16).padStart(2, '0')).join('');
}
const stampOf = (s, seed) => { const [emo, v] = ranked(s)[0]; return { label: emo, value: pct(v), color: ink(emo), seed }; };
const footOf = s => 'ALSO: ' + ranked(s).slice(1, 3).map(([k, v]) => `${k} ${pct(v)}`).join(' · ');

// ---------- speech: typed letter by letter, one blip per letter
function speech(s, t0) {
  const times = [];
  let x = t0;
  for (const ch of s) { times.push(x); if (ch !== ' ') ev(x, 'blip', { ch }); x += /[.,?!:]/.test(ch) ? .16 : .045; }
  return { s, t0, end: x, times, shown: t => times.filter(v => v <= t).length, at: i => times[i] };
}

// =====================================================================================
// COLD OPEN: the booth, one memo, one stamp
// =====================================================================================
const OPEN = { text: 'Thanks for nothing!', from: 'Kamran, Finance', time: '9:41 AM' };
const openTop = ranked(OPEN.text)[0][0];
const OPEN_REACT = POSITIVE.has(openTop) ? ['happy', "Aw. You're welcome."]
  : openTop === 'neutral' ? ['deadpan', 'Noted. Sounds calm.'] : ['squint', 'Yeah. I caught that.'];
const C = { lamp: .06, crt: .36, memo: .75, read: 1.15, impact: 2.3, react: 2.72, box: 2.95, say: 3.08 };
const MEMO_X = 50, MEMO_Y = 152;
const SAY_OPEN = speech(OPEN_REACT[1], C.say);

// =====================================================================================
// COMBO: six memos, one per bar and then two per bar
// =====================================================================================
const REACT = { remorse: 'sad', sadness: 'sad', grief: 'sad', confusion: 'confused', curiosity: 'confused', disappointment: 'shocked', surprise: 'shocked',
  fear: 'nervous', nervousness: 'nervous', embarrassment: 'sheepish', optimism: 'squint', annoyance: 'squint', anger: 'shocked', disapproval: 'squint',
  disgust: 'squint', neutral: 'deadpan', realization: 'shocked', desire: 'smug' };
const reactTo = s => { const e = ranked(s)[0][0]; return REACT[e] || (POSITIVE.has(e) ? 'happy' : 'deadpan'); };
const COMBO = [
  { text: 'Sorry for the delay!', from: 'Bilal, Ops', time: '10:02 AM' },
  { text: 'Not sure if you saw my last message.', from: 'Sara, HR', time: '11:15 AM' },
  { text: "I'm not mad, just disappointed.", from: 'Your Manager', time: '4:58 PM', quip: 'Oof.' },
  { text: 'Can you hop on a quick call?', from: 'Client', time: '5:30 PM', quip: 'No.', expr: 'nervous' },
  { text: 'Wow. Okay.', from: 'Group chat', time: '6:12 PM' },
  { text: 'Hope this email finds you well.', from: 'Client, URGENT', time: '11:59 PM', quip: 'Bold.' },
];
const MEMOS = COMBO.map((m, i) => {
  const fast = i >= 2, bar = fast ? 2 + Math.floor((i - 2) / 2) : i, second = fast && (i - 2) % 2 === 1;
  const tin = S.combo + bar * BAR + (second ? 2 * B : 0);
  const hit = tin + (fast ? B : 2 * B);
  const tout = i === COMBO.length - 1 ? Infinity : tin + (fast ? 1.75 * B : 3.5 * B);
  const next = i === COMBO.length - 1 ? S.factory : null;
  return { ...m, i, tin, hit, tout, next, stamp: stampOf(m.text, i + 7), foot: footOf(m.text), expr: m.expr || reactTo(m.text) };
});
MEMOS.forEach((m, i) => { m.next = i < MEMOS.length - 1 ? MEMOS[i + 1].tin : S.factory; });

// The stamp tool flies from its rest spot to the memo, slams, and goes home.
const REST = [240, 184];
const TOOL = [{ t: C.impact, x: 135, y: MEMO_Y + X.stampY(OPEN) }, ...MEMOS.map(m => ({ t: m.hit, x: 135, y: MEMO_Y + X.stampY(m) }))];
function toolPose(t) {
  for (const { t: I, x, y } of TOOL) {
    if (t < I - .42 || t > I + .5) continue;
    if (t < I - .1) { const k = E.inOut(seg(t, I - .42, I - .12)); return [lerp(REST[0], x, k), lerp(REST[1], y, k), Math.round(8 * seg(t, I - .42, I - .3))]; }
    if (t < I) return [x, y, Math.round(8 * (1 - E.in(seg(t, I - .1, I))))];
    if (t < I + .14) return [x, y, 0];
    const k = E.inOut(seg(t, I + .14, I + .5));
    return [lerp(x, REST[0], k), lerp(y, REST[1], k), Math.round(8 * Math.sin(Math.PI * k))];
  }
  return [...REST, 0];
}

// Booth face: expression, gaze, blink and hop over time.
function boothFace(t) {
  const blinkOn = (t % 2.9) < .1;
  const read = (a, b) => t >= a && t < b ? { gaze: Math.round(Math.sin((t - a) * 12) * 2), gazeY: 2 } : null;
  if (t < T0) {
    if (t < C.crt + .35) return { expr: 'neutral', opts: { power: seg(t, C.crt, C.crt + .35) }, dy: 0 };
    if (t < C.impact) return { expr: 'neutral', opts: { blink: blinkOn ? 1 : 0, ...(read(C.read, C.impact - .2) || { gazeY: t > C.memo ? 2 : 0 }) }, dy: 0 };
    if (t < C.react) return { expr: 'shocked', opts: {}, dy: 0 };
    return { expr: OPEN_REACT[0], opts: {}, dy: -Math.round(3 * Math.sin(Math.PI * seg(t, C.react, C.react + .2))) };
  }
  let m = MEMOS[0];
  for (const mm of MEMOS) if (t >= mm.tin) m = mm;
  if (t < m.hit) return { expr: 'neutral', opts: { blink: blinkOn ? 1 : 0, ...(read(m.tin + .2, m.hit - .25) || { gazeY: 2 }) }, dy: 0 };
  if (t < m.hit + .12) return { expr: 'shocked', opts: {}, dy: 0 };
  return { expr: m.expr, opts: {}, dy: -Math.round(2 * Math.sin(Math.PI * seg(t, m.hit + .12, m.hit + .3))) };
}

function memoPos(tin, tout, t) {
  const kin = E.back(seg(t, tin, tin + .26)), kout = tout === Infinity ? 0 : E.in(seg(t, tout, tout + .24));
  return [MEMO_X - kout * 270, lerp(345, MEMO_Y, kin)];
}

function drawBooth(t) {
  X.wall(); X.sign(); X.windowView(); X.clock(t < T0 ? 41 : 41 + Math.floor((t - S.combo) * 6)); X.cabinet();
  const f = boothFace(t);
  X.pc(f.expr, f.opts, { dy: f.dy });
  X.counter(); X.desk();
  X.inkPad(P.STYLES.booth.ink.default);
  if (t < T0) {
    if (t >= C.memo) { const [x, y] = memoPos(C.memo, Infinity, t); X.memo(OPEN, x, y, t >= C.impact ? { stamp: stampOf(OPEN.text, 3), footnote: t >= C.react - .1 ? footOf(OPEN.text) : '' } : {}); }
  } else {
    for (const m of MEMOS) {
      if (t < m.tin || t > m.tout + .3) continue;
      const [x, y] = memoPos(m.tin, m.tout, t);
      X.memo(m, x, y, t >= m.hit ? { stamp: m.stamp, footnote: t >= m.hit + .15 ? m.foot : '' } : {});
    }
  }
  const [tx, ty, lift] = toolPose(t);
  X.stampTool(tx, ty, lift);
  P.dither(.45, 246);

  if (t < T0) {
    X.dialogue(OPEN_REACT[0], 'SUBTEXT', SAY_OPEN.s, { open: seg(t, C.box, C.box + .1), upto: SAY_OPEN.shown(t) });
  } else {
    const done = MEMOS.filter(m => t >= m.hit);
    if (done.length) X.comboCounter(done.length, t - done[done.length - 1].hit < .1);
    for (const m of MEMOS) if (m.quip && t >= m.hit + .3 && t < m.next) X.bubble(m.quip, 176, 50, seg(t, m.hit + .3, m.hit + .36) >= 1 ? 1 : .5);
  }
  // Lamp flicker on, before anything else is lit.
  if (t < .24) X.fade(t < .06 || (t > .1 && t < .16) ? 1 : .55);
}

// Cold open and combo cues.
ev(C.lamp, 'lamp'); ev(C.lamp + .1, 'lamp'); ev(C.lamp + .12, 'room', { until: T0 }); ev(C.crt, 'crt'); ev(C.memo, 'memo');
ev(C.read, 'read', { dur: C.impact - .2 - C.read });
TOOL.forEach(({ t }) => ev(t - .42, 'lift'));
impact(C.impact, 135, MEMO_Y + 50, { zoom: 5, hold: .42 });
ev(C.react, 'hop'); ev(C.box, 'box');
MEMOS.forEach(m => {
  ev(m.tin, 'memo'); impact(m.hit, 135, MEMO_Y + 50, { zoom: 5, hold: .16 }); ev(m.hit + .03, 'combo', { n: m.i + 1 });
  if (m.tout < Infinity) ev(m.tout, 'slide');
  if (m.quip) ev(m.hit + .3, 'bubble');
});

// =====================================================================================
// TITLE
// =====================================================================================
const TL = { letters: T0, sub1: T0 + B, sub2: T0 + 1.6 * B, pc: T0 + 2 * B, mostly: T0 + 3 * B };
const SUB1 = 'Reads the emotion in any text.', SUB2 = '28 emotions. One model.';
function drawTitle(t) {
  rect(0, 0, 270, 338, 'wall');
  for (let x = 44; x < 270; x += 45) { rect(x, 0, 1, 338, 'wallDark'); rect(x + 1, 0, 1, 338, 'wallLight'); }
  X.fade(.6);
  tiny('DEPT OF HIDDEN FEELINGS PRESENTS', 135, 66, 'signText', { align: 'center' });
  [...'SUBTEXT'].forEach((ch, i) => {
    const a = TL.letters + i * .035;
    if (t < a) return;
    const y = 82 - Math.round(8 * (1 - E.out(seg(t, a, a + .07))));
    text(ch, 33 + i * 30 + 2, y + 2, 'amberDark', { scale: 5 });
    text(ch, 33 + i * 30, y, 'face', { scale: 5 });
  });
  if (t >= TL.sub1) text(SUB1, 135, 132, 'uiText', { align: 'center', upto: Math.floor((t - TL.sub1) / .018) });
  if (t >= TL.sub2) text(SUB2, 135, 144, 'uiText', { align: 'center', upto: Math.floor((t - TL.sub2) / .018) });
  if (t >= TL.mostly) P.stamp('mostly', '', null, 204, 168, { color: ink('anger'), seed: 21 });
  if (t >= TL.pc) {
    const y = Math.round(lerp(345, 214, E.back(seg(t, TL.pc, TL.pc + .28))));
    P.monitor(103, y, 64, 60, t >= TL.mostly + .08 ? 'smug' : 'deadpan');
  }
}
[...'SUBTEXT'].forEach((_, i) => ev(TL.letters + i * .035, 'key'));
ev(T0, 'music', { part: 'intro' });
impact(T0, 135, 100, { zoom: 4, hold: 0, stop: 0, kind: 'logo' });
ev(TL.sub1, 'type', { n: SUB1.length }); ev(TL.sub2, 'type', { n: SUB2.length });
ev(TL.pc, 'memo');
impact(TL.mostly, 204, 168, { zoom: 4, hold: 0, stop: .08 });
ev(S.combo, 'music', { part: 'groove' });

// =====================================================================================
// FACTORY: inside SUBTEXT
// =====================================================================================
const ZOOM = S.factory, FX0 = S.factory + .22;
const F = { chop: S.factory + .4, belt: S.factory + BAR, layers: S.factory + BAR + .3, params: S.factory + BAR + .15, jars: S.factory + 2 * BAR + .1,
  thresh: S.factory + 3 * BAR, pop: S.factory + 3 * BAR + .14, stamp: S.factory + 3 * BAR + B };
const FLINE = COMBO[5].text;
const FSCORES = SC.lines[FLINE].scores;
const TOKENS = SC.lines[FLINE].tokens.map(s => s.replace('▁', '_'));
const TOK_W = TOKENS.map(s => P.textWidth(s) + 4), TOK_GAP = 2;
const TOK_X = [];
{ let x = Math.round((250 - (TOK_W.reduce((a, b) => a + b, 0) + TOK_GAP * (TOKENS.length - 1))) / 2); for (const w of TOK_W) { TOK_X.push(x); x += w + TOK_GAP; } }
const BELT_Y = 66, INTAKE_X = 250, BELT_SPEED = 120;
const chopAt = i => F.chop + i * B / 2;
const crateX = (i, t) => TOK_X[i] + Math.max(0, t - F.belt) * BELT_SPEED;
const crateIn = i => F.belt + (INTAKE_X - TOK_X[i]) / BELT_SPEED;
const HOT = LABELS.filter(k => FSCORES[k] > .3);
const FTOP = ranked(FLINE)[0];

function gear(cx, cy, r, a, role) {
  disc(cx, cy, r, 'outline'); disc(cx, cy, r - 1, role); disc(cx, cy, 2, 'outline');
  for (let k = 0; k < 8; k++) { const q = a + k * Math.PI / 4; rect(cx + Math.round(Math.cos(q) * (r + 1)) - 1, cy + Math.round(Math.sin(q) * (r + 1)) - 1, 3, 3, role); }
}
function drawFactory(t) {
  rect(0, 0, 270, 338, 'wallDark');
  for (let y = 0; y < 338; y += 24) rect(0, y, 270, 1, 'trim');
  rect(4, 0, 4, 338, 'pipe'); rect(5, 0, 1, 338, 'pipeLight'); rect(262, 0, 4, 338, 'pipe'); rect(263, 0, 1, 338, 'pipeLight');
  rect(85, 2, 100, 13, 'outline'); rect(86, 3, 98, 11, 'sign'); text('INSIDE SUBTEXT', 135, 5, 'signText', { align: 'center' });

  // Tokenizer: the sentence strip is chopped into token crates.
  tiny('TOKENIZER', 12, 20, 'signText');
  rect(10, 26, 250, 1, 'metalDark');
  TOKENS.forEach((tok, i) => {
    const c = chopAt(i), w = TOK_W[i];
    let x = TOK_X[i], y = 30, crate = false;
    if (t >= c) { const k = E.in(seg(t, c, c + .18)); y = Math.round(lerp(30, BELT_Y - 12, k)); crate = k >= 1; }
    if (crate) { x = Math.round(crateX(i, t)); if (x >= INTAKE_X) return; }
    if (crate) { rect(x, y, w, 12, 'outline'); rect(x + 1, y + 1, w - 2, 10, 'crate'); rect(x + 1, y + 1, w - 2, 1, 'crateLight'); rect(x + 1, y + 10, w - 2, 1, 'crateDark'); }
    else { rect(x, y, w, 12, 'outline'); rect(x + 1, y + 1, w - 2, 10, 'paper'); }
    const sp = tok.startsWith('_');
    if (sp) { text('_', x + 2, y + 3, crate ? 'crateDark' : 'paperShade'); text(tok.slice(1), x + 8, y + 3, crate ? 'black' : 'inkText'); }
    else text(tok, x + 2, y + 3, crate ? 'black' : 'inkText');
  });
  TOKENS.forEach((_, i) => {
    const c = chopAt(i);
    if (t < c - .05 || t > c + .06) return;
    const bx = TOK_X[i] + TOK_W[i], drop = Math.round(18 * E.out(seg(t, c - .05, c)));
    rect(bx - 1, 18 + drop, 4, 12, 'outline'); rect(bx, 19 + drop, 2, 10, 'metalLight');
  });

  // Conveyor and intake.
  rect(6, BELT_Y, 246, 9, 'outline'); rect(7, BELT_Y + 1, 244, 7, 'metalDark');
  const tread = Math.floor(Math.max(0, t - F.belt) * BELT_SPEED) % 8;
  for (let x = 7 + tread; x < 251; x += 8) rect(x, BELT_Y + 2, 3, 2, 'metal');
  for (const x of [10, 248]) { disc(x, BELT_Y + 4, 4, 'outline'); disc(x, BELT_Y + 4, 3, 'metalLight'); }
  rect(INTAKE_X, 50, 16, 28, 'outline'); rect(INTAKE_X + 1, 51, 14, 26, 'metal'); rect(INTAKE_X + 1, 51, 14, 2, 'metalLight');
  rect(254, 78, 8, 44, 'outline'); rect(255, 78, 6, 44, 'pipe'); rect(220, 114, 42, 8, 'outline'); rect(220, 115, 41, 6, 'pipe');

  // The 12-layer machine.
  box(40, 92, 180, 122, 'metal', 'metalLight', 'metalDark');
  rect(48, 96, 164, 12, 'black'); text('DeBERTa-v3-base', 130, 99, 'face', { align: 'center' });
  for (let i = 0; i < 12; i++) {
    const y = 112 + i * 8, L = F.layers + i * B / 4;
    rect(48, y, 164, 7, 'black');
    for (let j = 0; j < 20; j++) {
      const on = t >= L + j * .008;
      rect(50 + j * 8, y + 2, 6, 3, on ? (t < L + .35 ? 'face' : 'amberDark') : 'wallDark');
    }
    tiny(String(i + 1), 44, y + 1, 'metalDark', { align: 'right' });
  }
  const spin = clamp((t - F.belt) / .3) * (1 - clamp((t - (F.jars + 1)) / .5));
  const ang = Math.max(0, t - F.belt) * 5 * spin;
  gear(24, 130, 9, ang, 'metalLight'); gear(24, 160, 7, -ang * 1.3, 'metal'); gear(24, 186, 9, ang, 'metalLight');
  rect(52, 215, 166, 10, 'outline'); rect(53, 216, 164, 8, 'black');
  const n = Math.floor(184e6 * E.out(seg(t, F.params, F.params + 1.8)));
  tiny(`12 LAYERS · PARAMS ${n.toLocaleString('en-US')}`, 135, 218, 'face', { align: 'center' });

  // Pipes to the jars.
  rect(132, 225, 6, 4, 'pipe'); rect(10, 229, 250, 4, 'outline'); rect(10, 230, 250, 2, 'pipe');
  const flow = t >= F.jars && t < F.jars + 1.8;
  if (flow) for (let x = 12 + Math.floor(t * 90) % 10; x < 258; x += 10) rect(x, 230, 3, 2, 'face');

  // 28 jars. Fill = score; above the red 0.3 line counts as detected.
  LABELS.forEach((lab, i) => {
    const col = i % 14, row = Math.floor(i / 14), x = 11 + col * 18, y = row ? 280 : 238, h = 28;
    const v = FSCORES[lab], k = E.out(seg(t, F.jars + i * .05, F.jars + i * .05 + .35));
    const hot = v > .3 && t >= F.pop, dim = t >= F.pop + .1 && v <= .3;
    rect(x, y, 14, h, hot ? 'face' : 'outline'); rect(x + 1, y + 1, 12, h - 2, 'black');
    const lh = Math.round((h - 3) * v * k);
    if (lh > 0) { rect(x + 2, y + h - 2 - lh, 10, lh, ink(lab)); }
    rect(x + 1, y + 2, 1, h - 5, 'glass');
    const cork = hot ? Math.round(-12 * E.out(seg(t, F.pop, F.pop + .25))) : 0;
    rect(x + 3, y - 3 + cork, 8, 4, 'outline'); rect(x + 4, y - 2 + cork, 6, 2, 'crate');
    if (hot && t < F.pop + .5) for (const [dx, dy] of [[-3, -8], [16, -8], [6, -14]]) rect(x + dx, y + dy + cork, 2, 2, 'face');
    tiny(ABBR[lab], x + 7, y + h + 2, hot ? 'face' : 'signText', { align: 'center' });
    if (dim) X.fade(.5, x - 1, y - 4, 16, h + 11);
  });
  if (t >= F.thresh && (t > F.thresh + .3 || Math.floor((t - F.thresh) * 10) % 2 === 0))
    for (const y of [238 + 28 - 1 - Math.round(25 * .3), 280 + 28 - 1 - Math.round(25 * .3)]) for (let x = 9; x < 262; x += 3) rect(x, y, 2, 1, 'alarm');
  if (t >= F.stamp) P.stamp(FTOP[0], pct(FTOP[1]), null, 135, 276, { color: ink(FTOP[0]), seed: 31 });

  const caps = ['SPLIT INTO TOKENS', '12 LAYERS · 184M PARAMETERS', '28 EMOTIONS, EACH SCORED 0-1', 'OVER 0.3 = DETECTED'];
  const bar = clamp(Math.floor((t - S.factory) / BAR), 0, 3);
  text(caps[bar], 135, 319, 'uiText', { align: 'center' });
  if (bar === 3) tiny('TRAINED ON 43,410 REDDIT COMMENTS (GOEMOTIONS)', 135, 330, 'signText', { align: 'center' });
}
ev(ZOOM, 'zoom'); ev(ZOOM + .08, 'zoom'); ev(ZOOM + .16, 'flash');
ev(S.factory, 'music', { part: 'build' });
TOKENS.forEach((_, i) => { ev(chopAt(i), 'chop', { i }); ev(chopAt(i) + .18, 'crate'); });
ev(F.belt, 'belt');
TOKENS.forEach((_, i) => ev(crateIn(i), 'intake'));
for (let i = 0; i < 12; i++) ev(F.layers + i * B / 4, 'layer', { i });
for (let i = 0; i < 18; i++) ev(F.params + i * .1, 'tick');
ev(F.jars, 'pour');
for (let i = 0; i < 28; i++) ev(F.jars + i * .05, 'jar', { i, v: FSCORES[LABELS[i]] });
ev(F.thresh, 'alarm'); ev(F.pop, 'cork');
impact(F.stamp, 135, 276, { zoom: 5, hold: .3 });

// =====================================================================================
// VS SCREEN: the original paper's BERT-base vs SUBTEXT, macro F1
// =====================================================================================
const V = { slide: S.vs, slam: S.vs + .3, round: S.vs + BAR, bert: S.vs + BAR + .15, ours: S.vs + BAR + .85, win: S.vs + 2 * BAR, by: S.vs + 2 * BAR + .45, box: S.vs + 2 * BAR + .65 };
const SAY_VS = speech('I beat the paper. Slightly.', V.box + .12);
const BERT_ROLES = { pc: 'bert', pcLight: 'bertLight', pcShade: 'bertShade', pcDark: 'bertShade', screen: 'bertScreen', screenDark: 'black', face: 'bertFace', faceDim: 'bertShade' };
function vsBars(t) {
  rect(0, 149, 270, 14, 'outline'); rect(0, 150, 270, 12, 'black');
  const off = Math.round(-270 * (1 - E.out(seg(t, V.round, V.round + .22))));
  text('ROUND 1: MACRO F1', 135 + off, 153, 'uiText', { align: 'center' });
  [['BERT', .46, V.bert, 'bertLight', 'bertFace'], ['SUBTEXT', .49, V.ours, 'face', 'face']].forEach(([name, v, t0, labRole, fill], r) => {
    const y = 170 + r * 18, frac = (v - .40) / .12, k = E.out(seg(t, t0, t0 + .6));
    text(name, 10, y, labRole);
    rect(56, y - 1, 172, 9, 'outline'); rect(57, y, 170, 7, 'black');
    const blocks = Math.round(34 * frac * k);
    for (let b = 0; b < blocks; b++) rect(58 + b * 5, y + 1, 4, 5, fill);
    if (t >= t0) text((.40 + (v - .40) * k).toFixed(2), 234, y, labRole);
  });
  tiny('SCALE 0.40 TO 0.52', 257, 202, 'signText', { align: 'right' });
}
function drawVs(t, { frozen = false } = {}) {
  for (let y = 0; y < 338; y++) { const sx = 135 + Math.round((y - 169) * .3); rect(0, y, sx, 1, 'metalDark'); rect(sx, y, 270 - sx, 1, 'tieDark'); }
  for (let y = 0; y < 338; y++) for (let x = 0; x < 270; x++) { const sx = 135 + Math.round((y - 169) * .3); if (Math.abs(x - sx) < 6 && X.bayer(x, y) < .5) px(x, y, 'black'); }
  const k = E.out(seg(t, V.slide, V.slide + .28));
  if (!frozen && t < V.slide + .35) for (let i = 0; i < 14; i++) { const y = 20 + i * 9, len = 30 + (i * 37) % 60, x = (i * 53 + Math.floor(t * 900)) % 300 - 30; rect(x, y, len, 1, i % 2 ? 'bertLight' : 'tie'); }
  const bx = Math.round(lerp(-110, 14, k)), sx = Math.round(lerp(280, 156, k));
  const won = t >= V.win;
  P.withRoles(BERT_ROLES, () => P.monitor(bx, 36, 100, 86, won ? 'sad' : 'neutral', { label: 'BERT' }));
  const sayIdx = SAY_VS.s.indexOf('Slightly');
  const ourExpr = t >= SAY_VS.at(sayIdx) ? 'sheepish' : won ? 'proud' : t >= V.slam ? 'squint' : 'deadpan';
  P.monitor(sx, 36, 100, 86, ourExpr);
  if (k >= 1) {
    text('BERT-BASE', 64, 128, 'bertLight', { align: 'center' }); tiny('GOEMOTIONS PAPER (2020)', 64, 138, 'signText', { align: 'center' });
    text('SUBTEXT', 206, 128, 'face', { align: 'center' }); tiny('OURS · DEBERTA-V3-BASE', 206, 138, 'signText', { align: 'center' });
  }
  if (t >= V.slam) {
    const sc = 6 + Math.max(0, 3 - Math.floor((t - V.slam) * 30)), y = 74 - Math.round(3.5 * sc);
    for (let i = 0; i < 24; i++) { const fx = 104 + (i * 37) % 62, fy = y - 2 - ((Math.floor(t * 40) + i * 13) % 20); rect(fx, fy, 2, 2, i % 3 ? 'flame' : 'flameHot'); }
    text('VS', 135 + 3, y + 3, 'black', { align: 'center', scale: sc });
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) text('VS', 135 + dx, y + dy, 'alarm', { align: 'center', scale: sc });
    text('VS', 135, y, 'flameHot', { align: 'center', scale: sc });
  }
  if (t >= V.round) vsBars(t);
  if (won) {
    const sc = t - V.win < .07 ? 3 : 2, y = 207 - (sc - 2) * 4;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [2, 2]]) text('SUBTEXT WINS!', 135 + dx, y + dy, dx === 2 ? 'black' : 'alarm', { align: 'center', scale: sc });
    text('SUBTEXT WINS!', 135, y, 'flameHot', { align: 'center', scale: sc });
  }
  if (t >= V.by) tiny('...BY 0.03', 135, 225, 'uiText', { align: 'center' });
  if (t >= V.win) {
    tiny('MACRO F1, GOEMOTIONS TEST SET (5,427 COMMENTS)', 135, 233, 'signText', { align: 'center' });
    tiny('BERT-BASE SCORE AS REPORTED BY DEMSZKY ET AL., 2020', 135, 240, 'signText', { align: 'center' });
  }
  if (!frozen) X.dialogue(ourExpr, 'SUBTEXT', SAY_VS.s, { open: seg(t, V.box, V.box + .1), upto: SAY_VS.shown(t) });
}
ev(S.vs, 'music', { part: 'drop' });
ev(V.slide, 'whoosh');
impact(V.slam, 135, 74, { zoom: 5, hold: .2, kind: 'vs' });
ev(V.round, 'round'); ev(V.bert, 'fill', { dur: .6, n: 17 }); ev(V.ours, 'fill', { dur: .6, n: 25 });
impact(V.win, 135, 214, { zoom: 4, hold: 0, stop: .08, kind: 'win' });
ev(V.box, 'box');

// =====================================================================================
// STAT SHEET: strengths and weaknesses, RPG status menu
// =====================================================================================
const SARC = 'Love that for you.', sarcTop = ranked(SARC)[0];
const SARC_MISS = POSITIVE.has(sarcTop[0]) || sarcTop[0] === 'neutral';
const SH = { open: S.sheet, rows: S.sheet + .55, weak: S.sheet + BAR, sarc: S.sheet + BAR + .3, box: S.sheet + BAR + .75, nerv: S.sheet + 2 * BAR, box2: S.sheet + 2 * BAR + .1 };
const SAY_SARC = speech(SARC_MISS ? 'Sarcasm? Still learning.' : 'Sarcasm? Caught that one.', SH.box + .1);
const SAY_NERV = speech('Nervousness: 0.17. Same, honestly.', SH.box2);
const SAME_AT = SAY_NERV.at(SAY_NERV.s.indexOf('Same'));
const STRENGTHS = [['GRATITUDE', .89, 'gratitude'], ['AMUSEMENT', .83, 'amusement'], ['LOVE', .74, 'love']];
function statBar(x, y, v, k, role) {
  rect(x, y, 122, 8, 'outline'); rect(x + 1, y + 1, 120, 6, 'black');
  const blocks = Math.round(24 * v * k);
  for (let b = 0; b < blocks; b++) rect(x + 2 + b * 5, y + 2, 4, 4, role);
}
function drawSheet(t) {
  drawVs(S.sheet - .001, { frozen: true }); X.fade(.6);
  const y0 = Math.round(lerp(-240, 6, E.out(seg(t, SH.open, SH.open + .22))));
  rect(6, y0, 258, 236, 'uiEdge'); rect(8, y0 + 2, 254, 232, 'uiBg'); rect(10, y0 + 4, 250, 228, 'uiShadow'); rect(11, y0 + 5, 248, 226, 'uiBg');
  const nervous = t >= SH.nerv + .1;
  const expr = nervous ? 'nervous' : t >= SH.box ? (SARC_MISS ? 'sheepish' : 'smug') : 'deadpan';
  rect(15, y0 + 11, 62, 58, 'uiEdge'); P.monitor(16, y0 + 12, 60, 56, expr);
  text('SUBTEXT', 84, y0 + 13, 'uiName', { scale: 2 });
  text('LV 1 · EMOTION READER', 84, y0 + 32, 'uiText');
  tiny('CLASS: DEBERTA-V3-BASE', 84, y0 + 45, 'signText'); tiny('XP: 43,410 REDDIT COMMENTS', 84, y0 + 53, 'signText'); tiny('PARAMS: 184M', 84, y0 + 61, 'signText');
  rect(14, y0 + 75, 242, 1, 'uiEdge');
  text('STRENGTHS', 16, y0 + 81, 'uiName');
  STRENGTHS.forEach(([name, v, emo], i) => {
    const t0 = SH.rows + i * B, y = y0 + 93 + i * 12;
    if (t < t0) return;
    text(name, 16, y, 'uiText'); statBar(100, y, v, E.out(seg(t, t0, t0 + .3)), ink(emo)); text(v.toFixed(2), 228, y, 'uiText');
  });
  rect(14, y0 + 131, 242, 1, 'uiEdge');
  if (t >= SH.weak) text('WEAKNESSES', 16, y0 + 137, 'alarm');
  if (t >= SH.sarc) {
    text('SARCASM', 16, y0 + 149, 'uiText');
    text(SARC_MISS ? 'NOT DETECTED' : 'DETECTED', 100, y0 + 149, SARC_MISS ? 'alarm' : 'plant');
    tiny(`'${SARC.toUpperCase()}' > ${sarcTop[0]} ${pct(sarcTop[1])}`, 16, y0 + 160, 'signText', { upto: Math.floor((t - SH.sarc) / .02) });
  }
  if (t >= SH.nerv) {
    const flash = nervous && Math.floor(t * 8) % 2 === 0;
    text('NERVOUSNESS', 16, y0 + 175, flash ? 'alarm' : 'uiText');
    statBar(100, y0 + 175, .17, E.out(seg(t, SH.nerv + .1, SH.nerv + .5)), 'alarm'); text('0.17', 228, y0 + 175, flash ? 'alarm' : 'uiText');
    tiny('ONLY 23 EXAMPLES IN THE TEST SET', 16, y0 + 186, 'signText');
  }
  tiny('PER-EMOTION F1, GOEMOTIONS TEST SET', 135, y0 + 222, 'signText', { align: 'center' });
  if (t < SH.box2) X.dialogue(expr, 'SUBTEXT', SAY_SARC.s, { open: seg(t, SH.box, SH.box + .1), upto: SAY_SARC.shown(t) });
  else X.dialogue(expr, 'SUBTEXT', SAY_NERV.s, { upto: SAY_NERV.shown(t), faceOpts: {} });
}
ev(S.sheet, 'music', { part: 'groove' }); ev(SH.open, 'menu');
STRENGTHS.forEach((_, i) => ev(SH.rows + i * B, 'row'));
ev(SH.weak, 'alarm'); ev(SH.sarc, 'row'); ev(SH.box, 'box'); ev(SH.nerv, 'row'); ev(SH.nerv + .1, 'sweat');
ev(SAME_AT - .02, 'music', { part: 'stop' });

// =====================================================================================
// CONTINUE?
// =====================================================================================
const CO = { count: S.cont, insert: S.cont + 3 * B, live: S.cont + 4 * B, link: S.cont + 5 * B, credits: S.cont + 6 * B, wink: S.cont + 8.5 * B };
const LIVE = 'SUBTEXT is live. Try to fool it.', LINK = 'LIVE DEMO + CODE: LINK IN THE POST';
function drawContinue(t) {
  rect(0, 0, 270, 338, 'black');
  for (let y = 0; y < 338; y += 2) rect(0, y, 270, 1, 'uiShadow');
  text('CONTINUE?', 135, 20, 'face', { align: 'center', scale: 3 });
  const n = 9 - clamp(Math.floor((t - CO.count) / B), 0, 2);
  if (t < CO.insert + 2 * B || Math.floor(t * 4) % 2 === 0) {
    text(String(n), 137, 52, 'amberDark', { align: 'center', scale: 8 });
    text(String(n), 135, 50, 'face', { align: 'center', scale: 8 });
  }
  if (t >= CO.insert) {
    const y = Math.round(lerp(345, 116, E.back(seg(t, CO.insert, CO.insert + .3))));
    P.monitor(103, y, 64, 60, t >= CO.wink ? 'wink' : 'happy');
    if (Math.floor((t - CO.insert) * 2.5) % 2 === 0) text('INSERT TEXT TO CONTINUE', 135, 186, 'face', { align: 'center' });
  }
  if (t >= CO.live) text(LIVE, 135, 202, 'uiText', { align: 'center', upto: Math.floor((t - CO.live) / .02) });
  if (t >= CO.link) text(LINK, 135, 216, 'uiName', { align: 'center', upto: Math.floor((t - CO.link) / .02) });
  if (t >= CO.credits) {
    rect(40, 234, 190, 1, 'uiEdge');
    tiny('BUILT BY', 135, 244, 'signText', { align: 'center' });
    text('Muhammad Umer', 135, 254, 'uiText', { align: 'center' });
    text('Muhammad Ahmed Bajwa', 135, 265, 'uiText', { align: 'center' });
    text('Muhammad Shayan Qadir', 135, 276, 'uiText', { align: 'center' });
    tiny('AI COURSE PROJECT · FAST-NUCES LAHORE', 135, 292, 'signText', { align: 'center' });
    tiny('GITHUB.COM/SILVERUMER21/EMOTION-DETECTION-IN-TEXT', 135, 302, 'face', { align: 'center' });
  }
}
ev(S.cont, 'music', { part: 'outro' });
for (let i = 0; i < 3; i++) ev(CO.count + i * B, 'count', { n: 9 - i });
ev(CO.insert, 'insert'); ev(CO.live, 'type', { n: LIVE.length }); ev(CO.link, 'type', { n: LINK.length }); ev(CO.credits, 'row');
ev(CO.wink, 'wink'); ev(T0 + 17.5 * BAR, 'music', { part: 'end' });
EVENTS.sort((a, b) => a.t - b.t);

// =====================================================================================
function remap(t) { for (const I of IMPACTS) if (t >= I.t && t < I.t + I.stop) return I.t; return t; }
function shake(t) {
  let x = 0, y = 0;
  for (const I of IMPACTS) { const d = t - I.t; if (d < 0 || d > .3) continue; const a = 3 * Math.exp(-d * 14); x += a * Math.sin(d * 90); y += a * Math.cos(d * 70); }
  return [Math.round(x), Math.round(y)];
}
function camera(t) {
  let cam = { zoom: 4, fx: 135, fy: 169 };
  for (const I of IMPACTS) if (t >= I.t && t < I.t + I.hold) cam = { zoom: I.zoom, fx: I.fx, fy: I.fy };
  if (t >= ZOOM && t < ZOOM + .16) cam = { zoom: t < ZOOM + .08 ? 5 : 6, fx: 135, fy: 62 };
  const [sx, sy] = shake(t);
  return { ...cam, sx, sy };
}

let out;
function render(t) {
  const tt = remap(t);
  P.begin('booth');
  if (tt < T0) drawBooth(tt);
  else if (tt < S.combo) drawTitle(tt);
  else if (tt < ZOOM + .16) drawBooth(tt);
  else if (tt < FX0) rect(0, 0, 270, 338, 'paper');
  else if (tt < S.vs) { drawFactory(tt); X.fade(seg(tt, S.vs - .12, S.vs)); X.fade(1 - seg(tt, FX0, FX0 + .1)); }
  else if (tt < S.sheet) { drawVs(tt); X.fade(1 - seg(tt, S.vs, S.vs + .1)); }
  else if (tt < S.cont) { drawSheet(tt); X.fade(seg(tt, S.cont - .12, S.cont)); }
  else { drawContinue(tt); X.fade(1 - seg(tt, S.cont, S.cont + .1)); }
  if (SC.placeholder && !window.HIDE_PLACEHOLDER_TAG) { rect(194, 0, 76, 9, 'black'); tiny('PLACEHOLDER SCORES', 268, 2, 'alarm', { align: 'right' }); }
  P.present(out, camera(t));
}

window.SUB = { END, BPM, EVENTS, S, T0, OPEN, OPEN_REACT, ranked, pct, ink, stampOf, footOf };
window.ready = document.fonts.load('400 21px Anton').then(() => {
  out = document.getElementById('c');
  if (window.NO_AUTO_RENDER) return true;
  const q = new URLSearchParams(location.search);
  if (q.has('play')) { const st = performance.now(); const loop = () => { render(((performance.now() - st) / 1000) % END); requestAnimationFrame(loop); }; loop(); }
  else render(+(q.get('t') || 2.9));
  return true;
});
window.render = t => render(t);
})();
