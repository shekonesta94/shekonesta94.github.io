// العقدة — Nesta ad 1. Pure function of time: window.seek(t) paints frame t.
// Timed in seconds against the placed VO (audio/vo.wav, take +0.5 s); grid 120 bpm (beat = t*2).
import * as M from './lib/motion.js';

const { W, H, FORMAT, E, prog, lerp, clamp, spring, SPRING, wobble, font, fill, rrect, hash01, noise1, mix, TAU } = M;

const C = {
  bg: '#1A1423', bg2: '#251B31', thread: '#EDE4D6', far: '#6E6475', amber: '#FFB86B', mint: '#41ECAE',
  ink: '#2A1A10', navy: '#0F1E33', cream: '#F4EFE6', sky: '#120F2A', plum: '#2B1631', teal: '#0E1B1E',
};
const D = 'Display', UI = 'UI';
const B = (t) => t / 0.500026;                 // seconds -> beats (for HITS)
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const SAFE = FORMAT.safe;
const CX = SAFE.x + SAFE.w / 2;

// ---------------------------------------------------------------- VO phrases (placed, seconds)
const VO = {
  A: [0.71, 1.89, 'لو يومك ليه شكل…'], Bb: [2.18, 2.82, 'فهو ده!'],
  C1: [3.37, 5.26, 'نفس السؤال، من عشرين عميل'], D1: [5.52, 7.45, 'وإنت بترد على كل واحد بإيدك'],
  E1: [7.95, 8.38, 'نستا'], F1: [8.63, 9.86, 'بتمسك أول الخيط'], G1: [10.27, 11.89, 'بوت واتساب بيرد بدالك'],
  H1: [12.37, 13.75, 'من بيانات نشاطك إنت،'], H2: [13.85, 15.03, 'ومش بيألّف ولا كلمة'],
  I1: [15.62, 16.65, 'الحجز في التقويم،'], I2: [16.7, 17.62, 'والأوردر في الشيت…'], J1: [17.96, 18.4, 'لوحده!'],
  K1: [19.03, 19.65, 'بالليل،'], K2: [19.72, 20.33, 'في العيد،'], L1: [20.61, 21.96, 'وإنت بتتفرج على الماتش…'], M1: [22.36, 22.93, 'شغال.'],
  N1: [23.59, 24.53, 'العقدة اتفكّت.'], O1: [25.09, 26.55, 'ابعت كلمة ديمو على واتساب'], O2: [26.6, 28.27, 'وجرّبه كأنك عميل عندك'],
};

// ---------------------------------------------------------------- hits
const HITS = [
  [B(0.0), 'knot', 'sub', { len: 0.8 }],
  [B(0.05), 'tag1', 'pop', { pitch: 'E5' }], [B(0.45), 'tag2', 'pop', { pitch: 'G5' }], [B(0.85), 'tag3', 'pop', { pitch: 'A5' }],
  [B(1.25), 'tag4', 'pop', { pitch: 'B5' }], [B(1.65), 'tag5', 'pop', { pitch: 'D6' }],
  [B(2.18), 'fahoo dah', 'thud'],
  [B(3.37), 'dive', 'whoosh', { len: 0.5, from: 500, to: 2600 }],
  ...Array.from({ length: 10 }, (_, i) => [B(3.42 + i * 0.18), 'bubble', 'tick']),
  [B(5.25), 'x20', 'click'],
  [B(5.7), 'reply1', 'type', { len: 0.4, n: 5 }], [B(6.4), 'reply2', 'type', { len: 0.4, n: 5 }], [B(7.05), 'reply3', 'type', { len: 0.35, n: 4 }],
  [B(7.95), 'whip up', 'whoosh', { len: 0.35, from: 2400, to: 700 }],
  [B(8.0), 'nesta node lands', 'impact'],
  [B(8.7), 'pull', 'boing', { pitch: 'A3', to: 'E4' }],
  [B(10.3), 'chat card', 'whoosh', { len: 0.4 }],
  [B(10.9), 'bot reply', 'blip', { pitch: 'E6' }],
  [B(12.45), 'lane 1', 'tok', { pitch: 'E5' }], [B(12.75), 'lane 2', 'tok', { pitch: 'G5' }], [B(13.05), 'lane 3', 'tok', { pitch: 'B5' }],
  [B(14.35), 'snip', 'click'],
  [B(15.15), 'pan', 'whoosh', { len: 0.5, from: 800, to: 2000 }],
  [B(15.9), 'calendar cell', 'bell', { pitch: 'E6' }],
  [B(16.9), 'sheet row', 'type', { len: 0.6, n: 7 }],
  [B(17.96), 'stamp', 'thud'],
  [B(18.75), 'flip', 'whoosh', { len: 0.3, from: 1800, to: 600 }],
  [B(19.72), 'eid', 'whoosh', { len: 0.25 }], [B(20.61), 'match', 'whoosh', { len: 0.25 }],
  [B(22.36), '24/7', 'impact'],
  [B(23.3), 'gather', 'riser', { len: 0.4 }],
  [B(23.7), 'logo', 'bell', { pitch: 'B5' }],
  [B(25.05), 'end card', 'whoosh', { len: 0.4 }],
  [B(26.0), 'pill', 'pop', { pitch: 'E6' }],
  [B(28.6), 'pulse', 'blip', { pitch: 'B5' }],
  [B(29.6), 'promise', 'pop', { pitch: 'B5' }],
];

