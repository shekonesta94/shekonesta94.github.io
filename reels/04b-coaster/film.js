// رولر كوستر — Nesta ad 4 (redo). Pure function of time: window.seek(t) paints frame t.
// First-person roller coaster in real perspective: a track built by a "turtle" in 3-D, a camera that
// rides it (banks, drops, corkscrews), a sunset sea whose horizon rolls with you, clouds you fly through.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, wobble, font, rrect, hash01, noise1, mix, TAU } = M;
const D = 'Display', UI = 'UI';
const B = (t) => t / 0.499983;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const C = { mint: '#41ECAE', mintInk: '#06402C', coral: '#FF7A59', cream: '#FFF6E8', navy: '#13284A', ink: '#1E1B2E', gold: '#FFD27A' };
const V = {
  hookA: 0.35, hookB: 1.46, s1L: 3.64, s1T: 4.5, s2L: 7.08, s2D: 7.94, s2list: 8.74, s2no: 11.03, s3L: 12.37, s3T: 13.38, s3P: 15.61,
  s4L: 17.11, s4S: 18.11, s4M: 19.55, s5L: 21.01, s5R: 22.44, s5P: 23.78, all: 25.84, btn: 26.57, cta: 28.5, cta2: 30.08,
};

// ---------------------------------------------------------------- vectors
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- the track (turtle)
// [name, length, yawRate deg/unit (fn of u), pitch deg (fn of u), bank deg, extra roll deg over section]
const SECS = [
  ['crest', 8, () => 0, () => -2, 0, 0],
  ['drop', 48, () => 0, (u) => -62 * Math.sin(Math.PI * Math.min(1, u)) * (u < 0.5 ? 1 : 1), 0, 0],
  ['run', 26, () => -0.9, () => 0, 14, 0],
  ['spiral', 160, () => 2.25, () => 4, -40, 0],
  ['exit', 14, () => 0, () => -4, 0, 0],
  ['data', 112, (u) => 1.1 * Math.sin(u * TAU * 1.5), () => 0, 0, 0],
  ['vaultA', 26, () => 0, () => -6, 0, 0],
  ['tunnel', 56, () => 0, () => 0, 0, 0],
  ['cork', 84, () => 0.15, () => 0, 0, 360],
  ['flat', 16, () => 0, () => 0, 0, 0],
  ['climb', 44, () => 0, (u) => 26 * Math.sin(Math.PI * Math.min(1, u * 1.6)) * (u < 0.62 ? 1 : 0.0) + (u >= 0.62 ? 26 * Math.cos((u - 0.62) / 0.38 * Math.PI / 2) : 0), 0, 0],
  ['crest2', 12, () => 0, () => 0, 0, 0],
  ['coast', 70, () => -0.7, () => -3, 10, 0],
  ['station', 60, () => 0, () => 0, 0, 0],
];
const STEP = 0.5, TRK = [], SEC0 = {};
(function build() {
  let pos = [0, 62, 0], yaw = 0, rollAcc = 0, s = 0, prevBank = 0;
  for (const [name, len, yr, pf, bank, roll] of SECS) {
    SEC0[name] = s;
    const n = Math.round(len / STEP);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      yaw += yr(u) * STEP * DEG;
      const pitch = pf(u) * DEG;
      const b = lerp(prevBank, bank, clamp(u / 0.15)) * (u > 0.85 ? clamp((1 - u) / 0.15) : 1) + (u > 0.85 ? 0 : 0);
      const bb = u > 0.85 ? bank * clamp((1 - u) / 0.15) : b;
      rollAcc += (roll / n);
      const dir = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
      TRK.push({ p: pos.slice(), f: dir, bank: bb * DEG + rollAcc * DEG, s });
      pos = add(pos, mul(dir, STEP)); s += STEP;
    }
    prevBank = 0;
  }
  SEC0.end = s;
})();
const at = (name, u) => SEC0[name] + u * (SECS.find((x) => x[0] === name)[1]);
function sample(s) {
  const i = clamp(s / STEP, 0, TRK.length - 2), k = Math.floor(i), f = i - k;
  const a = TRK[k], b = TRK[k + 1];
  const p = add(mul(a.p, 1 - f), mul(b.p, f)), fw = norm(add(mul(a.f, 1 - f), mul(b.f, f))), bank = lerp(a.bank, b.bank, f);
  const up0 = [0, 1, 0];
  let r = norm(cross(up0, fw)); let u = cross(fw, r);
  const c = Math.cos(bank), sn = Math.sin(bank);
  const r2 = add(mul(r, c), mul(u, sn)), u2 = sub(mul(u, c), mul(r, sn));
  return { p, f: fw, r: r2, u: u2 };
}

