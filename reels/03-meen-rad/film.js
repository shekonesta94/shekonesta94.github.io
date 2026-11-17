// مين اللي رد؟ — Nesta ad 3. Pure function of time: window.seek(t) paints frame t.
// A game-show studio: two podiums, a split-flap board, follow-spots. The camera travels the one stage
// behind the light; whatever the spot lands on is the next shot. Timed on the placed VO (+0.29 s).
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, wobble, font, rrect, hash01, mix, TAU } = M;

const C = {
  wall: '#1C2230', wall2: '#252D3E', floor: '#141923', ink: '#F4EFE6', dim: '#8C93A3', yellow: '#FFC845',
  mint: '#41ECAE', mintInk: '#06281C', tile: '#10141C', tile2: '#171C27', navy: '#0F1E33', screen: '#EEF2F5',
};
const D = 'Display', UI = 'UI';
const O = 0.29;
const T = (s) => s + O;
const B = (t) => t / 0.499983;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);

// VO phrases (film seconds)
const V = {
  a1: T(0.15), b1: T(1.65), c1: T(3.01), a2: T(4.53), b2: T(6.06), a3: T(8.02), b3: T(9.51), a4: T(11.71), b4: T(12.61),
  a5: T(13.94), b5: T(16.83), a6: T(18.66), b6: T(20.28), a7: T(21.99), b7: T(22.96), a8: T(25.21), b8: T(27.06),
};

// ---------------------------------------------------------------- stage layout (world px)
const S = { A: [-300, 560], B: [300, 560], board: [0, -620], cards: [700, 330], screen: [0, -1530], floorY: 700 };

// ---------------------------------------------------------------- split-flap board messages
// each message: [t, rows]; a row is a list of cells (Arabic: one word per cell, so letters stay joined;
// digits/Latin: one character per cell). {c:'..', col} for a coloured cell.
const Y = (c) => ({ c, col: C.yellow }), MN = (c) => ({ c, col: C.mint });
const chars = (s, col) => [...s].map((c) => ({ c: c === ' ' ? '' : c, col }));
const BOARD = [
  [-1, [['مين', 'اللي', Y('رد؟')], chars('A   VS   B', C.dim)]],
  [T(9.51) + 0.4, [['الساعة'], chars('3:02 AM', C.yellow)]],
  [V.b4, [[MN('بوت'), MN('نستا')], chars('NESTA BOT', C.mint)]],
  [V.a5 + 0.2, [['عربي', Y('+'), 'English'], chars('AR + EN', C.dim)]],
  [V.b5, [['من', 'بياناتك', Y('بس')], chars('YOUR DATA', C.dim)]],
  [V.a6 + 0.05, [['الاسم', 'الميعاد', 'الحالة'], ['منى', 'الأربعاء 5:00', MN('مؤكد')]]],
  [V.a7 + 0.1, [['الموظف'], ['الشغل', 'المهم', Y('بس')]]],
  [V.a8 + 0.1, [['ابعت', MN('ديمو')], chars('010 9311 4446', C.ink)]],
];
const FLIP = 0.22, STAG = 0.05;
function boardMsgAt(t) { let i = 0; while (i < BOARD.length - 1 && t >= BOARD[i + 1][0]) i++; return i; }

