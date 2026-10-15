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
const stoneById = id => STONES.find(s => s.id === id);

const PATTERNS = [
  { id: "straight",   name: "Straight",   labor: 14, waste: 0.08 },
  { id: "brick",      name: "Brick",      labor: 15, waste: 0.10 },
  { id: "diagonal",   name: "Diagonal",   labor: 17, waste: 0.12 },
  { id: "checker",    name: "Checker",    labor: 17, waste: 0.10 },
  { id: "herringbone",name: "Herringbone",labor: 22, waste: 0.15 }
];
const GROUTS = [{ id: "#d8d4cc", name: "Light" }, { id: "#9c978d", name: "Grey" }, { id: "#3b3a38", name: "Charcoal" }, { id: "#c4b08a", name: "Sand" }];
const FINISHES = [{ id: "polished", name: "Polished" }, { id: "honed", name: "Honed" }, { id: "tumbled", name: "Tumbled" }];
const TYPES = { floor: { mult: 1, label: ["Length", "Width"] }, wall: { mult: 1.15, label: ["Length", "Height"] }, shower: { mult: 1.45, label: ["Total wall length", "Height"] }, stairs: { mult: 1.6, label: ["Number of steps", "Stair width"] } };

const state = { stone: "carrara", pattern: "herringbone", size: 12, grout: GROUTS[0].id, finish: "polished", seedBase: 7, estimate: null };

/* ---------- procedural marble ---------- */
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function drawStone(ctx, x, y, w, h, stone, seed, finish = "polished") {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, stone.base); g.addColorStop(1, stone.base2);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  // soft clouds
  for (let i = 0; i < 4; i++) {
    const cx = x + r() * w, cy = y + r() * h, cr = (0.4 + r() * 0.6) * Math.max(w, h);
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    rg.addColorStop(0, stone.base2 + "88"); rg.addColorStop(1, stone.base2 + "00");
    ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
  }
  // veins: random-walk polylines, smoothed
  const veins = 1 + Math.round(stone.strength * 2);
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = stone.vein;
  for (let v = 0; v < veins; v++) {
    const horiz = r() > 0.5, diag = (r() - 0.5) * 1.2;
    let px = horiz ? x - 10 : x + r() * w, py = horiz ? y + r() * h : y - 10;
    const main = r() < 0.5;
    ctx.beginPath(); ctx.moveTo(px, py);
    const steps = 9;
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
    ctx.globalAlpha *= 0.4; ctx.lineWidth *= 2.4; ctx.stroke(); // soft halo
  }
  ctx.globalAlpha = 1;
  if (finish === "tumbled") {
    for (let i = 0; i < w * h / 40; i++) {
      ctx.fillStyle = r() > 0.5 ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.1)";
      ctx.fillRect(x + r() * w, y + r() * h, 1.5, 1.5);
    }
  }
  if (finish === "polished") {
    const sh = ctx.createLinearGradient(x, y, x + w, y + h);
    sh.addColorStop(0, "rgba(255,255,255,.28)"); sh.addColorStop(0.45, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(255,255,255,.1)");
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/* Lay tiles in a pattern across (W,H) px. tileIn = tile edge in inches, ppi = px per inch. */
function layFloor(ctx, W, H, o) {
  const { stone, pattern, tileIn, ppi, grout, finish, seed, gap = 3 } = o;
  const s = tileIn * ppi, half = gap / 2;
  const alt = stoneById(stone.pair);
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

/* ---------- hero background ---------- */
function heroBackground() {
  const c = $("#heroCanvas"), ctx = c.getContext("2d");
  const draw = () => {
    c.width = c.clientWidth; c.height = c.clientHeight;
    drawStone(ctx, 0, 0, c.width, c.height, { ...stoneById("carrara"), strength: 0.8 }, 11, "polished");
    const fade = ctx.createLinearGradient(0, 0, c.width * 0.8, 0);
    fade.addColorStop(0, "rgba(250,248,244,.92)"); fade.addColorStop(1, "rgba(250,248,244,.1)");
    ctx.fillStyle = fade; ctx.fillRect(0, 0, c.width, c.height);
  };
  draw(); let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 150); });
}