// ---------------------------------------------------------------- Arabic type (whole words: never split glyphs)
function wordsOf(str) { return str.split(' '); }
function onsets(words, t0, t1) {
  const lens = words.map((w) => w.length + 1), tot = lens.reduce((a, b) => a + b, 0);
  let acc = 0; return lens.map((l) => { const o = t0 + (acc / tot) * (t1 - t0) * 0.85; acc += l; return o; });
}
// Lays out words right-to-left, wrapping at maxW. Returns lines of {w, width}.
function wrap(ctx, words, f, maxW) {
  ctx.font = f; const sp = ctx.measureText(' ').width;
  const lines = []; let cur = [], cw = 0;
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    if (cur.length && cw + sp + ww > maxW) { lines.push({ items: cur, width: cw }); cur = []; cw = 0; }
    cw += (cur.length ? sp : 0) + ww; cur.push({ w, width: ww });
  }
  if (cur.length) lines.push({ items: cur, width: cw });
  return { lines, sp };
}
// A super: each word springs up into place as it is said; the whole line leaves upward at tOut.
function sup(ctx, t, phrase, { y, size = 92, color = C.cream, hl = {}, cx = CX, maxW = SAFE.w, tOut = 1e9, face = D, weight = 700, lead = 1.18, stag } = {}) {
  const [t0, t1, str] = phrase;
  if (t < t0 - 0.1 || t > tOut + 0.5) return;
  const words = wordsOf(str);
  const ons = stag ? words.map((_, i) => t0 + i * stag) : onsets(words, t0, t1);
  const f = font(size, weight, face);
  const { lines, sp: gap } = wrap(ctx, words, f, maxW);
  ctx.save(); ctx.font = f; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  let wi = 0;
  const out = E.inBack(prog(t, tOut, tOut + 0.35), 1.6);
  lines.forEach((L, li) => {
    let xr = cx + L.width / 2;
    const by = y + li * size * lead;
    L.items.forEach((it) => {
      const k = sp(t, ons[wi] - 0.06, SPRING.bouncy);
      const wcx = xr - it.width / 2; xr -= it.width + gap;
      const col = hl[it.w] || color;
      if (k > 0.001) {
        ctx.save();
        ctx.translate(wcx, by + (1 - k) * size * 0.7 - out * (size * 2.2));
        const s = 0.6 + 0.4 * k; ctx.scale(s, s);
        ctx.globalAlpha = clamp(k * 1.4) * (1 - out);
        ctx.fillStyle = 'rgba(8,5,12,0.45)'; ctx.fillText(it.w, 0, size * 0.06);
        ctx.fillStyle = col; ctx.fillText(it.w, 0, 0);
        ctx.restore();
      }
      wi++;
    });
  });
  ctx.restore();
}
function txt(ctx, s, x, y, size, color, { face = UI, weight = 700, align = 'center', alpha = 1 } = {}) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = align; ctx.fillStyle = color; ctx.globalAlpha = alpha;
  ctx.fillText(s, x, y); ctx.restore();
}
function txtL(ctx, s, x, y, size, color, align = 'center', face = UI) {   // Latin digits / numbers
  ctx.save(); ctx.font = font(size, 700, face); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}

// ---------------------------------------------------------------- threads (2.5-D, the logo's nest)
const NT = 16, NP = 7;
const THREADS = Array.from({ length: NT }, (_, i) => {
  const pts = [];
  let a = hash01(i, 11) * TAU, b = (hash01(i, 12) - 0.5) * 2;
  for (let k = 0; k < NP; k++) {
    a += 1.1 + hash01(i * 13 + k, 21) * 1.6; b += (hash01(i * 7 + k, 31) - 0.5) * 1.3; b = clamp(b, -1, 1);
    const r = 0.55 + 0.45 * hash01(i * 5 + k, 41);
    pts.push([Math.cos(a) * r * Math.sqrt(1 - b * b * 0.6), b * 0.7 * r, Math.sin(a) * r * Math.sqrt(1 - b * b * 0.6)]);
  }
  const lane = i % 3;
  const lanePts = Array.from({ length: NP }, (_, k) => [lerp(1.0, -1.0, k / (NP - 1)), (lane - 1) * 0.42 + (Math.floor(i / 3) - 2.5) * 0.035, 0]);
  return { pts, lanePts, lane, w: 0.85 + 0.3 * hash01(i, 51) };
});
function catmull(P, n = 9) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(P[P.length - 1]); return out;
}
// view: {cx, cy, scale, yaw, pitch, untangle, wob, t, endCol, lineW, pull:[x,y]|null}
function drawKnot(ctx, v) {
  const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), spi = Math.sin(v.pitch);
  const proj = (p) => {
    let [x, y, z] = p;
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y1 = y * cp - z1 * spi, z2 = y * spi + z1 * cp;
    const f = 3.2 / (3.2 - z2);
    return [v.cx + x1 * v.scale * f, v.cy + y1 * v.scale * f, z2, f];
  };
  const u = clamp(v.untangle || 0);
  const items = THREADS.map((th, i) => {
    const P = th.pts.map((p, k) => {
      const q = th.lanePts[k];
      const e = E.inOutCubic(clamp(u * 1.25 - (i % 5) * 0.06));
      const j = (v.wob || 0) * (1 - e);
      return [lerp(p[0], q[0], e) + j * noise1(v.t * 0.7 + i + k, 3) * 0.06, lerp(p[1], q[1], e) + j * noise1(v.t * 0.7 + i * 2 + k, 5) * 0.06, lerp(p[2], q[2], e)];
    });
    if (v.pull && i === 0) { const k = v.pull[2]; P[0] = [lerp(P[0][0], v.pull[0], k), lerp(P[0][1], v.pull[1], k), P[0][2]]; }
    const S = catmull(P).map(proj);
    const z = S.reduce((a, s) => a + s[2], 0) / S.length;
    return { S, z, i, th };
  }).sort((a, b) => a.z - b.z);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const it of items) {
    const f = it.S.reduce((a, s) => a + s[3], 0) / it.S.length;
    const w = v.lineW * it.th.w * f;
    const depth = clamp((it.z + 1) / 2);
    const path = new Path2D(); it.S.forEach((s, k) => (k ? path.lineTo(s[0], s[1]) : path.moveTo(s[0], s[1])));
    ctx.save(); ctx.translate(w * 0.25, w * 0.7); ctx.strokeStyle = 'rgba(6,3,10,0.55)'; ctx.lineWidth = w * 1.35; ctx.stroke(path); ctx.restore();
    ctx.strokeStyle = mix(C.far, v.color || C.thread, 0.35 + 0.65 * depth); ctx.lineWidth = w; ctx.stroke(path);
    ctx.save(); ctx.translate(-w * 0.12, -w * 0.18); ctx.strokeStyle = `rgba(255,255,255,${0.18 + 0.3 * depth})`; ctx.lineWidth = w * 0.26; ctx.stroke(path); ctx.restore();
    // end beads: amber while tangled, mint as Nesta takes over
    const endC = v.endCol ? v.endCol(it.i) : C.amber;
    for (const s of [it.S[0], it.S[it.S.length - 1]]) {
      ctx.beginPath(); ctx.arc(s[0], s[1], w * 0.95, 0, TAU); ctx.fillStyle = endC; ctx.fill();
    }
  }
  ctx.restore();
  return { proj, items };
}
function knotPoint(i, sIdx, v) {   // screen point on thread i (catmull sample index), for tags
  const r = drawKnotProjectOnly(i, v); return r[Math.min(r.length - 1, sIdx)];
}
function drawKnotProjectOnly(i, v) {
  const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), spi = Math.sin(v.pitch);
  return catmull(THREADS[i].pts).map(([x, y, z]) => {
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; const y1 = y * cp - z1 * spi, z2 = y * spi + z1 * cp; const f = 3.2 / (3.2 - z2);
    return [v.cx + x1 * v.scale * f, v.cy + y1 * v.scale * f];
  });
}

