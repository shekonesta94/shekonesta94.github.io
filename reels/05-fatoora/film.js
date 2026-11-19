// الفاتورة — Nesta ad 5. Pure function of time: window.seek(t) paints frame t.
// A thermal receipt prints line by line with the voice; each line lifts off the paper into a short scene
// of the bot at work, the paper becomes the sheet, and the "عرض الإطلاق" box is cut out and becomes the CTA.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, wobble, font, rrect, hash01, noise1, mix, TAU } = M;
const D = 'Display', UI = 'UI';
const B = (t) => t / 0.499983;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const C = {
  bg: '#0C3A41', bg2: '#145561', paper: '#FBF7EE', ink: '#1C2333', faint: '#9AA0AA', mint: '#41ECAE', mintInk: '#06402C',
  yellow: '#FFD45C', coral: '#FF6B5B', navy: '#0F1E33',
};
const V = {
  hookA: 0.44, hookB: 1.96, demoA: 5.11, demoB: 6.0, s247: 8.95, data: 11.05, book: 12.95, sheet: 14.55,
  lau: 16.85, offer: 17.95, need: 22.15, cta: 24.75,
};

function tA(ctx, s, x, y, size, color, { face = D, weight = 800, align = 'center' } = {}) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function tL(ctx, s, x, y, size, color, align = 'center', face = UI, weight = 700) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function check(ctx, x, y, s, col, w = 7) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.4); ctx.stroke(); ctx.restore(); }

// ---------------------------------------------------------------- the receipt layout (paper coordinates, y down from the slot)
const PW = 760;
const LINES = [   // [y, t (printed at), kind, ...]
  [120, 0.0, 'logo'], [270, 0.15, 'title'], [320, 0.2, 'dash'],
  [420, V.hookA, 'big'], [500, V.hookB + 0.3, 'cond'], [560, V.hookB + 0.6, 'dash'],
  [640, V.demoA, 'item', 'ديمو على سيستم شبه نشاطك'], [720, V.s247, 'item', 'رد 24 ساعة من بيانات تجارتك'], [800, V.book, 'item', 'حجوزات وأوردرات في الشيت'],
  [860, V.book + 0.3, 'dash'], [1000, V.offer, 'offer'],
];
const PRINT = 0.35;   // seconds to print one line
function paperLen(t) {   // how much paper has come out of the slot
  let L = 60; for (const [y, t0, kind] of LINES) { if (t >= t0) L = Math.max(L, y + (kind === 'offer' ? 140 : 40) + 60 * clamp((t - t0) / PRINT)); }
  return L;
}
// camera: follows the newest printed line, glides, sways
function cam(t) {
    // smooth follow (pure function: average target over the last 0.6 s)
  let acc = 0, n = 12; for (let i = 0; i < n; i++) { const tt = t - i * 0.05; let tg = 200; for (const [y, t0] of LINES) if (tt >= t0 - 0.1) tg = y; acc += tg; }
  const y = acc / n;
  const z = lerp(1.5, 1.28, E.outCubic(prog(t, 0, 1.2))) * (1 + 0.025 * Math.sin(t * 0.8));
  return { y, z, rot: -0.03 + 0.012 * Math.sin(t * 0.6), x: 6 * Math.sin(t * 0.7) };
}
const ANCHOR = H * 0.44;   // screen y of the line the camera is following