/* ---------- services ---------- */
const SERVICES = [
  { ico: "🏛️", t: "Floors", d: "Entryways, kitchens, living areas — flat, flush and lippage-free.", type: "floor" },
  { ico: "🚿", t: "Showers & baths", d: "Waterproofed, sloped and sealed for decades of use.", type: "shower" },
  { ico: "🪜", t: "Stairs & thresholds", d: "Precisely cut treads, risers and nosings.", type: "stairs" },
  { ico: "🧱", t: "Walls & backsplashes", d: "Book-matched slabs, mosaics and feature walls.", type: "wall" },
  { ico: "✨", t: "Restoration", d: "Honing, polishing, re-grouting and stain removal.", type: "floor" },
  { ico: "🔥", t: "Fireplaces & surrounds", d: "Heat-rated setting materials and clean mitred edges.", type: "wall" }
];
function services() {
  $("#serviceCards").innerHTML = SERVICES.map((s, i) => `<article class="card reveal"><div class="ico" aria-hidden="true">${s.ico}</div><h3>${s.t}</h3><p>${s.d}</p><button type="button" data-i="${i}">Estimate this →</button></article>`).join("");
  $("#serviceCards").addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    $("#eType").value = SERVICES[b.dataset.i].type; syncTypeLabels(); estimate();
    $("#estimator").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
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
    $("#eStone").value = state.stone; $("#ePattern").value = state.pattern; estimate();
    toast("Design applied to estimate"); $("#estimator").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });
  visualizer.refresh = () => { syncs.forEach(f => f()); render(); };
  render();
}

/* ---------- estimator ---------- */
function syncTypeLabels() {
  const t = TYPES[$("#eType").value];
  $("#eLen").parentElement.firstChild.textContent = t.label[0] + " ";
  $("#eWid").parentElement.firstChild.textContent = t.label[1] + " ";
  const stairs = $("#eType").value === "stairs";
  $("#eUnit").disabled = stairs; if (stairs) $("#eUnit").value = "ft";
}
function estimate() {
  const type = $("#eType").value, T = TYPES[type];
  const len = Math.max(0, parseFloat($("#eLen").value) || 0), wid = Math.max(0, parseFloat($("#eWid").value) || 0);
  const k = $("#eUnit").value === "m" ? 3.2808 : 1;
  let area = type === "stairs" ? len * wid * k * 1.5 : len * k * wid * k;
  area = Math.round(area * 10) / 10;
  const stone = stoneById($("#eStone").value), pat = PATTERNS.find(p => p.id === $("#ePattern").value);
  const own = $("#eSupply").value === "you";
  const stoneCost = own ? 0 : area * (1 + pat.waste) * stone.mat;
  const labor = area * pat.labor * T.mult;
  const extras = area * ($("#eDemo").checked * 4 + $("#eLevel").checked * 3.5 + $("#eWater").checked * 3 + $("#eSeal").checked * 1.8 + $("#eHeat").checked * 12);
  let total = stoneCost + labor + extras;
  const minimum = area > 0 && total < 450; if (minimum) total = 450;
  const lo = total * 0.88, hi = total * 1.12;
  state.estimate = area > 0 ? { total, lo, hi, area, type, stone: stone.name, pattern: pat.name } : null;
  $("#estTotal").textContent = area > 0 ? money(Math.round(total / 10) * 10) : "—";
  $("#estRange").textContent = area > 0 ? `Likely range ${money(Math.round(lo / 10) * 10)} – ${money(Math.round(hi / 10) * 10)}` : "Enter your measurements";
  const parts = [["Stone (incl. " + Math.round(pat.waste * 100) + "% waste)", stoneCost, "#d3b06a"], ["Installation labour", labor, "#8fb7a3"], ["Prep & extras", extras, "#9aa5c4"]];
  const sum = parts.reduce((a, p) => a + p[1], 0) || 1;
  $("#estBar").innerHTML = parts.map(p => `<i style="width:${p[1] / sum * 100}%;background:${p[2]}"></i>`).join("");
  $("#estBreak").innerHTML = (area > 0 ? parts : []).map(p => `<li style="--c:${p[2]}"><span>${p[0]}</span><span>${money(Math.round(p[1]))}</span></li>`).join("");
  $("#estNote").textContent = area > 0 ? `${area} sq ft of surface.${minimum ? " Minimum job charge applied." : ""} Estimate only — excludes tax, structural repairs and unforeseen conditions.` : "";
  renderSummary();
}
function estimator() {
  $("#eStone").innerHTML = STONES.map(s => `<option value="${s.id}">${s.name} — ${money(s.mat)}/sq ft</option>`).join("");
  $("#ePattern").innerHTML = PATTERNS.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  $("#ePattern").value = state.pattern;
  $("#estForm").addEventListener("input", () => { syncTypeLabels(); estimate(); });
  $("#estForm").addEventListener("submit", e => e.preventDefault());
  $("#estToQuote").addEventListener("click", () => { $("#quote").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); setTimeout(() => $("#qName").focus({ preventScroll: true }), 500); });
  syncTypeLabels(); estimate();
}