// ---------------------------------------------------------------- shared bits
let GRAIN = [], PLATE = null;
function bg(ctx, c1 = C.bg, c2 = C.bg2) {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.42, 80, W * 0.5, H * 0.5, H * 0.75);
  g.addColorStop(0, c2); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function pill(ctx, x, y, label, { size = 40, bgc = C.amber, fg = C.ink, k = 1, rot = 0 } = {}) {
  if (k <= 0.001) return;
  ctx.save(); ctx.font = font(size, 700, UI); ctx.direction = /^[+0-9]/.test(label) ? 'ltr' : 'rtl';
  const w = ctx.measureText(label).width + size * 1.1, h = size * 1.65;
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  rrect(ctx, -w / 2 + 4, -h / 2 + 8, w, h, h / 2); ctx.fillStyle = 'rgba(6,3,10,0.45)'; ctx.fill();
  rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = bgc; ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 2);
  ctx.restore();
}
function bubble(ctx, x, y, w, label, { inc = true, k = 1, rot = 0, size = 40, bgc, fg = '#1F1A24' } = {}) {
  if (k <= 0.001) return;
  const h = size * 1.9;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(6,3,10,0.4)'; rrect(ctx, -w / 2 + 6, -h / 2 + 10, w, h, 26); ctx.fill();
  ctx.fillStyle = bgc || (inc ? C.cream : '#D9CFBF'); rrect(ctx, -w / 2, -h / 2, w, h, 26); ctx.fill();
  // tail
  ctx.beginPath(); const tx = inc ? w / 2 - 10 : -w / 2 + 10; ctx.moveTo(tx, -h / 2 + 4); ctx.lineTo(tx + (inc ? 22 : -22), -h / 2); ctx.lineTo(tx, -h / 2 + 30); ctx.fill();
  ctx.font = font(size, 600, UI); ctx.direction = /^[+0-9]/.test(label) ? 'ltr' : 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fg; ctx.fillText(label, 0, 3);
  ctx.restore();
}
function rope(ctx, pts, w, color = C.thread) {   // a 2-D thread with the same shading
  const path = new Path2D(); pts.forEach((p, k) => (k ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(w * 0.2, w * 0.6); ctx.strokeStyle = 'rgba(6,3,10,0.5)'; ctx.lineWidth = w * 1.3; ctx.stroke(path); ctx.restore();
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(path);
  ctx.save(); ctx.translate(-w * 0.1, -w * 0.18); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = w * 0.24; ctx.stroke(path); ctx.restore();
  ctx.restore();
}
function glowDot(ctx, x, y, r, color = C.mint) {
  const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 3.2);
  g.addColorStop(0, 'rgba(65,236,174,0.55)'); g.addColorStop(1, 'rgba(65,236,174,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, TAU); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.32, 0, TAU); ctx.fill();
}

// ================================================================ S1  the knot (0 – 3.37)
const TAGS = [
  [0.05, 'بكام؟', 2, 20], [0.45, 'متاح بكرة؟', 7, 34], [0.85, 'فين اللوكيشن؟', 11, 12],
  [1.25, 'لسه فاتحين؟', 4, 44], [1.65, 'عايز أحجز', 13, 26], [2.0, 'فيه توصيل؟', 9, 50],
];
function knotView(t) {
  return { cx: W / 2, cy: H * 0.53, scale: FORMAT.pick({ '9x16': 455, '16x9': 380 }), yaw: 0.5 + t * 0.32, pitch: 0.35 + 0.05 * Math.sin(t), untangle: 0, wob: 1, t, lineW: 15 };
}
function sceneKnot(ctx, t) {
  bg(ctx);
  const v = knotView(t);
  const sq = 0.06 * wobble(t - 2.18, 2.6, 5);
  ctx.save();
  // dive: log zoom toward a thread point
  const dz = E.inCubic(prog(t, 2.95, 3.37));
  const target = knotPoint(2, 20, v);
  const z = Math.pow(9, dz);
  ctx.translate(target[0], target[1]); ctx.scale(z * (1 + sq), z * (1 - sq)); ctx.translate(-target[0], -target[1]);
  drawKnot(ctx, v);
  TAGS.forEach(([t0, label, th, si], i) => {
    const k = sp(t, t0, SPRING.bouncy);
    const p = knotPoint(th, si, v);
    const off = [[-130, -150], [150, -170], [-150, 140], [160, 120], [-60, 220], [120, -260]][i];
    if (k > 0) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,184,107,0.7)'; ctx.lineWidth = 4; ctx.setLineDash([2, 10]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + off[0] * k, p[1] + off[1] * k); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(p[0], p[1], 9, 0, TAU); ctx.fillStyle = C.amber; ctx.fill();
    }
    pill(ctx, p[0] + off[0] * k, p[1] + off[1] * k, label, { k, rot: (hash01(i, 77) - 0.5) * 0.16, size: 42 });
  });
  ctx.restore();
  sup(ctx, t, VO.A, { y: SAFE.y + 150, size: 96, tOut: 2.95 });
  // «فهو ده!» slams big under the knot
  const k = sp(t, 2.14, SPRING.bouncy);
  if (k > 0 && t < 3.0) {
    ctx.save(); ctx.translate(W / 2, H * 0.53 + 520); ctx.rotate(-0.05); ctx.scale(1.6 - 0.6 * k, 1.6 - 0.6 * k);
    ctx.globalAlpha = clamp(k * 2) * (1 - prog(t, 2.8, 3.0));
    txt(ctx, 'فهو ده!', 0, 0, 150, C.amber, { face: D }); ctx.restore();
  }
}

