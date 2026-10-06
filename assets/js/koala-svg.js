/* ==========================================================================
   Koala - 2.5D layered SVG
   Each part of the drawing shifts by its own depth as the head "turns"
   toward the pointer. Pupils track inside the eye whites, eyes blink,
   tap = hop. ~0 dependencies; the artwork is assets/media/mascot/koala.svg.
   ========================================================================== */

// Depth per part: negative = behind the face (moves against the look), positive = toward viewer.
const LAYERS = {
  cap:    { d: -0.55, lift: 1 },
  head:   { d: 0 },
  "ear-r": { d: -0.35 },
  "ear-l": { d: -0.25 },
  tuft:   { d: -0.45 },
  "eye-l": { d: 0.55, eye: true },
  "eye-r": { d: 0.55, eye: true },
  muzzle: { d: 0.75 },
  dots:   { d: 0.8 },
  mouth:  { d: 0.85 },
  yawn:   { d: 0.85 },
  nose:   { d: 1 },
};

const SHIFT = 46;          // max parallax in SVG units (artwork is ~1000 wide)
const PUPIL = { x: 24, y: 18, up: 34 }; // pupils travel further when looking up (more expressive)
const TILT = 8;            // degrees of whole-head rotation toward the look

// Bobblehead feel: the look follows on a loose spring (overshoots, wobbles back)
const SPRING = { stiff: 0.045, damp: 0.8, stiffAsleep: 0.012 };

/* Personality (all optional):
   greetings  - first tap says one of these (picked at random)
   lines      - every tap after that steps through these in order, then loops
   wakeLine   - said when he's startled awake
   sleepAfter - ms with no movement / scrolling before he nods off (0 = never)
   yawnChance - chance (0–1) he yawns before dozing off, or after waking from a nap
   yawnGap    - minimum ms between yawns */
