"use strict";
/* Stone & tile collection browser: filters, search, sort, quick view with layout preview, saved selections. */
(function () {
  const PAGE = 12;
  const f = { group: "All", q: "", mats: new Set(), colors: new Set(), fins: new Set(), uses: new Set(), sort: "az" };
  let page = 1, list = [];
  const seedOf = id => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const colorHex = id => COLOR_FAMILIES.find(c => c.id === id).hex;

  /* ----- selections ----- */
  const getSel = () => store.get("wms-sel", []);
  const isSaved = id => getSel().some(e => e.id === id);
  function setSel(arr) { store.set("wms-sel", arr); refreshSel(); }
  function toggleSave(id, finish) {
    const arr = getSel(), i = arr.findIndex(e => e.id === id);
    if (i >= 0) { arr.splice(i, 1); toast("Removed from selections"); }
    else { arr.push({ id, finish }); toast("Saved to selections"); }
    setSel(arr);
  }
  const fab = document.createElement("button");
  fab.className = "sel-fab"; fab.type = "button"; fab.hidden = true;
  fab.innerHTML = 'Selections <b id="selCount">0</b>';
  document.body.append(fab);
  function refreshSel() {
    const n = getSel().length; fab.hidden = n === 0; $("#selCount").textContent = n;
    $$(".pc-save").forEach(b => { const on = isSaved(b.dataset.id); b.setAttribute("aria-pressed", on); b.textContent = on ? "Saved" : "Save"; });
    const pvSave = $("[data-a=save]", pv); if (pvSave && pv.open) pvSave.textContent = isSaved(pvState.id) ? "Remove from selections" : "Save to selections";
    if (typeof renderSummary === "function") renderSummary();
    if (selDlg.open) drawSelDialog();
  }

  /* ----- filtering ----- */
  function matches(p, skip) {
    if (f.group !== "All" && p.group !== f.group) return false;
    if (f.q) { const t = (p.name + " " + p.mat + " " + p.color + " " + p.tone + " " + p.finishes.join(" ") + " " + p.origin).toLowerCase(); if (!f.q.toLowerCase().split(/\s+/).every(w => t.includes(w))) return false; }
    if (skip !== "mats" && f.mats.size && !f.mats.has(p.mat)) return false;
    if (skip !== "colors" && f.colors.size && !f.colors.has(p.color)) return false;
    if (skip !== "fins" && f.fins.size && !p.finishes.some(x => f.fins.has(x))) return false;
    if (skip !== "uses" && f.uses.size && !p.uses.some(x => f.uses.has(x))) return false;
    return true;
  }
  const sorters = {
    az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name),
    light: (a, b) => lum(b.base) - lum(a.base), dark: (a, b) => lum(a.base) - lum(b.base),
    mat: (a, b) => a.mat.localeCompare(b.mat) || a.name.localeCompare(b.name)
  };

  /* ----- layout ----- */
  const root = $("#collection");
  const fil = $("#collFilters"), grid = $("#collGrid"), chips = $("#collChips"), more = $("#collMore"), count = $("#collCount");

  function buildFilters() {
    const base = CATALOG.filter(p => f.group === "All" || p.group === f.group);
    const cnt = (key, get) => { const m = new Map(); base.filter(p => matches(p, key)).forEach(p => [].concat(get(p)).forEach(v => m.set(v, (m.get(v) || 0) + 1))); return m; };
    const mats = [...new Set(base.map(p => p.mat))];
    const fins = [...new Set(CATALOG.flatMap(p => p.finishes))].sort();
    const cm = cnt("mats", p => p.mat), cc = cnt("colors", p => p.color), cf = cnt("fins", p => p.finishes), cu = cnt("uses", p => p.uses);
    const check = (key, set, items, counts) => items.map(v => `<label class="ck"><input type="checkbox" data-k="${key}" value="${esc(v)}" ${set.has(v) ? "checked" : ""}><span>${esc(v)}</span><em>${counts.get(v) || 0}</em></label>`).join("");
    fil.innerHTML = `
      <div class="fg"><h4>Material</h4>${check("mats", f.mats, mats, cm)}</div>
      <div class="fg"><h4>Colour</h4><div class="dots">${COLOR_FAMILIES.map(c => `<button type="button" class="cdot" data-k="colors" data-v="${c.id}" aria-pressed="${f.colors.has(c.id)}" title="${c.id} (${cc.get(c.id) || 0})"><i style="background:${c.hex}"></i><span>${c.id}</span></button>`).join("")}</div></div>
      <div class="fg"><h4>Finish</h4>${check("fins", f.fins, fins, cf)}</div>
      <div class="fg"><h4>Application</h4>${check("uses", f.uses, APPLICATIONS, cu)}</div>
      <button type="button" class="btn btn-ghost fclear">Clear all filters</button>`;
  }

  function render(reset) {
    if (reset) page = 1;
    list = CATALOG.filter(p => matches(p)).sort(sorters[f.sort]);
    buildFilters();
    // chips
    const cs = [];
    [["mats", f.mats], ["colors", f.colors], ["fins", f.fins], ["uses", f.uses]].forEach(([k, set]) => set.forEach(v => cs.push(`<button type="button" class="chipx" data-k="${k}" data-v="${esc(v)}">${esc(v)} <span aria-hidden="true">&times;</span><span class="sr">remove filter</span></button>`)));
    if (f.q) cs.push(`<button type="button" class="chipx" data-k="q">&ldquo;${esc(f.q)}&rdquo; <span aria-hidden="true">&times;</span></button>`);
    chips.innerHTML = cs.join("");
    const shown = list.slice(0, page * PAGE);
    count.textContent = list.length ? `Showing ${shown.length} of ${list.length}` : "";
    grid.innerHTML = shown.map(p => `
      <article class="pcard">
        <button type="button" class="pc-main" data-id="${p.id}" aria-label="Quick view: ${esc(p.name)}">
          <canvas width="300" height="375"></canvas>
          <span class="pc-view">Quick view</span>
        </button>
        <button type="button" class="pc-save" data-id="${p.id}" aria-pressed="${isSaved(p.id)}">${isSaved(p.id) ? "Saved" : "Save"}</button>
        <div class="pc-meta">
          <p class="pc-mat">${esc(p.mat)}</p>
          <h3>${esc(p.name)}</h3>
          <p class="pc-sub"><i style="background:${colorHex(p.color)}"></i>${esc(p.color)} &middot; ${esc(p.finishes.join(", "))}</p>
        </div>
      </article>`).join("") || `<p class="coll-empty">No products match these filters. <button type="button" class="link-arrow" data-a="clear">Clear filters</button></p>`;
    $$(".pc-main", grid).forEach(b => { const p = stoneByIdAny(b.dataset.id), c = $("canvas", b); drawStone(c.getContext("2d"), 0, 0, c.width, c.height, p, seedOf(p.id), p.finishes[0]); });
    more.hidden = shown.length >= list.length;
    more.textContent = `Show more (${list.length - shown.length})`;
  }

  /* ----- events: filters ----- */
  root.addEventListener("change", e => {
    const k = e.target.dataset.k; if (!k) return;
    const set = f[k]; e.target.checked ? set.add(e.target.value) : set.delete(e.target.value); render(true);
  });
  root.addEventListener("click", e => {
    const dot = e.target.closest(".cdot"); if (dot) { const v = dot.dataset.v; f.colors.has(v) ? f.colors.delete(v) : f.colors.add(v); return render(true); }
    const ch = e.target.closest(".chipx"); if (ch) { ch.dataset.k === "q" ? (f.q = "", $("#collSearch").value = "") : f[ch.dataset.k].delete(ch.dataset.v); return render(true); }
    if (e.target.closest(".fclear") || e.target.closest("[data-a=clear]")) { ["mats", "colors", "fins", "uses"].forEach(k => f[k].clear()); f.q = ""; $("#collSearch").value = ""; return render(true); }
    const tab = e.target.closest(".coll-tab"); if (tab) {
      f.group = tab.dataset.g; f.mats.clear(); $$(".coll-tab").forEach(t => t.setAttribute("aria-selected", t === tab)); return render(true);
    }
    const sv = e.target.closest(".pc-save"); if (sv) { const p = stoneByIdAny(sv.dataset.id); return toggleSave(p.id, p.finishes[0]); }
    const mb = e.target.closest(".pc-main"); if (mb) return openPV(mb.dataset.id);
    if (e.target.closest("#collMore")) { page++; return render(); }
    if (e.target.closest("#collFilterToggle")) { const o = fil.classList.toggle("open"); e.target.setAttribute("aria-expanded", o); }
  });
  let st; $("#collSearch").addEventListener("input", e => { clearTimeout(st); st = setTimeout(() => { f.q = e.target.value.trim(); render(true); }, 160); });
  $("#collSort").addEventListener("change", e => { f.sort = e.target.value; render(true); });

  /* ----- quick view ----- */
  const pv = document.createElement("dialog"); pv.className = "lightbox pvdlg"; pv.setAttribute("aria-label", "Product details"); document.body.append(pv);
  let pvState = { id: "", finish: "", view: "close", pattern: "herringbone", grout: GROUTS[0].id };
  const tileInches = p => { const m = (p.sizes[0] || "").match(/(\d+)x(\d+)/); if (p.kind === "wood") return 24; return m ? Math.min(24, Math.max(8, +m[1])) : 24; };
  function openPV(id) {
    const p = stoneByIdAny(id);
    pvState = { id, finish: isSaved(id) ? (getSel().find(e => e.id === id).finish) : p.finishes[0], view: "close", pattern: p.kind === "wood" ? "brick" : p.kind === "mosaic" ? "straight" : "straight", grout: GROUTS[0].id };
    drawPV(); if (!pv.open) pv.showModal();
  }
  const step = d => { const i = list.findIndex(p => p.id === pvState.id); if (i < 0 || !list.length) return; openPV(list[(i + d + list.length) % list.length].id); };
  function drawPV() {
    const p = stoneByIdAny(pvState.id), s = pvState;
    pv.innerHTML = `<div class="pv">
      <div class="pv-view"><canvas width="900" height="760" role="img" aria-label="${esc(p.name)} preview"></canvas>
        <button class="lb-nav prev" data-a="prev" aria-label="Previous product">&lsaquo;</button><button class="lb-nav next" data-a="next" aria-label="Next product">&rsaquo;</button>
        <div class="pv-tabs"><button data-a="view" data-v="close" aria-pressed="${s.view === "close"}">Close-up</button><button data-a="view" data-v="layout" aria-pressed="${s.view === "layout"}">In a layout</button></div></div>
      <div class="body pv-info">
        <p class="eyebrow">${esc(p.group)} &middot; ${esc(p.mat)}</p>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="pv-ctl"><span class="pv-l">Finish</span><div class="seg">${p.finishes.map(x => `<button type="button" data-a="finish" data-v="${x}" aria-pressed="${x === s.finish}">${x}</button>`).join("")}</div></div>
        ${s.view === "layout" ? `<div class="pv-ctl"><span class="pv-l">Layout</span><div class="seg">${PATTERNS.map(x => `<button type="button" data-a="pattern" data-v="${x.id}" aria-pressed="${x.id === s.pattern}">${x.name}</button>`).join("")}</div></div>
        <div class="pv-ctl"><span class="pv-l">Grout</span><div class="seg">${GROUTS.map(g => `<button type="button" data-a="grout" data-v="${g.id}" aria-pressed="${g.id === s.grout}"><i class="gdot" style="background:${g.id}"></i>${g.name}</button>`).join("")}</div></div>` : ""}
        <dl class="pv-dl"><div><dt>Colour</dt><dd>${esc(p.color)} &mdash; ${esc(p.tone)}</dd></div><div><dt>Finishes</dt><dd>${esc(p.finishes.join(", "))}</dd></div><div><dt>Sizes</dt><dd>${esc(p.sizes.join(", "))}</dd></div><div><dt>Applications</dt><dd>${esc(p.uses.join(", "))}</dd></div>${p.origin ? `<div><dt>Origin</dt><dd>${esc(p.origin)}</dd></div>` : ""}<div><dt>Suggested layout</dt><dd>${esc(p.layout)}</dd></div></dl>
        <p class="fine">On-screen colours and veining are an approximation. Natural stone varies from slab to slab, so viewing samples before selecting is recommended.</p>
        <div class="row"><button class="btn" data-a="save" type="button">${isSaved(p.id) ? "Remove from selections" : "Save to selections"}</button><button class="btn btn-ghost" data-a="quote" type="button">Request a quote</button><button class="btn btn-ghost" data-a="close" type="button">Close</button></div>
      </div></div>`;
    const c = $("canvas", pv), ctx = c.getContext("2d");
    if (s.view === "close") drawStone(ctx, 0, 0, c.width, c.height, p, seedOf(p.id) + 1, s.finish);
    else layFloor(ctx, c.width, c.height, { stone: p, pattern: s.pattern, tileIn: tileInches(p), ppi: c.width / 144, grout: s.grout, finish: s.finish, seed: seedOf(p.id) });
  }
  pv.addEventListener("click", e => {
    const b = e.target.closest("[data-a]"), a = b?.dataset.a, v = b?.dataset.v;
    if (e.target === pv || a === "close") return pv.close();
    if (a === "prev") return step(-1); if (a === "next") return step(1);
    if (a === "view") { pvState.view = v; return drawPV(); }
    if (a === "finish") { pvState.finish = v; if (isSaved(pvState.id)) setSel(getSel().map(x => x.id === pvState.id ? { ...x, finish: v } : x)); return drawPV(); }
    if (a === "pattern") { pvState.pattern = v; return drawPV(); }
    if (a === "grout") { pvState.grout = v; return drawPV(); }
    if (a === "save") { toggleSave(pvState.id, pvState.finish); return drawPV(); }
    if (a === "quote") {
      const p = stoneByIdAny(pvState.id); pv.close();
      goToQuote(`I'd like a quote for ${p.name} (${p.mat}, ${pvState.finish} finish).`);
    }
  });
  pv.addEventListener("keydown", e => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });

  /* ----- selections dialog ----- */
  const selDlg = document.createElement("dialog"); selDlg.className = "lightbox seldlg"; selDlg.setAttribute("aria-label", "Saved selections"); document.body.append(selDlg);
  function drawSelDialog() {
    const sel = getSel();
    selDlg.innerHTML = `<div class="body selbody"><p class="eyebrow">Your project board</p><h3>Saved selections</h3>
      ${sel.length ? `<ul class="sel-list">${sel.map(e => { const p = stoneByIdAny(e.id); return `<li data-id="${p.id}"><canvas width="72" height="72"></canvas><div><b>${esc(p.name)}</b><small>${esc(p.mat)} &middot; ${esc(p.color)}</small></div><select data-a="sfin" aria-label="Finish for ${esc(p.name)}">${p.finishes.map(x => `<option ${x === e.finish ? "selected" : ""}>${x}</option>`).join("")}</select><button type="button" class="rm" data-a="rm" aria-label="Remove ${esc(p.name)}">Remove</button></li>`; }).join("")}</ul>` : `<p class="muted">Nothing saved yet. Use the Save button on any product.</p>`}
      <div class="row"><button class="btn" data-a="req" type="button" ${sel.length ? "" : "disabled"}>Request quote with these</button><button class="btn btn-ghost" data-a="clear" type="button" ${sel.length ? "" : "disabled"}>Clear all</button><button class="btn btn-ghost" data-a="close" type="button">Close</button></div></div>`;
    $$("li", selDlg).forEach(li => { const p = stoneByIdAny(li.dataset.id), c = $("canvas", li); drawStone(c.getContext("2d"), 0, 0, 72, 72, p, seedOf(p.id) + 2, p.finishes[0]); });
  }
  fab.addEventListener("click", () => { drawSelDialog(); selDlg.showModal(); });
  selDlg.addEventListener("click", e => {
    const b = e.target.closest("[data-a]"), a = b?.dataset.a;
    if (e.target === selDlg || a === "close") return selDlg.close();
    const id = b?.closest("li")?.dataset.id;
    if (a === "rm") return setSel(getSel().filter(x => x.id !== id));
    if (a === "clear") return setSel([]);
    if (a === "req") { const sel = selectionsList(); selDlg.close(); goToQuote("Selections: " + sel.map(i => `${i.name} (${i.finish})`).join("; ") + "."); }
  });
  selDlg.addEventListener("change", e => {
    if (e.target.dataset.a !== "sfin") return;
    const id = e.target.closest("li").dataset.id; setSel(getSel().map(x => x.id === id ? { ...x, finish: e.target.value } : x));
  });

  const q0 = new URLSearchParams(location.search).get("q"); if (q0) { f.q = q0.trim(); $("#collSearch").value = f.q; }
  onStoneImages(() => { render(); if (pv.open) drawPV(); });
  render(true); refreshSel();
})();