/* ---------- before / after ---------- */
function beforeAfter() {
  const box = $("#ba"), after = $("#baAfter"), before = $("#baBefore"), wrap = $(".ba-before", box), handle = $(".ba-handle", box);
  const paint = () => {
    const W = box.clientWidth, H = box.clientHeight;
    [after, before].forEach(c => { c.width = W; c.height = H; });
    const a = after.getContext("2d");
    layFloor(a, W, H, { stone: stoneById("calacatta"), pattern: "checker", tileIn: 24, ppi: W / 150, grout: "#d8d4cc", finish: "polished", seed: 42, gap: 2 });
    // worn "before"
    const b = before.getContext("2d"), r = rng(5);
    layFloor(b, W, H, { stone: { id: "old", name: "old", base: "#c9b79a", base2: "#b8a283", vein: "#8c7a5e", strength: 0.1, pair: "carrara" }, pattern: "straight", tileIn: 12, ppi: W / 150, grout: "#6e6252", finish: "tumbled", seed: 9, gap: 3 });
    b.lineWidth = 1.2;
    for (let i = 0; i < 16; i++) { // cracks
      let x = r() * W, y = r() * H; b.strokeStyle = "rgba(40,30,20,.55)"; b.beginPath(); b.moveTo(x, y);
      for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 50; y += (r() - 0.3) * 40; b.lineTo(x, y); }
      b.stroke();
    }
    for (let i = 0; i < 9; i++) { // stains
      const x = r() * W, y = r() * H, rad = 20 + r() * 60, g = b.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, "rgba(70,50,30,.35)"); g.addColorStop(1, "rgba(70,50,30,0)"); b.fillStyle = g; b.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  };
  let pct = 50;
  const set = p => {
    pct = Math.max(0, Math.min(100, p));
    wrap.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; handle.style.left = pct + "%"; box.setAttribute("aria-valuenow", Math.round(pct));
  };
  const fromEvent = e => set((e.clientX - box.getBoundingClientRect().left) / box.clientWidth * 100);
  box.addEventListener("pointerdown", e => { box.setPointerCapture(e.pointerId); fromEvent(e); });
  box.addEventListener("pointermove", e => { if (box.hasPointerCapture(e.pointerId)) fromEvent(e); });
  box.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") set(pct - 5); else if (e.key === "ArrowRight") set(pct + 5);
    else if (e.key === "Home") set(0); else if (e.key === "End") set(100); else return;
    e.preventDefault();
  });
  paint(); set(50); let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(paint, 150); });
}