export async function mountKoalaSVG(container, {
  src, interactive = true, greetings = [], lines = [], wakeLine = "",
  sleepAfter = 0, yawnChance = 0.3, yawnGap = 15000,
} = {}) {
  const res = await fetch(src);
  container.innerHTML = await res.text();
  container.classList.add("oko");
  container.insertAdjacentHTML("beforeend",
    `<span class="oko__zzz" aria-hidden="true"><i>z</i><i>z</i><i>z</i></span><span class="oko__bubble" role="status" aria-live="polite"></span>`);
  const bubble = container.querySelector(".oko__bubble");
  const svg = container.querySelector("svg");
  const root = svg.querySelector("#koala");

  const parts = Object.entries(LAYERS).map(([id, cfg]) => {
    const el = svg.querySelector("#" + CSS.escape(id));
    const box = el.getBBox();
    const part = { id, el, cfg, cx: box.x + box.width / 2, cy: box.y + box.height / 2, pupil: el.querySelector(".pupil") };
    if (cfg.eye) {
      // [0] dark eye socket, [1] white, [2] clipped pupil group. Add an eyelid in the socket colour that
      // slides down over the white. Its leading edge is a soft curve: low on the left, sweeping up to a
      // rounded corner on the right. It's clipped to the (slightly larger) socket, so no sliver of white
      // shows at the edges once closed.
      const [socket, white] = el.children;
      const wb = white.getBBox();
      const NS = "http://www.w3.org/2000/svg";
      const clipId = `lid-${id}-${Math.random().toString(36).slice(2, 8)}`;
      const cp = document.createElementNS(NS, "clipPath");
      cp.id = clipId;
      const cpPath = document.createElementNS(NS, "path");
      cpPath.setAttribute("d", socket.getAttribute("d"));
      cp.appendChild(cpPath);
      svg.querySelector("defs").appendChild(cp);
      const { x, y, width: w, height: h } = wb;
      const lidEl = document.createElementNS(NS, "path");
      lidEl.setAttribute("d",
        `M${x - 0.4 * w} ${y - 1.6 * h} L${x + 1.4 * w} ${y - 1.6 * h} L${x + 1.4 * w} ${y + 0.62 * h} ` +
        `C${x + 1.1 * w} ${y + 0.62 * h} ${x + 1.02 * w} ${y + 0.8 * h} ${x + 0.86 * w} ${y + 0.84 * h} ` + // rounded corner, right
        `C${x + 0.62 * w} ${y + 0.9 * h} ${x + 0.42 * w} ${y + 0.96 * h} ${x + 0.24 * w} ${y + 1.1 * h} ` + // concave sweep down to the left
        `L${x - 0.4 * w} ${y + 1.1 * h} Z`);
      lidEl.setAttribute("fill", "#636684");
      const g = document.createElementNS(NS, "g");
      g.setAttribute("clip-path", `url(#${clipId})`);
      g.appendChild(lidEl);
      el.appendChild(g);
      // open: edge parked above the eye; closed: pushed low enough that the curve clears the whole white
      Object.assign(part, { lidEl, lidOpen: -1.2 * h, lidShut: 0.42 * h, lcx: x + w / 2, lcy: y + h / 2 });
    }
    return part;
  });
  const tuft = parts.find((p) => p.id === "tuft");
  const mouth = parts.find((p) => p.id === "mouth");
  const muzzle = parts.find((p) => p.id === "muzzle");
  const yawnPart = parts.find((p) => p.id === "yawn");
  const rootBox = root.getBBox();
  const rcx = rootBox.x + rootBox.width / 2;
  const rcy = rootBox.y + rootBox.height * 0.9; // squash from the "chin"

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // State
  const look = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
  let lastInput = performance.now();
  let blinkAt = performance.now() + 2000; // next blink start
  const BLINK_MS = 170;
  let hop = 0;          // hop timeline 0..1
  const HOP_MS = 380;   // hop length - time-based so 60Hz and 120Hz screens match
  let lastFrame = performance.now();
  let gentleUntil = 0; // during scripted looks: softer, well-damped spring (glides, no overshoot)
  let hopping = false;
  let hopHeight = 90;
  let raf = 0;
  let visible = true;
  let asleep = false;
  let sleptAt = 0;
  let wideUntil = 0;    // eyes pop open after a startle
  let lid = 0;          // 0 open → 1 closed (the dark lid fully over the eye white)
  let shutAmt = 0, shutVel = 0; // sleep/yawn lids, eased (critically damped, so no bounce)
  let yawnToSleep = false;      // a yawn that leads into a doze keeps the eyes shut throughout
  if (reduce) sleepAfter = 0;

  // Yawn - a 1.6s beat: head tips back, eyes squeeze, mouth opens, holds, closes
  const YAWN_MS = 1600;
  let yawnStart = -1;
  let lastYawn = -Infinity;
  let pendingYawnAt = 0;
  let dozeRolled = false; // roll the yawn dice once per doze

  // Scroll reactions - he glances the way you scroll and lags behind with a soft wobble
  let lastScrollY = scrollY;
  let lastScrollT = performance.now();
  let scrollVel = 0;      // px per second, smoothed
  let lastScrollAt = 0;
  let wob = 0, wobV = 0;  // wobble spring (SVG units)
  let lastHello = -Infinity;
  const startYawn = (now) => {
    if (reduce || !yawnPart || yawnStart >= 0) return;
    yawnStart = now;
    lastYawn = now;
    wake();
  };
  const smooth = (x) => x * x * (3 - 2 * x);
  const yawnOpen = (now) => {
    if (yawnStart < 0) return 0;
    const t = (now - yawnStart) / YAWN_MS;
    if (t >= 1) { yawnStart = -1; return 0; }
    if (t < 0.3) return smooth(t / 0.3);
    if (t < 0.7) return 1;
    if (t < 0.9) return 1 - smooth((t - 0.7) / 0.2);
    return 0;
  };

  // Speech bubble - a greeting first, then the lines in order
  let bubbleTimer = 0;
  let greeted = !greetings.length;
  let lineIndex = 0;
  const say = (text) => {
    if (!text) return;
    bubble.textContent = text;
    bubble.classList.remove("is-on");
    void bubble.offsetWidth; // restart the pop
    bubble.classList.add("is-on");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("is-on"), 1900);
  };
  const nextLine = () => {
    if (!greeted) {
      greeted = true;
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    if (!lines.length) return "";
    const line = lines[lineIndex % lines.length];
    lineIndex += 1;
    return line;
  };

  const hopNow = (height = 90, force = false) => {
    if (hopping && !force) return;
    hopHeight = height;
    hopping = true;
    hop = 0;
    wake();
  };

  // Any sign of life: note it, and if he'd nodded off, startle him awake
  const stir = () => {
    lastInput = performance.now();
    dozeRolled = false;
    yawnToSleep = false; // someone's here: he won't nod off after this yawn
    if (asleep && visible) {
      asleep = false;
      container.classList.remove("is-asleep");
      wideUntil = lastInput + 450;
      hopNow(45);
      const napped = lastInput - sleptAt > 5000;
      if (napped) say(wakeLine); // only after a proper nap
      // Sometimes a sleepy yawn once he's come round
      if (napped && lastInput - lastYawn > yawnGap && Math.random() < yawnChance) pendingYawnAt = lastInput + 700;
    }
    wake();
  };

  const onScroll = () => {
    const t = performance.now();
    const dt = Math.max(16, t - lastScrollT);
    const v = ((scrollY - lastScrollY) / dt) * 1000;
    scrollVel += (v - scrollVel) * 0.35;
    lastScrollY = scrollY;
    lastScrollT = t;
    lastScrollAt = t;
    stir();
  };

  const onPointer = (e) => {
    const r = svg.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // Normalise against the viewport so the koala looks "across" the page
    look.tx = clamp((e.clientX - cx) / (innerWidth * 0.5), -1, 1);
    look.ty = clamp((e.clientY - cy) / (innerHeight * 0.5), -1, 1);
    stir();
  };

  // A tap always gets its line - even mid-way through a wake-up hop
  const poke = () => {
    hopNow(90, true);
    say(nextLine());
  };

  if (interactive) {
    addEventListener("pointermove", onPointer, { passive: true });
    addEventListener("pointerdown", onPointer, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("click", poke);
  }

  // Says hello (little hop, wide eyes) when he comes properly into view
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) { wob = wobV = scrollVel = 0; } // come back settled
    const now = performance.now();
    const waitingToPop = container.classList.contains("reveal") && !container.classList.contains("is-in");
    if (interactive && !reduce && !waitingToPop && e.intersectionRatio >= 0.6 && now - lastHello > 4000) {
      lastHello = now;
      if (asleep) stir(); // wakes with his own startle hop
      else { wideUntil = now + 500; hopNow(55); }
    }
    if (visible) wake();
  }, { threshold: [0, 0.6] });
  io.observe(container);

  function frame(now) {
    raf = 0;
    const dt = Math.min(50, Math.max(0, now - lastFrame));
    lastFrame = now;
    if (!visible) return;

    if (pendingYawnAt && now >= pendingYawnAt) { pendingYawnAt = 0; startYawn(now); yawnToSleep = false; }

    // Nods off after a while with nobody about - sometimes with a yawn first
    if (sleepAfter && !asleep && !hopping && yawnStart < 0 && now - lastInput > sleepAfter) {
      if (!dozeRolled) {
        dozeRolled = true;
        if (now - lastYawn > yawnGap && Math.random() < yawnChance) { startYawn(now); yawnToSleep = true; }
      }
      if (yawnStart < 0) {
        asleep = true;
        sleptAt = now;
        yawnToSleep = false;
        container.classList.add("is-asleep");
      }
    }
    const yo = yawnOpen(now);

    // Idle: wander gently when nobody is pointing (head droops when asleep)
    if (asleep) {
      look.tx = 0.12;
      look.ty = 0.6;
    } else if (now - lastInput > 2500) {
      const t = now / 1000;
      look.tx = Math.sin(t * 0.6) * 0.45 + Math.sin(t * 1.7) * 0.1;
      look.ty = Math.sin(t * 0.45 + 1) * 0.25;
    }
    // While scrolling, glance the way the page is moving
    const scrolling = now - lastScrollAt < 350;
    if (!asleep && scrolling) look.ty = clamp(scrollVel / 1400, -0.85, 0.85);
    scrollVel *= scrolling ? 1 : 0.85;

    // Loose spring toward the target (frame-rate independent)
    if (reduce) {
      look.x = look.tx; look.y = look.ty; look.vx = look.vy = 0;
    } else {
      const f = dt / 16.667;
      const gentle = now < gentleUntil;
      const stiff = (asleep ? SPRING.stiffAsleep : gentle ? 0.016 : SPRING.stiff) * f;
      const damp = Math.pow(gentle ? 0.78 : SPRING.damp, f);
      look.vx = (look.vx + (look.tx - look.x) * stiff) * damp;
      look.vy = (look.vy + (look.ty - look.y) * stiff) * damp;
      look.x += look.vx * f;
      look.y += look.vy * f;
    }
    // How hard he's swinging - drives the bobble tilt and the trailing bits
    const swing = clamp(look.vx * 22, -1, 1);
    const swingY = clamp(look.vy * 22, -1, 1);

    // Blink: close and open over BLINK_MS, then schedule the next one
    let closed = 0;
    if (!reduce && now >= blinkAt) {
      const t = (now - blinkAt) / BLINK_MS;
      if (t >= 1) blinkAt = now + 2200 + Math.random() * 3200;
      else closed = Math.sin(t * Math.PI);
    }
    // Lids: blinks stay quick; sleep and yawns ease shut over about a third of a second
    const shut = asleep || yo > 0.12 || yawnToSleep; // stays shut from a pre-doze yawn right into sleep
    [shutAmt, shutVel] = smoothDamp(shutAmt, shutVel, shut ? 1 : 0, 0.15, dt / 1000);
    lid = Math.max(shutAmt, closed);
    const eyeScale = !asleep && now < wideUntil ? 1.12 : 1;

    // Hop: quick squash → stretch → settle
    let hopY = 0, sx = 1, sy = 1, capLift = 0;
    if (hopping) {
      hop += dt / HOP_MS;
      const t = Math.min(hop, 1);
      hopY = -Math.sin(t * Math.PI) * hopHeight;
      const squash = Math.sin(t * Math.PI * 2) * 0.08;
      sx = 1 + squash; sy = 1 - squash;
      capLift = -Math.sin(Math.min(1, t * 1.3) * Math.PI) * 60;
      if (hop >= 1) hopping = false;
    }

    // Slow breathing while asleep
    if (asleep) {
      const b = Math.sin(now / 1100) * 0.015;
      sx += b; sy -= b * 0.6;
    }

    // Yawn stretch: a little taller through the face
    sy += 0.035 * yo;

    // Gentle float - always on, so even a quick scroll-by shows he's alive
    if (!reduce) hopY += asleep ? Math.sin(now / 1500) * 6 : Math.sin(now / 750) * 11;

    // Scroll wobble: trails behind the scroll, then springs back
    if (!reduce) {
      const target = clamp(-scrollVel * 0.035, -45, 45);
      wobV += (target - wob) * 0.14;
      wobV *= 0.72;
      wob += wobV;
      hopY += wob;
      sy += wob * 0.0012;
      sx -= wob * 0.0006;
    }

    // Breeze: a slow, uneven sway layered under everything
    const breeze = reduce ? 0 : (Math.sin(now / 1900) * 4.5 + Math.sin(now / 1100 + 1.3) * 0.4) * (asleep ? 0.85 : 1);
    const breezeX = reduce ? 0 : Math.sin(now / 1900 + 0.6) * (asleep ? 10 : 12);

    // Bobble: tips on his "neck" against the direction of a fast move, plus squash on big swings
    const bobble = swing * -5;
    sx += Math.abs(swing) * 0.03;
    sy -= Math.abs(swing) * 0.025 - swingY * 0.02;

    const rot = clamp(look.x * TILT - 2 * yo + bobble + breeze + (reduce ? 0 : wobV * 0.25), -16, 16);
    root.setAttribute("transform",
      `translate(${breezeX} ${hopY}) translate(${rcx} ${rcy}) rotate(${rot}) scale(${sx} ${sy}) translate(${-rcx} ${-rcy})`);

    for (const p of parts) {
      const dx = look.x * SHIFT * p.cfg.d;
      const dy = (look.y - 0.45 * yo) * SHIFT * 0.7 * p.cfg.d + (p.cfg.lift ? capLift : 0); // head tips back
      let t = `translate(${dx} ${dy})`;
      if (p === muzzle && yo) t += ` translate(${p.cx} ${p.cy - 60}) scale(1 ${1 + 0.07 * yo}) translate(${-p.cx} ${-(p.cy - 60)})`;
      if (p === yawnPart) {
        t += ` translate(${p.cx} ${p.cy}) scale(${0.55 + 0.45 * yo} ${Math.max(0.001, yo)}) translate(${-p.cx} ${-p.cy})`;
        p.el.setAttribute("opacity", String(clamp(yo * 8, 0, 1))); // gone when closed (no collapsed-outline hairline)
      }
      if (p === mouth) p.el.setAttribute("opacity", String(clamp(1 - yo * 6, 0, 1)));
      // Secondary motion: cap and ears trail behind the swing, and catch the breeze
      if (!reduce && p.id === "cap") {
        const capRot = clamp(swing * 9 + breeze * 1.2 + (hopping ? Math.sin(hop * Math.PI * 2) * 6 : 0), -18, 18);
        t += ` rotate(${capRot} ${p.cx} ${p.cy + 60})`;
      }
      if (!reduce && (p.id === "ear-l" || p.id === "ear-r")) {
        const side = p.id === "ear-l" ? -1 : 1;
        t += ` rotate(${clamp(swing * 5 * side + breeze * 0.8, -10, 10)} ${p.cx - side * 60} ${p.cy})`;
      }
      if (p.cfg.eye) {
        t += ` translate(${p.cx} ${p.cy}) scale(${eyeScale}) translate(${-p.cx} ${-p.cy})`;
        // counter-rotate against the head's tilt so the lid's curve always reads the same, opening or closing
        p.lidEl.setAttribute("transform", `rotate(${(-rot).toFixed(2)} ${p.lcx} ${p.lcy}) translate(0 ${(p.lidOpen + (p.lidShut - p.lidOpen) * lid).toFixed(2)})`);
      }
      if (p === tuft) {
        let wig = (asleep ? 0 : Math.sin(now / 260) * 3) + (hopping ? Math.sin(hop * 20) * 10 : 0) + (reduce ? 0 : swing * 22 + breeze * 2);
        // little shake as the yawn finishes
        if (yawnStart >= 0) {
          const yt = (now - yawnStart) / YAWN_MS;
          if (yt > 0.82) wig += Math.sin(yt * 70) * 9 * (1 - yt) / 0.18;
        }
        t += ` rotate(${wig} ${p.cx + 40} ${p.cy + 40})`;
      }
      p.el.setAttribute("transform", t);
      if (p.pupil) p.pupil.setAttribute("transform", `translate(${look.x * PUPIL.x} ${look.y * (look.y < 0 ? PUPIL.up : PUPIL.y)})`);
    }

    if (!reduce || hopping) wake();
  }

  function wake() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  wake();

  const api = {
    poke,
    yawn: () => { startYawn(performance.now()); yawnToSleep = false; },
    // Steer his gaze for a moment (used by the entrance); counts as activity, wakes him quietly
    look: (x, y, { gentle = false } = {}) => {
      lastInput = performance.now();
      if (gentle) gentleUntil = lastInput + 1200;
      dozeRolled = false;
      if (asleep) { asleep = false; container.classList.remove("is-asleep"); }
      look.tx = x;
      look.ty = y;
      wake();
    },
    hop: (height = 70) => hopNow(height, true),
    state: () => ({ asleep, sleptAt, lastInput, now: performance.now(), visible }),
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener("pointermove", onPointer);
      removeEventListener("pointerdown", onPointer);
      removeEventListener("scroll", onScroll);
      container.removeEventListener("click", poke);
      clearTimeout(bubbleTimer);
      container.classList.remove("oko", "is-asleep");
      container.innerHTML = "";
      delete container.oko;
    },
  };
  container.oko = api; // handy for testing: document.querySelector(".oko").oko.yawn()
  return api;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Critically damped ease toward a target (smooth in and out, never overshoots)
function smoothDamp(cur, vel, target, time, dt) {
  if (dt <= 0) return [cur, vel];
  const w = 2 / time, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const ch = cur - target, tmp = (vel + w * ch) * dt;
  return [target + (ch + tmp) * e, (vel - w * tmp) * e];
}
