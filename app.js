"use strict";
/* Whitestone Marble Setters — front-end only. Edit CONFIG and the data tables below to customise. */
const CONFIG = { phone: "(000) 000-0000", email: "hello@example.com" };

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
const STONES = [
  { id: "carrara",   name: "Carrara",        base: "#eceae6", base2: "#d9d6d0", vein: "#8d9099", strength: 0.5, mat: 14, note: "Soft grey veining on a white-grey ground. The classic.", pair: "nero" },
  { id: "calacatta", name: "Calacatta",      base: "#f6f4ef", base2: "#e8e3d8", vein: "#6c5e4a", strength: 0.9, mat: 40, note: "Bright white with bold, dramatic veins. Statement stone.", pair: "nero" },
  { id: "nero",      name: "Nero Marquina",  base: "#1c1c1e", base2: "#2b2b2e", vein: "#f1efe9", strength: 0.55, mat: 30, note: "Deep black with fine white veining.", pair: "carrara" },
  { id: "emperador", name: "Emperador",      base: "#7a5a43", base2: "#5f432f", vein: "#d8c4a4", strength: 0.6, mat: 19, note: "Warm brown with cream fractures.", pair: "travertine" },
  { id: "travertine",name: "Travertine",     base: "#dccdb2", base2: "#cbb998", vein: "#a8946f", strength: 0.35, mat: 15, note: "Warm, earthy and naturally textured.", pair: "emperador" },
  { id: "verde",     name: "Verde Alpi",     base: "#2f4a3f", base2: "#223a31", vein: "#c9d6cc", strength: 0.7, mat: 34, note: "Rich green with white mineral veins.", pair: "carrara" }
];
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

const state = { stone: "carrara", pattern: "herringbone", size: 12, grout: GROUTS[0].id, finish: "polished", seedBase: 7 };

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
function drawStone(ctx, x, y, w, h, stone, seed, finish = "polished") {
  const r = rng(seed), kind = stone.kind || "vein", fin = String(finish).toLowerCase();
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (kind === "mosaic") drawMosaic(ctx, x, y, w, h, stone, r);
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

/* ---------- services ---------- */
const SERVICES = [
  { t: "Floors", d: "Entries, kitchens, lobbies and living areas: flat, flush and lippage-free.", type: "floor" },
  { t: "Showers and baths", d: "Slab and tile surrounds, waterproofed, sloped and sealed.", type: "shower" },
  { t: "Stairs and thresholds", d: "Precisely cut treads, risers, nosings and inlay borders.", type: "stairs" },
  { t: "Walls and backsplashes", d: "Book-matched slabs, mosaics and feature walls.", type: "wall" },
  { t: "Countertops and islands", d: "Waterfall edges, mitred returns and vein-matched seams.", type: "wall" },
  { t: "Restoration", d: "Honing, polishing, re-grouting and stain removal.", type: "floor" }
];
function services() {
  const list = $("#serviceList");
  list.innerHTML = SERVICES.map((s, i) => `<li><button type="button" data-i="${i}"><span class="sv-n">${String(i + 1).padStart(2, "0")}</span><span class="sv-t">${s.t}</span><span class="sv-d">${s.d}</span><span class="sv-a" aria-hidden="true">&rarr;</span></button></li>`).join("");
  list.addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    goToQuote(`I'm interested in: ${SERVICES[b.dataset.i].t}.`);
  });
}

/* ---------- visualizer ---------- */
function radio(container, items, current, render, onPick) {
  container.innerHTML = "";
  items.forEach(it => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "radio"); b.dataset.id = it.id;
    render(b, it);
    b.addEventListener("click", () => { onPick(it.id); sync(); });
    container.append(b);
  });
  const sync = () => $$("button", container).forEach(b => b.setAttribute("aria-checked", b.dataset.id === current()));
  sync();
  container.addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const ids = items.map(i => i.id), d = /Right|Down/.test(e.key) ? 1 : -1;
    const n = ids[(ids.indexOf(current()) + d + ids.length) % ids.length];
    onPick(n); sync(); $(`[data-id="${CSS.escape(n)}"]`, container).focus();
  });
  return sync;
}

