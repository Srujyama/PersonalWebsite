// DotCurtain.jsx — the page transition.
//
// The page clears to paper, the Campanile assembles out of dots on it, the
// route swaps while the screen is covered, and the whole layer fades to the
// new page. That is the entire move.
//
// It is the landing intro's vocabulary at a fifth of the length: the same
// stipple, the same scatter-and-assemble, on the same paper the rest of the
// site is printed on. An earlier version closed the screen with a grid of ink
// dots first, which covered the swap but read as a second, unrelated idea
// stacked in front of this one.
//
// Two things it must get exactly right, because a page swap happens inside it:
//   • The background is fully opaque across the swap. It is painted flat, not
//     blurred or blended, so there is nothing to see through.
//   • It swallows clicks for its whole run. Otherwise people click links they
//     cannot see.
//
// If the stipple has not arrived yet (first navigation on a cold cache, or the
// fetch failed) the layer is a plain paper cover that fades in and out. It
// never blocks on the network.
import { useEffect, useRef } from "react";

// Beats, in ms from the start of the run. WashProvider reads these to know
// when to swap the route and when to unmount this, so they must agree.
//
// `still` is the reduced-motion cut. It is not "no transition": a page that
// simply teleports is harder to follow, not kinder. The dots are painted
// where they land instead of flying there, and the paper fades rather than
// sweeps, so nothing travels across the screen. Same picture, no movement.
export const TIMING = {
  motion: { coverIn: 190, assembleStart: 70, assembleEnd: 540, holdEnd: 760, swapAt: 520, run: 1120 },
  still: { coverIn: 220, assembleStart: 0, assembleEnd: 0, holdEnd: 430, swapAt: 300, run: 760 },
};

// How much of the viewport height the tower stands in.
const TOWER_H = 0.72;

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* The stipple is fetched once for the whole session and held here. Kicked off
   at app start, so by the first navigation it is already in hand. */
let stipple = null;
let stipplePromise = null;

export function preloadCurtainDots(src = "/stipple_campanile.json") {
  if (stipplePromise) return stipplePromise;
  stipplePromise = fetch(src)
    .then((r) => r.json())
    .then((d) => {
      stipple = d;
      return d;
    })
    .catch(() => null); // no tower this session; the cover still works
  return stipplePromise;
}

export default function DotCurtain({ still = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const T = still ? TIMING.still : TIMING.motion;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Paper and ink, straight off the theme. In dark mode that inverts on its
    // own, so the transition is always the page's own material.
    const css = getComputedStyle(document.documentElement);
    const paper = css.getPropertyValue("--paper").trim() || "#f4f3f0";
    const ink = css.getPropertyValue("--ink").trim() || "#121211";

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Every dot flies in from a point off its own edge of the screen and lands
       on the stipple. Ordering both ends by angle around the centre means the
       swarm opens outward instead of shuffling through itself. */
    const dots = (() => {
      if (!stipple) return null;
      const raw = stipple.d || stipple.dots;
      const sw = stipple.w || stipple.width;
      const sh = stipple.h || stipple.height;
      if (!raw || !raw.length || !sw || !sh) return null;

      const th = h * TOWER_H;
      const tw = (th * sw) / sh;
      const offX = (w - tw) / 2;
      const offY = (h - th) / 2;
      const scale = th / sh;
      const cx = w / 2;
      const cy = h / 2;
      const reach = Math.max(w, h);

      return raw.map((p) => {
        const [nx, ny, r] = Array.isArray(p) ? p : [p.x, p.y, p.r];
        const tx = offX + nx * tw;
        const ty = offY + ny * th;
        const a = Math.atan2(ty - cy, tx - cx) + (Math.random() - 0.5) * 0.5;
        const dist = reach * (0.55 + Math.random() * 0.5);
        return {
          sx: cx + Math.cos(a) * dist,
          sy: cy + Math.sin(a) * dist,
          tx,
          ty,
          r: Math.max(0.9, r * scale * 1.3),
          // Dots landing near the centre of the tower start first, so it fills
          // outward from its own mass rather than closing in from the edges.
          delay: Math.random() * 0.3,
        };
      });
    })();

    let raf = 0;
    const t0 = performance.now();

    function frame(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, w, h);

      // One alpha for the whole layer on the way out, so the tower and the
      // paper it stands on leave together.
      const out =
        t <= T.holdEnd ? 1 : Math.max(0, 1 - (t - T.holdEnd) / (T.run - T.holdEnd));
      if (out <= 0.004) {
        raf = requestAnimationFrame(frame);
        return;
      }

      // Paper. The clamp goes on the INPUT, not the result: easeOutQuart is
      // 1 - (1-x)^4, so feeding it x > 1 turns the curve back down and past
      // x = 2 it goes negative. Canvas ignores an out-of-range globalAlpha and
      // silently keeps the last valid one, so the cover looked opaque while
      // actually being told to fade back out over the route swap.
      ctx.globalAlpha = out * easeOutQuart(Math.min(1, t / T.coverIn));
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);

      // Ink. In the still cut the assembly window is zero, so every dot is
      // already home on the first frame and only the layer's alpha moves.
      if (dots) {
        const p = still
          ? 1
          : Math.max(
              0,
              Math.min(1, (t - T.assembleStart) / (T.assembleEnd - T.assembleStart)),
            );
        ctx.globalAlpha = out;
        ctx.fillStyle = ink;
        for (const d of dots) {
          const k = easeOutCubic(
            Math.max(0, Math.min(1, (p - d.delay) / (1 - d.delay))),
          );
          if (k <= 0) continue;
          ctx.beginPath();
          ctx.arc(
            d.sx + (d.tx - d.sx) * k,
            d.sy + (d.ty - d.sy) * k,
            d.r,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      if (t < T.run) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  return <canvas ref={canvasRef} className="wash-dots" aria-hidden="true" />;
}
