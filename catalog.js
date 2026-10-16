"use strict";
/* Stone & tile collection data. Edit freely: add, remove or rename items.
   Swatches are rendered procedurally from the "look" values, so no images are required.
   Replace with real product photography later by adding an `img` path to any item. */

const STONE_MATS = ["Marble", "Quartzite", "Limestone", "Travertine", "Granite"];
const COLOR_FAMILIES = [
  { id: "White", hex: "#f3f0ea" }, { id: "Grey", hex: "#9c9c9c" }, { id: "Black", hex: "#1f1f21" },
  { id: "Beige", hex: "#d9caae" }, { id: "Brown", hex: "#6d4b36" }, { id: "Green", hex: "#3f5e4d" },
  { id: "Blue", hex: "#51697f" }, { id: "Pink", hex: "#d6b3a8" }, { id: "Gold", hex: "#b8975a" }
];
const APPLICATIONS = ["Floor", "Wall", "Shower", "Countertop", "Backsplash", "Outdoor"];

const SZ = { slab: "Slab 126x63", a: "12x24", b: "24x24", c: "12x12", d: "24x48", e: "4x4", f: "3x6", g: "2x8", h: "Plank 8x48", i: "Sheet 12x12", j: "18x18" };
const ALL = ["Floor", "Wall", "Shower", "Countertop", "Backsplash"];
const INDOOR_TILE = ["Floor", "Wall", "Shower"];
const WALLS = ["Wall", "Backsplash", "Shower"];

const C = (id, name, mat, color, tone, finishes, sizes, uses, origin, look, desc, layout) => ({
  id, name, mat, group: STONE_MATS.includes(mat) ? "Natural stone" : "Tile",
  color, tone, finishes, sizes, uses, origin, desc, layout, ...look
});
const V = (base, base2, vein, strength) => ({ kind: "vein", base, base2, vein, strength });
const B = (base, base2, vein, strength) => ({ kind: "band", base, base2, vein, strength });
const S = (base, base2, vein, strength) => ({ kind: "solid", base, base2, vein: vein || base2, strength: strength ?? 0.3 });
const T = (base, base2, chips) => ({ kind: "terrazzo", base, base2, vein: base2, strength: 0.5, chips });
const M = (shape, base, base2, vein) => ({ kind: "mosaic", shape, base, base2, vein: vein || base2, strength: 0.3 });

