"use strict";
/* Gallery page: swipeable rows by category, filter pills, and a swipeable lightbox. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("#ftPhone").textContent = CONFIG.phone; $("#ftEmail").textContent = CONFIG.email; $("#yr").textContent = new Date().getFullYear();
  const tog = $(".nav-toggle"), nav = $("#nav");
  tog.addEventListener("click", () => { const o = nav.classList.toggle("open"); tog.setAttribute("aria-expanded", o); });

  const ORDER = ["Kitchens", "Showers & Baths", "Commercial", "Feature walls", "Floors"];
  const cats = ORDER.filter(c => PROJECTS.some(p => p.cat === c)).concat([...new Set(PROJECTS.map(p => p.cat))].filter(c => !ORDER.includes(c)));
  let cur = "All", view = [];

  const pills = $("#galPills"), rows = $("#galRows");
  const drawPills = () => {
    pills.innerHTML = ["All", ...cats].map(c => `<button type="button" aria-pressed="${c === cur}">${esc(c)}<em>${c === "All" ? PROJECTS.length : PROJECTS.filter(p => p.cat === c).length}</em></button>`).join("");
  };
  const drawRows = () => {
    const shown = cats.filter(c => cur === "All" || c === cur);
    view = shown.flatMap(c => PROJECTS.filter(p => p.cat === c));
    rows.innerHTML = shown.map(c => {
      const items = PROJECTS.filter(p => p.cat === c);
      return `<section class="grow" data-cat="${esc(c)}" aria-label="${esc(c)}">
        <div class="grow-head"><h2>${esc(c)}</h2><span class="fine">${items.length} project${items.length > 1 ? "s" : ""}</span>
          <div class="grow-btns"><button type="button" class="rail-btn" data-d="-1" aria-label="Scroll ${esc(c)} left">&lsaquo;</button><button type="button" class="rail-btn" data-d="1" aria-label="Scroll ${esc(c)} right">&rsaquo;</button></div></div>
        <div class="rail" tabindex="0" aria-label="${esc(c)} photos, scroll horizontally">
          ${items.map(p => `<button type="button" class="slide" data-n="${p.n}"><img src="${pimg(p, true)}" alt="${esc(p.t)}" loading="lazy" draggable="false"><span class="cap"><b>${esc(p.t)}</b><small>${esc(p.where)}</small></span></button>`).join("")}
        </div></section>`;
    }).join("");
    $$(".rail", rows).forEach(updateEdges);
  };
  function updateEdges(r) {
    const sec = r.closest(".grow"), max = r.scrollWidth - r.clientWidth;
    sec.classList.toggle("at-start", r.scrollLeft < 4); sec.classList.toggle("at-end", r.scrollLeft > max - 4); sec.classList.toggle("no-scroll", max < 4);
  }
  rows.addEventListener("scroll", e => { if (e.target.classList?.contains("rail")) updateEdges(e.target); }, true);
  addEventListener("resize", () => $$(".rail", rows).forEach(updateEdges));
  pills.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    cur = b.firstChild.textContent; drawPills(); drawRows();
    if (cur !== "All") $("#galNav").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });
  rows.addEventListener("click", e => {
    const btn = e.target.closest(".rail-btn");
    if (btn) { const r = $(".rail", btn.closest(".grow")); r.scrollBy({ left: +btn.dataset.d * r.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" }); return; }
    const s = e.target.closest(".slide"); if (s && !dragMoved) open(view.findIndex(p => p.n === +s.dataset.n));
  });

  /* mouse drag-to-scroll on rails (touch uses native swipe) */
  let drag = null, dragMoved = false;
  rows.addEventListener("pointerdown", e => {
    const r = e.target.closest(".rail"); if (!r || e.pointerType !== "mouse") return;
    drag = { r, x: e.clientX, left: r.scrollLeft }; dragMoved = false;
  });
  addEventListener("pointermove", e => {
    if (!drag) return; const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { dragMoved = true; drag.r.classList.add("dragging"); }
    if (dragMoved) drag.r.scrollLeft = drag.left - dx;
  });
  addEventListener("pointerup", () => { if (drag) { drag.r.classList.remove("dragging"); drag = null; setTimeout(() => { dragMoved = false; }, 0); } });

  /* lightbox */
  const dlg = document.createElement("dialog"); dlg.className = "lightbox gdlg"; dlg.setAttribute("aria-label", "Project photo"); document.body.append(dlg);
  let idx = 0;
  function open(i) {
    idx = (i + view.length) % view.length; const p = view[idx];
    dlg.innerHTML = `<div class="lb"><div class="lb-img" id="lbImg"><img src="${pimg(p)}" alt="${esc(p.t)}" draggable="false">
      <button class="lb-nav prev" data-a="prev" aria-label="Previous photo">&lsaquo;</button><button class="lb-nav next" data-a="next" aria-label="Next photo">&rsaquo;</button>
      <span class="lb-count">${idx + 1} / ${view.length}</span></div>
      <div class="body"><p class="eyebrow">${esc(p.cat)}</p><h3>${esc(p.t)}</h3><p>${esc(p.desc)}</p>
      <dl><dt>Material</dt><dd>${esc(p.stone)}</dd><dt>Layout</dt><dd>${esc(p.layout)}</dd><dt>Finish</dt><dd>${esc(p.finish)}</dd><dt>Setting</dt><dd>${esc(p.where)}</dd></dl>
      <div class="row"><a class="btn" href="index.html#quote">Request something similar</a><button class="btn btn-ghost" data-a="close" type="button">Close</button></div></div></div>`;
    if (!dlg.open) dlg.showModal();
    [view[(idx + 1) % view.length], view[(idx - 1 + view.length) % view.length]].forEach(q => { new Image().src = pimg(q); });
  }
  dlg.addEventListener("click", e => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (e.target === dlg || a === "close") dlg.close(); else if (a === "prev") open(idx - 1); else if (a === "next") open(idx + 1);
  });
  dlg.addEventListener("keydown", e => { if (e.key === "ArrowLeft") open(idx - 1); if (e.key === "ArrowRight") open(idx + 1); });
  let sx = null, sy = null;
  dlg.addEventListener("touchstart", e => { if (e.target.closest("#lbImg")) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
  dlg.addEventListener("touchend", e => {
    if (sx === null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) open(idx + (dx < 0 ? 1 : -1));
  });

  /* deep link: gallery.html#Kitchens */
  const want = decodeURIComponent(location.hash.slice(1)); if (cats.includes(want)) cur = want;
  drawPills(); drawRows();
})();
