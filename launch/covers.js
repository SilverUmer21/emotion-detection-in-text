// The four launch covers, drawn in the video's booth style at their native size and shown at exactly 4x.
//   thumbnail 1080x1350 (video poster) · banner 1584x396 (LinkedIn profile) · github 1280x640 (social preview) · featured 1200x628
(() => {
'use strict';
const P = window.PIX, X = window.PIXSCENES, V = window.SUB, SC = window.SCORES;
const { rect, text, tiny } = P;

const COVERS = {
  thumbnail: { w: 270, h: 338, oh: 1350 },   // the video's own 2 px crop
  banner: { w: 396, h: 99 },
  github: { w: 320, h: 160 },
  featured: { w: 300, h: 157 },
};

function wallStrip(w, h, wainscot) {
  rect(0, 0, w, h, 'wall');
  for (let x = 44; x < w; x += 45) { rect(x, 0, 1, wainscot, 'wallDark'); rect(x + 1, 0, 1, wainscot, 'wallLight'); }
  rect(0, wainscot, w, h - wainscot, 'wallDark'); rect(0, wainscot, w, 2, 'trim');
  for (let x = 9; x < w; x += 18) rect(x, wainscot + 2, 1, h - wainscot - 2, 'trim');
}
function plate(x, y, w, h) { rect(x, y, w, h, 'outline'); rect(x + 1, y + 1, w - 2, h - 2, 'black'); rect(x + 1, y + 1, w - 2, 1, 'amberDark'); }
function tie(cx, y, len) {
  rect(cx - 5, y, 10, 5, 'outline'); rect(cx - 4, y + 1, 8, 3, 'tie');
  for (let i = 0; i < len; i++) {
    const w = i < len - 6 ? 5 + Math.min(i, 10) * .5 : 10 - (i - (len - 6)) * 1.7, x0 = cx - w / 2;
    rect(x0 - 1, y + 5 + i, w + 2, 1, 'outline');
    for (let x = 0; x < w; x++) P.px(x0 + x, y + 5 + i, (x + i) % 6 < 2 ? 'tieDark' : 'tie');
  }
}
function placeholderTag(w) {
  if (!SC.placeholder) return;
  rect(w - 76, 0, 76, 9, 'black'); tiny('PLACEHOLDER SCORES', w - 2, 2, 'alarm', { align: 'right' });
}

// Video poster: the cold open's stamp moment plus the hook.
function thumbnail() {
  X.wall(); X.sign(); X.windowView(); X.clock(); X.cabinet(); X.pc(V.OPEN_REACT[0]); X.counter(); X.desk();
  X.inkPad(P.STYLES.booth.ink.default); X.stampTool(240, 184);
  X.memo(V.OPEN, 50, 152, { stamp: V.stampOf(V.OPEN.text, 3), footnote: V.footOf(V.OPEN.text) });
  P.dither(.45, 256);
  plate(-1, 254, 272, 85);
  text('IT READS BETWEEN', 135, 265, 'face', { align: 'center', scale: 2 });
  text('THE LINES.', 40, 287, 'face', { scale: 2 });
  P.stamp('mostly', '', null, 206, 299, { color: V.ink('anger'), seed: 21 });
  tiny('SUBTEXT · AN AI THAT READS THE EMOTION IN TEXT', 135, 318, 'signText', { align: 'center' });
  tiny('28 EMOTIONS · DEBERTA-V3 · GOEMOTIONS', 135, 326, 'signText', { align: 'center' });
  placeholderTag(270);
}

// LinkedIn banner. The profile photo covers the bottom-left, so everything that matters sits centre-right.
function banner() {
  wallStrip(396, 99, 72);
  P.dither(.35);
  P.ctx.translate(0, -6); X.windowView(); P.ctx.translate(0, 6);
  rect(0, 90, 396, 9, 'counter'); rect(0, 90, 396, 1, 'counterLight');
  plate(96, 10, 192, 78);
  text('I BUILD AI THAT', 104, 17, 'uiText', { scale: 2 });
  text('READS BETWEEN', 104, 35, 'face', { scale: 2 });
  text('THE LINES.', 104, 53, 'face', { scale: 2 });
  tiny('NLP · DEEP LEARNING · MLOPS', 104, 72, 'signText');
  tiny('FAST-NUCES LAHORE · GITHUB.COM/SILVERUMER21', 104, 79, 'signText');
  P.monitor(296, 12, 64, 58, 'happy');
  rect(320, 70, 16, 4, 'pcShade'); tie(328, 70, 14);
}

// GitHub social preview (keeps a 10 px safe border).
function github() {
  wallStrip(320, 160, 120);
  P.dither(.35, 140);
  rect(0, 140, 320, 20, 'counter'); rect(0, 140, 320, 2, 'counterLight'); rect(0, 158, 320, 2, 'counterDark');
  P.monitor(20, 22, 100, 86, 'happy');
  rect(60, 108, 20, 6, 'pcShade'); tie(70, 110, 24);
  plate(132, 14, 178, 116);
  text('SUBTEXT', 140, 22, 'face', { scale: 3 });
  text('emotion-detection-in-text', 140, 50, 'uiText');
  tiny('MULTI-LABEL EMOTION DETECTION', 140, 62, 'signText');
  tiny('DEBERTA-V3-BASE · GOEMOTIONS · 28 LABELS', 140, 70, 'signText');
  P.stamp('macro f1', '0.49', null, 221, 100, { color: V.ink('gratitude'), seed: 41 });
}

// LinkedIn Featured card for the live demo: the video's continue screen.
function featured() {
  rect(0, 0, 300, 157, 'black');
  for (let y = 0; y < 157; y += 2) rect(0, y, 300, 1, 'uiShadow');
  rect(4, 4, 292, 149, 'amberDark'); rect(5, 5, 290, 147, 'black');
  for (let y = 5; y < 152; y += 2) rect(5, y, 290, 1, 'uiShadow');
  P.monitor(18, 30, 88, 76, 'wink');
  text('SUBTEXT', 118, 20, 'face', { scale: 3 });
  text('IS LIVE.', 118, 46, 'face', { scale: 2 });
  text('Try to fool it.', 118, 68, 'uiText');
  tiny('TYPE ANY MESSAGE. GET 28 EMOTION SCORES.', 118, 82, 'signText');
  P.stamp('live demo', '', null, 236, 108, { color: V.ink('anger'), seed: 51 });
  text('INSERT TEXT TO CONTINUE', 150, 134, 'face', { align: 'center' });
}

const DRAW = { thumbnail, banner, github, featured };
window.COVERS = COVERS;
window.drawCover = kind => {
  const { w, h, oh } = COVERS[kind], out = document.getElementById('c');
  out.width = w * P.SCALE; out.height = oh || h * P.SCALE;
  P.begin('booth', w, h);
  DRAW[kind]();
  P.present(out);
};
window.ready = window.ready.then(() => {
  window.drawCover(new URLSearchParams(location.search).get('kind') || 'thumbnail');
  return true;
});
})();
