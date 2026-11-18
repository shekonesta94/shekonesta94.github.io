// خيال الظل — Nesta ad 3 (redo). Pure function of time: window.seek(t) paints frame t.
// A small Egyptian shadow theatre: a glowing paper screen, two tarboosh puppets you can only see as
// shadows, a lamp that moves (and so moves the shot). The screen lifts on the reveal.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, wobble, font, rrect, hash01, noise1, mix, TAU } = M;

const C = {
  room: '#120A07', glowHi: '#FFE2A3', glowMid: '#F2A541', glowLo: '#B4561E', shadow: '#1A0D07',
  velvet: '#5A1414', velvet2: '#8E2323', gold: '#E2B04A', wood: '#3B2416', wood2: '#5A3A22',
  mint: '#41ECAE', mintInk: '#06281C', cream: '#F6E7C8', navy: '#0F1E33', moon: '#9FC0E8',
};
const D = 'Display', UI = 'UI';
const O = 0.29, T = (s) => s + O, B = (t) => t / 0.499983;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const V = {
  a1: T(0.15), b1: T(1.65), c1: T(3.01), a2: T(4.53), b2: T(6.06), a3: T(8.02), b3: T(9.51), a4: T(11.71), b4: T(12.61),
  a5: T(13.94), b5: T(16.83), a6: T(18.66), b6: T(20.28), a7: T(21.99), b7: T(22.96), a8: T(25.21), b8: T(27.06),
};
const SCREEN = { x: 0, y: -120, w: 1120, h: 1260 };
const PA = [-270, 150], PB = [270, 150];

// ---------------------------------------------------------------- hits
const HITS = [
  [B(0.0), 'lamp ignites', 'sub', { len: 0.7 }], [B(0.05), 'curtain', 'whoosh', { len: 0.5, from: 300, to: 1200 }],
  [B(0.25), 'puppets up', 'pop', { pitch: 'A4', to: 'E5' }],
  [B(V.c1), 'question drops', 'thud'], [B(V.c1 + 0.35), 'swing', 'tok', { pitch: 'E5' }], [B(V.c1 + 0.9), 'swing2', 'tok', { pitch: 'A5' }],
  [B(V.a2 + 0.5), 'bubble A', 'pop', { pitch: 'C5' }], [B(V.b2 + 0.4), 'bubble B', 'pop', { pitch: 'E5' }],
  [B(V.a2 + 1.0), 'check A', 'click'], [B(V.b2 + 0.9), 'check B', 'click'],
  [B(V.a3), 'moonlight', 'swell'], [B(V.b3 + 0.2), 'nod off', 'boing', { pitch: 'E4', to: 'A3' }],
  [B(V.b3 + 0.8), 'bubble 3:02', 'blip', { pitch: 'A6' }],
  [B(V.a4 - 0.4), 'riser', 'riser', { len: 0.4 }],
  [B(V.a4), 'SCREEN LIFTS', 'impact'],
  [B(V.b4 + 0.1), 'banner', 'whoosh', { len: 0.3 }],
  [B(V.a5 + 0.4), 'ar bubble', 'blip', { pitch: 'E6' }], [B(V.a5 + 1.3), 'en bubble', 'blip', { pitch: 'B6' }],
  [B(V.b5 + 0.1), 'card1', 'tok', { pitch: 'A5' }], [B(V.b5 + 0.4), 'card2', 'tok', { pitch: 'C6' }], [B(V.b5 + 0.7), 'card3', 'tok', { pitch: 'E6' }],
  [B(V.a6 - 0.2), 'thread', 'whoosh', { len: 0.4, pan: 0.4 }],
  [B(V.a6 + 0.5), 'calendar', 'bell', { pitch: 'A6' }], [B(V.b6 + 0.3), 'sheet', 'type', { len: 0.6, n: 7 }],
  [B(V.a7 - 0.3), 'back to him', 'whoosh', { len: 0.4, pan: -0.4 }],
  [B(V.b7 + 0.1), 'wakes', 'boing', { pitch: 'A3', to: 'E4' }], [B(V.b7 + 0.9), 'customer', 'pop', { pitch: 'C5' }],
  [B(V.a8 - 0.2), 'curtains close', 'whoosh', { len: 0.6, from: 1200, to: 300 }],
  [B(V.a8 + 0.55), 'sign drops', 'thud'], [B(V.a8 + 0.8), 'logo', 'bell', { pitch: 'E6' }],
  [B(29.4), 'sparkle', 'blip', { pitch: 'E6' }],
];