// ---------------------------------------------------------------- hits
const HITS = [
  [B(0.02), 'board', 'type', { len: 0.5, n: 8 }],
  [B(V.c1), 'guess', 'tok', { pitch: 'C5' }], [B(V.c1 + 0.45), 'guess2', 'tok', { pitch: 'F5' }],
  [B(4.75), 'dolly to A', 'whoosh', { len: 0.4, pan: -0.4 }], [B(6.3), 'dolly to B', 'whoosh', { len: 0.4, pan: 0.4 }],
  [B(5.6), 'check A', 'click'], [B(7.4), 'check B', 'click'],
  [B(V.a3), 'lights down', 'swell'],
  [B(V.b3 + 0.4), 'board 3:02', 'type', { len: 0.45, n: 7 }],
  [B(V.a4 - 0.35), 'riser', 'riser', { len: 0.35 }],
  [B(V.a4), 'REVEAL', 'impact'],
  [B(V.a4 + 0.05), 'buzzer', 'bell', { pitch: 'C6' }],
  [B(V.b4), 'board nesta', 'type', { len: 0.5, n: 9 }],
  [B(V.a5 - 0.3), 'into phone', 'whoosh', { len: 0.4 }],
  [B(V.a5 + 0.6), 'arabic', 'blip', { pitch: 'A6' }], [B(V.a5 + 1.5), 'english', 'blip', { pitch: 'E6' }],
  [B(V.b5 + 0.1), 'cards', 'tok', { pitch: 'F5' }], [B(V.b5 + 0.35), 'cards2', 'tok', { pitch: 'A5' }], [B(V.b5 + 0.6), 'cards3', 'tok', { pitch: 'C6' }],
  [B(V.a6 - 0.3), 'up to board', 'whoosh', { len: 0.45, from: 600, to: 1800 }],
  [B(V.a6 + 0.05), 'sheet row', 'type', { len: 0.7, n: 9 }],
  [B(V.b6 + 0.4), 'confirmed', 'bell', { pitch: 'G6' }],
  [B(V.a7 - 0.3), 'back to A', 'whoosh', { len: 0.4, pan: -0.4 }],
  [B(V.b7 + 0.2), 'task 1', 'click'], [B(V.b7 + 0.6), 'task 2', 'click'], [B(V.b7 + 1.0), 'task 3', 'click'],
  [B(V.a8 - 0.4), 'tilt up', 'whoosh', { len: 0.5, from: 500, to: 1600 }],
  [B(V.a8 + 0.1), 'screen on', 'sub', { len: 0.6 }],
  [B(V.a8 + 0.45), 'logo', 'bell', { pitch: 'F6' }],
  [B(V.a8 + 0.3), 'cta board', 'type', { len: 0.9, n: 12 }],
  [B(29.6), 'spots cross', 'swell'],
];

// ---------------------------------------------------------------- camera (one stage, follows the light)
const CAMK = [
  [0, 0, 10, 1.02], [4.55, 0, 40, 1.08], [5.05, -300, 330, 1.5], [6.15, -300, 330, 1.56], [6.6, 300, 330, 1.5], [8.0, 300, 330, 1.56],
  [8.55, 0, 280, 1.28], [9.9, 0, 280, 1.32], [10.5, 300, 265, 1.75], [11.55, 300, 265, 1.82], [12.0, 0, 90, 1.08], [13.95, 0, 110, 1.12],
  [14.35, 300, 260, 1.55], [16.6, 330, 260, 1.6], [17.2, 520, 280, 1.3], [18.6, 520, 280, 1.33], [19.15, 0, -560, 1.25], [21.95, 0, -560, 1.3],
  [22.45, -300, 330, 1.5], [25.1, -300, 330, 1.56], [25.75, 0, -1080, 1.08], [32, 0, -1080, 1.11],
];
function camera(t) {
  let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1][0]) i++;
  const [t0, x0, y0, z0] = CAMK[i], [t1, x1, y1, z1] = CAMK[i + 1];
  const p = clamp((t - t0) / (t1 - t0)), e = E.inOutCubic(p), dist = Math.hypot(x1 - x0, y1 - y0);
  const pull = 1 - Math.min(0.3, dist / 5000) * Math.sin(Math.PI * p);
  return { x: lerp(x0, x1, e), y: lerp(y0, y1, e), z: lerp(z0, z1, e) * pull, m: dist > 60 ? Math.sin(Math.PI * p) : 0 };
}
// the two follow-spots: where each beam lands (world), keyed like the camera
const SPOTK = [
  [0, [-300, 560], [300, 560], 1], [V.c1, [-300, 560], [300, 560], 1], [V.c1 + 0.3, [300, 560], [-300, 560], 1], [V.c1 + 0.8, [-300, 560], [300, 560], 1],
  [4.7, [-300, 560], [-300, 560], 1], [6.3, [-300, 560], [300, 560], 1], [8.3, [-300, 560], [300, 560], 0.55],
  [10.2, [300, 420], [300, 420], 0.6], [11.9, [300, 560], [300, 560], 1.3], [14.1, [300, 560], [700, 380], 1], [18.8, [-180, -620], [180, -620], 1],
  [22.2, [-300, 560], [-300, 560], 1], [25.4, [-200, -1530], [200, -1530], 1.2], [29.4, [-200, -1530], [200, -1530], 1.2], [30.2, [220, -1530], [-220, -1530], 1.2],
];
function spots(t) {
  let i = 0; while (i < SPOTK.length - 1 && t >= SPOTK[i + 1][0]) i++;
  if (i >= SPOTK.length - 1) return SPOTK[i];
  const a = SPOTK[i], b = SPOTK[i + 1], p = E.inOutCubic(clamp((t - a[0]) / Math.min(0.45, b[0] - a[0]) - (b[0] - a[0] > 0.45 ? (b[0] - a[0] - 0.45) / Math.min(0.45, b[0] - a[0]) : 0)));
  const q = E.inOutCubic(clamp((t - (b[0] - 0.45)) / 0.45));
  return [t, [lerp(a[1][0], b[1][0], q), lerp(a[1][1], b[1][1], q)], [lerp(a[2][0], b[2][0], q), lerp(a[2][1], b[2][1], q)], lerp(a[3], b[3], q)];
}

