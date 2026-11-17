// اربط الحزام — Nesta ad 4. Pure function of time: window.seek(t) paints frame t.
// A miniature town in 2.5-D isometric, shot like a tilt-shift model. A toy train carries the
// customer's message through the stations; the camera rides one continuous world behind it.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, wobble, font, rrect, hash01, noise1, mix, TAU } = M;
const D = 'Display', UI = 'UI';
const B = (t) => t / 0.499983;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);

const C = {
  grass: '#86C96E', grass2: '#74B85E', path: '#EFE2C6', ballast: '#B9AE9C', sleeper: '#7A5638', rail: '#D9DEE3',
  ink: '#2B2F3A', cream: '#FFF6E6', coral: '#FF8A65', yellow: '#FFD166', teal: '#4ECDC4', navy: '#13284A', mint: '#41ECAE',
  mintInk: '#06402C', red: '#E4572E', roof: '#C8553D', stone: '#D9D3C7', wood: '#B98552', water: '#7CC6E8',
};
// VO (film seconds)
const V = {
  hookA: 0.35, hookB: 1.46, s1L: 3.64, s1T: 4.5, s2L: 7.08, s2D: 7.94, s2list: 8.74, s2no: 11.03, s3L: 12.37, s3T: 13.38, s3P: 15.61,
  s4L: 17.11, s4S: 18.11, s4M: 19.55, s5L: 21.01, s5R: 22.44, s5P: 23.78, all: 25.84, btn: 26.57, cta: 28.5, cta2: 30.08,
};

// ---------------------------------------------------------------- isometric projection
const CI = Math.cos(Math.PI / 6), SI = 0.5;
const iso = (x, y, z = 0) => [(x - y) * CI, (x + y) * SI - z];
function poly(ctx, pts, fill) { ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = iso(...p); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
function faceGrad(ctx, p0, p1, c0, c1) { const [x0, y0] = iso(...p0), [x1, y1] = iso(...p1); const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
const shade = (hex, k) => mix(hex, k > 0 ? '#FFFFFF' : '#1B1A2A', Math.abs(k));
// a box with lit top, mid left face (+y side), dark right face (+x side), soft AO at the foot
function box(ctx, x, y, z, w, d, h, col, { top, left, right, ao = true } = {}) {
  const T = top || shade(col, 0.18), L = left || col, R = right || shade(col, -0.22);
  // +y face (lower-left on screen)
  poly(ctx, [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], faceGrad(ctx, [x, y + d, z + h], [x, y + d, z], shade(L, 0.06), shade(L, -0.08)));
  // +x face (lower-right)
  poly(ctx, [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], faceGrad(ctx, [x + w, y, z + h], [x + w, y, z], shade(R, 0.04), shade(R, -0.1)));
  poly(ctx, [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], T);
  // crisp highlight on the top front edges
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath();
  let p = iso(x, y + d, z + h); ctx.moveTo(p[0], p[1]); p = iso(x + w, y + d, z + h); ctx.lineTo(p[0], p[1]); p = iso(x + w, y, z + h); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.restore();
}
// contact shadow: soft blob on the ground, pushed away from the sun (top-left)
function groundShadow(ctx, x, y, w, d, s = 1) {
  const [cx, cy] = iso(x + w / 2 + 18 * s, y + d / 2 + 18 * s, 0);
  const r = Math.max(w, d) * 0.75 * s;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.55);
  const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r); g.addColorStop(0, 'rgba(30,40,20,0.32)'); g.addColorStop(1, 'rgba(30,40,20,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore();
}
// draw in the plane of a +y facing wall (x runs along the wall, v runs down): text, images, windows
function onWallY(ctx, x, y, z, fn) { const [X, Y] = iso(x, y, z); ctx.save(); ctx.transform(CI, SI, 0, 1, X, Y); fn(); ctx.restore(); }
function onWallX(ctx, x, y, z, fn) { const [X, Y] = iso(x, y, z); ctx.save(); ctx.transform(-CI, SI, 0, 1, X, Y); fn(); ctx.restore(); }
function onGround(ctx, x, y, fn) { const [X, Y] = iso(x, y, 0); ctx.save(); ctx.transform(CI, SI, -CI, SI, X, Y); fn(); ctx.restore(); }
function tA(ctx, s, x, y, size, color, { face = D, weight = 800, align = 'center' } = {}) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function tL(ctx, s, x, y, size, color, align = 'center', face = UI) {
  ctx.save(); ctx.font = font(size, 700, face); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function check(ctx, x, y, s, col, w = 8) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.4); ctx.stroke(); ctx.restore(); }

// ---------------------------------------------------------------- the train's journey
const ST = { s0: 0, s1: 800, s2: 1550, s3: 2300, s4: 3050, s5: 3900 };
const TRAINK = [[0, 0], [V.hookB, 0], [3.5, ST.s1], [7.0, ST.s1], [7.85, ST.s2], [12.25, ST.s2], [13.15, ST.s3], [16.95, ST.s3], [17.85, ST.s4], [20.8, ST.s4], [22.3, ST.s5]];
function trainX(t) {
  let i = 0; while (i < TRAINK.length - 1 && t >= TRAINK[i + 1][0]) i++;
  if (i >= TRAINK.length - 1) return TRAINK[i][1];
  const [t0, a] = TRAINK[i], [t1, b] = TRAINK[i + 1]; if (a === b) return a;
  const p = clamp((t - t0) / (t1 - t0));
  return lerp(a, b, i === 1 ? E.inOutQuart ? E.inOutQuart(p) : E.inOutCubic(p) : E.inOutCubic(p));
}
const moving = (t) => Math.abs(trainX(t + 0.02) - trainX(t - 0.02)) > 1;

// ---------------------------------------------------------------- camera
const CAMK = [
  [0, 40, 0, 40, 1.75], [V.hookB, 40, 0, 40, 1.6], [3.5, ST.s1 - 40, -240, 60, 1.3], [7.0, ST.s1 - 40, -240, 60, 1.34], [7.85, ST.s2 - 40, -240, 60, 1.3],
  [12.25, ST.s2 - 40, -240, 60, 1.34], [13.15, ST.s3 - 40, -240, 60, 1.3], [16.95, ST.s3 - 40, -240, 60, 1.34], [17.85, ST.s4 - 20, -240, 60, 1.27],
  [20.8, ST.s4 - 20, -240, 60, 1.3], [22.3, ST.s5 - 40, -250, 80, 1.3], [25.6, ST.s5 - 40, -250, 80, 1.34], [26.5, 4330, 300, 40, 1.45], [28.3, 4330, 300, 40, 1.5],
  [29.4, 5060, -140, 170, 1.12], [34, 5060, -140, 170, 1.15],
];
function camera(t) {
  let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1][0]) i++;
  const [t0, x0, y0, z0, k0] = CAMK[i], [t1, x1, y1, z1, k1] = CAMK[i + 1];
  const p = clamp((t - t0) / (t1 - t0)), e = E.inOutCubic(p);
  // during train runs the camera is pulled by the train itself (slight lag), not by its own easing
  return { x: lerp(x0, x1, e), y: lerp(y0, y1, e), z: lerp(z0, z1, e), k: lerp(k0, k1, e) * (1 - 0.08 * Math.sin(Math.PI * p) * (Math.abs(x1 - x0) > 300 ? 1 : 0)) };
}

