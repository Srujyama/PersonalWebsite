// intro.js — the Cal load-in, and the handoff into the page.
//
// Dots scatter in over blank paper, assemble into the stippled Cal outline,
// hold, and then fly onto the letters of the page itself. Every glyph on
// screen is drawn into an offscreen canvas, its ink pixels become the landing
// spots, and once the dots have settled into a stippled copy of the words the
// real text fades up underneath them while they fade out. The intro's last
// frame is the page's first: nothing is ever swapped for something else.
//
// That only works because <main> is laid out the whole time. index.html's
// <head> hides it with opacity (never display), locks scroll, and starts the
// dot fetch before this module has even loaded, so the glyph rects the dots
// aim for are the real ones and the page underneath is already final.
import "./intro.css";

const ASSEMBLE = 2.2;
const HOLD = 0.9;
const SETTLE = 2.6;
// The settle is three beats inside one phase: every dot arrives by ARRIVE,
// the finished dot-text holds until HOLD_OUT, then it crossfades into the real
// text. Fading each dot on its own progress (an earlier version) meant the far
// ones were still half-way and half-transparent when the near ones were done,
// so the drawing never actually existed; you only ever saw a smear.
const ARRIVE = 0.6;
const HOLD_OUT = 0.72;
// Fonts have to be in before the glyphs can be measured. The hold stretches by
// up to this long waiting for them, then gives up and blows the dots away.
const HOLD_MAX = 1.5;
// A load screen that starts this late is a toll, not a welcome.
const DATA_WAIT = 2500;
// A landed dot is about as wide as a 12px glyph's stroke. At stipple size the
// dot-text is a black crust over the words rather than a drawing of them.
const LAND_R = 0.6;
// Glyphs are rasterised at 2x whatever the screen is, so landing spots have
// sub-pixel precision on 1x displays too.
const SAMPLE_SCALE = 2;
const MOBILE_CAP = 5000;
// How many dots the text gets. One stipple dot holds the ink of about forty
// landed ones, and the outline's dots alone cover barely a third of the
// glyphs on a desktop (a fifth on a phone, where the outline is capped at
// MOBILE_CAP), so the dot-text read as a faint grey rumour of the words. At
// the settle each dot splits into as many as the ink on screen needs, a
// little over one per stroke-width disc of ink because random spots overlap.
// The children leave from exactly where their parent sits, so the split is
// invisible until they fan out. The caps keep the frame cheap; by the time
// they are many, the dots are small enough to draw as squares, not arcs.
const DENSITY = 1.3; // landed-dot ink per glyph ink, before overlap
const LANDED_CAP = 28000;
const LANDED_CAP_MOBILE = 16000;
const CHUNK = 1024; // dots per path, see paint()
const TAU = Math.PI * 2;

// The theme is settled before this runs (the <head> script sets data-theme
// from the visitor's clock or their saved choice); the OS setting is only the
// fallback for a page without it.
const DARK = document.documentElement.dataset.theme
  ? document.documentElement.dataset.theme === "dark"
  : matchMedia("(prefers-color-scheme: dark)").matches;
const INK = DARK
  ? [242, 241, 237] // #f2f1ed
  : [18, 18, 17]; // #121211

const root = document.documentElement;
const main = document.querySelector("main");

