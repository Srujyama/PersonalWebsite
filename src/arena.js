// arena.js — a fly in an open arena, drawn in text, scored like the real ones.
//
// The Drosophila work measured how much a fly avoids the middle of an open
// arena. This is that assay with a simulated fly: a correlated random walk
// that follows the wall once it finds it, pauses now and then the way flies
// do, and every so often cuts across. The readout underneath is the number
// the study was built on, the share of time spent in the centre, counting up
// live. It is characters in a <pre>, so it sits in the page's own type and
// the load-in's dots land on it like on everything else.

const COLS = 35;
const ROWS = 20; // 20 rows at 12px is 240px, twelve of the page's 20px lines
const CW = 7.2; // a JetBrains Mono cell at 12px is 0.6em wide
const CH = 12;
const CX = ((COLS - 1) / 2) * CW;
const CY = ((ROWS - 1) / 2) * CH;
const R = Math.min(CX, CY); // arena radius, px
const WALL = R - 9; // how close the fly's centre gets to the wall
const INNER = R * 0.5; // "the centre", as the assay defines it
const STEP = 1 / 60; // fixed simulation step, s
const TRAIL_EVERY = 0.07; // s between trail samples
const TRAIL = 70; // samples kept, so about five seconds of path

// Seeded, so the drawing that ships in the HTML and the first frame the
// script draws are the same picture.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function createFly(seed = 7) {
  const rand = rng(seed);
  const gauss = () =>
    Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(TAU * rand());
  const a0 = rand() * TAU;
  const s = {
    x: Math.cos(a0) * WALL * 0.9,
    y: Math.sin(a0) * WALL * 0.9,
    h: a0 + Math.PI / 2, // heading
    v: 0,
    walking: true,
    bout: 2 + rand() * 3, // seconds left in this walk or pause
    crossing: 0, // seconds left of a deliberate cut across the middle
    t: 0,
    inCentre: 0,
    trail: [],
    sinceTrail: 0,
  };

  function step(dt) {
    s.t += dt;
    s.bout -= dt;
    if (s.bout <= 0) {
      // Flies walk in bouts and stop between them.
      s.walking = !s.walking;
      s.bout = s.walking ? 1.5 + rand() * 4 : 0.3 + rand() * 1.4;
    }
    const target = s.walking ? 34 + 10 * Math.sin(s.t * 0.7) : 0;
    s.v += (target - s.v) * Math.min(1, dt * 5);

    const r = Math.hypot(s.x, s.y);
    const out = Math.atan2(s.y, s.x);
    s.h += gauss() * 1.6 * Math.sqrt(dt);

    if (s.crossing > 0) {
      s.crossing -= dt;
    } else if (r > WALL - 10) {
      // Thigmotaxis: at the wall, turn along it, whichever way is closer.
      const t1 = out + Math.PI / 2;
      const t2 = out - Math.PI / 2;
      const want =
        Math.abs(wrap(t1 - s.h)) < Math.abs(wrap(t2 - s.h)) ? t1 : t2;
      s.h += wrap(want - s.h) * Math.min(1, dt * 4);
      // Now and then it leaves the wall and cuts across.
      if (s.walking && rand() < dt * 0.05) {
        s.h = out + Math.PI + (rand() - 0.5) * 1.1;
        s.crossing = 2.6;
      }
    } else {
      // Anywhere off the wall it drifts back out toward it, hardest in the
      // middle, which is the whole behaviour the assay scores.
      const pull = r < INNER ? 0.5 : 0.3;
      s.h += wrap(out - s.h) * Math.min(1, dt * pull);
    }

    let nx = s.x + Math.cos(s.h) * s.v * dt;
    let ny = s.y + Math.sin(s.h) * s.v * dt;
    const nr = Math.hypot(nx, ny);
    if (nr > WALL) {
      nx *= WALL / nr;
      ny *= WALL / nr;
    }
    s.x = nx;
    s.y = ny;
    if (Math.hypot(s.x, s.y) < INNER) s.inCentre += dt;

    s.sinceTrail += dt;
    if (s.sinceTrail >= TRAIL_EVERY) {
      s.sinceTrail = 0;
      s.trail.push([s.x, s.y]);
      if (s.trail.length > TRAIL) s.trail.shift();
    }
  }

  return { state: s, step };
}

const cell = (x, y) => [Math.round((CX + x) / CW), Math.round((CY + y) / CH)];

