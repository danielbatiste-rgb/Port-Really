# Daniel Batiste — Portfolio

Static site: plain HTML, CSS and JS. No build step, so it deploys straight to GitHub Pages.

## Preview locally

```bash
cd "/Users/daniel/port really" && python3 -m http.server 8432
```

Then open http://localhost:8432

## Where things live

| What | File |
|---|---|
| Projects (titles, copy, order, media, tints) | `assets/js/projects.js` |
| Hero slides | `assets/js/projects.js` → `HERO` |
| Statement + contact details | `assets/js/projects.js` → `SITE` |
| Colours, fonts, spacing, breakpoints | `assets/css/tokens.css` |
| Layout + components | `assets/css/main.css` |
| Behaviour (slideshow, masonry, project pages) | `assets/js/main.js` |
| Home page sections | `index.html` |
| Project pages | `work/<slug>/index.html` (thin shells; content comes from `projects.js`) |

## Common edits

**Reorder projects:** move entries in `PROJECTS`.

**Add a project**
```bash
sh tools/new-project.sh my-project "My Project"
```
Then add a `{ slug: "my-project", ... }` entry to `PROJECTS`.

**Add a section before the grid:** put it in `index.html` at the comment
`<!-- ===== Extra sections go here, before the grid ===== -->`.

**Swap a placeholder for real media:** add `src` to that block in `projects.js`.
```js
cover: { ratio: "4/5", src: "assets/media/projects/sehat/cover.webp" },
media: [
  { layout: "full", ratio: "16/9", src: "assets/media/projects/sehat/01.mp4", poster: "assets/media/projects/sehat/01.jpg" },
  { layout: "pair", ratio: "4/5", items: [
      { src: "assets/media/projects/sehat/02.webp" },
      { src: "assets/media/projects/sehat/03.webp" } ] },
],
```
`.mp4` / `.webm` files autoplay muted and loop. Images lazy-load.
Right now every project uses TEMP placeholders from the old folio: `folio("<folder>", [[file, ratio], …])` loads `_extracted/images/<folder>/` as full-width rows, each image at its own shape, and the cover lines are marked `// TEMP folio`. Replace them with explicit lists like the one above once the optimised assets land. (`rhythm(n)` still makes tinted placeholder blocks if you need them.)

**Oko (statement koala):** the animated SVG koala sits between the two halves of the statement (`SITE.statement.before` / `.after`). It's locked to the exact centre of the section, so either half can grow or shrink. Layouts: `statement--above` (default) puts Oko centred on top, with the sentence below as a balanced centred column (16ch, 4 near-equal lines); `statement--inline` sets Oko inside the sentence like a word; `statement--row` puts the text left and right of Oko; no modifier stacks the text above and below. Preview any of them without editing by adding `?statement=above`, `?statement=inline`, `?statement=row` or `?statement=stacked` to the URL. Oko's personality is in `SITE.oko`: tap lines (speech bubble), the line he says when startled awake, and `sleepAfter` (ms of no activity before he dozes off with z's; 0 turns it off). `yawnChance` / `yawnGap` control his occasional yawn (before dozing, or after a longer nap). The yawn mouth is a **placeholder** group `#yawn` in `assets/media/mascot/koala.svg`. Replace it with final artwork and keep the id. To test it in the browser console: `document.querySelector('.oko').oko.yawn()`. It mounts into any `data-mascot` element. Version is set in `projects.js` → `SITE.mascot`:
`"svg"` (2.5D layered artwork, ~16 KB, default), `"toon"` or `"fuzzy"` (live 3D, loads three.js).
Try any of them on a page without editing anything by adding `?mascot=toon` (etc.) to the URL.
Compare them side by side at `/lab/koala/`.
- Artwork: `assets/media/mascot/koala.svg` (your original is in `source/`). The parts are named groups (`cap`, `head`, `eye-l`, `nose`…). Their depths are set in `assets/js/koala-svg.js`.
- 3D: `assets/js/koala-3d.js` builds the koala from shapes. A sculpted `.glb` model can replace it later.

**Corners:** `Contact ↓` sits bottom-left and the pixel koala bottom-right. Hovering or tapping the koala sends it to sleep, with three z's. The header and `Contact ↓` are white with `mix-blend-mode: difference`, so they invert whatever is behind them (dark on light, light on dark, colour-shifted over colour). The pixel koala always uses its original colours. The page background is #f1f1f1 (`--bg` in tokens.css).

**Soh's skate game (contact section):** `assets/js/soh-game.js`. It's an endless runner after Chrome's offline dinosaur game: jump bottles and bushes, and watch the magpies (low ones you jump, high ones you roll under). Night mode kicks in every 700 points, and the high score is saved in the browser. The sprites are character grids at the top of the file (k ink, d dark, g mid, l light, w paper), so you can redraw them there or ask for PNG sprites to be swapped in. It loads only when the contact section scrolls near.

**Hero:** `HERO.slides` in `projects.js`. Ten LMND clips (`assets/media/hero/NN.mp4` + first-frame `NN.webp` poster); each slide stays up for its `duration` (ms, = the clip length). Clicking the hero pauses, another click resumes. Re-encode backups and 4K masters live in `_source/` (local only).

**Statement stop:** one scroll down from the hero holds on Oko's section (`initStatementStop()` in `main.js`, max 0.6 s), so you can't fly past it in one go.

## Media specs

**Full asset master sheet: [ASSET-SPECS.md](ASSET-SPECS.md)** (exact sizes, file names and a per-project checklist). Every placeholder on the site shows its file name and size.


| Use | Format | Size | Weight |
|---|---|---|---|
| Hero loop | MP4 (H.264), no audio, plus JPG poster | 1920×1080 desktop; optional 1080×1920 mobile cut | ≤ 3–5 MB each, 3–8 s |
| Project video | MP4 (H.264) + poster | ≤ 1920 wide | ≤ 8 MB |
| Images | WebP (or AVIF), JPG fallback ok | 2400 wide for full-width, 1400 for pairs/cards | ≤ 400 KB |
| Animated GIFs | Convert to MP4 | — | usually 10× smaller |
| Long films | Keep on YouTube/Vimeo | — | — |

GitHub limits: 100 MB per file (hard), aim for under 1 GB total. Git LFS files are **not** served by GitHub Pages.

## Deploy (GitHub Pages)

1. Create a repo and push this folder. `_extracted/images/` is git-ignored here.
   For the **TEMP** repo, run `sh tools/build-temp.sh`: it makes a clean copy in `~/TEMP` that *includes* the folio images (so the placeholders show online) and leaves out `_source/`. Push `~/TEMP`. Re-run it after changes.
2. Repo → Settings → Pages → Deploy from branch → `main` / root.
3. All paths are relative, so it works at `username.github.io/repo/` or on a custom domain.

## Folders

```
_extracted/   Adobe Portfolio pull: content.json + images (TEMP placeholders on the site, local only)
_source/      source reel, 4K masters, clip backups (local only, never deployed)
assets/       css, js, media (hero/, gif/, mascot/, projects/<slug>/)
lab/          test pages, not linked from the site (koala comparison)
tools/        project page template, new-project script, build-temp.sh
work/         one folder per project
```
