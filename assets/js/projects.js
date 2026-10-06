/* ==========================================================================
   PROJECT DATA - the only file you need to edit to add / reorder / update work.

   Order here = order in the grid.
   Fields marked PLACEHOLDER are temporary copy - replace when final.

   media:      list of blocks shown on the project page, top to bottom.
               { layout: "full" | "pair", ratio: "16/9" }  → tinted placeholder
               Later, add  src: "assets/media/projects/<slug>/01.webp"
               (or .mp4 for video - it will autoplay muted + loop).
   cover:      grid card. ratio = card shape in the masonry grid.
   tint:       placeholder colour until real media is supplied.
   ========================================================================== */

window.SITE = {
  name: "Daniel Batiste",
  brand: "Really",
  tagline: "Brand Design and Creative Direction",
  // PLACEHOLDER statement under the hero - the koala sits between the two parts,
  // locked to the section's centre, so either part can grow or shrink.
  statement: {
    before: "Brand design and creative direction",
    after: "for companies with something to say.",
  },
  // Oko's personality. First tap = a greeting, then each tap shows the next service.
  // wakeLine shows after a proper nap; sleepAfter = ms with no movement before he dozes.
  oko: {
    greetings: ["Oi!"],
    lines: [
      "Brand & creative direction",
      "Print & brand experiences",
      "Digital branding & web",
      "Campaigns, content & social",
    ],
    wakeLine: "Oh, g’day!",
    sleepAfter: 1500,
    yawnChance: 0.6, // chance of a yawn before dozing off (or after a nap)
    yawnGap: 8000,   // at most one yawn every 8s
  },
  // Statement koala: "svg" (chosen) | "toon" | "fuzzy" (live 3D, parked - try with ?mascot=toon)
  mascot: "svg",
  contact: {
    // PLACEHOLDER - replace with real details
    email: "example@domain.com",
    phone: "+00 00 000 0000", // PLACEHOLDER: put your number here
    location: "Australia, Southeast Asia",
  },
};

/* Hero slides - hard-cut slideshow. PLACEHOLDER colour frames for now.
   Swap to { type: "video", src: "assets/media/hero/01.mp4", poster: "assets/media/hero/01.jpg" }
   or       { type: "image", src: "assets/media/hero/02.webp" } */
window.HERO = {
  interval: 1100, // ms per slide, unless a slide sets its own duration
  // TEST: clips from the LMND brand reel, each shown for its own length
  slides: [
    { type: "video", src: "assets/media/hero/01.mp4", poster: "assets/media/hero/01.webp", duration: 1583, tint: "#000000" },
    { type: "video", src: "assets/media/hero/02.mp4", poster: "assets/media/hero/02.webp", duration: 1375, tint: "#000000" },
    { type: "video", src: "assets/media/hero/03.mp4", poster: "assets/media/hero/03.webp", duration: 500, tint: "#ffffff" },
    { type: "video", src: "assets/media/hero/04.mp4", poster: "assets/media/hero/04.webp", duration: 1625, tint: "#ffffff" },
    { type: "video", src: "assets/media/hero/05.mp4", poster: "assets/media/hero/05.webp", duration: 2042, tint: "#111111" },
    { type: "video", src: "assets/media/hero/06.mp4", poster: "assets/media/hero/06.webp", duration: 1833, tint: "#e9e9ec" },
    { type: "video", src: "assets/media/hero/07.mp4", poster: "assets/media/hero/07.webp", duration: 667, tint: "#4a9ad0" },
    { type: "video", src: "assets/media/hero/08.mp4", poster: "assets/media/hero/08.webp", duration: 2750, tint: "#2a1240" },
    { type: "video", src: "assets/media/hero/09.mp4", poster: "assets/media/hero/09.webp", duration: 2042, tint: "#2633c8" },
    { type: "video", src: "assets/media/hero/10.mp4", poster: "assets/media/hero/10.webp", duration: 1583, tint: "#f1f1f1" },
  ],
};

