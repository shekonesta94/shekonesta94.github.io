// الفاتورة v2 — Nesta ad 5. Pure function of time: window.seek(t) paints frame t.
// One wooden shop counter, one paper receipt unrolling from the register. Everything happens ON the paper:
// a line folds up into a pop-up speech bubble, a pen draws the night, the paper is ruled into the sheet,
// scissors cut out the launch offer, it lands on the clean counter and gets stamped with the logo.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, wobble, font, rrect, hash01, noise1, mix, TAU } = M;
const D = 'Display', UI = 'UI', HAND = 'Hand';
const B = (t) => t / 0.499983;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const C = { paper: '#FBF7EE', paper2: '#EFE8DA', ink: '#1C2333', pen: '#233A7A', faint: '#9A9284', mint: '#41ECAE', mintInk: '#0B5C42', hi: 'rgba(255,212,92,0.85)', hiMint: 'rgba(65,236,174,0.55)', navy: '#0F1E33' };
const V = { hookA: 0.44, hookB: 1.96, demoA: 5.11, demoB: 6.0, s247: 8.95, data: 11.05, book: 12.95, sheet: 14.55, lau: 16.85, offer: 17.95, need: 22.15, cta: 24.75 };

const PX = 380;                     // strip half-width (world)
const Y = { logo: 120, big: 320, cond: 410, item1: 520, item2: 760, tags: 935, item3: 1060, grid0: 1120, card0: 1400, card1: 2320 };
const CARD = { cx: 0, cy: (Y.card0 + Y.card1) / 2, w: 720, h: Y.card1 - Y.card0 };
const DEST = { x: 1180, y: 1840, rot: -0.04 };
const T_CUT0 = V.offer + 1.35, T_CUT1 = V.offer + 2.3, T_LIFT1 = V.offer + 3.1;

