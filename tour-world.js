"use strict";
/* Procedural 3D penthouse used by the walkthrough hero. Built with three.js (vendor/three.min.js).
   Units are metres. x = east, y = up, z = south (the tour travels toward -z). */

const TOUR_DURATION = 70;
const TOUR_CHAPTERS = [
  { t: 0,  title: "Arrival", text: "Descend over the skyline toward a penthouse terrace at dusk.", stones: [] },
  { t: 9,  title: "Terrace and great room", text: "Honed travertine pavers outside flow into a calm limestone floor in large-format slabs.", stones: ["Classic Travertine", "Moleanos"] },
  { t: 20, title: "Kitchen", text: "A Calacatta waterfall island and full-height slab backsplash, polished, with vein-matched mitres.", stones: ["Calacatta"] },
  { t: 32, title: "Gallery hall", text: "A 90-degree herringbone Carrara floor leads through the residence with LED cove lighting.", stones: ["Carrara"] },
  { t: 44, title: "Primary suite", text: "A warm Taj Mahal quartzite feature wall behind the bed, over wide-plank oak.", stones: ["Taj Mahal"] },
  { t: 54, title: "Primary bath", text: "Arabescato slab shower, Statuario vanity top and a chevron marble mosaic floor.", stones: ["Arabescato", "Statuario", "Carrara Chevron"] }
];

/* [time, [camera x,y,z], [look-at x,y,z]] */
const TOUR_KEYS = [
  [0,  [-34, 34, 74], [0, 4, -6]],
  [4,  [-14, 18, 44], [0, 3, -5]],
  [8,  [-4, 8, 24],   [0, 2.5, -4]],
  [11, [1.5, 3.4, 10], [1.2, 1.8, -6]],
  [14, [1.5, 1.9, 3],  [1, 1.6, -8]],
  [17, [1.0, 1.7, -2.5], [-3, 1.2, -7]],
  [20, [-1, 1.6, -3.5], [-5.6, 1.0, -7]],
  [24, [-1.9, 1.5, -5], [-5.4, 0.95, -7.4]],
  [28, [-3.2, 1.35, -8.2], [-5.6, 0.95, -5.8]],
  [32, [-1.5, 1.6, -9.8], [0, 1.6, -14]],
  [35, [0, 1.5, -11.2], [0, 1.4, -20]],
  [38, [0, 1.1, -13.8], [0, 0.2, -17.5]],
  [42, [0, 1.5, -18], [0, 1.3, -24]],
  [46, [0, 1.6, -21.5], [0, 1.4, -27]],
  [50, [-1.5, 1.8, -24], [2, 1.2, -27.5]],
  [54, [3.5, 1.6, -24.6], [8, 1.5, -25]],
  [57, [5.8, 1.6, -25], [10, 1.5, -25.5]],
  [60, [7.5, 1.5, -23.5], [8.5, 0.95, -21.2]],
  [63, [8, 1.5, -24.5], [6.8, 0.8, -27.4]],
  [66, [8.2, 1.7, -23.6], [10.2, 1.4, -28]],
  [70, [8.9, 1.7, -22.8], [10.5, 1.3, -28.3]]
];

