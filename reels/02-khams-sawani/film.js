// خمس ثواني — Nesta ad 2. Pure function of time: window.seek(t) paints frame t.
// One sand table, one camera, one pen line that draws every shot out of the previous one.
// Timed in seconds on the placed VO (audio/vo.wav = tightened take + 0.32 s); grid 120 bpm, drop @ 14.0 s.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, wobble, font, rrect, hash01, mix, TAU } = M;

const C = {
  sand: '#F3E9DC', sand2: '#EADBC6', ink: '#1B2A41', coral: '#FF6B4A', mint: '#41ECAE', mintInk: '#0B5C42',
  paper: '#FFFBF4', grey: '#A99F92', greyInk: '#6F675D', shadow: 'rgba(92,62,30,0.22)',
};
const D = 'Display', UI = 'UI';
const B = (t) => t / 0.499983;
const O = 0.32;                                  // VO placement offset
const T = (s) => s + O;                          // tightened-take seconds -> film seconds
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);

// ---------------------------------------------------------------- world positions
const P = {
  counter: [0, -270], bubble: [40, 190], rival: [-1000, 520], clock: [-2200, 380], text: [-2330, 900],
  reply: [-30, 440], cards: [760, 280], cal: [1500, 140], sheet: [2050, 400], bell: [2560, 150],
  cup: [3650, 380], calm: [3650, 60], pill: [3650, -420], logo: [3650, -860],
};

// ---------------------------------------------------------------- hits
const HITS = [
  ...[0, 0.32, 0.64, 0.96, 1.28].map((t, i) => [B(t), `count ${5 - i}`, 'tok', { pitch: ['A5', 'G5', 'F5', 'E5', 'D5'][i] }]),
  [B(1.6), 'zero', 'thud'],
  [B(T(2.61)), 'yalla shake', 'boing', { pitch: 'D4', to: 'A3' }],
  [B(T(3.4)), 'khalaso stamp', 'thud'],
  [B(4.2), 'bubble slides away', 'whoosh', { len: 0.5, from: 1600, to: 500 }],
  [B(5.0), 'rival card', 'pop', { pitch: 'C5', to: 'G4' }],
  [B(5.5), 'rival check', 'click'],
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => [B(6.25 + i * 0.3), 'ruler tick', 'tick']),
  [B(T(6.79)), 'saatein', 'thud'],
  [B(T(8.4)), 'not five', 'click'],
  [B(10.0), 'arrow', 'whoosh', { len: 0.35, from: 900, to: 2400 }],
  [B(T(12.81)), 'yakhdo stamp', 'impact'],
  [B(13.55), 'rewind', 'riser', { len: 0.45 }],
  [B(14.0), 'nesta reply', 'impact'],
  [B(14.4), 'reply lands', 'blip', { pitch: 'A6' }],
  [B(16.05), 'card 1', 'tok', { pitch: 'D5' }], [B(16.35), 'card 2', 'tok', { pitch: 'F#5' }], [B(16.65), 'card 3', 'tok', { pitch: 'A5' }],
  [B(17.6), 'to calendar', 'whoosh', { len: 0.35, pan: 0.3 }],
  [B(T(17.44)), 'calendar check', 'bell', { pitch: 'D6' }],
  [B(T(18.37)), 'sheet row', 'type', { len: 0.6, n: 7 }],
  [B(T(19.44)), 'bell rings', 'bell', { pitch: 'A6' }],
  [B(20.9), 'to cup', 'whoosh', { len: 0.4, pan: 0.3 }],
  [B(T(20.74)), 'cup', 'pop', { pitch: 'G5', to: 'D5' }],
  [B(23.7), 'rise to cta', 'whoosh', { len: 0.5, from: 600, to: 1800 }],
  [B(24.4), 'pill fills', 'pop', { pitch: 'D6' }],
  [B(24.15), 'logo sticker', 'thud'],
  [B(27.3), 'stopwatch', 'tok', { pitch: 'A5' }],
  [B(28.6), 'pulse', 'blip', { pitch: 'D6' }],
];

// ---------------------------------------------------------------- camera
const CAMK = [
  [0, 0, -90, 1.4], [3.9, 0, -70, 1.48], [5.3, -860, 380, 1.1], [6.0, -1000, 430, 1.1], [8.6, -2150, 420, 1.1],
  [9.95, -2220, 440, 1.12], [10.8, -2330, 840, 1.1], [13.5, -2330, 870, 1.15], [14.0, 0, 260, 1.12], [15.6, 30, 290, 1.17],
  [16.3, 780, 270, 1.2], [17.35, 810, 270, 1.22], [17.9, 1500, 170, 1.25], [18.3, 1520, 180, 1.27], [18.8, 2050, 390, 1.2],
  [19.35, 2070, 390, 1.22], [19.85, 2560, 180, 1.25], [20.6, 2580, 180, 1.27], [21.3, 3650, 150, 1.2], [23.4, 3650, 170, 1.25],
  [24.2, 3650, -440, 1.0], [30, 3650, -430, 1.03],
];
function camera(t) {
  let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1][0]) i++;
  const [t0, x0, y0, z0] = CAMK[i], [t1, x1, y1, z1] = CAMK[i + 1];
  const p = clamp((t - t0) / (t1 - t0)), e = E.inOutCubic(p);
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const pull = 1 - Math.min(0.42, dist / 6200) * Math.sin(Math.PI * p);   // dolly back on long moves
  return { x: lerp(x0, x1, e), y: lerp(y0, y1, e), z: lerp(z0, z1, e) * pull, m: dist > 50 ? Math.sin(Math.PI * p) : 0, dx: Math.sign(x1 - x0) };
}

