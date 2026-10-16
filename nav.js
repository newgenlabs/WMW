"use strict";
/* Shared: footer details, year, mobile menu. */
(function () {
  const $ = id => document.getElementById(id);
  if ($("ftPhone")) $("ftPhone").textContent = CONFIG.phone;
  if ($("ftEmail")) $("ftEmail").textContent = CONFIG.email;
  if ($("yr")) $("yr").textContent = new Date().getFullYear();
  const t = document.querySelector(".nav-toggle"), n = $("nav");
  if (t && n && !window.__navBound) t.addEventListener("click", () => { const o = n.classList.toggle("open"); t.setAttribute("aria-expanded", o); });
})();