function visualizer() {
  const canvas = $("#vizCanvas"), ctx = canvas.getContext("2d");
  const render = () => {
    const stone = stoneById(state.stone), ppi = canvas.width / 144; // room is 12ft wide
    layFloor(ctx, canvas.width, canvas.height, { stone, pattern: state.pattern, tileIn: state.size, ppi, grout: state.grout, finish: state.finish, seed: state.seedBase * 1000 });
    $("#stoneNote").textContent = stone.note;
    $("#sizeOut").textContent = state.size + '"';
    const p = PATTERNS.find(p => p.id === state.pattern);
    $("#vizCaption").textContent = `${stone.name}, ${p.name.toLowerCase()} layout, ${state.size}" tiles, ${state.finish} finish — shown on a 12′ × 8′ room.`;
    renderSummary();
  };
  const syncs = [];
  const R = (...a) => syncs.push(radio(...a));
  R($("#stoneSwatches"), STONES, () => state.stone, (b, s) => {
    const c = document.createElement("canvas"); c.width = 90; c.height = 56;
    drawStone(c.getContext("2d"), 0, 0, 90, 56, s, 3 + s.name.length);
    b.append(c, s.name); b.setAttribute("aria-label", s.name);
  }, id => { state.stone = id; render(); });
  R($("#patternSeg"), PATTERNS, () => state.pattern, (b, p) => b.textContent = p.name, id => { state.pattern = id; render(); });
  R($("#groutSeg"), GROUTS, () => state.grout, (b, g) => b.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${g.id};border:1px solid #0003;margin-right:6px"></span>${g.name}`, id => { state.grout = id; render(); });
  R($("#finishSeg"), FINISHES, () => state.finish, (b, f) => b.textContent = f.name, id => { state.finish = id; render(); });
  $("#tileSize").addEventListener("input", e => { state.size = +e.target.value; render(); });
  $("#shuffleBtn").addEventListener("click", () => { state.seedBase = (state.seedBase * 31 + 17) % 9973; render(); });
  $("#useInEstimate").addEventListener("click", () => {
    const st = stoneById(state.stone), p = PATTERNS.find(p => p.id === state.pattern);
    goToQuote(`I'd like a quote for this layout: ${st.name}, ${p.name.toLowerCase()} layout, ${state.size}" tiles, ${state.finish} finish.`);
  });
  visualizer.refresh = () => { syncs.forEach(f => f()); render(); };
  render();
}

function goToQuote(msg) {
  if (msg) { const m = $("#qMsg"); m.value = m.value && !m.value.includes(msg) ? m.value + "\n" + msg : msg; }
  $("#quote").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

/* ---------- gallery ---------- */
const PROJECTS = [
  { n: 1, t: "Sculpted curved lobby counter", cat: "Commercial", cats: ["Commercial", "Countertops"], stone: "White quartz, soft grey veining", layout: "Single sweeping curve, thick rounded edge, matched veining along the run", finish: "Polished", where: "Building lobby / amenity space",
    desc: "A long, flowing reception counter fabricated in a bright quartz with a soft grey vein that runs the length of the top. The rounded ends and curved edge profile were templated to the cabinet base, set over a terrazzo floor." },
  { n: 2, t: "Large-slab shower with niche & bench", cat: "Showers & Baths", cats: ["Showers & Baths", "Residential"], stone: "Grey-and-cream marble slabs, dramatic linear veining", layout: "Full-height slabs on walls and ceiling, mitred corners, recessed niche, slab bench", finish: "Polished", where: "Residential bathroom (in progress)",
    desc: "Shower surround in oversized marble slabs with the veining carried continuously from wall to wall. Includes a recessed shelf niche in a contrasting darker cut and a solid-slab bench with a mitred nosing." },
  { n: 3, t: "L-shaped concrete-look counter", cat: "Commercial", cats: ["Commercial", "Countertops"], stone: "Grey concrete-look solid surface / terrazzo-aggregate edge", layout: "Two-run L layout with tight butt seam, overhang on dark cabinetry", finish: "Honed", where: "Commercial lounge / pantry",
    desc: "A large-format L-shaped service counter in a muted grey with a visible aggregate edge, installed over dark cabinetry. The seam is flush and the overhang supported for seating." },
  { n: 4, t: "Arabescato marble reception ledge", cat: "Feature walls", cats: ["Feature walls", "Commercial"], stone: "White marble with bold grey veining (Arabescato-style)", layout: "Solid thick marble ledge, book-matched veining, set on black reception desk", finish: "Polished", where: "Building lobby",
    desc: "A solid marble transaction ledge with high-contrast grey veining, seated on a black reception desk. A statement piece against the dark millwork and glass curtain wall." },
  { n: 5, t: "Curved bar top with green tile wall", cat: "Commercial", cats: ["Commercial", "Countertops"], stone: "Light quartz top; green glazed ceramic wall tile", layout: "Curved bar top with integrated power; 4×4 wall tile in straight stack with white grout", finish: "Polished top / glazed wall", where: "Commercial lounge",
    desc: "A curved bar-height counter with cut-outs for power, finished with a clean polished edge. Behind it, deep green glazed square tile is set in a straight stack with contrasting white grout lines." },
  { n: 6, t: "Marble slab shower with chevron floor", cat: "Showers & Baths", cats: ["Showers & Baths", "Residential"], stone: "Grey marble slabs; white marble chevron mosaic floor", layout: "Book-matched full-height wall slabs, chevron mosaic pan, linear drain, marble vanity top & bench", finish: "Polished walls, honed mosaic", where: "Residential primary bath",
    desc: "Floor-to-ceiling marble slabs with sweeping diagonal veining, a slab bench, recessed niche and concealed LED cove. The shower floor is a white marble chevron mosaic pitched to a linear drain." },
  { n: 7, t: "Kitchenette with full-height splash", cat: "Kitchens", cats: ["Kitchens", "Commercial"], stone: "Warm grey quartz", layout: "Straight run top with undermount sink; full-height matching backsplash", finish: "Polished", where: "Office pantry",
    desc: "A tidy office pantry: warm grey quartz counter with undermount sink cut-out and a full-height slab backsplash that eliminates grout lines behind the work area." },
  { n: 8, t: "Waterfall island & slab splash", cat: "Kitchens", cats: ["Kitchens", "Residential"], stone: "White quartz, fine grey veining (Carrara-look)", layout: "Waterfall island with mitred legs; slab backsplash inside a walnut niche", finish: "Polished", where: "Loft kitchen",
    desc: "A waterfall island with mitred, vein-matched side panels and a single slab backsplash framed by walnut. Clean lines against exposed brick and wide-plank oak." },
  { n: 9, t: "Marble tub deck with slotted wall", cat: "Showers & Baths", cats: ["Showers & Baths", "Feature walls", "Residential"], stone: "White marble with grey veining (Statuario-style)", layout: "Book-matched wall slabs with routed vertical slots, fluted tub apron, undermount tub deck", finish: "Polished and honed flutes", where: "Residential spa bath",
    desc: "A custom bath: full slab walls with precision-routed vertical slots, a fluted marble apron below the deck, and an undermount tub set into a solid marble surround with the veining continuing across the deck." },
  { n: 10, t: "Calacatta waterfall island & slab splash", cat: "Kitchens", cats: ["Kitchens", "Residential"], stone: "Calacatta-style marble, gold-grey veining", layout: "Mitred waterfall island, stepped overhang, full-height slab backsplash, herringbone-chevron wood floor", finish: "Polished", where: "Loft kitchen (during install)",
    desc: "Shown mid-install with protective tape: a large mitred island wrapped in matching marble, a stepped overhang and a full-height backsplash cut from consecutive slabs so the veins continue." },
  { n: 11, t: "Sanctuary steps & borders", cat: "Floors", cats: ["Floors", "Commercial"], stone: "Dark Emperador marble with cream marble inlay bands", layout: "Stepped platform, mitred corners, cream inlay stripes, matching risers", finish: "Polished", where: "Church sanctuary",
    desc: "A multi-level sanctuary platform finished in dark brown Emperador with crisp cream inlay bands that follow every angle change. Treads, risers and borders are mitred and aligned to the altar." },
  { n: 12, t: "Radial-line hex floor tile", cat: "Floors", cats: ["Floors", "Residential"], stone: "Glossy white porcelain/ceramic, black line pattern", layout: "Elongated hexagon tiles forming starburst pattern, dark grout", finish: "Glossy", where: "Small residential bathroom",
    desc: "A graphic pattern floor: elongated hexagon tiles whose black radiating lines join into starbursts. Careful layout from the centre line keeps each burst aligned and the cuts at the walls balanced." },
  { n: 13, t: "Elevator lobby relief tile walls", cat: "Feature walls", cats: ["Feature walls", "Commercial"], stone: "Handmade-look glazed ceramic in green-grey tones", layout: "Raised relief bar tile in interlocking basket/herringbone pattern, brick-bond returns at corners", finish: "Glazed", where: "Commercial elevator lobby",
    desc: "A textured feature wall of narrow glazed bars set in a woven, stepped pattern with varied glaze tones. Corners return in a stacked brick bond for clean wrap-arounds." },
  { n: 14, t: "Residential kitchen with herringbone splash", cat: "Kitchens", cats: ["Kitchens", "Residential"], stone: "White quartz with bold grey veining; grey herringbone mosaic splash; large white floor tile", layout: "Large island with seamed overhang, herringbone mosaic backsplash, straight-lay large-format floor", finish: "Polished", where: "Home kitchen",
    desc: "White quartz perimeter and island with dramatic grey veins, a narrow-stick herringbone mosaic backsplash, and a large-format porcelain floor laid straight." },
  { n: 15, t: "Butler's pantry with plank floor", cat: "Kitchens", cats: ["Kitchens", "Residential"], stone: "White quartz, grey swoosh veining; wood-look porcelain plank floor", layout: "Counter with mitred corner detail; planks in a staggered running bond", finish: "Polished / matte plank", where: "Home pantry",
    desc: "A white quartz counter with a flowing grey vein carried across the corner. The floor is wood-look porcelain plank laid in a staggered pattern with narrow joints." },
  { n: 16, t: "Calacatta marble waterfall island", cat: "Kitchens", cats: ["Kitchens", "Residential"], stone: "Calacatta-style white marble, grey veining", layout: "Island with mitred waterfall end, stepped ledge around column, vein-matched side panels", finish: "Polished", where: "Loft kitchen",
    desc: "A close look at a marble island wrapping a structural column: stepped ledge, continuous veining down the waterfall panel, and tight mitred joints. Taped sink opening is protected for the next trade." }
];
const pimg = (p, thumb) => `images/project-${String(p.n).padStart(2, "0")}${thumb ? "-thumb" : ""}.jpg`;
function gallery() {
  const cats = ["All", ...new Set(PROJECTS.flatMap(p => p.cats))];
  let cur = "All", idx = 0, shown = [];
  const fl = $("#galFilters"), g = $("#gallery");
  const show = () => {
    fl.innerHTML = cats.map(c => `<button type="button" aria-pressed="${c === cur}">${c}</button>`).join("");
    shown = PROJECTS.filter(p => cur === "All" || p.cats.includes(cur));
    g.innerHTML = shown.map((p, i) => `<button class="tile" type="button" data-i="${i}"><img src="${pimg(p, true)}" alt="${p.t}" loading="lazy"><span class="cap"><b>${p.t}</b><small>${p.cat}</small></span></button>`).join("");
  };
  fl.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { cur = b.textContent; show(); } });
  const dlg = document.createElement("dialog"); dlg.className = "lightbox"; dlg.setAttribute("aria-label", "Project details"); document.body.append(dlg);
  const open = i => {
    idx = (i + shown.length) % shown.length; const p = shown[idx];
    dlg.innerHTML = `<div class="lb"><div class="lb-img"><img src="${pimg(p)}" alt="${p.t}"><button class="lb-nav prev" data-a="prev" aria-label="Previous project">‹</button><button class="lb-nav next" data-a="next" aria-label="Next project">›</button></div>
      <div class="body"><p class="eyebrow">${p.cat} · ${idx + 1}/${shown.length}</p><h3>${p.t}</h3><p>${p.desc}</p>
      <dl><dt>Material</dt><dd>${p.stone}</dd><dt>Layout</dt><dd>${p.layout}</dd><dt>Finish</dt><dd>${p.finish}</dd><dt>Setting</dt><dd>${p.where}</dd></dl>
      <div class="row"><button class="btn" data-a="quote" type="button">Request something similar</button><button class="btn btn-ghost" data-a="close" type="button">Close</button></div></div></div>`;
    if (!dlg.open) dlg.showModal();
  };
  g.addEventListener("click", e => { const t = e.target.closest(".tile"); if (t) open(+t.dataset.i); });
  dlg.addEventListener("click", e => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (e.target === dlg || a === "close") dlg.close();
    else if (a === "prev") open(idx - 1); else if (a === "next") open(idx + 1);
    else if (a === "quote") {
      $("#qMsg").value = `I'd like something similar to: ${shown[idx].t} (${shown[idx].stone}).`;
      dlg.close(); $("#quote").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  });
  dlg.addEventListener("keydown", e => { if (e.key === "ArrowLeft") open(idx - 1); if (e.key === "ArrowRight") open(idx + 1); });
  show();
}

