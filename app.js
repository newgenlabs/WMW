"use strict";
/* Home page behaviour: services, process, FAQ, quote form. */
/* ---------- services ---------- */
const SERVICES = [
  { t: "Floors", d: "Entries, kitchens, lobbies and living areas: flat, flush and lippage-free.", img: 12 },
  { t: "Showers and baths", d: "Slab and tile surrounds, waterproofed, sloped and sealed.", img: 6 },
  { t: "Stairs and thresholds", d: "Precisely cut treads, risers, nosings and inlay borders.", img: 11 },
  { t: "Walls and backsplashes", d: "Book-matched slabs, mosaics and feature walls.", img: 13 },
  { t: "Countertops and islands", d: "Waterfall edges, mitred returns and vein-matched seams.", img: 16 },
  { t: "Custom stonework", d: "Ledges, inlays, bar tops and one-off architectural pieces.", img: 4 }
];
function services() {
  const list = $("#serviceList");
  list.innerHTML = SERVICES.map((s, i) => `<li><button type="button" class="svc" data-i="${i}"><img src="images/project-${String(s.img).padStart(2, "0")}-thumb.jpg" alt="" loading="lazy"><span class="svc-txt"><b>${s.t}</b><small>${s.d}</small></span><span class="svc-go" aria-hidden="true">&rarr;</span></button></li>`).join("");
  list.addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    goToQuote(`I'm interested in: ${SERVICES[b.dataset.i].t}.`);
  });
}

/* ---------- process / testimonials / faq ---------- */
const STEPS = [
  { t: "Free site visit", time: "Day 1", d: "The substrate is measured and checked, and stone, layout and budget are talked through.", li: ["Moisture & flatness check", "Slab or tile selection help", "Written fixed-price quote"] },
  { t: "Prep", time: "Days 2–3", d: "A great job is 80% preparation. Old surfaces are removed and the substrate is made flat and sound.", li: ["Demolition and disposal", "Self-levelling or patching", "Waterproofing where needed"] },
  { t: "Layout & dry-fit", time: "Day 3–4", d: "Stone is dry-laid and blended across boxes so veining and shade flow naturally.", li: ["Centre-line layout to avoid thin cuts", "Shade blending", "Your sign-off before setting begins"] },
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
  ["Does marble stain or scratch easily?", "Marble is calcium-based, so acids (lemon, wine, some cleaners) can etch it. Honed finishes hide wear better than polished. Every installation is sealed and comes with a care guide."],
  ["Can marble be used in a shower?", "Yes, when properly waterproofed and sealed. A membrane system and white thin-set prevent staining."],
  ["Do you supply the stone?", "Either way works. Stone can be sourced from trusted suppliers, or material you bought can be installed after it is checked for flatness and defects."],
  ["Is underfloor heating compatible?", "Yes. Marble conducts heat very well. Electric mats can be installed beneath the stone as an optional extra."],
  ["How do I clean marble?", "Use a pH-neutral stone cleaner and a soft mop. Avoid vinegar, bleach and abrasive powders."]
];
function faq() {
  const list = $("#faqList");
  const draw = q => {
    const rows = FAQ.filter(([a, b]) => (a + b).toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = rows.length ? rows.map(([a, b]) => `<details><summary>${a}</summary><p>${b}</p></details>`).join("") : '<p class="muted">No matches. Ask in the quote form below.</p>';
  };
  $("#faqSearch").addEventListener("input", e => draw(e.target.value)); draw("");
}

/* ---------- quote form ---------- */
function renderSummary() {
  const el = $("#quoteSummary"); if (!el) return;
  const sel = selectionsList();
  el.innerHTML = `<div><span>Saved selections</span><span>${sel.length ? sel.map(i => i.name).join(", ") : "None yet"}</span></div>`;
}
const VALID = {
  qName: v => v.trim().length >= 2 || "Please enter your name",
  qPhone: v => v.replace(/\D/g, "").length >= 7 || "Enter a valid phone number",
  qEmail: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email",
  qZip: v => v.trim().length >= 3 || "Enter your ZIP or postcode"
};
function quoteForm() {
  const form = $("#quoteForm");
  try { const pending = sessionStorage.getItem("wms-msg"); if (pending) { $("#qMsg").value = pending; sessionStorage.removeItem("wms-msg"); } } catch { /* ignore */ }
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
    const sel = selectionsList();
    const rec = { at: Date.now(), name: $("#qName").value.trim(), phone: $("#qPhone").value, email: $("#qEmail").value, zip: $("#qZip").value, when: $("#qWhen").value, msg: $("#qMsg").value, design: sel.length ? `${sel.length} saved selection${sel.length > 1 ? "s" : ""}` : "general enquiry" };
    const list = store.get("wms-requests", []); list.unshift(rec); store.set("wms-requests", list.slice(0, 10)); drawSaved();
    const body = `Name: ${rec.name}\nPhone: ${rec.phone}\nEmail: ${rec.email}\nZIP: ${rec.zip}\nStart: ${rec.when}\nSaved selections: ${sel.length ? sel.map(i => `${i.name} (${i.finish})`).join("; ") : "none"}\nPhotos to follow: ${$("#qPhotos").checked ? "yes" : "no"}\n\n${rec.msg}`;
    const href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Quote request — " + rec.name)}&body=${encodeURIComponent(body)}`;
    $("#formStatus").innerHTML = `Thanks, ${rec.name.split(" ")[0]} — request saved on this device. <a href="${href}" style="color:#d3b06a">Click here to email it to Whitestone</a> to send it.`;
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

services(); process(); faq(); quoteForm(); page();
