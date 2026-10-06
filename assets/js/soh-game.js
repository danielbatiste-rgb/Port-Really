/* ==========================================================================
   Soh's skate game - a tiny endless runner (after Chrome's offline T-Rex).
   Soh rolls on his board; jump the bottles and bushes, mind the magpies.
   No library. Pixel sprites are drawn from the character grids below.
   ========================================================================== */

const P = 2; // logical pixels per sprite pixel

/* Palette keys used in the grids:
   k ink · d dark grey · g mid grey · l light grey · w paper · "." empty */
const PALETTES = {
  day:   { k: "#1a1a1a", d: "#6b6b6b", g: "#a9a9a9", l: "#d2d2d2", w: "#f1f1f1" },
  night: { k: "#ededed", d: "#a6a6a6", g: "#727272", l: "#474747", w: "#2b2b2b" },
};

// Soh's head - traced from the pixel artwork (16 × 11)
const HEAD = [
  "..ggg......ggg..",
  ".ggggg....ggggg.",
  "gggwggggggggwggg",
  "ggwwggggggggwwgg",
  "gggggggggggggggg",
  ".gggggggggggggg.",
  "..gggkgkkgkggg..",
  "...ggggkkgggg...",
  "....gggkkggg....",
  "....gggggggg....",
  "......gggg......",
];
const eyes = (rows, c) => rows.map((r, i) => (i === 6 ? r.slice(0, 5) + c + r.slice(6, 10) + c + r.slice(11) : r));

const BODY = ["......gggg......", ".....gggggg.....", ".....gg..gg....."];
const BODY_JUMP = ["......gggg......", ".....gggggg.....", "....g......g...."];
const DECK = "..kkkkkkkkkkkk..";

const SPRITES = {
  rideA: [...HEAD, ...BODY, DECK, "...dk......dk..."],
  rideB: [...HEAD, ...BODY, DECK, "...kd......kd..."],
  jump:  [...HEAD, ...BODY_JUMP, DECK, "...kk......kk..."],
  sleep: [...eyes(HEAD, "d"), ...BODY, DECK, "...kk......kk..."],
  head:  eyes(HEAD, "l"), // dazed, for the crash
  board: [DECK, "...kk......kk..."],

  bottle: [
    "..kk..",
    "..kk..",
    "..dk..",
    "..dk..",
    ".kddk.",
    "kddddk",
    "kdlddk",
    "kwwwwk",
    "kwwwwk",
    "kdlddk",
    "kdlddk",
    "kddddk",
    "kddddk",
    ".kkkk.",
  ],
  stubby: [
    ".kkkk.",
    ".kddk.",
    "kddddk",
    "kdlddk",
    "kwwwwk",
    "kwwwwk",
    "kdlddk",
    "kddddk",
    "kddddk",
    ".kkkk.",
  ],
  bush: [
    "....kkkk....",
    "..kkggggkk..",
    ".kggggdgggk.",
    "kggdgggggdgk",
    "kgggggdggggk",
    "kggdggggggdk",
    "kggggggdgggk",
    ".kkkkkkkkkk.",
  ],
  bushWide: [
    "....kkkk....kkkk....",
    "..kkggggkkkkggggkk..",
    ".kgggdggggggggdgggk.",
    "kggggggdggggdggggggk",
    "kggdggggggggggggdggk",
    "kgggggggdggggggggggk",
    "kggggdggggggdggggggk",
    ".kkkkkkkkkkkkkkkkkk.",
  ],
  magpieUp: [
    ".........kk.....",
    "........kwwk....",
    ".......kwwk.....",
    "..kk..kkkk......",
    ".lkkkkkkkkkkkkk.",
    "ll.kkwwwkkkkkkkk",
    "...kkkkkkkkk....",
    "................",
  ],
  magpieDown: [
    "................",
    "................",
    "..kk............",
    ".lkkkkkkkkkkkkk.",
    "ll.kkwwwkkkkkkkk",
    "...kkkkkkkkkk...",
    ".......kwwk.....",
    "........kk......",
  ],
  cloud: [
    "....llll......",
    "..llllllll.ll.",
    ".lllllllllllll",
    "llllllllllllll",
    ".llllllllllll.",
  ],
  z: ["ddddd", "...d.", "..d..", ".d...", "ddddd"],
};