function buildTourWorld(canvas) {
  const T = THREE;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .8;
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x4a4268, 0.0026);
  const camera = new T.PerspectiveCamera(68, 16 / 9, 0.1, 2200);
  const rnd = rng(20241017);

  /* ---------- textures ---------- */
  const mk = (size, draw) => { const c = document.createElement("canvas"); c.width = c.height = size; draw(c.getContext("2d"), size); return c; };
  const toTex = c => { const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; };
  const rep = (t, x, y) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
  const stoneTex = (id, finish, seed, size = 1024) => toTex(mk(size, (g, s) => drawStone(g, 0, 0, s, s, stoneByIdAny(id), seed, finish)));
  const layTex = (id, pattern, tileIn, finish, texIn, grout, seed) => toTex(mk(1024, (g, s) => layFloor(g, s, s, { stone: stoneByIdAny(id), pattern, tileIn, ppi: s / texIn, grout, finish, seed, gap: 2.5 })));
  const plasterTex = toTex(mk(256, (g, s) => { g.fillStyle = "#ebe6dc"; g.fillRect(0, 0, s, s); for (let i = 0; i < 1800; i++) { g.fillStyle = rnd() > .5 ? "rgba(0,0,0,.025)" : "rgba(255,255,255,.04)"; g.fillRect(rnd() * s, rnd() * s, 2, 2); } }));
  const woodTex = toTex(mk(1024, (g, s) => drawWood(g, 0, 0, s, s, { base: "#a98558", base2: "#94724a", vein: "#6f5233" }, rng(11))));
  const rugTex = toTex(mk(256, (g, s) => { g.fillStyle = "#cfc6b6"; g.fillRect(0, 0, s, s); g.strokeStyle = "rgba(120,105,85,.35)"; g.lineWidth = 2; for (let i = 0; i < 26; i++) { g.beginPath(); g.moveTo(0, i * 10 + rnd() * 4); g.bezierCurveTo(s * .3, i * 10 + 12, s * .7, i * 10 - 10, s, i * 10 + rnd() * 6); g.stroke(); } }));
  const artTex = hue => toTex(mk(512, (g, s) => { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, hue[0]); gr.addColorStop(1, hue[1]); g.fillStyle = gr; g.fillRect(0, 0, s, s); for (let i = 0; i < 7; i++) { g.fillStyle = hue[2 + (i % 2)] + "99"; g.beginPath(); g.ellipse(rnd() * s, rnd() * s, 40 + rnd() * 150, 20 + rnd() * 90, rnd() * 3, 0, 7); g.fill(); } }));
  const windowTex = seed => { const r = rng(seed); return toTex(mk(256, (g, s) => { g.fillStyle = "#0e1122"; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 16) for (let x = 0; x < s; x += 16) { const p = r(); g.fillStyle = p < .42 ? (r() > .3 ? "#ffd9a0" : "#cfe4ff") : p < .5 ? "#6d6a78" : "#1a2038"; g.fillRect(x + 3, y + 4, 10, 8); } })); };
  const skyTex = (() => { const c = document.createElement("canvas"); c.width = 16; c.height = 512; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, "#080b22"); gr.addColorStop(.38, "#2a2a5c"); gr.addColorStop(.5, "#a2587a"); gr.addColorStop(.55, "#f29a62"); gr.addColorStop(.58, "#3a2e4a"); gr.addColorStop(1, "#10121f"); g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; })();

  /* ---------- materials ---------- */
  const std = o => new T.MeshStandardMaterial(o);
  const plaster = std({ map: plasterTex, roughness: .95 });
  const ceilingM = std({ color: 0xf2eee6, roughness: .95 });
  const darkWood = std({ color: 0x2b2622, roughness: .6 });
  const metal = std({ color: 0xb9b6ae, metalness: .9, roughness: .25 });
  const blackM = std({ color: 0x151516, roughness: .5, metalness: .4 });
  const white = std({ color: 0xf4f2ee, roughness: .45 });
  const fabric = std({ color: 0xcdc5b6, roughness: 1 });
  const fabricDark = std({ color: 0x5b5a5c, roughness: 1 });
  const glassM = new T.MeshStandardMaterial({ color: 0xa9c0cf, transparent: true, opacity: .13, roughness: .05, metalness: .2, side: T.DoubleSide, depthWrite: false });
  const glow = new T.MeshBasicMaterial({ color: 0xffe3b8 });
  const green = std({ color: 0x3d5f43, roughness: 1 });

  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); scene.add(m); return m; };
  const box = (w, h, d, mat, x, y, z) => add(new T.BoxGeometry(w, h, d), mat, x, y, z);
  const bnd = (x0, x1, y0, y1, z0, z1, mat) => box(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const flat = (w, d, mat, x, y, z) => { const m = add(new T.PlaneGeometry(w, d), mat, x, y, z); m.rotation.x = -Math.PI / 2; return m; };
  const wallPlane = (w, h, mat, x, y, z, ry) => { const m = add(new T.PlaneGeometry(w, h), mat, x, y, z); m.rotation.y = ry; return m; };
  const floorMat = (tex, w, d, per, rough = .28) => std({ map: rep(tex, w / per, d / per), roughness: rough, metalness: .05 });
  const cyl = (rt, rb, h, mat, x, y, z, seg = 24) => add(new T.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
  const light = (color, intensity, dist, x, y, z) => { const l = new T.PointLight(color, intensity, dist, 1.6); l.position.set(x, y, z); scene.add(l); return l; };

  /* ---------- sky and city ---------- */
  const sky = add(new T.SphereGeometry(1500, 32, 16), new T.MeshBasicMaterial({ map: skyTex, side: T.BackSide, fog: false }));
  const winTexes = [windowTex(1), windowTex(2), windowTex(3), windowTex(4)];
  const bld = (x, z, w, d, top, bottom, tex) => {
    const h = top - bottom, g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) { const face = Math.floor(i / 4), sw = face < 2 ? d : w; uv.setXY(i, uv.getX(i) * (face === 2 || face === 3 ? 0 : sw / 16), uv.getY(i) * (face === 2 || face === 3 ? 0 : h / 26)); }
    add(g, new T.MeshBasicMaterial({ map: tex, color: 0xb8bdd8 }), x, bottom + h / 2, z);
  };
  bld(0, -10, 34, 46, -0.3, -170, winTexes[0]); // our tower, below the penthouse
  for (let i = 0; i < 190; i++) {
    const ang = (rnd() - .5) * 4.6 + Math.PI / 2, dist = 150 + rnd() * 600, x = Math.cos(ang) * dist * 1.25, z = Math.sin(ang) * dist;
    if (Math.abs(x) < 38 && z > -50 && z < 40) continue;
    bld(x, z, 12 + rnd() * 26, 12 + rnd() * 26, -40 + rnd() * rnd() * 150, -170, winTexes[i % 4]);
  }
  for (let i = 0; i < 40; i++) { const x = (rnd() - .5) * 700, z = -160 - rnd() * 300; if (Math.abs(x) < 40) continue; bld(x, z, 14 + rnd() * 22, 14 + rnd() * 22, -20 + rnd() * 120, -170, winTexes[i % 4]); }
  bld(-70, 150, 22, 22, 150, -170, winTexes[1]);                    // taller setback tower with spire
  bld(-70, 150, 12, 12, 215, 150, winTexes[2]);
  add(new T.CylinderGeometry(.3, 1.2, 40, 8), glow, -70, 235, 150);
  add(new T.PlaneGeometry(4000, 4000), new T.MeshBasicMaterial({ color: 0x0b0d17 }), 0, -175, 0).rotation.x = -Math.PI / 2;

  /* ---------- terrace ---------- */
  const paverTex = stoneTex("travertine", "honed", 5);
  flat(28, 7.4, floorMat(paverTex, 28, 7.4, 1.6, .85), 0, 0, 3.7);
  bnd(-14, 14, -.5, 0, 0, 7.6, std({ color: 0xd9cfbd, roughness: .9 }));
  for (let x = -14; x <= 14; x += 2.3) box(.05, 1.1, .05, metal, x, .55, 7.5);
  box(28, 1.1, .02, glassM, 0, .55, 7.5); box(28, .04, .06, metal, 0, 1.1, 7.5);
  for (let i = 0; i < 12; i++) add(new T.SphereGeometry(.07, 8, 8), glow, -12.5 + i * 2.3, 2.3 + Math.sin(i * 1.2) * .12, 7.4);
  [[-6, 4.6], [-4.7, 4.6]].forEach(([x, z]) => { box(.7, .3, 1.9, fabric, x, .3, z); box(.7, .4, .5, fabric, x, .55, z + .85); });
  cyl(.38, .38, .45, blackM, -5.35, .22, 4.4); [-11, 11].forEach(x => { box(1.6, .6, .7, std({ color: 0x777166, roughness: .9 }), x, .3, 6.4); [0, 1].forEach(k => add(new T.SphereGeometry(.45, 12, 10), green, x - .5 + k, .9, 6.4)); });

  /* ---------- great room ---------- */
  const limeTex = layTex("moleanos", "straight", 24, "honed", 48, "#d4cab6", 21);
  flat(18, 11, floorMat(limeTex, 18, 11, 1.22, .35), 0, 0, -5.5);
  flat(18, 11, ceilingM, 0, 4.2, -5.5).rotation.x = Math.PI / 2;
  bnd(-9.5, 9.5, 4.2, 4.7, -11.4, 2.6, std({ color: 0xcfc9bd, roughness: .8 })); // roof slab with terrace overhang
  // south glass wall with an opening at x 0..3
  [[-9, 0], [3, 9]].forEach(([a, b]) => box(b - a, 4.2, .03, glassM, (a + b) / 2, 2.1, 0));
  for (let x = -9; x <= 9.01; x += 1.5) if (x < -.01 || x > 3.01 || x === 3) box(.07, 4.2, .09, blackM, x, 2.1, 0);
  box(18, .1, .12, blackM, 0, 4.15, 0);
  // walls
  bnd(-9.2, -9, 0, 4.2, -11.2, .1, plaster); bnd(9, 9.2, 0, 4.2, -11.2, .1, plaster);
  bnd(-9, -1.4, 0, 4.2, -11.2, -11, plaster); bnd(1.4, 9, 0, 4.2, -11.2, -11, plaster); bnd(-1.4, 1.4, 3.2, 4.2, -11.2, -11, plaster);
  // kitchen
  const calTex = stoneTex("calacatta", "polished", 31, 1024);
  const calM = std({ map: rep(calTex, 1, 1), roughness: .12, metalness: .05 });
  const calLong = std({ map: rep(calTex, 2.4, .8), roughness: .12, metalness: .05 });
  wallPlane(7, 1.8, std({ map: rep(calTex, 2, 1), roughness: .15 }), -8.98, 1.8, -6.7, Math.PI / 2);   // slab backsplash
  bnd(-9, -8.35, 0, .87, -10.2, -3.2, darkWood); bnd(-9, -8.3, .87, .91, -10.25, -3.15, calM);
  bnd(-9, -8.6, 2.6, 4.2, -10.2, -3.2, darkWood);                                              // upper cabinets
  bnd(-9, -8.5, 0, 3, -11, -10.2, darkWood);                                                  // tall unit
  box(1.7, .9, 4.6, darkWood, -5.6, .45, -6.9);                                                // island body
  box(1.9, .06, 4.8, calLong, -5.6, .93, -6.9);                                                // island top
  box(.06, .93, 4.8, calM, -4.74, .465, -6.9); box(.06, .93, 4.8, calM, -6.46, .465, -6.9);   // waterfall panels
  for (let i = 0; i < 4; i++) { cyl(.22, .22, .06, fabricDark, -4.1, .72, -8.4 + i * 1.05); cyl(.03, .03, .7, metal, -4.1, .36, -8.4 + i * 1.05, 8); }
  for (let i = 0; i < 3; i++) { box(.012, 1.2, .012, blackM, -5.6, 3.6, -8.4 + i * 1.5); add(new T.SphereGeometry(.2, 20, 14), glow, -5.6, 2.95, -8.4 + i * 1.5); }
  cyl(.04, .04, .35, metal, -5.6, 1.12, -5.4);
  // living
  flat(4.2, 3.2, std({ map: rugTex, roughness: 1 }), 4.3, .012, -7.4).rotation.z = 0;
  box(3.3, .42, 1, fabric, 4.3, .24, -9.6); box(3.3, .5, .25, fabric, 4.3, .65, -10.1); [-1.7, 1.7].forEach(x => box(.2, .6, 1, fabric, 4.3 + x, .4, -9.6));
  [[7.3, -6.6, -.9], [7.3, -8.2, -.6]].forEach(([x, z, r]) => { const c = box(.9, .42, .9, fabricDark, x, .24, z); c.rotation.y = r; const b = box(.9, .5, .2, fabricDark, x + .35, .58, z); b.rotation.y = r; });
  cyl(.65, .65, .06, std({ map: rep(stoneTex("nero", "polished", 8, 512), 1, 1), roughness: .12 }), 4.3, .38, -7.4, 36); cyl(.09, .09, .36, blackM, 4.3, .18, -7.4, 12);
  bnd(3.6, 3.6 + 3.0, .72, .78, -3.1, -1.9, darkWood); [3.7, 6.5].forEach(x => [-3, -2].forEach(z => box(.06, .72, .06, blackM, x, .36, z))); // dining
  [[4.4, -3.7], [5.6, -3.7], [4.4, -1.3], [5.6, -1.3]].forEach(([x, z]) => { box(.45, .06, .45, fabricDark, x, .45, z); box(.45, .5, .05, fabricDark, x, .72, z + (z < -2.5 ? -.2 : .2)); });
  box(1.8, .06, .06, glow, 5.1, 2.6, -2.5); box(.01, 1.6, .01, blackM, 5.1, 3.4, -2.5);
  wallPlane(2.4, 3, std({ map: artTex(["#243a52", "#c98a54", "#efe2c8", "#12202e"]), roughness: .9 }), -3.4, 2.1, -10.98, 0);
  wallPlane(3, 2.2, std({ map: artTex(["#e9dfd0", "#7a8f80", "#b86d52", "#33403a"]), roughness: .9 }), 5.2, 2.2, -10.98, 0);
  [[-8, -1.6], [8.3, -10]].forEach(([x, z]) => { cyl(.28, .22, .5, white, x, .25, z); [0, 1, 2].forEach(k => add(new T.SphereGeometry(.34 - k * .06, 12, 10), green, x, .7 + k * .38, z)); });
  light(0xffd9a8, 1.1, 16, -5.6, 3.2, -7); light(0xffd9a8, .9, 16, 4.5, 3.4, -6.5); light(0xffe8c8, .8, 12, 0, 3.6, -2);

  /* ---------- gallery hall ---------- */
  const hallTex = layTex("carrara", "herringbone", 12, "polished", 48, "#cfcac0", 77);
  flat(2.8, 9, floorMat(hallTex, 2.8, 9, 1.22, .1), 0, .001, -15.5);
  flat(2.8, 9, ceilingM, 0, 3.2, -15.5).rotation.x = Math.PI / 2;
  bnd(-1.6, -1.4, 0, 3.2, -20, -11, plaster); bnd(1.4, 1.6, 0, 3.2, -20, -11, plaster);
  [-1, 1].forEach(s => { box(.03, .06, 9, glow, s * 1.38, 3.1, -15.5); [-13.8, -16.6].forEach(z => box(.03, 2.3, .95, std({ color: 0x7a6650, roughness: .5 }), s * 1.385, 1.15, z)); });
  light(0xffdcb0, .9, 9, 0, 2.8, -13); light(0xffdcb0, .9, 9, 0, 2.8, -18);

  /* ---------- primary bedroom ---------- */
  const woodM = std({ map: rep(woodTex, 5, 3), roughness: .5 }); flat(10, 9, woodM, 0, 0, -24.5);
  flat(10, 9, ceilingM, 0, 3.2, -24.5).rotation.x = Math.PI / 2;
  bnd(-5.2, 5.2, 3.2, 3.6, -29.2, -19.8, std({ color: 0xcfc9bd }));
  bnd(-5, -1.4, 0, 3.2, -20.2, -20, plaster); bnd(1.4, 5, 0, 3.2, -20.2, -20, plaster);
  bnd(-5, 5, 0, 3.2, -29.2, -29, plaster);
  bnd(5, 5.2, 0, 3.2, -29, -25.6, plaster); bnd(5, 5.2, 0, 3.2, -24.4, -20, plaster); bnd(5, 5.2, 2.6, 3.2, -25.6, -24.4, plaster);
  box(.03, 3.2, 9, glassM, -5, 1.6, -24.5); for (let z = -29; z <= -20; z += 1.5) box(.07, 3.2, .09, blackM, -5, 1.6, z);
  const tajTex = stoneTex("taj", "polished", 44, 1024);
  wallPlane(5.4, 3.2, std({ map: rep(tajTex, 1, 1), roughness: .15 }), 0, 1.6, -28.98, 0);
  box(2.1, .35, 2.3, darkWood, 0, .2, -27.8); box(1.9, .28, 2.1, white, 0, .5, -27.8); box(1.95, .12, 1.3, fabric, 0, .68, -27.3);
  [-.5, .5].forEach(x => [0, 1].forEach(k => box(.62, .16, .42, white, x + (k ? .0 : 0), .72 + k * .08, -28.5 + k * .1)));
  box(2.5, 1.05, .12, std({ color: 0x8c877d, roughness: 1 }), 0, .9, -28.9);
  [-1.5, 1.5].forEach(x => { box(.5, .5, .45, darkWood, x, .25, -28.7); cyl(.09, .13, .3, white, x, .65, -28.7, 16); add(new T.SphereGeometry(.12, 12, 10), glow, x, .95, -28.7); });
  box(1.8, .4, .5, fabricDark, 0, .25, -25.7); flat(3.2, 3, std({ map: rugTex, roughness: 1 }), 0, .012, -26);
  light(0xffd2a0, .9, 11, 0, 2.8, -25); light(0xffd2a0, .4, 6, 0, 1.6, -28.2);

  /* ---------- primary bath ---------- */
  const mosTex = toTex(mk(1024, (g, s) => drawStone(g, 0, 0, s, s, stoneByIdAny("m-chevron"), 3, "honed")));
  flat(6.5, 8, floorMat(mosTex, 6.5, 8, 1.0, .2), 8.25, .001, -25);
  flat(6.5, 8, ceilingM, 8.25, 3.2, -25).rotation.x = Math.PI / 2;
  bnd(11.5, 11.7, 0, 3.2, -29.2, -20.8, plaster); bnd(5, 11.7, 0, 3.2, -21.2, -21, plaster); bnd(5, 11.7, 0, 3.2, -29.2, -29, plaster);
  bnd(5, 11.7, 3.2, 3.6, -29.2, -20.8, std({ color: 0xcfc9bd }));
  const arabTex = stoneTex("arabescato", "polished", 61, 1024);
  const arabM = () => std({ map: rep(arabTex, 1, 1), roughness: .1, metalness: .05 });
  wallPlane(2.7, 3.2, arabM(), 10.15, 1.6, -28.98, 0); wallPlane(2.8, 3.2, arabM(), 11.48, 1.6, -27.6, -Math.PI / 2);
  wallPlane(2.6, 3.2, arabM(), 6.6, 1.6, -28.98, 0);
  box(.03, 2.4, 2.8, glassM, 8.8, 1.2, -27.6); box(2.7, 2.4, .03, glassM, 10.15, 1.2, -26.2); box(.04, 2.4, .04, metal, 8.8, 1.2, -26.2);
  box(.5, .02, .02, metal, 10.9, 1.5, -26.3).rotation.z = 0; cyl(.012, .012, .7, metal, 11.3, 1.9, -28.6, 8); cyl(.11, .11, .03, metal, 11.3, 2.25, -28.5, 16);
  bnd(11.44, 11.5, 1.2, 1.9, -28.3, -27.6, std({ color: 0x1a1a1b, roughness: .6 }));
  const tub = add(new T.CapsuleGeometry(.42, 1.1, 8, 28), white, 6.6, .38, -27.8); tub.rotation.x = Math.PI / 2; tub.scale.set(1, 1, .75);
  cyl(.015, .015, .75, metal, 6.6, .75, -28.7, 8);
  const vanTex = stoneTex("statuario", "polished", 90, 1024);
  box(4.4, .8, .6, darkWood, 8.4, .4, -21.5); box(4.5, .05, .7, std({ map: rep(vanTex, 2, .5), roughness: .1 }), 8.4, .83, -21.5);
  [7.3, 9.5].forEach(x => { add(new T.CylinderGeometry(.24, .2, .12, 28), white, x, .92, -21.55); cyl(.012, .012, .3, metal, x, 1.0, -21.3, 8); });
  const mirT = toTex(mk(256, (g, s) => { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, "#f1e5cf"); gr.addColorStop(.5, "#b9bec2"); gr.addColorStop(1, "#8a8f94"); g.fillStyle = gr; g.fillRect(0, 0, s, s); }));
  box(4.3, 1.5, .03, new T.MeshBasicMaterial({ map: mirT }), 8.4, 1.75, -21.1); [6.1, 10.7].forEach(x => box(.04, 1.7, .04, glow, x, 1.75, -21.15));
  light(0xffd8aa, .9, 9, 8.2, 2.7, -24); light(0xffe6c4, .7, 6, 10, 2.2, -27.5);

  /* recessed ceiling lights */
  const spot = new T.CircleGeometry(.07, 12);
  const spots = [[-3, -2], [3, -2], [-3, -9], [3, -9], [0, -5.5], [8, -5], [-6, -4]].map(p => [p[0], 4.19, p[1], 4.2])
    .concat([[0, 3.19, -13], [0, 3.19, -16], [0, 3.19, -19], [-2, 3.19, -23], [2, 3.19, -23], [0, 3.19, -27], [7, 3.19, -23], [10, 3.19, -23], [7, 3.19, -26]].map(p => [p[0], p[1], p[2]]));
  spots.forEach(p => { const s = add(spot, glow, p[0], p[1] - .0, p[2]); s.rotation.x = Math.PI / 2; });

  scene.add(new T.HemisphereLight(0x7f86c4, 0x2a2018, .3));
  const sun = new T.DirectionalLight(0xffb27a, .35); sun.position.set(-60, 25, 70); scene.add(sun);
  scene.add(new T.AmbientLight(0xffe9d2, .22));

  /* ---------- camera path ---------- */
  const times = TOUR_KEYS.map(k => k[0]);
  const posCurve = new T.CatmullRomCurve3(TOUR_KEYS.map(k => new T.Vector3(...k[1])), false, "centripetal");
  const lookCurve = new T.CatmullRomCurve3(TOUR_KEYS.map(k => new T.Vector3(...k[2])), false, "centripetal");
  const uAt = s => { s = Math.max(0, Math.min(TOUR_DURATION, s)); let i = 0; while (i < times.length - 2 && s > times[i + 1]) i++; return (i + (s - times[i]) / (times[i + 1] - times[i])) / (times.length - 1); };
  const p = new T.Vector3(), l = new T.Vector3(); let roll = 0, lastAng = null;

  function setTime(s, yaw = 0, pitch = 0, dt = 0) {
    const u = uAt(s); posCurve.getPoint(u, p); lookCurve.getPoint(u, l);
    p.x += Math.sin(s * 1.1) * .035; p.y += Math.sin(s * 1.7) * .035;               // gentle drone sway
    camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(l);
    const ang = Math.atan2(l.x - p.x, l.z - p.z);
    if (lastAng !== null && dt > 0) { let d = ang - lastAng; d = Math.atan2(Math.sin(d), Math.cos(d)); roll += (Math.max(-.1, Math.min(.1, -d / dt * .3)) - roll) * Math.min(1, dt * 3); } else if (dt === 0) roll = 0;
    lastAng = ang;
    camera.rotateZ(roll); camera.rotateY(yaw); camera.rotateX(pitch);
  }
  let ratio = Math.min(devicePixelRatio || 1, 1.5);
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setPixelRatio(ratio); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 1 ? 82 : 68; camera.updateProjectionMatrix();
  }
  return { renderer, scene, camera, setTime, resize, render: () => renderer.render(scene, camera), setRatio: r => { ratio = r; resize(); }, get ratio() { return ratio; } };
}