function tA(ctx, s, x, y, size, color, { face = D, weight = 800, align = 'center' } = {}) { ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore(); }
function tL(ctx, s, x, y, size, color, align = 'center', face = UI, weight = 700) { ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore(); }
// handwriting reveal: uncovers RTL text right-to-left as the pen moves
function write(ctx, s, xr, y, size, color, t, t0, dur, face = HAND) {
  const p = clamp((t - t0) / dur); if (p <= 0) return null;
  ctx.save(); ctx.font = font(size, 700, face); const w = ctx.measureText(s).width;
  ctx.beginPath(); ctx.rect(xr - w * p - 6, y - size * 1.2, w * p + 12, size * 1.7); ctx.clip();
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillStyle = color; ctx.fillText(s, xr, y); ctx.restore();
  return p < 1 ? [xr - w * p, y - size * 0.3] : null;
}
function highlighter(ctx, x0, x1, y, h, col, t, t0, dur) {   // swiped right-to-left
  const p = E.outCubic(clamp((t - t0) / dur)); if (p <= 0) return;
  ctx.save(); ctx.fillStyle = col; ctx.beginPath(); const xa = x1 - (x1 - x0) * p;
  ctx.moveTo(x1, y - h / 2 + 3); ctx.lineTo(xa, y - h / 2); ctx.lineTo(xa + 4, y + h / 2); ctx.lineTo(x1 - 3, y + h / 2 - 2); ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------------- pen strokes drawn on the paper
function arcPts(cx, cy, r, a0, a1, n = 40) { return Array.from({ length: n + 1 }, (_, k) => { const a = lerp(a0, a1, k / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }); }
function linePts(a, b, n = 10) { return Array.from({ length: n + 1 }, (_, k) => [lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); }
const tick = (x, y) => [[x - 14, y], [x - 3, y + 12], [x + 16, y - 12]];
const STROKES = [
  { pts: tick(-330, Y.cond - 14), t0: V.hookB + 0.5, t1: V.hookB + 0.75 },
  { pts: tick(-330, Y.item1 - 12), t0: V.demoA + 0.3, t1: V.demoA + 0.5 },
  { pts: tick(-330, Y.item2 - 12), t0: V.s247 + 0.25, t1: V.s247 + 0.45 },
  // the night, drawn under the 24h line: a clock at 3:00 and a crescent moon
  { pts: arcPts(-240, 850, 60, -Math.PI / 2, Math.PI * 1.5), t0: V.s247 + 0.5, t1: V.s247 + 1.0 },
  { pts: linePts([-240, 850], [-240, 806]), t0: V.s247 + 1.0, t1: V.s247 + 1.1 },
  { pts: linePts([-240, 850], [-204, 850]), t0: V.s247 + 1.1, t1: V.s247 + 1.2 },
  { pts: tick(-330, Y.item3 - 12), t0: V.book + 0.25, t1: V.book + 0.45 },
  // the paper gets ruled into a sheet
  ...[0, 1, 2, 3, 4].map((i) => ({ pts: linePts([350, Y.grid0 + i * 60], [-350, Y.grid0 + i * 60], 12), t0: V.sheet - 0.15 + i * 0.07, t1: V.sheet + 0.1 + i * 0.07 })),
  ...[110, -130].map((x, i) => ({ pts: linePts([x, Y.grid0], [x, Y.grid0 + 240], 8), t0: V.sheet + 0.25 + i * 0.08, t1: V.sheet + 0.45 + i * 0.08 })),
];
for (const s of STROKES) { s.len = [0]; for (let k = 1; k < s.pts.length; k++) s.len.push(s.len[k - 1] + Math.hypot(s.pts[k][0] - s.pts[k - 1][0], s.pts[k][1] - s.pts[k - 1][1])); s.total = s.len[s.len.length - 1]; }
function nightIcons(ctx, t) {
  const ck = clamp((t - (V.s247 + 1.0)) / 0.2);
  if (ck > 0) { ctx.save(); ctx.globalAlpha = ck; ctx.fillStyle = C.pen; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.arc(-240 + Math.cos(a) * 48, 850 + Math.sin(a) * 48, i % 3 ? 3 : 5, 0, TAU); ctx.fill(); } ctx.beginPath(); ctx.arc(-240, 850, 6, 0, TAU); ctx.fill(); ctx.restore(); }
  const mk = clamp((t - (V.s247 + 1.25)) / 0.3);
  if (mk > 0) { ctx.save(); ctx.globalAlpha = mk; ctx.fillStyle = C.pen; ctx.beginPath(); ctx.arc(-90, 850, 52, 0, TAU); ctx.fill(); ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(-62, 834, 46, 0, TAU); ctx.fill(); ctx.fillStyle = C.pen;
    for (const [sx, sy, r] of [[-20, 800, 10], [10, 860, 7], [-150, 790, 8]]) { ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; k ? ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr) : ctx.moveTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
}
function drawStrokes(ctx, t) {
  let tip = null;
  ctx.save(); ctx.strokeStyle = C.pen; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of STROKES) {
    if (t < s.t0) continue; const p = E.inOutSine(clamp((t - s.t0) / (s.t1 - s.t0))), d = p * s.total;
    ctx.beginPath(); ctx.moveTo(...s.pts[0]); let last = s.pts[0];
    for (let k = 1; k < s.pts.length; k++) { if (s.len[k] <= d) { ctx.lineTo(...s.pts[k]); last = s.pts[k]; } else { const f = (d - s.len[k - 1]) / (s.len[k] - s.len[k - 1]); last = [lerp(s.pts[k - 1][0], s.pts[k][0], f), lerp(s.pts[k - 1][1], s.pts[k][1], f)]; ctx.lineTo(...last); break; } }
    ctx.stroke(); if (p < 1) tip = last;
  }
  ctx.restore(); return tip;
}
function pen(ctx, tip) {
  if (!tip) return;
  ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(-0.75);
  ctx.fillStyle = 'rgba(40,25,10,0.22)'; rrect(ctx, 14, 14, 26, 280, 13); ctx.fill();
  ctx.fillStyle = '#C9CED6'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-9, 36); ctx.lineTo(9, 36); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(-13, 0, 13, 0); g.addColorStop(0, '#1F2E66'); g.addColorStop(0.5, '#3B57B0'); g.addColorStop(1, '#1A2757');
  ctx.fillStyle = g; rrect(ctx, -13, 34, 26, 250, 12); ctx.fill();
  ctx.fillStyle = C.mint; rrect(ctx, 9, 200, 7, 70, 3); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- paper unrolling
const ROLLK = [[-0.4, 60], [0.05, 260], [V.hookA, 280], [V.hookA + 0.35, 450], [V.demoA, 450], [V.demoA + 0.35, 640], [V.s247, 640], [V.s247 + 0.35, 1010], [V.book, 1010], [V.book + 0.35, 1380], [V.offer - 0.3, 1380], [V.offer + 0.5, Y.card1 + 60]];
function paperLen(t) { let i = 0; while (i < ROLLK.length - 2 && t >= ROLLK[i + 1][0]) i++; const [t0, a] = ROLLK[i], [t1, b] = ROLLK[i + 1]; return lerp(a, b, E.inOutCubic(clamp((t - t0) / (t1 - t0)))); }
const shown = (t, y) => clamp((paperLen(t) - y - 10) / 40);
let PAPERTEX = null, WOOD = null, LOGO = null;
function paperRect(ctx, x0, y0, x1, y1) {
  ctx.fillStyle = C.paper; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (PAPERTEX) { ctx.save(); ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = PAPERTEX; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.restore(); }
  const e = ctx.createLinearGradient(x0, 0, x1, 0); e.addColorStop(0, 'rgba(120,100,70,0.12)'); e.addColorStop(0.06, 'rgba(0,0,0,0)'); e.addColorStop(0.94, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(120,100,70,0.12)');
  ctx.fillStyle = e; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}

// ---------------------------------------------------------------- the card (the cut-out piece): offer on top, stamp + CTA below
function cardContent(ctx, t, onStrip) {
  const top = -CARD.h / 2;
  const k = onStrip ? shown(t, Y.card0 + 60) : 1;
  if (k > 0) {
    ctx.save(); ctx.globalAlpha = k;
    // highlighter block + printed offer text
    ctx.fillStyle = C.hi; ctx.beginPath(); ctx.moveTo(320, top + 40); ctx.lineTo(-322, top + 46); ctx.lineTo(-318, top + 330); ctx.lineTo(324, top + 326); ctx.closePath(); ctx.fill();
    tA(ctx, 'عرض الإطلاق', 0, top + 140, 76, '#2A1F00');
    tA(ctx, 'خصم على الاشتراك الشهري', 0, top + 222, 46, '#2A1F00', { face: UI, weight: 700 });
    tA(ctx, 'حتى 14 يونيو 2027', 0, top + 290, 42, '#5A4500', { face: UI, weight: 700 });
    ctx.restore();
  }
  if (onStrip) return;
  // the rubber stamp's imprint: the logo
  const st = clamp((t - (V.need + 0.45)) / 0.08);
  if (st > 0 && LOGO) {
    const lw = 600, lh = lw * 690 / 1790;
    ctx.save(); ctx.globalAlpha = st; ctx.translate(0, top + 520); ctx.rotate(-0.03);
    ctx.fillStyle = C.navy; rrect(ctx, -lw / 2 - 14, -lh / 2 - 10, lw + 28, lh + 20, 22); ctx.fill();
    ctx.drawImage(LOGO, 0, 0, 1790, 690, -lw / 2, -lh / 2, lw, lh);
    ctx.restore();
  }
  // CTA: written by the pen, number highlighted
  const tip = write(ctx, 'ابعت ديمو على واتساب', 300, top + 735, 58, C.ink, t, V.cta - 0.05, 0.75, D);
  highlighter(ctx, -300, 300, top + 822, 92, C.hiMint, t, V.cta + 0.75, 0.35);
  if (t > V.cta + 0.85) { const kk = clamp((t - V.cta - 0.85) / 0.25); ctx.save(); ctx.globalAlpha = kk; tL(ctx, '010 9311 4446', -70, top + 842, 58, C.mintInk, 'center', UI, 700); tA(ctx, 'واتساب', 290, top + 838, 32, C.mintInk, { face: UI, weight: 700, align: 'right' }); ctx.restore(); }
  return tip;
}
function cardEdgePts() { const x0 = -CARD.w / 2, x1 = CARD.w / 2; return [[x1, Y.card0], [x0, Y.card0], [x0, Y.card1], [x1, Y.card1], [x1, Y.card0]]; }
const CUT = (() => { const p = cardEdgePts(), L = [0]; for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return { p, L, total: L[L.length - 1] }; })();
function cutAt(f) { const d = f * CUT.total; let i = 1; while (i < CUT.L.length - 1 && CUT.L[i] < d) i++; const a = CUT.p[i - 1], b = CUT.p[i], g = (d - CUT.L[i - 1]) / (CUT.L[i] - CUT.L[i - 1]); return [lerp(a[0], b[0], g), lerp(a[1], b[1], g), Math.atan2(b[1] - a[1], b[0] - a[0])]; }
function scissors(ctx, x, y, ang, t) {
  const o = 0.3 + 0.28 * Math.max(0, Math.sin(t * 26));
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI);
  ctx.fillStyle = 'rgba(40,25,10,0.25)'; ctx.beginPath(); ctx.ellipse(30, 30, 150, 40, 0, 0, TAU); ctx.fill();
  for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * o * 0.5);
    const bg = ctx.createLinearGradient(0, -10, 0, 10); bg.addColorStop(0, '#F2F5F8'); bg.addColorStop(1, '#9AA4AF');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-130, s * -6); ctx.lineTo(-130, s * 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#E4573A'; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(52, s * 22, 30, 20, s * 0.3, 0, TAU); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#5B6470'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
  ctx.restore();
}
function rubberStamp(ctx, t, cx, cy) {
  const a = V.need + 0.05, hit = V.need + 0.45, up = V.need + 0.85;
  if (t < a || t > up + 0.5) return;
  const down = t < hit ? E.inCubic(prog(t, a, hit)) : 1 - E.outCubic(prog(t, hit + 0.1, up + 0.4));
  const s = lerp(1.7, 1, down), lift = (1 - down);
  ctx.save(); ctx.translate(cx + 40 * lift, cy - 260 * lift); ctx.scale(s, s);
  ctx.fillStyle = `rgba(40,25,10,${0.3 * down})`; ctx.beginPath(); ctx.ellipse(10 + 60 * lift, 20 + 60 * lift, 330, 150, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(-320, 0, 320, 0); g.addColorStop(0, '#6B4A2E'); g.addColorStop(0.5, '#A57A4F'); g.addColorStop(1, '#6B4A2E');
  ctx.fillStyle = g; rrect(ctx, -320, -130, 640, 260, 30); ctx.fill();
  ctx.fillStyle = '#1D2230'; rrect(ctx, -330, 100, 660, 40, 12); ctx.fill();
  const hg = ctx.createRadialGradient(-30, -40, 10, 0, 0, 120); hg.addColorStop(0, '#C9965F'); hg.addColorStop(1, '#7A5430');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, -40, 110, 90, 0, 0, TAU); ctx.fill();
  tL(ctx, 'NESTA', 0, 40, 46, 'rgba(255,240,220,0.8)', 'center', D, 800);
  ctx.restore();
}

// ---------------------------------------------------------------- the strip with everything printed / drawn on it
function popBubble(ctx, t) {   // a paper flap hinged under the demo line, folding up like a pop-up book
  const up = E.outBack(prog(t, V.demoA + 0.55, V.demoA + 1.05), 1.3) * (1 - E.inOutCubic(prog(t, V.s247 + 0.2, V.s247 + 0.6)));
  if (up <= 0.01) return;
  const hy = Y.item1 + 40, fw = 600, fh = 330;
  ctx.save(); ctx.translate(0, hy);
  // shadow cast on the paper below the hinge
  ctx.fillStyle = `rgba(60,40,20,${0.18 * up})`; ctx.beginPath(); ctx.ellipse(20, 30 + 40 * up, fw / 2, 50 * up, 0, 0, TAU); ctx.fill();
  ctx.scale(1, up);
  // flap: speech-bubble shape cut from the same paper
  ctx.beginPath(); ctx.moveTo(-fw / 2, 0); ctx.lineTo(-fw / 2, -fh + 50); ctx.quadraticCurveTo(-fw / 2, -fh, -fw / 2 + 50, -fh); ctx.lineTo(fw / 2 - 50, -fh); ctx.quadraticCurveTo(fw / 2, -fh, fw / 2, -fh + 50); ctx.lineTo(fw / 2, 0); ctx.closePath();
  const g = ctx.createLinearGradient(0, -fh, 0, 0); g.addColorStop(0, '#FFFDF7'); g.addColorStop(1, '#E7DECC'); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(120,100,70,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  // the conversation, printed on the flap
  ctx.fillStyle = '#FFFFFF'; rrect(ctx, 90, -fh + 40, 190, 70, 18); ctx.fill(); ctx.strokeStyle = '#D9D0BF'; ctx.lineWidth = 2; rrect(ctx, 90, -fh + 40, 190, 70, 18); ctx.stroke();
  tA(ctx, 'ديمو', 185, -fh + 88, 40, C.ink, { face: UI, weight: 700 });
  if (t > V.demoB + 0.2) { const k = clamp((t - V.demoB - 0.2) / 0.25); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#D7F8E9'; rrect(ctx, -270, -fh + 140, 480, 140, 22); ctx.fill(); tA(ctx, 'أهلاً! ده ديمو على', 190, -fh + 198, 38, C.mintInk, { face: UI, weight: 700, align: 'right' }); tA(ctx, 'سيستم زي نشاطك', 190, -fh + 252, 38, C.mintInk, { face: UI, weight: 700, align: 'right' }); ctx.restore(); }
  ctx.restore();
}
function tags(ctx, t) {   // the business's own data: three paper slips slide in across the counter onto the strip
  ['الأسعار', 'المواعيد', 'المنيو'].forEach((s, i) => {
    const p = E.outCubic(clamp((t - (V.data + i * 0.22)) / 0.55)); if (p <= 0) return;
    const x = lerp(900 + i * 120, 230 - i * 230, p), y = Y.tags + (i - 1) * 6, r = lerp(0.4, (i - 1) * 0.06, p);
    ctx.save(); ctx.translate(x, y); ctx.rotate(r);
    ctx.fillStyle = 'rgba(60,40,20,0.25)'; rrect(ctx, -96, -28, 200, 74, 8); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; rrect(ctx, -100, -36, 200, 74, 8); ctx.fill(); ctx.fillStyle = C.mint; ctx.fillRect(-100, -36, 12, 74);
    tA(ctx, s, 6, 12, 36, C.ink, { face: UI, weight: 700 }); ctx.restore();
  });
}
function strip(ctx, t) {
  const L = paperLen(t), cutDone = t > T_CUT1;
  ctx.save(); ctx.shadowColor = 'rgba(40,25,10,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.fillStyle = C.paper; ctx.fillRect(-PX, -40, PX * 2, L + 40); ctx.restore();
  paperRect(ctx, -PX, -40, PX, L);
  // printed content (appears as the paper passes the print head)
  const at = (y, fn) => { const k = shown(t, y); if (k > 0) { ctx.save(); ctx.globalAlpha = k; fn(); ctx.restore(); } };
  at(Y.logo, () => { if (LOGO) { const lw = 520, lh = lw * 690 / 1790; ctx.fillStyle = C.navy; rrect(ctx, -lw / 2 - 12, Y.logo - lh / 2 - 8, lw + 24, lh + 16, 18); ctx.fill(); ctx.drawImage(LOGO, 0, 0, 1790, 690, -lw / 2, Y.logo - lh / 2, lw, lh); } tA(ctx, 'فاتورة تجربة · #0001', 0, Y.logo + 140, 32, C.faint, { face: UI, weight: 700 }); });
  at(Y.big, () => { tA(ctx, 'المطلوب دفعه الآن', 340, Y.big, 46, C.ink, { face: UI, weight: 700, align: 'right' }); const k = sp(t, V.hookA + 0.35, SPRING.bouncy); ctx.save(); ctx.translate(-190, Y.big - 18); ctx.scale(k, k); tL(ctx, '0', 0, 44, 150, C.ink, 'center', D, 800); ctx.restore(); tA(ctx, 'جنيه', -60, Y.big, 36, C.faint, { face: UI, weight: 700 }); });
  at(Y.cond, () => tA(ctx, 'لحد ما تجرّب بنفسك', 340, Y.cond, 46, C.mintInk, { align: 'right' }));
  at(Y.cond + 50, () => { ctx.strokeStyle = '#CFC6B5'; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(-350, Y.cond + 50); ctx.lineTo(350, Y.cond + 50); ctx.stroke(); ctx.setLineDash([]); });
  at(Y.item1, () => tA(ctx, 'ديمو على سيستم شبه نشاطك', 340, Y.item1, 40, C.ink, { face: UI, weight: 700, align: 'right' }));
  at(Y.item2, () => tA(ctx, 'رد 24 ساعة من بيانات تجارتك', 340, Y.item2, 40, C.ink, { face: UI, weight: 700, align: 'right' }));
  at(Y.item3, () => tA(ctx, 'حجوزات وأوردرات في الشيت', 340, Y.item3, 40, C.ink, { face: UI, weight: 700, align: 'right' }));
  at(Y.card0 - 20, () => { ctx.strokeStyle = '#B8AE9B'; ctx.lineWidth = 3; ctx.setLineDash([16, 12]); ctx.strokeRect(-CARD.w / 2, Y.card0, CARD.w, CARD.h); ctx.setLineDash([]); });
  // the sheet: rows written by the pen, newest row highlighted
  const rows = [['الاسم', 'الطلب', 'الميعاد'], ['منى', 'حجز', 'بكرة 5:00'], ['كريم', 'أوردر', '2 بيتزا'], ['سارة', 'حجز', 'الخميس 6:30']];
  let tip = null;
  rows.forEach((r, i) => { const yy = Y.grid0 + 44 + i * 60, t0 = V.sheet + 0.55 + i * 0.32; if (i === 1) highlighter(ctx, -350, 350, yy - 14, 50, C.hiMint, t, t0 + 0.3, 0.3); [[330, 0], [100, 1], [-150, 2]].forEach(([x, c]) => { const q = write(ctx, r[c], x, yy, i ? 36 : 30, i ? C.pen : C.faint, t, t0 + c * 0.08, 0.18, UI); if (q) tip = q; }); });
  popBubble(ctx, t);
  tags(ctx, t);
  // the card region: printed offer while on the strip, then cut, then a hole showing the counter
  if (!cutDone || t < V.offer + 2.35) { ctx.save(); ctx.translate(CARD.cx, CARD.cy); cardContent(ctx, t, true); ctx.restore(); }
  if (t > T_CUT0) { const f = clamp((t - T_CUT0) / (T_CUT1 - T_CUT0)); ctx.save(); ctx.strokeStyle = 'rgba(40,30,20,0.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...CUT.p[0]); for (let s = 0; s <= f; s += 0.005) ctx.lineTo(...cutAt(s).slice(0, 2)); ctx.stroke(); ctx.restore(); }
  if (t > V.offer + 2.35) { ctx.save(); ctx.fillStyle = WOOD || '#7A4E30'; ctx.fillRect(-CARD.w / 2, Y.card0, CARD.w, CARD.h); const ig = ctx.createLinearGradient(0, Y.card0, 0, Y.card0 + 40); ig.addColorStop(0, 'rgba(0,0,0,0.35)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = ig; ctx.fillRect(-CARD.w / 2, Y.card0, CARD.w, 40); ctx.restore(); }
  // the roll end: paper curling into a cylinder
  if (L < Y.card1 + 40) { const g = ctx.createLinearGradient(0, L - 30, 0, L + 30); g.addColorStop(0, '#E6DECD'); g.addColorStop(0.45, '#FFFFFF'); g.addColorStop(1, '#BDB29E'); ctx.save(); ctx.shadowColor = 'rgba(40,25,10,0.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 14; ctx.fillStyle = g; rrect(ctx, -PX - 6, L - 30, PX * 2 + 12, 60, 30); ctx.fill(); ctx.restore(); }
  return tip;
}
function register(ctx, t) {
  const busy = ROLLK.some(([t0], i) => i < ROLLK.length - 1 && ROLLK[i + 1][1] > ROLLK[i][1] && t > t0 && t < ROLLK[i + 1][0]);
  ctx.save(); ctx.shadowColor = 'rgba(40,25,10,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 26;
  const g = ctx.createLinearGradient(0, -420, 0, -20); g.addColorStop(0, '#3E475B'); g.addColorStop(1, '#1C212E'); ctx.fillStyle = g; rrect(ctx, -470, -420, 940, 400, 54); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; rrect(ctx, -450, -405, 900, 60, 30); ctx.fill();
  // display
  ctx.fillStyle = '#081013'; rrect(ctx, -300, -330, 600, 140, 22); ctx.fill();
  tL(ctx, '0.00 EGP', 0, -240, 72, C.mint, 'center', UI, 700);
  ctx.fillStyle = busy ? C.mint : '#2B6E58'; ctx.beginPath(); ctx.arc(380, -260, 14, 0, TAU); ctx.fill();
  tL(ctx, 'NESTA', -380, -255, 34, 'rgba(255,255,255,0.65)', 'left', D, 800);
  ctx.fillStyle = '#0A0D14'; rrect(ctx, -400, -70, 800, 30, 15); ctx.fill();
}

// ---------------------------------------------------------------- camera over the counter
const CAMK = [
  [0, 0, 60, 1.42], [0.6, 0, 210, 1.36], [2.4, 0, 300, 1.34], [V.demoA - 0.1, 0, 320, 1.32], [V.demoA + 0.6, 0, 420, 1.28], [V.s247 - 0.2, 0, 460, 1.28],
  [V.s247 + 0.5, 0, 800, 1.3], [V.book - 0.2, 0, 850, 1.3], [V.book + 0.5, 0, 1120, 1.27], [V.lau - 0.1, 0, 1200, 1.27], [V.offer + 0.6, 0, 1720, 1.18],
  [T_CUT1, 0, 1780, 1.16], [T_LIFT1 + 0.2, DEST.x, DEST.y, 1.34], [30, DEST.x + 10, DEST.y + 10, 1.37],
];
function cam(t) { let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1][0]) i++; const [t0, x0, y0, z0] = CAMK[i], [t1, x1, y1, z1] = CAMK[i + 1]; const e = E.inOutCubic(clamp((t - t0) / (t1 - t0))); let z = lerp(z0, z1, e); for (const k of [V.hookA + 0.35, V.demoA + 0.6, V.data + 0.5, V.sheet + 0.85, T_CUT1, T_LIFT1, V.need + 0.45, V.cta + 0.8]) if (t > k && t < k + 0.6) z += 0.05 * Math.exp(-(t - k) * 7) * Math.cos((t - k) * 22);
  return { x: lerp(x0, x1, e) + 9 * noise1(t * 0.9, 4), y: lerp(y0, y1, e) + 9 * noise1(t * 0.8, 9), z, rot: -0.035 + 0.016 * Math.sin(t * 0.55) + 0.006 * noise1(t * 1.3, 2) }; }

// ---------------------------------------------------------------- hits
const HITS = [
  ...ROLLK.slice(0, -1).map(([t0], i) => (ROLLK[i + 1][1] > ROLLK[i][1] ? [B(Math.max(0, t0)), 'print', 'type', { len: Math.min(0.8, ROLLK[i + 1][0] - t0), n: 7 }] : null)).filter(Boolean),
  [B(V.hookA + 0.35), 'zero', 'thud'], [B(V.hookB + 0.5), 'tick', 'tok', { pitch: 'E5' }],
  [B(V.demoA + 0.55), 'pop-up', 'whoosh', { len: 0.3 }], [B(V.demoB + 0.2), 'reply', 'blip', { pitch: 'A6' }],
  [B(V.s247 + 0.5), 'pen', 'type', { len: 1.2, n: 9 }], [B(V.data), 'slips', 'whoosh', { len: 0.5, from: 1800, to: 600 }],
  [B(V.sheet - 0.15), 'rule', 'type', { len: 0.7, n: 7 }], [B(V.sheet + 0.85), 'highlight', 'whoosh', { len: 0.25 }],
  [B(T_CUT0), 'snip', 'click'], [B(T_CUT0 + 0.3), 'snip', 'click'], [B(T_CUT0 + 0.6), 'snip', 'click'], [B(T_CUT1), 'free', 'pop', { pitch: 'G5' }],
  [B(V.offer + 2.4), 'lift', 'whoosh', { len: 0.6 }], [B(T_LIFT1), 'land', 'thud'],
  [B(V.need + 0.45), 'STAMP', 'impact'], [B(V.cta), 'write', 'type', { len: 0.7, n: 8 }], [B(V.cta + 0.75), 'highlight', 'whoosh', { len: 0.3 }], [B(27.5), 'glint', 'blip', { pitch: 'E6' }],
];

// ---------------------------------------------------------------- frame
function draw(ctx, t) {
  const c = cam(t), night = E.inOutCubic(prog(t, V.s247, V.s247 + 0.45)) * (1 - E.inOutCubic(prog(t, V.book - 0.3, V.book + 0.1)));
  ctx.fillStyle = '#5A3A22'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H * 0.5); ctx.rotate(c.rot); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
  ctx.fillStyle = WOOD || '#7A4E30'; ctx.fillRect(c.x - 2600, c.y - 3000, 5200, 6000);
  const tipA = strip(ctx, t);
  register(ctx, t);
  const tipB = drawStrokes(ctx, t);
  nightIcons(ctx, t);
  // the cut-out card: scissors cut it, it lifts, glides to the clean counter, lands
  let tipC = null;
  if (t > T_CUT0 && t < T_CUT1) { const f = clamp((t - T_CUT0) / (T_CUT1 - T_CUT0)); const [x, y, a] = cutAt(f); scissors(ctx, x, y, a, t); }
  if (t > V.offer + 2.35) {
    const p = clamp((t - (V.offer + 2.35)) / (T_LIFT1 - V.offer - 2.35)), e = E.inOutCubic(p), lift = Math.sin(Math.PI * p);
    const x = lerp(CARD.cx, DEST.x, e), y = lerp(CARD.cy, DEST.y, e), r = lerp(0, DEST.rot, e), s = 1 + 0.06 * lift;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s);
    ctx.fillStyle = `rgba(40,25,10,${0.3 - 0.12 * lift})`; ctx.filter = `blur(${8 + 24 * lift}px)`; ctx.fillRect(-CARD.w / 2 + 16 + 50 * lift, -CARD.h / 2 + 22 + 70 * lift, CARD.w, CARD.h); ctx.filter = 'none';
    paperRect(ctx, -CARD.w / 2, -CARD.h / 2, CARD.w / 2, CARD.h / 2);
    tipC = cardContent(ctx, t, false);
    ctx.restore();
    if (tipC) { const cs = Math.cos(r), sn = Math.sin(r); tipC = [x + (tipC[0] * cs - tipC[1] * sn) * s, y + (tipC[0] * sn + tipC[1] * cs) * s]; }
    rubberStamp(ctx, t, DEST.x, DEST.y - CARD.h / 2 + 520);
    // a soft glint across the finished card in the hold
    if (t > 27) { const g = ((t - 27) * 0.45) % 1.2; ctx.save(); ctx.translate(DEST.x, DEST.y); ctx.rotate(DEST.rot); ctx.beginPath(); ctx.rect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h); ctx.clip(); const gg = ctx.createLinearGradient(-CARD.w / 2 + g * CARD.w * 1.6 - 200, 0, -CARD.w / 2 + g * CARD.w * 1.6, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.22)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; ctx.fillRect(-CARD.w, -CARD.h, CARD.w * 2, CARD.h * 2); ctx.restore(); }
  }
  pen(ctx, tipB || tipA || tipC);
  ctx.restore();
  // warm shop lamp from the top; moonlight for the 3 AM line
  const lamp = ctx.createRadialGradient(W * 0.3, -100, 100, W * 0.5, H * 0.5, H * 0.95);
  lamp.addColorStop(0, `rgba(255,228,170,${0.28 * (1 - night)})`); lamp.addColorStop(0.55, 'rgba(0,0,0,0)'); lamp.addColorStop(1, 'rgba(20,10,0,0.45)');
  ctx.fillStyle = lamp; ctx.fillRect(0, 0, W, H);
  if (night > 0) { ctx.fillStyle = `rgba(16,28,70,${0.42 * night})`; ctx.fillRect(0, 0, W, H); const mg = ctx.createRadialGradient(W * 0.8, H * 0.1, 20, W * 0.8, H * 0.1, 700); mg.addColorStop(0, `rgba(180,205,255,${0.3 * night})`); mg.addColorStop(1, 'rgba(180,205,255,0)'); ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H); }
}

M.film({
  fonts: [font(100, 800, D), font(40, 700, UI), font(40, 700, HAND)],
  images: { name: 'assets/logo_name.jpg' },
  hits: HITS,
  samples: 6,
  init(ctx, IMG) {
    if (IMG.name) { const c = document.createElement('canvas'); c.width = 1790; c.height = 690; c.getContext('2d').drawImage(IMG.name, 300, 540, 1790, 690, 0, 0, 1790, 690); LOGO = c; }
    // walnut counter: long grain, knots, soft plank seams
    const w = document.createElement('canvas'); w.width = 1024; w.height = 512; const x = w.getContext('2d'); const r = M.mulberry32(17);
    const bg = x.createLinearGradient(0, 0, 0, 512); bg.addColorStop(0, '#8A5A38'); bg.addColorStop(0.5, '#7B4E30'); bg.addColorStop(1, '#88593A'); x.fillStyle = bg; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 260; i++) { const y0 = r() * 512, a = 2 + r() * 6; x.strokeStyle = r() < 0.5 ? `rgba(60,34,18,${0.08 + 0.12 * r()})` : `rgba(190,140,95,${0.06 + 0.08 * r()})`; x.lineWidth = 1 + r() * 2.5; x.beginPath(); for (let k = 0; k <= 64; k++) { const xx = k * 16, yy = y0 + Math.sin(k * 0.25 + i) * a + Math.sin(k * 0.05 + i * 2) * a * 2; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
    for (let i = 0; i < 4; i++) { x.fillStyle = 'rgba(40,20,8,0.35)'; x.fillRect(0, i * 128, 1024, 2); }
    WOOD = ctx.createPattern(w, 'repeat');
    const p = document.createElement('canvas'); p.width = 256; p.height = 256; const px = p.getContext('2d'); const r2 = M.mulberry32(3);
    px.fillStyle = '#FFFFFF'; px.fillRect(0, 0, 256, 256); for (let i = 0; i < 1600; i++) { px.fillStyle = `rgba(150,130,100,${0.05 * r2()})`; px.fillRect(r2() * 256, r2() * 256, 1 + r2() * 2, 1 + r2() * 2); }
    PAPERTEX = ctx.createPattern(p, 'repeat');
  },
  draw(ctx, u, t) { draw(ctx, t); },
  post(ctx, u, t) { const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.32, W / 2, H / 2, H * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); },
});