// The arena itself never changes, so its cells are worked out once.
const RING = (() => {
  const g = new Map();
  for (let a = 0; a < TAU; a += 0.004) {
    const [c, r] = cell(Math.cos(a) * R, Math.sin(a) * R);
    g.set(r * COLS + c, "ring");
  }
  // The centre zone, dotted sparsely so it reads as a region, not a wall.
  for (let a = 0; a < TAU; a += TAU / 28) {
    const [c, r] = cell(Math.cos(a) * INNER, Math.sin(a) * INNER);
    if (!g.has(r * COLS + c)) g.set(r * COLS + c, "zone");
  }
  return g;
})();

// The path fades with age in three steps: ink, grey, and the wall's own grey.
const GLYPH = { ring: "·", zone: "·", old: "·", mid: "·", new: "·", fly: "•" };

export function render(s) {
  const grid = new Array(COLS * ROWS).fill(null);
  for (const [k, cls] of RING) grid[k] = cls;
  const n = s.trail.length;
  for (let i = 0; i < n; i++) {
    const [c, r] = cell(s.trail[i][0], s.trail[i][1]);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
    grid[r * COLS + c] = i > n * 0.7 ? "new" : i > n * 0.35 ? "mid" : "old";
  }
  const [fc, fr] = cell(s.x, s.y);
  grid[fr * COLS + fc] = "fly";

  let html = "";
  for (let r = 0; r < ROWS; r++) {
    let run = null;
    let buf = "";
    const flush = () => {
      if (!buf) return;
      html += run ? `<span class="a-${run}">${buf}</span>` : buf;
      buf = "";
    };
    for (let c = 0; c < COLS; c++) {
      const cls = grid[r * COLS + c];
      if (cls !== run) {
        flush();
        run = cls;
      }
      buf += cls ? GLYPH[cls] : " ";
    }
    flush();
    html += r < ROWS - 1 ? "\n" : "";
  }
  return html;
}

export function readout(s) {
  const t = Math.floor(s.t);
  const clock = `t ${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  const pct = s.t > 0 ? Math.round((100 * s.inCentre) / s.t) : 0;
  const right = `time in centre ${String(pct).padStart(2, " ")}%`;
  return clock + " ".repeat(Math.max(1, COLS - clock.length - right.length)) + right;
}

// The page opens partway into a session, so the fly has already left a path
// and the score has settled, rather than a dot on a blank ring reading 100%
// because its first second happened to be in the middle.
export const WARMUP = 90;

function mount() {
  const fig = document.querySelector(".arena");
  const pre = fig && fig.querySelector("pre");
  const out = fig && fig.querySelector(".arena-readout");
  if (!pre || !out) return;

  const fly = createFly();
  for (let t = 0; t < WARMUP; t += STEP) fly.step(STEP);
  const s = fly.state;

  let lastHtml = "";
  let lastOut = "";
  const draw = () => {
    const html = render(s);
    if (html !== lastHtml) pre.innerHTML = lastHtml = html;
    const o = readout(s);
    if (o !== lastOut) out.textContent = lastOut = o;
  };
  draw();

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Hold still while the load-in is landing its dots on this drawing: the
  // glyphs it measured have to still be there when the page fades up.
  const root = document.documentElement;
  let started = !root.classList.contains("intro");
  let raf = 0;
  let prev = 0;
  let acc = 0;
  let visible = true;
  const frame = (now) => {
    raf = 0;
    if (prev) acc += Math.min(0.1, (now - prev) / 1000);
    prev = now;
    while (acc >= STEP) {
      fly.step(STEP);
      acc -= STEP;
    }
    draw();
    schedule();
  };
  const schedule = () => {
    if (!raf && visible && !document.hidden && started) {
      raf = requestAnimationFrame(frame);
    }
  };
  const pause = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    prev = 0;
  };

  // Only run while it can be seen.
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) schedule();
    else pause();
  }).observe(fig);
  document.addEventListener("visibilitychange", () =>
    document.hidden ? pause() : schedule(),
  );

  if (!started) {
    const go = () => {
      if (started) return;
      started = true;
      mo.disconnect();
      schedule();
    };
    const mo = new MutationObserver(() => {
      if (!root.classList.contains("intro")) go();
    });
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    // If the load-in never ran, its class is never removed; start anyway.
    setTimeout(go, 12000);
  }
  schedule();
}

if (typeof document !== "undefined") mount();