// ================================================================ S2  ×20 (3.37 – 7.95)
const PILE = Array.from({ length: 20 }, (_, i) => ({
  t0: 3.42 + i * 0.09, x: W / 2 + (hash01(i, 3) - 0.5) * 420, y: H * 0.36 + (hash01(i, 4)) * 560, rot: (hash01(i, 5) - 0.5) * 0.35,
}));
function sceneDup(ctx, t) {
  bg(ctx, C.bg, '#2A1D2F');
  // giant rope (the thread we dived into), slowly tightening
  const tight = E.inOutSine(prog(t, 5.5, 7.9));
  const pts = Array.from({ length: 40 }, (_, k) => {
    const x = lerp(-200, W + 200, k / 39);
    return [x, H * 0.62 + Math.sin(k * 0.45 + t * 1.3) * (90 - 60 * tight) + (x - W / 2) * -0.45];
  });
  rope(ctx, pts, 70 + 10 * tight);
  // the pile of identical questions
  const fade = 1;
  PILE.forEach((b, i) => {
    const k = sp(t, b.t0, SPRING.bouncy);
    const nm = ['أحمد', 'منى', 'كريم', 'سارة', 'محمود', 'نور', 'ياسين', 'هالة', 'عمر', 'رنا'][i % 10];
    if (k > 0) bubble(ctx, b.x, b.y - (1 - k) * 120, 330, `${nm}: بكام؟`, { k: (0.7 + 0.3 * k) * fade, rot: b.rot, size: 40 });
  });
  // counter
  const n = Math.min(20, Math.max(0, Math.floor((t - 3.42) / 0.09) + 1));
  if (t > 3.42) {
    const kk = 1 + 0.25 * wobble(t - 5.25, 3, 6);
    ctx.save(); ctx.translate(SAFE.x + 150, SAFE.y + 430); ctx.rotate(-0.08); ctx.scale(kk, kk);
    txtL(ctx, `×${n}`, 0, 0, 170, C.amber); ctx.restore();
  }
  // slow manual replies
  [[5.65, 'حاضر، السعر…'], [6.35, 'أيوه متاح…'], [7.0, 'ثواني وأرد…']].forEach(([t0, s], i) => {
    const k = sp(t, t0, SPRING.gentle);
    bubble(ctx, SAFE.x + SAFE.w - 220 - i * 30, H * 0.9 - 420 + i * 140, 360, s, { inc: false, k, rot: 0.03 * (i - 1), size: 38 });
  });
  // typing dots on the last
  sup(ctx, t, VO.C1, { y: SAFE.y + 120, size: 88, tOut: 5.45, hl: { 'السؤال،': C.amber } });
  sup(ctx, t, VO.D1, { y: SAFE.y + 120, size: 84, hl: { 'بإيدك': C.amber } });
}

