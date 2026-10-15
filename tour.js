"use strict";
/* Home-page banner (static glowing-marble collection showcase) that can open into a first-person drone tour (3D rendering, or a real video if TOUR_VIDEO is set). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const sec = $("#tour"); if (!sec) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const enterBtn = $("#enterBtn"), banner = $("#banner"), starts = [...document.querySelectorAll(".js-start")], ui = $("#tourUi"), range = $("#tourRange"), timeEl = $("#tourTime");
  const playBtn = $("#tourPlay"), capEl = $("#tourCap"), pills = $("#tourPills"), ticks = $("#tourTicks"), fade = $("#tourFade"), hint = $("#tourHint");
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  /* header turns solid once the page scrolls; swatch in the banner note card */
  const hd = $("#header"), onScroll = () => hd.classList.toggle("solid", scrollY > 40);
  onScroll(); addEventListener("scroll", onScroll, { passive: true });
  bannerArt();

  /* ---------- player adapters ---------- */
  let world = null, video = null, mode = "none";
  let ending = false, T = 0, DUR = TOUR_DURATION, playing = false, yaw = 0, pitch = 0, dragging = false, active = false, last = 0, raf = 0, slow = 0, frames = 0;
  const chapters = TOUR_CHAPTERS;
  const chapAt = s => { let i = 0; chapters.forEach((c, k) => { if (s >= c.t / TOUR_DURATION * DUR) i = k; }); return i; };

  if (typeof TOUR_VIDEO === "string" && TOUR_VIDEO) {
    mode = "video"; video = document.createElement("video");
    Object.assign(video, { src: TOUR_VIDEO, muted: true, playsInline: true, preload: "auto", loop: false });
    video.className = "tour-video"; sec.prepend(video);
    video.addEventListener("loadedmetadata", () => { DUR = video.duration || DUR; });
    video.addEventListener("ended", () => { video.currentTime = 0; video.play(); });
  } else mode = typeof THREE === "undefined" ? "none" : "3d";
  /* the 3D world is built on first use, so the home page stays light until someone starts the tour */
  function ensureWorld() {
    if (world) return true;
    try { world = buildTourWorld($("#tourCanvas")); world.resize(); return true; }
    catch (e) { mode = "none"; sec.classList.add("no-3d"); return false; }
  }

  /* ---------- UI ---------- */
  ticks.innerHTML = chapters.map(c => `<i style="left:${c.t / TOUR_DURATION * 100}%"></i>`).join("");
  pills.innerHTML = chapters.map((c, i) => `<button type="button" data-i="${i}">${i + 1}. ${c.title}</button>`).join("");
  let shownChap = -1;
  function showChapter(i) {
    if (i === shownChap) return; shownChap = i; const c = chapters[i];
    capEl.classList.remove("in");
    setTimeout(() => {
      capEl.innerHTML = `<p class="eyebrow">Chapter ${i + 1} of ${chapters.length}</p><h2>${c.title}</h2><p>${c.text}</p>` +
        (c.stones.length ? `<p class="cap-chips">${c.stones.map(s => `<button type="button" data-s="${s}">${s}</button>`).join("")}</p>` : "");
      capEl.classList.add("in");
    }, 180);
    [...pills.children].forEach((b, k) => b.setAttribute("aria-current", k === i));
  }
  capEl.addEventListener("click", e => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    location.href = "collection.html?q=" + encodeURIComponent(b.dataset.s);
  });
  const setPlayIcon = () => { playBtn.setAttribute("aria-label", playing ? "Pause tour" : "Play tour"); playBtn.classList.toggle("paused", !playing); };
  function seek(s) { T = Math.max(0, Math.min(DUR, s)); if (mode === "video") video.currentTime = T; else drawNow(); sync(); }
  function sync() { range.value = Math.round(T / DUR * 1000); timeEl.textContent = `${fmt(T)} / ${fmt(DUR)}`; showChapter(chapAt(T)); }
  function drawNow(dt = 0) { if (world) { world.setTime(T, yaw, pitch, dt); world.render(); } }
  function setPlaying(p) {
    playing = p; setPlayIcon();
    if (mode === "video") { p ? video.play().catch(() => {}) : video.pause(); }
    loop();
  }

  /* ---------- render loop (runs only while visible, open and the tab is shown) ---------- */
  function loop() {
    cancelAnimationFrame(raf);
    if (!active || !opened || document.hidden) return;
    last = performance.now(); raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (mode === "video") { T = video.currentTime; sync(); return; }
    if (playing) { T += dt; if (T >= DUR && !ending) { ending = true; fade.classList.add("on"); setTimeout(() => { T = 0; ending = false; fade.classList.remove("on"); }, 600); } if (ending) T = Math.min(T, DUR - .001); }
    if (!dragging) { const k = Math.min(1, dt * 1.8); yaw -= yaw * k; pitch -= pitch * k; }
    drawNow(dt); sync();
    if (world && dt > 0) { slow += dt > .034 ? 1 : -.5; slow = Math.max(0, slow); if (++frames > 90 && slow > 40 && world.ratio > 1) { world.setRatio(1); } }
  }
  document.addEventListener("visibilitychange", loop);
  new IntersectionObserver(es => { active = es[0].isIntersecting; loop(); }, { threshold: .15 }).observe(sec);
  addEventListener("resize", () => { if (world) { world.resize(); drawNow(); } });

  /* ---------- controls ---------- */
  playBtn.addEventListener("click", () => setPlaying(!playing));
  range.addEventListener("input", () => seek(range.value / 1000 * DUR));
  pills.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; seek(chapters[b.dataset.i].t / TOUR_DURATION * DUR); if (!playing) setPlaying(true); });
  $("#tourFs").addEventListener("click", () => { document.fullscreenElement ? document.exitFullscreen() : sec.requestFullscreen?.(); });
  $("#tourSkip").addEventListener("click", e => { e.preventDefault(); $("#intro").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
  sec.addEventListener("keydown", e => {
    if (!sec.classList.contains("open") || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target !== range) return;
    if (e.code === "Space" && e.target === sec) { e.preventDefault(); setPlaying(!playing); }
    if (e.key === "ArrowRight") seek(T + 5); if (e.key === "ArrowLeft") seek(T - 5);
  });
  const cv = $("#tourCanvas"); let px = 0, py = 0;
  cv.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; py = e.clientY; cv.setPointerCapture(e.pointerId); hint.classList.remove("on"); });
  cv.addEventListener("pointermove", e => {
    if (!dragging) return;
    yaw = Math.max(-1.15, Math.min(1.15, yaw + (e.clientX - px) * .004)); pitch = Math.max(-.6, Math.min(.6, pitch + (e.clientY - py) * .003)); px = e.clientX; py = e.clientY;
    if (!playing) drawNow();
  });
  ["pointerup", "pointercancel"].forEach(t => cv.addEventListener(t, () => { dragging = false; }));

  /* ---------- opening the tour ---------- */
  let opened = false;
  function open() {
    if (opened) return;
    if (mode === "3d" && !ensureWorld()) { $("#intro").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); return; }
    opened = true; sec.classList.add("open"); sec.focus({ preventScroll: true });
    ui.hidden = false; seek(0); showChapter(chapAt(T));
    const done = () => { banner.hidden = true; };
    reduce ? done() : setTimeout(done, 800);
    active = true; setPlaying(!reduce);
    if (!reduce) { hint.classList.add("on"); setTimeout(() => hint.classList.remove("on"), 7000); }
  }
  if (mode === "none") { enterBtn.textContent = "Explore the site"; starts.forEach(b => b.addEventListener("click", () => $("#intro").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }))); }
  else starts.forEach(b => b.addEventListener("click", open));
  if (mode === "video") { video.currentTime = 0.01; }
  $("#tourReplay")?.addEventListener("click", () => { seek(0); setPlaying(true); });
  setPlayIcon();

  /* ---------- banner art: drawn once, no animation ---------- */
  function bannerArt() {
    const bg = $("#bnBg"); if (!bg) return;
    const paint = () => {
      const W = bg.width = Math.min(1920, bg.clientWidth || 1440), H = bg.height = Math.min(1100, bg.clientHeight || 900), g = bg.getContext("2d"), r = rng(77);
      const base = g.createLinearGradient(0, 0, W, H); base.addColorStop(0, "#05070b"); base.addColorStop(.55, "#0a0f16"); base.addColorStop(1, "#060a10");
      g.fillStyle = base; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) { const cx = r() * W, cy = r() * H, cr = (.25 + r() * .4) * Math.max(W, H), rg = g.createRadialGradient(cx, cy, 0, cx, cy, cr); rg.addColorStop(0, "rgba(30,48,66,.35)"); rg.addColorStop(1, "rgba(30,48,66,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
      g.lineCap = "round"; g.lineJoin = "round";
      const vein = (x, y, ang, len, w, depth) => {
        let px = x, py = y, a = ang; g.beginPath(); g.moveTo(px, py); const pts = [[px, py]], seg = 16;
        for (let s = 0; s < seg; s++) { a += (r() - .5) * .7; const l = len / seg; px += Math.cos(a) * l; py += Math.sin(a) * l; pts.push([px, py]); g.lineTo(px, py); if (depth < 2 && r() < .16) vein(px, py, a + (r() > .5 ? 1 : -1) * (.5 + r() * .7), len * .45, w * .55, depth + 1); }
        const pass = (lw, col, blur, al) => { g.save(); g.globalAlpha = al; g.strokeStyle = col; g.lineWidth = lw; g.shadowColor = "#37d6ff"; g.shadowBlur = blur; g.beginPath(); pts.forEach((p, i) => g[i ? "lineTo" : "moveTo"](p[0], p[1])); g.stroke(); g.restore(); };
        pass(w * 6, "#0f86a8", 24, .09); pass(w * 2.4, "#35d4f7", 14, .24); pass(w, "#d9fbff", 6, .7);
      };
      for (let i = 0; i < 6; i++) vein(r() * W * 1.1 - W * .05, -20 + r() * H * .4, 1.05 + (r() - .5) * 1.1, Math.max(W, H) * (.5 + r() * .6), .7 + r() * 1.3, 0);
      for (let i = 0; i < 3; i++) vein(-20, r() * H, (r() - .5) * .7, W * .8, 1, 1);
    };
    paint(); let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(paint, 200); });
    /* featured slabs */
    [["calacatta", "Calacatta"], ["nero", "Nero Marquina"], ["verde", "Verde Alpi"], ["statuario", "Statuario"], ["arabescato", "Arabescato"]].forEach(([id], i) => {
      const c = document.querySelector(`.slab[data-id="${id}"] canvas`); if (c) drawStone(c.getContext("2d"), 0, 0, c.width, c.height, stoneByIdAny(id), 30 + i * 7, "polished");
    });
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("bnStones", CATALOG.length); set("bnMats", new Set(CATALOG.map(c => c.mat)).size); set("bnProjects", typeof PROJECTS !== "undefined" ? PROJECTS.length : 16);
  }
})();