// ---------------------------------------------------------------- the ride: distance over time (monotone cubic)
const RIDE = [
  [0, 0], [V.hookB, 2.5], [3.55, at('spiral', 0)], [6.95, at('spiral', 1)], [7.35, at('data', 0)], [12.25, at('data', 1)],
  [13.2, at('tunnel', 0)], [16.95, at('tunnel', 1) + 2], [20.75, at('climb', 0)], [22.42, at('crest2', 0.45)], [25.7, at('coast', 0.45)],
  [28.3, at('coast', 0.95)], [30.4, at('station', 0.62)], [34, at('station', 0.64)],
];
const RIDE_M = (() => {   // Fritsch–Carlson slopes
  const n = RIDE.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((RIDE[i + 1][1] - RIDE[i][1]) / (RIDE[i + 1][0] - RIDE[i][0]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b; if (h > 9) { const tt = 3 / Math.sqrt(h); m[i] = tt * a * d[i]; m[i + 1] = tt * b * d[i]; } }
  return m;
})();
function rideS(t) {
  let i = 0; while (i < RIDE.length - 2 && t >= RIDE[i + 1][0]) i++;
  const [t0, s0] = RIDE[i], [t1, s1] = RIDE[i + 1], h = t1 - t0, x = clamp((t - t0) / h);
  const h00 = 2 * x ** 3 - 3 * x ** 2 + 1, h10 = x ** 3 - 2 * x ** 2 + x, h01 = -2 * x ** 3 + 3 * x ** 2, h11 = x ** 3 - x ** 2;
  return h00 * s0 + h10 * h * RIDE_M[i] + h01 * s1 + h11 * h * RIDE_M[i + 1];
}
const speed = (t) => (rideS(t + 0.03) - rideS(t - 0.03)) / 0.06;

// ---------------------------------------------------------------- camera
const F = 820;
let CAM = null;
function camera(t) {
  const s = rideS(t), q = sample(s), ahead = sample(Math.min(SEC0.end - 1, s + 7));
  let f = norm(sub(add(ahead.p, mul(ahead.u, 1.0)), add(q.p, mul(q.u, 1.4))));
  let up = q.u;
  // at the crest: look down the drop (vertigo); later: look left at the owner
  const lookDown = (1 - prog(t, V.hookB + 0.2, V.hookB + 0.9)) * 0.32;
  const lookLeft = E.inOutCubic(prog(t, 25.5, 26.3)) * (1 - E.inOutCubic(prog(t, 28.0, 28.8))) * -0.95;
  const lookUp = E.inOutCubic(prog(t, 28.6, 30.2)) * 0.36;
  const lookIn = E.inOutCubic(prog(t, 3.4, 4.2)) * (1 - E.inOutCubic(prog(t, 6.6, 7.3))) * 1.2;
  let r = norm(cross(up, f)); up = cross(f, r);
  if (lookDown) { f = norm(sub(mul(f, Math.cos(lookDown)), mul(up, Math.sin(lookDown)))); up = cross(f, r); }
  if (lookUp) { f = norm(add(mul(f, Math.cos(lookUp)), mul(up, Math.sin(lookUp)))); up = cross(f, r); }
  if (lookIn) { const c = Math.cos(lookIn), sn = Math.sin(lookIn); f = norm(add(mul(f, c), mul(r, sn))); r = norm(cross(up, f)); }
  if (lookLeft) { const c = Math.cos(lookLeft), sn = Math.sin(lookLeft); f = norm(add(mul(f, c), mul(r, sn))); r = norm(cross(up, f)); }
  const v = speed(t), sh = Math.min(1, v / 50) * 6;
  const pos = add(q.p, mul(q.u, 1.4));
  return { pos, f, r: norm(cross(up, f)), u: up, v, shx: noise1(t * 30, 3) * sh, shy: noise1(t * 30, 7) * sh, s };
}
function proj(X) {
  const d = sub(X, CAM.pos), z = dot(d, CAM.f); if (z < 0.25) return null;
  return [W / 2 + CAM.shx + (dot(d, CAM.r) / z) * F, H * 0.47 + CAM.shy - (dot(d, CAM.u) / z) * F, z];
}
function projDir(dv) {   // a direction at infinity
  const z = dot(dv, CAM.f); if (z <= 0.01) return null;
  return [W / 2 + CAM.shx + (dot(dv, CAM.r) / z) * F, H * 0.47 + CAM.shy - (dot(dv, CAM.u) / z) * F];
}

// ---------------------------------------------------------------- sky + sea (horizon rolls with the ride)
const SUN = norm([0.25, 0.06, 1]);
function skySea(ctx, t) {
  const fl = norm([CAM.f[0], 0, CAM.f[2]]), rr = norm(cross([0, 1, 0], fl));
  const a = projDir(add(fl, mul(rr, -1.2))), b = projDir(add(fl, mul(rr, 1.2)));
  let ang = 0, hx = W / 2, hy = -2000;
  if (a && b) { ang = Math.atan2(b[1] - a[1], b[0] - a[0]); hx = (a[0] + b[0]) / 2; hy = (a[1] + b[1]) / 2; }
  else if (CAM.f[1] < 0) hy = -4000; else hy = 6000;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, -2600, 0, 0);
  g.addColorStop(0, '#24123F'); g.addColorStop(0.45, '#6B2A6E'); g.addColorStop(0.75, '#D2557A'); g.addColorStop(0.93, '#FF9966'); g.addColorStop(1, '#FFC98A');
  ctx.fillStyle = g; ctx.fillRect(-5000, -6000, 10000, 6000);
  const sg = ctx.createLinearGradient(0, 0, 0, 2400); sg.addColorStop(0, '#F7A98A'); sg.addColorStop(0.08, '#B85F7E'); sg.addColorStop(0.4, '#3E2A5E'); sg.addColorStop(1, '#1A1636');
  ctx.fillStyle = sg; ctx.fillRect(-5000, 0, 10000, 6000);
  // wave lines rushing toward you (spacing grows with distance below the horizon)
  ctx.strokeStyle = 'rgba(255,200,170,0.10)'; ctx.lineWidth = 2;
  const off = (CAM.s * 0.9) % 1;
  for (let k = 1; k < 26; k++) { const y = Math.pow(k + off, 1.9) * 4; ctx.beginPath(); ctx.moveTo(-5000, y); ctx.lineTo(5000, y); ctx.stroke(); }
  ctx.restore();
  // the sun and its glitter path
  const sp = projDir(SUN);
  if (sp) {
    const g2 = ctx.createRadialGradient(sp[0], sp[1], 10, sp[0], sp[1], 520); g2.addColorStop(0, 'rgba(255,240,200,0.9)'); g2.addColorStop(0.2, 'rgba(255,190,130,0.45)'); g2.addColorStop(1, 'rgba(255,150,120,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(sp[0], sp[1], 520, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFF1D0'; ctx.beginPath(); ctx.arc(sp[0], sp[1], 60, 0, TAU); ctx.fill();
  }
}

// ---------------------------------------------------------------- clouds (seeded, placed around the track)
const CLOUDS = [];
for (let i = 0; i < 80; i++) {
  const s = hash01(i, 1) * SEC0.end, q = TRK[Math.floor(s / STEP)];
  const side = hash01(i, 2) < 0.5 ? -1 : 1, off = 28 + hash01(i, 3) * 160;
  const r = norm(cross([0, 1, 0], q.f));
  const p = add(q.p, add(mul(r, side * off), [0, (hash01(i, 4) - 0.35) * 60, 0]));
  CLOUDS.push({ p, r: 6 + hash01(i, 5) * 16, n: 4 + Math.floor(hash01(i, 6) * 4), seed: i });
}
// a few clouds right on the line so we punch through them
for (const [nm, u] of [['drop', 0.8], ['data', 0.05], ['cork', 0.9], ['coast', 0.2]]) { const q = sample(at(nm, u)); CLOUDS.push({ p: add(q.p, mul(q.u, 1.5)), r: 7, n: 6, seed: 900 + CLOUDS.length, through: true }); }
function drawCloud(ctx, c, P) {
  const [x, y, z] = P, k = F / z;
  const near = clamp((z - 2) / 10);
  for (let j = 0; j < c.n; j++) {
    const ox = (hash01(c.seed * 7 + j, 1) - 0.5) * c.r * 2.2, oy = (hash01(c.seed * 7 + j, 2) - 0.5) * c.r * 0.7, rr = c.r * (0.55 + 0.5 * hash01(c.seed * 7 + j, 3));
    const cx = x + ox * k, cy = y - oy * k, R = rr * k;
    if (R < 1.5 || R > 6000) continue;
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    g.addColorStop(0, `rgba(255,236,230,${0.95 * near})`); g.addColorStop(0.7, `rgba(255,180,190,${0.75 * near})`); g.addColorStop(1, `rgba(240,140,170,0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  }
}

// ---------------------------------------------------------------- scenery objects in the world
function projCircle(center, a, b, R, n = 40) {   // circle in the plane spanned by a,b
  const pts = []; for (let i = 0; i <= n; i++) { const th = (i / n) * TAU; const P = proj(add(center, add(mul(a, Math.cos(th) * R), mul(b, Math.sin(th) * R)))); if (!P) return null; pts.push(P); } return pts;
}
function pathPts(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); }
const BUB = (() => { const s0 = at('spiral', 0), q0 = sample(s0), q1 = sample(at('spiral', 0.5)); return add(mul(add(q0.p, q1.p), 0.5), [0, -2, 0]); })();
function bigBubble(ctx, t) {
  const P = proj(BUB); if (!P) return; const [x, y, z] = P, k = 0.4 * F / z; if (z > 900) return;
  const read = clamp((t - V.s1T) / 0.5);
  const g = ctx.createRadialGradient(x, y, 10, x, y, 34 * k); g.addColorStop(0, `rgba(65,236,174,${0.45 + 0.3 * read})`); g.addColorStop(1, 'rgba(65,236,174,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 34 * k, 0, TAU); ctx.fill();
  // nest under it
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) { ctx.strokeStyle = i % 3 ? '#FFF4EC' : '#E9D6D0'; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.ellipse(x, y + 14 * k + (hash01(i, 8) - 0.5) * 3 * k, (12 + 4 * hash01(i, 9)) * k, 4 * k, (hash01(i, 10) - 0.5) * 0.4, 0.15, Math.PI - 0.15); ctx.stroke(); }
  for (let i = 0; i < 8; i++) { ctx.fillStyle = C.mint; ctx.beginPath(); ctx.arc(x + (i < 4 ? -1 : 1) * (10 + (i % 4) * 2.4) * k, y + (14 + (i % 4) * 1.5) * k, 1.1 * k, 0, TAU); ctx.fill(); }
  const bob = Math.sin(t * 2) * 0.8 * k;
  const bg = ctx.createRadialGradient(x - 4 * k, y - 4 * k + bob, k, x, y + bob, 12 * k); bg.addColorStop(0, '#9CF7D3'); bg.addColorStop(1, '#2FD597');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(x, y + bob, 11 * k, 8.6 * k, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 4 * k, y + 6 * k + bob); ctx.lineTo(x - 7 * k, y + 12 * k + bob); ctx.lineTo(x + 0.5 * k, y + 7.5 * k + bob); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(x - 4 * k, y - 4 * k + bob, 3 * k, 1.4 * k, -0.5, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = C.mintInk; ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(t * 8 - i)); ctx.beginPath(); ctx.arc(x + (-3.4 + i * 3.4) * k, y + bob, 1.2 * k, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
}
const CARDS = [['الأسعار', 0.18, 1], ['المواعيد', 0.43, -1], ['المنيو', 0.68, 1]].map(([label, u, side]) => {
  const s = at('data', u), q = sample(s); return { label, s, p: add(add(q.p, mul(q.r, side * 6.5)), mul(q.u, 3.2)), q };
});
const cardHit = (c) => { let lo = 0, hi = 34; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (rideS(m) < c.s - 2) lo = m; else hi = m; } return hi; };
CARDS.forEach((c) => (c.tHit = cardHit(c)));
function card3D(ctx, c, t, P) {
  const [x, y, z] = P, k = F / z, w = 7 * k, h = 4.4 * k;
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + c.s) * 0.05);
  ctx.fillStyle = 'rgba(30,10,40,0.35)'; rrect(ctx, -w / 2 + 0.3 * k, -h / 2 + 0.5 * k, w, h, 0.6 * k); ctx.fill();
  ctx.fillStyle = C.cream; rrect(ctx, -w / 2, -h / 2, w, h, 0.6 * k); ctx.fill();
  ctx.fillStyle = C.mint; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, 1.1 * k, [0.6 * k, 0.6 * k, 0, 0]); ctx.fill();
  ctx.font = font(1.25 * k, 700, D); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.fillText(c.label, 0, 0.9 * k);
  ctx.restore();
}
// the vault door + mountain at the tunnel mouth
const VAULT = (() => { const q = sample(at('tunnel', 0)); return { c: add(q.p, mul(q.u, 1.2)), q }; })();
function vault(ctx, t) {
  const { c, q } = VAULT; const P = proj(c); if (!P || P[2] > 700) return;
  // mountain: jagged ring of rock in the door plane
  const pts = [];
  for (let i = 0; i <= 36; i++) { const th = (i / 36) * Math.PI; const R = 60 + 30 * hash01(i, 77); const X = add(c, add(mul(q.r, Math.cos(th) * R * 1.6), mul(q.u, Math.sin(th) * R - 30))); const p = proj(X); if (p) pts.push(p); }
  if (pts.length > 3) { const g = ctx.createLinearGradient(0, P[1] - 80 * F / P[2], 0, P[1] + 30 * F / P[2]); g.addColorStop(0, '#5B2B5E'); g.addColorStop(1, '#2A1636'); ctx.fillStyle = g; pathPts(ctx, pts); ctx.closePath(); ctx.fill(); }
  // door frame + spinning door that splits open as we arrive
  const open = E.inOutCubic(prog(t, V.s3T - 0.3, V.s3T + 0.35));
  const ring = projCircle(c, q.r, q.u, 7.5); if (ring) { ctx.fillStyle = '#121626'; pathPts(ctx, ring); ctx.fill(); ctx.strokeStyle = C.mint; ctx.lineWidth = Math.max(2, 0.5 * F / P[2]); ctx.stroke(); }
  for (const side of [-1, 1]) {
    const cc = add(c, mul(q.r, side * open * 8));
    const pts2 = []; for (let i = 0; i <= 24; i++) { const th = side > 0 ? -Math.PI / 2 + (i / 24) * Math.PI : Math.PI / 2 + (i / 24) * Math.PI; const p = proj(add(cc, add(mul(q.r, Math.cos(th) * 6.6), mul(q.u, Math.sin(th) * 6.6)))); if (p) pts2.push(p); }
    if (pts2.length > 12) { const g = ctx.createLinearGradient(pts2[0][0], 0, pts2[Math.floor(pts2.length / 2)][0] + 0.01, 0); g.addColorStop(0, '#C9D2DE'); g.addColorStop(1, '#7E8A9C'); ctx.fillStyle = g; pathPts(ctx, pts2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#5A6476'; ctx.lineWidth = Math.max(1, 0.25 * F / P[2]); ctx.stroke(); }
  }
  const rot = t * 2;
  for (let i = 0; i < 3; i++) { const a = rot + i * Math.PI / 3; const p0 = proj(add(c, add(mul(q.r, Math.cos(a) * 5 + (Math.cos(a) > 0 ? 1 : -1) * open * 8), mul(q.u, Math.sin(a) * 5)))); const p1 = proj(add(c, add(mul(q.r, -Math.cos(a) * 5 + (-Math.cos(a) > 0 ? 1 : -1) * open * 8), mul(q.u, -Math.sin(a) * 5)))); if (p0 && p1 && open < 0.95) { ctx.strokeStyle = '#4A5466'; ctx.lineWidth = Math.max(1, 0.5 * F / P[2]); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); } }
}
// the phone at the top of the last climb
const PHONE = (() => { const q = sample(at('crest2', 0.38)); return { c: add(q.p, mul(q.u, 2.8)), q }; })();
const tPhone = (() => { let lo = 0, hi = 34; const s = at('crest2', 0.38) - 1.4; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (rideS(m) < s) lo = m; else hi = m; } return hi; })();
function phone(ctx, t) {
  if (t > tPhone) return;
  const { c, q } = PHONE; const w = 7, h = 13;
  const corner = (a, b) => proj(add(c, add(mul(q.r, a * w / 2), mul(q.u, b * h / 2))));
  const tl = corner(-1, 1), tr = corner(1, 1), bl = corner(-1, -1); if (!tl || !tr || !bl) return;
  const P = proj(c); if (P[2] > 500) return;
  ctx.save(); ctx.transform((tr[0] - tl[0]) / w, (tr[1] - tl[1]) / w, (bl[0] - tl[0]) / h, (bl[1] - tl[1]) / h, tl[0], tl[1]);
  ctx.fillStyle = '#0B0E14'; rrect(ctx, -0.4, -0.4, w + 0.8, h + 0.8, 1.2); ctx.fill();
  ctx.fillStyle = '#ECE5DD'; rrect(ctx, 0, 0, w, h, 0.9); ctx.fill();
  ctx.fillStyle = '#1E2A33'; ctx.beginPath(); ctx.roundRect(0, 0, w, 1.6, [0.9, 0.9, 0, 0]); ctx.fill();
  ctx.font = font(0.6, 700, UI); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('العيادة', w - 0.5, 1.05);
  ctx.fillStyle = '#FFFFFF'; rrect(ctx, 2.2, 2.4, 4.4, 1.3, 0.4); ctx.fill(); ctx.fillStyle = '#1F1A24'; ctx.font = font(0.55, 600, UI); ctx.fillText('متاح بكرة؟', 6.3, 3.25);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(80,80,90,${0.4 + 0.5 * Math.max(0, Math.sin(t * 9 - i))})`; ctx.beginPath(); ctx.arc(1.2 + i * 0.6, 5, 0.18, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// shards + the reply when we burst through
function burst(ctx, t) {
  const p = (t - tPhone); if (p < 0 || p > 1.4) return;
  ctx.save();
  for (let i = 0; i < 28; i++) {
    const a = hash01(i, 3) * TAU, v = 900 + 1400 * hash01(i, 4), r = 40 + 80 * hash01(i, 5);
    const x = W / 2 + Math.cos(a) * v * p, y = H * 0.47 + Math.sin(a) * v * p + 600 * p * p, rot = p * 6 * (hash01(i, 6) - 0.5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = 1 - p / 1.4;
    ctx.fillStyle = i % 3 ? 'rgba(236,229,221,0.95)' : 'rgba(180,230,255,0.9)';
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, r * 0.5); ctx.lineTo(-r * 0.6, r * 0.7); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  const fl = 1 - clamp(p / 0.25); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.85 * fl})`; ctx.fillRect(0, 0, W, H); }
}
// the owner's cloud island, off to the left of the coast
const ISLAND = (() => { const q = sample(at('coast', 0.72)); return add(add(q.p, mul(q.r, -16)), [0, -3, 0]); })();
function island(ctx, t) {
  const P = proj(ISLAND); if (!P || P[2] > 400) return; const [x, y, z] = P, k = F / z;
  for (let j = 0; j < 9; j++) { const ox = (j - 4) * 1.6, oy = Math.abs(j - 4) * 0.25; const R = (2.6 - Math.abs(j - 4) * 0.18) * k; const g = ctx.createRadialGradient(x + ox * k, y + (1.6 + oy) * k, R * 0.1, x + ox * k, y + (1.6 + oy) * k, R); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, 'rgba(255,200,215,0.0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + ox * k, y + (1.6 + oy) * k, R, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#F4D9A6'; ctx.beginPath(); ctx.ellipse(x, y + 0.6 * k, 6 * k, 1.3 * k, 0, 0, TAU); ctx.fill();
  // umbrella
  ctx.strokeStyle = '#6B4A3A'; ctx.lineWidth = 0.18 * k; ctx.beginPath(); ctx.moveTo(x + 2.6 * k, y + 0.6 * k); ctx.lineTo(x + 2.2 * k, y - 4.4 * k); ctx.stroke();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#FFFFFF' : C.coral; ctx.beginPath(); ctx.moveTo(x + 2.2 * k, y - 4.6 * k); const a0 = Math.PI + i * Math.PI / 6, a1 = a0 + Math.PI / 6; ctx.arc(x + 2.2 * k, y - 3.4 * k, 3.4 * k, a0, a1); ctx.closePath(); ctx.fill(); }
  // deck chair + owner sipping tea
  ctx.fillStyle = '#3A6EA5'; ctx.save(); ctx.translate(x - 0.6 * k, y - 0.2 * k); ctx.rotate(-0.5); ctx.fillRect(-1.6 * k, -0.25 * k, 3.6 * k, 0.5 * k); ctx.restore();
  ctx.fillStyle = '#2E8B57'; ctx.beginPath(); ctx.ellipse(x - 0.8 * k, y - 1.0 * k, 0.75 * k, 1.1 * k, -0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#E2B08A'; ctx.beginPath(); ctx.arc(x - 1.5 * k, y - 2.2 * k, 0.6 * k, 0, TAU); ctx.fill();
  ctx.fillStyle = '#20232A'; ctx.fillRect(x - 2.0 * k, y - 2.45 * k, 1.0 * k, 0.22 * k);   // sunglasses
  const sip = Math.max(0, Math.sin((t - V.all) * 2.4)) * (t > V.all ? 1 : 0);
  ctx.fillStyle = '#FFFFFF'; rrect(ctx, x - 0.6 * k, y - (1.6 + 0.6 * sip) * k, 0.55 * k, 0.6 * k, 0.1 * k); ctx.fill();
  for (let i = 0; i < 2; i++) { const ph = ((t * 0.8) + i / 2) % 1; ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - 0.35 * k, y - (2.3 + ph * 1.2 + 0.6 * sip) * k, (0.15 + ph * 0.2) * k, 0, TAU); ctx.fill(); }
}
// the Nesta station gate with the neon logo
const GATE = (() => { const q = sample(at('station', 0.97)); return { c: add(q.p, mul(q.u, 0)), q }; })();
let LOGO = null;
function gate(ctx, t) {
  const { c, q } = GATE; const P = proj(c); if (!P || P[2] > 600) return;
  const k = F / P[2];
  const pil = (side) => { const b = proj(add(c, mul(q.r, side * 6))), tp = proj(add(add(c, mul(q.r, side * 6)), mul(q.u, 15))); if (b && tp) { ctx.strokeStyle = C.navy; ctx.lineWidth = 1.4 * k; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(tp[0], tp[1]); ctx.stroke(); ctx.strokeStyle = 'rgba(65,236,174,0.8)'; ctx.lineWidth = 0.25 * k; ctx.stroke(); } };
  pil(-1); pil(1);
  // sign board above the track (plane facing us)
  const w = 16, h = 5.2, base = add(c, mul(q.u, 15.2));
  const corner = (a, b) => proj(add(base, add(mul(q.r, a * w / 2), mul(q.u, b * h))));
  const tl = corner(-1, 1), tr = corner(1, 1), bl = corner(-1, 0); if (!tl || !tr || !bl) return;
  const on = clamp((t - V.cta) / 0.15) * (0.92 + 0.08 * (noise1(t * 20, 5) > -0.6 ? 1 : 0.2));
  ctx.save(); ctx.transform((tr[0] - tl[0]) / w, (tr[1] - tl[1]) / w, (bl[0] - tl[0]) / h, (bl[1] - tl[1]) / h, tl[0], tl[1]);
  ctx.shadowColor = `rgba(65,236,174,${0.9 * on})`; ctx.shadowBlur = 40 * on;
  ctx.fillStyle = '#0F1E33'; rrect(ctx, -0.3, -0.3, w + 0.6, h + 0.6, 0.6); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(65,236,174,${0.35 + 0.65 * on})`; ctx.lineWidth = 0.22; rrect(ctx, -0.1, -0.1, w + 0.2, h + 0.2, 0.5); ctx.stroke();
  if (LOGO) { ctx.globalAlpha = 0.25 + 0.75 * on; ctx.drawImage(LOGO, 0, 0, 1640, 520, 0.6, 0.35, w - 1.2, (w - 1.2) * 520 / 1640); ctx.globalAlpha = 1; }
  ctx.restore();
}

// ---------------------------------------------------------------- the track itself
function trackItems(items, t) {
  const s0 = CAM.s;
  // rails, ties and supports for the next stretch
  for (let s = s0 + 2.5; s < Math.min(SEC0.end - 1, s0 + 190); s += (s - s0 < 40 ? 1 : 2)) {
    const a = sample(s), b = sample(s + (s - s0 < 40 ? 1 : 2));
    const la = add(a.p, mul(a.r, -0.9)), ra = add(a.p, mul(a.r, 0.9)), lb = add(b.p, mul(b.r, -0.9)), rb = add(b.p, mul(b.r, 0.9));
    const pla = proj(la), pra = proj(ra), plb = proj(lb), prb = proj(rb); if (!pla || !pra || !plb || !prb) continue;
    const z = (pla[2] + plb[2]) / 2;
    items.push([z, () => {
      const k = F / z;
      // spine (dark box beam under the rails)
      const sa = proj(add(a.p, mul(a.u, -0.5))), sb = proj(add(b.p, mul(b.u, -0.5)));
      if (sa && sb) { ctx.strokeStyle = '#2A1E3E'; ctx.lineWidth = Math.min(90, 0.9 * k); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sa[0], sa[1]); ctx.lineTo(sb[0], sb[1]); ctx.stroke(); }
      // tie
      ctx.strokeStyle = '#3B2D52'; ctx.lineWidth = Math.min(28, 0.28 * k); ctx.beginPath(); ctx.moveTo(pla[0], pla[1]); ctx.lineTo(pra[0], pra[1]); ctx.stroke();
      // glowing rails
      for (const [p0, p1] of [[pla, plb], [pra, prb]]) {
        ctx.strokeStyle = 'rgba(65,236,174,0.22)'; ctx.lineWidth = Math.min(60, 0.7 * k); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
        ctx.strokeStyle = '#B9FFE6'; ctx.lineWidth = Math.min(16, Math.max(1, 0.2 * k)); ctx.stroke();
      }
    }]);
    // supports down to the sea every 8 units
    if (Math.round(s) % 8 === 0 && s > s0 + 2) {
      const top = proj(add(a.p, mul(a.u, -0.6))), bot = proj([a.p[0], 0, a.p[2]]);
      if (top && bot) items.push([z + 0.5, () => { const k = F / z; ctx.strokeStyle = '#2B1C40'; ctx.lineWidth = 0.6 * k; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(bot[0], bot[1]); ctx.stroke(); ctx.strokeStyle = 'rgba(255,170,150,0.25)'; ctx.lineWidth = 0.15 * k; ctx.stroke(); }]);
    }
  }
}
function tunnelRings(items, t) {
  const t0 = at('tunnel', 0), t1 = at('tunnel', 1);
  for (let s = t0 + 2; s < t1; s += 4) {
    if (s < CAM.s - 1 || s > CAM.s + 120) continue;
    const q = sample(s), c = add(q.p, mul(q.u, 1.2));
    const P = proj(c); if (!P) continue;
    items.push([P[2], () => {
      const ring = projCircle(c, q.r, q.u, 6.8, 36); if (!ring) return;
      ctx.strokeStyle = 'rgba(65,236,174,0.25)'; ctx.lineWidth = 2.4 * F / P[2]; pathPts(ctx, ring); ctx.stroke();
      ctx.strokeStyle = '#9BFFD9'; ctx.lineWidth = Math.max(1, 0.35 * F / P[2]); ctx.stroke();
    }]);
  }
  // the lock glowing at the end of the tunnel
  const q = sample(t1 - 6), c = add(q.p, mul(q.u, 2.6)); const P = proj(c);
  if (P && t > V.s3P - 0.2) items.push([P[2], () => { const k = F / P[2], s = sp(t, V.s3P, SPRING.bouncy) * 1.4; ctx.save(); ctx.translate(P[0], P[1]); ctx.scale(s, s); ctx.strokeStyle = C.mintInk; ctx.lineWidth = 0.35 * k; ctx.beginPath(); ctx.arc(0, -0.9 * k, 0.9 * k, Math.PI, 0); ctx.stroke(); ctx.fillStyle = C.mint; rrect(ctx, -1.3 * k, -0.9 * k, 2.6 * k, 2 * k, 0.4 * k); ctx.fill(); ctx.fillStyle = C.mintInk; ctx.beginPath(); ctx.arc(0, 0, 0.25 * k, 0, TAU); ctx.fill(); ctx.restore(); }]);
}
function sheetTiles(items, t) {
  const a0 = at('cork', 0.05), a1 = at('cork', 0.95);
  for (let s = a0, i = 0; s < a1; s += 3, i++) {
    if (s < CAM.s - 1 || s > CAM.s + 110) continue;
    const q = sample(s), c = add(q.p, mul(q.u, 1.4)); const P = proj(c); if (!P) continue;
    const lit = rideS(t) > s - 25;
    items.push([P[2], () => {
      const k = F / P[2];
      const sq = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(([a, b]) => proj(add(c, add(mul(q.r, a * 5.2), mul(q.u, b * 5.2)))));
      if (sq.some((p) => !p)) return;
      ctx.strokeStyle = lit ? 'rgba(65,236,174,0.9)' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = Math.max(1, 0.3 * k); pathPts(ctx, sq); ctx.stroke();
      // cells along the bottom edge fill like spreadsheet rows
      if (lit) for (let j = 0; j < 4; j++) { const p0 = proj(add(c, add(mul(q.r, -5.2 + j * 2.6 + 0.2), mul(q.u, -5.2)))), p1 = proj(add(c, add(mul(q.r, -5.2 + j * 2.6 + 2.4), mul(q.u, -4.0)))); if (p0 && p1) { ctx.fillStyle = `rgba(65,236,174,${0.35 + 0.15 * (j % 2)})`; ctx.fillRect(Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), Math.abs(p1[0] - p0[0]), Math.abs(p1[1] - p0[1])); } }
    }]);
  }
}

// ---------------------------------------------------------------- cockpit overlay (screen space)
function cockpit(ctx, t) {
  const v = Math.min(1, speed(t) / 45), bump = Math.sin(t * 28) * 3 * v;
  ctx.save(); ctx.translate(0, bump);
  // car nose
  const g = ctx.createLinearGradient(0, H - 330, 0, H); g.addColorStop(0, '#FF8A65'); g.addColorStop(1, '#C2412A');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, H - 170); ctx.quadraticCurveTo(W / 2, H - 330, W + 20, H - 170); ctx.lineTo(W + 20, H + 20); ctx.lineTo(-20, H + 20); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.mint; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-20, H - 140); ctx.quadraticCurveTo(W / 2, H - 290, W + 20, H - 140); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20, H - 172); ctx.quadraticCurveTo(W / 2, H - 332, W + 20, H - 172); ctx.stroke();
  // collected data cards stuck on the dash
  CARDS.forEach((c, i) => {
    const p = clamp((t - c.tHit) / 0.45); if (p <= 0) return; const e = E.outBack(p, 1.4);
    const sx = W / 2 - 150 + (i - 1) * 205, sy = H - 240;
    const P = t < c.tHit + 0.45 ? null : null;
    ctx.save(); ctx.translate(lerp(W / 2 + (i - 1) * 600, sx, e), lerp(H * 0.3, sy, e)); ctx.rotate((i - 1) * 0.08); ctx.scale(lerp(2.4, 1, e), lerp(2.4, 1, e));
    ctx.fillStyle = C.cream; rrect(ctx, -95, -40, 190, 80, 14); ctx.fill(); ctx.fillStyle = C.mint; ctx.beginPath(); ctx.roundRect(-95, -40, 190, 20, [14, 14, 0, 0]); ctx.fill();
    ctx.font = font(30, 700, D); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.fillText(c.label, 0, 26); ctx.restore();
  });
  // lap bar coming down
  const lb = E.outBack(prog(t, V.hookA, V.hookA + 0.45), 1.6);
  const by = lerp(H - 900, H - 360, Math.min(1, lb));
  ctx.strokeStyle = '#2B2F3A'; ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(90, H + 40); ctx.quadraticCurveTo(140, by, W / 2, by - 20); ctx.quadraticCurveTo(W - 140, by, W - 90, H + 40); ctx.stroke();
  ctx.strokeStyle = '#FFD166'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(W / 2 - 120, by - 12); ctx.quadraticCurveTo(W / 2, by - 30, W / 2 + 120, by - 12); ctx.stroke();
  // the passenger: the customer's message, a little mint bubble with a face
  passenger(ctx, W - 230, H - 330 + bump * 0.5, t, v);
  ctx.restore();
}
function passenger(ctx, x, y, t, v) {
  const scream = (prog(t, V.hookB, V.hookB + 0.2) - prog(t, 3.2, 3.6)) + (prog(t, 17.2, 17.4) - prog(t, 20.4, 20.8)) * 0.8;
  const happy = t > V.s5R;
  const wob = Math.sin(t * 9) * 4 * v;
  ctx.save(); ctx.translate(x, y + wob); ctx.rotate(Math.sin(t * 5) * 0.06 * v);
  const g = ctx.createRadialGradient(-30, -40, 10, 0, 0, 130); g.addColorStop(0, '#A8FADC'); g.addColorStop(1, '#22C98B');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 120, 96, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-50, 70); ctx.lineTo(-80, 130); ctx.lineTo(0, 86); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-46, -50, 30, 14, -0.5, 0, TAU); ctx.fill();
  // eyes
  const blink = (Math.floor(t * 0.7) % 4 === 0 && (t * 0.7) % 1 < 0.08) ? 0.15 : 1;
  for (const ex of [-36, 36]) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(ex, -14, 20, 24 * (1 + 0.25 * clamp(scream)) * blink, 0, 0, TAU); ctx.fill(); ctx.fillStyle = C.mintInk; ctx.beginPath(); ctx.arc(ex + 4, -10, 10, 0, TAU); ctx.fill(); }
  // mouth: scream O on the drops, big smile at the end
  ctx.fillStyle = C.mintInk;
  if (clamp(scream) > 0.3) { ctx.beginPath(); ctx.ellipse(0, 36, 18, 24 * clamp(scream), 0, 0, TAU); ctx.fill(); }
  else { ctx.strokeStyle = C.mintInk; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, happy ? 22 : 28, happy ? 26 : 16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  // arms up on the drops
  if (clamp(scream) > 0.3) { ctx.strokeStyle = '#22C98B'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-90, -30); ctx.lineTo(-130, -130); ctx.moveTo(90, -30); ctx.lineTo(130, -130); ctx.stroke(); }
  ctx.restore();
}
function speedLines(ctx, t) {
  const v = clamp((speed(t) - 18) / 40); if (v <= 0) return;
  ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.28 * v})`; ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const a = hash01(i, 1) * TAU, ph = ((t * 2.2 + hash01(i, 2)) % 1);
    const r0 = 260 + ph * 900, r1 = r0 + 120 + 300 * v;
    ctx.lineWidth = 2 + 3 * hash01(i, 3);
    ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H * 0.47 + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * r1, H * 0.47 + Math.sin(a) * r1); ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- captions (kinetic, top of frame)
const CAPS = [
  [V.hookA, V.hookB - 0.05, 'اربط الحزام!', 120, { 'الحزام!': C.gold }],
  [V.hookB, V.s1L - 0.1, 'رسالة عميلك طالعة رحلة!', 84, { 'رحلة!': C.mint }],
  [V.s1L, V.s2L - 0.1, 'محطة ١: بوت نستا بيفهم', 80, { 'نستا': C.mint }],
  [V.s2L, V.s2no - 0.05, 'محطة ٢: من بياناتك', 82, { 'بياناتك': C.mint }],
  [V.s2no, V.s3L - 0.1, 'مفيش كلام من دماغه', 82, { 'دماغه': C.gold }],
  [V.s3L, V.s3P - 0.05, 'محطة ٣: قاعدة بياناتك', 80, { 'بياناتك': C.mint }],
  [V.s3P, V.s4L - 0.1, 'محدش يشوفها غيرك', 86, { 'غيرك': C.mint }],
  [V.s4L, V.s4M - 0.05, 'محطة ٤: الشيت اتملى', 82, { 'الشيت': C.mint }],
  [V.s4M, V.s5L - 0.1, 'والإيميل وصلك', 88, { 'الإيميل': C.gold }],
  [V.s5L, V.s5R - 0.05, 'وآخر محطة؟', 104, {}],
  [V.s5R + 0.15, V.all - 0.1, 'الرد رجع للعميل ✓✓'.replace(' ✓✓', ''), 86, { 'للعميل': C.mint }],
  [V.all, V.cta - 0.1, 'وإنت ولا دوست زرار', 86, { 'زرار': C.gold }],
];
function captions(ctx, t) {
  for (const [t0, t1, str, size, hl] of CAPS) {
    if (t < t0 - 0.05 || t > t1 + 0.3) continue;
    const k = sp(t, t0, SPRING.bouncy), out = E.inBack(prog(t, t1, t1 + 0.25), 1.6);
    const words = str.split(' ');
    ctx.save(); ctx.font = font(size, 700, D); ctx.direction = 'rtl'; ctx.textAlign = 'center';
    const ws = words.map((w) => ctx.measureText(w).width), gap = size * 0.3, tot = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    const scale = Math.min(1, 940 / tot);
    ctx.translate(W / 2, 330 - out * 300); ctx.scale(scale, scale); ctx.rotate(-0.02 + 0.015 * Math.sin(t * 3));
    let x = tot / 2;
    words.forEach((w, i) => {
      const kw = sp(t, t0 + i * 0.07, SPRING.bouncy), cx = x - ws[i] / 2; x -= ws[i] + gap;
      if (kw <= 0.01) return;
      ctx.save(); ctx.translate(cx, (1 - kw) * 80); const s = 0.5 + 0.5 * kw; ctx.scale(s, s); ctx.globalAlpha = clamp(kw * 1.6) * (1 - out);
      ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,10,40,0.85)'; ctx.lineWidth = size * 0.16; ctx.strokeText(w, 0, 0);
      ctx.fillStyle = hl[w] || '#FFFFFF'; ctx.fillText(w, 0, 0); ctx.restore();
    });
    ctx.restore();
  }
}
function cta(ctx, t) {
  const k1 = clamp((t - V.cta - 0.3) / 0.2), k2 = sp(t, V.cta + 0.9, SPRING.bouncy), k3 = clamp((t - V.cta2) / 0.25);
  if (k1 <= 0) return;
  const flick = (tt) => (tt < V.cta + 1.2 ? (noise1(tt * 25, 2) > -0.5 ? 1 : 0.4) : (noise1(tt * 6, 2) > -0.85 ? 1 : 0.8));
  ctx.save(); ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.globalAlpha = k1 * flick(t);
  ctx.font = font(74, 700, D); ctx.shadowColor = 'rgba(255,210,122,0.95)'; ctx.shadowBlur = 30; ctx.fillStyle = '#FFF3D6'; ctx.fillText('ابعت ديمو على واتساب', W / 2, H * 0.58);
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  if (k2 > 0.01) {
    ctx.save(); ctx.translate(W / 2, H * 0.58 + 150); ctx.scale(k2, k2);
    ctx.shadowColor = 'rgba(65,236,174,0.9)'; ctx.shadowBlur = 50; ctx.fillStyle = C.mint; rrect(ctx, -390, -80, 780, 160, 80); ctx.fill(); ctx.shadowBlur = 0;
    ctx.font = font(64, 700, UI); ctx.direction = 'ltr'; ctx.fillStyle = C.mintInk; ctx.fillText('010 9311 4446', -70, 22);
    ctx.font = font(44, 700, UI); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillText('واتساب', 340, 18);
    ctx.fillStyle = 'rgba(6,64,44,0.3)'; ctx.fillRect(150, -46, 3, 92);
    ctx.restore();
    if (t > 29.6) for (let r = 0; r < 2; r++) { const ph = ((t - 29.6) * 0.7 + r * 0.5) % 1; ctx.strokeStyle = `rgba(65,236,174,${0.6 * (1 - ph)})`; ctx.lineWidth = 5; rrect(ctx, W / 2 - 390 - ph * 50, H * 0.58 + 70 - ph * 50, 780 + ph * 100, 160 + ph * 100, 120); ctx.stroke(); }
  }
  if (k3 > 0) { ctx.globalAlpha = k3; ctx.font = font(70, 700, D); ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,10,40,0.85)'; ctx.lineWidth = 12; ctx.strokeText('واركب الرحلة بنفسك!', W / 2, H * 0.58 + 330); ctx.fillStyle = C.gold; ctx.fillText('واركب الرحلة بنفسك!', W / 2, H * 0.58 + 330); }
  ctx.restore();
}

// ---------------------------------------------------------------- hits
const HITS = [
  ...Array.from({ length: 6 }, (_, i) => [B(i * 0.22), 'chain clack', 'tick']),
  [B(V.hookA + 0.35), 'lap bar', 'thud'], [B(V.hookA + 0.4), 'click', 'click'],
  [B(V.hookB - 0.35), 'tip over', 'riser', { len: 0.35 }], [B(V.hookB + 0.05), 'DROP', 'impact'], [B(V.hookB + 0.4), 'wind', 'whoosh', { len: 1.2, from: 300, to: 2400 }],
  [B(V.s1L), 'spiral', 'whoosh', { len: 0.8 }], [B(V.s1T + 0.2), 'bubble reads', 'blip', { pitch: 'A6' }],
  ...CARDS.map((c) => [B(c.tHit), 'card grab', 'pop', { pitch: 'E6' }]),
  [B(V.s3T - 0.3), 'vault opens', 'sub', { len: 0.6 }], [B(V.s3T + 0.4), 'into tunnel', 'whoosh', { len: 0.6, from: 2000, to: 500 }],
  [B(V.s3P), 'lock', 'click'], [B(V.s3P + 0.05), 'lock bell', 'bell', { pitch: 'E6' }],
  [B(V.s4L), 'corkscrew', 'whoosh', { len: 1.0, from: 500, to: 2600 }], [B(V.s4S + 0.2), 'tiles', 'type', { len: 1.0, n: 10 }],
  [B(V.s4M + 0.1), 'email rocket', 'riser', { len: 0.5 }],
  ...Array.from({ length: 6 }, (_, i) => [B(V.s5L - 0.1 + i * 0.22), 'climb clack', 'tick']),
  [B(tPhone - 0.3), 'riser', 'riser', { len: 0.3 }], [B(tPhone), 'SMASH', 'impact'], [B(tPhone + 0.3), 'reply', 'bell', { pitch: 'A6' }],
  [B(25.6), 'look left', 'whoosh', { len: 0.5 }],
  [B(V.cta), 'neon on', 'sub', { len: 0.5 }], [B(V.cta + 0.3), 'neon', 'click'], [B(V.cta + 0.9), 'pill', 'pop', { pitch: 'E6' }],
  [B(31.5), 'sparkle', 'bell', { pitch: 'A6' }],
];

// ---------------------------------------------------------------- frame
let ctx = null;
function draw(c, t, IMG) {
  ctx = c;
  CAM = camera(t);
  const inTunnel = CAM.s > at('tunnel', 0) + 1 && CAM.s < at('tunnel', 1) - 1;
  skySea(ctx, t);
  if (inTunnel) { ctx.fillStyle = '#0A0E1C'; ctx.fillRect(0, 0, W, H); const ex = proj(add(sample(at('tunnel', 1)).p, mul(sample(at('tunnel', 1)).u, 1.2))); if (ex) { const r = 6.8 * F / ex[2]; const g = ctx.createRadialGradient(ex[0], ex[1], r * 0.2, ex[0], ex[1], r * 1.6); g.addColorStop(0, '#FFD9B0'); g.addColorStop(0.6, 'rgba(255,170,140,0.6)'); g.addColorStop(1, 'rgba(255,170,140,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex[0], ex[1], r * 1.6, 0, TAU); ctx.fill(); } }
  const items = [];
  if (!inTunnel) for (const c of CLOUDS) { const P = proj(c.p); if (P && P[2] < 900 && P[2] > 1.2) items.push([P[2], () => drawCloud(ctx, c, P)]); }
  trackItems(items, t);
  tunnelRings(items, t);
  sheetTiles(items, t);
  { const P = proj(BUB); if (P) items.push([P[2], () => bigBubble(ctx, t)]); }
  for (const c of CARDS) { if (t >= c.tHit) continue; const P = proj(c.p); if (P && P[2] < 400) items.push([P[2], () => card3D(ctx, c, t, P)]); }
  if (!inTunnel) { const P = proj(VAULT.c); if (P) items.push([P[2] + 3, () => vault(ctx, t)]); }
  { const P = proj(PHONE.c); if (P) items.push([P[2], () => phone(ctx, t)]); }
  { const P = proj(ISLAND); if (P) items.push([P[2], () => island(ctx, t)]); }
  { const P = proj(GATE.c); if (P) items.push([P[2], () => gate(ctx, t)]); }
  // the email rocketing ahead down the corkscrew
  if (t > V.s4M && t < V.s5L + 0.3) {
    const s = CAM.s + 8 + (t - V.s4M) * 26, q = sample(s), P = proj(add(q.p, mul(q.u, 2.2)));
    if (P) items.push([P[2], () => { const k = F / P[2]; ctx.save(); ctx.translate(P[0], P[1]); ctx.fillStyle = 'rgba(255,210,122,0.5)'; ctx.beginPath(); ctx.moveTo(-0.5 * k, 0.9 * k); ctx.lineTo(0.5 * k, 0.9 * k); ctx.lineTo(0, 4 * k); ctx.fill(); ctx.fillStyle = '#FFFFFF'; rrect(ctx, -1.4 * k, -0.9 * k, 2.8 * k, 1.8 * k, 0.2 * k); ctx.fill(); ctx.strokeStyle = C.coral; ctx.lineWidth = 0.18 * k; ctx.beginPath(); ctx.moveTo(-1.2 * k, -0.7 * k); ctx.lineTo(0, 0.2 * k); ctx.lineTo(1.2 * k, -0.7 * k); ctx.stroke(); ctx.restore(); }]);
  }
  items.sort((a, b) => b[0] - a[0]).forEach((it) => it[1]());
  // flying through a cloud: whiteout veil
  let fog = 0; for (const c of CLOUDS) if (c.through) { const d = Math.hypot(...sub(c.p, CAM.pos)); fog = Math.max(fog, clamp(1 - d / 7)); }
  if (fog > 0) { ctx.fillStyle = `rgba(255,228,230,${0.75 * fog})`; ctx.fillRect(0, 0, W, H); }
  speedLines(ctx, t);
  burst(ctx, t);
  // the reply, big, after the smash
  const rk = sp(t, tPhone + 0.12, SPRING.bouncy) * (1 - clamp((t - V.all + 0.1) / 0.3));
  if (rk > 0.01) { ctx.save(); ctx.translate(W / 2, H * 0.45); ctx.scale(rk, rk); ctx.shadowColor = 'rgba(65,236,174,0.8)'; ctx.shadowBlur = 40; ctx.fillStyle = C.mint; rrect(ctx, -330, -90, 660, 180, 90); ctx.fill(); ctx.shadowBlur = 0; ctx.beginPath(); ctx.moveTo(-120, 80); ctx.lineTo(-90, 140); ctx.lineTo(-40, 80); ctx.fill(); ctx.font = font(58, 700, UI); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = C.mintInk; ctx.fillText('أهلاً! متاح 5:00', 30, 18); ctx.strokeStyle = C.mintInk; ctx.lineWidth = 7; ctx.lineCap = 'round'; for (const dx of [-262, -238]) { ctx.beginPath(); ctx.moveTo(dx - 14, 0); ctx.lineTo(dx - 4, 12); ctx.lineTo(dx + 14, -12); ctx.stroke(); } ctx.restore(); }
  if (t < V.cta + 0.4) cockpit(ctx, t);
  else { ctx.save(); ctx.globalAlpha = 1 - clamp((t - V.cta - 0.4) / 0.5); cockpit(ctx, t); ctx.restore(); }
  captions(ctx, t);
  cta(ctx, t);
}

M.film({
  fonts: [font(100, 700, D), font(40, 700, UI), font(40, 600, UI)],
  images: { name: 'assets/logo_name.jpg' },
  hits: HITS,
  samples: 6,
  init(ctx, IMG) { if (IMG.name) { const c = document.createElement('canvas'); c.width = 1640; c.height = 520; c.getContext('2d').drawImage(IMG.name, 380, 640, 1640, 520, 0, 0, 1640, 520); LOGO = c; } },
  draw(ctx, u, t, IMG) { draw(ctx, t, IMG); },
  post(ctx, u, t) {
    const v = ctx.createRadialGradient(W / 2, H * 0.47, H * 0.3, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,5,30,0.42)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
});