if (root.classList.contains("intro")) {
  // The head's CSS failsafe shows the page at 4s if this module never runs.
  // If it has already fired (a very slow load), the page is on screen and
  // starting now would hide it again, so step aside.
  if (!main || getComputedStyle(main).opacity !== "0") {
    root.classList.remove("intro");
  } else {
    run();
  }
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeInCubic = (t) => t * t * t;

function run() {
  root.classList.add("intro-live"); // cancels the failsafe, locks scroll

  const overlay = document.createElement("div");
  overlay.className = "intro-overlay";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  overlay.append(canvas);
  // First in the document, so [skip] is the first thing a keyboard or screen
  // reader reaches rather than the last.
  document.body.prepend(overlay);
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let dpr = 1;
  let phase = "loading"; // loading → assembling → holding → settling → done
  let t = 0; // seconds into the current phase
  let last = performance.now();
  let raf = 0;
  let dots = [];
  let aspect = 1;
  // Dots are drawn grouped by colour. Until the settle there is one colour;
  // after it each dot carries the colour of the text it lands on, and dots
  // are sorted so each colour is one contiguous range.
  let colours = [INK];
  let ranges = [[0, 0]];
  let alpha = 1; // the dot layer's opacity
  let mainOpacity = 0;
  let landed = false; // settling onto text (true) or blowing away (false)
  let targets = null; // null → "pending" → {…} | false
  let generation = 0; // bumps when a reflow makes pending targets stale
  let scroll0 = 0;
  let leaving = null; // a skip in progress: {t, dur, a0, m0}
  let skip = null;
  let isMobile = false;

  measure();

  const source =
    window.__introDots ||
    fetch("/stipple_data.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  const late = setTimeout(() => phase === "loading" && finish(300), DATA_WAIT);
  source.then((data) => {
    clearTimeout(late);
    if (phase !== "loading" || leaving) return;
    let ok = false;
    try {
      ok = init(data);
    } catch (err) {
      console.error(err);
    }
    if (!ok) finish(300);
  });

  const skipTimer = setTimeout(showSkip, 1800);
  overlay.addEventListener("click", () => finish());
  window.addEventListener("keydown", onKey);
  // Watch the overlay itself rather than the window: its size can change with
  // no resize event at all, when a stylesheet lands after the first measure.
  const ro = window.ResizeObserver ? new ResizeObserver(() => onResize()) : null;
  if (ro) ro.observe(overlay);
  else window.addEventListener("resize", onResize);
  // A page frozen mid-intro in the back/forward cache would come back as a
  // stalled overlay. Leave on the page instead.
  window.addEventListener("pagehide", cleanup);

  raf = requestAnimationFrame(frame);

  function measure() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = overlay.getBoundingClientRect();
    w = r.width || window.innerWidth;
    h = r.height || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function init(data) {
    if (!data) return false;
    const raw0 = data.d || data.dots;
    const iw = data.w || data.width;
    const ih = data.h || data.height;
    if (!Array.isArray(raw0) || !raw0.length || !(iw > 0) || !(ih > 0)) {
      return false;
    }
    aspect = iw / ih;

    isMobile = window.innerWidth < 768;
    let raw = raw0;
    if (isMobile && raw.length > MOBILE_CAP) {
      const step = Math.ceil(raw.length / MOBILE_CAP);
      raw = raw.filter((_, i) => i % step === 0);
    }
    const size = isMobile ? 0.7 * 1.8 : 2.2;
    const spread = Math.max(w, h) * 0.6;

    dots = raw.map((d) => {
      const [nx, ny, r] = Array.isArray(d) ? d : [d.x, d.y, d.r];
      const a = Math.random() * TAU;
      const dist = 200 + Math.random() * spread;
      const sx = w / 2 + Math.cos(a) * dist;
      const sy = h / 2 + Math.sin(a) * dist;
      return {
        nx, ny, sx, sy,
        tx: 0, ty: 0, // on the Cal outline, set by layout()
        x: sx, y: sy,
        gx: 0, gy: 0, g: 0, // landing spot and colour, set at the settle
        r: r * size,
        rc: r * size, // current radius during the settle
        stagger: Math.hypot(nx - 0.5, ny - 0.5) * 0.4 + Math.random() * 0.15,
        delay: 0,
        span: 1,
        lt: 0, // progress of its own flight, 0 until it leaves
        p: null, // the dot it split from, if it is a child
      };
    });
    ranges = [[0, dots.length]];
    layout();
    phase = "assembling";
    t = 0;
    return true;
  }

  // Where the Cal outline sits for the current viewport.
  function layout() {
    const small = w < 768;
    const max = small ? Math.min(w * 0.75, h * 0.55) : Math.min(w * 0.45, h * 0.6);
    const iw = aspect >= 1 ? max : max * aspect;
    const ih = aspect >= 1 ? max / aspect : max;
    const ox = (w - iw) / 2;
    const oy = (h - ih) / 2;
    for (const d of dots) {
      d.tx = ox + d.nx * iw;
      d.ty = oy + d.ny * ih;
      if (phase === "holding") {
        d.x = d.tx;
        d.y = d.ty;
      }
    }
  }

  function onResize() {
    const oldW = w;
    measure();
    const reflowed = Math.abs(w - oldW) > 0.5;
    if (phase === "settling") {
      // The text is anchored to the top of the page, so only a width change
      // moves it. If it does, the dots are aiming at glyphs that are no longer
      // there; bow out rather than land them in the wrong place.
      if (landed && reflowed) finish(200);
      return;
    }
    if (dots.length) layout();
    if (reflowed) {
      targets = null;
      generation++;
    }
  }

  function onKey(e) {
    // Tab skips too. The page's links sit under the overlay, invisible, and
    // the first Tab would otherwise put focus on one of them; skipping lets
    // focus move while the page fades up around it.
    if (e.key === "Tab") return finish();
    if (e.key === "Escape" || e.key === "Enter") {
      // Enter must not also follow a link nobody can see yet.
      if (e.key === "Enter" && main.contains(document.activeElement)) {
        e.preventDefault();
      }
      finish();
    }
  }

  function showSkip() {
    if (phase === "done" || phase === "settling" || leaving) return;
    skip = document.createElement("button");
    skip.type = "button";
    skip.className = "intro-skip";
    skip.textContent = "[skip]";
    skip.setAttribute("aria-label", "Skip intro");
    skip.addEventListener("click", (e) => {
      e.stopPropagation();
      finish();
    });
    overlay.append(skip);
    skip.getBoundingClientRect(); // commit opacity 0 so the fade-in runs
    skip.classList.add("is-on");
  }

  // Once the dots head for the text the page's own bottom-left corner is
  // filling with words, and a control sitting on top of them would be the one
  // thing in the last frame that is not the page.
  function hideSkip() {
    clearTimeout(skipTimer);
    if (skip) {
      skip.classList.remove("is-on");
      skip.disabled = true;
    }
  }

  function requestTargets() {
    targets = "pending";
    const mine = ++generation;
    // The glyphs have to be measured in their final font, at their final
    // size. WebKit can run this module before site.css has applied, and until
    // it has, no web font is even requested, so fonts.ready means nothing
    // yet. Wait for the stylesheets first, force a style pass so the fonts
    // they name start loading, and only then wait for the fonts.
    const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .filter((l) => !l.sheet)
      .map(
        (l) =>
          new Promise((r) => {
            l.addEventListener("load", r, { once: true });
            l.addEventListener("error", r, { once: true });
          }),
      );
    const fonts = Promise.all(sheets).then(() => {
      void main.offsetHeight;
      return document.fonts ? document.fonts.ready : null;
    });
    fonts.then(() => {
      if (mine !== generation || phase === "done") return;
      try {
        const cap = isMobile ? LANDED_CAP_MOBILE : LANDED_CAP;
        targets = sampleText(dots.length, cap, w, h) || false;
      } catch (err) {
        console.error(err);
        targets = false;
      }
    });
  }

  function beginSettle() {
    landed = !!(targets && targets.n) && assign(targets);
    if (!landed) scatter();
    phase = "settling";
    t = 0;
    hideSkip();
  }

  /* Pair every dot with a landing spot.

     Both sets are cut into the same number of horizontal bands by rank, and
     each band is ordered left to right, so the k-th dot of the outline goes to
     the k-th spot of the text in reading order. Neighbouring dots get
     neighbouring spots, which makes the swarm move as one sheet: the top of
     the outline pours into the header, the bottom into the last lines on
     screen, and nothing crosses anything else on the way. Sorting both by
     angle around a centre (what the relief handoff did) only keeps one of the
     two axes in order, and with the text sitting top-left the other axis turns
     into dots flying through each other. */
  function assign(T) {
    // Split to one dot per landing spot. Children are handed out round-robin,
    // so every parent gets the same number give or take one.
    const parents = dots.length;
    for (let j = 0; dots.length < T.n; j++) {
      const p = dots[j % parents];
      dots.push({ ...p, p });
    }
    const n = T.n;
    const dx = new Float32Array(n);
    const dy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      dx[i] = dots[i].tx;
      dy[i] = dots[i].ty;
    }
    const from = bandOrder(dx, dy);
    const to = bandOrder(T.x, T.y);
    const far = Math.max(w, h);
    for (let k = 0; k < n; k++) {
      const d = dots[from[k]];
      const j = to[k];
      d.gx = T.x[j];
      d.gy = T.y[j];
      d.g = T.g[j];
      // Dots with the furthest to go leave FIRST, so everything lands at
      // roughly the same moment. Delaying the long trips (the obvious way
      // round) is what left dense clumps still in transit at the end. Delay
      // plus span stays under ARRIVE so every dot is down before the hold.
      const travel = Math.min(1, Math.hypot(d.gx - d.tx, d.gy - d.ty) / far);
      d.delay = (1 - travel) * 0.16 + Math.random() * 0.03;
      d.span = Math.max(0.18, ARRIVE - d.delay);
    }

    colours = T.colours;
    dots.sort((a, b) => a.g - b.g);
    ranges = colours.map(() => [0, 0]);
    for (let i = 0; i < n; i++) {
      const g = dots[i].g;
      if (i === 0 || dots[i - 1].g !== g) ranges[g][0] = i;
      ranges[g][1] = i + 1;
    }
    scroll0 = T.scrollY;
    return true;
  }

  // Nothing to land on (no text on screen, fonts never came). The old exit:
  // blow the dots outward and let the page come up behind them.
  function scatter() {
    for (const d of dots) {
      const a =
        Math.atan2(d.ty - h / 2, d.tx - w / 2) + (Math.random() - 0.5) * 1.2;
      const dist = 300 + Math.random() * Math.max(w, h) * 0.8;
      d.gx = d.tx + Math.cos(a) * dist;
      d.gy = d.ty + Math.sin(a) * dist;
      d.delay = Math.random() * 0.25;
      d.span = 0.7;
    }
  }

  function step(dt) {
    t += dt;

    if (phase === "assembling") {
      for (const d of dots) {
        const lt = clamp01((t - d.stagger * ASSEMBLE * 0.5) / (ASSEMBLE * 0.7));
        const e = easeOutQuart(lt);
        d.x = d.sx + (d.tx - d.sx) * e;
        d.y = d.sy + (d.ty - d.sy) * e;
      }
      if (t >= ASSEMBLE) {
        for (const d of dots) {
          d.x = d.tx;
          d.y = d.ty;
        }
        phase = "holding";
        t = 0;
      }
    } else if (phase === "holding") {
      // The glyphs are measured, and the dots paired up, while the outline
      // sits still: those are the two frames that cost tens of milliseconds,
      // and a dropped frame where nothing moves is a frame nobody sees.
      if (!leaving) {
        if (targets === null) requestTargets();
        const ready = targets !== null && targets !== "pending";
        if (t >= HOLD && (ready || t >= HOLD + HOLD_MAX)) beginSettle();
      }
    } else if (phase === "settling") {
      const p = t / SETTLE;
      if (landed) {
        // Scroll is locked, but a restored scroll position can still land
        // after the glyphs were measured. Follow the text if it moves.
        const shift = scroll0 - window.scrollY;
        for (const d of dots) {
          const lt = (d.lt = clamp01((p - d.delay) / d.span));
          const e = easeInOutCubic(lt);
          d.x = d.tx + (d.gx - d.tx) * e;
          d.y = d.ty + (d.gy + shift - d.ty) * e;
          // Shrink on the way, front-loaded: the outline breaks into grain
          // as it lifts off and streams in fine. Shrinking in step with the
          // motion kept every dot at full stipple size through the middle of
          // the flight, and twenty thousand of those are a black slab.
          const k = 1 - lt;
          d.rc = LAND_R + (d.r - LAND_R) * k * k;
        }
        // One fade for the whole layer, after the text has formed and held,
        // mirrored by the page fading up underneath, linear on both sides so
        // the ink on screen never dips or doubles. See paint() for why it is
        // a true layer fade.
        const out = clamp01((p - HOLD_OUT) / (1 - HOLD_OUT));
        alpha = 1 - out;
        setMain(out);
      } else {
        for (const d of dots) {
          const e = easeInCubic(clamp01((p - d.delay) / d.span));
          d.x = d.tx + (d.gx - d.tx) * e;
          d.y = d.ty + (d.gy - d.ty) * e;
        }
        alpha = 1 - easeInCubic(clamp01(p));
        setMain(clamp01(p));
      }
      if (p >= 1) {
        cleanup();
        return;
      }
    }

    if (leaving) {
      leaving.t += dt;
      const k = clamp01(leaving.t / leaving.dur);
      alpha = Math.min(alpha, leaving.a0 * (1 - k));
      setMain(Math.max(mainOpacity, leaving.m0 + (1 - leaving.m0) * k));
      if (k >= 1) cleanup();
    }
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // The layer's opacity is the canvas element's, not globalAlpha. Overlapping
    // dots drawn at partial alpha stack into a dark crust exactly where they
    // are densest (the old code had to ramp its alpha down to 0.62 through the
    // flight to hide it); drawn opaque and faded as one layer, a thousand
    // dots on one stroke fade exactly like one.
    const o = alpha > 0.004 ? alpha.toFixed(3) : "0";
    if (o !== canvas.style.opacity) canvas.style.opacity = o;
    if (o === "0" || !dots.length) return;

    const onText = phase === "settling" && landed;
    // Dots bound for grey text (dates, the ## marks) take the grey as they
    // come in to land, not at lift-off, where a grey streak through a black
    // swarm reads as a mistake.
    const mix = onText ? easeInOutCubic(clamp01(t / SETTLE / ARRIVE)) : 0;
    for (let g = 0; g < ranges.length; g++) {
      const [s, e] = ranges[g];
      if (s >= e) continue;
      const c = colours[g];
      ctx.fillStyle = `rgb(${INK[0] + (c[0] - INK[0]) * mix},${
        INK[1] + (c[1] - INK[1]) * mix
      },${INK[2] + (c[2] - INK[2]) * mix})`;
      // A few long paths rather than a fill call per dot, which is what makes
      // a phone drop frames with twenty thousand of them. Not one path either:
      // the rasteriser untangles overlapping contours per path, and a path in
      // which thousands of discs sit exactly on top of each other (children
      // that have not left their parent yet) once took a whole second to fill.
      // The layer is opaque, so where the chunks overlap does not show.
      let k = 0;
      ctx.beginPath();
      for (let i = s; i < e; i++) {
        const d = dots[i];
        // Not yet left its parent: it is exactly under it, so skip it.
        if (d.p && onText && d.lt === 0 && d.p.lt === 0) continue;
        const r = onText ? d.rc : d.r;
        if (d.x < -r || d.x > w + r || d.y < -r || d.y > h + r) continue;
        if (++k === CHUNK) {
          ctx.fill();
          ctx.beginPath();
          k = 0;
        }
        if (r < 1) {
          // Below a pixel an arc and a square of the same area rasterise to
          // the same smudge, and the square is four points instead of a curve.
          const q = r * 1.772; // √π · r: same ink as the disc
          ctx.rect(d.x - q / 2, d.y - q / 2, q, q);
        } else {
          ctx.moveTo(d.x + r, d.y);
          ctx.arc(d.x, d.y, r, 0, TAU);
        }
      }
      ctx.fill();
    }
  }

  function frame(now) {
    if (phase === "done") return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    try {
      step(dt);
      if (phase !== "done") paint();
    } catch (err) {
      // Never hold the page hostage to a bug in its decoration.
      cleanup();
      console.error(err);
      return;
    }
    if (phase !== "done") raf = requestAnimationFrame(frame);
  }

  function setMain(o) {
    if (o === mainOpacity) return;
    mainOpacity = o;
    main.style.opacity = o.toFixed(3);
  }

  // Skip: whatever the dots are doing, they fade out where they are while the
  // page fades in under them.
  function finish(dur = 450) {
    if (phase === "done" || leaving) return;
    hideSkip();
    leaving = { t: 0, dur: dur / 1000, a0: alpha, m0: mainOpacity };
    // rAF stops in a background tab; the page must still end up visible.
    setTimeout(cleanup, dur + 600);
  }

  function cleanup() {
    if (phase === "done") return;
    phase = "done";
    cancelAnimationFrame(raf);
    clearTimeout(late);
    clearTimeout(skipTimer);
    window.removeEventListener("keydown", onKey);
    if (ro) ro.disconnect();
    else window.removeEventListener("resize", onResize);
    window.removeEventListener("pagehide", cleanup);
    overlay.remove();
    main.style.removeProperty("opacity");
    if (!main.getAttribute("style")) main.removeAttribute("style");
    root.classList.remove("intro", "intro-live");
    delete window.__introDots;
  }
}

/* Rank-band order: indices sorted into ~√n horizontal bands by y, each band
   sorted by x. See assign(). */
function bandOrder(xs, ys) {
  const n = xs.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => ys[a] - ys[b]);
  const bands = Math.max(1, Math.round(Math.sqrt(n)));
  for (let b = 0; b < bands; b++) {
    const s = Math.floor((b * n) / bands);
    const e = Math.floor(((b + 1) * n) / bands);
    const band = idx.slice(s, e).sort((a, c) => xs[a] - xs[c]);
    for (let i = s; i < e; i++) idx[i] = band[i - s];
  }
  return idx;
}

