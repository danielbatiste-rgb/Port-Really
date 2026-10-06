# Really: Asset master sheet

**Working through it? Use the tick-box list: [ASSET-CHECKLIST.md](ASSET-CHECKLIST.md)** (one file per line: hero, then cards, then projects).

**Design templates:** `_templates/asset-boards/` has one SVG per section (hero, covers, one per project). Every box is at true export size (1px = 1px), labelled, and named to match its file, with crop guides (red = phone crop, blue = centre safe area). Open them in Illustrator or Figma, drop your artwork into the boxes and export each at 100%.

Everything the site needs, with exact sizes and file types. Every placeholder on the site is also labelled with its file name and size, so you can check each slot in place (run the local preview and look at the tinted boxes).

**Golden rules (speed)**
- **Images → WebP**, quality about 80, sRGB, metadata stripped. Exact pixel sizes below are 2× the largest size each slot displays, capped where bigger would just be slower.
- **Video → MP4 (H.264)**, no audio track, "fast start" on, plus a **poster** still (WebP) from the first frame. Short loops beat long clips.
- **GIFs → MP4.** Same look, usually 5 to 10 times smaller. Never upload GIFs.
- **One file per slot.** The site crops with "cover" scaling, so keep the important stuff away from the edges (see safe areas).
- File names are lower-case, no spaces. Drop files into the folders listed and tell me. I'll wire them in and remove the placeholder.

---

## 1. Hero slideshow (home page, full screen)

Full-screen, hard-cut slideshow. Each slide shows for **about 1.1s**, with the project name in big white type over the centre.

| | Spec |
|---|---|
| Slides | 6 to 12 (currently 6 placeholders, labelled `Slide 01 to 06`) |
| Folder | `assets/media/hero/` |
| **Video slide** | `01.mp4` · **1920×1080** · H.264 · 24 or 25fps · **2 to 4 seconds** · no audio · **≤ 1.5 MB** (about 3 to 4 Mbps) |
| Poster for each video | `01-poster.webp` · 1920×1080 · first frame · **≤ 150 KB** (shows instantly, and on phones in Low Power Mode) |
| **Still slide** | `01.webp` · **2560×1440** · **≤ 350 KB** |
| Whole hero budget | **≤ 12 MB** total (only the first slide loads up front) |
| Label | Project name (set in `projects.js`, keep it short) |

**Safe area:** design to 16:9. Phones in portrait crop to roughly the **middle third**, so keep the subject centred, inside about the central 1080×1080. The middle is also where the project name sits, so a little calmer detail behind it reads better. Avoid very pale tones at the top and bottom edges, because the light nav sits there.

## 2. Work grid covers (home + "more projects")

Masonry cards, 2 columns on phones, 3 from tablet up. Each project keeps its own card shape (listed per project below).

| Shape | Size | Budget |
|---|---|---|
| 4:5 | 1200×1500 | ≤ 200 KB |
| 1:1 | 1200×1200 | ≤ 180 KB |
| 3:4 | 1200×1600 | ≤ 220 KB |
| 5:4 | 1200×960 | ≤ 160 KB |
| 2:3 | 1200×1800 | ≤ 250 KB |

File: `assets/media/projects/<project>/cover.webp`. **Moving cover?** `cover.mp4` at **720px wide** (same shape, e.g. 720×900), 2 to 4s loop, ≤ 1 MB, plus `cover-poster.webp`. Want a different card shape for a project? Just say. It's one setting.

## 3. Project pages

| Slot | File | Size | Budget |
|---|---|---|---|
| Top image (hero) | `hero.webp` | **2400×1350** (16:9) | ≤ 400 KB |
| Full-width image | `01.webp` … | **2400×1350** (16:9) | ≤ 400 KB |
| Side-by-side pair (each) | `02.webp`, `03.webp` | **1400×1750** (4:5) | ≤ 300 KB each |
| Full-width video | `04.mp4` + `04-poster.webp` | 1920×1080 · ≤ 15s · no audio | ≤ 6 MB |
| Pair video (each) | `05.mp4` + poster | 1080×1350 · ≤ 10s | ≤ 4 MB |
| Long films | YouTube or Vimeo link | n/a | n/a |

