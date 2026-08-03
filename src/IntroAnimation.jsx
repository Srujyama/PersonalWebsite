// IntroAnimation.jsx — the load-in, and the handoff into the page.
//
// The relief is on screen the entire time. Dots scatter in over it, assemble
// into the stippled image, hold, and then settle onto the relief's own contour
// lines and dissolve there. Nothing ever fades in or out behind them, so there
// is no moment where the background changes and gives the handoff away.
//
// How the settle targets are found: the relief is a WebGL shader whose height
// field is built from GPU-side value noise. Recomputing it in JS to locate the
// contour lines is not reliable — GLSL highp is single precision and the hash
// depends on fract() of large products, so JS float64 diverges from it almost
// immediately. Instead this reads the terrain canvas's own pixels and takes the
// ones that deviate most from the median tone: the carved grooves. That is
// exact by construction, costs one readback, and survives any future change to
// the shader.
//
// Props:
//   jsonPath  — stipple JSON ("/stipple_data.json")
//   onSettle  — dots have begun flying out to the contour positions
//   onFormed  — every dot has arrived; the relief can start fading up
//   onComplete— overlay can be unmounted
import { useEffect, useRef, useState, useCallback } from "react";

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeInCubic = (t) => t * t * t;

/* Sample the live terrain canvas and return screen-space points that sit on
   its contour grooves. Returns [] if the relief isn't up (WebGL failed, or the
   static fallback is showing), which puts the intro back on the old exit. */
function sampleReliefTargets(want, w, h) {
  const src = document.querySelector(".terrain-hero-wrap canvas");
  if (!src || !src.width || !src.height) return [];

  // ~800px wide is enough to resolve the grooves and keeps the readback cheap.
  const rw = Math.min(800, src.width);
  const rh = Math.max(1, Math.round((rw * src.height) / src.width));

  let data;
  try {
    const off = document.createElement("canvas");
    off.width = rw;
    off.height = rh;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(src, 0, 0, rw, rh);
    data = octx.getImageData(0, 0, rw, rh).data;
  } catch {
    // Tainted or unreadable buffer — not worth failing the intro over.
    return [];
  }

  const n = rw * rh;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    lum[i] = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  }

  const sorted = Float32Array.from(lum).sort();
  if (sorted[n - 1] - sorted[0] < 4) return []; // flat image: nothing rendered

  // Local contrast, not distance from the median. The shader lays a broad
  // hillshade under the grooves, so a whole hill flank sits far from the median
  // tone while being perfectly smooth — thresholding on that piles thousands of
  // dots onto blank slopes. Comparing each pixel to its neighbours a few pixels
  // out is a crude high-pass: it throws away the broad shading and keeps the
  // thin carved lines, which is the only thing worth landing on. It also stays
  // correct in dark mode, where a groove's lit wall is brighter than its
  // surroundings rather than darker.
  const R = 3;
  const dev = new Float32Array(n);
  for (let y = 0; y < rh; y++) {
    const yUp = Math.max(0, y - R) * rw;
    const yDn = Math.min(rh - 1, y + R) * rw;
    const yc = y * rw;
    for (let x = 0; x < rw; x++) {
      const c = lum[yc + x];
      const l = lum[yc + Math.max(0, x - R)];
      const r2 = lum[yc + Math.min(rw - 1, x + R)];
      const u = lum[yUp + x];
      const d = lum[yDn + x];
      dev[yc + x] = Math.abs(c - (l + r2 + u + d) * 0.25);
    }
  }

  // Keep the most line-like ~12% of pixels.
  const devSorted = Float32Array.from(dev).sort();
  const cut = devSorted[Math.floor(n * 0.88)];
  if (!(cut > 0)) return [];

  // Bucket the line pixels into a coarse screen grid, then give each cell a
  // share proportional to the SQUARE ROOT of how many line pixels it holds.
  //
  // The two obvious rules are both wrong. Sampling the pixel list evenly makes
  // dot density track line density exactly, and where the relief is steep the
  // contours pack tight enough that those regions swallow thousands of dots and
  // land as solid blobs. Giving every occupied cell an equal share fixes that
  // and overshoots: a cell holding one thin line gets the same sixteen dots as
  // a cell that is nothing but lines, so the drawing stops describing the
  // relief and a fifth of the screen (the cells with no lines at all) goes
  // bare. The square root sits between them — denser regions read as denser,
  // but they cannot dominate.
  const CELL = 18; // sample-space px
  const cols = Math.max(1, Math.ceil(rw / CELL));
  const rows = Math.max(1, Math.ceil(rh / CELL));
  const cells = new Array(cols * rows);
  let occupied = 0;

  for (let y = 0; y < rh; y++) {
    const cy = ((y / CELL) | 0) * cols;
    for (let x = 0; x < rw; x++) {
      if (dev[y * rw + x] < cut) continue;
      const ci = cy + ((x / CELL) | 0);
      let b = cells[ci];
      if (!b) {
        b = cells[ci] = [];
        occupied++;
      }
      b.push(x, y);
    }
  }
  if (occupied < 8) return [];

  let weightSum = 0;
  for (let ci = 0; ci < cells.length; ci++) {
    if (cells[ci]) weightSum += Math.sqrt(cells[ci].length / 2);
  }

  const sx = w / rw;
  const sy = h / rh;
  const out = new Float32Array(want * 2);
  let i = 0;
  for (let ci = 0; ci < cells.length && i < want; ci++) {
    const b = cells[ci];
    if (!b) continue;
    const len = b.length / 2;
    const quota = Math.max(1, Math.round((want * Math.sqrt(len)) / weightSum));
    for (let j = 0; j < quota && i < want; j++, i++) {
      const k = (Math.random() * len) | 0;
      out[i * 2] = (b[k * 2] + Math.random()) * sx;
      out[i * 2 + 1] = (b[k * 2 + 1] + Math.random()) * sy;
    }
  }
  // Cells run out before `want` when the grid is sparse; wrap over what we have.
  for (let j = 0; i < want; i++, j++) {
    out[i * 2] = out[(j % Math.max(1, i)) * 2];
    out[i * 2 + 1] = out[(j % Math.max(1, i)) * 2 + 1];
  }
  return out;
}

