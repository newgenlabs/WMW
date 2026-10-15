"use strict";
/* Home-page walkthrough: stone doors open onto a first-person drone tour (3D rendering, or a real video if TOUR_VIDEO is set). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const sec = $("#tour"); if (!sec) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const enterBtn = $("#enterBtn"), doors = $("#doors"), ui = $("#tourUi"), range = $("#tourRange"), timeEl = $("#tourTime");
  const playBtn = $("#tourPlay"), capEl = $("#tourCap"), pills = $("#tourPills"), ticks = $("#tourTicks"), fade = $("#tourFade"), hint = $("#tourHint");
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  /* marble door faces, painted once with the site's own stone renderer */
  try {
    const c = document.createElement("canvas"); c.width = 1600; c.height = 900;
    const st = { ...stoneByIdAny("calacatta"), strength: 1 };
    drawStone(c.getContext("2d"), 0, 0, 1600, 900, st, 4242, "polished");
    const url = c.toDataURL("image/jpeg", .85);
    $$doors(".door").forEach((d, i) => { d.style.backgroundImage = `url(${url})`; d.style.backgroundPosition = i ? "right center" : "left center"; });
  } catch (e) { /* plain doors */ }
  function $$doors(s) { return [...doors.querySelectorAll(s)]; }

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
  } else {
    try {
      if (typeof THREE === "undefined") throw new Error("three.js missing");
      world = buildTourWorld($("#tourCanvas")); mode = "3d"; world.resize(); world.setTime(0); world.render();
    } catch (e) { mode = "none"; sec.classList.add("no-3d"); }
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
    const q = $("#collSearch"); if (q) { q.value = b.dataset.s; q.dispatchEvent(new Event("input", { bubbles: true })); }
    $("#collection").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
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
    if (!active || document.hidden) return;
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
  new IntersectionObserver(es => { active = es[0].isIntersecting && sec.classList.contains("open"); loop(); }, { threshold: .15 }).observe(sec);
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

  /* ---------- opening the doors ---------- */
  let opened = false;
  function open() {
    if (opened) return; opened = true; sec.classList.add("open"); sec.focus({ preventScroll: true });
    ui.hidden = false; seek(0); showChapter(0);
    const done = () => { doors.hidden = true; };
    reduce ? done() : setTimeout(done, 2000);
    active = true; setPlaying(!reduce);
    if (!reduce) { hint.classList.add("on"); setTimeout(() => hint.classList.remove("on"), 7000); }
  }
  if (mode === "none") { enterBtn.textContent = "Explore the site"; enterBtn.addEventListener("click", () => $("#intro").scrollIntoView({ behavior: reduce ? "auto" : "smooth" })); }
  else {
    enterBtn.addEventListener("click", open);
    ["mouseenter", "focus"].forEach(t => enterBtn.addEventListener(t, () => doors.classList.add("peek")));
    ["mouseleave", "blur"].forEach(t => enterBtn.addEventListener(t, () => doors.classList.remove("peek")));
  }
  $("#tourReplay")?.addEventListener("click", () => { seek(0); setPlaying(true); });
  setPlayIcon();
})();
