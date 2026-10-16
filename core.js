"use strict";
/* Shared core: helpers, stone drawing and layout rendering. Used by every page. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
};
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Saved selections (stone & tile collection), shared with the quote form */
const selectionsList = () => store.get("wms-sel", []).map(e => { const p = stoneByIdAny(e.id); return p && { id: p.id, name: p.name, mat: p.mat, finish: e.finish || p.finishes[0] }; }).filter(Boolean);

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2800);
}

/* ---------- data ---------- */
/* The visualizer uses stones that have real photographs (see catalog.js). */
const STONE_IDS = ["carrara", "calacatta", "statuario", "arabescato", "emperador", "t-grey"];
const STONES = STONE_IDS.map(id => stoneByIdAny(id));
const stoneById = id => STONES.find(s => s.id === id) || stoneByIdAny(id);

const PATTERNS = [
  { id: "straight",   name: "Straight",   labor: 14, waste: 0.08 },
  { id: "brick",      name: "Brick",      labor: 15, waste: 0.10 },
  { id: "diagonal",   name: "Diagonal",   labor: 17, waste: 0.12 },
  { id: "checker",    name: "Checker",    labor: 17, waste: 0.10 },
  { id: "herringbone",name: "Herringbone",labor: 22, waste: 0.15 }
];
const GROUTS = [{ id: "#d8d4cc", name: "Light" }, { id: "#9c978d", name: "Grey" }, { id: "#3b3a38", name: "Charcoal" }, { id: "#c4b08a", name: "Sand" }];
const FINISHES = [{ id: "polished", name: "Polished" }, { id: "honed", name: "Honed" }, { id: "tumbled", name: "Tumbled" }];

const state = { stone: "carrara", pattern: "straight", size: 12, grout: GROUTS[0].id, finish: "polished", seedBase: 7 };