// ================================================================ S3/S4/S5  Nesta pulls the thread (7.95 – 18.9)
function nestaView(t) {
  const base = knotView(t);
  const un = lerp(0, 0.55, E.inOutCubic(prog(t, 8.6, 12.0))) + 0.45 * E.inOutCubic(prog(t, 12.2, 13.6));
  const yaw = lerp(base.yaw, Math.round(base.yaw / Math.PI) * Math.PI, E.inOutCubic(prog(t, 11.6, 13.6)));
  const pitch = lerp(base.pitch, 0, E.inOutCubic(prog(t, 11.6, 13.6)));
  const lift = E.inOutCubic(prog(t, 10.0, 10.8)) * (1 - E.inOutCubic(prog(t, 12.0, 12.8)));
  return { ...base, yaw, pitch, untangle: un, cy: H * 0.53 - 230 * lift, scale: base.scale * (1 - 0.22 * lift) * (1 + 0.15 * E.inOutCubic(prog(t, 12.2, 13.6))), wob: 1 - un };
}
function chatCard(ctx, t) {
  const k = sp(t, 10.27, SPRING.gentle);
  const out = E.inBack(prog(t, 12.0, 12.45), 1.4);
  if (k <= 0.001 || out >= 1) return;
  const w = 820, h = 560, x = W / 2, y = H * 0.66 + (1 - k) * 700 + out * 900;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04 + 0.04 * k); ctx.transform(1, 0, -0.06 * (1 - k), 1, 0, 0);
  ctx.fillStyle = 'rgba(6,3,10,0.5)'; rrect(ctx, -w / 2 + 14, -h / 2 + 24, w, h, 40); ctx.fill();
  ctx.fillStyle = '#F7F3EC'; rrect(ctx, -w / 2, -h / 2, w, h, 40); ctx.fill();
  ctx.fillStyle = '#1E2A33'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, 110, [40, 40, 0, 0]); ctx.fill();
  ctx.beginPath(); ctx.arc(w / 2 - 70, -h / 2 + 55, 30, 0, TAU); ctx.fillStyle = C.mint; ctx.fill();
  txt(ctx, 'عيادة د. سارة · بوت الحجز', w / 2 - 120, -h / 2 + 68, 36, '#F4EFE6', { align: 'right' });
  txt(ctx, 'متصل الآن', w / 2 - 120, -h / 2 + 100, 24, C.mint, { align: 'right', weight: 500 });
  ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04 + 0.04 * k);
  const k1 = sp(t, 10.45, SPRING.bouncy), k2 = sp(t, 10.9, SPRING.bouncy);
  bubble(ctx, 150, -110, 480, 'عايزة أحجز كشف بكرة', { k: k1, size: 36 });
  // bot reply in mint, types on
  if (k2 > 0) {
    const full = 'متاح بكرة 5:00 أو 6:30 ✦';
    bubble(ctx, -110, 70, 560, 'متاح بكرة الساعة 5:00 أو 6:30', { inc: false, k: k2, size: 34, bgc: C.mint, fg: '#06281C' });
    bubble(ctx, -170, 190, 420, 'تحبي أنهي ميعاد؟', { inc: false, k: sp(t, 11.3, SPRING.bouncy), size: 34, bgc: C.mint, fg: '#06281C' });
  }
  ctx.restore();
}
const LANES = ['الأسعار', 'المواعيد', 'المنيو'];
function sceneNesta(ctx, t, IMG) {
  bg(ctx);
  // camera pan along the lanes to the cards (15.1 – 15.7)
  const pan = E.inOutCubic(prog(t, 15.1, 15.75));
  const v = nestaView(t);
  ctx.save(); ctx.translate(-pan * W * 1.05, 0);
  // shake on the landing
  if (t > 8.0 && t < 8.6) { const a = 18 * Math.exp(-(t - 8.0) * 9); ctx.translate(noise1(t * 40, 2) * a, noise1(t * 40, 9) * a); }
  // node arrives from top and lands on thread 0's first point
  const raw = drawKnotProjectOnly(0, v);
  const end0 = raw[0];
  const landK = E.outCubic(prog(t, 7.75, 8.0));
  const pullK = E.inOutCubic(prog(t, 8.65, 9.6)) * (1 - E.inOutCubic(prog(t, 12.0, 13.0)));
  const pull3 = [1.25, -0.95, pullK];
  const endCol = (i) => mix(C.amber, C.mint, clamp((v.untangle - (i % 6) * 0.08) * 2.2));
  const res = drawKnot(ctx, { ...v, pull: t > 8.6 ? pull3 : null, endCol });
  const it0 = res.items.find((q) => q.i === 0); const e0 = it0 ? it0.S[0] : end0;
  const nx = lerp(W * 0.8, e0[0], landK), ny = lerp(-120, e0[1], landK);
  if (t > 7.75 && t < 12.6) {
    const sq = 0.25 * wobble(t - 8.0, 3, 7);
    ctx.save(); ctx.translate(nx, ny); ctx.scale(1 + sq, 1 - sq); glowDot(ctx, 0, 0, 30); ctx.restore();
  }
  // lanes: chips + pulses (12.3 – 15.5)
  if (t > 12.2) {
    const vv = { ...v, untangle: 1 };
    LANES.forEach((L, li) => {
      const k = sp(t, 12.45 + li * 0.3, SPRING.bouncy);
      const P = drawKnotProjectOnlyLane(li, vv);
      pill(ctx, P[0] - 150, P[1] - 62, L, { k, bgc: C.cream, fg: '#1F1A24', size: 40 });
      // mint pulses riding the lane
      for (let q = 0; q < 3; q++) {
        const ph = ((t - 12.6) * 0.55 + q / 3 + li * 0.17) % 1;
        if (t > 12.6) { const x = lerp(P[0], P[0] - vv.scale * 2.0 * 1.15, ph); glowDot(ctx, x, P[1], 11); }
      }
    });
    // «مش بيألّف»: a stray amber squiggle tries to join and gets snipped
    const sk = prog(t, 13.85, 14.35), cut = prog(t, 14.35, 15.0);
    if (sk > 0 && cut < 1) {
      const pts = Array.from({ length: 30 }, (_, k) => [W * 0.1 + k * 22 * E.outCubic(sk), H * 0.66 - k * 9 * E.outCubic(sk) + Math.sin(k * 0.9 + t * 8) * 26 + E.inQuad(cut) * 700 * (k > 18 ? 1 : 0.6)]);
      ctx.save(); ctx.globalAlpha = 1 - cut; rope(ctx, pts, 12, C.amber); ctx.restore();
      if (t > 14.35 && t < 14.75) { const [qx, qy] = pts[18]; const a = 1 - prog(t, 14.35, 14.75); ctx.save(); ctx.strokeStyle = C.cream; ctx.globalAlpha = a; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(qx - 34, qy - 34); ctx.lineTo(qx + 34, qy + 34); ctx.moveTo(qx + 34, qy - 34); ctx.lineTo(qx - 34, qy + 34); ctx.stroke(); ctx.restore(); }
    }
  }
  // cards world (to the right of the lanes)
  if (t > 14.9) cardsWorld(ctx, t, W * 1.05);
  ctx.restore();
  // supers (screen space)
  sup(ctx, t, VO.E1, { y: SAFE.y + 170, size: 150, color: C.mint, tOut: 10.15, stag: 0.01 });
  sup(ctx, t, VO.F1, { y: SAFE.y + 300, size: 86, tOut: 10.15 });
  sup(ctx, t, VO.G1, { y: SAFE.y + 130, size: 88, tOut: 12.1, hl: { 'واتساب': C.mint } });
  chatCard(ctx, t);
  sup(ctx, t, VO.H1, { y: SAFE.y + 130, size: 86, tOut: 15.05, hl: { 'نشاطك': C.mint } });
  sup(ctx, t, VO.H2, { y: H - 560, size: 80, tOut: 15.05, hl: { 'بيألّف': C.amber } });
  sup(ctx, t, VO.I1, { y: SAFE.y + 120, size: 86, tOut: 18.6, hl: { 'التقويم،': C.mint } });
  sup(ctx, t, VO.I2, { y: SAFE.y + 225, size: 86, tOut: 18.6, hl: { 'الشيت…': C.mint } });
}
function drawKnotProjectOnlyLane(li, v) {   // start (right) point of lane li at untangle 1
  const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), spi = Math.sin(v.pitch);
  const [x, y, z] = [1.0, (li - 1) * 0.42, 0];
  const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; const y1 = y * cp - z1 * spi, z2 = y * spi + z1 * cp; const f = 3.2 / (3.2 - z2);
  return [v.cx + x1 * v.scale * f, v.cy + y1 * v.scale * f];
}
function cardsWorld(ctx, t, ox) {
  ctx.save(); ctx.translate(ox, 0);
  // lanes continue in from the left edge into the cards
  const yCal = H * 0.43, ySh = H * 0.71;
  [[yCal - 30, 0], [yCal + 30, 1], [ySh, 2]].forEach(([y, i]) => {
    const pts = Array.from({ length: 30 }, (_, k) => [lerp(-W * 0.2, W * 0.3, k / 29), lerp(H * (0.36 + i * 0.14), y, E.inOutSine(k / 29))]);
    rope(ctx, pts, 13);
  });
  // calendar card
  const kc = sp(t, 15.3, SPRING.gentle);
  ctx.save(); ctx.translate(W * 0.6, yCal); ctx.rotate(0.03); ctx.scale(kc, kc);
  const cw = 640, ch = 470;
  ctx.fillStyle = 'rgba(6,3,10,0.5)'; rrect(ctx, -cw / 2 + 14, -ch / 2 + 22, cw, ch, 36); ctx.fill();
  ctx.fillStyle = '#F7F3EC'; rrect(ctx, -cw / 2, -ch / 2, cw, ch, 36); ctx.fill();
  ctx.fillStyle = '#E9E1D3'; ctx.beginPath(); ctx.roundRect(-cw / 2, -ch / 2, cw, 90, [36, 36, 0, 0]); ctx.fill();
  txt(ctx, 'التقويم', cw / 2 - 40, -ch / 2 + 60, 40, '#1F1A24', { align: 'right' });
  const fillK = E.outBack(prog(t, 15.75, 16.15), 1.8);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
    const x = cw / 2 - 60 - c * 80, y = -ch / 2 + 140 + r * 82;
    const hot = r === 1 && c === 3;
    ctx.fillStyle = hot ? mix('#E9E1D3', C.mint, fillK > 0 ? 1 : 0) : '#EFE8DC';
    const s = hot ? 1 + 0.25 * wobble(t - 15.9, 3, 6) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rrect(ctx, -34, -32, 68, 64, 14); ctx.fill();
    if (hot && fillK > 0) { ctx.strokeStyle = '#06281C'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-3, 12); ctx.lineTo(16, -12); ctx.stroke(); }
    ctx.restore();
  }
  if (fillK > 0) txtL(ctx, '5:00', -cw / 2 + 40, ch / 2 - 30, 34, '#06281C', 'left');
  ctx.restore();
  // sheet card
  const ks = sp(t, 16.55, SPRING.gentle);
  ctx.save(); ctx.translate(W * 0.55, ySh); ctx.rotate(-0.025); ctx.scale(ks, ks);
  const sw = 760, sh = 380;
  ctx.fillStyle = 'rgba(6,3,10,0.5)'; rrect(ctx, -sw / 2 + 14, -sh / 2 + 22, sw, sh, 30); ctx.fill();
  ctx.fillStyle = '#F7F3EC'; rrect(ctx, -sw / 2, -sh / 2, sw, sh, 30); ctx.fill();
  const cols = [sw / 2 - 40, sw / 2 - 280, sw / 2 - 520];
  const rows = [['الاسم', 'الطلب', 'الحالة'], ['كريم', 'أوردر 2', 'اتسجّل'], ['منى', 'أوردر جديد', 'اتسجّل']];
  rows.forEach((row, ri) => {
    const y = -sh / 2 + 75 + ri * 110;
    if (ri === 0) { ctx.fillStyle = '#E9E1D3'; ctx.beginPath(); ctx.roundRect(-sw / 2, -sh / 2, sw, 110, [30, 30, 0, 0]); ctx.fill(); }
    if (ri > 0) { ctx.fillStyle = '#E2D9C9'; ctx.fillRect(-sw / 2 + 20, y - 75, sw - 40, 2); }
    const isNew = ri === 2, rk = isNew ? prog(t, 16.9, 17.5) : 1;
    if (isNew && rk > 0) { ctx.fillStyle = `rgba(65,236,174,${0.35 * (1 - prog(t, 18.0, 18.6)) + 0.15})`; ctx.fillRect(-sw / 2 + 10, y - 60, sw - 20, 90); }
    row.forEach((cell, ci) => {
      const show = !isNew || rk > ci / 3 + 0.05;
      if (show) txt(ctx, cell, cols[ci], y, ri === 0 ? 34 : 38, ri === 0 ? '#6C6272' : (ci === 2 && ri > 0 ? '#0E7A55' : '#1F1A24'), { align: 'right' });
    });
  });
  ctx.restore();
  // «لوحده!» stamp
  const k = sp(t, 17.92, SPRING.bouncy);
  if (k > 0.01) {
    ctx.save(); ctx.translate(W * 0.36, H * 0.575); ctx.rotate(-0.16); const s = 2.2 - 1.2 * Math.min(1, k); ctx.scale(s, s);
    ctx.globalAlpha = clamp(k * 2);
    ctx.strokeStyle = C.mint; ctx.lineWidth = 9; rrect(ctx, -210, -105, 420, 170, 30); ctx.stroke();
    txt(ctx, 'لوحده!', 0, 30, 120, C.mint, { face: D });
    ctx.restore();
  }
  ctx.restore();
}