const CATALOG = [
  /* Marble */
  C("carrara", "Carrara", "Marble", "White", "White-grey ground, soft grey veining", ["Polished", "Honed"], [SZ.a, SZ.b, SZ.slab], ALL, "Italy", V("#eceae6", "#d9d6d0", "#8d9099", 0.5), "The classic Italian white marble: light, soft and endlessly versatile.", "Straight, brick or herringbone"),
  C("calacatta", "Calacatta", "Marble", "White", "Bright white, bold warm-grey veins", ["Polished", "Honed"], [SZ.b, SZ.d, SZ.slab], ALL, "Italy", V("#f6f4ef", "#e8e3d8", "#6c5e4a", 0.9), "Brilliant white with dramatic, sparse veining. A statement stone for slabs and islands.", "Book-matched slabs"),
  C("statuario", "Statuario", "Marble", "White", "Crisp white, strong charcoal veins", ["Polished", "Honed"], [SZ.b, SZ.d, SZ.slab], ALL, "Italy", V("#f4f4f2", "#e3e3e1", "#4f5560", 0.8), "High-contrast white marble with long, confident grey veining.", "Large format or slab"),
  C("arabescato", "Arabescato", "Marble", "White", "White with bold grey-gold swirls", ["Polished", "Honed"], [SZ.b, SZ.slab], ["Floor", "Wall", "Shower", "Countertop"], "Italy", V("#f1efeb", "#dedbd4", "#7b7367", 1), "Sweeping, almost painterly veining that reads as art on a wall or ledge.", "Book-matched feature wall"),
  C("thassos", "Thassos", "Marble", "White", "Pure white, near-uniform", ["Polished", "Honed"], [SZ.c, SZ.b, SZ.a], ALL, "Greece", V("#fafaf8", "#efeeea", "#c9c9c4", 0.12), "One of the whitest marbles available, with a crystalline sparkle and minimal veining.", "Straight or herringbone"),
  C("nero", "Nero Marquina", "Marble", "Black", "Deep black with fine white veins", ["Polished", "Honed"], [SZ.a, SZ.b, SZ.slab], ALL, "Spain", V("#1c1c1e", "#2b2b2e", "#f1efe9", 0.55), "Dramatic black marble with delicate white veining. Striking paired with white in a checker layout.", "Checker with white marble"),
  C("emperador", "Emperador Dark", "Marble", "Brown", "Rich chocolate brown, cream fractures", ["Polished", "Honed"], [SZ.a, SZ.b], ["Floor", "Wall", "Shower", "Countertop"], "Spain", V("#7a5a43", "#5f432f", "#d8c4a4", 0.6), "Warm, deep brown with a network of cream veins. Traditional and richly detailed.", "Borders and inlays"),
  C("cremamarfil", "Crema Marfil", "Marble", "Beige", "Warm cream with subtle clouding", ["Polished", "Honed"], [SZ.a, SZ.b, SZ.j], ALL, "Spain", V("#e8dcc3", "#d9c9a8", "#c1ad86", 0.25), "A soft, creamy beige that warms any space. Classic for floors and borders.", "Straight or diagonal"),
  C("verde", "Verde Alpi", "Marble", "Green", "Deep forest green, white mineral veins", ["Polished", "Honed"], [SZ.a, SZ.b], ["Wall", "Shower", "Countertop", "Backsplash"], "Italy", V("#2f4a3f", "#223a31", "#c9d6cc", 0.7), "A rich green marble that makes a bold feature wall or vanity top.", "Feature wall"),
  C("bardiglio", "Bardiglio", "Marble", "Grey", "Blue-grey with darker striations", ["Polished", "Honed", "Brushed"], [SZ.a, SZ.b], ALL, "Italy", V("#a7aaae", "#8e9298", "#5a5f67", 0.55), "A cool grey marble with soft cloudy banding, quieter than white marbles.", "Straight or brick"),
  C("calviola", "Calacatta Viola", "Marble", "White", "White with violet and burgundy veins", ["Polished"], [SZ.b, SZ.slab], ["Wall", "Shower", "Countertop", "Backsplash"], "Italy", V("#f2eeeb", "#e2dad8", "#7a4a58", 0.85), "Distinctive purple-burgundy veining across a white ground. A true statement stone.", "Slab"),
  C("rosa", "Rosa Portogallo", "Marble", "Pink", "Soft blush pink, gentle white clouding", ["Polished", "Honed"], [SZ.a, SZ.b], ["Floor", "Wall", "Countertop"], "Portugal", V("#e3c6bd", "#d4b0a5", "#f2e5df", 0.4), "A gentle pink marble with warm undertones.", "Straight"),

  /* Quartzite */
  C("taj", "Taj Mahal", "Quartzite", "Beige", "Cream and gold with soft veining", ["Polished", "Leathered"], [SZ.slab], ["Wall", "Countertop", "Backsplash", "Shower"], "Brazil", V("#efe6d3", "#e0d3b6", "#b99a62", 0.55), "Hard, durable quartzite in warm cream with golden movement.", "Slab"),
  C("macaubas", "White Macaubas", "Quartzite", "Blue", "White with blue-grey flowing veins", ["Polished", "Honed"], [SZ.slab], ["Wall", "Countertop", "Backsplash", "Shower"], "Brazil", V("#eef0f1", "#dde2e5", "#6e8398", 0.8), "Cool, flowing veins in blue and grey over a white ground. Harder than marble.", "Slab"),
  C("cristallo", "Cristallo", "Quartzite", "White", "Translucent white with pale grey", ["Polished", "Leathered"], [SZ.slab], ["Wall", "Countertop", "Backsplash"], "Brazil", V("#f4f6f6", "#e6eaeb", "#a9b3b8", 0.45), "A luminous white quartzite with a crystalline depth.", "Slab"),

  /* Limestone */
  C("jura", "Jura Beige", "Limestone", "Beige", "Warm beige, honey tones, fossil texture", ["Honed", "Brushed", "Tumbled"], [SZ.a, SZ.b, SZ.j], INDOOR_TILE, "Germany", B("#dccda9", "#cdbb92", "#b6a27a", 0.3), "A classic honey-toned limestone with a natural, quiet texture.", "Straight or brick"),
  C("moleanos", "Moleanos", "Limestone", "Beige", "Light sand with fine, even grain", ["Honed", "Brushed"], [SZ.a, SZ.b], INDOOR_TILE.concat(["Outdoor"]), "Portugal", B("#e6dcc6", "#d8ccb1", "#c5b698", 0.2), "A light, uniform limestone suited to calm, modern interiors.", "Large format"),
  C("bluestone", "Bluestone", "Limestone", "Grey", "Cool grey-blue, fine texture", ["Honed", "Brushed", "Tumbled"], [SZ.a, SZ.b], ["Floor", "Wall", "Outdoor"], "Belgium", S("#8b9097", "#767b83", "#6a6f77", 0.5), "Dense, cool grey limestone with an understated, matte character.", "Straight or brick"),

  /* Travertine */
  C("travertine", "Classic Travertine", "Travertine", "Beige", "Warm beige, linear banding, natural pits", ["Honed", "Tumbled", "Brushed"], [SZ.a, SZ.b, SZ.c], INDOOR_TILE.concat(["Outdoor"]), "Turkey", B("#dccdb2", "#cbb998", "#a8946f", 0.35), "Warm, earthy and naturally textured. Cross- or vein-cut options.", "Versailles or straight"),
  C("silvertrav", "Silver Travertine", "Travertine", "Grey", "Soft grey-silver, fine bands", ["Honed", "Brushed"], [SZ.a, SZ.b], INDOOR_TILE, "Turkey", B("#c9c7c0", "#b6b3ab", "#9a968c", 0.3), "A cool, silvery travertine for contemporary spaces.", "Straight"),
  C("noce", "Noce Travertine", "Travertine", "Brown", "Walnut brown, pronounced banding", ["Honed", "Tumbled"], [SZ.a, SZ.b], INDOOR_TILE.concat(["Outdoor"]), "Turkey", B("#a98863", "#94734f", "#7b5d3d", 0.4), "A deep, warm brown travertine with strong linear character.", "Straight or brick"),
  C("ivorytrav", "Ivory Travertine", "Travertine", "White", "Pale ivory, minimal banding", ["Honed", "Brushed"], [SZ.a, SZ.b], INDOOR_TILE.concat(["Outdoor"]), "Turkey", B("#ece4d2", "#dfd4bc", "#cdbf9f", 0.2), "A light and airy travertine with a soft glow.", "Straight"),

  /* Granite */
  C("absolute", "Absolute Black", "Granite", "Black", "Uniform jet black", ["Polished", "Honed", "Leathered"], [SZ.a, SZ.b, SZ.slab], ["Floor", "Countertop", "Outdoor", "Wall"], "India", S("#161618", "#232325", "#2c2c2f", 0.4), "Dense, uniform black granite. Exceptionally hard-wearing.", "Countertops"),
  C("kashmir", "Kashmir White", "Granite", "White", "White-cream with garnet and grey flecks", ["Polished", "Honed", "Leathered"], [SZ.slab], ["Countertop", "Floor", "Outdoor"], "India", S("#ddd6cb", "#cbc3b7", "#8a7e72", 0.8), "A speckled, durable granite in warm white tones.", "Countertops"),
  C("bianco", "Bianco Antico", "Granite", "Grey", "Grey-white with dark swirls", ["Polished", "Leathered"], [SZ.slab], ["Countertop", "Wall"], "Brazil", V("#dedfdf", "#c6c8c9", "#5f5f63", 0.9), "Dramatic dark swirls over a pale grey base. Hard enough for heavy use.", "Slab"),

  /* Porcelain */
  C("p-statuario", "Statuario Look", "Porcelain", "White", "White, grey veining, rectified edge", ["Polished", "Matte"], [SZ.b, SZ.d, SZ.a], ALL.concat(["Outdoor"]), "", V("#f3f3f1", "#e4e4e2", "#5d6169", 0.75), "Marble-look porcelain: the appearance of Statuario with lower maintenance.", "Large format, minimal joints"),
  C("p-concrete", "Concrete Grey", "Porcelain", "Grey", "Mid grey, soft cloudy variation", ["Matte", "Textured"], [SZ.b, SZ.d, SZ.c], ["Floor", "Wall", "Outdoor"], "", S("#9d9e9d", "#8a8b8a", "#7a7b7a", 0.6), "Concrete-look porcelain with gentle tonal variation for a modern industrial feel.", "Large format"),
  C("p-oak", "Natural Oak", "Porcelain", "Brown", "Warm oak, linear grain", ["Matte", "Textured"], [SZ.h], ["Floor", "Wall"], "", { kind: "wood", base: "#b98f62", base2: "#a07a52", vein: "#7d5c3a", strength: 0.6 }, "Wood-look plank porcelain that handles water and wear.", "Staggered running bond"),
  C("p-travertine", "Travertine Look", "Porcelain", "Beige", "Warm beige with soft banding", ["Matte", "Honed"], [SZ.b, SZ.a], INDOOR_TILE.concat(["Outdoor"]), "", B("#dccfb7", "#cfc0a3", "#b9a886", 0.3), "Porcelain that captures the warmth of travertine without the upkeep.", "Straight"),
  C("p-slate", "Charcoal Slate", "Porcelain", "Black", "Dark charcoal, riven texture", ["Textured", "Matte"], [SZ.a, SZ.b], ["Floor", "Wall", "Outdoor"], "", S("#3a3b3d", "#2c2d2f", "#505153", 0.9), "Slate-look porcelain with a textured, slip-resistant surface.", "Straight or brick"),
  C("p-terrazzo", "Terrazzo Look", "Porcelain", "Grey", "Pale grey base, mixed stone chips", ["Matte", "Polished"], [SZ.b, SZ.a], INDOOR_TILE, "", T("#d5d2cb", "#c3c0b8", ["#1e1e20", "#f2efe8", "#8a8478", "#b49a6a", "#4b5d52"]), "Terrazzo-look porcelain with a classic chip pattern.", "Straight"),

  /* Ceramic */
  C("c-zellige", "Zellige Green", "Ceramic", "Green", "Deep green, variable glaze", ["Glossy"], [SZ.e, SZ.f], WALLS, "", S("#3d5a4a", "#2f4a3b", "#5f7c6a", 0.9), "Handmade-look glazed tile with natural variation in tone and edge.", "Straight stack"),
  C("c-subway", "Gloss White Subway", "Ceramic", "White", "Bright white, glossy glaze", ["Glossy", "Matte"], [SZ.f, SZ.g], WALLS.concat(["Backsplash"]), "", S("#f7f7f5", "#ecece9", "#d8d8d4", 0.15), "The classic brick-bond tile for showers and backsplashes.", "Brick bond"),
  C("c-black", "Matte Black", "Ceramic", "Black", "Solid matte black", ["Matte"], [SZ.e, SZ.f], WALLS, "", S("#1d1d1f", "#262628", "#303033", 0.2), "A crisp, graphic black tile with a soft matte finish.", "Straight stack"),
  C("c-sage", "Sage Handmade", "Ceramic", "Green", "Soft sage, gentle glaze movement", ["Glossy", "Satin"], [SZ.g, SZ.f], WALLS, "", S("#a9b7a0", "#97a78e", "#c4cfbc", 0.8), "Soft sage glaze with slight undulation for a crafted look.", "Brick bond or vertical stack"),
  C("c-cobalt", "Cobalt Glaze", "Ceramic", "Blue", "Deep cobalt blue, high gloss", ["Glossy"], [SZ.e, SZ.f], WALLS, "", S("#2f4f87", "#243f72", "#4b6ca6", 0.7), "A vivid blue glaze for statement walls.", "Straight stack"),
  C("c-terracotta", "Terracotta", "Ceramic", "Brown", "Warm clay red-orange", ["Matte", "Satin"], [SZ.e, SZ.c], INDOOR_TILE, "", S("#b5694a", "#a05a3e", "#c98264", 0.8), "Warm clay tone with rustic character.", "Straight or herringbone"),

  /* Mosaic */
  C("m-chevron", "Carrara Chevron", "Mosaic", "White", "White marble chevron, grey veining", ["Honed", "Polished"], [SZ.i], ["Floor", "Wall", "Shower", "Backsplash"], "Italy", M("chevron", "#ecebe8", "#c9c8c5", "#9a9ca2"), "Marble chevron mosaic, a refined choice for shower floors and splashes.", "Sheet, aligned chevron"),
  C("m-penny", "Thassos Penny Round", "Mosaic", "White", "Pure white rounds", ["Honed", "Polished"], [SZ.i], ["Floor", "Shower", "Backsplash"], "Greece", M("penny", "#f6f6f3", "#d8d8d4"), "Small round marble discs, flexible for curves and shower pans.", "Sheet"),
  C("m-hex", "Nero Hexagon", "Mosaic", "Black", "Black hex with white grout", ["Honed", "Polished"], [SZ.i], ["Floor", "Wall", "Shower"], "Spain", M("hex", "#222224", "#e9e6df"), "Graphic hexagon mosaic in black marble.", "Sheet"),
  C("m-herring", "Grey Herringbone", "Mosaic", "Grey", "Grey marble sticks, mixed tone", ["Honed", "Polished"], [SZ.i], ["Wall", "Backsplash", "Shower"], "", M("herringbone", "#8e9094", "#555860", "#c8c9cc"), "Narrow herringbone marble sticks in varied greys.", "Sheet"),
  C("m-subway", "Sage Subway Mosaic", "Mosaic", "Green", "Sage mini-brick, glossy", ["Glossy"], [SZ.i], ["Wall", "Backsplash", "Shower"], "", M("subway", "#a8b79f", "#8a9a82", "#d4ddcf"), "Mini subway mosaic on mesh sheets.", "Sheet"),

  /* Terrazzo */
  C("t-grey", "Terrazzo Grey Mix", "Terrazzo", "Grey", "Grey base, black, white and sand chips", ["Polished", "Honed"], [SZ.b, SZ.slab], ["Floor", "Wall", "Countertop"], "", T("#b9b8b2", "#a5a49d", ["#15151a", "#f4f1ea", "#d8c9a6", "#4a5a55", "#8f8b82"]), "Poured-look terrazzo with a lively mix of chips.", "Large format"),
  C("t-white", "Terrazzo White Chip", "Terrazzo", "White", "White base, fine multi-colour chips", ["Polished", "Honed"], [SZ.b, SZ.slab], ["Floor", "Wall", "Countertop"], "", T("#eceae4", "#dad7ce", ["#c9a98c", "#6d7f74", "#cfa6a0", "#222224", "#b8b5ac"]), "A light terrazzo with fine pastel and charcoal chips.", "Large format")
];

const stoneByIdAny = id => CATALOG.find(c => c.id === id);

/* Real photographs for stones that have been shot on installed projects */
[["carrara", "carrara", "emperador"], ["calacatta", "calacatta", "statuario"], ["statuario", "statuario", "carrara"], ["arabescato", "arabescato", "emperador"], ["emperador", "emperador", "carrara"], ["t-grey", "t-grey", "carrara"]].forEach(([id, f, pair]) => { const p = CATALOG.find(c => c.id === id); if (p) { p.img = `images/stones/${f}.jpg`; p.pair = pair; } });
