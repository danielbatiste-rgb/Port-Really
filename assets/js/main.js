/* ==========================================================================
   Site behaviour - hero slideshow, masonry grid, project pages, motion.
   Content comes from projects.js; you shouldn't need to edit this file
   to add or change work.
   ========================================================================== */

(() => {
  const ROOT = document.body.dataset.root || "";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const isVideo = (src = "") => /\.(mp4|webm|mov)$/i.test(src);

  /* ------------------------------------------------------------------------
     Reveal on scroll - elements fade/rise in once, as they enter the viewport.
     Classes are only added by JS, so everything is visible without it.
     ------------------------------------------------------------------------ */
  const revealIO =
    !reduceMotion && "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              e.target.classList.add("is-in");
              revealIO.unobserve(e.target);
            }),
          { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
        )
      : null;

  // variant: "" (fade + rise) | "words" (line-by-line word rise) | "clip" (media unmask)
  function reveal(el, { delay = 0, variant = "" } = {}) {
    if (!revealIO || !el) return;
    if (variant === "words") splitWords(el);
    el.classList.add("reveal");
    if (variant) el.classList.add("reveal--" + variant);
    el.style.setProperty("--delay", delay + "ms");
    revealIO.observe(el);
  }

  // Group reveal that waits for "arrival": nothing plays until the trigger element
  // has risen well into view (past the lower third). Items keep their own delays.
  function revealOnArrival(trigger, items, onArrive) {
    if (!revealIO || !trigger) return;
    items.forEach(({ el, delay = 0, variant = "", manual = false }) => {
      if (!el) return;
      if (variant === "words") splitWords(el);
      el.classList.add("reveal");
      if (variant) el.classList.add("reveal--" + variant);
      el.style.setProperty("--delay", delay + "ms");
    });
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        items.forEach(({ el, manual }) => el && !manual && el.classList.add("is-in"));
        io.disconnect();
        onArrive?.();
      },
      { rootMargin: "0px 0px -35% 0px", threshold: 0.5 }
    );
    io.observe(trigger);
  }

  // Wrap each word so it can rise from behind its own line mask
  function splitWords(el) {
    if (el.dataset.split) return;
    el.dataset.split = "1";
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(part);
            const w = document.createElement("span");
            w.className = "w";
            w.innerHTML = `<span>${esc(part)}</span>`;
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    $$(".w > span", el).forEach((s, i) => s.style.setProperty("--i", i));
  }

  /* Export sizes for each placeholder (see ASSET-SPECS.md) */
  const SPEC = {
    cover: { "4/5": "1200×1500", "1/1": "1200×1200", "3/4": "1200×1600", "5/4": "1200×960", "2/3": "1200×1800", "16/9": "1200×675" },
    full: "2400×1350",
    pair: "1400×1750",
  };
  const num = (n) => String(n).padStart(2, "0");

  /* Media block: real asset if `src` is set, otherwise a tinted placeholder. */
  function media({ src, poster, ratio, tint, alt = "" }, { eager = false, tag } = {}) {
    const style = `${ratio ? `--ratio:${ratio};` : ""}${tint ? `--tint:${tint};` : ""}`;
    let inner = "";
    if (src && isVideo(src)) {
      inner = `<video src="${ROOT + src}" ${poster ? `poster="${ROOT + poster}"` : ""} muted loop playsinline autoplay preload="metadata"></video>`;
    } else if (src) {
      inner = `<img src="${ROOT + src}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async" onload="this.classList.add('is-loaded')">`;
    }
    const label = src ? "" : `<span class="media__tag">${esc(tag || (ratio || "16/9").replace("/", ":"))}</span>`;
    return `<div class="media" style="${style}"><div class="media__fill">${inner}</div>${label}</div>`;
  }

  /* ------------------------------------------------------------------------
     Header - tucks away on scroll down, returns on scroll up.
     ------------------------------------------------------------------------ */
  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    let lastY = scrollY;
    const update = () => {
      const y = scrollY;
      const delta = y - lastY;
      document.body.classList.toggle("is-scrolled", y > 8);
      if (Math.abs(delta) > 6) {
        document.body.classList.toggle("header-hidden", delta > 0 && y > 160);
        lastY = y;
      }
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------------
     Hero - hard-cut slideshow
     ------------------------------------------------------------------------ */
  function initHero() {
    const hero = $("[data-hero]");
    if (!hero || !window.HERO) return;

    hero.innerHTML =
      HERO.slides
        .map((s, i) => {
          let bg = "";
          if (s.type === "video") {
            bg = `<video src="${ROOT + s.src}" ${s.poster ? `poster="${ROOT + s.poster}"` : ""} muted playsinline preload="auto"></video>`;
          } else if (s.type === "image") {
            bg = `<img src="${ROOT + s.src}" alt="" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
          }
          return `<div class="hero__slide${i === 0 ? " is-active" : ""}" style="--tint:${s.tint || "#111"}" aria-hidden="${i !== 0}">
          ${bg}
          ${s.type === "color" ? `<span class="hero__tag">Slide ${num(i + 1)} · ${num(i + 1)}.mp4 1920×1080 + poster, or ${num(i + 1)}.webp 2560×1440</span>` : ""}
        </div>`;
        })
        .join("");

    const slides = $$(".hero__slide", hero);
    let current = 0;
    let timer = null;
    let visible = true;
    let paused = false; // a click on the hero pauses, another click carries on

    const show = (i) => {
      const prev = slides[current];
      prev.classList.remove("is-active");
      prev.setAttribute("aria-hidden", "true");
      // Rewind once it's hidden, so it's back on its first frame before it's shown again (no stale frame flash)
      const old = $("video", prev);
      if (old) { old.pause(); old.currentTime = 0; }
      current = i;
      const next = slides[current];
      next.classList.add("is-active");
      next.setAttribute("aria-hidden", "false");
      $("video", next)?.play().catch(() => {}); // Low Power Mode → poster shows instead
    };

    const wait = () => HERO.slides[current].duration || HERO.interval || 1100;
    const tick = () => {
      show((current + 1) % slides.length);
      timer = setTimeout(tick, wait());
    };
    // Time left on the current slide, so resuming mid-clip doesn't hold it for a full length again
    const left = () => {
      const v = $("video", slides[current]);
      return Math.max(0, wait() - (v ? v.currentTime * 1000 : 0));
    };
    const start = () => {
      if (reduceMotion || slides.length < 2 || timer || paused || !visible || document.hidden) return;
      timer = setTimeout(tick, left());
    };
    const stop = () => { clearTimeout(timer); timer = null; };

    $("video", slides[0])?.play().catch(() => {});

    hero.addEventListener("click", () => {
      paused = !paused;
      const v = $("video", slides[current]);
      if (paused) { stop(); v?.pause(); }
      else { v?.play().catch(() => {}); start(); }
    });

    // Pause when off-screen or tab hidden
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    }).observe(hero);

    // Nav light while over the hero: header strip (top) and corners (bottom) separately
    const updateChrome = () => {
      const bottom = hero.getBoundingClientRect().bottom;
      document.body.classList.toggle("on-hero", bottom > 40);
      document.body.classList.toggle("on-hero-low", bottom > innerHeight - 40);
    };
    addEventListener("scroll", updateChrome, { passive: true });
    addEventListener("resize", updateChrome);
    updateChrome();

    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
  }

  /* ------------------------------------------------------------------------
     Masonry grid - distributes cards to the shortest column so reading
     order stays left-to-right. 2 columns on mobile, 3 from 800px.
     ------------------------------------------------------------------------ */
  function card(p) {
    return `<a class="card" href="${ROOT}work/${p.slug}/">
      ${media({ ...p.cover, tint: p.cover.tint || p.tint, alt: p.title }, { tag: `cover.webp · ${SPEC.cover[p.cover.ratio] || "1200 wide"}` })}
      <div class="card__text">
        <h3 class="card__headline">${esc(p.headline)}</h3>
        <p class="card__client">${esc(p.title)} <span class="arrow" aria-hidden="true">→</span></p>
      </div>
    </a>`;
  }

  const ratioValue = (r = "1/1") => {
    const [w, h] = r.split("/").map(Number);
    return h / w;
  };

  function initGrids() {
    const grids = $$("[data-grid]");
    if (!grids.length || !window.PROJECTS) return;
    const mq = window.matchMedia("(min-width: 800px)");
    let first = true;

    const render = () => {
      const cols = mq.matches ? 3 : 2;
      grids.forEach((grid) => {
        const exclude = grid.dataset.exclude;
        const items = PROJECTS.filter((p) => p.slug !== exclude);
        const heights = Array(cols).fill(0);
        const buckets = Array.from({ length: cols }, () => []);
        items.forEach((p) => {
          const i = heights.indexOf(Math.min(...heights));
          buckets[i].push(card(p));
          heights[i] += ratioValue(p.cover.ratio) + 0.35; // + caption allowance
        });
        grid.classList.remove("no-js");
        grid.innerHTML = buckets.map((b) => `<div class="grid__col">${b.join("")}</div>`).join("");

        // Stagger across columns on first load only (not on breakpoint re-renders)
        if (first) $$(".grid__col", grid).forEach((col, c) => $$(".card", col).forEach((el) => reveal(el, { delay: c * 90 })));
      });
      first = false;
    };

    render();
    mq.addEventListener("change", render);

    // Card → project hero morph (browsers with cross-document View Transitions)
    document.addEventListener("click", (e) => {
      const a = e.target.closest(".card");
      if (!a) return;
      $$(".media").forEach((m) => (m.style.viewTransitionName = "")); // incl. this page's hero
      $(".media", a).style.viewTransitionName = "project-media";
    });
    // Clear the name when returning via back/forward cache
    addEventListener("pageshow", () => $$(".card .media").forEach((m) => (m.style.viewTransitionName = "")));
  }

  /* ------------------------------------------------------------------------
     Project page
     ------------------------------------------------------------------------ */
  function initProject() {
    const el = $("[data-project]");
    if (!el || !window.PROJECTS) return;
    const slug = el.dataset.project;
    const idx = PROJECTS.findIndex((p) => p.slug === slug);
    const p = PROJECTS[idx];
    if (!p) return;
    const next = PROJECTS[(idx + 1) % PROJECTS.length];

    document.title = `${p.title} | ${SITE.name}`;

    let fileNo = 0;
    const rows = (p.media || [])
      .map((m) => {
        const tint = m.tint || p.tint;
        if (m.layout === "pair") {
          const [a = {}, b = {}] = m.items || [];
          return `<div class="row row--pair">
            ${media({ ratio: m.ratio, tint, ...a }, { tag: `${num(++fileNo)}.webp · ${SPEC.pair}` })}
            ${media({ ratio: m.ratio, tint, ...b }, { tag: `${num(++fileNo)}.webp · ${SPEC.pair}` })}
          </div>`;
        }
        return `<div class="row">${media({ ratio: m.ratio, tint, ...m }, { tag: `${num(++fileNo)}.webp · ${SPEC.full}` })}</div>`;
      })
      .join("");

    const embeds = (p.embeds || [])
      .map((src) => `<div class="embed"><iframe src="${src}" title="${esc(p.title)} film" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`)
      .join("");

    el.innerHTML = `
      <div class="project__hero">${media({ ...(p.hero || {}), tint: p.tint, alt: p.title }, { eager: true, tag: `hero.webp · ${SPEC.full} (phones crop the centre to 4:5)` })}</div>
      <section class="project__intro">
        <h1 class="project__title label">${esc(p.title)}</h1>
        <p class="project__body">${esc(p.intro)}</p>
        <dl class="project__meta">
          <div><dt class="label">Services</dt><dd>${p.services.map(esc).join("<br>")}</dd></div>
          <div><dt class="label">Year</dt><dd>${esc(p.year)}</dd></div>
        </dl>
      </section>
      <div class="project__media">${rows}${embeds}</div>
      <div class="project__next">
        <span class="label">More projects</span>
        <a class="label link" href="${ROOT}work/${next.slug}/">Next: ${esc(next.title)} <span class="arrow" aria-hidden="true">→</span></a>
      </div>`;

    // Hero is the morph target from the clicked card; it unmasks if there's no morph
    $(".project__hero .media", el).style.viewTransitionName = "project-media";
    reveal($(".project__title", el), { delay: 150 });
    reveal($(".project__body", el), { delay: 200, variant: "words" });
    reveal($(".project__meta", el), { delay: 350 });
    $$(".project__media > *", el).forEach((r) => reveal(r));
    reveal($(".project__next", el));
  }

  /* ------------------------------------------------------------------------
     Shared bits
     ------------------------------------------------------------------------ */
  function initContact() {
    $$("[data-contact]").forEach((el) => {
      const c = SITE.contact;
      el.innerHTML = `
        <div><dt class="label">Email</dt><dd>${esc(c.email)}</dd></div>
        ${c.phone ? `<div><dt class="label">Phone</dt><dd>${esc(c.phone)}</dd></div>` : ""}
        <div><dt class="label">Based in</dt><dd>${esc(c.location)}</dd></div>`;
    });
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
    const st = SITE.statement;
    const whole = typeof st === "string" ? st : [st.before, st.after].filter(Boolean).join(" ");
    const oneParagraph = !!$(".statement--above");
    $$("[data-statement]").forEach((el) => {
      const key = el.dataset.statement;
      if (oneParagraph) el.textContent = key === "after" ? "" : whole;
      else el.textContent = typeof st === "string" ? (key === "after" ? "" : st) : st[key] || "";
    });
  }

  // Statement layout preview: ?statement=above | inline | stacked | row
  function initStatementLayout() {
    const el = $(".statement");
    const pick = new URLSearchParams(location.search).get("statement");
    if (!el || !pick) return;
    el.classList.remove("statement--above", "statement--inline", "statement--row");
    if (["above", "inline", "row"].includes(pick)) el.classList.add("statement--" + pick);
  }

  // Oko's entrance: springs up from behind the line above the copy, then a quick look up and around
  function peekOko(el, start) {
    const at = (ms, fn) => setTimeout(fn, start + ms);
    const g = { gentle: true }; // slow, smooth glides rather than springy snaps
    at(0, () => { el.classList.add("is-up"); el.oko?.look(0, -0.3, g); el.oko?.hop(45); }); // wide awake, up he comes
    at(850, () => el.classList.add("is-in", "is-revealed"));
    // small head turns, eyes do the work (they travel further upward)
    at(950, () => el.oko?.look(0, -0.9, g));       // up
    at(1700, () => el.oko?.look(-0.3, -0.75, g));  // up and a little left
    at(2400, () => el.oko?.look(0.3, -0.75, g));   // up and a little right
    at(3100, () => el.oko?.look(0, 0, g));         // settle
  }

  // Section-level reveals for static markup
  function initReveals() {
    $$(".contact__lead, .info p").forEach((el) => reveal(el, { variant: "words" }));
    // Statement: waits until Oko has arrived on screen, then a beat - top copy, Oko pops, bottom copy
    const STATEMENT_DELAY = 350;
    const oko = $(".statement__koala");
    if ($(".statement--above")) {
      // Above layout: the copy rises, then Oko peeks up from behind it, has a look round, and pops up
      revealOnArrival(oko, [
        { el: $(".statement__text--top"), delay: STATEMENT_DELAY, variant: "words" },
        { el: oko, variant: "peek", manual: true },
      ], () => peekOko(oko, STATEMENT_DELAY + 300));
    } else {
      revealOnArrival(oko, [
        { el: $(".statement__text--top"), delay: STATEMENT_DELAY, variant: "words" },
        { el: oko, delay: STATEMENT_DELAY + 150, variant: "pop" },
        { el: $(".statement__text--bottom"), delay: STATEMENT_DELAY + 350, variant: "words" },
      ]);
    }
    $$(".work__head").forEach((el) => reveal(el));
    $$(".contact__list > div").forEach((el, i) => reveal(el, { delay: i * 80 }));
  }

  /* ------------------------------------------------------------------------
     Koala mascot - the animated SVG lives in the statement section.
     Mounts into any [data-mascot] element; 3D modules are parked.
     ------------------------------------------------------------------------ */
  async function initMascot() {
    const el = $("[data-mascot]");
    if (!el) return;
    const type = new URLSearchParams(location.search).get("mascot") || SITE.mascot || "svg";
    const url = (f) => new URL(ROOT + "assets/" + f, location.href).href;
    try {
      if (type === "toon" || type === "fuzzy") {
        const { mountKoala3D } = await import(url("js/koala-3d.js"));
        mountKoala3D(el, { look: type });
      } else {
        const { mountKoalaSVG } = await import(url("js/koala-svg.js"));
        await mountKoalaSVG(el, { src: url("media/mascot/koala.svg"), ...(SITE.oko || {}) });
      }
    } catch (err) {
      console.warn("Mascot failed to load", err);
    }
  }

  /* ------------------------------------------------------------------------
     Pixel koala (bottom-right corner). Colours are CSS variables in main.css.
     16 × 11 grid - 40px wide gives whole device pixels on retina screens.
     ------------------------------------------------------------------------ */
  const PIXEL_KOALA = `<svg viewBox="429 174.73 1061.82 730" shape-rendering="crispEdges" aria-hidden="true">
    <polygon class="px-body" points="1424.45 307.45 1424.45 241.09 1358.09 241.09 1358.09 174.73 1159 174.73 1159 241.09 1092.64 241.09 1092.64 307.45 827.18 307.45 827.18 241.09 760.82 241.09 760.82 174.73 561.73 174.73 561.73 241.09 495.36 241.09 495.36 307.45 429 307.45 429 506.55 495.36 506.55 495.36 572.91 561.73 572.91 561.73 639.27 628.09 639.27 628.09 705.64 694.45 705.64 694.45 838.36 827.18 838.36 827.18 904.73 1092.64 904.73 1092.64 838.36 1225.36 838.36 1225.36 705.64 1291.73 705.64 1291.73 639.27 1358.09 639.27 1358.09 572.91 1424.45 572.91 1424.45 506.55 1490.82 506.55 1490.82 307.45 1424.45 307.45"/>
    <g class="px-ear">
      <rect x="628.09" y="307.45" width="66.36" height="66.36"/><rect x="561.73" y="373.82" width="66.36" height="66.36"/><rect x="628.09" y="373.82" width="66.36" height="66.36"/>
      <rect x="1225.36" y="307.45" width="66.36" height="66.36"/><rect x="1291.73" y="373.82" width="66.36" height="66.36"/><rect x="1225.36" y="373.82" width="66.36" height="66.36"/>
    </g>
    <g class="px-ink">
      <g class="px-eyes"><rect x="760.82" y="572.91" width="66.36" height="66.36"/><rect x="1092.64" y="572.91" width="66.36" height="66.36"/></g>
      <rect x="893.55" y="572.91" width="132.72" height="199.09"/>
    </g>
  </svg>`;

  // Pixel "Z" on a 5 × 5 grid
  const PIXEL_Z = `<svg viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true"><path d="M0 0h5v1H0zM3 1h1v1H3zM2 2h1v1H2zM1 3h1v1H1zM0 4h5v1H0z"/></svg>`;

  // Hover or tap → eyes close and three z's drift up and fade (sleeping)
  function initPixelKoala() {
    $$("[data-pixel-koala]").forEach((el) => {
      el.innerHTML = PIXEL_KOALA + `<span class="px-zzz" aria-hidden="true">${`<span class="px-z">${PIXEL_Z}</span>`.repeat(3)}</span>`;
      let timer = 0;
      const sleep = () => {
        if (el.classList.contains("is-sleeping")) return;
        el.classList.add("is-sleeping");
        clearTimeout(timer);
        timer = setTimeout(() => el.classList.remove("is-sleeping"), 2300);
      };
      el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && sleep());
      // Click: over the hero he just snoozes; at the bottom (contact) he takes you back to the top;
      // everywhere else he takes you to his skate game
      el.addEventListener("click", () => {
        sleep();
        const behavior = reduceMotion ? "auto" : "smooth";
        if (document.body.classList.contains("in-contact")) return scrollTo({ top: 0, behavior });
        const game = $(".contact__game");
        if (document.body.classList.contains("on-hero-low") || !game) return;
        game.scrollIntoView({ behavior, block: "center" });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Statement stop - one scroll down from the hero lands on the statement and
     holds there; the next scroll carries on. Link jumps (Contact ↓, Soh) pass through.
     ------------------------------------------------------------------------ */
  function initStatementStop() {
    const section = $(".statement");
    if (!section) return;
    const stopY = () => Math.round(section.getBoundingClientRect().top + scrollY);
    const KEYS = new Set([" ", "PageDown", "ArrowDown", "End"]);
    let userAt = 0;     // last wheel / swipe / scroll key, so programmatic scrolls aren't caught
    let touch = false;
    let holdUntil = 0;  // swallows the rest of a trackpad flick (its momentum) at the stop
    let holdCap = 0;    // ...but never for longer than HOLD_MAX, so it can't lock
    const HOLD_MAX = 600;
    const EDGE = 8;     // px of slack, so a fractional scroll position just above the stop doesn't re-trigger it
    let lastY = scrollY;
    const hold = () => {
      scrollTo({ top: stopY(), behavior: "instant" });
      const now = performance.now();
      holdCap = now + HOLD_MAX;
      holdUntil = now + 250;
    };
    addEventListener("touchmove", () => { userAt = performance.now(); touch = true; }, { passive: true });
    addEventListener("keydown", (e) => { if (KEYS.has(e.key)) { userAt = performance.now(); touch = false; } });
    addEventListener("wheel", (e) => {
      const now = performance.now();
      userAt = now; touch = false;
      if (e.deltaY <= 0) return;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      const stop = stopY();
      if (now < holdUntil) { e.preventDefault(); holdUntil = Math.min(now + 250, holdCap); return; } // same flick: stay put
      if (scrollY < stop - EDGE && scrollY + dy > stop) { e.preventDefault(); hold(); }
    }, { passive: false });
    // Swipes and keys: catch the crossing as it happens
    addEventListener("scroll", () => {
      const y = scrollY, stop = stopY();
      if (lastY < stop - EDGE && y > stop + 1 && performance.now() > holdCap && performance.now() - userAt < 700) {
        hold();
        if (touch) { // cut the swipe's momentum
          const html = document.documentElement;
          html.style.overflow = "hidden";
          setTimeout(() => (html.style.overflow = ""), 300);
        }
      }
      lastY = scrollY;
    }, { passive: true });
  }

  initHeader();
  initStatementStop();
  initPixelKoala();
  initHero();
  initMascot();
  initProject();
  initGrids();
  /* ------------------------------------------------------------------------
     Soh's skate game in the contact section - loaded only when you scroll near it
     ------------------------------------------------------------------------ */
  function initGame() {
    const el = $("[data-game]");
    if (!el || !("IntersectionObserver" in window)) return;
    const url = new URL(ROOT + "assets/js/soh-game.js", location.href).href;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      try {
        const { mountSohGame } = await import(url);
        mountSohGame(el, { section: el.closest(".contact") });
      } catch (err) {
        console.warn("Game failed to load", err);
      }
    }, { rootMargin: "600px 0px" });
    io.observe(el);
  }

  // "Contact ↓" corner fades out while the contact section is on screen
  function initContactCorner() {
    const section = $("#contact");
    if (!section || !("IntersectionObserver" in window)) return;
    const soh = $(".corner [data-pixel-koala], .corner[data-pixel-koala]"); // the floating one
    new IntersectionObserver(([e]) => {
      document.body.classList.toggle("in-contact", e.isIntersecting);
      soh?.setAttribute("aria-label", e.isIntersecting ? "Soh, the sleepy koala. Back to top" : "Soh, the sleepy koala. Play his skate game");
    }, {
      rootMargin: "0px 0px -15% 0px", // once its top is ~15% up from the bottom of the screen
    }).observe(section);
  }

  initStatementLayout(); // before initContact - the "above" layout joins the copy into one paragraph
  initContact();
  initReveals();
  initGame();
  initContactCorner();
})();