// ---------------------------------------------------------------- type helpers
function tA(ctx, s, x, y, size, color, { face = UI, weight = 700, align = 'center' } = {}) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function tL(ctx, s, x, y, size, color, align = 'center', face = UI, weight = 700) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
const isLatin = (s) => /^[A-Za-z0-9+:.\s]*$/.test(s);
function check(ctx, x, y, s, col, w = 8) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.4); ctx.stroke(); ctx.restore(); }

// ---------------------------------------------------------------- split-flap board
function cellText(ctx, cell, x, y, h, size) {
  if (!cell || !cell.c) return;
  const s = cell.c, col = cell.col || C.ink;
  if (isLatin(s)) tL(ctx, s, x, y + size * 0.36, size, col, 'center', D, 700);
  else tA(ctx, s, x, y + size * 0.36, size, col, { face: D, weight: 700 });
}
function rowLayout(ctx, row, rowW, h, size) {
  // cell widths from content (words) or fixed (single chars)
  ctx.font = font(size, 700, D);
  const ws = row.map((c) => { const s = typeof c === 'string' ? c : c.c; return s && s.length > 1 ? ctx.measureText(s).width + size * 0.9 : h * 0.72; });
  const gap = 10, tot = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
  const k = Math.min(1, rowW / tot);
  // RTL: first cell on the right (Latin rows read LTR)
  const latin = row.every((c) => isLatin(typeof c === 'string' ? c : c.c));
  let x = latin ? -tot * k / 2 : tot * k / 2; const out = [];
  ws.forEach((w) => { const ww = w * k; out.push(latin ? x + ww / 2 : x - ww / 2); x += latin ? ww + gap * k : -(ww + gap * k); });
  return { xs: out, ws: ws.map((w) => w * k), k };
}
function drawTile(ctx, x, y, w, h, cur, prev, p, size) {
  // p: 0..1 flip from prev -> cur. Top half shows cur behind, bottom shows prev until the flap passes.
  const r = 10;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; rrect(ctx, -w / 2 + 3, -h / 2 + 7, w, h, r); ctx.fill();
  const half = (top, cell) => {
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, top ? -h / 2 : 0, w, h / 2); ctx.clip();
    ctx.fillStyle = top ? C.tile2 : C.tile; rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.fill();
    cellText(ctx, cell, 0, 0, h, size); ctx.restore();
  };
  half(true, p > 0 ? cur : prev); half(false, p >= 0.5 ? cur : prev);
  if (p > 0 && p < 1) {   // the falling flap
    ctx.save();
    if (p < 0.5) { const s = Math.cos(p * Math.PI); ctx.scale(1, s); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h / 2); ctx.clip(); ctx.fillStyle = C.tile2; rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.fill(); cellText(ctx, prev, 0, 0, h, size); ctx.fillStyle = `rgba(0,0,0,${0.5 * (1 - s)})`; ctx.fillRect(-w / 2, -h / 2, w, h / 2); }
    else { const s = -Math.cos(p * Math.PI); ctx.scale(1, s); ctx.beginPath(); ctx.rect(-w / 2, 0, w, h / 2); ctx.clip(); ctx.fillStyle = C.tile; rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.fill(); cellText(ctx, cur, 0, 0, h, size); ctx.fillStyle = `rgba(255,255,255,${0.12 * (1 - s)})`; ctx.fillRect(-w / 2, 0, w, h / 2); }
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-w / 2, -1.5, w, 3);
  ctx.restore();
}
function board(ctx, t) {
  const [bx, by] = S.board, BW = 960, rowH = [150, 120], size = [78, 64];
  // housing
  ctx.save(); ctx.translate(bx, by);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -BW / 2 - 30 + 8, -200 + 16, BW + 60, 400, 30); ctx.fill();
  ctx.fillStyle = '#0B0E14'; rrect(ctx, -BW / 2 - 30, -200, BW + 60, 400, 30); ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,69,0.35)'; ctx.lineWidth = 3; rrect(ctx, -BW / 2 - 30, -200, BW + 60, 400, 30); ctx.stroke();
  for (let i = 0; i < 26; i++) { ctx.fillStyle = ((Math.floor(t * 4) + i) % 3 === 0) ? C.yellow : 'rgba(255,200,69,0.25)'; ctx.beginPath(); ctx.arc(-BW / 2 - 10 + i * ((BW + 20) / 25), -182, 5, 0, TAU); ctx.fill(); }
  const mi = boardMsgAt(t), [t0, rows] = BOARD[mi], prevRows = mi > 0 ? BOARD[mi - 1][1] : rows.map((r) => r.map(() => ''));
  rows.forEach((row, ri) => {
    const y = ri === 0 ? -55 : 100, h = rowH[ri], sz = size[ri];
    const norm = (c) => (typeof c === 'string' ? { c, col: C.ink } : c);
    const L = rowLayout(ctx, row, BW - 40, h, sz);
    const pr = prevRows[ri] || [];
    L.xs.forEach((x, ci) => {
      const tf = t0 + ci * STAG + ri * 0.08;
      // two scramble flips through blanks before landing (the board "searches")
      const p1 = clamp((t - tf) / FLIP), p2 = clamp((t - tf - FLIP) / FLIP);
      const cur = norm(row[ci]), prev = pr[ci] !== undefined ? norm(pr[ci]) : { c: '' };
      if (t < tf || mi === 0 && t0 < 0) drawTile(ctx, x, y, L.ws[ci], h, mi === 0 ? cur : prev, prev, mi === 0 ? 1 : 0, sz * L.k);
      else if (p2 <= 0) drawTile(ctx, x, y, L.ws[ci], h, { c: '' }, prev, p1, sz * L.k);
      else drawTile(ctx, x, y, L.ws[ci], h, cur, { c: '' }, p2, sz * L.k);
    });
  });
  ctx.restore();
}