// ---------------------------------------------------------------- camera + lamp
const CAMK = [
  [0, 0, -40, 0.86], [3.2, 0, -60, 0.98], [3.7, 0, -230, 1.16], [4.75, 0, -230, 1.2], [5.25, -250, -20, 1.38], [6.2, -250, -20, 1.42],
  [6.75, 250, -20, 1.38], [8.1, 250, -20, 1.42], [8.6, 0, -170, 1.02], [9.75, 0, -170, 1.05], [10.3, 250, -40, 1.42], [11.6, 250, -40, 1.48],
  [12.35, 0, 30, 1.1], [14.0, 0, 30, 1.13], [14.6, 250, -200, 1.3], [16.9, 260, -200, 1.33], [17.4, 300, -180, 1.12], [18.7, 310, -180, 1.15],
  [19.3, 400, -300, 1.2], [21.9, 410, -300, 1.24], [22.6, -240, -40, 1.3], [25.1, -250, -40, 1.34], [25.9, 0, -340, 1.08], [32, 0, -340, 1.11],
];
function camera(t) {
  let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1][0]) i++;
  const [t0, x0, y0, z0] = CAMK[i], [t1, x1, y1, z1] = CAMK[i + 1];
  const p = clamp((t - t0) / (t1 - t0)), e = E.inOutCubic(p), dist = Math.hypot(x1 - x0, y1 - y0);
  return { x: lerp(x0, x1, e), y: lerp(y0, y1, e), z: lerp(z0, z1, e) * (1 - Math.min(0.12, dist / 7000) * Math.sin(Math.PI * p)) };
}
// the lamp behind the screen: its x follows the action; its colour goes moonlight for the 3 AM beat
function lamp(t) {
  const keys = [[0, 0], [V.a2 + 0.2, -240], [V.b2 + 0.1, 240], [V.a3 + 0.2, 0], [V.b3 + 0.3, 200], [V.a4, 0]];
  let x = 0; for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i][0]) x = lerp(keys[i][1], keys[i + 1][1], E.inOutCubic(clamp((t - keys[i + 1][0] + 0.5) / 0.5)));
  if (t >= keys[keys.length - 1][0]) x = 0;
  const on = lerp(0.45, 1, E.outCubic(prog(t, 0, 0.3))) * (0.86 + 0.14 * (noise1(t * 9, 4) * 0.5 + 0.5));
  const moon = clamp(prog(t, V.a3, V.a3 + 0.5)) * (1 - prog(t, V.a4 - 0.2, V.a4));
  return { x, on, moon };
}

// ---------------------------------------------------------------- type
function tA(ctx, s, x, y, size, color, { face = D, weight = 700, align = 'center' } = {}) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function tL(ctx, s, x, y, size, color, align = 'center', face = UI) {
  ctx.save(); ctx.font = font(size, 700, face); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function check(ctx, x, y, s, col, w = 9) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.4); ctx.stroke(); ctx.restore(); }