/* Draw the page's visible text into an offscreen canvas and return landing
   spots on its ink (at least n, up to cap, as many as the ink wants), each
   tagged with the colour of the text it belongs to.

   Nothing here re-implements layout. Every character's box comes from a Range
   over the real laid-out text, and the glyph is drawn into that box in the
   element's own computed font, so the canvas copy lines up with the page to
   the pixel. The baseline is the box top plus the font's ascent, which is how
   the box was built in the first place. Three things the text nodes alone do
   not carry are added back by hand: text-transform (the headings are
   lowercase in the source), ::before/::after content (the ## and - marks),
   and link underlines, which Chrome draws at baseline + text-underline-offset
   and breaks around descenders.

   Colour is carried in the red channel as a group index (1 → 28, 2 → 56, …)
   rather than as the real colour, so reading a pixel back says exactly which
   text it came from however the edges were antialiased. */
function sampleText(n, cap, vw, vh) {
  const main = document.querySelector("main");
  if (!main || !n) return null;
  const S = SAMPLE_SCALE;
  const CODE = 28;
  const probe = document.createElement("canvas").getContext("2d");
  const range = document.createRange();

  const colours = [];
  const colourIndex = new Map();
  const groupOf = (css) => {
    let g = colourIndex.get(css);
    if (g !== undefined) return g;
    const rgb = (css.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const c = rgb.length === 3 ? rgb : INK;
    if (colours.length < 8) {
      g = colours.push(c) - 1;
    } else {
      // More than eight text colours: fold the rest into the nearest one.
      let best = Infinity;
      colours.forEach((o, i) => {
        const dd = (o[0] - c[0]) ** 2 + (o[1] - c[1]) ** 2 + (o[2] - c[2]) ** 2;
        if (dd < best) {
          best = dd;
          g = i;
        }
      });
    }
    colourIndex.set(css, g);
    return g;
  };

  const underlines = new Map();
  const underlineOf = (el) => {
    if (underlines.has(el)) return underlines.get(el);
    let u = null;
    for (let a = el; a && a !== main.parentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (/underline/.test(cs.textDecorationLine)) {
        u = {
          g: groupOf(cs.textDecorationColor || cs.color),
          thick: parseFloat(cs.textDecorationThickness) || 1,
          off: parseFloat(cs.textUnderlineOffset),
          size: parseFloat(cs.fontSize) || 12,
        };
        if (!(u.off >= 0 || u.off < 0)) u.off = u.size * 0.12; // "auto"
        break;
      }
    }
    underlines.set(el, u);
    return u;
  };

  const styles = new Map();
  const styleOf = (el, pseudo) => {
    const key = pseudo ? null : el;
    if (key && styles.has(key)) return styles.get(key);
    const cs = getComputedStyle(el, pseudo);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    probe.font = font;
    const m = probe.measureText("x");
    const st = {
      font,
      hidden: cs.visibility !== "visible",
      g: groupOf(cs.color),
      ascent: m.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * 0.95,
      transform: cs.textTransform,
      ul: pseudo ? null : underlineOf(el),
    };
    if (key) styles.set(key, st);
    return st;
  };

  const onScreen = (r) =>
    r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  const isSpace = (c) => c <= 32 || c === 160 || (c >= 0x2000 && c <= 0x200b);
  const cased = (s, tt) =>
    tt === "uppercase" ? s.toUpperCase() : tt === "lowercase" ? s.toLowerCase() : s;

  const glyphs = []; // [text, x, baseline, style]
  const rules = []; // underline rects: [x, y, width, thickness, group]
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const grow = (l, tp, r, b) => {
    x0 = Math.min(x0, l);
    y0 = Math.min(y0, tp);
    x1 = Math.max(x1, r);
    y1 = Math.max(y1, b);
  };

  // Every visible character, in its real box.
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.data;
    if (!/\S/.test(text) || !node.parentElement) continue;
    range.selectNodeContents(node);
    if (!onScreen(range.getBoundingClientRect())) continue;
    const st = styleOf(node.parentElement);
    if (st.hidden) continue;
    for (let i = 0; i < text.length; ) {
      const c = text.codePointAt(i);
      const len = c > 0xffff ? 2 : 1;
      if (!isSpace(c)) {
        range.setStart(node, i);
        range.setEnd(node, i + len);
        const r = range.getBoundingClientRect();
        if (r.width > 0 && onScreen(r)) {
          glyphs.push([cased(text.slice(i, i + len), st.transform), r.left, r.top + st.ascent, st]);
          grow(r.left - 2, r.top - 2, r.right + 2, r.bottom + 2);
        }
      }
      i += len;
    }
    if (st.ul) {
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width < 0.5 || !onScreen(r)) continue;
        const y = r.top + st.ascent + st.ul.off;
        rules.push([r.left, y, r.width, st.ul.thick, st.ul.g]);
        grow(r.left - 2, y - 2, r.right + 2, y + st.ul.thick + 2);
      }
    }
  }

  // Generated content (the ## before headings, the - before list items).
  // It has no text node to take a Range over, but it sits flush against the
  // element's first character (or after its last), so it can be placed from
  // that character's box and its own measured width.
  const edgeRect = (el, first) => {
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let hit = null;
    for (let nd = tw.nextNode(); nd; nd = tw.nextNode()) {
      const s = nd.data;
      for (let i = 0; i < s.length; i++) {
        if (isSpace(s.charCodeAt(i))) continue;
        if (!first) hit = [nd, i];
        else {
          hit = [nd, i];
          break;
        }
      }
      if (first && hit) break;
    }
    if (!hit) return null;
    range.setStart(hit[0], hit[1]);
    range.setEnd(hit[0], hit[1] + 1);
    return range.getBoundingClientRect();
  };
  for (const el of main.querySelectorAll("*")) {
    for (const pseudo of ["::before", "::after"]) {
      const cs = getComputedStyle(el, pseudo);
      const m = /^"((?:[^"\\]|\\.)*)"/.exec(cs.content || "");
      if (!m || cs.display === "none" || cs.visibility !== "visible") continue;
      const str = m[1].replace(/\\(.)/g, "$1");
      if (!/\S/.test(str)) continue;
      const anchor = edgeRect(el, pseudo === "::before");
      if (!anchor || !onScreen(anchor)) continue;
      const st = styleOf(el, pseudo);
      probe.font = st.font;
      const text = cased(str, st.transform);
      const width = probe.measureText(text).width;
      const x = pseudo === "::before" ? anchor.left - width : anchor.right;
      glyphs.push([text, x, anchor.top + st.ascent, st]);
      grow(x - 2, anchor.top - 2, x + width + 2, anchor.bottom + 2);
    }
  }

  // The contact marks are inline SVG, not text, and would otherwise be the
  // one thing on screen the dots never drew. Their paths go through Path2D,
  // which takes SVG path data as is, so this stays synchronous.
  const icons = [];
  for (const svg of main.querySelectorAll("svg.icon")) {
    const r = svg.getBoundingClientRect();
    if (!(r.width > 0) || !onScreen(r)) continue;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const k = r.width / ((vb && vb.width) || 24);
    const cs = getComputedStyle(svg);
    const line = cs.fill === "none";
    const paths = [...svg.querySelectorAll("path")].map((pa) => pa.getAttribute("d"));
    icons.push({ r, k, line, width: parseFloat(cs.strokeWidth) || 2, g: groupOf(cs.color), paths });
    grow(r.left - 2, r.top - 2, r.right + 2, r.bottom + 2);
  }

  if (!glyphs.length) return null;
  x0 = Math.max(0, Math.floor(x0));
  y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(vw, Math.ceil(x1));
  y1 = Math.min(vh, Math.ceil(y1));
  const cw = Math.max(1, Math.ceil((x1 - x0) * S));
  const ch = Math.max(1, Math.ceil((y1 - y0) * S));

  const off = document.createElement("canvas");
  off.width = cw;
  off.height = ch;
  const c = off.getContext("2d", { willReadFrequently: true });
  c.setTransform(S, 0, 0, S, -x0 * S, -y0 * S);
  c.textBaseline = "alphabetic";
  const code = (g) => `rgb(${(g + 1) * CODE},0,0)`;

  for (const [x, y, wd, th, g] of rules) {
    c.fillStyle = code(g);
    c.fillRect(x, y, wd, th);
  }
  if (rules.length) {
    // Skip-ink: cut the underline a pixel clear of every glyph that sits on
    // it, the way the browser does around g, p and y. The glyph fills below
    // put the letters themselves back.
    c.globalCompositeOperation = "destination-out";
    c.lineWidth = 2;
    c.lineJoin = "round";
    for (const [text, x, y, st] of glyphs) {
      if (!st.ul) continue;
      c.font = st.font;
      c.strokeText(text, x, y);
    }
    c.globalCompositeOperation = "source-over";
  }
  let font = "";
  for (const [text, x, y, st] of glyphs) {
    if (st.font !== font) c.font = font = st.font;
    c.fillStyle = code(st.g);
    c.fillText(text, x, y);
  }
  for (const ic of icons) {
    c.save();
    c.translate(ic.r.left, ic.r.top);
    c.scale(ic.k, ic.k);
    c.fillStyle = c.strokeStyle = code(ic.g);
    c.lineWidth = ic.width;
    c.lineCap = c.lineJoin = "round";
    for (const d of ic.paths) {
      if (!d) continue;
      const path = new Path2D(d);
      if (ic.line) c.stroke(path);
      else c.fill(path);
    }
    c.restore();
  }

  const px = c.getImageData(0, 0, cw, ch).data;
  const ink = [];
  for (let i = 0, a = 3; a < px.length; i++, a += 4) if (px[a] > 100) ink.push(i);
  if (!ink.length) return null;

  // One landing spot per stroke-width disc of ink, never fewer than there are
  // dots (they can double up) and never more than the frame can carry.
  const area = ink.length / (S * S);
  n = Math.max(n, Math.min(cap, Math.round((area * DENSITY) / (Math.PI * LAND_R * LAND_R))));

  // Stratified sampling over the ink in raster order: spot k comes from a
  // random pixel inside the k-th of n equal slices. Every line on screen gets
  // its share, which a contiguous slice (the first n pixels) would not, and
  // there is no regular stride to alias into stripes. When there are more
  // dots than ink pixels, several dots share a pixel, which is fine.
  const X = new Float32Array(n);
  const Y = new Float32Array(n);
  const G = new Uint8Array(n);
  const last = colours.length - 1;
  for (let k = 0; k < n; k++) {
    const i = ink[Math.min(ink.length - 1, Math.floor(((k + Math.random()) * ink.length) / n))];
    X[k] = x0 + ((i % cw) + Math.random()) / S;
    Y[k] = y0 + (Math.floor(i / cw) + Math.random()) / S;
    G[k] = Math.max(0, Math.min(last, Math.round(px[i * 4] / CODE) - 1));
  }
  return { n, x: X, y: Y, g: G, colours, scrollY: window.scrollY };
}