/* ---------- process / testimonials / faq ---------- */
const STEPS = [
  { t: "Free site visit", time: "Day 1", d: "We measure, check the substrate, and talk through stone, layout and budget.", li: ["Moisture & flatness check", "Slab or tile selection help", "Written fixed-price quote"] },
  { t: "Prep", time: "Days 2–3", d: "A great job is 80% preparation. We remove old surfaces and make the substrate flat and sound.", li: ["Demolition and disposal", "Self-levelling or patching", "Waterproofing where needed"] },
  { t: "Layout & dry-fit", time: "Day 3–4", d: "Stone is dry-laid and blended across boxes so veining and shade flow naturally.", li: ["Centre-line layout to avoid thin cuts", "Shade blending", "Your sign-off before we set"] },
  { t: "Setting", time: "Days 4–7", d: "Back-buttered, full-coverage setting with the right thin-set for the stone, kept lippage-free.", li: ["White thin-set to prevent bleed-through", "Levelling clips", "Precision wet-saw cuts"] },
  { t: "Grout, seal & polish", time: "Final day", d: "Grout, cleaning, sealing and final polish, then a walkthrough together.", li: ["Penetrating sealer", "Final clean and inspection", "Care guide for your stone"] }
];
function process() {
  const tabs = $("#stepTabs"), panel = $("#stepPanel"); let cur = 0;
  const draw = () => {
    tabs.innerHTML = STEPS.map((s, i) => `<button role="tab" type="button" id="st${i}" aria-selected="${i === cur}" aria-controls="stepPanel" tabindex="${i === cur ? 0 : -1}"><b>${i + 1}</b>${s.t}</button>`).join("");
    const s = STEPS[cur];
    panel.setAttribute("aria-labelledby", "st" + cur);
    panel.innerHTML = `<span class="chip">${s.time}</span><h3>${s.t}</h3><p>${s.d}</p><ul>${s.li.map(l => `<li>${l}</li>`).join("")}</ul>`;
  };
  tabs.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { cur = +b.id.slice(2); draw(); $("#st" + cur).focus(); } });
  tabs.addEventListener("keydown", e => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!d) return;
    e.preventDefault(); cur = (cur + d + STEPS.length) % STEPS.length; draw(); $("#st" + cur).focus();
  });
  draw();
}
const FAQ = [
  ["How long does a typical floor take?", "Most rooms take 3–6 working days including prep, setting, grouting and sealing. Large or complex layouts like herringbone take longer."],
  ["Does marble stain or scratch easily?", "Marble is calcium-based, so acids (lemon, wine, some cleaners) can etch it. Honed finishes hide wear better than polished. We seal every installation and give you a care guide."],
  ["Can marble be used in a shower?", "Yes, when properly waterproofed and sealed. We use a membrane system and white thin-set to prevent staining."],
  ["Do you supply the stone?", "Either way works. We source from trusted suppliers or install material you bought — we'll check it for flatness and defects first."],
  ["Is underfloor heating compatible?", "Yes. Marble conducts heat very well. We install electric mats beneath the stone as an optional extra."],
  ["How do I clean marble?", "Use a pH-neutral stone cleaner and a soft mop. Avoid vinegar, bleach and abrasive powders."]
];
function faq() {
  const list = $("#faqList");
  const draw = q => {
    const rows = FAQ.filter(([a, b]) => (a + b).toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = rows.length ? rows.map(([a, b]) => `<details><summary>${a}</summary><p>${b}</p></details>`).join("") : '<p class="muted">No matches — ask us in the form below.</p>';
  };
  $("#faqSearch").addEventListener("input", e => draw(e.target.value)); draw("");
}

/* ---------- quote form ---------- */
function renderSummary() {
  const el = $("#quoteSummary"); if (!el) return;
  const s = stoneById(state.stone), p = PATTERNS.find(p => p.id === state.pattern), sel = selectionsList();
  el.innerHTML = `<div><span>Layout preview</span><span>${s.name} · ${p.name} · ${state.finish}</span></div>` +
    `<div><span>Saved selections</span><span>${sel.length ? sel.map(i => i.name).join(", ") : "None yet"}</span></div>`;
}
const VALID = {
  qName: v => v.trim().length >= 2 || "Please enter your name",
  qPhone: v => v.replace(/\D/g, "").length >= 7 || "Enter a valid phone number",
  qEmail: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email",
  qZip: v => v.trim().length >= 3 || "Enter your ZIP / postcode"
};
function quoteForm() {
  const form = $("#quoteForm");
  const check = id => { const el = $("#" + id), r = VALID[id](el.value); el.classList.toggle("bad", r !== true); $(`.err[data-for=${id}]`).textContent = r === true ? "" : r; return r === true; };
  Object.keys(VALID).forEach(id => $("#" + id).addEventListener("blur", () => check(id)));
  const drawSaved = () => {
    const list = store.get("wms-requests", []);
    $("#savedList").innerHTML = list.length ? list.map((r, i) => `<li><span>${new Date(r.at).toLocaleDateString()} — ${r.name}, ${r.design}</span><button type="button" data-i="${i}" aria-label="Delete request">Remove</button></li>`).join("") : '<li class="muted">Nothing yet.</li>';
  };
  $("#savedList").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const list = store.get("wms-requests", []); list.splice(+b.dataset.i, 1); store.set("wms-requests", list); drawSaved();
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const ok = Object.keys(VALID).map(check).every(Boolean);
    if (!ok) { $(".bad", form)?.focus(); return; }
    const s = stoneById(state.stone), sel = selectionsList();
    const rec = { at: Date.now(), name: $("#qName").value.trim(), phone: $("#qPhone").value, email: $("#qEmail").value, zip: $("#qZip").value, when: $("#qWhen").value, msg: $("#qMsg").value, design: sel.length ? `${sel.length} saved selection${sel.length > 1 ? "s" : ""}` : `${s.name} ${state.pattern}` };
    const list = store.get("wms-requests", []); list.unshift(rec); store.set("wms-requests", list.slice(0, 10)); drawSaved();
    const body = `Name: ${rec.name}\nPhone: ${rec.phone}\nEmail: ${rec.email}\nZIP: ${rec.zip}\nStart: ${rec.when}\nDesign: ${s.name}, ${state.pattern}, ${state.size}" tiles, ${state.finish}, grout ${state.grout}\nSaved selections: ${sel.length ? sel.map(i => `${i.name} (${i.finish})`).join("; ") : "none"}\nPhotos to follow: ${$("#qPhotos").checked ? "yes" : "no"}\n\n${rec.msg}`;
    const href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Quote request — " + rec.name)}&body=${encodeURIComponent(body)}`;
    $("#formStatus").innerHTML = `Thanks, ${rec.name.split(" ")[0]} — request saved on this device. <a href="${href}" style="color:#d3b06a">Click here to email it to us</a> to send it.`;
    form.reset(); toast("Request saved");
  });
  drawSaved();
}

/* ---------- misc ---------- */
function page() {
  $("#ftPhone").textContent = CONFIG.phone; $("#ftEmail").textContent = CONFIG.email; $("#yr").textContent = new Date().getFullYear();
  const tog = $(".nav-toggle"), nav = $("#nav");
  tog.addEventListener("click", () => { const o = nav.classList.toggle("open"); tog.setAttribute("aria-expanded", o); });
  nav.addEventListener("click", e => { if (e.target.closest("a")) { nav.classList.remove("open"); tog.setAttribute("aria-expanded", false); } });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$(".section .wrap > *, .reveal").forEach(el => { el.classList.add("reveal"); io.observe(el); });
}

services(); visualizer(); gallery(); process(); faq(); quoteForm(); page();