// Shared PLACEHOLDER copy
const INTRO =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const SERVICES = ["Branding", "Art Direction", "Design"];

// Builds a simple full / pair rhythm for N placeholder images.
function rhythm(n) {
  const out = [];
  let i = 0;
  while (i < n) {
    if (out.length % 2 === 0 || n - i < 2) {
      out.push({ layout: "full", ratio: "16/9" });
      i += 1;
    } else {
      out.push({ layout: "pair", ratio: "4/5" });
      i += 2;
    }
  }
  return out;
}

// TEMP placeholders from the old folio: full-width rows, each image at its own shape.
// They load from _extracted/ (git-ignored), so they only show locally; online the tinted boxes show instead.
function folio(folder, files) {
  return files.map(([file, ratio]) => ({ layout: "full", ratio, src: `_extracted/images/${folder}/${file}` }));
}

window.PROJECTS = [
  {
    slug: "modern-health-dynamics",
    title: "Modern Health Dynamics",
    headline: "Lorem ipsum dolor sit amet.", // PLACEHOLDER
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#2f4a3a",
    cover: { ratio: "1801/1081", src: "_extracted/images/01-modern-health-dynamics/cover.png" }, // TEMP folio
    media: folio("01-modern-health-dynamics", [["01.png", "16/9"], ["02.png", "16/9"], ["03.png", "16/9"], ["04.png", "16/9"], ["05.png", "16/9"], ["06.png", "16/9"], ["07.png", "16/9"], ["08.png", "16/9"], ["09.png", "16/9"], ["10.png", "16/9"], ["11.png", "16/9"], ["12.png", "16/9"]]),
  },
  {
    slug: "moment",
    title: "Moment*",
    headline: "Consectetur adipiscing elit.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#d8c9a8",
    cover: { ratio: "563/338", src: "_extracted/images/02-moment/cover.gif" }, // TEMP folio
    media: folio("02-moment", [["01.gif", "16/9"], ["02.png", "16/9"], ["03.png", "16/9"], ["04.gif", "1920/1081"], ["05.png", "16/9"], ["06.png", "16/9"], ["07.png", "16/9"], ["08.png", "16/9"], ["09.png", "16/9"]]),
  },
  {
    slug: "estee-lauder-co",
    title: "Estée Lauder Companies",
    headline: "Sed do eiusmod tempor.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#b98f86",
    cover: { ratio: "1350/809", src: "_extracted/images/03-estee-lauder-co/cover.png" }, // TEMP folio
    media: folio("03-estee-lauder-co", [["01.png", "16/9"], ["02.gif", "1000/563"], ["03.png", "16/9"], ["04.png", "16/9"]]),
  },
  {
    slug: "lmnd",
    title: "LMND",
    headline: "Ut labore et dolore magna.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#1f2b3d",
    cover: { ratio: "5/3", src: "_extracted/images/04-lmnd/cover.gif" }, // TEMP folio
    media: folio("04-lmnd", [["01.gif", "16/9"], ["02.gif", "16/9"]]),
    // Long-form films stay on YouTube
    embeds: [
      "https://www.youtube.com/embed/tPAADmhJXXA",
      "https://www.youtube.com/embed/YTYVA4qpHjE",
    ],
  },
  {
    slug: "co-lab",
    title: "CO_LAB",
    headline: "Ut enim ad minim veniam.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#9aa3a6",
    cover: { ratio: "2078/1247", src: "_extracted/images/05-co-lab/cover.png" }, // TEMP folio
    media: folio("05-co-lab", [["01.png", "16/9"], ["02.png", "16/9"], ["03.png", "16/9"], ["04.png", "16/9"], ["05.png", "16/9"], ["06.png", "16/9"]]),
  },
  {
    slug: "sehat",
    title: "Sehat",
    headline: "Quis nostrud exercitation.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#8a4b3c",
    cover: { ratio: "5/3", src: "_extracted/images/06-sehat/cover.png" }, // TEMP folio
    media: folio("06-sehat", [["01.png", "16/9"], ["02.png", "3840/1937"], ["03.png", "960/499"], ["04.png", "16/9"], ["05.png", "16/9"], ["06.png", "16/9"], ["07.png", "16/9"], ["08.png", "16/9"], ["09.png", "16/9"], ["10.png", "16/9"], ["11.png", "16/9"], ["12.png", "16/9"], ["13.png", "16/9"], ["14.png", "16/9"]]),
  },
  {
    slug: "dia",
    title: "DIA",
    headline: "Duis aute irure dolor.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#e2ddd2",
    cover: { ratio: "938/563", src: "_extracted/images/07-dia/cover.gif" }, // TEMP folio
    media: folio("07-dia", [["01.gif", "1000/563"], ["02.png", "16/9"], ["03.png", "16/9"], ["04.png", "16/9"], ["05.png", "16/9"], ["06.png", "16/9"], ["07.png", "16/9"], ["08.png", "16/9"], ["09.gif", "1000/563"], ["10.gif", "1000/563"]]),
  },
  {
    slug: "tramonto",
    title: "Tramonto",
    headline: "In reprehenderit in voluptate.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#c7b7c9",
    cover: { ratio: "5/3", src: "_extracted/images/08-tramonto/cover.png" }, // TEMP folio
    media: folio("08-tramonto", [["01.png", "16/9"], ["02.png", "16/9"], ["03.png", "16/9"], ["04.png", "16/9"], ["05.png", "16/9"]]),
  },
  {
    slug: "1-2-eat",
    title: "1-2-Eat",
    headline: "Velit esse cillum dolore.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#d6a24a",
    cover: { ratio: "2813/1688", src: "_extracted/images/09-1-2-eat/cover.png" }, // TEMP folio
    media: folio("09-1-2-eat", [["01.png", "16/9"], ["02.png", "16/9"], ["03.png", "16/9"], ["04.png", "16/9"], ["05.png", "16/9"], ["06.png", "16/9"], ["07.png", "16/9"]]),
  },
  {
    slug: "elevo",
    title: "Elevo",
    headline: "Excepteur sint occaecat.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#6f7f8f",
    cover: { ratio: "2813/1688", src: "_extracted/images/10-elevo/cover.png" }, // TEMP folio
    media: folio("10-elevo", [["01.png", "16/9"], ["02.png", "16/9"], ["03.png", "16/9"], ["04.png", "16/9"], ["05.png", "16/9"]]),
  },
  {
    slug: "hou-sek",
    title: "Hou Sek",
    headline: "Sunt in culpa qui officia.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#55624a",
    cover: { ratio: "743/446", src: "_extracted/images/11-hou-sek/cover.gif" }, // TEMP folio
    media: folio("11-hou-sek", [["01.png", "16/9"], ["02.png", "16/9"], ["03.gif", "16/9"], ["04.png", "16/9"], ["05.png", "16/9"], ["06.png", "16/9"], ["07.png", "16/9"], ["08.png", "16/9"], ["09.png", "16/9"], ["10.png", "16/9"], ["11.png", "1920/1081"], ["12.gif", "16/9"]]),
  },
  {
    slug: "miscellaneous",
    title: "Misc",
    headline: "Deserunt mollit anim.",
    intro: INTRO,
    services: SERVICES,
    year: "20XX",
    tint: "#bfb4a3",
    cover: { ratio: "699/419", src: "_extracted/images/12-miscellaneous/cover.png" }, // TEMP folio
    media: folio("12-miscellaneous", [["01.png", "16/9"], ["02.png", "16/9"], ["03.png", "1600/799"], ["04.png", "1081/1351"], ["05.gif", "4/5"], ["06.gif", "4/5"]]),
  },
];
