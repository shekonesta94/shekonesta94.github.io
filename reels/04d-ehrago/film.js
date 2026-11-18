// جرّب تحرجه — Nesta ad 4. Pure function of time: window.seek(t) paints frame t.
// A broadcast-style match: the phone is the ring, a scoreboard on top (العميل vs البوت), three rounds of
// traps the bot slips, a K.O., then the challenge passes to the viewer. Timed on the placed VO (+0.15 s).
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, wobble, font, rrect, hash01, noise1, mix, TAU } = M;
const D = 'Display', UI = 'UI';
const B = (t) => t / 0.499983;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const C = {
  bg: '#0F1E33', bg2: '#1B3152', mint: '#41ECAE', mintInk: '#06402C', coral: '#FF6B5B', gold: '#FFC94A', cream: '#F6F3EC',
  ink: '#172033', chat: '#EFE9E0', inc: '#FFFFFF', out: '#D7F8E9', grey: '#8A93A6',
};
const V = {
  hookA: 0.30, hookB: 0.99, r1L: 2.37, r1Q: 3.74, botQ: 5.84, naf: 6.63, r1A: 7.53,
  r2L: 10.07, r2Q: 11.22, r2A: 12.78, r3L: 14.94, r3Q: 16.16, booked: 17.92, sheet: 18.91,
  win: 20.77, ko: 21.88, dare: 23.68, cta: 24.89, cta2: 26.41,
};

// ---------------------------------------------------------------- type helpers
function tA(ctx, s, x, y, size, color, { face = D, weight = 800, align = 'center' } = {}) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'rtl'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function tL(ctx, s, x, y, size, color, align = 'center', face = UI, weight = 700) {
  ctx.save(); ctx.font = font(size, weight, face); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function check(ctx, x, y, s, col, w = 8) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.4); ctx.stroke(); ctx.restore(); }
// wrap words into lines that fit maxW (direction-aware)
function wrapLines(ctx, s, f, maxW) {
  ctx.font = f; const words = s.split(' '); const lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur); return lines;
}

// ---------------------------------------------------------------- background studio
let DUST = [];
function studio(ctx, t, night) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.5, H * 0.8);
  g.addColorStop(0, mix(C.bg2, '#0A1426', night)); g.addColorStop(1, mix('#081325', '#04080F', night));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // two soft follow spots from the top corners
  for (const [x0, a] of [[-120, 0.55], [W + 120, -0.55]]) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const sg = ctx.createLinearGradient(x0, 0, W / 2, H * 0.7); sg.addColorStop(0, `rgba(120,200,255,${0.10 * (1 - night * 0.6)})`); sg.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(x0 - 40, -20); ctx.lineTo(x0 + 40, -20); ctx.lineTo(W / 2 + 420 * Math.sign(-a) * -1 + 260, H * 0.78); ctx.lineTo(W / 2 - 260 + 420 * Math.sign(-a) * -1 * 0, H * 0.78); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // glossy floor + reflection pool under the phone
  const fg = ctx.createLinearGradient(0, H * 0.78, 0, H); fg.addColorStop(0, 'rgba(255,255,255,0.04)'); fg.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = fg; ctx.fillRect(0, H * 0.78, W, H * 0.22);
  const pg = ctx.createRadialGradient(W / 2, H * 0.84, 20, W / 2, H * 0.84, 420); pg.addColorStop(0, 'rgba(65,236,174,0.18)'); pg.addColorStop(1, 'rgba(65,236,174,0)');
  ctx.save(); ctx.translate(W / 2, H * 0.84); ctx.scale(1, 0.22); ctx.translate(-W / 2, -H * 0.84); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(W / 2, H * 0.84, 420, 0, TAU); ctx.fill(); ctx.restore();
  // slow dust in the light
  for (const d of DUST) { const y = (d.y - t * d.v * 30 + H * 2) % H, x = d.x + Math.sin(t * 0.5 + d.p) * 20; ctx.fillStyle = `rgba(200,230,255,${d.a * (1 - night * 0.5)})`; ctx.beginPath(); ctx.arc(x, y, d.r, 0, TAU); ctx.fill(); }
  // stars for the 3 AM round
  if (night > 0) for (let i = 0; i < 50; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = `rgba(255,255,255,${night * (0.25 + 0.5 * tw * hash01(i, 3))})`; ctx.beginPath(); ctx.arc(hash01(i, 1) * W, hash01(i, 2) * H * 0.55, 1.5 + 1.5 * hash01(i, 4), 0, TAU); ctx.fill(); }
}