/* ---------- gallery ---------- */
const PROJECTS = [
  { t: "Herringbone entry hall", cat: "Floors", stone: "carrara", pattern: "herringbone", finish: "honed", size: 12, desc: "Honed Carrara in a 90° herringbone with light grout, 140 sq ft." },
  { t: "Checkerboard kitchen", cat: "Floors", stone: "calacatta", pattern: "checker", finish: "polished", size: 16, desc: "Polished Calacatta and Nero Marquina checker, laid straight." },
  { t: "Walk-in marble shower", cat: "Showers", stone: "carrara", pattern: "brick", finish: "honed", size: 12, desc: "Waterproofed and sloped, with a mosaic pan and niche." },
  { t: "Travertine terrace", cat: "Outdoor", stone: "travertine", pattern: "straight", finish: "tumbled", size: 16, desc: "Tumbled travertine, slip-resistant, sealed against frost." },
  { t: "Emperador powder room", cat: "Bathrooms", stone: "emperador", pattern: "diagonal", finish: "polished", size: 12, desc: "Diagonal layout makes a small room feel larger." },
  { t: "Green marble fireplace", cat: "Feature walls", stone: "verde", pattern: "straight", finish: "polished", size: 24, desc: "Book-matched Verde Alpi surround with mitred corners." },
  { t: "Black &amp; white foyer", cat: "Floors", stone: "nero", pattern: "checker", finish: "polished", size: 12, desc: "High-contrast checker with charcoal grout." },
  { t: "Spa bathroom walls", cat: "Bathrooms", stone: "calacatta", pattern: "straight", finish: "honed", size: 24, desc: "Large-format honed Calacatta, floor to ceiling." }
];
function gallery() {
  const cats = ["All", ...new Set(PROJECTS.map(p => p.cat))];
  let cur = "All";
  const fl = $("#galFilters"), g = $("#gallery");
  const show = () => {
    fl.innerHTML = cats.map(c => `<button type="button" aria-pressed="${c === cur}">${c}</button>`).join("");
    const list = PROJECTS.map((p, i) => [p, i]).filter(([p]) => cur === "All" || p.cat === cur);
    g.innerHTML = list.map(([p, i]) => `<button class="tile" type="button" data-i="${i}"><canvas width="500" height="340"></canvas><div><b>${p.t}</b><small>${p.cat} · ${stoneById(p.stone).name}</small></div></button>`).join("");
    $$(".tile", g).forEach(t => {
      const p = PROJECTS[t.dataset.i], c = $("canvas", t);
      layFloor(c.getContext("2d"), c.width, c.height, { stone: stoneById(p.stone), pattern: p.pattern, tileIn: p.size, ppi: c.width / 110, grout: "#cfc9bd", finish: p.finish, seed: +t.dataset.i * 100 + 3 });
    });
  };
  fl.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { cur = b.textContent; show(); } });
  const dlg = document.createElement("dialog"); document.body.append(dlg);
  g.addEventListener("click", e => {
    const t = e.target.closest(".tile"); if (!t) return;
    const p = PROJECTS[t.dataset.i];
    dlg.innerHTML = `<canvas width="1100" height="520"></canvas><div class="body"><h3>${p.t}</h3><p>${p.desc}</p><div class="row"><button class="btn" data-a="try" type="button">Try this design</button><button class="btn btn-ghost" data-a="close" type="button">Close</button></div></div>`;
    const c = $("canvas", dlg);
    layFloor(c.getContext("2d"), c.width, c.height, { stone: stoneById(p.stone), pattern: p.pattern, tileIn: p.size, ppi: c.width / 144, grout: "#cfc9bd", finish: p.finish, seed: +t.dataset.i * 100 + 3 });
    dlg.dataset.i = t.dataset.i; dlg.showModal();
  });
  dlg.addEventListener("click", e => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (e.target === dlg || a === "close") dlg.close();
    if (a === "try") {
      const p = PROJECTS[dlg.dataset.i]; Object.assign(state, { stone: p.stone, pattern: p.pattern, finish: p.finish, size: p.size });
      $("#tileSize").value = p.size; visualizer.refresh(); dlg.close(); $("#visualizer").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  });
  show();
}