export default function IntroAnimation({
  jsonPath = "/stipple_data.json",
  onSettle,
  onFormed,
  onComplete,
  ink = "#121211",
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({
    phase: "loading", // loading → assembling → holding → settling → done
    dots: [],
    time: 0,
    opacity: 1,
  });
  const [showSkip, setShowSkip] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const doneRef = useRef(false);
  const settleRef = useRef(false);
  const formedRef = useRef(false);

  // Latest-callback refs: the draw loop lives in an effect that must not
  // re-run when a parent re-render hands down new function identities.
  const settleCb = useRef(onSettle);
  const formedCb = useRef(onFormed);
  const completeCb = useRef(onComplete);
  useEffect(() => {
    settleCb.current = onSettle;
    formedCb.current = onFormed;
    completeCb.current = onComplete;
  });

  const beginSettle = useCallback(() => {
    if (settleRef.current) return;
    settleRef.current = true;
    settleCb.current?.();
  }, []);

  const markFormed = useCallback(() => {
    if (formedRef.current) return;
    formedRef.current = true;
    formedCb.current?.();
  }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    // A skip has to hand over both signals, or the relief stays hidden.
    beginSettle();
    markFormed();
    setFadeOut(true);
    setTimeout(() => completeCb.current?.(), 520);
  }, [beginSettle, markFormed]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const state = stateRef.current;

    const ASSEMBLE = 2.2;
    const HOLD = 0.9;
    const SETTLE = 2.6;
    // The settle is three beats inside one phase: every dot arrives by ARRIVE,
    // the finished dot-map holds until HOLD_OUT, then the whole layer fades.
    // Fading each dot on its own progress (the previous approach) meant the far
    // ones were still half-way and half-transparent when the near ones were
    // done, so the map never actually existed — you only ever saw a smear.
    const ARRIVE = 0.6;
    const HOLD_OUT = 0.72;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    fetch(jsonPath)
      .then((r) => r.json())
      .then((data) => {
        const isMobile = window.innerWidth < 768;
        const imgW0 = data.w || data.width;
        const imgH0 = data.h || data.height;
        const raw = data.d || data.dots;

        const aspect = imgW0 / imgH0;
        const maxSize = isMobile
          ? Math.min(w * 0.75, h * 0.55)
          : Math.min(w * 0.45, h * 0.6);
        const imgW = aspect >= 1 ? maxSize : maxSize * aspect;
        const imgH = aspect >= 1 ? maxSize / aspect : maxSize;
        const offX = (w - imgW) / 2;
        const offY = (h - imgH) / 2;

        let dotData = raw;
        if (isMobile && dotData.length > 5000) {
          const step = Math.ceil(dotData.length / 5000);
          dotData = dotData.filter((_, i) => i % step === 0);
        }

        const scale = isMobile ? 0.7 : 1.0;
        const dots = dotData.map((d) => {
          const [nx, ny, r] = Array.isArray(d) ? d : [d.x, d.y, d.r];
          const tx = offX + nx * imgW;
          const ty = offY + ny * imgH;

          const angle = Math.random() * Math.PI * 2;
          const dist = 200 + Math.random() * Math.max(w, h) * 0.6;

          return {
            sx: w / 2 + Math.cos(angle) * dist,
            sy: h / 2 + Math.sin(angle) * dist,
            tx,
            ty,
            x: 0,
            y: 0,
            // filled in when the settle starts
            gx: tx,
            gy: ty,
            r: r * scale * (isMobile ? 1.8 : 2.2),
            k: 1,
            stagger: Math.hypot(nx - 0.5, ny - 0.5) * 0.4 + Math.random() * 0.15,
            settleDelay: 0,
            settleSpan: 1,
          };
        });
        for (const d of dots) {
          d.x = d.sx;
          d.y = d.sy;
        }

        state.dots = dots;
        state.phase = "assembling";
        state.time = 0;
      })
      .catch(() => finish());

    /* Hand every dot a landing spot on the relief. Dots and targets are both
       ordered by angle around the centre so the swarm opens outward instead of
       shuffling through itself. */
    function planSettle() {
      const dots = state.dots;
      const targets = sampleReliefTargets(dots.length, w, h);

      if (!targets.length) {
        // No relief to land on. Fall back to the old exit so the intro still
        // ends cleanly on a device where WebGL never came up.
        for (const d of dots) {
          const a = Math.atan2(d.ty - h / 2, d.tx - w / 2) + (Math.random() - 0.5) * 1.2;
          const dist = 300 + Math.random() * Math.max(w, h) * 0.8;
          d.gx = d.tx + Math.cos(a) * dist;
          d.gy = d.ty + Math.sin(a) * dist;
          d.settleDelay = Math.random() * 0.25;
          d.settleSpan = 0.7;
        }
        return false;
      }

      const order = dots
        .map((d, i) => [Math.atan2(d.ty - h / 2, d.tx - w / 2), i])
        .sort((a, b) => a[0] - b[0]);

      const tOrder = [];
      for (let i = 0; i < dots.length; i++) {
        tOrder.push([
          Math.atan2(targets[i * 2 + 1] - h / 2, targets[i * 2] - w / 2),
          i,
        ]);
      }
      tOrder.sort((a, b) => a[0] - b[0]);

      for (let k = 0; k < order.length; k++) {
        const d = dots[order[k][1]];
        const t = tOrder[k][1];
        d.gx = targets[t * 2];
        d.gy = targets[t * 2 + 1];
        // Dots nearest their landing spot go first, so the relief fills in
        // from wherever the image already overlapped it. Delay + span stay
        // under 1 so every dot has actually arrived when the phase ends.
        // Dots with the furthest to go leave FIRST, so everything lands at
        // roughly the same moment. Delaying the long trips (the obvious way
        // round) is what produced dense clumps still in transit at the end.
        const travel = Math.min(1, Math.hypot(d.gx - d.tx, d.gy - d.ty) / Math.max(w, h));
        d.settleDelay = (1 - travel) * 0.16 + Math.random() * 0.03;
        d.settleSpan = Math.max(0.18, ARRIVE - d.settleDelay);
      }
      return true;
    }

    let last = performance.now();

    function draw(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      state.time += dt;

      // The canvas is transparent for the whole intro. It used to paint paper
      // until the handoff, but that made the relief *appear* at the moment the
      // dots were told to land on it — a visible step in brightness right where
      // the transition is supposed to be invisible. Now the relief is on screen
      // from the first frame, the dots assemble over it, and the only thing
      // that ever changes is the dots themselves.
      ctx.clearRect(0, 0, w, h);

      const dots = state.dots;
      if (!dots.length) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const t = state.time;

      if (state.phase === "assembling") {
        for (const d of dots) {
          const lt = Math.max(
            0,
            Math.min(1, (t - d.stagger * ASSEMBLE * 0.5) / (ASSEMBLE * 0.7)),
          );
          const e = easeOutQuart(lt);
          d.x = d.sx + (d.tx - d.sx) * e;
          d.y = d.sy + (d.ty - d.sy) * e;
        }
        if (t >= ASSEMBLE) {
          for (const d of dots) {
            d.x = d.tx;
            d.y = d.ty;
          }
          state.phase = "holding";
          state.time = 0;
        }
      } else if (state.phase === "holding") {
        if (t >= HOLD) {
          state.landed = planSettle();
          state.phase = "settling";
          state.time = 0;
          beginSettle();
        }
      } else if (state.phase === "settling") {
        const p = t / SETTLE;
        for (const d of dots) {
          const lt = Math.max(
            0,
            Math.min(1, (p - d.settleDelay) / d.settleSpan),
          );
          // Settling onto a line wants to arrive slowly; blowing away wants
          // to accelerate. Same phase, two different curves.
          const e = state.landed ? easeInOutCubic(lt) : easeInCubic(lt);
          d.x = d.tx + (d.gx - d.tx) * e;
          d.y = d.ty + (d.gy - d.ty) * e;
          // Shrink as they land: a stipple dot is far heavier than a contour
          // groove, so at full size the finished map is a black crust rather
          // than a drawing of the relief.
          if (state.landed) d.k = 1 - 0.55 * lt;
        }
        if (p >= ARRIVE) markFormed();

        if (state.landed) {
          // One fade for the whole layer, after the map has formed and held.
          // The layer also eases from full strength down to 0.62 across the
          // flight: fifteen thousand overlapping dots at full alpha are much
          // darker than the lines underneath, and the dissolve has to end on
          // the weight it is dissolving into. Ramped, not stepped — dropping
          // straight to 0.62 at p=0 is a visible blink.
          const peak = 1 - 0.38 * Math.min(1, p / ARRIVE);
          const out =
            1 - Math.min(1, Math.max(0, (p - HOLD_OUT) / (1 - HOLD_OUT)));
          state.opacity = peak * out;
        } else {
          state.opacity = Math.max(0, 1 - easeInCubic(p));
        }

        if (t >= SETTLE) {
          state.phase = "done";
          finish();
        }
      }

      ctx.fillStyle = ink;
      ctx.globalAlpha = state.opacity;
      if (state.opacity > 0.004) {
        const settling = state.phase === "settling" && state.landed;
        for (const d of dots) {
          if (d.x < -50 || d.x > w + 50 || d.y < -50 || d.y > h + 50) continue;
          ctx.beginPath();
          ctx.arc(d.x, d.y, settling ? d.r * d.k : d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (state.phase !== "done") {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [jsonPath, finish, beginSettle, markFormed, ink]);

  return (
    <div
      className="intro-overlay"
      style={{ opacity: fadeOut ? 0 : 1 }}
      onClick={finish}
      role="presentation"
    >
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
      />
      {showSkip && !fadeOut && (
        <button
          type="button"
          className="intro-skip"
          onClick={(e) => {
            e.stopPropagation();
            finish();
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
}