// ================================================================ S6  any time (19.0 – 23.2)
function clothesline(ctx, t, y, sag = 90) {
  const pts = Array.from({ length: 40 }, (_, k) => { const x = lerp(-60, W + 60, k / 39); return [x, y + Math.sin((k / 39) * Math.PI) * sag + Math.sin(t * 2 + k * 0.3) * 6]; });
  rope(ctx, pts, 14); return pts;
}
function vNight(ctx, t) {
  fill(ctx, C.sky);
  const g = ctx.createRadialGradient(W * 0.72, H * 0.27, 40, W * 0.72, H * 0.27, 700); g.addColorStop(0, '#2A2550'); g.addColorStop(1, C.sky); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = `rgba(244,239,230,${0.25 + 0.5 * tw * hash01(i, 8)})`; ctx.beginPath(); ctx.arc(hash01(i, 1) * W, hash01(i, 2) * H * 0.7, 2 + 2 * hash01(i, 3), 0, TAU); ctx.fill(); }
  // crescent
  ctx.save(); ctx.beginPath(); ctx.arc(W * 0.72, H * 0.27, 120, 0, TAU); ctx.fillStyle = '#F4EFE6'; ctx.fill();
  ctx.globalCompositeOperation = 'source-atop'; ctx.beginPath(); ctx.arc(W * 0.72 + 55, H * 0.27 - 30, 110, 0, TAU); ctx.fillStyle = '#2A2550'; ctx.fill(); ctx.restore();
  const L = clothesline(ctx, t, H * 0.5);
  [10, 20, 30].forEach((k, i) => { const p = L[k]; const sw = Math.sin(t * 2.4 + i) * 0.12; bubble(ctx, p[0], p[1] + 120, 270, ['+1', 'حجز', 'أوردر'][i], { inc: false, size: 54, bgc: C.mint, fg: '#06281C', rot: sw }); });
  txtL(ctx, '3:14 AM', W / 2, H * 0.78, 64, 'rgba(244,239,230,0.6)');
}
function vEid(ctx, t) {
  bg(ctx, C.plum, '#41203F');
  const L = clothesline(ctx, t, H * 0.36, 70);
  const cols = [C.amber, C.mint, '#F4EFE6', '#E86A5C'];
  for (let k = 2; k < 38; k += 3) {
    const p = L[k], q = L[k + 2] || L[k]; const sw = Math.sin(t * 3 + k) * 0.08;
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(sw); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(q[0] - p[0], q[1] - p[1]); ctx.lineTo((q[0] - p[0]) / 2, 110); ctx.closePath(); ctx.fillStyle = cols[(k / 3 | 0) % 4]; ctx.fill(); ctx.restore();
  }
  // kahk: round cookies with a pattern
  for (let i = 0; i < 5; i++) {
    const x = W * (0.18 + i * 0.16), y = H * 0.7 + (i % 2) * 60, r = 70;
    ctx.fillStyle = 'rgba(6,3,10,0.4)'; ctx.beginPath(); ctx.ellipse(x + 8, y + 18, r, r * 0.7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F1E3C8'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#D9C49E'; ctx.lineWidth = 5; for (let a = 0; a < 8; a++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a * TAU / 8) * r * 0.7, y + Math.sin(a * TAU / 8) * r * 0.5); ctx.stroke(); }
  }
  bubble(ctx, W / 2, H * 0.55, 560, 'كل سنة وإنت طيب', { inc: false, size: 54, bgc: C.mint, fg: '#06281C', k: sp(t, 19.85, SPRING.bouncy) });
}
function vMatch(ctx, t) {
  bg(ctx, C.teal, '#16302F');
  const L = clothesline(ctx, t, H * 0.3, 40);
  const tw = 860, th = 500, x = W / 2, y = H * 0.56;
  ctx.fillStyle = 'rgba(6,3,10,0.5)'; rrect(ctx, x - tw / 2 + 16, y - th / 2 + 26, tw, th, 34); ctx.fill();
  ctx.fillStyle = '#121619'; rrect(ctx, x - tw / 2, y - th / 2, tw, th, 34); ctx.fill();
  ctx.save(); rrect(ctx, x - tw / 2 + 24, y - th / 2 + 24, tw - 48, th - 48, 16); ctx.clip();
  ctx.fillStyle = '#2E8A4E'; ctx.fillRect(x - tw / 2, y - th / 2, tw, th);
  for (let s = 0; s < 8; s++) { ctx.fillStyle = s % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; ctx.fillRect(x - tw / 2 + s * tw / 8, y - th / 2, tw / 8, th); }
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 5; ctx.strokeRect(x - tw / 2 + 50, y - th / 2 + 50, tw - 100, th - 100);
  ctx.beginPath(); ctx.moveTo(x, y - th / 2 + 50); ctx.lineTo(x, y + th / 2 - 50); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 70, 0, TAU); ctx.stroke();
  const bx = x - 260 + ((t - 20.6) * 380) % 520, by = y + Math.sin(t * 6) * 80; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, 16, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#121619'; ctx.fillRect(x - 40, y + th / 2, 80, 70); ctx.fillRect(x - 160, y + th / 2 + 60, 320, 18);
  // the bot keeps answering in the corner
  const n = Math.floor((t - 20.7) / 0.32);
  for (let i = 0; i < Math.min(4, Math.max(0, n)); i++) pill(ctx, x + tw / 2 - 80 - i * 18, y - th / 2 - 50 - i * 20, '+1', { bgc: C.mint, fg: '#06281C', size: 50, k: sp(t, 20.7 + i * 0.32, SPRING.bouncy) });
}
function v247(ctx, t) {
  bg(ctx);
  const k = sp(t, 22.36, SPRING.bouncy);
  ctx.save(); ctx.translate(W / 2, H * 0.52); ctx.scale(0.4 + 0.6 * k, 0.4 + 0.6 * k);
  txtL(ctx, '24/7', 0, 80, 300, C.mint); ctx.restore();
  // threads wrap around the number
  const ph = E.outCubic(prog(t, 22.36, 23.0));
  for (let i = 0; i < 3; i++) {
    const pts = Array.from({ length: 50 }, (_, j) => { const a = (j / 49) * TAU * ph + i * 2.1; return [W / 2 + Math.cos(a) * (430 + i * 30), H * 0.5 + Math.sin(a) * (170 + i * 40)]; });
    rope(ctx, pts, 12);
  }
}
function sceneAnytime(ctx, t) {
  // horizontal whips (RTL: the next scene enters from the left)
  const cuts = [[19.03, vNight], [19.72, vEid], [20.61, vMatch], [22.36, v247]];
  let i = cuts.length - 1; while (i > 0 && t < cuts[i][0]) i--;
  const [t0, cur] = cuts[i];
  const p = i > 0 ? E.outCubic(prog(t, t0 - 0.12, t0 + 0.2)) : 1;
  if (p < 1 && i > 0) {
    ctx.save(); ctx.translate(p * W, 0); cuts[i - 1][1](ctx, t); ctx.restore();
    ctx.save(); ctx.translate(-(1 - p) * W, 0); cur(ctx, t); ctx.restore();
  } else cur(ctx, t);
  sup(ctx, t, VO.K1, { y: SAFE.y + 140, size: 100, tOut: 19.6 });
  sup(ctx, t, VO.K2, { y: SAFE.y + 140, size: 100, tOut: 20.5 });
  sup(ctx, t, VO.L1, { y: SAFE.y + 130, size: 84, tOut: 22.3 });
  sup(ctx, t, VO.M1, { y: H * 0.52 + 300, size: 120, color: C.cream, tOut: 23.15, stag: 0.01 });
}