// ---------------------------------------------------------------- pen strokes (one line that draws the film)
function line(a, b, n = 24, bend = 0) {
  return Array.from({ length: n + 1 }, (_, k) => {
    const s = k / n, nx = -(b[1] - a[1]), ny = b[0] - a[0], L = Math.hypot(nx, ny) || 1;
    const o = Math.sin(Math.PI * s) * bend;
    return [lerp(a[0], b[0], s) + (nx / L) * o, lerp(a[1], b[1], s) + (ny / L) * o];
  });
}
function wave(a, b, n, amp, freq) {
  return Array.from({ length: n + 1 }, (_, k) => {
    const s = k / n, nx = -(b[1] - a[1]), ny = b[0] - a[0], L = Math.hypot(nx, ny) || 1;
    const o = Math.sin(s * TAU * freq) * amp * Math.sin(Math.PI * s);
    return [lerp(a[0], b[0], s) + (nx / L) * o, lerp(a[1], b[1], s) + (ny / L) * o];
  });
}
function arc(c, r, a0, a1, n = 60) { return Array.from({ length: n + 1 }, (_, k) => { const a = lerp(a0, a1, k / n); return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; }); }
function rrPath(cx, cy, w, h, r, n = 12) {   // rounded-rect outline starting top-right, going counter-clockwise (RTL feel)
  const pts = [], x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const corner = (cx_, cy_, a0) => { for (let k = 0; k <= n; k++) { const a = a0 + (k / n) * (Math.PI / 2); pts.push([cx_ + Math.cos(a) * r, cy_ + Math.sin(a) * r]); } };
  corner(x1 - r, y0 + r, -Math.PI / 2 * 1); pts.reverse();
  const tr = pts.splice(0);
  // build clockwise from top-right then reverse for a counter-clockwise draw
  const cw = [];
  const c2 = (ccx, ccy, a0) => { for (let k = 0; k <= n; k++) { const a = a0 + (k / n) * (Math.PI / 2); cw.push([ccx + Math.cos(a) * r, ccy + Math.sin(a) * r]); } };
  c2(x1 - r, y0 + r, -Math.PI / 2); c2(x1 - r, y1 - r, 0); c2(x0 + r, y1 - r, Math.PI / 2); c2(x0 + r, y0 + r, Math.PI); cw.push(cw[0]);
  return cw.reverse();
}
const [cx0, cy0] = P.counter, [kx, ky] = P.clock;
const STROKES = [
  { pts: arc(P.counter, 286, Math.PI / 2, Math.PI / 2 - TAU, 90), t0: 0.0, t1: 1.6, col: C.coral, w: 16, ease: (x) => x },
  { pts: line([cx0, cy0 + 286], [P.bubble[0] + 40, P.bubble[1] - 95], 10, 30), t0: 1.6, t1: 1.95, col: C.coral, w: 12 },
  { pts: wave([P.bubble[0] - 260, P.bubble[1] + 40], [P.rival[0] + 230, P.rival[1] - 40], 40, 40, 1.5), t0: 4.15, t1: 5.15, col: C.grey, w: 10, dash: [4, 26] },
  { pts: wave([P.rival[0] - 240, P.rival[1] + 30], [kx + 300, ky + 20], 80, 70, 2.5), t0: 5.85, t1: 8.05, col: C.coral, w: 12, ruler: true },
  { pts: arc(P.clock, 300, 0, -TAU, 90), t0: 8.0, t1: 8.65, col: C.coral, w: 14 },
  { pts: line([kx - 40, ky + 300], [P.text[0] + 120, P.text[1] - 210], 20, -60), t0: 10.0, t1: 10.55, col: C.coral, w: 12, arrow: true },
  { pts: rrPath(P.reply[0], P.reply[1], 640, 170, 50), t0: 14.0, t1: 14.38, col: C.mint, w: 12 },
  { pts: wave([P.reply[0] + 330, P.reply[1]], [P.cards[0] - 250, P.cards[1] + 60], 30, 40, 1), t0: 15.65, t1: 16.05, col: C.mint, w: 12 },
  { pts: wave([P.cards[0] - 250, P.cards[1] + 60], [P.cards[0] + 260, P.cards[1] - 120], 60, 170, 1.5), t0: 16.05, t1: 16.95, col: C.mint, w: 12 },
  { pts: wave([P.cards[0] + 260, P.cards[1] - 120], [P.cal[0] - 330, P.cal[1] + 20], 30, 50, 1), t0: 16.95, t1: 17.8, col: C.mint, w: 12 },
  { pts: wave([P.cal[0] + 330, P.cal[1] + 60], [P.sheet[0] - 380, P.sheet[1] - 30], 30, 40, 1), t0: 18.15, t1: 18.7, col: C.mint, w: 12 },
  { pts: wave([P.sheet[0] + 380, P.sheet[1] - 40], [P.bell[0] - 200, P.bell[1] + 60], 30, 50, 1), t0: 19.25, t1: 19.75, col: C.mint, w: 12 },
  { pts: [...wave([P.bell[0] + 200, P.bell[1] + 60], [P.cup[0] - 500, P.cup[1] + 480], 30, 60, 1), ...line([P.cup[0] - 500, P.cup[1] + 480], [P.cup[0] - 10, P.cup[1] + 140], 16, -60)], t0: 20.55, t1: 21.2, col: C.mint, w: 12 },
  { pts: [...wave([P.cup[0] + 20, P.cup[1] - 210], [P.pill[0] + 330, P.pill[1] + 40], 40, 70, 2.5), ...rrPath(P.pill[0], P.pill[1], 760, 180, 90)], t0: 23.45, t1: 24.4, col: C.mint, w: 12 },
];
for (const s of STROKES) {
  s.len = [0]; for (let k = 1; k < s.pts.length; k++) s.len.push(s.len[k - 1] + Math.hypot(s.pts[k][0] - s.pts[k - 1][0], s.pts[k][1] - s.pts[k - 1][1]));
  s.total = s.len[s.len.length - 1];
}
function strokeAt(s, p) {   // point at fraction p of a stroke
  const d = p * s.total; let k = 1; while (k < s.len.length - 1 && s.len[k] < d) k++;
  const a = s.pts[k - 1], b = s.pts[k], f = (d - s.len[k - 1]) / Math.max(1e-6, s.len[k] - s.len[k - 1]);
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0])];
}
function drawStrokes(ctx, t) {
  let tip = null;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of STROKES) {
    if (t < s.t0) continue;
    const p = (s.ease || E.inOutSine)(clamp((t - s.t0) / (s.t1 - s.t0)));
    const d = p * s.total;
    ctx.beginPath(); ctx.moveTo(s.pts[0][0], s.pts[0][1]);
    for (let k = 1; k < s.pts.length; k++) {
      if (s.len[k] <= d) ctx.lineTo(s.pts[k][0], s.pts[k][1]);
      else { const q = strokeAt(s, p); ctx.lineTo(q[0], q[1]); break; }
    }
    ctx.setLineDash(s.dash || []);
    ctx.strokeStyle = 'rgba(92,62,30,0.14)'; ctx.lineWidth = s.w; ctx.save(); ctx.translate(3, 6); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = s.col; ctx.lineWidth = s.w; ctx.stroke();
    ctx.setLineDash([]);
    if (s.arrow && p > 0.98) {
      const [x, y, a] = strokeAt(s, 1);
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a + 2.6) * 50, y + Math.sin(a + 2.6) * 50); ctx.lineTo(x, y); ctx.lineTo(x + Math.cos(a - 2.6) * 50, y + Math.sin(a - 2.6) * 50); ctx.stroke();
    }
    if (s.ruler) {   // time ticks along the long run: the two hours you didn't answer
      const labels = ['9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45'];
      labels.forEach((lb, i) => {
        const f = (i + 1) / (labels.length + 1); if (p < f) return;
        const [x, y, a] = strokeAt(s, f); const k = sp(t, s.t0 + f * (s.t1 - s.t0), SPRING.bouncy);
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
        ctx.strokeStyle = C.coral; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -26 * k); ctx.lineTo(0, 26 * k); ctx.stroke(); ctx.restore();
        tL(ctx, lb, x, y - 60 - 10 * (1 - k), 44, mix(C.sand, C.greyInk, k));
      });
    }
    if (t >= s.t0 && t < s.t1 + 0.05) { const q = strokeAt(s, p); tip = { x: q[0], y: q[1], col: s.col }; }
  }
  ctx.restore();
  return tip;
}
function nib(ctx, tip) {   // the marker drawing the line
  if (!tip) return;
  ctx.save(); ctx.translate(tip.x, tip.y); ctx.rotate(-0.7);
  ctx.fillStyle = 'rgba(92,62,30,0.2)'; rrect(ctx, 18, 10, 46, 190, 20); ctx.fill();
  ctx.fillStyle = tip.col; rrect(ctx, -4, -10, 30, 34, 10); ctx.fill();
  ctx.fillStyle = C.ink; rrect(ctx, -10, 20, 42, 170, 18); ctx.fill();
  ctx.fillStyle = tip.col; rrect(ctx, -10, 120, 42, 22, 4); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- paper + type helpers
function shadowed(ctx, lift, fn) {
  ctx.save(); ctx.shadowColor = C.shadow; ctx.shadowBlur = 18 + 40 * lift; ctx.shadowOffsetX = 6 + 18 * lift; ctx.shadowOffsetY = 12 + 40 * lift;
  fn(); ctx.restore();
}
// drop-in: a sheet of paper falls onto the table (scale + shadow tell the height)
function drop(t, t0) { const k = sp(t, t0, SPRING.bouncy); return { k, lift: clamp(1 - k), s: lerp(1.25, 1, clamp(k)), a: clamp(k * 3) }; }
function card(ctx, x, y, w, h, { r = 30, fill = C.paper, rot = 0, d = { k: 1, lift: 0, s: 1, a: 1 } } = {}) {
  if (d.a <= 0) return false;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * d.s); ctx.scale(d.s, d.s); ctx.globalAlpha = d.a;
  shadowed(ctx, d.lift, () => { ctx.fillStyle = fill; rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.fill(); });
  ctx.strokeStyle = 'rgba(27,42,65,0.07)'; ctx.lineWidth = 2; rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.stroke();
  return true;   // caller draws contents, then ctx.restore()
}
function tA(ctx, s, x, y, size, color, { face = UI, weight = 700, align = 'center' } = {}) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function tL(ctx, s, x, y, size, color, align = 'center') {
  ctx.save(); ctx.font = font(size, 700, UI); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
// handwriting reveal: the line of type is uncovered right-to-left as if the pen writes it
function write(ctx, s, x, y, size, color, t, t0, dur, { face = D, rot = 0, weight = 400 } = {}) {
  const p = E.outCubic(clamp((t - t0) / dur)); if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = font(size, weight, face); const w = ctx.measureText(s).width;
  ctx.beginPath(); ctx.rect(w / 2 - w * p - 10, -size * 1.3, w * p + 20, size * 1.9); ctx.clip();
  ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(92,62,30,0.12)'; ctx.fillText(s, 3, 5);
  ctx.fillStyle = color; ctx.fillText(s, 0, 0);
  ctx.restore();
}
function stamp(ctx, s, x, y, size, color, t, t0, { rot = -0.08, face = D, weight = 400 } = {}) {
  const k = sp(t, t0, SPRING.bouncy); if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const sc = lerp(1.8, 1, Math.min(1, k)) * (1 + 0.04 * wobble(t - t0 - 0.12, 4, 8)); ctx.scale(sc, sc);
  ctx.globalAlpha = clamp(k * 2.5);
  ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(92,62,30,0.16)'; ctx.fillText(s, 4, 8);
  ctx.fillStyle = color; ctx.fillText(s, 0, 0);
  ctx.restore();
}
function check(ctx, x, y, s, col, w = 10) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.4); ctx.stroke(); ctx.restore(); }