// ---------------------------------------------------------------- scoreboard
const HP = [[0, 1], [V.naf + 0.45, 0.66], [V.r2A + 0.45, 0.33], [V.booked + 0.45, 0.1], [V.ko, 0]];
function hp(t) { let v = 1, last = -9; for (const [t0, h] of HP) if (t >= t0) { v = h; last = t0; } return { v, hit: t - last }; }
function scoreboard(ctx, t) {
  const k = sp(t, 0.05, SPRING.bouncy); if (k <= 0.01) return;
  const { v, hit } = hp(t), y = 150 + (1 - k) * -260;
  const shake = hit < 0.4 ? Math.sin(hit * 60) * 10 * (1 - hit / 0.4) : 0;
  ctx.save(); ctx.translate(W / 2 + shake, y);
  // plate
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -500, 6, 1000, 196, 36); ctx.fill();
  const pg = ctx.createLinearGradient(0, 0, 0, 190); pg.addColorStop(0, '#1F3A62'); pg.addColorStop(1, '#122542');
  ctx.fillStyle = pg; rrect(ctx, -500, 0, 1000, 190, 36); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; rrect(ctx, -500, 0, 1000, 190, 36); ctx.stroke();
  // names (RTL: the customer on the right, the bot on the left)
  const dare = E.inOutCubic(prog(t, V.dare, V.dare + 0.35));
  const nameR = dare > 0.5 ? 'إنت؟' : 'العميل';
  ctx.save(); ctx.translate(250, 66); ctx.scale(1, Math.abs(Math.cos(dare * Math.PI)) || 0.01); tA(ctx, nameR, 0, 16, 50, dare > 0.5 ? C.gold : C.cream); ctx.restore();
  tA(ctx, 'البوت', -250, 82, 50, C.cream);
  // bars
  const bar = (x, w, val, col, dir, flash) => {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, x, 118, w, 36, 18); ctx.fill();
    const ww = w * val; ctx.fillStyle = flash > 0 ? mix(col, '#FFFFFF', flash) : col; rrect(ctx, dir > 0 ? x : x + w - ww, 118, Math.max(0.1, ww), 36, 18); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; rrect(ctx, dir > 0 ? x + 6 : x + w - ww + 6, 122, Math.max(0, ww - 12), 8, 4); ctx.fill();
  };
  const flash = hit < 0.25 ? 1 - hit / 0.25 : 0;
  const dispV = dare > 0.5 ? E.outCubic(prog(t, V.dare + 0.2, V.dare + 0.8)) : v;   // the viewer starts with a full bar
  bar(40, 420, dispV, dare > 0.5 ? C.gold : C.coral, -1, dare > 0.5 ? 0 : flash);
  bar(-460, 420, 1, C.mint, 1, 0);
  // VS medallion
  const vk = sp(t, 0.25, SPRING.bouncy);
  const bp = 1 + 0.06 * Math.exp(-((t / 0.5) % 1) * 7);
  ctx.save(); ctx.translate(0, 95); ctx.scale(vk * bp, vk * bp); ctx.translate(0, -95); const vg = ctx.createRadialGradient(0, 90, 10, 0, 90, 90); vg.addColorStop(0, '#FFE08A'); vg.addColorStop(1, '#E2A21E');
  ctx.fillStyle = vg; ctx.beginPath(); ctx.arc(0, 95, 66, 0, TAU); ctx.fill(); ctx.strokeStyle = '#FFF2C4'; ctx.lineWidth = 5; ctx.stroke();
  tL(ctx, 'VS', 0, 115, 56, '#4A2C00', 'center', D, 800); ctx.restore();
  if (t > V.ko && t < V.dare) { const ck = E.outCubic(prog(t, V.ko, V.ko + 0.3)); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(250, 20); ctx.lineTo(250 - 40 * ck, 80 * ck); ctx.lineTo(250 + 30 * ck, 120 * ck); ctx.lineTo(250 - 20 * ck, 180 * ck); ctx.moveTo(250 - 40 * ck, 80 * ck); ctx.lineTo(250 - 120 * ck, 110 * ck); ctx.stroke(); }
  // hit spark on the customer's bar
  if (hit < 0.35 && t > 1) for (let i = 0; i < 10; i++) { const a = hash01(i, Math.floor(t * 0 + v * 10)) * TAU, r = 30 + 160 * (hit / 0.35); ctx.strokeStyle = `rgba(255,220,120,${1 - hit / 0.35})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(40 + 420 * (1 - v) + Math.cos(a) * r * 0.4, 136 + Math.sin(a) * r * 0.4); ctx.lineTo(40 + 420 * (1 - v) + Math.cos(a) * r, 136 + Math.sin(a) * r); ctx.stroke(); }
  ctx.restore();
}

// ---------------------------------------------------------------- the phone (ring)
const ROUNDS = [
  { from: 0, q: 'عندكم خصم 50% على الكشف؟', tq: V.r1Q + 0.15, ttype: V.botQ, a: 'مفيش خصومات حالياً، سعر الكشف 300 جنيه وأقرب ميعاد بكرة الساعة 5:00', ta: V.naf, badge: 'من بياناتك بس', tb: V.r1A + 0.3, latin: false },
  { from: V.r2L - 0.1, q: 'Do you have any slots tomorrow?', tq: V.r2Q + 0.1, ttype: V.r2Q + 1.0, a: 'Yes! Tomorrow at 5:00 or 6:30 PM. Which one works for you?', ta: V.r2A, badge: 'عربي ⇄ English', tb: V.r2A + 0.5, latin: true },
  { from: V.r3L - 0.1, q: 'عايز أحجز بكرة الساعة 5', tq: V.r3Q + 0.15, ttype: V.r3Q + 1.1, a: 'تم الحجز بكرة الساعة 5:00، وهبعتلك تذكير قبل الميعاد', ta: V.booked, badge: 'اتسجّل في الشيت', tb: V.sheet + 0.1, latin: false, night: true },
];
const SPINS = [[V.r2L - 0.3, V.r2L + 0.25], [V.r3L - 0.3, V.r3L + 0.25], [V.dare - 0.2, V.dare + 0.35]];
function roundAt(t) { let r = 0; ROUNDS.forEach((R, i) => { if (t >= R.from) r = i; }); return r; }
function bubble(ctx, x, y, maxW, text, k, { mine = false, latin = false, time = '', reveal = 1 } = {}) {
  if (k <= 0.01) return 0;
  const f = font(41, 600, UI); const lines = wrapLines(ctx, text, f, maxW - 56);
  ctx.font = f; const w = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56), h = lines.length * 56 + 58;
  const bx = mine ? x - w : x;   // mine = bot reply (left side in RTL chat = outgoing on the left for the business view)
  ctx.save(); ctx.translate(bx + (mine ? w : 0), y); ctx.scale(k, k); ctx.translate(-(mine ? w : 0), 0);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; rrect(ctx, 3, 5, w, h, 22); ctx.fill();
  ctx.fillStyle = mine ? C.out : C.inc; rrect(ctx, 0, 0, w, h, 22); ctx.fill();
  ctx.font = f; ctx.fillStyle = C.ink; ctx.direction = latin ? 'ltr' : 'rtl'; ctx.textAlign = latin ? 'left' : 'right';
  const total = text.split(' ').length; let shown = Math.ceil(total * clamp(reveal));
  lines.forEach((l, i) => { const ws = l.split(' '); const take = Math.max(0, Math.min(ws.length, shown)); shown -= ws.length; if (take > 0) ctx.fillText(ws.slice(0, take).join(' '), latin ? 28 : w - 28, 52 + i * 56); });
  ctx.font = font(22, 600, UI); ctx.fillStyle = '#7A8496'; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.fillText(time, 24, h - 14);
  if (mine) { ctx.strokeStyle = '#34B7F1'; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (const dx of [w - 58, w - 46]) { ctx.beginPath(); ctx.moveTo(dx, h - 24); ctx.lineTo(dx + 6, h - 18); ctx.lineTo(dx + 16, h - 30); ctx.stroke(); } }
  ctx.restore();
  return h;
}
function screen(ctx, t, pw, ph, ri) {
  const R = ROUNDS[ri];
  // header
  ctx.fillStyle = C.chat; rrect(ctx, 0, 0, pw, ph, 54); ctx.fill();
  ctx.save(); rrect(ctx, 0, 0, pw, ph, 54); ctx.clip();
  // wallpaper doodles
  ctx.strokeStyle = 'rgba(0,0,0,0.035)'; ctx.lineWidth = 3; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(hash01(i, 1) * pw, hash01(i, 2) * ph, 10 + 16 * hash01(i, 3), 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#123A5E'; ctx.fillRect(0, 0, pw, 150);
  ctx.fillStyle = C.mint; ctx.beginPath(); ctx.arc(pw - 80, 92, 40, 0, TAU); ctx.fill();
  ctx.fillStyle = C.mintInk; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(pw - 96 + i * 16, 92, 5, 0, TAU); ctx.fill(); }
  tA(ctx, 'العيادة', pw - 140, 88, 38, '#FFFFFF', { face: UI, weight: 700, align: 'right' });
  const typing = t > R.ttype && t < R.ta;
  tA(ctx, typing ? 'بيكتب…' : 'بوت نستا · متصل', pw - 140, 126, 26, typing ? C.mint : '#A9C2DB', { face: UI, weight: 600, align: 'right' });
  // clock chip for the 3 AM round
  if (R.night) { const k = sp(t, V.r3L + 0.2, SPRING.bouncy); if (k > 0.01) { ctx.save(); ctx.translate(pw / 2, 210); ctx.scale(k, k); ctx.fillStyle = '#1D2D4A'; rrect(ctx, -110, -30, 220, 60, 30); ctx.fill(); tL(ctx, '3:00 AM', 14, 13, 32, '#FFFFFF'); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(-70, 0, 14, 0, TAU); ctx.fill(); ctx.fillStyle = '#1D2D4A'; ctx.beginPath(); ctx.arc(-63, -5, 12, 0, TAU); ctx.fill(); ctx.restore(); } }
  // hook: the customer warns he has tricky questions
  if (ri === 0 && t < V.r1Q + 0.1) { const hk = sp(t, 0.45, SPRING.bouncy) * (1 - clamp((t - V.r1Q + 0.15) / 0.2)); bubble(ctx, 40, 210, pw - 150, 'عندي ليك كام سؤال صعب…', hk, { time: '11:41 PM' }); }
  // messages
  const qk = sp(t, R.tq, SPRING.bouncy);
  const qh = bubble(ctx, 40, R.night ? 280 : 210, pw - 150, R.q, qk, { latin: R.latin, time: R.night ? '3:00 AM' : '11:42 PM' });
  // the trap marker on the question
  if (qk > 0.5 && t < R.ta + 0.2) { const k = sp(t, R.tq + 0.25, SPRING.bouncy); ctx.save(); ctx.translate(pw - 70, (R.night ? 280 : 210) + 10); ctx.scale(k, k); ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.stroke(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); ctx.restore(); }
  const ay = (R.night ? 280 : 210) + (qh || 100) + 40;
  if (typing) { ctx.save(); ctx.translate(pw - 40 - 150, ay); ctx.fillStyle = C.out; rrect(ctx, 0, 0, 150, 80, 22); ctx.fill(); for (let i = 0; i < 3; i++) { ctx.fillStyle = C.mintInk; ctx.globalAlpha = 0.3 + 0.7 * Math.max(0, Math.sin(t * 10 - i)); ctx.beginPath(); ctx.arc(45 + i * 30, 40, 9, 0, TAU); ctx.fill(); } ctx.restore(); }
  const ak = sp(t, R.ta, SPRING.bouncy);
  bubble(ctx, pw - 40, ay, pw - 150, R.a, ak, { mine: true, latin: R.latin, time: R.night ? '3:00 AM' : '11:42 PM', reveal: (t - R.ta) / 1.1 });
  ctx.restore();
}
let LOGO = null;
function phoneBack(ctx, pw, ph, t) {
  const g = ctx.createLinearGradient(0, 0, pw, ph); g.addColorStop(0, '#0F1E33'); g.addColorStop(1, '#0F1E33');
  ctx.fillStyle = g; rrect(ctx, 0, 0, pw, ph, 54); ctx.fill();
  ctx.strokeStyle = 'rgba(65,236,174,0.6)'; ctx.lineWidth = 4; rrect(ctx, 18, 18, pw - 36, ph - 36, 42); ctx.stroke();
  if (LOGO) { const lw = pw - 60, lh = lw * 520 / 1640; ctx.drawImage(LOGO, 0, 0, 1640, 520, 30, ph * 0.5 - lh / 2, lw, lh); }
  const sw = ((t * 0.4) % 1.6) - 0.3; const sg = ctx.createLinearGradient(sw * pw - 120, 0, sw * pw + 120, ph); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.08)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; rrect(ctx, 0, 0, pw, ph, 54); ctx.fill();
}
function phone(ctx, t) {
  const pw = 700, ph = 1060;
  // entrance flip (frame 0 already moving) + round spins
  let ang = lerp(-0.85, 0, E.outBack(prog(t, 0, 0.5), 1.3));
  for (const [a, b] of SPINS) if (t > a) ang += TAU * E.inOutCubic(prog(t, a, b)) * (a === SPINS[2][0] ? 0.5 : 1);
  const cx = W / 2, cy = lerp(H * 0.585, H * 0.40, E.inOutCubic(prog(t, V.dare, V.dare + 0.6)));
  const sc = lerp(1, 0.72, E.inOutCubic(prog(t, V.dare, V.dare + 0.6))) * (1 + 0.012 * Math.sin(t * 1.6));
  ang += 0.09 * Math.sin(t * 0.9) * (t < V.dare ? 1 : 0.4);
  const cs = Math.cos(ang), facing = cs >= 0;
  const ri = roundAt(t);
  const shake = (() => { const h = hp(t).hit; return h < 0.3 && t < V.dare ? Math.sin(h * 70) * 8 * (1 - h / 0.3) : 0; })();
  ctx.save(); ctx.translate(cx + shake, cy + Math.sin(t * 1.3) * 10); ctx.scale(sc, sc);
  // floor reflection + shadow
  ctx.save(); ctx.scale(Math.abs(cs) * 0.9 + 0.1, 1); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, ph / 2 + 70, pw * 0.5, 40, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.transform(Math.max(0.02, Math.abs(cs)), Math.sin(ang) * 0.12, 0, 1, 0, 0);
  ctx.translate(-pw / 2, -ph / 2);
  // body
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, 14, 30, pw, ph, 70); ctx.fill();
  const bg = ctx.createLinearGradient(0, 0, pw, 0); bg.addColorStop(0, '#2A2F3A'); bg.addColorStop(0.5, '#151821'); bg.addColorStop(1, '#2A2F3A');
  ctx.fillStyle = bg; rrect(ctx, -16, -16, pw + 32, ph + 32, 70); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3; rrect(ctx, -16, -16, pw + 32, ph + 32, 70); ctx.stroke();
  if (facing && t < V.dare + 0.1) screen(ctx, t, pw, ph, ri); else phoneBack(ctx, pw, ph, t);
  if (facing && t < V.dare + 0.1) { ctx.fillStyle = '#0B0D12'; rrect(ctx, pw / 2 - 70, 18, 140, 34, 17); ctx.fill(); }
  // edge darkening while turning
  ctx.fillStyle = `rgba(0,0,0,${0.5 * (1 - Math.abs(cs))})`; rrect(ctx, 0, 0, pw, ph, 54); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- badges, banners, sheet, K.O.
function badge(ctx, t, R) {
  const k = sp(t, R.tb, SPRING.bouncy) * (1 - clamp((t - (ROUNDS[ROUNDS.indexOf(R) + 1]?.from ?? V.win) + 0.35) / 0.25));
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(W / 2, H * 0.865); ctx.scale(k, k);
  ctx.font = font(48, 800, D); const w = ctx.measureText(R.badge).width + 150;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -w / 2 + 6, -44, w, 96, 48); ctx.fill();
  ctx.fillStyle = C.mint; rrect(ctx, -w / 2, -50, w, 96, 48); ctx.fill();
  tA(ctx, R.badge, 30, 16, 48, C.mintInk);
  ctx.fillStyle = C.mintInk; ctx.beginPath(); ctx.arc(-w / 2 + 56, -2, 26, 0, TAU); ctx.fill(); check(ctx, -w / 2 + 56, -2, 26, C.mint, 6);
  ctx.restore();
}
function banner(ctx, t, text, t0, t1, { y = 470, size = 76, col = C.gold } = {}) {
  if (t < t0 - 0.05 || t > t1 + 0.35) return;
  const k = sp(t, t0, SPRING.bouncy), out = E.inBack(prog(t, t1, t1 + 0.3), 1.5);
  ctx.save(); ctx.translate(W / 2 + out * -W, y); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); ctx.rotate(-0.02);
  ctx.font = font(size, 800, D); const w = ctx.measureText(text).width + 120;
  ctx.globalAlpha = clamp(k * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(-w / 2 + 30 + 6, -size * 0.75 + 8); ctx.lineTo(w / 2 + 6, -size * 0.75 + 8); ctx.lineTo(w / 2 - 30 + 6, size * 0.55 + 8); ctx.lineTo(-w / 2 + 6, size * 0.55 + 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w / 2 + 30, -size * 0.75); ctx.lineTo(w / 2, -size * 0.75); ctx.lineTo(w / 2 - 30, size * 0.55); ctx.lineTo(-w / 2, size * 0.55); ctx.closePath(); ctx.fill();
  tA(ctx, text, 0, size * 0.22, size, '#2A1A00');
  ctx.restore();
}
function sheetCard(ctx, t) {
  const k = sp(t, V.sheet, SPRING.bouncy) * (1 - clamp((t - V.win + 0.2) / 0.3)); if (k <= 0.01) return;
  ctx.save(); ctx.translate(W / 2 + 230, H * 0.71); ctx.rotate(0.05); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -236, -96, 480, 204, 22); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; rrect(ctx, -240, -104, 480, 204, 22); ctx.fill();
  ctx.fillStyle = '#1E8E4E'; ctx.beginPath(); ctx.roundRect(-240, -104, 480, 54, [22, 22, 0, 0]); ctx.fill();
  tA(ctx, 'الحجوزات', 210, -66, 30, '#FFFFFF', { face: UI, weight: 700, align: 'right' });
  const rows = [['كريم', 'الأربعاء 3:30'], ['أحمد', 'بكرة 5:00']];
  rows.forEach((r, i) => { const yy = -12 + i * 62; const rk = i === 1 ? clamp((t - V.sheet - 0.3) / 0.4) : 1; if (i === 1 && rk > 0) { ctx.fillStyle = 'rgba(65,236,174,0.35)'; ctx.fillRect(-230, yy - 30, 460, 54); } if (rk > 0) { ctx.globalAlpha = rk; tA(ctx, r[0], 200, yy + 8, 30, C.ink, { face: UI, weight: 600, align: 'right' }); tA(ctx, r[1], 40, yy + 8, 30, C.ink, { face: UI, weight: 600 }); check(ctx, -180, yy, 26, '#1E8E4E', 5); ctx.globalAlpha = 1; } });
  ctx.restore();
}
function knockout(ctx, t) {
  if (t < V.ko - 0.05 || t > V.dare + 0.2) return;
  const k = sp(t, V.ko, { stiffness: 260, damping: 14, mass: 1 }), out = E.inBack(prog(t, V.dare - 0.25, V.dare + 0.1), 1.6);
  // gold rays
  ctx.save(); ctx.translate(W / 2, H * 0.5); ctx.rotate(t * 0.3); ctx.globalAlpha = 0.35 * clamp(k) * (1 - out);
  for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,201,74,0.6)' : 'rgba(255,201,74,0.2)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1400, (i / 16) * TAU, ((i + 0.5) / 16) * TAU); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.translate(W / 2, H * 0.5 - out * 200); const s = lerp(2.4, 1, Math.min(1, k)) * (1 - out); ctx.scale(s, s); ctx.rotate(-0.08);
  ctx.globalAlpha = clamp(k * 3);
  ctx.font = font(250, 800, D); ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3A2200'; ctx.lineWidth = 28; ctx.strokeText('K.O.', 0, 80);
  const g = ctx.createLinearGradient(0, -120, 0, 90); g.addColorStop(0, '#FFF0B0'); g.addColorStop(0.5, '#FFC94A'); g.addColorStop(1, '#E08E12'); ctx.fillStyle = g; ctx.fillText('K.O.', 0, 80);
  ctx.restore();
  // ribbons of confetti (few, slow)
  for (let i = 0; i < 26; i++) { const ph = t - V.ko; if (ph < 0) continue; const x = hash01(i, 1) * W, y = -60 + ph * (260 + 200 * hash01(i, 2)), r = ph * 4 + i; ctx.save(); ctx.translate(x + Math.sin(ph * 3 + i) * 30, y); ctx.rotate(r); ctx.globalAlpha = 1 - out; ctx.fillStyle = [C.mint, C.gold, '#FFFFFF', C.coral][i % 4]; ctx.fillRect(-10, -5, 20, 10); ctx.restore(); }
}
function cta(ctx, t) {
  const k1 = sp(t, V.cta, SPRING.bouncy), k2 = sp(t, V.cta + 0.5, SPRING.bouncy), k3 = sp(t, V.cta2, SPRING.bouncy);
  if (k1 > 0.01) { ctx.save(); ctx.translate(W / 2, H * 0.66); ctx.scale(k1, k1); tA(ctx, 'ابعت ديمو على واتساب', 0, 0, 74, C.cream); ctx.restore(); }
  if (k2 > 0.01) {
    ctx.save(); ctx.translate(W / 2, H * 0.66 + 140); ctx.scale(k2, k2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -384, -72, 780, 156, 78); ctx.fill();
    ctx.fillStyle = C.mint; rrect(ctx, -390, -80, 780, 156, 78); ctx.fill();
    tL(ctx, '010 9311 4446', -70, 22, 64, C.mintInk); tA(ctx, 'واتساب', 340, 18, 44, C.mintInk, { face: UI, weight: 700, align: 'right' });
    ctx.fillStyle = 'rgba(6,64,44,0.3)'; ctx.fillRect(150, -44, 3, 88);
    ctx.restore();
    if (t > 28.0) for (let r = 0; r < 2; r++) { const ph = ((t - 28.0) * 0.7 + r * 0.5) % 1; ctx.strokeStyle = `rgba(65,236,174,${0.55 * (1 - ph)})`; ctx.lineWidth = 5; rrect(ctx, W / 2 - 390 - ph * 50, H * 0.66 + 60 - ph * 50, 780 + ph * 100, 156 + ph * 100, 120); ctx.stroke(); }
  }
  if (k3 > 0.01) { ctx.save(); ctx.translate(W / 2, H * 0.66 + 320); ctx.scale(k3, k3); ctx.rotate(-0.03); tA(ctx, 'وجرّب تحرجه!', 0, 0, 80, C.gold); ctx.restore(); }
}


// ---------------------------------------------------------------- camera rig (zoom/tilt about a focus)
const PC = [W / 2, H * 0.585];
const QPOS = [PC[0] - 140, PC[1] - 270], APOS = [PC[0] + 90, PC[1] - 90];
const CAMK = [
  [0, PC[0], PC[1], 1.28, 0.03], [0.9, PC[0], PC[1], 1.0, 0], [V.r1L, PC[0], PC[1], 1.04, -0.035], [V.r1Q, PC[0], PC[1] - 40, 1.02, 0],
  [V.r1Q + 0.6, QPOS[0], QPOS[1], 1.32, -0.015], [V.naf, QPOS[0] + 60, QPOS[1] + 80, 1.3, 0], [V.naf + 0.6, APOS[0], APOS[1], 1.3, 0.012], [V.r1A + 0.8, PC[0], PC[1], 1.0, 0],
  [V.r2L, PC[0], PC[1], 1.06, 0.04], [V.r2Q + 0.5, QPOS[0], QPOS[1], 1.32, 0.01], [V.r2A, QPOS[0] + 60, QPOS[1] + 80, 1.3, 0], [V.r2A + 0.6, APOS[0], APOS[1], 1.3, -0.012], [V.r2A + 1.4, PC[0], PC[1], 1.0, 0],
  [V.r3L, PC[0], PC[1], 1.06, -0.04], [V.r3Q + 0.5, QPOS[0], QPOS[1] + 70, 1.3, 0], [V.booked, QPOS[0] + 60, QPOS[1] + 150, 1.28, 0], [V.booked + 0.6, APOS[0], APOS[1] + 70, 1.28, 0.012],
  [V.sheet + 0.3, PC[0] + 120, PC[1] + 120, 1.1, 0], [V.win, PC[0], PC[1], 0.94, -0.03], [V.ko, PC[0], PC[1], 1.02, 0], [V.dare, PC[0], PC[1], 1.0, 0], [31, PC[0], PC[1], 1.0, 0],
];
const KICKS = [V.naf, V.r2A, V.booked, V.naf + 0.45, V.r2A + 0.45, V.booked + 0.45];
function cam(t) {
  let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1][0]) i++;
  const [t0, x0, y0, z0, r0] = CAMK[i], [t1, x1, y1, z1, r1] = CAMK[i + 1], e = E.inOutCubic(clamp((t - t0) / (t1 - t0)));
  let z = lerp(z0, z1, e), sx = 0, sy = 0;
  for (const k of KICKS) if (t > k && t < k + 0.5) z += 0.06 * Math.exp(-(t - k) * 9) * Math.cos((t - k) * 30);
  if (t > V.ko && t < V.ko + 0.9) { const a = 26 * Math.exp(-(t - V.ko) * 5); sx = noise1(t * 40, 3) * a; sy = noise1(t * 40, 8) * a; z += 0.1 * Math.exp(-(t - V.ko) * 3); }
  return { fx: lerp(x0, x1, e), fy: lerp(y0, y1, e), z, rot: lerp(r0, r1, e), sx, sy };
}
function applyCam(ctx, c) { ctx.translate(PC[0] + c.sx, PC[1] + c.sy); ctx.rotate(c.rot); ctx.scale(c.z, c.z); ctx.translate(-c.fx, -c.fy); }
function camPt(c, x, y) { const dx = (x - c.fx) * c.z, dy = (y - c.fy) * c.z, cs = Math.cos(c.rot), sn = Math.sin(c.rot); return [PC[0] + c.sx + dx * cs - dy * sn, PC[1] + c.sy + dx * sn + dy * cs]; }
// punches: the customer's trap flies from his corner into the chat; the bot's answer flies back and hits his bar
function comet(ctx, x0, y0, x1, y1, p, col, size) {
  if (p <= 0 || p >= 1) return;
  const e = E.inCubic(p), x = lerp(x0, x1, e), y = lerp(y0, y1, e) - Math.sin(Math.PI * e) * 120;
  for (let k = 1; k <= 8; k++) { const ee = E.inCubic(Math.max(0, p - k * 0.03)); const tx = lerp(x0, x1, ee), ty = lerp(y0, y1, ee) - Math.sin(Math.PI * ee) * 120; ctx.fillStyle = col.replace('A', String(0.5 * (1 - k / 9))); ctx.beginPath(); ctx.arc(tx, ty, size * (1 - k / 10), 0, TAU); ctx.fill(); }
  const g = ctx.createRadialGradient(x, y, 2, x, y, size * 1.8); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.4, col.replace('A', '0.95')); g.addColorStop(1, col.replace('A', '0'));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, size * 1.8, 0, TAU); ctx.fill();
}
function impact(ctx, x, y, age, col) {
  if (age < 0 || age > 0.45) return; const p = age / 0.45;
  ctx.strokeStyle = col.replace('A', String(1 - p)); ctx.lineWidth = 10 * (1 - p); ctx.beginPath(); ctx.arc(x, y, 30 + 160 * E.outCubic(p), 0, TAU); ctx.stroke();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + 0.3, r0 = 40 + 120 * p, r1 = r0 + 50 * (1 - p); ctx.lineWidth = 6 * (1 - p); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke(); }
}
function fights(ctx, t, c) {
  const CUST = [W / 2 + 250, 290];
  ROUNDS.forEach((R) => {
    const q = camPt(c, QPOS[0] + 40, QPOS[1] + (R.night ? 70 : 0)), a = camPt(c, APOS[0], APOS[1] + (R.night ? 70 : 0));
    comet(ctx, CUST[0], CUST[1], q[0], q[1], (t - (R.tq - 0.35)) / 0.35, 'rgba(255,107,91,A)', 26);
    impact(ctx, q[0], q[1], t - R.tq, 'rgba(255,107,91,A)');
    comet(ctx, a[0], a[1], CUST[0] - 140, CUST[1] + 0, (t - (R.ta + 0.1)) / 0.35, 'rgba(65,236,174,A)', 30);
    impact(ctx, CUST[0] - 140, CUST[1], t - (R.ta + 0.45), 'rgba(65,236,174,A)');
  });
}
// the crowd: rows of silhouettes that bounce on the beat, phone flashes, arms up on the K.O.
function crowd(ctx, t) {
  const beat = (t / 0.5) % 1, hype = t > V.ko ? 1 : t > V.win ? 0.5 : 0.15;
  for (let row = 0; row < 3; row++) {
    const y0 = H - 210 + row * 80, n = 9 + row * 2, col = ['#0B162A', '#081222', '#050C18'][row];
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (W / n) + (row % 2 ? 20 : -20) + Math.sin(i * 7.1) * 12;
      const bounce = Math.max(0, Math.sin((beat + i * 0.13 + row * 0.3) * TAU)) * (8 + 26 * hype);
      const y = y0 - bounce, r = 36 + row * 6 + (i % 3) * 3;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillRect(x - r * 1.5, y + r * 0.6, r * 3, 260);
      if (hype > 0.6 && (i + row) % 2 === 0) { ctx.strokeStyle = col; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - r, y + 20); ctx.lineTo(x - r * 1.4, y - 80 - bounce); ctx.moveTo(x + r, y + 20); ctx.lineTo(x + r * 1.4, y - 80 - bounce); ctx.stroke(); }
      if (hash01(i * 13 + row, Math.floor(t * 3)) > 0.93) { const g = ctx.createRadialGradient(x + 10, y - 30, 1, x + 10, y - 30, 40); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + 10, y - 30, 40, 0, TAU); ctx.fill(); }
    }
  }
}
// round announcements slam big in the centre, then settle under the scoreboard
function slam(ctx, t, text, t0, t1, { size = 80, col = C.gold, ink = '#2A1A00' } = {}) {
  if (t < t0 - 0.05 || t > t1 + 0.35) return;
  const k = sp(t, t0, { stiffness: 260, damping: 16, mass: 1 }), settle = E.inOutCubic(prog(t, t0 + 0.55, t0 + 0.9)), out = E.inBack(prog(t, t1, t1 + 0.3), 1.5);
  const y = lerp(H * 0.42, 470, settle), sc = lerp(1.9, 1, settle) * (0.4 + 0.6 * Math.min(1.1, k));
  ctx.save(); ctx.translate(W / 2 - out * W, y); ctx.rotate(lerp(-0.08, -0.02, settle)); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 3);
  ctx.font = font(size, 800, D); const w = ctx.measureText(text).width + 120;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(-w / 2 + 36, -size * 0.75 + 8); ctx.lineTo(w / 2 + 6, -size * 0.75 + 8); ctx.lineTo(w / 2 - 24, size * 0.55 + 8); ctx.lineTo(-w / 2 + 6, size * 0.55 + 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w / 2 + 30, -size * 0.75); ctx.lineTo(w / 2, -size * 0.75); ctx.lineTo(w / 2 - 30, size * 0.55); ctx.lineTo(-w / 2, size * 0.55); ctx.closePath(); ctx.fill();
  // gold sweep across the plate
  const sw = clamp((t - t0) / 0.6); if (sw < 1) { ctx.save(); ctx.clip(); const g = ctx.createLinearGradient(-w / 2 + sw * w * 1.4 - 160, 0, -w / 2 + sw * w * 1.4, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-w, -size, w * 2, size * 2); ctx.restore(); }
  tA(ctx, text, 0, size * 0.22, size, ink);
  ctx.restore();
}
function lightPulse(ctx, t) {
  const beat = (t / 0.5) % 1, k = Math.exp(-beat * 6) * (t > V.ko ? 0.22 : 0.09);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [x, a] of [[W * 0.15, 0.35], [W * 0.85, -0.35]]) { const g = ctx.createLinearGradient(x, 0, x + a * 600, H * 0.8); g.addColorStop(0, `rgba(65,236,174,${k})`); g.addColorStop(1, 'rgba(65,236,174,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + a * 900 + 200, H); ctx.lineTo(x + a * 900 - 200, H); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- hits
const HITS = [
  [B(0.0), 'phone flips in', 'whoosh', { len: 0.45 }], [B(0.08), 'board drops', 'thud'], [B(0.3), 'VS', 'impact'],
  [B(V.r1L), 'round 1 bell', 'bell', { pitch: 'D6' }], [B(V.r1Q + 0.15), 'question', 'pop', { pitch: 'C5' }], [B(V.r1Q + 0.4), 'trap', 'click'],
  [B(V.naf), 'parry 1', 'thud'], [B(V.naf + 0.05), 'hit 1', 'boing', { pitch: 'E4', to: 'A3' }], [B(V.r1A + 0.3), 'badge', 'pop', { pitch: 'E6' }],
  [B(V.r2L - 0.3), 'spin', 'whoosh', { len: 0.5 }], [B(V.r2L), 'round 2 bell', 'bell', { pitch: 'D6' }], [B(V.r2Q + 0.1), 'question', 'pop', { pitch: 'C5' }],
  [B(V.r2A), 'parry 2', 'thud'], [B(V.r2A + 0.15), 'hit 2', 'boing', { pitch: 'E4', to: 'A3' }], [B(V.r2A + 0.5), 'badge', 'pop', { pitch: 'E6' }],
  [B(V.r3L - 0.3), 'spin', 'whoosh', { len: 0.5 }], [B(V.r3L), 'round 3 bell', 'bell', { pitch: 'D6' }], [B(V.r3Q + 0.15), 'question', 'pop', { pitch: 'C5' }],
  [B(V.booked), 'parry 3', 'thud'], [B(V.booked + 0.1), 'hit 3', 'boing', { pitch: 'E4', to: 'A3' }], [B(V.sheet), 'sheet', 'type', { len: 0.5, n: 6 }],
  [B(V.ko - 0.35), 'riser', 'riser', { len: 0.35 }], [B(V.ko), 'K.O.', 'impact'], [B(V.ko + 0.1), 'crowd', 'crash', { len: 1.6 }],
  [B(V.dare - 0.2), 'spin to you', 'whoosh', { len: 0.5 }], [B(V.dare + 0.2), 'name flips', 'click'],
  [B(V.cta), 'cta', 'pop', { pitch: 'D6' }], [B(V.cta + 0.5), 'pill', 'pop', { pitch: 'G6' }], [B(V.cta2), 'dare', 'thud'], [B(28.0), 'pulse', 'blip', { pitch: 'D6' }],
];

// ---------------------------------------------------------------- frame
function draw(ctx, t) {
  const night = E.inOutCubic(prog(t, V.r3L - 0.2, V.r3L + 0.3)) * (1 - E.inOutCubic(prog(t, V.win - 0.2, V.win + 0.2)));
  studio(ctx, t, night);
  lightPulse(ctx, t);
  const c = cam(t);
  ctx.save(); applyCam(ctx, c);
  phone(ctx, t);
  sheetCard(ctx, t);
  ctx.restore();
  crowd(ctx, t);
  ROUNDS.forEach((R) => badge(ctx, t, R));
  scoreboard(ctx, t);
  fights(ctx, t, c);
  slam(ctx, t, 'عميل قرر يحرج البوت', V.hookA - 0.05, V.r1L - 0.15, { size: 70, col: C.cream });
  slam(ctx, t, 'الجولة ١', V.r1L, V.r2L - 0.4);
  slam(ctx, t, 'الجولة ٢', V.r2L, V.r3L - 0.4);
  slam(ctx, t, 'الجولة ٣', V.r3L, V.win - 0.3);
  slam(ctx, t, 'البوت كسب!', V.win, V.ko - 0.1, { size: 80, col: C.mint, ink: '#06402C' });
  slam(ctx, t, 'فاكر نفسك أشطر؟', V.dare + 0.1, V.cta - 0.15, { size: 76, col: C.gold });
  knockout(ctx, t);
  cta(ctx, t);
}

M.film({
  fonts: [font(100, 800, D), font(40, 700, UI), font(40, 600, UI)],
  images: { name: 'assets/logo_name.jpg' },
  hits: HITS,
  samples: 6,
  init(ctx, IMG) {
    DUST = Array.from({ length: 50 }, (_, i) => ({ x: hash01(i, 1) * W, y: hash01(i, 2) * H, v: 0.3 + hash01(i, 3), r: 1 + 2.5 * hash01(i, 4), a: 0.08 + 0.2 * hash01(i, 5), p: hash01(i, 6) * TAU }));
    if (IMG.name) { const c = document.createElement('canvas'); c.width = 1640; c.height = 520; c.getContext('2d').drawImage(IMG.name, 380, 640, 1640, 520, 0, 0, 1640, 520); LOGO = c; }
  },
  draw(ctx, u, t) { draw(ctx, t); },
  post(ctx, u, t) {
    const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.32, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.4)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
});