// ---------------------------------------------------------------- studio background
function studio(ctx, t, night) {
  const g = ctx.createRadialGradient(W / 2, H * 0.4, 80, W / 2, H * 0.5, H * 0.85);
  g.addColorStop(0, mix(C.bg2, '#1A2650', night)); g.addColorStop(1, mix('#06242A', '#070B1C', night));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // soft bokeh lights drifting
  for (let i = 0; i < 22; i++) { const x = (hash01(i, 1) * W + t * 8 * (hash01(i, 2) - 0.5) * 6 + W) % W, y = hash01(i, 3) * H, r = 30 + 90 * hash01(i, 4); const gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(${night > 0.5 ? '160,180,255' : '120,240,210'},${0.07 + 0.06 * hash01(i, 5)})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  if (night > 0) for (let i = 0; i < 40; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = `rgba(255,255,255,${night * (0.2 + 0.5 * tw * hash01(i, 6))})`; ctx.beginPath(); ctx.arc(hash01(i, 7) * W, hash01(i, 8) * H * 0.5, 1.5 + 1.5 * hash01(i, 9), 0, TAU); ctx.fill(); }
}

// ---------------------------------------------------------------- receipt drawing
let LOGO = null;
function printReveal(ctx, t, t0, y, h, fn) {   // the print head reveals a line right-to-left
  const p = clamp((t - t0) / PRINT); if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(PW - PW * p - 10, y - h, PW * p + 20, h * 1.6); ctx.clip(); fn(); ctx.restore();
}
function receipt(ctx, t, c, dim) {
  const L = paperLen(t) + 900;
  ctx.save();
  ctx.translate(W / 2 + c.x, ANCHOR - c.y * c.z); ctx.rotate(c.rot); ctx.scale(c.z, c.z); ctx.translate(-PW / 2, 0);
  // paper with a little flutter at the bottom and a torn zigzag edge
  const flutter = Math.sin(t * 3) * 6;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(14, 20, PW, L);
  ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(PW, -40); ctx.lineTo(PW + flutter * 0.3, L);
  for (let x = PW; x >= 0; x -= 28) ctx.lineTo(x + flutter * 0.3, L + ((x / 28) % 2 ? 0 : 14));
  ctx.closePath();
  const pg = ctx.createLinearGradient(0, 0, PW, 0); pg.addColorStop(0, '#EFEADF'); pg.addColorStop(0.08, C.paper); pg.addColorStop(0.92, C.paper); pg.addColorStop(1, '#ECE6DA');
  ctx.fillStyle = pg; ctx.fill();
  for (const [y, t0, kind, label] of LINES) {
    if (t < t0) continue;
    if (kind === 'logo') printReveal(ctx, t, t0, y + 80, 170, () => { ctx.fillStyle = C.navy; rrect(ctx, 130, y - 70, PW - 260, 190, 22); ctx.fill(); if (LOGO) { const lw = PW - 300, lh = lw * 690 / 1790; ctx.drawImage(LOGO, 0, 0, 1790, 690, 150, y + 25 - lh / 2, lw, lh); } });
    if (kind === 'title') printReveal(ctx, t, t0, y, 40, () => { tA(ctx, 'فاتورة تجربة', PW - 40, y, 34, C.ink, { face: UI, weight: 700, align: 'right' }); tL(ctx, '#0001', 40, y, 30, C.faint, 'left'); });
    if (kind === 'dash') printReveal(ctx, t, t0, y, 20, () => { ctx.strokeStyle = '#C9C2B4'; ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(PW - 30, y); ctx.stroke(); ctx.setLineDash([]); });
    if (kind === 'big') printReveal(ctx, t, t0, y, 80, () => { tA(ctx, 'المطلوب دفعه الآن', PW - 40, y, 44, C.ink, { face: UI, weight: 700, align: 'right' }); const k = sp(t, t0 + 0.3, SPRING.bouncy); ctx.save(); ctx.translate(120, y - 10); ctx.scale(k, k); tL(ctx, '0', 0, 30, 110, C.mintInk, 'center', D, 800); ctx.restore(); tA(ctx, 'جنيه', 220, y, 34, C.faint, { face: UI, weight: 700 }); });
    if (kind === 'cond') printReveal(ctx, t, t0, y, 40, () => { tA(ctx, 'لحد ما تجرّب بنفسك', PW - 40, y, 40, C.mintInk, { face: D, align: 'right' }); check(ctx, 70, y - 14, 34, C.mintInk); });
    if (kind === 'item') printReveal(ctx, t, t0, y, 40, () => { tA(ctx, label, PW - 40, y, 36, C.ink, { face: UI, weight: 700, align: 'right' }); ctx.fillStyle = C.mint; ctx.beginPath(); ctx.arc(70, y - 12, 22, 0, TAU); ctx.fill(); check(ctx, 70, y - 12, 22, C.mintInk, 5); });
    if (kind === 'offer' && !cutOut(t)) printReveal(ctx, t, t0, y + 60, 200, () => offerBox(ctx, 30, y - 80, PW - 60, 210, t, false));
  }
  // scissors along the dashed line
  const sc = clamp((t - (V.offer + 1.4)) / 0.9);
  if (sc > 0 && sc < 1) { const sx = PW - 20 - sc * (PW - 40), sy = 1000 - 92; ctx.save(); ctx.translate(sx, sy); scissors(ctx, t); ctx.restore(); }
  ctx.restore();
  // printer on top of the paper's start (screen space, moves with the camera)
  const py = ANCHOR - c.y * c.z;
  if (py > -200) {
    ctx.save(); ctx.translate(W / 2 + c.x, py); ctx.rotate(c.rot); ctx.scale(c.z, c.z);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -440 + 10, -230 + 20, 880, 230, 50); ctx.fill();
    const g = ctx.createLinearGradient(0, -230, 0, 0); g.addColorStop(0, '#3B4456'); g.addColorStop(1, '#1D2230');
    ctx.fillStyle = g; rrect(ctx, -440, -230, 880, 230, 50); ctx.fill();
    ctx.fillStyle = '#0B0E15'; rrect(ctx, -400, -30, 800, 26, 13); ctx.fill();
    const busy = LINES.some(([, t0]) => t > t0 && t < t0 + PRINT);
    ctx.fillStyle = busy ? C.mint : '#2E7A61'; ctx.beginPath(); ctx.arc(350, -150, 14, 0, TAU); ctx.fill();
    if (busy) { ctx.fillStyle = 'rgba(65,236,174,0.3)'; ctx.beginPath(); ctx.arc(350, -150, 30, 0, TAU); ctx.fill(); }
    tL(ctx, 'NESTA', -330, -130, 40, 'rgba(255,255,255,0.75)', 'left', D, 800);
    ctx.restore();
  }
  if (dim > 0) { ctx.fillStyle = `rgba(4,20,24,${0.55 * dim})`; ctx.fillRect(0, 0, W, H); }
}
function scissors(ctx, t) {
  const o = 0.35 + 0.25 * Math.sin(t * 22);
  ctx.save(); ctx.rotate(Math.PI);
  for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * o); ctx.fillStyle = '#D9DEE4'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(90, s * -8); ctx.lineTo(90, s * 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = C.coral; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(-36, s * 16, 22, 15, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#6B7280'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
  ctx.restore();
}
const cutOut = (t) => t > V.offer + 2.35;
function offerBox(ctx, x, y, w, h, t, big) {
  ctx.save();
  ctx.fillStyle = C.yellow; rrect(ctx, x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = '#3A2C00'; ctx.lineWidth = 4; ctx.setLineDash([16, 12]); rrect(ctx, x + 10, y + 10, w - 20, h - 20, 12); ctx.stroke(); ctx.setLineDash([]);
  tA(ctx, 'عرض الإطلاق', x + w - 40, y + 72, 56, '#2A1F00', { align: 'right' });
  tA(ctx, 'خصم على الاشتراك الشهري', x + w - 40, y + 132, 38, '#2A1F00', { face: UI, weight: 700, align: 'right' });
  tA(ctx, 'حتى 14 يونيو 2027', x + w - 40, y + 182, 34, '#5A4500', { face: UI, weight: 700, align: 'right' });
  // the "%" seal
  ctx.fillStyle = '#2A1F00'; ctx.beginPath(); ctx.arc(x + 110, y + h / 2, 70, 0, TAU); ctx.fill();
  tL(ctx, '%', x + 110, y + h / 2 + 30, 86, C.yellow, 'center', D, 800);
  ctx.restore();
}

// ---------------------------------------------------------------- mini scenes that lift off the paper
function card(ctx, x, y, w, h, k, fn) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate((1 - k) * 0.2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -w / 2 + 12, -h / 2 + 22, w, h, 46); ctx.fill();
  fn(w, h);
  ctx.restore();
}
function chatPhone(ctx, w, h, t, msgs) {
  ctx.fillStyle = '#12151C'; rrect(ctx, -w / 2, -h / 2, w, h, 46); ctx.fill();
  ctx.fillStyle = '#ECE5DD'; rrect(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 36); ctx.fill();
  ctx.fillStyle = '#123A5E'; ctx.beginPath(); ctx.roundRect(-w / 2 + 14, -h / 2 + 14, w - 28, 104, [36, 36, 0, 0]); ctx.fill();
  ctx.fillStyle = C.mint; ctx.beginPath(); ctx.arc(w / 2 - 70, -h / 2 + 66, 30, 0, TAU); ctx.fill();
  tA(ctx, 'بوت نستا', w / 2 - 116, -h / 2 + 64, 34, '#FFFFFF', { face: UI, weight: 700, align: 'right' });
  tA(ctx, 'متصل الآن', w / 2 - 116, -h / 2 + 96, 22, C.mint, { face: UI, weight: 600, align: 'right' });
  let yy = -h / 2 + 150;
  for (const [txt, t0, mine] of msgs) {
    const k = sp(t, t0, SPRING.bouncy); if (k <= 0.01) { yy += 96; continue; }
    ctx.save(); ctx.font = font(38, 600, UI); const bw = Math.min(w - 90, ctx.measureText(txt).width + 56);
    const bx = mine ? -w / 2 + 34 : w / 2 - 34 - bw;
    ctx.translate(bx + (mine ? 0 : bw), yy); ctx.scale(k, k); ctx.translate(-(mine ? 0 : bw), 0);
    ctx.fillStyle = mine ? '#D7F8E9' : '#FFFFFF'; rrect(ctx, 0, 0, bw, 84, 22); ctx.fill();
    ctx.direction = /^[A-Za-z0-9]/.test(txt) ? 'ltr' : 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.fillText(txt, bw / 2, 55);
    ctx.restore(); yy += 96;
  }
}
function scenes(ctx, t) {
  // 1) demo: the line lifts into a phone where "ديمو" is sent and the bot answers
  const k1 = sp(t, V.demoA + 0.15, SPRING.bouncy) * (1 - E.inBack(prog(t, V.s247 - 0.35, V.s247 - 0.05), 1.4));
  card(ctx, W / 2 + 40, H * 0.6, 780, 760, k1, (w, h) => chatPhone(ctx, w, h, t, [['ديمو', V.demoA + 0.5, false], ['أهلاً! ده ديمو على سيستم زي نشاطك', V.demoB + 0.4, true], ['تحب تجرّب حجز؟', V.demoB + 1.0, true]]));
  // 2) 24h from the business data: night, the clock, data cards flowing into the reply
  const k2 = sp(t, V.s247 + 0.15, SPRING.bouncy) * (1 - E.inBack(prog(t, V.book - 0.35, V.book - 0.05), 1.4));
  if (k2 > 0.01) {
    card(ctx, W / 2 - 30, H * 0.6, 780, 700, k2, (w, h) => chatPhone(ctx, w, h, t, [['متاح بكرة؟', V.s247 + 0.4, false], ['متاح 5:00 أو 6:30', V.s247 + 1.1, true]]));
    const ck = sp(t, V.s247 + 0.3, SPRING.bouncy) * k2;
    if (ck > 0.01) { ctx.save(); ctx.translate(W / 2 + 300, H * 0.33); ctx.scale(ck, ck); ctx.fillStyle = '#1D2D4A'; rrect(ctx, -140, -44, 280, 88, 44); ctx.fill(); tL(ctx, '3:00 AM', 20, 16, 44, '#FFFFFF'); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(-90, 0, 20, 0, TAU); ctx.fill(); ctx.fillStyle = '#1D2D4A'; ctx.beginPath(); ctx.arc(-80, -8, 17, 0, TAU); ctx.fill(); ctx.restore(); }
    ['الأسعار', 'المواعيد', 'المنيو'].forEach((s, i) => {
      const p = clamp((t - (V.data + i * 0.25)) / 0.6); if (p <= 0 || p >= 1) return; const e = E.inOutCubic(p);
      const x = lerp(-120, W / 2 - 40, e) + (i - 1) * 40 * (1 - e), y = lerp(H * 0.36 + i * 120, H * 0.6, e);
      ctx.save(); ctx.translate(x, y); ctx.scale(1 - 0.7 * e, 1 - 0.7 * e); ctx.globalAlpha = 1 - prog(p, 0.8, 1);
      ctx.fillStyle = '#FFFFFF'; rrect(ctx, -120, -40, 240, 80, 16); ctx.fill(); ctx.fillStyle = C.mint; ctx.beginPath(); ctx.roundRect(-120, -40, 240, 18, [16, 16, 0, 0]); ctx.fill();
      tA(ctx, s, 0, 24, 34, C.ink, { face: UI, weight: 700 }); ctx.restore();
    });
  }
  // 3) the receipt turns into the sheet: rows fill
  const k3 = sp(t, V.sheet - 0.2, SPRING.bouncy) * (1 - E.inBack(prog(t, V.lau - 0.3, V.lau), 1.4));
  card(ctx, W / 2, H * 0.6, 900, 560, k3, (w, h) => {
    ctx.fillStyle = '#FFFFFF'; rrect(ctx, -w / 2, -h / 2, w, h, 30); ctx.fill();
    ctx.fillStyle = '#1E8E4E'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, 84, [30, 30, 0, 0]); ctx.fill();
    tA(ctx, 'الشيت · الحجوزات والأوردرات', w / 2 - 36, -h / 2 + 56, 36, '#FFFFFF', { face: UI, weight: 700, align: 'right' });
    const rows = [['منى', 'حجز', 'بكرة 5:00'], ['كريم', 'أوردر', '2 بيتزا'], ['سارة', 'حجز', 'الخميس 6:30'], ['أحمد', 'أوردر', 'توصيل']];
    rows.forEach((r, i) => {
      const yy = -h / 2 + 140 + i * 92, rk = clamp((t - (V.sheet + 0.1 + i * 0.28)) / 0.25);
      ctx.fillStyle = '#E8EEEA'; ctx.fillRect(-w / 2 + 30, yy + 34, w - 60, 2);
      if (rk > 0) { ctx.fillStyle = `rgba(65,236,174,${0.35 * (1 - clamp((t - V.sheet - 0.6 - i * 0.28) / 0.6)) + 0.08})`; ctx.fillRect(-w / 2 + 20, yy - 40, w - 40, 72); ctx.globalAlpha = rk; tA(ctx, r[0], w / 2 - 50, yy + 12, 34, C.ink, { face: UI, weight: 700, align: 'right' }); tA(ctx, r[1], 60, yy + 12, 34, C.ink, { face: UI, weight: 600 }); tA(ctx, r[2], -w / 2 + 210, yy + 12, 32, '#1E8E4E', { face: UI, weight: 700 }); ctx.globalAlpha = 1; }
    });
  });
}
// ---------------------------------------------------------------- the offer cut-out flies to you, then becomes the CTA
function finale(ctx, t) {
  if (!cutOut(t)) return;
  const p = E.outBack(prog(t, V.offer + 2.35, V.offer + 3.0), 1.2);
  const flip = E.inOutCubic(prog(t, V.need + 0.9, V.need + 1.5));   // flips into the CTA card
  const x = W / 2, y = lerp(H * 0.66, H * 0.5, p), s = lerp(0.82, 1.22, p);
  ctx.save(); ctx.translate(x, y); ctx.rotate(lerp(-0.06, -0.02, p) + 0.01 * Math.sin(t * 2)); ctx.scale(s * Math.max(0.02, Math.abs(Math.cos(flip * Math.PI))), s);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -350 + 12, -105 + 24, 700, flip < 0.5 ? 210 : 560, 24); ctx.fill();
  if (flip < 0.5) offerBox(ctx, -350, -105, 700, 210, t, true);
  else {
    // the CTA card: logo, offer reminder, the action
    ctx.fillStyle = C.navy; rrect(ctx, -350, -105, 700, 560, 30); ctx.fill();
    ctx.strokeStyle = C.mint; ctx.lineWidth = 4; rrect(ctx, -334, -89, 668, 528, 22); ctx.stroke();
    if (LOGO) { const lw = 560, lh = lw * 690 / 1790; ctx.drawImage(LOGO, 0, 0, 1790, 690, -lw / 2, -90, lw, lh); }
    ctx.fillStyle = C.yellow; rrect(ctx, -300, 150, 600, 64, 32); ctx.fill(); tA(ctx, 'عرض الإطلاق حتى 14 يونيو 2027', 0, 194, 32, '#2A1F00', { face: UI, weight: 700 });
    tA(ctx, 'ابعت ديمو على واتساب', 0, 300, 52, '#FFFFFF');
    const pk = sp(t, V.cta + 0.1, SPRING.bouncy);
    ctx.save(); ctx.translate(0, 380); ctx.scale(pk, pk); ctx.fillStyle = C.mint; rrect(ctx, -290, -50, 580, 100, 50); ctx.fill(); tL(ctx, '010 9311 4446', -50, 18, 50, C.mintInk); tA(ctx, 'واتساب', 260, 16, 34, C.mintInk, { face: UI, weight: 700, align: 'right' }); ctx.fillStyle = 'rgba(6,64,44,0.3)'; ctx.fillRect(130, -30, 3, 60); ctx.restore();
  }
  ctx.restore();
  // "كلمة واحدة بس" whisper line above the card while the need line plays
  const nk = sp(t, V.need, SPRING.bouncy) * (1 - clamp((t - V.cta) / 0.25));
  if (nk > 0.01) { ctx.save(); ctx.translate(W / 2, H * 0.2); ctx.scale(nk, nk); tA(ctx, 'المطلوب منك: كلمة واحدة بس', 0, 0, 62, C.yellow); ctx.restore(); }
  if (t > 27) for (let r = 0; r < 2; r++) { const ph = ((t - 27) * 0.7 + r * 0.5) % 1; ctx.strokeStyle = `rgba(65,236,174,${0.5 * (1 - ph)})`; ctx.lineWidth = 5; rrect(ctx, W / 2 - 360 - ph * 60, H * 0.5 - 130 - ph * 60, 720 + ph * 120, 680 + ph * 120, 40); ctx.stroke(); }
}
// headline captions (big, short) over the top
const CAPS = [
  [V.hookA, V.demoA - 0.2, 'ماتدفعش ولا جنيه…'],
  [V.demoA, V.s247 - 0.2, 'جرّب الديمو الأول'],
  [V.s247, V.book - 0.2, 'رد 24 ساعة'],
  [V.book, V.lau - 0.2, 'وكله في الشيت'],
  [V.lau, V.need - 0.2, 'ولو عجبك؟'],
];
function captions(ctx, t) {
  for (const [t0, t1, s] of CAPS) {
    if (t < t0 - 0.05 || t > t1 + 0.3) continue;
    const k = sp(t, t0, SPRING.bouncy), out = E.inBack(prog(t, t1, t1 + 0.3), 1.5);
    ctx.save(); ctx.translate(W / 2, 250 - out * 260); ctx.scale(0.6 + 0.4 * Math.min(1.1, k), 0.6 + 0.4 * Math.min(1.1, k)); ctx.globalAlpha = clamp(k * 2) * (1 - out);
    ctx.font = font(84, 800, D); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(4,20,24,0.85)'; ctx.lineWidth = 16; ctx.strokeText(s, 0, 0); ctx.fillStyle = '#FFFFFF'; ctx.fillText(s, 0, 0);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- hits
const HITS = [
  ...LINES.map(([, t0, kind]) => [B(Math.max(0.01, t0)), 'print ' + kind, 'type', { len: PRINT, n: 5 }]),
  [B(V.hookA + 0.3), 'zero', 'thud'], [B(V.hookB + 0.6), 'condition', 'bell', { pitch: 'E6' }],
  [B(V.demoA + 0.15), 'lift 1', 'whoosh', { len: 0.35 }], [B(V.demoA + 0.5), 'msg', 'pop', { pitch: 'C5' }], [B(V.demoB + 0.4), 'reply', 'blip', { pitch: 'A6' }],
  [B(V.s247 + 0.15), 'lift 2', 'whoosh', { len: 0.35 }], [B(V.s247 + 1.1), 'reply', 'blip', { pitch: 'A6' }], [B(V.data), 'cards', 'tok', { pitch: 'E5' }],
  [B(V.sheet - 0.2), 'sheet', 'whoosh', { len: 0.35 }], [B(V.sheet + 0.1), 'rows', 'type', { len: 1.0, n: 8 }],
  [B(V.offer), 'offer prints', 'bell', { pitch: 'G6' }], [B(V.offer + 1.4), 'snip', 'click'], [B(V.offer + 1.9), 'snip2', 'click'], [B(V.offer + 2.35), 'cut free', 'whoosh', { len: 0.4 }],
  [B(V.need), 'need', 'pop', { pitch: 'D6' }], [B(V.need + 1.2), 'flip', 'whoosh', { len: 0.3 }], [B(V.cta + 0.1), 'pill', 'impact'], [B(27), 'pulse', 'blip', { pitch: 'D6' }],
];

// ---------------------------------------------------------------- frame
function draw(ctx, t) {
  const night = E.inOutCubic(prog(t, V.s247, V.s247 + 0.4)) * (1 - E.inOutCubic(prog(t, V.book - 0.3, V.book)));
  studio(ctx, t, night);
  const sceneOn = Math.max(sp(t, V.demoA + 0.15) * (1 - prog(t, V.s247 - 0.3, V.s247)), night, sp(t, V.sheet - 0.2) * (1 - prog(t, V.lau - 0.3, V.lau)), cutOut(t) ? 1 : 0);
  receipt(ctx, t, cam(t), clamp(sceneOn) * 0.85);
  scenes(ctx, t);
  finale(ctx, t);
  captions(ctx, t);
}

M.film({
  fonts: [font(100, 800, D), font(40, 700, UI), font(40, 600, UI)],
  images: { name: 'assets/logo_name.jpg' },
  hits: HITS,
  samples: 6,
  init(ctx, IMG) { if (IMG.name) { const c = document.createElement('canvas'); c.width = 1790; c.height = 690; c.getContext('2d').drawImage(IMG.name, 300, 540, 1790, 690, 0, 0, 1790, 690); LOGO = c; } },
  draw(ctx, u, t) { draw(ctx, t); },
  post(ctx, u, t) {
    const v = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
});