// ---------------------------------------------------------------- the puppet (tarboosh man at a little table, profile)
// pose: {type 0..1 typing, sleep 0..1 head down, wake 0..1, turn 0..1 (turns to greet)}
function puppetPath(ctx, pose, t, col, { rods = true, colour = false } = {}) {
  const typ = pose.type ? Math.sin(t * 22) * 6 * pose.type : 0;
  const nod = pose.sleep * 0.55, sag = pose.sleep * 18;
  ctx.save();
  // table
  const fill = (c) => { ctx.fillStyle = colour ? c : col; };
  fill('#8A5A32'); ctx.fillRect(40, 0, 230, 18); ctx.fillRect(60, 18, 14, 150); ctx.fillRect(236, 18, 14, 150);
  // chair
  fill('#6E4527'); ctx.fillRect(-90, 60, 110, 14); ctx.fillRect(-90, -60, 14, 230); ctx.fillRect(4, 74, 12, 96);
  // legs
  fill('#2E3A5C'); ctx.beginPath(); ctx.moveTo(-60, 40); ctx.lineTo(60, 40); ctx.lineTo(80, 70); ctx.lineTo(70, 170); ctx.lineTo(50, 170); ctx.lineTo(48, 82); ctx.lineTo(-50, 82); ctx.closePath(); ctx.fill();
  // torso (galabeya / shirt)
  ctx.save(); ctx.translate(-20, 50); ctx.rotate(nod * 0.35);
  fill('#3F6FB0'); ctx.beginPath(); ctx.moveTo(-55, 0); ctx.quadraticCurveTo(-70, -110, -35, -175 + sag * 0.3); ctx.lineTo(40, -178 + sag * 0.3); ctx.quadraticCurveTo(70, -100, 55, 0); ctx.closePath(); ctx.fill();
  // head + tarboosh
  ctx.save(); ctx.translate(5, -190 + sag); ctx.rotate(nod);
  fill('#C98A5A'); ctx.beginPath(); ctx.arc(0, -40, 44, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(38, -50); ctx.quadraticCurveTo(66, -38, 40, -26); ctx.fill();   // nose
  ctx.beginPath(); ctx.moveTo(20, -10); ctx.quadraticCurveTo(46, 6, 10, 10); ctx.fill();     // moustache/chin
  fill('#B3262B'); ctx.beginPath(); ctx.moveTo(-36, -72); ctx.lineTo(34, -72); ctx.lineTo(26, -126); ctx.lineTo(-28, -126); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = colour ? '#1B1B1B' : col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-2, -126); ctx.quadraticCurveTo(-30, -122, -36, -92 + Math.sin(t * 3) * 3); ctx.stroke();   // tassel
  if (colour) { ctx.fillStyle = '#1B1B1B'; ctx.beginPath(); ctx.arc(16, -46, 5, 0, TAU); ctx.fill(); }
  ctx.restore();
  // arm + phone
  ctx.save(); ctx.translate(20, -150 + sag); ctx.rotate(0.9 - pose.sleep * 0.5 - (pose.turn || 0) * 1.4);
  fill('#3F6FB0'); rrect(ctx, -14, 0, 28, 95, 14); ctx.fill();
  ctx.translate(0, 90); ctx.rotate(-1.5 + typ * 0.01 + pose.sleep * 0.9);
  fill('#C98A5A'); rrect(ctx, -12, 0, 24, 90, 12); ctx.fill();
  if (!pose.turn || pose.turn < 0.5) { fill('#20232A'); rrect(ctx, -22, 78 + typ * 0.4, 44, 64, 8); ctx.fill(); }
  ctx.restore();
  ctx.restore();
  // rods (authentic: thin sticks from below)
  if (rods) { ctx.strokeStyle = colour ? 'rgba(90,58,34,0.9)' : col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, 60); ctx.lineTo(-30, 420); ctx.moveTo(120, -40 + typ); ctx.lineTo(150, 420); ctx.stroke(); }
  ctx.restore();
}
// the bot, revealed: the Nesta bubble floating over a nest of threads (the logo, alive)
function nestBot(ctx, x, y, s, t, glow = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createRadialGradient(0, -120, 10, 0, -120, 300); g.addColorStop(0, `rgba(65,236,174,${0.35 * glow})`); g.addColorStop(1, 'rgba(65,236,174,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -120, 300, 0, TAU); ctx.fill();
  // nest: woven threads
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const a0 = hash01(i, 3) * Math.PI, r = 120 + 40 * hash01(i, 4);
    ctx.strokeStyle = i % 4 ? '#EDEAE2' : '#CFCAC0'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.ellipse(0, 20 + (hash01(i, 5) - 0.5) * 40, r, 46 + 20 * hash01(i, 6), (hash01(i, 7) - 0.5) * 0.5, a0 * 0.2, Math.PI - a0 * 0.2); ctx.stroke();
  }
  for (let i = 0; i < 9; i++) { const a = 0.2 + i * 0.34; const r = 160; ctx.fillStyle = C.mint; ctx.beginPath(); ctx.arc(Math.cos(a) * r * (i % 2 ? 1 : -1), 40 + Math.sin(a) * 50, 13, 0, TAU); ctx.fill(); }
  // the bubble, bobbing
  const bob = Math.sin(t * 2.4) * 10;
  ctx.translate(0, -150 + bob);
  ctx.fillStyle = C.mint; ctx.beginPath(); ctx.ellipse(0, 0, 112, 90, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-40, 60); ctx.lineTo(-70, 120); ctx.lineTo(0, 78); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-40, -38, 34, 16, -0.5, 0, TAU); ctx.fill();
  // little "typing" dots = it's talking
  for (let i = 0; i < 3; i++) { ctx.fillStyle = C.mintInk; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8 - i); ctx.beginPath(); ctx.arc(-34 + i * 34, 4, 11, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- shadow-cut bubble (black card, words cut out so light shows through)
function cutBubble(ctx, x, y, w, h, text, k, { flip = false, latin = false, glowCol = C.glowHi, size = 50 } = {}) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = C.shadow; rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.beginPath(); const tx = flip ? w / 2 - 50 : -w / 2 + 50; ctx.moveTo(tx, h / 2 - 6); ctx.lineTo(tx + (flip ? 30 : -30), h / 2 + 46); ctx.lineTo(tx + (flip ? -26 : 26), h / 2 - 6); ctx.fill();
  if (latin) tL(ctx, text, 0, size * 0.36, size, glowCol); else tA(ctx, text, 0, size * 0.36, size, glowCol, { face: UI });
  ctx.restore();
}

