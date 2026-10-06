# Mini brief — Daniel Batiste portfolio rebuild

**Goal:** Rebuild the Adobe Portfolio site (danielnbatiste.myportfolio.com) as a fast, editorial static site. Mobile-first and responsive across phone, tablet and desktop. Hosted on GitHub Pages.

## Decisions so far
- Stack: plain HTML/CSS/JS, with no build step. Node isn't installed; Astro is possible later if wanted.
- Type: **Archivo** (sans) + **Newsreader** (serif), from Google Fonts for now. Brand fonts and colours are to come and only `tokens.css` will need changing.
- Media: tinted placeholders only. Final images, video and GIFs will be supplied later; the extracted images are not used on the site.
- Copy: project titles and order follow the folio. Headlines, intros, services and year are short placeholders.
- Contact: placeholders only.
- Header wordmark: **Really**. Corners: `Contact ↓` bottom-left (bobbing arrow), pixel koala bottom-right, which sleeps with z's on hover or tap. The page background is #f1f1f1. The nav is light (#f1f1f1) over the hero and dark over the page. The pixel koala keeps its original colours.
- Grid heading: "Daniel Batiste" above "Brand Design and Creative Direction".
- Oko (the animated 2.5D SVG koala) sits in the statement section, locked to the section's centre, with copy left and right (stacked on mobile). The 3D version is parked (`/lab/koala/`).
- Motion: soft scroll reveals, word-by-word headline rise, card hover (image eases in, arrow, others quieten), underline-draw links, auto-hiding header, page cross-fades with a card → project hero morph. All of it turns off with reduced motion.
- Home may get more sections before the grid, and there's a marked slot for them in `index.html`.

## Site map
- **Home:** Hero (hard-cut slideshow) → Statement → [future sections] → Work grid → Contact → Footer
- **Project** ×12: Hero media → Title / intro / services / year → media rhythm (full + pairs) → Next project → More-projects grid → Contact
- **Info:** Bio (from folio) → Contact

## Projects (12, folio order)
Modern Health Dynamics · Moment* · Estée Lauder Companies · LMND · CO_LAB · Sehat · DIA · Tramonto · 1-2-Eat · Elevo · Hou Sek · Misc

## Breakpoints
- < 800px: 2-column grid, stacked project intro, 4:5 project hero
- ≥ 800px: 3-column grid, 12-column project intro, 16:9 project hero
- ≥ 1200px: larger gutters and gaps

## Open items
- [ ] Brand type and colours
- [ ] Final copy: statement, per-project headline / intro / services / year, contact lead
- [ ] Hero clips + posters
- [ ] Project media (covers + page assets) at final ratios
- [ ] Final yawn-mouth artwork for Oko (placeholder group `#yawn` in koala.svg)
- [ ] Real contact details (contact shows Email + Based in only)
- [ ] Optional: hand-drawn sprites for Soh's skate game (currently drawn in code)
- [ ] Favicon / social share image
- [ ] Domain