// ---------------------------------------------------------------- scenery (seeded)
const TREES = [];
for (let i = 0; i < 140; i++) {
  const x = -700 + hash01(i, 1) * 6200, side = hash01(i, 2) < 0.5 ? -1 : 1;
  const y = side * (160 + hash01(i, 3) * 900);
  const near = [0, 800, 1550, 2300, 3050, 3900, 4830].some((s) => Math.abs(x - s) < 260 && y < 0 && y > -560) || (Math.abs(x - 4330) < 260 && Math.abs(y - 330) < 260) || (Math.abs(x - 3220) < 120 && Math.abs(y + 120) < 120);
  if (!near) TREES.push({ x, y, s: 0.7 + 0.6 * hash01(i, 4), kind: hash01(i, 5) < 0.75 ? 'round' : 'pine', hue: hash01(i, 6) });
}
const FLOWERS = Array.from({ length: 220 }, (_, i) => ({ x: -700 + hash01(i, 11) * 6200, y: (hash01(i, 12) < 0.5 ? -1 : 1) * (70 + hash01(i, 13) * 900), c: [C.coral, C.yellow, '#FFFFFF', '#F49AC2'][i % 4] }));
function tree(ctx, tr, t) {
  const { x, y, s } = tr;
  groundShadow(ctx, x - 20 * s, y - 20 * s, 60 * s, 60 * s, 1.2);
  const [X, Y] = iso(x, y, 0);
  ctx.fillStyle = '#7B5234'; ctx.fillRect(X - 5 * s, Y - 34 * s, 10 * s, 34 * s);
  const sway = Math.sin(t * 1.4 + x * 0.01) * 2 * s;
  const g1 = mix('#4E9A4A', '#6DB357', tr.hue), g2 = mix('#7CC46A', '#A3D97A', tr.hue);
  if (tr.kind === 'round') {
    for (const [dx, dy, r] of [[-14, -46, 30], [14, -50, 28], [0, -70, 32]]) {
      const cx = X + dx * s + sway, cy = Y + dy * s, rr = r * s;
      const g = ctx.createRadialGradient(cx - rr * 0.35, cy - rr * 0.4, rr * 0.1, cx, cy, rr); g.addColorStop(0, g2); g.addColorStop(1, g1);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.fill();
    }
  } else {
    for (let k = 0; k < 3; k++) { const cy = Y - (40 + k * 26) * s, w = (38 - k * 9) * s; const g = ctx.createLinearGradient(X - w, 0, X + w, 0); g.addColorStop(0, g2); g.addColorStop(1, g1); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X - w + sway, cy + 18 * s); ctx.lineTo(X + w + sway, cy + 18 * s); ctx.lineTo(X + sway, cy - 30 * s); ctx.closePath(); ctx.fill(); }
  }
}