// ---------------------------------------------------------------- podiums + phones
function phone(ctx, x, y, s, which, t) {
  // which: 'A' employee, 'B' bot
  const w = 250, h = 470;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, -w / 2 + 8, -h / 2 + 14, w, h, 36); ctx.fill();
  ctx.fillStyle = '#0A0C10'; rrect(ctx, -w / 2, -h / 2, w, h, 36); ctx.fill();
  ctx.save(); rrect(ctx, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 28); ctx.clip();
  ctx.fillStyle = '#EDE6DA'; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = '#1E2A33'; ctx.fillRect(-w / 2, -h / 2, w, 62);
  tA(ctx, 'العيادة', w / 2 - 28, -h / 2 + 44, 22, '#F4EFE6', { align: 'right' });
  // customer
  const cb = (yy, txt, time, inc, fill, fg) => {
    const bw = 196; ctx.fillStyle = fill; rrect(ctx, inc ? w / 2 - 18 - bw : -w / 2 + 18, yy, bw, 64, 16); ctx.fill();
    tA(ctx, txt, inc ? w / 2 - 30 : -w / 2 + 18 + bw - 12, yy + 32, 17, fg, { align: 'right', weight: 600 });
    tL(ctx, time, inc ? w / 2 - 18 - bw + 10 : -w / 2 + 28, yy + 55, 13, fg === '#06281C' ? '#0B5C42' : '#7A7064', 'left');
  };
  const night = clamp(prog(t, V.a3, V.a3 + 0.4)) * (1 - prog(t, V.a4, V.a4 + 0.3));
  cb(-h / 2 + 84, 'بكام الكشف؟', '3:00 AM', true, '#FFFFFF', '#1F1A24');
  if (which === 'A') cb(-h / 2 + 164, 'صباح الخير! الكشف بـ 300', '10:12 AM', false, '#DCF3D9', '#1F1A24');
  else cb(-h / 2 + 164, 'أهلاً بيك! الكشف بـ 300', '3:02 AM', false, '#DCF3D9', '#1F1A24');
  // later B shows Arabic + English and a booking
  if (which === 'B' && t > V.a5 + 0.5) {
    const k1 = sp(t, V.a5 + 0.55, SPRING.bouncy), k2 = sp(t, V.a5 + 1.45, SPRING.bouncy);
    ctx.save(); ctx.globalAlpha = clamp(k1); cb(-h / 2 + 244, 'متاح بكرة 5:00 ✓'.replace(' ✓', ''), '3:03 AM', false, C.mint, '#06281C'); ctx.restore();
    if (k2 > 0) { ctx.save(); ctx.globalAlpha = clamp(k2); const bw = 196, yy = -h / 2 + 324; ctx.fillStyle = C.mint; rrect(ctx, -w / 2 + 18, yy, bw, 64, 16); ctx.fill(); tL(ctx, 'Hi! Yes, 5:00 PM', -w / 2 + 30, yy + 38, 17, '#06281C', 'left', UI, 600); ctx.restore(); }
  }
  ctx.restore();
  // timestamp callout during the "look at the clock" beat
  if (night > 0.01) {
    const yy = -h / 2 + 219, glow = which === 'B';
    ctx.save(); ctx.globalAlpha = night; ctx.strokeStyle = glow ? C.yellow : 'rgba(244,239,230,0.35)'; ctx.lineWidth = 5; rrect(ctx, -w / 2 + 14, yy - 22, 90, 36, 10); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
function podium(ctx, t, which) {
  const [x, y] = which === 'A' ? S.A : S.B;
  const rev = which === 'B' ? E.outBack(prog(t, V.a4, V.a4 + 0.45), 1.6) : 0;
  const rise = which === 'B' ? 60 * E.outCubic(prog(t, V.a4, V.a4 + 0.5)) : 0;
  const fw = 320, fh = 300;
  ctx.save(); ctx.translate(x, y - rise);
  // body (2.5D: top face + front face)
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, fh + 30 + rise, 220, 34, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2E3648'; ctx.beginPath(); ctx.moveTo(-fw / 2, 0); ctx.lineTo(fw / 2, 0); ctx.lineTo(fw / 2 - 30, -40); ctx.lineTo(-fw / 2 + 30, -40); ctx.closePath(); ctx.fill();
  // front face flips at the reveal: letter -> identity
  const flipA = which === 'A' ? prog(t, V.a4 + 0.25, V.a4 + 0.6) : prog(t, V.a4, V.a4 + 0.35);
  const sx = Math.abs(Math.cos(flipA * Math.PI));
  const shown = flipA >= 0.5;
  ctx.save(); ctx.translate(0, fh / 2); ctx.scale(Math.max(0.02, sx), 1);
  const face = shown ? (which === 'B' ? C.mint : '#3A4256') : '#262E3F';
  ctx.fillStyle = face; ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
  ctx.strokeStyle = shown && which === 'B' ? '#9BF5D2' : C.yellow; ctx.lineWidth = 6; ctx.strokeRect(-fw / 2 + 14, -fh / 2 + 14, fw - 28, fh - 28);
  if (!shown) tA(ctx, which === 'A' ? 'أ' : 'ب', 0, 60, 190, C.yellow, { face: D });
  else if (which === 'B') {
    if (IMGS.only) { ctx.save(); rrect(ctx, -70, -110, 140, 140, 30); ctx.clip(); ctx.drawImage(IMGS.only, 609, 304, 1182, 1182, -70, -110, 140, 140); ctx.restore(); }
    tA(ctx, 'بوت نستا', 0, 100, 58, C.mintInk, { face: D });
  } else {
    tA(ctx, 'موظف', 0, 40, 70, C.ink, { face: D });
    // he was asleep at 3 AM
    const z = (t - V.a4 - 0.6); if (z > 0) for (let i = 0; i < 3; i++) { const ph = (z * 0.8 + i / 3) % 1; tL(ctx, 'z', 70 + ph * 50, -40 - ph * 90 - i * 4, 30 + i * 8, `rgba(244,239,230,${0.8 * (1 - ph)})`, 'center', D); }
  }
  ctx.restore();
  ctx.restore();
  // phone (A's turns into a task card in the last act)
  const toTask = which === 'A' ? prog(t, V.b7 - 0.1, V.b7 + 0.25) : 0;
  const ps = 1 - 0.0 * toTask;
  if (toTask < 0.5) { ctx.save(); ctx.translate(0, 0); const sxx = Math.abs(Math.cos(toTask * Math.PI)); ctx.translate(x, y - rise - 290); ctx.scale(Math.max(0.02, sxx), 1); ctx.translate(-x, -(y - rise - 290)); phone(ctx, x, y - rise - 290, ps, which, t); ctx.restore(); }
  else taskCard(ctx, x, y - 290, t, Math.abs(Math.cos(toTask * Math.PI)));
}
function taskCard(ctx, x, y, t, sx) {
  const w = 300, h = 420;
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.02, sx), 1);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, -w / 2 + 8, -h / 2 + 14, w, h, 26); ctx.fill();
  ctx.fillStyle = '#F4EFE6'; rrect(ctx, -w / 2, -h / 2, w, h, 26); ctx.fill();
  ctx.fillStyle = C.yellow; rrect(ctx, -w / 2, -h / 2, w, 70, [26, 26, 0, 0]); ctx.fill();
  tA(ctx, 'شغلي النهارده', w / 2 - 24, -h / 2 + 46, 28, '#1F1A24', { align: 'right' });
  ['العملاء اللي في المكان', 'متابعة الحالات', 'تطوير الشغل'].forEach((s, i) => {
    const k = sp(t, V.b7 + 0.2 + i * 0.4, SPRING.bouncy), yy = -h / 2 + 140 + i * 95;
    ctx.fillStyle = '#E4DCCD'; rrect(ctx, w / 2 - 70, yy - 26, 44, 44, 10); ctx.fill();
    if (k > 0.05) check(ctx, w / 2 - 48, yy - 4, 30 * Math.min(1, k), '#1F1A24', 6);
    tA(ctx, s, w / 2 - 88, yy + 8, 22, '#1F1A24', { align: 'right', weight: 600 });
  });
  ctx.restore();
}
function dataCards(ctx, t) {
  ['الأسعار', 'المواعيد', 'المنيو'].forEach((s, i) => {
    const k = sp(t, V.b5 + 0.1 + i * 0.25, SPRING.bouncy); if (k <= 0.01) return;
    const x = S.cards[0] + (i - 1) * 40, y = S.cards[1] - 220 + i * 170;
    // light line into the bot's phone
    ctx.save(); ctx.strokeStyle = `rgba(65,236,174,${0.6 * clamp(k)})`; ctx.lineWidth = 5; ctx.setLineDash([3, 14]); ctx.lineDashOffset = -t * 60; ctx.beginPath(); ctx.moveTo(x - 120, y); ctx.quadraticCurveTo(x - 220, y + 20, S.B[0] + 140, S.B[1] - 60 - 290 + (i - 1) * 60); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(x + (1 - k) * 200, y); ctx.globalAlpha = clamp(k * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; rrect(ctx, -115, -48, 230, 100, 18); ctx.fill();
    ctx.fillStyle = '#232B3B'; rrect(ctx, -120, -55, 230, 100, 18); ctx.fill();
    ctx.strokeStyle = C.mint; ctx.lineWidth = 3; rrect(ctx, -120, -55, 230, 100, 18); ctx.stroke();
    tA(ctx, s, -5, 8, 36, C.ink, { face: D });
    ctx.restore();
  });
}
let IMGS = {}, PLATE = null;
function endScreen(ctx, t) {
  const [x, y] = S.screen, w = 980, h = 560;
  const on = prog(t, V.a8 + 0.05, V.a8 + 0.4);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, -w / 2 - 24 + 10, -h / 2 - 24 + 18, w + 48, h + 48, 34); ctx.fill();
  ctx.fillStyle = '#07090D'; rrect(ctx, -w / 2 - 24, -h / 2 - 24, w + 48, h + 48, 34); ctx.fill();
  ctx.fillStyle = '#0A0D12'; ctx.fillRect(-w / 2, -h / 2, w, h);
  if (on > 0) {
    // CRT-style power on: a bright line opens vertically into the picture
    const oh = h * E.outCubic(clamp((on - 0.25) / 0.75));
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -Math.max(3, oh / 2), w, Math.max(6, oh)); ctx.clip();
    ctx.fillStyle = C.navy; ctx.fillRect(-w / 2, -h / 2, w, h);
    const lw = 900, lh = lw * (520 / 1640);
    if (PLATE) {
      const k = sp(t, V.a8 + 0.35, SPRING.gentle);
      ctx.save(); ctx.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k); ctx.globalAlpha = clamp(k * 1.5);
      ctx.drawImage(PLATE, -lw / 2, -lh / 2 - 20, lw, lh); ctx.restore();
    }
    // a slow light sweep across the logo
    const sw = ((t - V.a8 - 0.6) * 0.35) % 1.4 - 0.2;
    if (t > V.a8 + 0.6) { const g = ctx.createLinearGradient(-w / 2 + sw * w - 120, 0, -w / 2 + sw * w + 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h); }
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; for (let yy = -h / 2; yy < h / 2; yy += 6) ctx.fillRect(-w / 2, yy, w, 2);
    if (on < 0.3) { ctx.fillStyle = `rgba(255,255,255,${1 - on / 0.3})`; ctx.fillRect(-w / 2, -4, w, 8); }
    ctx.restore();
  }
  ctx.restore();
  // under the board: the invitation, lit by the spots
  const k = clamp((t - V.b8) / 0.4);
  if (k > 0) { ctx.save(); ctx.globalAlpha = k; tA(ctx, 'واسأله اللي إنت عايزه!', S.board[0], S.board[1] + 290 + (1 - k) * 30, 64, C.yellow, { face: D }); ctx.restore(); }
}