// ---------------------------------------------------------------- velvet curtains + valance
function curtains(ctx, open, t) {
  // open 0 = closed, 1 = fully open. World coords around the screen.
  const half = 900, cx = SCREEN.x, top = -1500, bot = 1400;
  for (const side of [-1, 1]) {
    const edge = cx + side * lerp(-4, 880, open);
    const outer = cx + side * 1700;
    ctx.save();
    const x0 = Math.min(edge, outer), x1 = Math.max(edge, outer), w = x1 - x0;
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    const folds = 9;
    for (let i = 0; i <= folds; i++) { const f = i / folds; g.addColorStop(f, i % 2 ? C.velvet : C.velvet2); }
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x1, top);
    // inner edge sways and gathers at the bottom
    const sway = Math.sin(t * 1.3 + side) * 8;
    if (side < 0) { ctx.lineTo(x1 + sway, bot); ctx.lineTo(x0, bot); } else { ctx.lineTo(x1, bot); ctx.lineTo(x0 + sway, bot); }
    ctx.closePath(); ctx.fill();
    // inner edge shade + gold trim
    const ex = side < 0 ? x1 : x0;
    const sh = ctx.createLinearGradient(ex - side * 60, 0, ex, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = sh; ctx.fillRect(Math.min(ex, ex - side * 60), top, 60, bot - top);
    if (open > 0.08) { ctx.fillStyle = C.gold; ctx.fillRect(ex - (side < 0 ? 10 : 0), top, 10, bot - top); }
    ctx.restore();
  }
  // valance with scallops
  ctx.fillStyle = C.velvet; ctx.fillRect(cx - 1800, -1500, 3600, 260);
  for (let i = -16; i <= 16; i++) { ctx.beginPath(); ctx.arc(cx + i * 110, -1240, 56, 0, Math.PI); ctx.fill(); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(cx + i * 110, -1240 + 56, 7, 0, TAU); ctx.fill(); ctx.fillStyle = C.velvet; }
  ctx.fillStyle = C.gold; ctx.fillRect(cx - 1800, -1250, 3600, 8);
}