// Side-by-side groups (bottom-aligned, one empty column between)
function join(...grids) {
  const h = Math.max(...grids.map((g) => g.length));
  const padded = grids.map((g) => [...Array(h - g.length).fill(".".repeat(g[0].length)), ...g]);
  return Array.from({ length: h }, (_, i) => padded.map((g) => g[i]).join("."));
}
SPRITES.bottles2 = join(SPRITES.bottle, SPRITES.stubby);
SPRITES.bottles3 = join(SPRITES.stubby, SPRITES.bottle, SPRITES.stubby);

// Physics (logical px and seconds)
const H = 150;
const GROUND = H - 16;
const SOH_X = 24;
const GRAVITY = 2600;
const JUMP_V = 620;
const HOLD_TIME = 0.2;   // holding the jump floats a little higher for this long
const START_SPEED = 330;
const MAX_SPEED = 720;
const ACCEL = 11;
const NIGHT_EVERY = 700;
const NIGHT_LENGTH = 250;

export function mountSohGame(root, { section } = {}) {
  root.classList.add("game");
  root.innerHTML = `
    <canvas class="game__canvas" aria-label="Soh's skate game: tap or press space to jump"></canvas>
    <div class="game__hud label" aria-hidden="true"><span class="game__hi"></span><span class="game__score">00000</span></div>
    <p class="game__msg label" role="status"></p>`;
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const hudScore = root.querySelector(".game__score");
  const hudHi = root.querySelector(".game__hi");
  const msg = root.querySelector(".game__msg");

  /* ---------- sprite cache (one canvas per sprite per palette) ---------- */
  const cache = {};
  const sprite = (name, pal) => {
    const key = name + pal;
    if (cache[key]) return cache[key];
    const rows = SPRITES[name];
    const c = document.createElement("canvas");
    c.width = rows[0].length * P;
    c.height = rows.length * P;
    const g = c.getContext("2d");
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === ".") return;
        g.fillStyle = PALETTES[pal][ch];
        g.fillRect(x * P, y * P, P, P);
      })
    );
    return (cache[key] = c);
  };
  const size = (name) => ({ w: SPRITES[name][0].length * P, h: SPRITES[name].length * P });

  /* ---------- sizing: crisp pixels at 1× (phones) or 2× (desktop) ---------- */
  let W = 600;
  let scale = 1;
  let pace = 1; // narrower screens run a little slower, so reaction time feels the same
  const resize = () => {
    const cssW = root.clientWidth || 600;
    scale = cssW >= 760 ? 2 : 1;
    W = cssW / scale;
    pace = Math.max(0.72, Math.min(1, W / 560));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.style.height = H * scale + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(H * scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    draw();
  };

  /* ---------- state ---------- */
  let hi = 0;
  try { hi = +localStorage.getItem("soh-hi") || 0; } catch {}
  const st = {
    mode: "idle", // idle | run | over | paused
    speed: START_SPEED,
    dist: 0,
    score: 0,
    h: 0, vy: 0, air: 0, // Soh: height above ground, vertical speed, time in the air
    obstacles: [],
    clouds: [],
    specks: [],
    night: false,
    nextNight: NIGHT_EVERY,
    nightEnd: 0,
    crash: null,
    overAt: 0,
    t: 0,
  };
  let holding = false;
  let lastMilestone = 0;
  let visible = false;

  const pal = () => (st.night ? "night" : "day");
  const pad = (n) => String(Math.floor(n)).padStart(5, "0");
  const setMsg = (text) => { msg.textContent = text; msg.hidden = !text; };
  const updateHud = () => {
    hudScore.textContent = pad(st.score);
    hudHi.textContent = hi ? "HI " + pad(hi) : "";
  };

  // Nav/corners only go light while the night-time game is actually on screen
  const syncBody = () => document.body.classList.toggle("is-night", st.night && visible);
  const setNight = (on) => {
    if (st.night === on) return;
    st.night = on;
    section?.classList.toggle("is-night", on);
    syncBody();
  };

  const seedScenery = () => {
    st.clouds = Array.from({ length: 3 }, (_, i) => ({ x: (W / 3) * i + Math.random() * 80, y: 14 + Math.random() * 40 }));
    st.specks = Array.from({ length: Math.ceil(W / 18) }, () => ({ x: Math.random() * W, y: GROUND + 3 + Math.floor(Math.random() * 6), w: Math.random() < 0.3 ? 2 : 1 }));
  };

  const reset = () => {
    Object.assign(st, { speed: START_SPEED * pace, dist: 0, score: 0, h: 0, vy: 0, air: 0, obstacles: [], crash: null, nextNight: NIGHT_EVERY, nightEnd: 0 });
    lastMilestone = 0;
    setNight(false);
    updateHud();
  };

  /* ---------- obstacles ---------- */
  const spawn = () => {
    const r = Math.random();
    let o;
    if (st.score > 350 && r < 0.2) {
      const high = Math.random() < 0.45;
      o = { kind: "magpie", name: "magpieUp", y: high ? 38 : 6, extra: 50, flap: 0 };
    } else if (r < 0.62) {
      const pick = st.score < 150 ? (Math.random() < 0.6 ? "bottle" : "stubby") : ["bottle", "stubby", "bottles2", "bottles3"][Math.floor(Math.random() * 4)];
      o = { kind: "bottle", name: pick, y: 0, extra: 0 };
    } else {
      o = { kind: "bush", name: st.score > 200 && Math.random() < 0.5 ? "bushWide" : "bush", y: 0, extra: 0 };
    }
    // gap = clear space before the next obstacle (scales with speed; extra after a magpie)
    Object.assign(o, size(o.name), { x: W + 10, gap: st.speed * (0.55 + Math.random() * 0.6) + 50 + (o.kind === "magpie" ? 80 : 0) });
    st.obstacles.push(o);
  };

  /* ---------- controls ---------- */
  const jump = () => {
    if (st.h > 0) return;
    st.vy = JUMP_V;
    st.air = 0;
    st.h = 0.01;
  };
  const start = () => {
    reset();
    st.mode = "run";
    setMsg("");
    seedScenery();
    jump();
    wake();
  };
  const press = () => {
    holding = true;
    if (st.mode === "idle") start();
    else if (st.mode === "over" && performance.now() - st.overAt > 500) start();
    else if (st.mode === "paused") { st.mode = "run"; setMsg(""); wake(); }
    else if (st.mode === "run") jump();
  };
  const release = () => { holding = false; };

  root.addEventListener("pointerdown", (e) => { if (e.button === 0 || e.pointerType !== "mouse") press(); });
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);

  // Keyboard only once the game is mostly on screen, so normal page scrolling isn't hijacked
  let armed = false;
  const isKey = (e) => e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW";
  addEventListener("keydown", (e) => {
    if (!armed || !isKey(e)) return;
    e.preventDefault();
    if (!e.repeat) press();
  });
  addEventListener("keyup", (e) => { if (isKey(e)) release(); });

  const pause = () => {
    if (st.mode !== "run") return;
    st.mode = "paused";
    setMsg("Paused. Tap to carry on");
  };
  document.addEventListener("visibilitychange", () => document.hidden && pause());

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    armed = e.intersectionRatio >= 0.5;
    syncBody();
    if (!visible) pause();
    else wake();
  }, { threshold: [0, 0.5] }).observe(root);

  /* ---------- update ---------- */
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const crash = () => {
    st.mode = "over";
    st.overAt = performance.now();
    st.crash = { hx: SOH_X, hy: GROUND - st.h - 32, hvx: -40, hvy: -260, rot: 0, rotT: 0, bx: SOH_X, bvx: st.speed * 0.6 };
    if (st.score > hi) {
      hi = st.score;
      try { localStorage.setItem("soh-hi", String(hi)); } catch {}
    }
    updateHud();
    setMsg("Stacked it! Tap to go again");
  };

  const update = (dt) => {
    st.t += dt;
    const drift = st.mode === "run" ? st.speed : 30;

    // Scenery
    st.clouds.forEach((c) => {
      c.x -= drift * 0.12 * dt;
      if (c.x < -40) { c.x = W + Math.random() * 60; c.y = 14 + Math.random() * 40; }
    });
    if (st.mode === "run") {
      st.specks.forEach((s) => { s.x -= st.speed * dt; if (s.x < -2) s.x = W + Math.random() * 20; });
    }

    if (st.mode === "run") {
      st.speed = Math.min(MAX_SPEED * pace, st.speed + ACCEL * pace * dt);
      st.dist += st.speed * dt;
      st.score = st.dist / (8 * pace); // score keeps the same pace on every screen

      // Soh - hold to float a touch higher at the start of a jump
      if (st.h > 0) {
        st.air += dt;
        const g = holding && st.air < HOLD_TIME && st.vy > 0 ? GRAVITY * 0.45 : GRAVITY;
        st.vy -= g * dt;
        st.h += st.vy * dt;
        if (st.h <= 0) { st.h = 0; st.vy = 0; }
      }

      // Obstacles
      const last = st.obstacles[st.obstacles.length - 1];
      if (!last || last.x + last.w < W - last.gap) spawn();
      st.obstacles.forEach((o) => {
        o.x -= (st.speed + o.extra) * dt;
        if (o.kind === "magpie") {
          o.flap += dt;
          o.name = Math.floor(o.flap / 0.16) % 2 ? "magpieDown" : "magpieUp";
        }
      });
      st.obstacles = st.obstacles.filter((o) => o.x + o.w > -10);

      // Collisions (forgiving boxes)
      const soh = { x: SOH_X + 6, y: GROUND - st.h - 30, w: 20, h: 28 };
      for (const o of st.obstacles) {
        const box = { x: o.x + 3, y: GROUND - o.y - o.h + 3, w: o.w - 6, h: o.h - 5 };
        if (hit(soh, box)) { crash(); break; }
      }

      // Day / night
      if (!st.night && st.score >= st.nextNight) { setNight(true); st.nightEnd = st.score + NIGHT_LENGTH; st.nextNight += NIGHT_EVERY; }
      if (st.night && st.score >= st.nightEnd) setNight(false);

      // Milestone blink every 100
      const m = Math.floor(st.score / 100);
      if (m > lastMilestone) {
        lastMilestone = m;
        hudScore.classList.remove("is-flash");
        void hudScore.offsetWidth;
        hudScore.classList.add("is-flash");
      }
      hudScore.textContent = pad(st.score);
    }

    // Crash: head tumbles back, board rolls on
    if (st.mode === "over" && st.crash) {
      const c = st.crash;
      c.hvy += GRAVITY * 0.7 * dt;
      c.hx += c.hvx * dt;
      c.hy = Math.min(GROUND - 22, c.hy + c.hvy * dt);
      if (c.hy >= GROUND - 22) { c.hvy = 0; c.hvx *= 0.9; }
      c.rotT += dt;
      if (c.hvy !== 0 && c.rotT > 0.09) { c.rotT = 0; c.rot = (c.rot + 1) % 4; }
      c.bx += c.bvx * dt;
      c.bvx *= 0.985;
    }
  };

  /* ---------- draw ---------- */
  const draw = () => {
    const p = pal();
    ctx.clearRect(0, 0, W, H);

    st.clouds.forEach((c) => ctx.drawImage(sprite("cloud", p), Math.round(c.x), Math.round(c.y)));

    // Ground line + specks
    ctx.fillStyle = PALETTES[p].k;
    ctx.fillRect(0, GROUND, Math.ceil(W), 1);
    ctx.fillStyle = PALETTES[p].d;
    st.specks.forEach((s) => ctx.fillRect(Math.round(s.x), s.y, s.w, 1));

    st.obstacles.forEach((o) => ctx.drawImage(sprite(o.name, p), Math.round(o.x), Math.round(GROUND - o.y - o.h)));

    if (st.mode === "over" && st.crash) {
      const c = st.crash;
      const hd = sprite("head", p);
      ctx.save();
      ctx.translate(Math.round(c.hx + hd.width / 2), Math.round(c.hy + hd.height / 2));
      ctx.rotate((c.rot * Math.PI) / 2);
      ctx.drawImage(hd, -hd.width / 2, -hd.height / 2);
      ctx.restore();
      ctx.drawImage(sprite("board", p), Math.round(c.bx), GROUND - 4);
    } else {
      let name = "sleep";
      if (st.mode === "run" || st.mode === "paused") name = st.h > 0 ? "jump" : Math.floor(st.t / 0.1) % 2 ? "rideA" : "rideB";
      const s = sprite(name, p);
      ctx.drawImage(s, SOH_X, Math.round(GROUND - st.h - s.height + 1));

      // Napping z's before the first ride
      if (st.mode === "idle") {
        for (let i = 0; i < 3; i++) {
          const t = (st.t * 0.6 + i / 3) % 1;
          ctx.globalAlpha = t < 0.15 ? t / 0.15 : 1 - t;
          ctx.drawImage(sprite("z", p), Math.round(SOH_X + 30 + t * 10), Math.round(GROUND - 34 - t * 26));
        }
        ctx.globalAlpha = 1;
      }
    }
  };

  /* ---------- loop ---------- */
  let raf = 0;
  let last = performance.now();
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    update(dt);
    draw();
    if (st.mode !== "paused") wake();
  };
  function wake() {
    if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  new ResizeObserver(resize).observe(root);
  resize();
  seedScenery();
  updateHud();
  setMsg("Tap or press space to ride");
  wake();

  const api = { start, pause, state: st, press, release };
  root.sohGame = api; // handy for testing in the console
  return api;
}
