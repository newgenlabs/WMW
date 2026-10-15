"use strict";
/* Home banner: header turns solid on scroll; pale marble sky over a dark Emperador floor, drawn once (no animation). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const hd = $("#header"), onScroll = () => hd.classList.toggle("solid", scrollY > 40);
  onScroll(); addEventListener("scroll", onScroll, { passive: true });
  bannerArt();

  /* ---------- banner art: a pale marble sky over a dark Emperador floor, drawn once (no animation) ---------- */
  function bannerArt() {
    const bg = $("#bnBg"); if (!bg) return;
    const paint = () => {
      const W = bg.width = Math.min(1920, bg.clientWidth || 1440), H = bg.height = Math.min(1100, bg.clientHeight || 900), g = bg.getContext("2d"), hz = Math.round(H * .64);
      const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, "#a8afb9"); sky.addColorStop(.55, "#d0cac7"); sky.addColorStop(1, "#f0d6c3");
      g.fillStyle = sky; g.fillRect(0, 0, W, hz);
      const off = document.createElement("canvas"); off.width = W; off.height = hz;
      drawStone(off.getContext("2d"), 0, 0, W, hz, { ...stoneByIdAny("carrara"), strength: 1 }, 5, "honed");
      g.save(); g.globalAlpha = .2; try { g.filter = "blur(1.5px)"; } catch (e) { /* optional */ } g.drawImage(off, 0, 0); g.restore();
      const glow = g.createLinearGradient(0, hz - H * .16, 0, hz); glow.addColorStop(0, "rgba(255,236,214,0)"); glow.addColorStop(1, "rgba(255,236,214,.6)");
      g.fillStyle = glow; g.fillRect(0, hz - H * .16, W, H * .16);
      drawStone(g, 0, hz, W, H - hz, { ...stoneByIdAny("emperador"), strength: 1 }, 12, "polished");
      const dark = g.createLinearGradient(0, hz, 0, H); dark.addColorStop(0, "rgba(58,40,26,.25)"); dark.addColorStop(1, "rgba(22,14,8,.62)");
      g.fillStyle = dark; g.fillRect(0, hz, W, H - hz);
      g.fillStyle = "rgba(255,240,222,.45)"; g.fillRect(0, hz, W, 1);
    };
    paint(); let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(paint, 200); });
  }
})();