// ---------------------------------------------------------------- ground, track, clouds
let GRASS = null;
function ground(ctx, cam, t) {
  // big grass plane in world space (textured), sand paths, the track
  ctx.save(); ctx.fillStyle = GRASS || C.grass;
  const [X, Y] = iso(cam.x, cam.y, 0); ctx.fillRect(X - 3000, Y - 3000, 6000, 6000); ctx.restore();
  // pond near the café
  onGround(ctx, 4560, 520, () => { const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 200); g.addColorStop(0, '#A6DCF2'); g.addColorStop(1, '#5DB2DA'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 210, 150, 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { const r = ((t * 30 + i * 60) % 180); ctx.globalAlpha = 1 - r / 180; ctx.beginPath(); ctx.ellipse(40, -20, r, r * 0.7, 0.3, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1; });
  // sand paths from the platform to each station door
  for (const s of [800, 1550, 2300, 3050, 3900, 4830]) poly(ctx, [[s - 40, -110, 0], [s + 40, -110, 0], [s + 40, -200, 0], [s - 40, -200, 0]], C.path);
  poly(ctx, [[4250, 50, 0], [4330, 50, 0], [4330, 220, 0], [4250, 220, 0]], C.path);
  // ballast bed
  poly(ctx, [[-1200, -48, 0], [6000, -48, 0], [6000, 48, 0], [-1200, 48, 0]], C.ballast);
  poly(ctx, [[-1200, 48, 0], [6000, 48, 0], [6000, 56, -6], [-1200, 56, -6]], '#958B79');
  // sleepers
  const x0 = Math.floor((cam.x - 1600) / 34) * 34;
  for (let x = x0; x < cam.x + 1600; x += 34) poly(ctx, [[x, -36, 1], [x + 14, -36, 1], [x + 14, 36, 1], [x, 36, 1]], C.sleeper);
  // rails (with a bright top line)
  for (const ry of [-22, 22]) {
    ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = '#8E969E'; ctx.beginPath(); let p = iso(cam.x - 1600, ry, 4); ctx.moveTo(...p); p = iso(cam.x + 1600, ry, 4); ctx.lineTo(...p); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#F4F7FA'; ctx.beginPath(); p = iso(cam.x - 1600, ry, 6); ctx.moveTo(...p); p = iso(cam.x + 1600, ry, 6); ctx.lineTo(...p); ctx.stroke(); ctx.restore();
  }
  // flowers
  for (const f of FLOWERS) { if (Math.abs(f.x - cam.x) > 1400) continue; const [fx, fy] = iso(f.x, f.y, 0); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(fx, fy, 4, 0, TAU); ctx.fill(); }
}
function cloudShadows(ctx, cam, t) {
  for (let i = 0; i < 6; i++) {
    const x = cam.x - 1500 + ((hash01(i, 21) * 3000 + t * 60) % 3000), y = -800 + hash01(i, 22) * 1600;
    onGround(ctx, x, y, () => { const g = ctx.createRadialGradient(0, 0, 40, 0, 0, 380); g.addColorStop(0, 'rgba(20,40,60,0.07)'); g.addColorStop(1, 'rgba(20,40,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 420, 260, 0.4, 0, TAU); ctx.fill(); });
  }
}

// ---------------------------------------------------------------- station furniture
function platform(ctx, x) {
  box(ctx, x - 230, -120, 0, 460, 70, 18, '#E8DCC8', { top: '#F4EBDC' });
  for (const lx of [x - 180, x + 180]) { box(ctx, lx, -112, 18, 6, 6, 110, '#3A3F4A'); const [X, Y] = iso(lx + 3, -109, 132); const g = ctx.createRadialGradient(X, Y, 2, X, Y, 26); g.addColorStop(0, 'rgba(255,240,200,0.95)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, 26, 0, TAU); ctx.fill(); }
}
// station board on two posts, pops up out of the ground when the train arrives
function stationSign(ctx, x, num, name, t, t0, { col = C.navy } = {}) {
  const k = sp(t, t0, SPRING.bouncy); if (k <= 0.01) return;
  const h = 10 * Math.min(1.05, k) + 10, y = 100;
  box(ctx, x + 40, y, 0, 8, 8, h + 30, '#4A4F5A'); box(ctx, x + 360, y, 0, 8, 8, h + 30, '#4A4F5A');
  const z = h + 30;
  const bh = 140 * Math.min(1.06, k);
  box(ctx, x + 10, y - 6, z, 380, 10, bh, col, { top: shade(col, 0.3) });
  onWallY(ctx, x + 10, y + 4, z + bh, () => { ctx.scale(1, Math.min(1, k));
    ctx.fillStyle = C.mint; ctx.fillRect(0, 0, 380, 12);
    tA(ctx, name, 170, 98, 56, '#FFFFFF');
    ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(345, 46, 28, 0, TAU); ctx.fill(); tL(ctx, String(num), 345, 59, 34, col, 'center', D);
  });
}
function chip(ctx, x, y, z, text, t, t0, { bg = '#FFFFFF', fg = C.ink, size = 40, icon = null, out = 1e9 } = {}) {
  const k = sp(t, t0, SPRING.bouncy) * (1 - clamp((t - out) / 0.25)); if (k <= 0.01) return;
  const [X, Y] = iso(x, y, z + 10 * Math.sin(t * 2.5));
  ctx.save(); ctx.translate(X, Y); ctx.scale(k, k);
  ctx.font = font(size, 800, D); const w = ctx.measureText(text).width + size * 1.4 + (icon ? size : 0), h = size * 1.7;
  ctx.fillStyle = 'rgba(30,40,30,0.25)'; rrect(ctx, -w / 2 + 4, -h + 10, w, h, h / 2); ctx.fill();
  ctx.fillStyle = bg; rrect(ctx, -w / 2, -h, w, h, h / 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.lineTo(0, 18); ctx.fill();
  tA(ctx, text, icon ? -size * 0.4 : 0, -h / 2 + size * 0.38, size, fg);
  if (icon === 'check') check(ctx, w / 2 - size * 0.9, -h / 2, size * 0.7, fg, 6);
  ctx.restore();
}

// ---------------------------------------------------------------- the train
function train(ctx, t) {
  const x = trainX(t), y = -32, belt = E.outBack(prog(t, V.hookA + 0.15, V.hookA + 0.45), 2);
  const mv = moving(t), bounce = mv ? Math.sin(t * 40) * 1.5 : 0;
  // wagon (behind the loco, toward -x)
  groundShadow(ctx, x - 300, y, 260, 64, 0.9);
  box(ctx, x - 300, y + 4, 10, 230, 56, 14, '#2E323C');
  box(ctx, x - 296, y + 6, 24 + bounce, 222, 52, 40, C.cream, { top: '#FFFFFF', right: '#E3D6C0' });
  onWallY(ctx, x - 296, y + 58, 64 + bounce, () => { ctx.fillStyle = C.mint; ctx.fillRect(0, 14, 222, 8); });
  // cargo: the message (envelope with a mint bubble), seat-belted
  const env = t < 13.6 || t > 1e9;
  if (env) {
    const ex = x - 250, ez = 64 + bounce;
    box(ctx, ex, y + 10, ez, 120, 40, 62, '#FFFFFF', { top: '#FFFFFF', right: '#E9EDF0', left: '#F7F9FA' });
    onWallY(ctx, ex, y + 50, ez + 62, () => { ctx.strokeStyle = '#C9D2D8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(60, 34); ctx.lineTo(116, 4); ctx.stroke(); ctx.fillStyle = C.mint; ctx.beginPath(); ctx.ellipse(60, 38, 16, 12, 0, 0, TAU); ctx.fill(); });
    if (belt > 0.01) onWallY(ctx, ex - 4, y + 52, ez + 62, () => { ctx.save(); ctx.globalAlpha = clamp(belt); ctx.fillStyle = '#2B2F3A'; ctx.save(); ctx.translate(64, 30); ctx.rotate(-0.5); ctx.fillRect(-70 * belt, -6, 140 * belt, 12); ctx.fillStyle = C.yellow; ctx.fillRect(-10, -9, 20, 18); ctx.restore(); ctx.restore(); });
  }
  // crates picked up at station 2 ride along
  CRATES.forEach((c, i) => { const p = crateP(t, i); if (p >= 1 && t < 13.5) crate(ctx, x - 120 + (i % 2) * 0, y + 12, 64 + bounce + i * 0, c, i, x); });
  // locomotive
  groundShadow(ctx, x - 50, y, 230, 64, 1);
  box(ctx, x - 52, y + 2, 10, 220, 60, 16, '#22262E');
  box(ctx, x - 50, y + 6, 26 + bounce, 70, 52, 96, C.red, { top: shade(C.red, 0.25) });          // cab
  box(ctx, x - 56, y, 122 + bounce, 82, 64, 10, '#22262E');                                   // cab roof
  box(ctx, x + 20, y + 10, 26 + bounce, 140, 44, 50, C.red, { top: shade(C.red, 0.3) });         // boiler
  onWallY(ctx, x + 20, y + 54, 76 + bounce, () => { for (let k = 0; k < 3; k++) { ctx.fillStyle = '#F2C14E'; ctx.fillRect(20 + k * 42, 0, 6, 50); } });
  onWallY(ctx, x - 50, y + 58, 122 + bounce, () => { ctx.fillStyle = '#BFE9F7'; rrect(ctx, 12, 14, 46, 34, 6); ctx.fill(); });
  box(ctx, x + 120, y + 22, 76 + bounce, 22, 22, 46, '#22262E');                              // chimney
  box(ctx, x + 114, y + 16, 118 + bounce, 34, 34, 8, '#22262E');
  // front lamp
  const [lx, ly] = iso(x + 162, y + 32, 60 + bounce); const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 40); lg.addColorStop(0, 'rgba(255,245,200,1)'); lg.addColorStop(1, 'rgba(255,245,200,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, 40, 0, TAU); ctx.fill();
  // wheels with turning spokes
  const rot = x * 0.05;
  for (const wx of [x - 270, x - 120, x - 20, x + 70, x + 130]) onWallY(ctx, wx, y + 62, 34, () => { ctx.fillStyle = '#1B1E24'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill(); ctx.strokeStyle = '#C9CED6'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { const a = rot + k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * -18, Math.sin(a) * -18); ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.stroke(); } });
}
function steam(ctx, t) {
  // puffs spawn from the chimney every 0.11 s; faster and denser while moving
  for (let k = 0; k < 18; k++) {
    const ts = Math.floor(t / 0.11) * 0.11 - k * 0.11; if (ts < -0.5) continue;
    const age = t - ts, life = 1.6; if (age > life) continue;
    const x = trainX(ts) + 130, mv = moving(ts);
    const f = age / life;
    const px = x - (mv ? 0 : 0) - age * (mv ? 30 : 10), pz = 130 + age * 120;
    const [X, Y] = iso(px, -20 - age * 20, pz);
    const r = 14 + f * 46;
    ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - f)})`; ctx.beginPath(); ctx.arc(X + Math.sin(ts * 7) * 6, Y, r, 0, TAU); ctx.fill();
  }
}

// ---------------------------------------------------------------- stations
function nestaTower(ctx, t) {
  const x = ST.s1 - 120, y = -420;
  groundShadow(ctx, x, y, 240, 240, 1.3);
  box(ctx, x, y, 0, 240, 240, 150, C.cream, { right: '#E9DCC4' });
  onWallY(ctx, x, y + 240, 150, () => { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#BFE3F2'; rrect(ctx, 24 + i * 72, 34, 46, 56, 8); ctx.fill(); } ctx.fillStyle = C.navy; rrect(ctx, 96, 92, 50, 58, 6); ctx.fill(); });
  box(ctx, x + 40, y + 40, 150, 160, 160, 200, C.navy, { top: shade(C.navy, 0.3) });
  onWallY(ctx, x + 40, y + 200, 350, () => { ctx.fillStyle = 'rgba(65,236,174,0.9)'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { rrect(ctx, 20 + i * 46, 30 + j * 70, 28, 44, 6); ctx.fill(); } });
  // the nest + bubble on the roof: the logo, alive
  const [X, Y] = iso(x + 120, y + 120, 350);
  const read = clamp((t - (V.s1T + 0.2)) / 0.4) * (1 - clamp((t - 7.4) / 0.4));
  const glow = ctx.createRadialGradient(X, Y - 70, 10, X, Y - 70, 180 + 60 * read); glow.addColorStop(0, `rgba(65,236,174,${0.35 + 0.35 * read})`); glow.addColorStop(1, 'rgba(65,236,174,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(X, Y - 70, 240, 0, TAU); ctx.fill();
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) { ctx.strokeStyle = i % 3 ? '#F2F0EA' : '#D6D2C8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(X, Y - 8 + (hash01(i, 8) - 0.5) * 16, 70 + 16 * hash01(i, 9), 22, (hash01(i, 10) - 0.5) * 0.4, 0.2, Math.PI - 0.2); ctx.stroke(); }
  for (let i = 0; i < 6; i++) { ctx.fillStyle = C.mint; ctx.beginPath(); ctx.arc(X + (i < 3 ? -1 : 1) * (60 + (i % 3) * 14), Y - 2 + (i % 3) * 10, 7, 0, TAU); ctx.fill(); }
  const bob = Math.sin(t * 2.6) * 6 + 18 * wobble(t - V.s1T - 0.2, 3, 5);
  ctx.save(); ctx.translate(X, Y - 78 + bob); const s = 1 + 0.12 * read;
  ctx.scale(s, s); ctx.fillStyle = C.mint; ctx.beginPath(); ctx.ellipse(0, 0, 58, 46, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-22, 30); ctx.lineTo(-36, 62); ctx.lineTo(4, 40); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-20, -18, 16, 8, -0.5, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = C.mintInk; ctx.globalAlpha = read > 0 ? 0.4 + 0.6 * Math.max(0, Math.sin(t * 9 - i)) : 0.35; ctx.beginPath(); ctx.arc(-18 + i * 18, 2, 6, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.restore();
  // the message flies from the wagon into the tower and is read
  const p = clamp((t - V.s1T) / 0.6);
  if (p > 0 && p < 1) { const e = E.inOutCubic(p); const sx = ST.s1 - 190, ex = x + 120; const [fx, fy] = iso(lerp(sx, ex, e), lerp(-10, y + 120, e), lerp(100, 330, e) + Math.sin(Math.PI * e) * 160); ctx.save(); ctx.translate(fx, fy); ctx.rotate(e * 2); ctx.fillStyle = '#FFFFFF'; rrect(ctx, -26, -18, 52, 36, 6); ctx.fill(); ctx.fillStyle = C.mint; ctx.beginPath(); ctx.arc(0, 2, 8, 0, TAU); ctx.fill(); ctx.restore(); }
}
const CRATES = ['الأسعار', 'المواعيد', 'المنيو'];
const crateP = (t, i) => clamp((t - (V.s2list + i * 0.72)) / 0.6);
function crate(ctx, x, y, z, label, i, trainXNow) {
  const cx = x + i * 56 - 60, cz = z;
  box(ctx, cx, y, cz, 52, 40, 44, C.wood, { top: '#D8A86F', right: '#9A6C3E' });
  onWallY(ctx, cx, y + 40, cz + 44, () => { ctx.fillStyle = '#FFF4DC'; rrect(ctx, 3, 10, 46, 22, 4); ctx.fill(); tA(ctx, label, 26, 27, 14, '#5A3A22'); });
}
function warehouse(ctx, t) {
  const x = ST.s2 - 200, y = -440;
  groundShadow(ctx, x, y, 380, 260, 1.2);
  box(ctx, x, y, 0, 380, 260, 150, C.coral, { top: shade(C.coral, 0.2) });
  // gabled roof
  const rh = 80, z = 150;
  poly(ctx, [[x - 10, y + 270, z], [x + 390, y + 270, z], [x + 390, y + 130, z + rh], [x - 10, y + 130, z + rh]], shade(C.roof, 0.05));
  poly(ctx, [[x + 390, y - 10, z], [x + 390, y + 270, z], [x + 390, y + 130, z + rh]], shade(C.coral, -0.15));
  onWallY(ctx, x, y + 260, 150, () => { ctx.fillStyle = '#7A3A2A'; rrect(ctx, 150, 50, 90, 100, 8); ctx.fill(); for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(150, 56 + k * 16, 90, 3); } ctx.fillStyle = '#FFF4DC'; rrect(ctx, 40, 24, 300, 40, 10); ctx.fill(); tA(ctx, 'مخزن بياناتك', 190, 54, 30, '#7A3A2A'); });
  // conveyor from the door to the platform
  box(ctx, ST.s2 - 70, -220, 0, 60, 100, 40, '#5A606B', { top: '#7D8590' });
  // crates sliding out to the wagon
  CRATES.forEach((c, i) => { const p = crateP(t, i); if (p <= 0 || p >= 1) return; const e = E.inOutCubic(p); const cx = lerp(ST.s2 - 60, trainX(t) - 120 + i * 56 - 60, e), cy = lerp(-200, -20, e), cz = lerp(40, 64, e) + Math.sin(Math.PI * e) * 60; box(ctx, cx, cy, cz, 52, 40, 44, C.wood, { top: '#D8A86F', right: '#9A6C3E' }); onWallY(ctx, cx, cy + 40, cz + 44, () => { ctx.fillStyle = '#FFF4DC'; rrect(ctx, 3, 10, 46, 22, 4); ctx.fill(); tA(ctx, c, 26, 27, 14, '#5A3A22'); }); });
}
function vault(ctx, t) {
  const x = ST.s3 - 170, y = -430;
  groundShadow(ctx, x, y, 320, 250, 1.2);
  box(ctx, x, y, 0, 320, 250, 200, C.stone, { top: '#EEE9DF' });
  box(ctx, x - 14, y - 14, 200, 348, 278, 22, '#BFB7A8');
  onWallY(ctx, x, y + 250, 200, () => {
    for (let i = 0; i < 4; i++) { const g = ctx.createLinearGradient(30 + i * 80, 0, 50 + i * 80, 0); g.addColorStop(0, '#F3EFE7'); g.addColorStop(1, '#C9C1B1'); ctx.fillStyle = g; ctx.fillRect(26 + i * 82, 20, 24, 180); }
    // round vault door
    const close = E.inOutCubic(prog(t, V.s3P - 0.4, V.s3P + 0.1));
    ctx.save(); ctx.translate(160, 116);
    ctx.fillStyle = '#3C4250'; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill();
    ctx.scale(lerp(0.15, 1, close), 1);
    const g = ctx.createRadialGradient(-14, -14, 6, 0, 0, 58); g.addColorStop(0, '#E6EAF0'); g.addColorStop(1, '#8F98A6'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 56, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5B6372'; ctx.lineWidth = 6; const r = close * Math.PI; for (let k = 0; k < 3; k++) { const a = r + k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * -34, Math.sin(a) * -34); ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 34); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = C.navy; rrect(ctx, 70, -2, 180, 30, 8); ctx.fill(); tA(ctx, 'قاعدة بياناتك', 160, 21, 22, '#FFFFFF');
  });
  // the order card flies in
  const p = clamp((t - (V.s3T + 0.3)) / 0.7);
  if (p > 0 && p < 1) { const e = E.inOutCubic(p); const [fx, fy] = iso(lerp(trainX(t) - 200, ST.s3 - 10, e), lerp(-20, y + 250, e), lerp(110, 120, e) + Math.sin(Math.PI * e) * 140); ctx.save(); ctx.translate(fx, fy); ctx.rotate(-e * 1.5); ctx.fillStyle = '#FFFFFF'; rrect(ctx, -30, -20, 60, 40, 6); ctx.fill(); ctx.fillStyle = C.coral; ctx.fillRect(-20, -8, 40, 5); ctx.fillRect(-20, 2, 28, 5); ctx.restore(); }
  // mint padlock
  const lk = sp(t, V.s3P + 0.15, SPRING.bouncy);
  if (lk > 0.01) { const [X, Y] = iso(ST.s3 - 10, y + 250, 230); ctx.save(); ctx.translate(X, Y - 30); ctx.scale(lk, lk); ctx.strokeStyle = C.mintInk; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, -24, 22, Math.PI, 0); ctx.stroke(); ctx.fillStyle = C.mint; rrect(ctx, -34, -26, 68, 56, 12); ctx.fill(); ctx.fillStyle = C.mintInk; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.fillRect(-3, 0, 6, 16); ctx.restore(); }
}
function sheetBoard(ctx, t) {
  const x = ST.s4 - 220, y = -380;
  groundShadow(ctx, x, y, 360, 40, 1.2);
  box(ctx, x + 40, y + 10, 0, 12, 12, 120, '#4A4F5A'); box(ctx, x + 300, y + 10, 0, 12, 12, 120, '#4A4F5A');
  box(ctx, x, y, 120, 360, 20, 230, '#2F6B45', { top: '#3E8A59' });
  onWallY(ctx, x, y + 20, 350, () => {
    ctx.fillStyle = '#FFFFFF'; rrect(ctx, 14, 14, 332, 202, 10); ctx.fill();
    ctx.fillStyle = '#1E8E4E'; ctx.fillRect(14, 14, 332, 34); tA(ctx, 'الشيت', 300, 40, 22, '#FFFFFF', { align: 'right' });
    const rows = [['أحمد', 'حجز', '✓'], ['منى', 'أوردر', '✓'], ['كريم', 'حجز', '✓'], ['سارة', 'استفسار', '✓']];
    rows.forEach((r, i) => {
      const k = clamp((t - (V.s4S + i * 0.28)) / 0.2); const yy = 58 + i * 38;
      ctx.fillStyle = '#E3E8E5'; ctx.fillRect(24, yy + 32, 312, 1.5);
      if (k > 0) { ctx.fillStyle = `rgba(65,236,174,${0.4 * (1 - clamp((t - V.s4S - i * 0.28 - 0.5) / 0.6))})`; ctx.fillRect(18, yy, 324, 32); ctx.globalAlpha = k; tA(ctx, r[0], 320, yy + 24, 20, C.ink, { face: UI, align: 'right' }); tA(ctx, r[1], 200, yy + 24, 20, C.ink, { face: UI }); check(ctx, 60, yy + 16, 18, '#1E8E4E', 4); ctx.globalAlpha = 1; }
    });
  });
  // mailbox + flying envelope to the owner
  const mx = ST.s4 + 170, my = -150;
  groundShadow(ctx, mx, my, 40, 40, 0.8);
  box(ctx, mx + 14, my + 14, 0, 10, 10, 70, '#4A4F5A'); box(ctx, mx, my, 70, 40, 40, 50, C.coral, { top: shade(C.coral, 0.3) });
  const p = clamp((t - (V.s4M + 0.1)) / 1.0);
  if (p > 0 && p < 1) { const e = E.inOutCubic(p); const [fx, fy] = iso(mx + 20 + e * 300, my - e * 200, 130 + Math.sin(Math.PI * e) * 220); ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.sin(e * 9) * 0.3); ctx.globalAlpha = 1 - prog(e, 0.8, 1); ctx.fillStyle = '#FFFFFF'; rrect(ctx, -30, -20, 60, 40, 6); ctx.fill(); ctx.strokeStyle = C.coral; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26, -16); ctx.lineTo(0, 4); ctx.lineTo(26, -16); ctx.stroke(); ctx.restore(); }
}
function person(ctx, x, y, z, s, t, { shirt = '#5B7FD1', phone = false, sip = 0, wave = 0 } = {}) {
  const [X, Y] = iso(x, y, z);
  ctx.save(); ctx.translate(X, Y); ctx.scale(s, s);
  ctx.fillStyle = '#33384A'; rrect(ctx, -10, -36, 9, 36, 4); ctx.fill(); rrect(ctx, 2, -36, 9, 36, 4); ctx.fill();
  const g = ctx.createLinearGradient(-16, 0, 16, 0); g.addColorStop(0, shade(shirt, 0.15)); g.addColorStop(1, shade(shirt, -0.15));
  ctx.fillStyle = g; rrect(ctx, -16, -86, 32, 54, 14); ctx.fill();
  const hg = ctx.createRadialGradient(-5, -108, 2, 0, -102, 18); hg.addColorStop(0, '#F3C9A2'); hg.addColorStop(1, '#D9A274'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, -104, 17, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3A2A20'; ctx.beginPath(); ctx.arc(0, -110, 17, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  if (phone) { ctx.save(); ctx.translate(14, -76); ctx.rotate(-0.3); ctx.fillStyle = '#1D2028'; rrect(ctx, -6, -24, 16, 26, 4); ctx.fill(); ctx.fillStyle = 'rgba(160,230,255,0.9)'; rrect(ctx, -4, -22, 12, 20, 2); ctx.fill(); ctx.restore(); }
  if (sip) { ctx.save(); ctx.translate(16, -70 - 18 * sip); ctx.fillStyle = '#FFFFFF'; rrect(ctx, -8, -12, 16, 16, 3); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function house(ctx, t) {
  const x = ST.s5 - 160, y = -430;
  groundShadow(ctx, x, y, 300, 240, 1.2);
  box(ctx, x, y, 0, 300, 240, 260, C.yellow, { top: shade(C.yellow, 0.2) });
  const z = 260;
  poly(ctx, [[x - 12, y + 252, z], [x + 312, y + 252, z], [x + 312, y + 120, z + 90], [x - 12, y + 120, z + 90]], C.roof);
  poly(ctx, [[x + 312, y - 12, z], [x + 312, y + 252, z], [x + 312, y + 120, z + 90]], shade(C.yellow, -0.2));
  onWallY(ctx, x, y + 240, 260, () => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = '#FFFFFF'; rrect(ctx, 40 + i * 150, 30 + j * 120, 74, 70, 8); ctx.fill(); ctx.fillStyle = '#9ED3EA'; rrect(ctx, 46 + i * 150, 36 + j * 120, 62, 58, 5); ctx.fill(); } ctx.fillStyle = '#8A4B2E'; rrect(ctx, 125, 180, 50, 80, 6); ctx.fill(); });
  // balcony + the customer holding the phone
  box(ctx, x + 180, y + 240, 120, 100, 60, 10, '#FFFFFF');
  person(ctx, x + 230, y + 268, 130, 1.25, t, { shirt: '#7A4FC9', phone: true });
  box(ctx, x + 180, y + 296, 130, 100, 4, 36, '#FFFFFF', { top: '#FFFFFF' });
  // the reply lands on the phone
  const rk = sp(t, V.s5R + 0.35, SPRING.bouncy);
  if (rk > 0.01) {
    const [X, Y] = iso(x + 240, y + 268, 320 + 8 * Math.sin(t * 2.4));
    ctx.save(); ctx.translate(X, Y); ctx.scale(rk, rk);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; rrect(ctx, -146, -46, 300, 96, 48); ctx.fill();
    ctx.fillStyle = C.mint; rrect(ctx, -150, -52, 300, 96, 48); ctx.fill(); ctx.beginPath(); ctx.moveTo(-40, 42); ctx.lineTo(-20, 72); ctx.lineTo(0, 42); ctx.fill();
    tA(ctx, 'أهلاً! متاح 5:00', 30, 8, 34, C.mintInk, { face: UI, weight: 700 });
    check(ctx, -110, 4, 18, C.mintInk, 4); check(ctx, -96, 4, 18, C.mintInk, 4);
    ctx.restore();
  }
}
function cafe(ctx, t) {
  const x = 4250, y = 260;
  groundShadow(ctx, x, y, 200, 160, 1.2);
  box(ctx, x, y - 120, 0, 200, 110, 150, C.teal, { top: shade(C.teal, 0.2) });
  onWallY(ctx, x - 10, y - 2, 170, () => { for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#FFFFFF' : C.coral; ctx.beginPath(); ctx.moveTo(k * 32, 0); ctx.lineTo(k * 32 + 32, 0); ctx.lineTo(k * 32 + 32, 30); ctx.arc(k * 32 + 16, 30, 16, 0, Math.PI); ctx.closePath(); ctx.fill(); } tA(ctx, 'قهوة', 112, -6, 26, '#FFFFFF'); });
  // table + the owner, feet up, sipping tea
  box(ctx, x + 60, y + 60, 0, 10, 10, 50, '#5A4030'); box(ctx, x + 20, y + 30, 50, 90, 70, 8, '#FFFFFF');
  const sipK = Math.max(0, Math.sin((t - V.all) * 2.2)) * (t > V.all ? 1 : 0);
  person(ctx, x + 150, y + 90, 0, 1.3, t, { shirt: '#2E8B57', sip: sipK });
  // steam from the cup
  for (let i = 0; i < 3; i++) { const ph = ((t * 0.8) + i / 3) % 1; const [X, Y] = iso(x + 60, y + 60, 70 + ph * 60); ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(X + Math.sin(ph * 6 + i) * 6, Y, 6 + ph * 8, 0, TAU); ctx.fill(); }
}
let LOGO = null; const POST = {};
function terminal(ctx, t) {
  const x = 4830 - 260, y = -520;
  groundShadow(ctx, x, y, 520, 300, 1.2);
  box(ctx, x, y, 0, 520, 300, 230, C.navy, { top: shade(C.navy, 0.25) });
  box(ctx, x - 10, y - 10, 230, 540, 320, 18, C.mint, { top: shade(C.mint, 0.25), right: shade(C.mint, -0.2) });
  // clock tower
  box(ctx, x + 200, y + 100, 248, 120, 120, 150, C.cream);
  onWallY(ctx, x + 200, y + 220, 398, () => { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(60, 70, 42, 0, TAU); ctx.fill(); ctx.strokeStyle = C.navy; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(60, 70); ctx.lineTo(60, 40); ctx.moveTo(60, 70); ctx.lineTo(60 + Math.cos(t) * 26, 70 + Math.sin(t) * 26); ctx.stroke(); });
  // the logo plate on the facade
  onWallY(ctx, x, y + 300, 230, () => {
    ctx.fillStyle = '#0F1E33'; rrect(ctx, 24, 18, 472, 150, 14); ctx.fill();
    if (LOGO) ctx.drawImage(LOGO, 0, 0, 1640, 520, 40, 26, 440, 440 * 520 / 1640);
    ctx.fillStyle = 'rgba(65,236,174,0.85)'; for (let i = 0; i < 4; i++) { rrect(ctx, 50 + i * 112, 180, 64, 40, 6); ctx.fill(); }
  });
  // flags
  for (const fx of [x + 20, x + 500]) { box(ctx, fx, y + 300, 248, 6, 6, 110, '#E6E6E6'); const [X, Y] = iso(fx, y + 300, 350); ctx.fillStyle = C.mint; ctx.beginPath(); ctx.moveTo(X, Y); for (let k = 0; k <= 10; k++) ctx.lineTo(X + k * 6, Y + Math.sin(t * 5 + k * 0.6) * 4); ctx.lineTo(X + 60, Y + 30); for (let k = 10; k >= 0; k--) ctx.lineTo(X + k * 6, Y + 30 + Math.sin(t * 5 + k * 0.6) * 4); ctx.fill(); }
}

// ---------------------------------------------------------------- the ticket (end card, prints up out of the bottom)
function ticket(ctx, t) {
  const p = E.outBack(prog(t, V.cta + 0.4, V.cta + 1.0), 1.2); if (p <= 0) return;
  const w = 860, h = 560, x = W / 2, y = lerp(H + 400, H * 0.73, p);
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.03 + 0.01 * Math.sin(t)); ctx.scale(0.9, 0.9);
  ctx.fillStyle = 'rgba(20,30,20,0.3)'; rrect(ctx, -w / 2 + 10, -h / 2 + 20, w, h, 30); ctx.fill();
  // paper with notches
  ctx.fillStyle = '#FFF8EA'; rrect(ctx, -w / 2, -h / 2, w, h, 30); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.restore();
  ctx.fillStyle = C.navy; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, 120, [30, 30, 0, 0]); ctx.fill();
  tA(ctx, 'تذكرة رحلة', w / 2 - 40, -h / 2 + 80, 56, '#FFFFFF', { align: 'right' });
  tL(ctx, 'NESTA EXPRESS', -w / 2 + 40, -h / 2 + 76, 34, C.mint, 'left');
  ctx.setLineDash([12, 12]); ctx.strokeStyle = '#D9CDB4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-w / 2 + 30, h / 2 - 150); ctx.lineTo(w / 2 - 30, h / 2 - 150); ctx.stroke(); ctx.setLineDash([]);
  const k1 = clamp((t - V.cta - 0.8) / 0.3), k2 = clamp((t - V.cta - 1.2) / 0.3), k3 = clamp((t - V.cta2) / 0.3);
  ctx.globalAlpha = k1; tA(ctx, 'ابعت «ديمو» على واتساب'.replace('«', '').replace('»', ''), 0, -h / 2 + 210, 72, C.navy);
  ctx.globalAlpha = k2; ctx.fillStyle = C.mint; rrect(ctx, -330, -h / 2 + 250, 660, 120, 60); ctx.fill(); tL(ctx, '010 9311 4446', -60, -h / 2 + 330, 58, C.mintInk); tA(ctx, 'واتساب', 300, -h / 2 + 328, 40, C.mintInk, { face: UI, align: 'right', weight: 700 }); ctx.fillStyle = 'rgba(6,64,44,0.3)'; ctx.fillRect(135, -h / 2 + 275, 3, 70);
  ctx.globalAlpha = k3; tA(ctx, 'واركب الرحلة بنفسك!', 0, h / 2 - 60, 60, C.coral);
  ctx.globalAlpha = 1;
  // stamp
  const ks = sp(t, 30.9, SPRING.bouncy);
  if (ks > 0.01) { ctx.save(); ctx.translate(w / 2 - 120, h / 2 - 70); ctx.rotate(-0.25); ctx.scale(lerp(1.8, 1, Math.min(1, ks)), lerp(1.8, 1, Math.min(1, ks))); ctx.globalAlpha = clamp(ks * 2) * 0.85; ctx.strokeStyle = '#1E8E4E'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.stroke(); tL(ctx, 'OK', 0, 14, 40, '#1E8E4E', 'center', D); ctx.restore(); }
  ctx.restore();
}

// ---------------------------------------------------------------- hits
const HITS = [
  [B(0.0), 'steam', 'swell'], [B(V.hookA + 0.2), 'belt click', 'click'], [B(V.hookA + 0.3), 'belt', 'tok', { pitch: 'G5' }],
  [B(V.hookB - 0.3), 'launch', 'riser', { len: 0.3 }], [B(V.hookB), 'GO', 'impact'], [B(V.hookB + 0.6), 'whoosh', 'whoosh', { len: 0.6 }],
  ...[3.45, 7.8, 13.1, 17.8, 22.25].map((t) => [B(t), 'station bell', 'bell', { pitch: 'D6' }]),
  ...[V.s1L, V.s2L, V.s3L, V.s4L, V.s5L].map((t) => [B(t + 0.05), 'sign up', 'pop', { pitch: 'A5', to: 'D6' }]),
  [B(V.s1T + 0.3), 'message flies', 'whoosh', { len: 0.4 }], [B(V.s1T + 0.7), 'read', 'blip', { pitch: 'A6' }],
  ...[0, 1, 2].map((i) => [B(V.s2list + i * 0.72 + 0.55), 'crate', 'thud']),
  [B(V.s2no + 0.1), 'only your data', 'click'],
  [B(V.s3T + 0.6), 'into vault', 'whoosh', { len: 0.4 }], [B(V.s3P), 'vault shuts', 'thud'], [B(V.s3P + 0.2), 'lock', 'click'],
  [B(V.s4S), 'rows', 'type', { len: 1.1, n: 8 }], [B(V.s4M + 0.2), 'mail', 'whoosh', { len: 0.5, from: 900, to: 2600 }],
  [B(V.s5R + 0.35), 'reply', 'bell', { pitch: 'A6' }],
  [B(25.7), 'to café', 'whoosh', { len: 0.5 }], [B(V.btn + 0.3), 'sip', 'tok', { pitch: 'C5' }],
  [B(28.5), 'rise', 'whoosh', { len: 0.6, from: 500, to: 1600 }], [B(V.cta + 0.45), 'ticket prints', 'type', { len: 0.5, n: 10 }],
  [B(30.9), 'stamp', 'thud'], [B(32.5), 'whistle', 'bell', { pitch: 'G6' }],
];

// ---------------------------------------------------------------- frame
function draw(ctx, t, IMG) {
  const cam = camera(t);
  ctx.fillStyle = C.grass; ctx.fillRect(0, 0, W, H);
  ctx.save();
  const [cx, cy] = iso(cam.x, cam.y, cam.z);
  ctx.translate(W / 2, H * 0.46); ctx.scale(cam.k, cam.k); ctx.translate(-cx, -cy);
  ground(ctx, cam, t);
  // everything that stands, sorted back-to-front by x+y
  const items = [];
  for (const tr of TREES) if (Math.abs(tr.x - cam.x) < 1500) items.push([tr.x + tr.y, () => tree(ctx, tr, t)]);
  for (const s of [0, 800, 1550, 2300, 3050, 3900, 4830]) items.push([s - 120 - 80, () => platform(ctx, s)]);
  items.push([ST.s1 - 120 + -420 + 480, () => nestaTower(ctx, t)]);
  items.push([ST.s2 - 200 - 440 + 640, () => warehouse(ctx, t)]);
  items.push([ST.s3 - 170 - 430 + 570, () => vault(ctx, t)]);
  items.push([ST.s4 - 220 - 380 + 380, () => sheetBoard(ctx, t)]);
  items.push([ST.s5 - 160 - 430 + 540, () => house(ctx, t)]);
  items.push([4250 + 260, () => cafe(ctx, t)]);
  items.push([4830 - 260 - 520 + 820, () => terminal(ctx, t)]);
  items.push([trainX(t) + 40, () => { train(ctx, t); }]);
  items.push([trainX(t) + 60, () => steam(ctx, t)]);
  const signs = [[ST.s1, 1, 'بوت نستا', V.s1L], [ST.s2, 2, 'بياناتك', V.s2L], [ST.s3, 3, 'قاعدة البيانات', V.s3L], [ST.s4, 4, 'الشيت والإيميل', V.s4L], [ST.s5, 5, 'آخر محطة', V.s5L]];
  for (const [sx, n, name, t0] of signs) items.push([sx + 300 + 400 + 100, () => stationSign(ctx, sx + 300, n, name, t, t0)]);
  items.sort((a, b) => a[0] - b[0]).forEach((it) => it[1]());
  cloudShadows(ctx, cam, t);
  // floating chips (always on top)
  chip(ctx, ST.s1 - 0, -300, 520, 'فهمت', t, V.s1T + 0.9, { bg: C.mint, fg: C.mintInk, icon: 'check', out: 7.3 });
  chip(ctx, ST.s2 - 40, -300, 360, 'من بياناتك بس', t, V.s2no + 0.05, { bg: '#FFFFFF', fg: C.ink, icon: 'check', out: 12.6 });
  chip(ctx, ST.s3 - 10, -300, 420, 'محدش يشوفها غيرك', t, V.s3P + 0.3, { bg: C.navy, fg: '#FFFFFF', out: 17.3 });
  chip(ctx, ST.s4 + 330, -330, 330, 'الإيميل وصلك', t, V.s4M + 0.9, { bg: C.coral, fg: '#FFFFFF', out: 21.1 });
  chip(ctx, 4400, 330, 260, 'ولا دوست زرار', t, V.btn + 0.1, { bg: C.yellow, fg: C.ink, out: 28.7 });
  ctx.restore();
  ticket(ctx, t);
}

M.film({
  fonts: [font(100, 800, D), font(40, 700, UI)],
  images: { name: 'assets/logo_name.jpg' },
  hits: HITS,
  samples: 5,
  init(ctx, IMG) {
    // grass: soft mottling + blades (seeded) — a texture that never reads as a flat fill
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d');
    x.fillStyle = C.grass; x.fillRect(0, 0, 512, 512); const r = M.mulberry32(5);
    for (let i = 0; i < 70; i++) { const g = x.createRadialGradient(r() * 512, r() * 512, 0, r() * 512, r() * 512, 40 + r() * 100); g.addColorStop(0, r() < 0.5 ? 'rgba(115,185,95,0.18)' : 'rgba(160,215,125,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512); }
    for (let i = 0; i < 2600; i++) { x.strokeStyle = r() < 0.5 ? 'rgba(80,140,60,0.35)' : 'rgba(170,220,140,0.35)'; x.lineWidth = 1.2; const px = r() * 512, py = r() * 512; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 3, py - 4 - r() * 5); x.stroke(); }
    GRASS = ctx.createPattern(c, 'repeat');
    if (IMG.name) { const lc = document.createElement('canvas'); lc.width = 1640; lc.height = 520; lc.getContext('2d').drawImage(IMG.name, 380, 640, 1640, 520, 0, 0, 1640, 520); LOGO = lc; }
  },
  draw(ctx, u, t, IMG) { draw(ctx, t, IMG); },
  post(ctx, u, t) {
    // tilt-shift: blur grows toward the top and bottom, the middle band stays sharp
    if (!POST.a) { POST.a = document.createElement('canvas'); POST.a.width = W; POST.a.height = H; POST.b = document.createElement('canvas'); POST.b.width = W; POST.b.height = H; }
    const a = POST.a.getContext('2d'), b = POST.b.getContext('2d');
    a.clearRect(0, 0, W, H); a.filter = 'blur(9px)'; a.drawImage(ctx.canvas, 0, 0); a.filter = 'none';
    a.globalCompositeOperation = 'destination-in';
    const g = a.createLinearGradient(0, 0, 0, H);
    const end = t > V.cta + 0.4 ? 0.5 : 1;   // ease off the blur under the ticket
    g.addColorStop(0, `rgba(0,0,0,${end})`); g.addColorStop(0.24, 'rgba(0,0,0,0)'); g.addColorStop(0.66, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${t > V.cta + 0.4 ? 0 : 1})`);
    a.fillStyle = g; a.fillRect(0, 0, W, H); a.globalCompositeOperation = 'source-over';
    ctx.drawImage(POST.a, 0, 0);
    // warm sun grade + vignette
    const s = ctx.createRadialGradient(W * 0.25, H * 0.1, 50, W * 0.5, H * 0.5, H * 0.85);
    s.addColorStop(0, 'rgba(255,240,200,0.16)'); s.addColorStop(0.6, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(20,30,40,0.28)');
    ctx.fillStyle = s; ctx.fillRect(0, 0, W, H);
  },
});