// ---------------------------------------------------------------- the paper screen with shadows
let PAPER = null;
function screen(ctx, t, L) {
  const { x, y, w, h } = SCREEN;
  const lift = E.inCubic(prog(t, V.a4, V.a4 + 0.5)) * 1900;
  if (lift >= 1900) return;
  ctx.save(); ctx.translate(0, -lift);
  // wooden frame
  ctx.fillStyle = C.wood; rrect(ctx, x - w / 2 - 40, y - h / 2 - 40, w + 80, h + 80, 20); ctx.fill();
  ctx.strokeStyle = C.wood2; ctx.lineWidth = 8; rrect(ctx, x - w / 2 - 22, y - h / 2 - 22, w + 44, h + 44, 14); ctx.stroke();
  // glowing paper
  ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.clip();
  const lx = x + L.x, ly = y - 40;
  const hi = mix(C.glowHi, '#D6E6FA', L.moon), mid = mix(C.glowMid, C.moon, L.moon), lo = mix(C.glowLo, '#203454', L.moon);
  const g = ctx.createRadialGradient(lx, ly, 20, lx, ly, 900);
  g.addColorStop(0, hi); g.addColorStop(0.45, mid); g.addColorStop(1, lo);
  ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.globalAlpha = L.on; ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.globalAlpha = 1;
  if (PAPER) { ctx.save(); ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = PAPER; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.restore(); }
  // shadows: soft (paper diffusion), and they lean away from the lamp
  ctx.save(); ctx.shadowColor = 'rgba(26,13,7,0.9)'; ctx.shadowBlur = 10;
  const up = E.outBack(prog(t, 0.15, 0.6), 1.3);
  const sleepA = E.inOutCubic(prog(t, V.b3 + 0.1, V.b3 + 0.7));
  for (const [P, flip, isA] of [[PA, 1, true], [PB, -1, false]]) {
    const lean = (P[0] - L.x) * 0.0006;
    const sc = 0.92 + 0.14 * (1 - Math.abs(P[0] - L.x) / 700);
    ctx.save(); ctx.translate(P[0], P[1] + (1 - up) * 700); ctx.transform(1, 0, lean, 1, 0, 0); ctx.scale(flip * sc * 1.22, sc * 1.22);
    puppetPath(ctx, { type: isA ? (1 - sleepA) : 1, sleep: isA ? sleepA : 0 }, t + (isA ? 0 : 0.37), C.shadow);
    ctx.restore();
  }
  // sleeping z's from A
  if (sleepA > 0.5) for (let i = 0; i < 3; i++) { const ph = ((t - V.b3) * 0.7 + i / 3) % 1; tL(ctx, 'z', PA[0] + 60 + ph * 70, PA[1] - 300 - ph * 140, 40 + i * 12, `rgba(26,13,7,${0.85 * (1 - ph)})`, 'center', UI); }
  // the question mark on a rod, swinging between them
  const qk = sp(t, V.c1, SPRING.bouncy), qout = prog(t, V.a2 - 0.2, V.a2 + 0.2);
  if (qk > 0.01 && qout < 1) {
    const ang = Math.sin((t - V.c1) * 3.4) * 0.5 * Math.exp(-(t - V.c1) * 0.4);
    ctx.save(); ctx.translate(0, y - h / 2 - 20 - (1 - qk) * 400 - qout * 600); ctx.rotate(ang);
    ctx.fillStyle = C.shadow; ctx.fillRect(-3, 0, 6, 240); tA(ctx, '؟', 0, 470, 300, C.shadow, { face: D }); ctx.restore();
  }
  // cut-out bubbles
  cutBubble(ctx, PA[0] + 40, -280, 420, 120, 'الكشف بـ 300', sp(t, V.a2 + 0.5, SPRING.bouncy) * (1 - prog(t, V.a3, V.a3 + 0.3)), { size: 46 });
  cutBubble(ctx, PB[0] - 40, -280, 420, 120, 'الكشف بـ 300', sp(t, V.b2 + 0.4, SPRING.bouncy) * (1 - prog(t, V.a3, V.a3 + 0.3)), { flip: true, size: 46 });
  for (const [px, t0] of [[-450, V.a2 + 1.0], [450, V.b2 + 0.9]]) { const k = sp(t, t0, SPRING.bouncy) * (1 - prog(t, V.a3, V.a3 + 0.3)); if (k > 0.02) { ctx.save(); ctx.translate(px, -345); ctx.scale(k, k); ctx.fillStyle = C.shadow; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill(); check(ctx, 0, 2, 40, mix(C.glowHi, '#D6E6FA', L.moon), 8); ctx.restore(); } }
  // 3 AM: moon + clock silhouettes, and B answers at 3:02
  const mk = clamp(prog(t, V.a3, V.a3 + 0.5)) * (1 - prog(t, V.a4 - 0.2, V.a4));
  if (mk > 0) {
    ctx.save(); ctx.globalAlpha = mk;
    ctx.fillStyle = C.shadow; ctx.beginPath(); ctx.arc(-330, y - h / 2 + 200, 80, 0, TAU); ctx.arc(-300, y - h / 2 + 180, 70, 0, TAU, true); ctx.fill('evenodd');
    ctx.translate(0, y - h / 2 + 230); ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fill();
    ctx.strokeStyle = mix(C.glowHi, '#D6E6FA', L.moon); ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(-Math.PI / 2 + TAU * 3 / 12) * 55, Math.sin(-Math.PI / 2 + TAU * 3 / 12) * 55); ctx.stroke();
    ctx.lineWidth = 8; const ma = -Math.PI / 2 + TAU * (2 / 60) + (t - V.a3) * 0.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ma) * 85, Math.sin(ma) * 85); ctx.stroke();
    ctx.restore();
    cutBubble(ctx, PB[0] - 40, -300, 340, 110, '3:02 AM', sp(t, V.b3 + 0.8, SPRING.bouncy) * mk, { flip: true, latin: true, glowCol: '#D6E6FA', size: 52 });
  }
  // shadow captions at the top of the screen (cut paper type)
  const cap = (s, t0, t1, yy, size) => { const k = clamp((t - t0) / 0.3) * (1 - clamp((t - t1) / 0.25)); if (k > 0) { ctx.save(); ctx.globalAlpha = k; tA(ctx, s, 0, yy + (1 - k) * 30, size, C.shadow); ctx.restore(); } };
  cap('واحد موظف… والتاني بوت', V.a1, V.c1 - 0.1, y - h / 2 + 170, 92);
  cap('خمّن مين؟', V.c1 + 0.2, V.a2, y + h / 2 - 110, 110);
  cap('الاتنين ردّوا صح', V.a2 + 0.2, V.a3 - 0.1, y - h / 2 + 330, 84);
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------- backstage (what the screen was hiding)
function backstage(ctx, t, IMG) {
  const { x, y, w, h } = SCREEN;
  const rev = prog(t, V.a4, V.a4 + 0.6);
  // warm wooden back wall, wider than the screen
  ctx.fillStyle = '#24140C'; ctx.fillRect(-1500, -1300, 3000, 2600);
  for (let i = -14; i <= 14; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,200,140,0.03)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(i * 110, -1300, 110, 2600); }
  // the oil lamp that was casting the shadows
  const lx = x, ly = y - 330;
  const fl = 0.9 + 0.1 * noise1(t * 11, 2);
  const lg = ctx.createRadialGradient(lx, ly, 10, lx, ly, 900 * fl); lg.addColorStop(0, 'rgba(255,214,140,0.55)'); lg.addColorStop(0.4, 'rgba(242,165,65,0.18)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lg; ctx.fillRect(-1500, -1300, 3000, 2600);
  ctx.strokeStyle = '#1A0F08'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(lx, -1300); ctx.lineTo(lx, ly - 60); ctx.stroke();
  ctx.fillStyle = '#B5893F'; ctx.beginPath(); ctx.moveTo(lx - 50, ly - 60); ctx.lineTo(lx + 50, ly - 60); ctx.lineTo(lx + 36, ly + 40); ctx.lineTo(lx - 36, ly + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(255,236,180,${fl})`; ctx.beginPath(); ctx.ellipse(lx, ly - 10, 18, 30 * fl, 0, 0, TAU); ctx.fill();
  // floor plank
  ctx.fillStyle = '#3A2414'; ctx.fillRect(-1500, 330, 3000, 900); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-1500, 330, 3000, 20);
  // the employee puppet, in colour, asleep (then wakes later)
  const wake = E.inOutCubic(prog(t, V.b7, V.b7 + 0.6));
  const sleep = (1 - wake);
  const turn = E.inOutCubic(prog(t, V.b7 + 0.6, V.b7 + 1.1));
  ctx.save(); ctx.translate(PA[0], PA[1]); ctx.scale(1, 1);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 14;
  puppetPath(ctx, { type: 0, sleep, turn }, t, '#000', { colour: true });
  ctx.restore();
  // punched pattern dots (khayal puppets are perforated)
  if (sleep > 0.5) for (let i = 0; i < 3; i++) { const ph = ((t - V.a4) * 0.7 + i / 3) % 1; tL(ctx, 'z', PA[0] + 60 + ph * 70, PA[1] - 300 - ph * 140, 40 + i * 12, `rgba(246,231,200,${0.85 * (1 - ph)})`, 'center', UI); }
  // a customer walks in for him (the work that needs a person)
  const ck = E.outCubic(prog(t, V.b7 + 0.8, V.b7 + 1.5));
  if (ck > 0) { ctx.save(); ctx.translate(lerp(-900, -560, ck), PA[1]); ctx.scale(-1, 1); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20; customer(ctx, t, ck); ctx.restore(); }
  // the bot
  const bk = E.outBack(prog(t, V.a4 + 0.25, V.a4 + 0.85), 1.5);
  if (bk > 0) nestBot(ctx, PB[0] + 20, PB[1] + 40, 0.95 * bk, t, 1);
  // its banner
  const bn = E.outCubic(prog(t, V.b4 + 0.05, V.b4 + 0.45));
  if (bn > 0) {
    ctx.save(); ctx.translate(PB[0] + 20, PB[1] + 250);
    ctx.beginPath(); ctx.rect(-260 * bn, -70, 520 * bn, 140); ctx.clip();
    ctx.fillStyle = C.cream; rrect(ctx, -250, -60, 500, 120, 20); ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 6; rrect(ctx, -238, -48, 476, 96, 14); ctx.stroke();
    tA(ctx, 'بوت نستا', 0, 26, 76, C.mintInk); ctx.restore();
  }
  // it talks: Arabic, then English
  const k1 = sp(t, V.a5 + 0.4, SPRING.bouncy), k2 = sp(t, V.a5 + 1.3, SPRING.bouncy);
  const fade = 1 - prog(t, V.a6 - 0.3, V.a6);
  bubbleCol(ctx, PB[0] - 60, -420, 380, 110, 'أهلاً! متاح 5:00', k1 * fade, false);
  bubbleCol(ctx, PB[0] + 90, -570, 340, 110, 'Hi! Yes, 5 PM', k2 * fade, true);
  // the business's own data drops into the nest
  ['الأسعار', 'المواعيد', 'المنيو'].forEach((s, i) => {
    const t0 = V.b5 + 0.1 + i * 0.3, p = clamp((t - t0) / 0.7);
    if (p <= 0 || t > V.a6 + 0.4) return;
    const e = E.inOutCubic(p);
    const sx = PB[0] + 420 + i * 30, sy = -600 + i * 150, ex = PB[0] + 20 + (i - 1) * 60, ey = PB[1] + 40;
    const cx = lerp(sx, ex, e), cy = lerp(sy, ey, e) - Math.sin(Math.PI * e) * 120;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - e) * 0.3 * (i - 1)); ctx.scale(1 - 0.6 * e, 1 - 0.6 * e); ctx.globalAlpha = 1 - prog(p, 0.85, 1);
    ctx.fillStyle = C.cream; rrect(ctx, -120, -50, 240, 100, 16); ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 5; rrect(ctx, -110, -40, 220, 80, 10); ctx.stroke();
    tA(ctx, s, 0, 16, 50, '#3B2416'); ctx.restore();
  });
  // booking: a mint thread from the nest draws a calendar, then a sheet row
  bookings(ctx, t);
}
function customer(ctx, t, k) {
  const step = Math.sin(t * 9) * 8 * (1 - k);
  ctx.fillStyle = '#7A3E8C'; ctx.beginPath(); ctx.moveTo(-50, 170); ctx.lineTo(50, 170); ctx.lineTo(40, -130); ctx.lineTo(-40, -130); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#C98A5A'; ctx.beginPath(); ctx.arc(0, -180, 44, 0, TAU); ctx.fill();
  ctx.fillStyle = '#EDEAE2'; ctx.beginPath(); ctx.arc(0, -196, 48, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#C98A5A'; rrect(ctx, 30, -100 + step, 90, 22, 11); ctx.fill();
}
function bubbleCol(ctx, x, y, w, h, s, k, latin) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 10;
  ctx.fillStyle = C.mint; rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.moveTo(-w / 2 + 60, h / 2 - 4); ctx.lineTo(-w / 2 + 40, h / 2 + 40); ctx.lineTo(-w / 2 + 100, h / 2 - 4); ctx.fill();
  if (latin) tL(ctx, s, 0, 16, 46, C.mintInk); else tA(ctx, s, 0, 16, 46, C.mintInk, { face: UI });
  ctx.restore();
}
function bookings(ctx, t) {
  const p = E.inOutSine(clamp((t - (V.a6 - 0.2)) / 0.8));
  if (p <= 0) return;
  const start = [PB[0] + 40, PB[1] - 20], cal = [430, -560], sheet = [450, -250];
  ctx.save(); ctx.strokeStyle = C.mint; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); for (let k = 0; k <= 40 * p; k++) { const s = k / 40, xx = lerp(start[0], cal[0] - 180, s), yy = lerp(start[1], cal[1] + 40, s) + Math.sin(s * 9) * 40; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.restore();
  const kc = sp(t, V.a6 + 0.35, SPRING.bouncy);
  if (kc > 0.01) {
    ctx.save(); ctx.translate(...cal); ctx.rotate(-0.05); ctx.scale(kc, kc);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 12;
    ctx.fillStyle = C.cream; rrect(ctx, -180, -150, 360, 300, 22); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#B3262B'; ctx.beginPath(); ctx.roundRect(-180, -150, 360, 70, [22, 22, 0, 0]); ctx.fill();
    tA(ctx, 'المواعيد', 0, -100, 44, C.cream);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const on = r === 1 && c === 1; ctx.fillStyle = on ? C.mint : '#E7D6B4'; rrect(ctx, 105 - c * 70 - 25, -55 + r * 66, 50, 50, 10); ctx.fill(); if (on) check(ctx, 105 - c * 70, -30 + r * 66, 28, C.mintInk, 6); }
    ctx.restore();
  }
  const ks = sp(t, V.b6 + 0.2, SPRING.bouncy);
  if (ks > 0.01) {
    ctx.save(); ctx.translate(...sheet); ctx.rotate(0.04); ctx.scale(ks, ks);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 12;
    ctx.fillStyle = C.cream; rrect(ctx, -230, -70, 460, 140, 18); ctx.fill(); ctx.shadowColor = 'transparent';
    const rk = prog(t, V.b6 + 0.3, V.b6 + 0.9);
    ['منى', 'الأربعاء 5:00', 'مؤكد'].forEach((s, i) => { if (rk > i / 3) tA(ctx, s, 170 - i * 165, 14, 40, i === 2 ? '#0B5C42' : '#3B2416', { face: UI }); });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- finale: curtains close, the sign drops on ropes
function finale(ctx, t, IMG) {
  const k = sp(t, V.a8 + 0.5, { stiffness: 120, damping: 9, mass: 1 });
  if (t < V.a8 + 0.45) return;
  const sy = lerp(-2400, -760, Math.min(1.08, k));
  const sw = Math.sin((t - V.a8 - 0.5) * 4) * 0.05 * Math.exp(-(t - V.a8 - 0.5) * 1.6);
  // spotlight pool on the curtain
  const sp0 = clamp((t - V.a8 - 0.3) / 0.4);
  const pool = ctx.createRadialGradient(0, -420, 50, 0, -400, 900); pool.addColorStop(0, `rgba(255,226,163,${0.35 * sp0})`); pool.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pool; ctx.fillRect(-1500, -1500, 3000, 2900);
  ctx.save(); ctx.translate(0, sy); ctx.rotate(sw);
  // ropes
  ctx.strokeStyle = C.gold; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-330, -900); ctx.lineTo(-330, -160); ctx.moveTo(330, -900); ctx.lineTo(330, -160); ctx.stroke();
  // sign: carved wood frame around the navy logo plate
  const w = 860, h = 330;
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 20;
  ctx.fillStyle = C.wood; rrect(ctx, -w / 2 - 34, -h / 2 - 34, w + 68, h + 68, 26); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = C.gold; ctx.lineWidth = 6; rrect(ctx, -w / 2 - 18, -h / 2 - 18, w + 36, h + 36, 18); ctx.stroke();
  ctx.fillStyle = C.navy; ctx.fillRect(-w / 2, -h / 2, w, h);
  if (IMG.name) ctx.drawImage(IMG.name, 300, 540, 1790, 690, -w / 2 + 20, -h / 2 + 7, w - 40, (w - 40) * 690 / 1790);
  const shine = ((t - V.a8 - 1.2) * 0.4) % 1.5 - 0.25;
  if (t > V.a8 + 1.2) { const g = ctx.createLinearGradient(-w / 2 + shine * w - 100, 0, -w / 2 + shine * w + 100, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h); }
  ctx.restore();
  // gold embroidered CTA on the curtain
  const ck = (t0) => clamp((t - t0) / 0.35);
  const g1 = ck(V.a8 + 0.9), g2 = ck(V.a8 + 1.4), g3 = ck(V.b8 + 0.1);
  if (g1 > 0) { ctx.save(); ctx.globalAlpha = g1; tA(ctx, 'ابعت «ديمو» على واتساب'.replace('«', '').replace('»', ''), 0, -250 + (1 - g1) * 30, 96, C.gold); ctx.restore(); }
  if (g2 > 0) {
    ctx.save(); ctx.globalAlpha = g2; ctx.translate(0, -60 + (1 - g2) * 30);
    ctx.fillStyle = C.mint; rrect(ctx, -380, -80, 760, 160, 80); ctx.fill();
    tL(ctx, '010 9311 4446', -95, 22, 60, C.mintInk); tA(ctx, 'واتساب', 335, 20, 44, C.mintInk, { face: UI, align: 'right' });
    ctx.fillStyle = 'rgba(6,40,28,0.3)'; ctx.fillRect(160, -46, 3, 92); ctx.restore();
    if (t > 29.4) for (let r = 0; r < 2; r++) { const ph = ((t - 29.4) * 0.7 + r * 0.5) % 1; ctx.save(); ctx.strokeStyle = `rgba(226,176,74,${0.6 * (1 - ph)})`; ctx.lineWidth = 5; rrect(ctx, -380 - ph * 50, -140 - ph * 50, 760 + ph * 100, 160 + ph * 100, 120); ctx.stroke(); ctx.restore(); }
  }
  if (g3 > 0) { ctx.save(); ctx.globalAlpha = g3; tA(ctx, 'واسأله اللي إنت عايزه!', 0, 140 + (1 - g3) * 30, 80, C.cream); ctx.restore(); }
}

// ---------------------------------------------------------------- frame
function draw(ctx, t, IMG) {
  const cam = camera(t), L = lamp(t);
  ctx.fillStyle = C.room; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H * 0.47); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  if (t >= V.a4) backstage(ctx, t, IMG);
  screen(ctx, t, L);
  // curtains: start 55% open and sweep open on frame 0; close for the finale
  const open = t < V.a8 ? lerp(0.55, 1, E.outCubic(prog(t, 0, 0.6))) : lerp(1, 0, E.inOutCubic(prog(t, V.a8 - 0.2, V.a8 + 0.45)));
  // curtains sit closer to the lens: a touch of parallax
  ctx.save(); ctx.translate(cam.x * 0.12, 0); curtains(ctx, open, t); ctx.restore();
  finale(ctx, t, IMG);
  ctx.restore();
  // the reveal: one warm flash as the screen flies up
  const fl = 1 - prog(t, V.a4, V.a4 + 0.3); if (t > V.a4 && fl > 0) { ctx.fillStyle = `rgba(255,226,163,${0.35 * fl})`; ctx.fillRect(0, 0, W, H); }
}

M.film({
  fonts: [font(100, 700, D), font(40, 700, UI), font(40, 600, UI)],
  images: { name: 'assets/logo_name.jpg', only: 'assets/logo_only.jpg' },
  hits: HITS,
  samples: 6,
  init(ctx) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 512); const r = M.mulberry32(9);
    for (let i = 0; i < 1400; i++) { x.strokeStyle = `rgba(120,80,40,${0.05 + 0.08 * r()})`; x.lineWidth = 1 + r() * 1.5; const px = r() * 512, py = r() * 512, a = r() * TAU, L = 6 + r() * 26; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); }
    for (let i = 0; i < 40; i++) { const g = x.createRadialGradient(r() * 512, r() * 512, 0, r() * 512, r() * 512, 40 + r() * 90); g.addColorStop(0, 'rgba(150,100,50,0.08)'); g.addColorStop(1, 'rgba(150,100,50,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512); }
    PAPER = ctx.createPattern(c, 'repeat');
  },
  draw(ctx, u, t, IMG) { draw(ctx, t, IMG); },
  post(ctx, u, t) {
    const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.28, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
});