// ---------------------------------------------------------------- the stage
function stage(ctx, cam, t) {
  // back wall + floor (world space so they travel with the camera)
  const top = cam.y - 3000, bot = cam.y + 3000;
  const g = ctx.createLinearGradient(0, -2200, 0, S.floorY); g.addColorStop(0, '#11151E'); g.addColorStop(1, C.wall2);
  ctx.fillStyle = g; ctx.fillRect(cam.x - 3000, top, 6000, S.floorY - top);
  // wall panels for depth
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 3;
  for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(i * 260, -2400); ctx.lineTo(i * 260, S.floorY); ctx.stroke(); }
  const fg = ctx.createLinearGradient(0, S.floorY, 0, S.floorY + 900); fg.addColorStop(0, '#202838'); fg.addColorStop(1, C.floor);
  ctx.fillStyle = fg; ctx.fillRect(cam.x - 3000, S.floorY, 6000, bot - S.floorY);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
  for (let i = -20; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(i * 120, S.floorY); ctx.lineTo(i * 360, S.floorY + 1400); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,200,69,0.25)'; ctx.fillRect(cam.x - 3000, S.floorY - 2, 6000, 4);
}
function beams(ctx, t) {
  const [, a, b, inten] = spots(t);
  const night = clamp(prog(t, V.a3, V.a3 + 0.4)) * (1 - prog(t, V.a4 - 0.1, V.a4 + 0.2));
  const col = (i) => (t > V.a4 && t < V.a5 + 0.3 && i === 1) || (t > V.a5 + 0.3 && t < V.a6 - 0.3) ? '65,236,174' : '255,214,120';
  [[a, -620], [b, 620]].forEach(([p, rx], i) => {
    const sx = rx, sy = -2300, [tx, ty] = p;
    const spread = 210, I = inten * (0.85 - 0.35 * night);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(sx, sy, tx, ty); g.addColorStop(0, `rgba(${col(i)},${0.02 * I})`); g.addColorStop(1, `rgba(${col(i)},${0.16 * I})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - 30, sy); ctx.lineTo(sx + 30, sy); ctx.lineTo(tx + spread, ty + 40); ctx.lineTo(tx - spread, ty + 40); ctx.closePath(); ctx.fill();
    const pool = ctx.createRadialGradient(tx, ty + 40, 10, tx, ty + 40, 320); pool.addColorStop(0, `rgba(${col(i)},${0.22 * I})`); pool.addColorStop(1, `rgba(${col(i)},0)`);
    ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(tx, ty + 40, 330, 330, 0, 0, TAU); ctx.fill();
    ctx.restore();
  });
  // lamp heads on the rig
  [-620, 620].forEach((x) => { ctx.fillStyle = '#05070A'; rrect(ctx, x - 60, -2360, 120, 90, 16); ctx.fill(); ctx.fillStyle = 'rgba(255,214,120,0.9)'; ctx.beginPath(); ctx.ellipse(x, -2272, 46, 12, 0, 0, TAU); ctx.fill(); });
}
function voteBars(ctx, t) {
  const k = clamp((t - V.c1 + 0.1) / 0.3) * (1 - prog(t, 4.6, 4.9)); if (k <= 0) return;
  ['A', 'B'].forEach((w, i) => {
    const [x, y] = S[w]; const v = 50 + 18 * Math.sin((t - V.c1) * 7 + i * Math.PI);
    ctx.save(); ctx.globalAlpha = k; ctx.translate(x, y + 380);
    ctx.fillStyle = '#0B0E14'; rrect(ctx, -140, -24, 280, 48, 24); ctx.fill();
    ctx.fillStyle = C.yellow; rrect(ctx, -140, -24, 280 * v / 100, 48, 24); ctx.fill();
    tL(ctx, `${Math.round(v)}%`, 0, 14, 34, '#0B0E14');
    ctx.restore();
  });
}
function draw(ctx, t) {
  const cam = camera(t);
  ctx.fillStyle = '#0D1017'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H * 0.47); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  stage(ctx, cam, t);
  board(ctx, t);
  endScreen(ctx, t);
  podium(ctx, t, 'A'); podium(ctx, t, 'B');
  dataCards(ctx, t);
  voteBars(ctx, t);
  // price checks on both replies
  [[S.A, 5.55], [S.B, 7.35]].forEach(([[x, y], t0]) => { const k = sp(t, t0, SPRING.bouncy); if (k > 0.01 && t < V.a4) { ctx.save(); ctx.translate(x + 130, y - 290 - 40); ctx.scale(k, k); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fill(); check(ctx, 0, 2, 34, '#1C2230', 7); ctx.restore(); } });
  beams(ctx, t);
  ctx.restore();
  // night: the studio dims for "look at the clock"
  const night = clamp(prog(t, V.a3, V.a3 + 0.4)) * (1 - prog(t, V.a4 - 0.1, V.a4 + 0.15));
  if (night > 0) { ctx.fillStyle = `rgba(8,12,30,${0.45 * night})`; ctx.fillRect(0, 0, W, H); }
  // reveal flash only on the reveal (one structural flash)
  const fl = 1 - prog(t, V.a4, V.a4 + 0.25); if (t > V.a4 && fl > 0) { ctx.fillStyle = `rgba(65,236,174,${0.25 * fl})`; ctx.fillRect(0, 0, W, H); }
}

M.film({
  fonts: [font(100, 700, D), font(40, 700, UI), font(40, 600, UI)],
  images: { only: 'assets/logo_only.jpg', name: 'assets/logo_name.jpg' },
  hits: HITS,
  samples: 6,
  init(ctx, IMG) {
    IMGS = IMG;
    if (IMG.name) {
      const c = document.createElement('canvas'); c.width = 1640; c.height = 520; const x = c.getContext('2d');
      x.drawImage(IMG.name, 380, 640, 1640, 520, 0, 0, 1640, 520);
      x.globalCompositeOperation = 'destination-in';
      const gx = x.createLinearGradient(0, 0, 1640, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.04, '#000'); gx.addColorStop(0.96, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gx; x.fillRect(0, 0, 1640, 520);
      const gy = x.createLinearGradient(0, 0, 0, 520); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.12, '#000'); gy.addColorStop(0.88, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gy; x.fillRect(0, 0, 1640, 520);
      PLATE = c;
    }
  },
  draw(ctx, u, t) { draw(ctx, t); },
  post(ctx, u, t) {
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
});