**Hero crop:** on phones the top image is shown as **4:5**, cropped from the centre of the 16:9 file, so keep the subject centred. (If you'd rather supply a separate phone crop, `hero-mobile.webp` at 1200×1500, I can add that option.)

**The layout is flexible.** Right now each page alternates full, pair, full, pair…, sized to the old folio's image counts (below). Send whatever you have, in any order or mix (full or pair, image or video), and I'll set the sequence.

## 4. Per-project checklist

All files go in `assets/media/projects/<folder>/`.

| Project | Folder | Grid cover | Top image | Page images (current layout) |
|---|---|---|---|---|
| **Modern Health Dynamics** | `modern-health-dynamics/` | `cover` 1200×1500 (4:5) | `hero` 2400×1350 | 12 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` + `06` pair 1400×1750, `07` full 2400×1350, `08` + `09` pair 1400×1750, `10` full 2400×1350, `11` + `12` pair 1400×1750 |
| **Moment*** | `moment/` | `cover` 1200×1200 (1:1) | `hero` 2400×1350 | 9 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` + `06` pair 1400×1750, `07` full 2400×1350, `08` + `09` pair 1400×1750 |
| **Estée Lauder Companies** | `estee-lauder-co/` | `cover` 1200×1600 (3:4) | `hero` 2400×1350 | 4 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350 |
| **LMND** | `lmnd/` | `cover` 1200×960 (5:4) | `hero` 2400×1350 | 2 images: `01` full 2400×1350, `02` full 2400×1350 + 2 YouTube films (stay on YouTube) |
| **CO_LAB** | `co-lab/` | `cover` 1200×1500 (4:5) | `hero` 2400×1350 | 6 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` + `06` pair 1400×1750 |
| **Sehat** | `sehat/` | `cover` 1200×1800 (2:3) | `hero` 2400×1350 | 14 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` + `06` pair 1400×1750, `07` full 2400×1350, `08` + `09` pair 1400×1750, `10` full 2400×1350, `11` + `12` pair 1400×1750, `13` full 2400×1350, `14` full 2400×1350 |
| **DIA** | `dia/` | `cover` 1200×1200 (1:1) | `hero` 2400×1350 | 10 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` + `06` pair 1400×1750, `07` full 2400×1350, `08` + `09` pair 1400×1750, `10` full 2400×1350 |
| **Tramonto** | `tramonto/` | `cover` 1200×1600 (3:4) | `hero` 2400×1350 | 5 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` full 2400×1350 |
| **1-2-Eat** | `1-2-eat/` | `cover` 1200×960 (5:4) | `hero` 2400×1350 | 7 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` + `06` pair 1400×1750, `07` full 2400×1350 |
| **Elevo** | `elevo/` | `cover` 1200×1500 (4:5) | `hero` 2400×1350 | 5 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` full 2400×1350 |
| **Hou Sek** | `hou-sek/` | `cover` 1200×1200 (1:1) | `hero` 2400×1350 | 12 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` + `06` pair 1400×1750, `07` full 2400×1350, `08` + `09` pair 1400×1750, `10` full 2400×1350, `11` + `12` pair 1400×1750 |
| **Misc** | `miscellaneous/` | `cover` 1200×1600 (3:4) | `hero` 2400×1350 | 6 images: `01` full 2400×1350, `02` + `03` pair 1400×1750, `04` full 2400×1350, `05` + `06` pair 1400×1750 |

## 5. Copy (in `assets/js/projects.js`)

| Item | Guide |
|---|---|
| Project name | As on the folio (current) |
| Card headline | One line, **≤ 40 characters** (shows under each grid card) |
| Intro | **2 to 3 sentences, about 200 to 300 characters** |
| Services | 2 to 5 short items, e.g. Branding, Art Direction, Packaging |
| Year | e.g. 2024 |
| Hero slide labels | Project names, short |
| Statement | Set; keep it about the same length so the column shape holds |
| Contact | Your email and phone (you add these yourself) |
| Info page bio | Currently the folio bio; send a new one any time |

## 6. Characters

| Item | Spec |
|---|---|
| **Oko yawn mouth** | Draw over the current frown on Oko's artboard (same 1920×1080 artboard and position) and export as SVG with the group named **`yawn`**. Keep the stroke weight and #1a1a1a ink the same. |
| Soh game sprites (optional) | Currently drawn in code. If you redraw: PNG on a transparent background, 1 pixel = 1 art pixel, sizes as in the game (Soh 16×16, bottle 6×14, stubby 6×10, bush 12×8, wide bush 20×8, magpie 16×8, 2 frames) |

## 7. Site extras (not built yet)

| Item | Spec |
|---|---|
| Favicon | `favicon.svg` (simple mark, e.g. Soh) + `apple-touch-icon.png` 180×180 + `favicon-32.png` 32×32 |
| Social share image | `og.jpg` · **1200×630** · ≤ 300 KB (shows when the link is shared) |
| Brand fonts (later) | **WOFF2** files for the web, with a web licence |

---

## Export settings

**Figma / Photoshop:** export as WebP at about 80% quality. Or export PNG/JPG and compress with **squoosh.app** (WebP, quality 78 to 82).

**Video (HandBrake):** preset "Fast 1080p30", then turn audio off, enable "Web Optimized", and use RF 24 to 26. Or with ffmpeg:

```bash
ffmpeg -i input.mov -an -vf "scale=1920:-2,fps=25" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 25 -preset slow -movflags +faststart 01.mp4
```

Poster from the first frame:

```bash
ffmpeg -i 01.mp4 -frames:v 1 -c:v libwebp -quality 78 01-poster.webp
```

GIF to MP4:

```bash
ffmpeg -i animation.gif -an -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 24 animation.mp4
```