// ================================================================ S7/S8  the knot is undone → end card (23.2 – 32)
function logoTile(ctx, IMG, x, y, s, r = 0.2) {
  if (!IMG.only) return;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -s / 2 + 10, -s / 2 + 22, s, s, s * r); ctx.fill();
  rrect(ctx, -s / 2, -s / 2, s, s, s * r); ctx.clip();
  ctx.drawImage(IMG.only, 609, 304, 1182, 1182, -s / 2, -s / 2, s, s);
  ctx.restore();
}
function sceneEnd(ctx, t, IMG) {
  const nav = E.inOutCubic(prog(t, 23.4, 24.4));
  ctx.fillStyle = mix(C.bg, C.navy, nav); ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.45, H * 0.7); g.addColorStop(0, `rgba(65,236,174,${0.08 * nav})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // threads converge into the tile
  const conv = E.inCubic(prog(t, 23.2, 23.8));
  if (conv < 1) for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * TAU + 0.3;
    const pts = Array.from({ length: 30 }, (_, k) => { const s = k / 29; const r = lerp(1300, 0, conv) * (1 - s * 0.6) + 60; return [W / 2 + Math.cos(a0 + s * 2.4) * r, H * 0.45 + Math.sin(a0 + s * 2.4) * r]; });
    rope(ctx, pts, 14);
  }
  // logo tile irises open, then lifts to the end-card position
  const ki = sp(t, 23.62, SPRING.bouncy);
  const lift = E.inOutCubic(prog(t, 24.95, 25.5));
  const tileY = lerp(H * 0.45, SAFE.y + 230, lift), tileS = lerp(520, 300, lift) * ki;
  if (ki > 0.001 && t < 25.5) logoTile(ctx, IMG, W / 2, tileY, tileS);
  sup(ctx, t, VO.N1, { y: H * 0.45 + 400, size: 90, tOut: 24.9, color: C.cream });
  // end card: the real lockup wipes in behind a thread
  if (t >= 25.3 && IMG.name) {
    const wp = E.inOutCubic(prog(t, 25.3, 25.9));
    const lw = 960, lh = lw * (690 / 1790), ly = SAFE.y + 230 - lh / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2 + lw / 2 - lw * wp, ly - 20, lw * wp + 40, lh + 40); ctx.clip();
    ctx.drawImage(PLATE || IMG.name, 0, 0, PLATE ? PLATE.width : 1, PLATE ? PLATE.height : 1, W / 2 - lw / 2, ly, lw, lh);
    ctx.restore();
    if (wp < 1) { const x = W / 2 + lw / 2 - lw * wp; rope(ctx, [[x, ly - 30], [x + 6, ly + lh / 2], [x, ly + lh + 30]], 10, C.mint); }
  }
  // CTA
  sup(ctx, t, VO.O1, { y: H * 0.5, size: 104, color: C.cream, hl: { 'ديمو': C.mint } });
  sup(ctx, t, VO.O2, { y: H * 0.5 + 270, size: 66, color: 'rgba(244,239,230,0.8)', face: UI, weight: 600 });
  // the WhatsApp pill
  const kp = sp(t, 26.0, SPRING.bouncy);
  if (kp > 0.001) {
    const pulse = t > 28.6 ? 0.04 * Math.sin((t - 28.6) * 5.5) : 0;
    const x = W / 2, y = H * 0.5 + 500, w = 800, h = 160;
    // rings
    if (t > 28.6) for (let r = 0; r < 2; r++) { const ph = ((t - 28.6) * 0.7 + r * 0.5) % 1; ctx.strokeStyle = `rgba(65,236,174,${0.5 * (1 - ph)})`; ctx.lineWidth = 4; rrect(ctx, x - w / 2 - ph * 50, y - h / 2 - ph * 50, w + ph * 100, h + ph * 100, h); ctx.stroke(); }
    ctx.save(); ctx.translate(x, y); ctx.scale(kp * (1 + pulse), kp * (1 + pulse));
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -w / 2 + 8, -h / 2 + 16, w, h, h / 2); ctx.fill();
    ctx.fillStyle = C.mint; rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
    txtL(ctx, '010 9311 4446', -75, 23, 64, '#06281C');
    txt(ctx, 'واتساب', w / 2 - 55, 18, 44, '#06281C', { align: 'right' });
    ctx.fillStyle = 'rgba(6,40,28,0.3)'; ctx.fillRect(w / 2 - 245, -42, 3, 84);
    ctx.restore();
  }
  // a last new thing during the hold: the site's own promise
  const kq = sp(t, 29.6, SPRING.bouncy);
  if (kq > 0.001) pill(ctx, W / 2, H * 0.5 + 700, 'جرّبه قبل ما تدفع', { k: kq, bgc: 'rgba(244,239,230,0.12)', fg: C.cream, size: 44, rot: -0.03 });
}

// ================================================================ film
M.film({
  fonts: [font(100, 700, D), font(40, 700, UI), font(40, 600, UI), font(40, 500, UI)],
  images: { only: 'assets/logo_only.jpg', name: 'assets/logo_name.jpg' },
  hits: HITS,
  samples: 6,
  init(_, IMG) {
    if (IMG.name) {   // logo lockup crop with feathered edges so no box shows on the navy
      const c = document.createElement('canvas'); c.width = 1790; c.height = 690; const x = c.getContext('2d');
      x.drawImage(IMG.name, 300, 540, 1790, 690, 0, 0, 1790, 690);
      x.globalCompositeOperation = 'destination-in';
      const gx = x.createLinearGradient(0, 0, 1790, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.04, '#000'); gx.addColorStop(0.96, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gx; x.fillRect(0, 0, 1790, 690);
      const gy = x.createLinearGradient(0, 0, 0, 690); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.12, '#000'); gy.addColorStop(0.88, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gy; x.fillRect(0, 0, 1790, 690); PLATE = c;
    }
    for (let g = 0; g < 4; g++) {
      const c = document.createElement('canvas'); c.width = 270; c.height = 480; const x = c.getContext('2d');
      const im = x.createImageData(270, 480); const r = M.mulberry32(100 + g);
      for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0); GRAIN.push(c);
    }
  },
  draw(ctx, u, t, IMG) {
    if (t < 3.37) sceneKnot(ctx, t);
    else if (t < 7.75) sceneDup(ctx, t);
    else if (t < 7.98) {   // whip up: S2 leaves downward while S3 drops in from the top
      const p = E.inOutCubic(prog(t, 7.75, 7.98));
      ctx.save(); ctx.translate(0, p * H); sceneDup(ctx, t); ctx.restore();
      ctx.save(); ctx.translate(0, -(1 - p) * H); sceneNesta(ctx, t, IMG); ctx.restore();
    }
    else if (t < 18.72) sceneNesta(ctx, t, IMG);
    else if (t < 19.03) {   // card flip
      const p = prog(t, 18.72, 19.03);
      const sx = Math.abs(Math.cos(p * Math.PI));
      fill(ctx, C.sky);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(Math.max(0.001, sx), 1 - 0.06 * Math.sin(p * Math.PI)); ctx.translate(-W / 2, -H / 2);
      if (p < 0.5) sceneNesta(ctx, t, IMG); else sceneAnytime(ctx, t);
      ctx.restore();
    }
    else if (t < 23.2) sceneAnytime(ctx, t);
    else sceneEnd(ctx, t, IMG);
  },
  post(ctx, u, t) {
    // paper grain + soft vignette: keeps it from looking like a clean template
    const g = GRAIN[Math.floor(t * 24) % 4];
    if (g) { ctx.save(); ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(g, 0, 0, W, H); ctx.restore(); }
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
});