/* ---------- procedural marble ---------- */
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const shade = (h, amt) => { const f = v => Math.max(0, Math.min(255, Math.round(v + amt))); const [r, g, b] = hexToRgb(h); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const lum = h => { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

function drawVeins(ctx, x, y, w, h, stone, r) {
  for (let i = 0; i < 4; i++) { // soft clouds
    const cx = x + r() * w, cy = y + r() * h, cr = (0.4 + r() * 0.6) * Math.max(w, h);
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    rg.addColorStop(0, stone.base2 + "88"); rg.addColorStop(1, stone.base2 + "00");
    ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
  }
  const veins = 1 + Math.round(stone.strength * 2) + Math.floor(Math.min(w, h) / 110);
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = stone.vein;
  for (let v = 0; v < veins; v++) {
    const horiz = r() > 0.5, diag = (r() - 0.5) * 1.2;
    let px = horiz ? x - 10 : x + r() * w, py = horiz ? y + r() * h : y - 10;
    const main = r() < 0.5, steps = 9;
    ctx.beginPath(); ctx.moveTo(px, py);
    for (let s = 0; s < steps; s++) {
      const dx = horiz ? (w + 20) / steps : (r() - 0.5) * w * 0.2 + diag * 6;
      const dy = horiz ? (r() - 0.5) * h * 0.2 + diag * 6 : (h + 20) / steps;
      const nx = px + dx, ny = py + dy;
      ctx.quadraticCurveTo(px + dx * 0.5 + (r() - 0.5) * w * 0.08, py + dy * 0.5 + (r() - 0.5) * h * 0.08, nx, ny);
      px = nx; py = ny;
    }
    ctx.globalAlpha = (main ? 0.35 : 0.18) * (0.5 + stone.strength);
    ctx.lineWidth = main ? Math.max(1, Math.min(4, Math.min(w, h) * 0.02 * (0.5 + stone.strength))) : 0.8;
    ctx.stroke();
    ctx.globalAlpha *= 0.4; ctx.lineWidth *= 2.4; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawBands(ctx, x, y, w, h, stone, r) {
  const n = Math.max(4, Math.round(h / 9));
  ctx.strokeStyle = stone.vein; ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const yy = y + (i + r()) * h / n;
    ctx.globalAlpha = 0.12 + r() * 0.28 * (0.5 + stone.strength); ctx.lineWidth = 0.6 + r() * 2.2;
    ctx.beginPath(); ctx.moveTo(x - 5, yy);
    for (let k = 1; k <= 6; k++) ctx.quadraticCurveTo(x + (k - 0.5) * w / 6, yy + (r() - 0.5) * 5, x + k * w / 6, yy + (r() - 0.5) * 3);
    ctx.stroke();
  }
  ctx.fillStyle = stone.base2;
  const pits = Math.min(90, Math.round(w * h / 1100));
  for (let i = 0; i < pits; i++) { ctx.globalAlpha = 0.25 + r() * 0.3; ctx.beginPath(); ctx.ellipse(x + r() * w, y + r() * h, 1 + r() * 4, 0.5 + r() * 1.2, 0, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
function drawSolid(ctx, x, y, w, h, stone, r) {
  const k = Math.max(1, Math.round(stone.strength * 4));
  for (let i = 0; i < k; i++) {
    const cx = x + r() * w, cy = y + r() * h, cr = (0.3 + r() * 0.5) * Math.max(w, h);
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    rg.addColorStop(0, stone.vein + "66"); rg.addColorStop(1, stone.vein + "00");
    ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
  }
  const n = Math.min(900, Math.round(w * h / 110 * (0.3 + stone.strength)));
  for (let i = 0; i < n; i++) { ctx.fillStyle = r() > 0.5 ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.09)"; ctx.fillRect(x + r() * w, y + r() * h, 1.2, 1.2); }
}
function drawWood(ctx, x, y, w, h, stone, r) {
  const ph = Math.max(14, Math.min(w, h) * 0.17);
  for (let py = y, row = 0; py < y + h; py += ph, row++) {
    ctx.fillStyle = shade(stone.base, (r() - 0.5) * 26); ctx.fillRect(x, py, w, ph - 1);
    ctx.strokeStyle = stone.vein;
    for (let i = 0; i < 7; i++) {
      const yy = py + r() * ph; ctx.globalAlpha = 0.08 + r() * 0.2; ctx.lineWidth = 0.6 + r();
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.3, yy + (r() - 0.5) * 6, x + w * 0.6, yy + (r() - 0.5) * 6, x + w, yy + (r() - 0.5) * 4); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(x, py + ph - 1, w, 1);
    const jx = x + r() * w; ctx.fillRect(jx, py, 1, ph);
  }
}
function drawTerrazzo(ctx, x, y, w, h, stone, r) {
  const n = Math.min(220, Math.round(w * h / 520)), base = Math.min(w, h);
  for (let i = 0; i < n; i++) {
    const cx = x + r() * w, cy = y + r() * h, sz = Math.max(1.5, base * (0.012 + r() * r() * 0.05)), pts = 5 + Math.floor(r() * 3);
    ctx.fillStyle = stone.chips[Math.floor(r() * stone.chips.length)]; ctx.globalAlpha = 0.95;
    ctx.beginPath();
    for (let p = 0; p < pts; p++) { const a = p / pts * 6.283 + r() * 0.5, rr = sz * (0.6 + r() * 0.6); ctx[p ? "lineTo" : "moveTo"](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8); }
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawMosaic(ctx, x, y, w, h, stone, r) {
  ctx.fillStyle = stone.base2; ctx.fillRect(x, y, w, h);
  const u = Math.max(6, Math.min(w, h) / 9), piece = () => shade(stone.base, (r() - 0.5) * 30);
  const sh = stone.shape;
  if (sh === "hex") {
    const R = u * 0.62, dx = Math.sqrt(3) * R;
    for (let j = 0; y + j * 1.5 * R < y + h + R; j++) for (let i = -1; x + i * dx < x + w + dx; i++) {
      const cx = x + i * dx + (j % 2 ? dx / 2 : 0), cy = y + j * 1.5 * R; ctx.fillStyle = piece(); ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ctx[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); }
      ctx.fill();
    }
  } else if (sh === "penny") {
    const d = u * 0.95;
    for (let j = 0; j * d * 0.9 < h + d; j++) for (let i = -1; i * d < w + d; i++) { ctx.fillStyle = piece(); ctx.beginPath(); ctx.arc(x + i * d + (j % 2 ? d / 2 : 0), y + j * d * 0.9, d * 0.44, 0, 7); ctx.fill(); }
  } else if (sh === "subway") {
    const bw = u * 1.7, bh = u * 0.8;
    for (let j = 0; j * bh < h; j++) for (let i = -1; i * bw < w; i++) { ctx.fillStyle = piece(); ctx.fillRect(x + i * bw + (j % 2 ? bw / 2 : 0) + 1, y + j * bh + 1, bw - 2, bh - 2); }
  } else if (sh === "herringbone") {
    const q = u * 0.62;
    for (let j = -2; y + j * q < y + h + q; j++) for (let i = -2; x + i * q < x + w + q; i++) {
      const m = (((i - j) % 4) + 4) % 4; ctx.fillStyle = piece();
      if (m === 0) ctx.fillRect(x + i * q + 0.7, y + j * q + 0.7, 2 * q - 1.4, q - 1.4);
      else if (m === 3) ctx.fillRect(x + i * q + 0.7, y + j * q + 0.7, q - 1.4, 2 * q - 1.4);
    }
  } else { // chevron
    const cw = u * 0.75, rh = u * 1.1, sk = cw * 1.1;
    for (let j = -1; j * rh < h + sk; j++) for (let i = 0; i * cw < w; i++) {
      const x0 = x + i * cw, a = y + j * rh + (i % 2 ? sk : 0), b = y + j * rh + (i % 2 ? 0 : sk);
      ctx.fillStyle = piece(); ctx.beginPath(); ctx.moveTo(x0 + 0.5, a); ctx.lineTo(x0 + cw - 0.5, b); ctx.lineTo(x0 + cw - 0.5, b + rh - 1.2); ctx.lineTo(x0 + 0.5, a + rh - 1.2); ctx.fill();
    }
  }
}
/* Real stone photographs (cropped from installed projects). Loaded once; subscribers are told to redraw when they arrive. */
const stoneImgs = {}, stoneImgWatchers = [];
function onStoneImages(cb) { stoneImgWatchers.push(cb); }
function stonePhoto(stone) {
  if (!stone.img) return null;
  let e = stoneImgs[stone.img];
  if (!e) {
    e = stoneImgs[stone.img] = { img: new Image(), ok: false };
    e.img.onload = () => { e.ok = true; clearTimeout(stonePhoto.t); stonePhoto.t = setTimeout(() => stoneImgWatchers.forEach(f => f()), 30); };
    e.img.src = stone.img;
  }
  return e.ok ? e.img : null;
}
function drawPhoto(ctx, x, y, w, h, img, r) {
  const a = w / h, W = img.naturalWidth, H = img.naturalHeight;
  let sh = H * (0.6 + 0.4 * r()), sw = sh * a;
  if (sw > W) { sw = W * (0.6 + 0.4 * r()); sh = sw / a; }
  if (sh > H) { sh = H; sw = sh * a; }
  const sx = r() * (W - sw), sy = r() * (H - sh), fx = r() > .5 ? -1 : 1, fy = r() > .5 ? -1 : 1;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(fx, fy);
  ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h); ctx.restore();
}
function drawStone(ctx, x, y, w, h, stone, seed, finish = "polished") {
  const r = rng(seed), kind = stone.kind || "vein", fin = String(finish).toLowerCase(), photo = stonePhoto(stone);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (photo) drawPhoto(ctx, x, y, w, h, photo, r);
  else if (kind === "mosaic") drawMosaic(ctx, x, y, w, h, stone, r);
  else if (kind === "wood") drawWood(ctx, x, y, w, h, stone, r);
  else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, stone.base); g.addColorStop(1, stone.base2);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (kind === "band") drawBands(ctx, x, y, w, h, stone, r);
    else if (kind === "solid") drawSolid(ctx, x, y, w, h, stone, r);
    else if (kind === "terrazzo") drawTerrazzo(ctx, x, y, w, h, stone, r);
    else drawVeins(ctx, x, y, w, h, stone, r);
  }
  const rough = { tumbled: 40, leathered: 22, textured: 26, structured: 26 }[fin];
  if (rough) for (let i = 0; i < w * h / rough; i++) { ctx.fillStyle = r() > 0.5 ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.1)"; ctx.fillRect(x + r() * w, y + r() * h, 1.5, 1.5); }
  if (fin === "brushed") { ctx.fillStyle = "rgba(0,0,0,.05)"; for (let yy = y; yy < y + h; yy += 3) ctx.fillRect(x, yy, w, 1); }
  const gloss = { polished: 0.28, glossy: 0.34, satin: 0.12 }[fin];
  if (gloss) {
    const sh = ctx.createLinearGradient(x, y, x + w, y + h);
    sh.addColorStop(0, `rgba(255,255,255,${gloss})`); sh.addColorStop(0.45, "rgba(255,255,255,0)"); sh.addColorStop(1, `rgba(255,255,255,${gloss * 0.35})`);
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/* Lay tiles in a pattern across (W,H) px. tileIn = tile edge in inches, ppi = px per inch. */
function layFloor(ctx, W, H, o) {
  const { stone, pattern, tileIn, ppi, grout, finish, seed, gap = 3 } = o;
  const s = tileIn * ppi, half = gap / 2;
  const alt = stoneById(stone.pair) || stoneByIdAny(lum(stone.base) > 0.5 ? "nero" : "carrara");
  ctx.fillStyle = grout; ctx.fillRect(0, 0, W, H);
  const tile = (x, y, w, h, st, k) => drawStone(ctx, x + half, y + half, w - gap, h - gap, st, seed + k * 7919, finish);
  if (pattern === "straight") {
    for (let j = 0, k = 0; j * s < H; j++) for (let i = 0; i * s < W; i++, k++) tile(i * s, j * s, s, s, stone, k);
  } else if (pattern === "brick") {
    const bh = s / 2;
    for (let j = 0, k = 0; j * bh < H; j++) for (let i = -1; i * s < W; i++, k++) tile(i * s + (j % 2 ? s / 2 : 0), j * bh, s, bh, stone, k);
  } else if (pattern === "checker") {
    for (let j = 0, k = 0; j * s < H; j++) for (let i = 0; i * s < W; i++, k++) tile(i * s, j * s, s, s, (i + j) % 2 ? alt : stone, k);
  } else if (pattern === "diagonal") {
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI / 4);
    const R = Math.hypot(W, H) / 2 + s;
    for (let j = -Math.ceil(R / s), k = 0; j * s < R; j++) for (let i = -Math.ceil(R / s); i * s < R; i++, k++) tile(i * s, j * s, s, s, stone, k);
    ctx.restore();
  } else { // herringbone (90°): unit u, tiles are 2u x u
    const u = s / 2;
    for (let j = -2, k = 0; j * u < H + u; j++) for (let i = -2; i * u < W + u; i++, k++) {
      const m = (((i - j) % 4) + 4) % 4;
      if (m === 0) tile(i * u, j * u, 2 * u, u, stone, k);
      else if (m === 3) tile(i * u, j * u, u, 2 * u, stone, k);
    }
  }
}

/* Scroll to the quote form with an optional note; from other pages, hand the note to the home page. */
function goToQuote(msg) {
  const m = document.getElementById("qMsg");
  if (!m) { try { sessionStorage.setItem("wms-msg", msg || ""); } catch { /* ignore */ } location.href = "index.html#quote"; return; }
  if (msg) m.value = m.value && !m.value.includes(msg) ? m.value + "\n" + msg : msg;
  document.getElementById("quote").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}