// ---------------------------------------------------------------- objects on the table
function msgBubble(ctx, x, y, w, text, time, { d, fill = C.paper, fg = C.ink, tailRight = true, avatar = 'م', avCol = C.coral, size = 52 } = {}) {
  if (!card(ctx, x, y, w, 170, { r: 50, fill, d, rot: tailRight ? -0.02 : 0.02 })) return;
  ctx.fillStyle = fill; ctx.beginPath(); const tx = tailRight ? w / 2 - 50 : -w / 2 + 50; ctx.moveTo(tx, 60); ctx.lineTo(tx + (tailRight ? 60 : -60), 105); ctx.lineTo(tx - (tailRight ? 30 : -30), 80); ctx.fill();
  if (avatar) { ctx.fillStyle = avCol; ctx.beginPath(); ctx.arc(w / 2 - 75, -5, 42, 0, TAU); ctx.fill(); tA(ctx, avatar, w / 2 - 75, 12, 44, C.paper); }
  tA(ctx, text, avatar ? w / 2 - 140 : w / 2 - 50, 14, size, fg, { align: 'right' });
  tL(ctx, time, -w / 2 + 70, 58, 30, tailRight ? C.greyInk : C.mintInk);
  ctx.restore();
}
function counter(ctx, t) {
  const [x, y] = P.counter;
  const steps = [0, 0.32, 0.64, 0.96, 1.28, 1.6];
  let n = 5; steps.forEach((s, i) => { if (t >= s) n = 5 - i; });
  const ti = steps[5 - n];
  const flip = 1 - 0.55 * Math.exp(-(t - ti) * 18);
  let shake = 0; for (const s of [1.6, T(2.61)]) if (t > s) shake += 22 * Math.exp(-(t - s) * 7) * Math.sin((t - s) * 60);
  ctx.save(); ctx.translate(x + shake, y);
  shadowed(ctx, 0.1, () => { ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(0, 0, 240, 0, TAU); ctx.fill(); });
  ctx.scale(1, flip);
  tL(ctx, String(n), 0, 115, 330, n === 0 ? C.coral : C.ink);
  ctx.restore();
  tA(ctx, 'ثانية', x, y + 190, 44, C.greyInk, { weight: 600 });
}
function rival(ctx, t) {
  const [x, y] = P.rival; const d = drop(t, 4.95);
  if (!card(ctx, x, y, 420, 330, { r: 34, fill: '#EFE8DE', d, rot: 0.05 })) return;
  // a plain grey shopfront: awning + door
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#C9C0B4' : '#B3A99C'; ctx.beginPath(); ctx.moveTo(-180 + i * 60, -110); ctx.lineTo(-120 + i * 60, -110); ctx.lineTo(-120 + i * 60, -60); ctx.arc(-150 + i * 60, -60, 30, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = '#C9C0B4'; ctx.fillRect(-180, -20, 360, 150); ctx.fillStyle = '#A99F92'; ctx.fillRect(-45, 20, 90, 110);
  tA(ctx, 'محل تاني', 0, -130, 40, C.greyInk);
  ctx.restore();
  const k = sp(t, 5.4, SPRING.bouncy);
  if (k > 0.01) { ctx.save(); ctx.translate(x + 40, y + 270); ctx.scale(k, k); shadowed(ctx, 0.1, () => { ctx.fillStyle = '#E6DED2'; rrect(ctx, -260, -60, 520, 120, 40); ctx.fill(); }); tA(ctx, 'تمام، احجزلي', 50, 16, 44, C.greyInk); check(ctx, -170, 0, 60, C.greyInk, 9); ctx.restore(); }
}
function clock(ctx, t) {
  const [x, y] = P.clock; const d = drop(t, 7.75);
  if (!card(ctx, x, y, 470, 470, { r: 235, d })) return;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.fillStyle = i % 3 ? '#CFC4B4' : C.ink; ctx.beginPath(); ctx.arc(Math.cos(a) * 190, Math.sin(a) * 190, i % 3 ? 7 : 11, 0, TAU); ctx.fill(); }
  const p = E.inOutCubic(prog(t, 7.1, 8.75));
  const minA = -Math.PI / 2 + p * 2 * TAU, hrA = -Math.PI / 2 + ((9 + 2 * p) % 12) / 12 * TAU;
  const ext = E.inOutCubic(prog(t, 9.85, 10.05));
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.ink; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(hrA) * 110, Math.sin(hrA) * 110); ctx.stroke();
  ctx.strokeStyle = C.coral; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(minA) * (170 + 130 * ext), Math.sin(minA) * (170 + 130 * ext)); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill();
  ctx.restore();
  const hh = 9 + Math.floor(2 * p), mm = Math.floor(((2 * p) % 1) * 60);
  tL(ctx, `${hh}:${String(mm).padStart(2, '0')}`, x, y - 330, 76, p >= 1 ? C.coral : C.ink);
}
function replyBubble(ctx, t) {
  const p = clamp((t - 14.25) / 0.18);
  if (t < 14.0) return;
  const [x, y] = P.reply;
  ctx.save(); ctx.globalAlpha = p;
  ctx.translate(x, y); ctx.fillStyle = C.mint; rrect(ctx, -320, -85, 640, 170, 50); ctx.fill(); ctx.globalAlpha = 1;
  if (p > 0) { tA(ctx, 'أهلاً! متاح النهارده 5:00 أو 6:30', 290, 14, 40, '#06281C', { align: 'right' }); tL(ctx, '9:00', -250, 60, 30, C.mintInk); check(ctx, -190, 48, 26, C.mintInk, 5); }
  ctx.restore();
}
const DATA = ['الأسعار', 'المواعيد', 'المنيو'];
function dataCards(ctx, t) {
  DATA.forEach((s, i) => {
    const d = drop(t, 16.0 + i * 0.3);
    const x = P.cards[0] + (i - 1) * 230, y = P.cards[1] + (i - 1) * -60;
    if (!card(ctx, x, y, 240, 300, { r: 22, d, rot: (i - 1) * 0.08 })) return;
    for (let r = 0; r < 4; r++) { ctx.fillStyle = r === 0 ? C.mint : '#E9DFCF'; rrect(ctx, -85, -60 + r * 46, r === 0 ? 120 : 170 - r * 20, 18, 9); ctx.fill(); }
    tA(ctx, s, 0, -95, 40, C.ink);
    ctx.restore();
  });
}
function calendar(ctx, t) {
  const [x, y] = P.cal; const d = drop(t, 17.55);
  if (!card(ctx, x, y, 560, 480, { r: 34, d, rot: -0.03 })) return;
  ctx.fillStyle = C.coral; ctx.beginPath(); ctx.roundRect(-280, -240, 560, 100, [34, 34, 0, 0]); ctx.fill();
  tA(ctx, 'المواعيد', 230, -175, 44, C.paper, { align: 'right' });
  const hot = E.outBack(prog(t, T(17.44), T(17.44) + 0.3), 2);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
    const cx = 200 - c * 100, cy = -70 + r * 100, on = r === 1 && c === 2;
    ctx.fillStyle = on && hot > 0 ? C.mint : '#F1E8DA'; ctx.save(); ctx.translate(cx, cy); if (on) ctx.scale(1 + 0.3 * hot * (1 - hot) * 4 * 0.2 + (hot > 0 ? 0 : 0), 1);
    rrect(ctx, -40, -40, 80, 80, 16); ctx.fill(); if (on && hot > 0) check(ctx, 0, 0, 40 * hot, '#06281C', 8); ctx.restore();
  }
  ctx.restore();
  write(ctx, 'تحجزله', x, y + 330, 96, C.ink, t, T(17.44), 0.4);
}
function sheet(ctx, t) {
  const [x, y] = P.sheet; const d = drop(t, 18.5);
  if (!card(ctx, x, y, 700, 380, { r: 26, d, rot: 0.03 })) return;
  const rows = [['الاسم', 'الطلب', 'الحالة'], ['أحمد', 'حجز', 'تم'], ['منى', 'أوردر', 'تم']];
  const cols = [300, 80, -150];
  rows.forEach((row, ri) => {
    const yy = -120 + ri * 110;
    if (ri) { ctx.fillStyle = '#EADFCF'; ctx.fillRect(-330, yy - 70, 660, 2); }
    const isNew = ri === 2, rk = isNew ? prog(t, T(18.37), T(18.37) + 0.7) : 1;
    if (isNew && rk > 0) { ctx.fillStyle = 'rgba(65,236,174,0.35)'; ctx.fillRect(-330, yy - 62, 660, 96); }
    row.forEach((c, ci) => { if (!isNew || rk > ci / 3 + 0.05) tA(ctx, c, cols[ci], yy, ri ? 42 : 32, ri ? (ci === 2 ? C.mintInk : C.ink) : C.greyInk, { align: 'right' }); });
  });
  ctx.restore();
  write(ctx, 'وتسجّل الطلب', x, y + 290, 92, C.ink, t, T(18.37), 0.45);
}
function bell(ctx, t) {
  const [x, y] = P.bell; const d = drop(t, 19.45);
  const ring = t > T(19.44) ? 0.35 * Math.exp(-(t - T(19.44)) * 2.2) * Math.sin((t - T(19.44)) * 26) : 0;
  if (!card(ctx, x, y, 320, 320, { r: 160, d })) return;
  ctx.rotate(ring);
  ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(-90, 60); ctx.quadraticCurveTo(-90, -100, 0, -100); ctx.quadraticCurveTo(90, -100, 90, 60); ctx.lineTo(115, 85); ctx.lineTo(-115, 85); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 105, 24, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -112, 16, 0, TAU); ctx.fill();
  ctx.restore();
  if (t > T(19.44)) for (let i = 0; i < 2; i++) { const ph = ((t - T(19.44)) * 1.4 + i * 0.5) % 1; ctx.save(); ctx.strokeStyle = `rgba(255,107,74,${0.6 * (1 - ph)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 170 + ph * 120, -2.4, -0.7); ctx.stroke(); ctx.restore(); }
  write(ctx, 'وتفكّره بميعاده', x, y + 280, 92, C.ink, t, T(19.44), 0.45);
}
function cup(ctx, t) {
  const [x, y] = P.cup; const d = drop(t, T(20.74) - 0.1);
  if (d.a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(d.s, d.s);
  shadowed(ctx, d.lift, () => { ctx.fillStyle = C.paper; ctx.beginPath(); ctx.ellipse(0, 120, 230, 50, 0, 0, TAU); ctx.fill(); });
  shadowed(ctx, d.lift, () => { ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(-130, -60); ctx.lineTo(130, -60); ctx.lineTo(100, 110); ctx.quadraticCurveTo(0, 140, -100, 110); ctx.closePath(); ctx.fill(); });
  ctx.strokeStyle = C.coral; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(150, 10, 50, -1.2, 1.2); ctx.stroke();
  ctx.fillStyle = '#5A3A26'; ctx.beginPath(); ctx.ellipse(0, -60, 130, 26, 0, 0, TAU); ctx.fill();
  ctx.restore();
  // steam (it will become the CTA line)
  if (t > T(20.74)) for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.strokeStyle = `rgba(27,42,65,${0.25 * clamp((t - T(20.74)) * 2) * (1 - prog(t, 23.4, 23.9))})`; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); for (let k = 0; k <= 20; k++) { const yy = y - 120 - k * 12, xx = x - 60 + i * 60 + Math.sin(k * 0.5 + t * 3 + i) * 18; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.restore();
  }
  // the same countdown as the opening, now resting: nobody needs to race
  const k = sp(t, T(21.57) - 0.1, SPRING.gentle);
  if (k > 0.01) {
    const [cx, cy] = P.calm; ctx.save(); ctx.translate(cx, cy); ctx.scale(0.55 * k, 0.55 * k);
    shadowed(ctx, 0.05, () => { ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(0, 0, 240, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = C.mint; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(0, 0, 286, 0, TAU); ctx.stroke();
    check(ctx, 0, 10, 220, C.mintInk, 34); ctx.restore();
  }
  write(ctx, 'مش محتاج تلحق خالص', x, y + 330, 88, C.ink, t, T(21.57), 0.6);
}
function ending(ctx, t, IMG) {
  const [px, py] = P.pill;
  const f = E.outCubic(prog(t, 24.3, 24.5));
  if (f > 0) {
    const pulse = t > 28.6 ? 0.035 * Math.sin((t - 28.6) * 6) : 0;
    ctx.save(); ctx.translate(px, py); ctx.scale(1 + pulse, 1 + pulse); ctx.globalAlpha = f;
    shadowed(ctx, 0.15, () => { ctx.fillStyle = C.mint; rrect(ctx, -380, -90, 760, 180, 90); ctx.fill(); });
    tL(ctx, '010 9311 4446', -70, 24, 66, '#06281C'); tA(ctx, 'واتساب', 320, 20, 46, '#06281C', { align: 'right' });
    ctx.fillStyle = 'rgba(6,40,28,0.3)'; ctx.fillRect(110, -45, 3, 90);
    ctx.restore();
  }
  // headline + logo sticker as one group, centred: the sticker sits a short gap from the words
  if (!HEAD) {
    ctx.save(); ctx.font = font(130, 400, D); const w = ctx.measureText('ابعت ديمو').width; ctx.restore();
    const stick = 260 + 32, gap = 44, G = stick + gap + w, left = px - G / 2;
    HEAD = { stickerX: left + stick / 2, textX: left + stick + gap + w / 2 };
  }
  // the logo as a sticker slapped onto the table
  const d = drop(t, 24.15);
  if (IMG.only && d.a > 0) {
    const [, ly] = P.logo; const s = 260;
    ctx.save(); ctx.translate(HEAD.stickerX, ly + 60); ctx.rotate(-0.09); ctx.scale(d.s, d.s); ctx.globalAlpha = d.a;
    shadowed(ctx, d.lift, () => { ctx.fillStyle = '#FFFFFF'; rrect(ctx, -s / 2 - 16, -s / 2 - 16, s + 32, s + 32, s * 0.22 + 10); ctx.fill(); });
    ctx.save(); rrect(ctx, -s / 2, -s / 2, s, s, s * 0.2); ctx.clip(); ctx.drawImage(IMG.only, 609, 304, 1182, 1182, -s / 2, -s / 2, s, s); ctx.restore();
    ctx.restore();
  }
  write(ctx, 'ابعت ديمو', HEAD.textX, P.logo[1] + 30, 130, C.ink, t, 23.75, 0.5);
  write(ctx, 'على واتساب', HEAD.textX, P.logo[1] + 170, 84, C.coral, t, 24.6, 0.45);
  write(ctx, 'وجرّب تسابقه!', px - 130, py + 215, 90, C.ink, t, T(25.39), 0.5, { rot: -0.03 });
  // a stopwatch drops in for the race
  const ds = drop(t, 27.3);
  if (ds.a > 0) {
    ctx.save(); ctx.translate(px - 300, py + 420); ctx.scale(ds.s * 0.8, ds.s * 0.8); ctx.globalAlpha = ds.a;
    shadowed(ctx, ds.lift, () => { ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fill(); });
    ctx.fillStyle = C.ink; rrect(ctx, -22, -150, 44, 36, 8); ctx.fill();
    ctx.strokeStyle = C.coral; ctx.lineWidth = 10; ctx.lineCap = 'round'; const a = -Math.PI / 2 + (t - 27.3) * 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 80, Math.sin(a) * 80); ctx.stroke();
    ctx.restore();
  }
  if (t > 28.6) for (let r = 0; r < 2; r++) { const ph = ((t - 28.6) * 0.7 + r * 0.5) % 1; ctx.save(); ctx.strokeStyle = `rgba(11,92,66,${0.45 * (1 - ph)})`; ctx.lineWidth = 5; rrect(ctx, px - 380 - ph * 50, py - 90 - ph * 50, 760 + ph * 100, 180 + ph * 100, 140); ctx.stroke(); ctx.restore(); }
}

// ---------------------------------------------------------------- frame
let PAPER = null, GRAIN = [], HEAD = null;
function table(ctx, cam) {
  // the table surface lives in world space, so its fibres travel with every camera move
  ctx.save(); ctx.fillStyle = PAPER; const r = 9000; ctx.fillRect(cam.x - r, cam.y - r, 2 * r, 2 * r); ctx.restore();
}
function draw(ctx, t, IMG) {
  const cam = camera(t);
  ctx.fillStyle = C.sand; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H * 0.47);
  ctx.rotate(0.012 * Math.sin(t * 0.6) - 0.02 * cam.m * cam.dx);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
  table(ctx, cam);
  const tip = drawStrokes(ctx, t);
  // objects (each knows when it lands)
  counter(ctx, t);
  if (t < 4.2) msgBubble(ctx, ...P.bubble, 620, 'متاح النهارده؟', '9:00', { d: drop(t, -0.4) });
  else {   // the unanswered message slides off down the grey path to someone else
    const s = STROKES[2], p = E.inOutCubic(clamp((t - 4.2) / 1.05));
    const [x, y] = p < 1 ? strokeAt(s, p) : [P.rival[0] + 40, P.rival[1] + 270];
    if (p < 1) msgBubble(ctx, lerp(P.bubble[0], x, Math.min(1, p * 1.6)), lerp(P.bubble[1], y, Math.min(1, p * 1.6)), 620, 'متاح النهارده؟', '9:00', { d: { k: 1, lift: 0.4 * Math.sin(Math.PI * p), s: 1 - 0.25 * p, a: 1 - prog(p, 0.85, 1) } });
    // a ghost of it stays where it was: proof it was there first
    if (t > 14.0) msgBubble(ctx, ...P.bubble, 620, 'متاح النهارده؟', '9:00', { d: drop(t, 13.85) });
  }
  stamp(ctx, 'خلصوا.', P.counter[0] - 330, P.counter[1] + 30, 120, C.coral, t, T(3.4), { rot: 0.12 });
  rival(ctx, t);
  write(ctx, 'وهو بعت لغيرك', P.rival[0] + 120, P.rival[1] - 290, 96, C.ink, t, T(4.33), 0.6);
  write(ctx, 'ساعتين', P.clock[0] + 20, P.clock[1] - 470, 150, C.coral, t, T(6.79) + 0.4, 0.5, { rot: -0.04 });
  if (t > T(8.4)) {
    write(ctx, 'مش 5 ثواني', P.clock[0] - 540, P.clock[1] + 60, 70, C.greyInk, t, T(8.4), 0.4, { face: UI, weight: 700, rot: 0.06 });
    const k = E.outCubic(prog(t, T(8.4) + 0.4, T(8.4) + 0.65)); if (k > 0) { ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(P.clock[0] - 380, P.clock[1] + 40); ctx.lineTo(P.clock[0] - 380 - 330 * k, P.clock[1] + 50 + 8 * k); ctx.stroke(); ctx.restore(); }
  }
  clock(ctx, t);
  write(ctx, 'والعميل مش هيستنى', P.text[0], P.text[1] - 60, 92, C.ink, t, T(9.78), 0.6);
  write(ctx, 'اللي يرد الأول', P.text[0], P.text[1] + 110, 130, C.ink, t, T(11.58), 0.5);
  stamp(ctx, 'ياخده.', P.text[0], P.text[1] + 330, 230, C.coral, t, T(12.81), { rot: -0.06 });
  replyBubble(ctx, t);
  stamp(ctx, 'نستا', P.reply[0] + 220, P.reply[1] + 250, 170, C.mintInk, t, T(13.68) + 0.05, { rot: -0.05 });
  write(ctx, 'بترد أول ما يبعت', P.reply[0] - 100, P.reply[1] + 400, 84, C.ink, t, T(13.68) + 0.6, 0.6);
  dataCards(ctx, t);
  write(ctx, 'من بياناتك إنت', P.cards[0], P.cards[1] + 300, 92, C.ink, t, T(15.66), 0.6);
  calendar(ctx, t); sheet(ctx, t); bell(ctx, t); cup(ctx, t);
  ending(ctx, t, IMG);
  nib(ctx, tip);
  ctx.restore();
}

M.film({
  fonts: [font(100, 400, D), font(40, 700, UI), font(40, 600, UI)],
  images: { only: 'assets/logo_only.jpg' },
  hits: HITS,
  samples: 6,
  init(ctx) {
    // sand paper: base, soft blotches, short fibres (seeded)
    const c = document.createElement('canvas'); c.width = 640; c.height = 640; const x = c.getContext('2d');
    x.fillStyle = C.sand; x.fillRect(0, 0, 640, 640);
    const r = M.mulberry32(42);
    for (let i = 0; i < 60; i++) { const g = x.createRadialGradient(r() * 640, r() * 640, 0, r() * 640, r() * 640, 60 + r() * 140); g.addColorStop(0, 'rgba(214,190,160,0.10)'); g.addColorStop(1, 'rgba(214,190,160,0)'); x.fillStyle = g; x.fillRect(0, 0, 640, 640); }
    for (let i = 0; i < 900; i++) { x.strokeStyle = r() < 0.5 ? 'rgba(160,128,90,0.08)' : 'rgba(255,255,255,0.25)'; x.lineWidth = 1 + r(); const px = r() * 640, py = r() * 640, a = r() * TAU, L = 4 + r() * 14; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); }
    PAPER = ctx.createPattern(c, 'repeat');
    for (let g = 0; g < 3; g++) {
      const gc = document.createElement('canvas'); gc.width = 270; gc.height = 480; const gx = gc.getContext('2d'); const im = gx.createImageData(270, 480); const rr = M.mulberry32(7 + g);
      for (let i = 0; i < im.data.length; i += 4) { const v = rr() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      gx.putImageData(im, 0, 0); GRAIN.push(gc);
    }
  },
  draw(ctx, u, t, IMG) { draw(ctx, t, IMG); },
  post(ctx, u, t) {
    const g = GRAIN[Math.floor(t * 24) % 3];
    if (g) { ctx.save(); ctx.globalAlpha = 0.04; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(g, 0, 0, W, H); ctx.restore(); }
    // warm desk light from the top-right, falloff to the corners
    const l = ctx.createRadialGradient(W * 0.7, H * 0.18, 100, W * 0.5, H * 0.5, H * 0.85);
    l.addColorStop(0, 'rgba(255,248,235,0.18)'); l.addColorStop(0.6, 'rgba(0,0,0,0)'); l.addColorStop(1, 'rgba(70,45,20,0.22)');
    ctx.fillStyle = l; ctx.fillRect(0, 0, W, H);
  },
});