/* ---------- process / testimonials / faq ---------- */
const STEPS = [
  { t: "Free site visit", time: "Day 1", d: "We measure, check the substrate, and talk through stone, layout and budget.", li: ["Moisture & flatness check", "Slab or tile selection help", "Written fixed-price quote"] },
  { t: "Prep", time: "Days 2–3", d: "A great job is 80% preparation. We remove old surfaces and make the substrate flat and sound.", li: ["Demolition and disposal", "Self-levelling or patching", "Waterproofing where needed"] },
  { t: "Layout & dry-fit", time: "Day 3–4", d: "Stone is dry-laid and blended across boxes so veining and shade flow naturally.", li: ["Centre-line layout to avoid thin cuts", "Shade blending", "Your sign-off before we set"] },
  { t: "Setting", time: "Days 4–7", d: "Back-buttered, full-coverage setting with the right thin-set for the stone, kept lippage-free.", li: ["White thin-set to prevent bleed-through", "Levelling clips", "Precision wet-saw cuts"] },
  { t: "Grout, seal & polish", time: "Final day", d: "Grout, cleaning, sealing and final polish, then a walkthrough together.", li: ["Penetrating sealer", "Final clean and inspection", "Care guide and warranty"] }
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
const QUOTES = [
  ["They found a problem in our subfloor that two other contractors missed. The finished floor is flawless.", "Sample client — kitchen floor"],
  ["Our Calacatta shower looks like a hotel spa. Clean, on time and tidy every single day.", "Sample client — primary bath"],
  ["Honest quote, no surprises, and the herringbone layout is stunning.", "Sample client — entry hall"]
];
function testimonials() {
  const box = $("#quotes"), dots = $("#quoteDots"); let i = 0, timer;
  const draw = () => {
    box.innerHTML = `<blockquote>“${QUOTES[i][0]}”<cite>${QUOTES[i][1]}</cite></blockquote>`;
    dots.innerHTML = QUOTES.map((_, n) => `<button type="button" aria-label="Testimonial ${n + 1}" ${n === i ? 'aria-current="true"' : ""} data-n="${n}"></button>`).join("");
  };
  const auto = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => { i = (i + 1) % QUOTES.length; draw(); }, 6500); };
  dots.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { i = +b.dataset.n; draw(); auto(); } });
  box.addEventListener("mouseenter", () => clearInterval(timer)); box.addEventListener("mouseleave", auto);
  draw(); auto();
}
const FAQ = [
  ["How long does a typical floor take?", "Most rooms take 3–6 working days including prep, setting, grouting and sealing. Large or complex layouts like herringbone take longer."],
  ["Does marble stain or scratch easily?", "Marble is calcium-based, so acids (lemon, wine, some cleaners) can etch it. Honed finishes hide wear better than polished. We seal every installation and give you a care guide."],
  ["Can marble be used in a shower?", "Yes, when properly waterproofed and sealed. We use a membrane system and white thin-set to prevent staining."],
  ["Do you supply the stone?", "Either way works. We source from trusted suppliers or install material you bought — we'll check it for flatness and defects first."],
  ["Is underfloor heating compatible?", "Yes. Marble conducts heat very well. We install electric mats beneath the stone as an optional extra."],
  ["Do you offer a warranty?", "All installations carry a two-year workmanship warranty, covering setting and grouting defects."],
  ["How do I clean marble?", "Use a pH-neutral stone cleaner and a soft mop. Avoid vinegar, bleach and abrasive powders."]
];
function faq() {
  const list = $("#faqList");
  list.insertAdjacentHTML("beforebegin", '<input class="faq-search" id="faqSearch" type="search" placeholder="Search questions…" aria-label="Search questions">');
  const draw = q => {
    const rows = FAQ.filter(([a, b]) => (a + b).toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = rows.length ? rows.map(([a, b]) => `<details><summary>${a}</summary><p>${b}</p></details>`).join("") : '<p class="muted">No matches — ask us in the form below.</p>';
  };
  $("#faqSearch").addEventListener("input", e => draw(e.target.value)); draw("");
}

/* ---------- quote form ---------- */
function renderSummary() {
  const s = stoneById(state.stone), p = PATTERNS.find(p => p.id === state.pattern), e = state.estimate;
  const el = $("#quoteSummary"); if (!el) return;
  el.innerHTML = `<div><span>Design</span><span>${s.name} · ${p.name} · ${state.finish}</span></div>` +
    (e ? `<div><span>Estimate</span><span>${money(Math.round(e.lo / 10) * 10)} – ${money(Math.round(e.hi / 10) * 10)}</span></div><div><span>Area</span><span>${e.area} sq ft (${e.type})</span></div>` : "");
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
    const s = stoneById(state.stone), est = state.estimate;
    const rec = { at: Date.now(), name: $("#qName").value.trim(), phone: $("#qPhone").value, email: $("#qEmail").value, zip: $("#qZip").value, when: $("#qWhen").value, msg: $("#qMsg").value, design: `${s.name} ${state.pattern}`, estimate: est ? `${money(Math.round(est.lo / 10) * 10)}–${money(Math.round(est.hi / 10) * 10)}` : "n/a" };
    const list = store.get("wms-requests", []); list.unshift(rec); store.set("wms-requests", list.slice(0, 10)); drawSaved();
    const body = `Name: ${rec.name}\nPhone: ${rec.phone}\nEmail: ${rec.email}\nZIP: ${rec.zip}\nStart: ${rec.when}\nDesign: ${s.name}, ${state.pattern}, ${state.size}" tiles, ${state.finish}, grout ${state.grout}\nEstimate: ${rec.estimate}${est ? ` (${est.area} sq ft ${est.type})` : ""}\nPhotos to follow: ${$("#qPhotos").checked ? "yes" : "no"}\n\n${rec.msg}`;
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
  $$("[data-count]").forEach(el => {
    const end = +el.dataset.count; if (reduceMotion) return void (el.textContent = end.toLocaleString());
    const t0 = performance.now(), step = t => { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

heroBackground(); services(); visualizer(); estimator(); beforeAfter(); gallery(); process(); testimonials(); faq(); quoteForm(); page();
