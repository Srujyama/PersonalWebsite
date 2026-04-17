// App.jsx
import "./style.css";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import IntroAnimation from "./IntroAnimation";

/* ─── Mobile detection helper ─── */
function isMobile() {
  return window.innerWidth < 768;
}

/* ─── Canvas Background: Floating Dots ─── */
function DotsBg({ paused }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animRef = useRef(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;

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

    const mobile = isMobile();
    const COUNT = mobile
      ? Math.min(28, Math.floor((w * h) / 25000))
      : Math.min(80, Math.floor((w * h) / 12000));
    const connectDist = mobile ? 90 : 140;

    particles.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * (mobile ? 0.4 : 0.8),
      vy: (Math.random() - 0.5) * (mobile ? 0.4 : 0.8),
      r: Math.random() * 2 + 1.5,
      phase: Math.random() * Math.PI * 2,
    }));

    let frameCount = 0;

    function draw() {
      frameCount++;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      const pts = particles.current;

      if (!pausedRef.current) {
        for (const p of pts) {
          p.x += p.vx;
          p.y += p.vy;
          p.phase += 0.015;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          p.x = Math.max(0, Math.min(w, p.x));
          p.y = Math.max(0, Math.min(h, p.y));
        }
      }

      // Draw connections (on mobile, every 3rd frame)
      if (!mobile || frameCount % 3 === 0) {
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x;
            const dy = pts[i].y - pts[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectDist) {
              const alpha = (1 - dist / connectDist) * 0.18;
              ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw dots
      for (const p of pts) {
        const pulse = 1 + Math.sin(p.phase) * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fill();
        if (!mobile) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * pulse * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0"
    />
  );
}

/* ─── Canvas Background: DNA Helix ─── */
function DnaBg({ paused }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;

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

    const mobile = isMobile();
    const helixCount = mobile ? 2 : 3;
    const nodeSpacing = mobile ? 26 : 18;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      if (!pausedRef.current) {
        timeRef.current += 0.012;
      }
      const t = timeRef.current;

      for (let hi = 0; hi < helixCount; hi++) {
        const centerX = mobile ? w * (0.3 + hi * 0.4) : w * (0.2 + hi * 0.3);
        const amplitude = mobile ? 35 + hi * 8 : 60 + hi * 10;
        const phaseOffset = hi * 1.2;
        const opacity = 0.18 - hi * 0.03;
        const nodeCount = Math.floor(h / nodeSpacing);

        const strand1 = [];
        const strand2 = [];

        for (let i = 0; i <= nodeCount; i++) {
          const y = (i / nodeCount) * (h + 40) - 20;
          const angle = i * 0.22 + t * 2 + phaseOffset;
          const x1 = centerX + Math.sin(angle) * amplitude;
          const x2 = centerX + Math.sin(angle + Math.PI) * amplitude;
          strand1.push({ x: x1, y });
          strand2.push({ x: x2, y });
        }

        ctx.lineWidth = mobile ? 1.5 : 2;
        ctx.strokeStyle = `rgba(0, 80, 160, ${opacity})`;
        ctx.beginPath();
        for (let i = 0; i < strand1.length; i++) {
          i === 0
            ? ctx.moveTo(strand1[i].x, strand1[i].y)
            : ctx.lineTo(strand1[i].x, strand1[i].y);
        }
        ctx.stroke();

        ctx.strokeStyle = `rgba(160, 40, 40, ${opacity})`;
        ctx.beginPath();
        for (let i = 0; i < strand2.length; i++) {
          i === 0
            ? ctx.moveTo(strand2[i].x, strand2[i].y)
            : ctx.lineTo(strand2[i].x, strand2[i].y);
        }
        ctx.stroke();

        const rungStep = mobile ? 5 : 3;
        for (let i = 0; i < strand1.length; i += rungStep) {
          const angle = i * 0.22 + t * 2 + phaseOffset;
          const depth = Math.cos(angle);
          const rungAlpha = 0.08 + Math.abs(depth) * 0.08;

          ctx.strokeStyle = `rgba(100, 100, 100, ${rungAlpha})`;
          ctx.lineWidth = mobile ? 0.8 : 1.2;
          ctx.beginPath();
          ctx.moveTo(strand1[i].x, strand1[i].y);
          ctx.lineTo(strand2[i].x, strand2[i].y);
          ctx.stroke();

          const colors = [
            "rgba(0, 120, 200, 0.35)",
            "rgba(200, 50, 50, 0.35)",
            "rgba(50, 170, 80, 0.35)",
            "rgba(200, 160, 0, 0.35)",
          ];
          const dotR = mobile ? 2 : 3;

          ctx.beginPath();
          ctx.arc(strand1[i].x, strand1[i].y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = colors[i % 4];
          ctx.fill();

          ctx.beginPath();
          ctx.arc(strand2[i].x, strand2[i].y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = colors[(i + 2) % 4];
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0"
    />
  );
}

/* ─── Canvas Background: Circuit Board ─── */
function CircuitBg({ paused }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);
  const pathsRef = useRef([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const mobile = isMobile();
    const gridSize = mobile ? 60 : 50;
    const pathCount = mobile ? 20 : 60;

    function buildPaths() {
      const paths = [];
      const cols = Math.ceil(w / gridSize) + 1;
      const rows = Math.ceil(h / gridSize) + 1;

      for (let i = 0; i < pathCount; i++) {
        const startCol = Math.floor(Math.random() * cols);
        const startRow = Math.floor(Math.random() * rows);
        const points = [{ x: startCol * gridSize, y: startRow * gridSize }];
        let cx = startCol,
          cy = startRow;

        const segments = Math.floor(Math.random() * (mobile ? 3 : 6)) + 2;
        for (let s = 0; s < segments; s++) {
          const dir = Math.floor(Math.random() * 4);
          const len = Math.floor(Math.random() * 3) + 1;
          if (dir === 0) cx += len;
          else if (dir === 1) cx -= len;
          else if (dir === 2) cy += len;
          else cy -= len;
          cx = Math.max(0, Math.min(cols - 1, cx));
          cy = Math.max(0, Math.min(rows - 1, cy));
          points.push({ x: cx * gridSize, y: cy * gridSize });
        }

        paths.push({
          points,
          pulseOffset: Math.random() * Math.PI * 2,
          pulseSpeed: 0.5 + Math.random() * 1.5,
          hasNode: Math.random() > 0.3,
          nodeType: Math.floor(Math.random() * 3),
        });
      }
      return paths;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pathsRef.current = buildPaths();
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      if (!pausedRef.current) {
        timeRef.current += 0.015;
      }
      const t = timeRef.current;

      // Grid dots
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, mobile ? 0.7 : 1, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
          ctx.fill();
        }
      }

      // Circuit paths
      for (const path of pathsRef.current) {
        const pulse =
          Math.sin(t * path.pulseSpeed + path.pulseOffset) * 0.5 + 0.5;
        const baseAlpha = 0.08 + pulse * 0.1;

        ctx.strokeStyle = `rgba(0, 0, 0, ${baseAlpha})`;
        ctx.lineWidth = mobile ? 1 : 1.5;
        ctx.lineCap = "square";
        ctx.beginPath();
        for (let i = 0; i < path.points.length; i++) {
          const p = path.points[i];
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // Traveling pulse
        const totalLen = [];
        let cumLen = 0;
        totalLen.push(0);
        for (let i = 1; i < path.points.length; i++) {
          const dx = path.points[i].x - path.points[i - 1].x;
          const dy = path.points[i].y - path.points[i - 1].y;
          cumLen += Math.sqrt(dx * dx + dy * dy);
          totalLen.push(cumLen);
        }
        if (cumLen > 0) {
          const pos = (t * 40 * path.pulseSpeed) % cumLen;
          for (let i = 1; i < totalLen.length; i++) {
            if (totalLen[i] >= pos) {
              const segFrac =
                (pos - totalLen[i - 1]) / (totalLen[i] - totalLen[i - 1]);
              const px =
                path.points[i - 1].x +
                (path.points[i].x - path.points[i - 1].x) * segFrac;
              const py =
                path.points[i - 1].y +
                (path.points[i].y - path.points[i - 1].y) * segFrac;
              ctx.beginPath();
              ctx.arc(px, py, mobile ? 2 : 3, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(0, 100, 200, ${0.3 + pulse * 0.2})`;
              ctx.fill();
              if (!mobile) {
                ctx.beginPath();
                ctx.arc(px, py, 8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 100, 200, ${0.06 + pulse * 0.04})`;
                ctx.fill();
              }
              break;
            }
          }
        }

        // Endpoint nodes
        if (path.hasNode) {
          const endPt = path.points[path.points.length - 1];
          const nodeAlpha = 0.15 + pulse * 0.15;
          const ns = mobile ? 3 : 4;

          if (path.nodeType === 0) {
            ctx.beginPath();
            ctx.arc(endPt.x, endPt.y, ns, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 0, ${nodeAlpha})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(endPt.x, endPt.y, ns * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
          } else if (path.nodeType === 1) {
            ctx.fillStyle = `rgba(0, 0, 0, ${nodeAlpha})`;
            ctx.fillRect(endPt.x - ns, endPt.y - ns, ns * 2, ns * 2);
            ctx.fillStyle = "#fff";
            ctx.fillRect(endPt.x - ns * 0.5, endPt.y - ns * 0.5, ns, ns);
          } else {
            ctx.save();
            ctx.translate(endPt.x, endPt.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = `rgba(0, 0, 0, ${nodeAlpha})`;
            ctx.fillRect(-ns + 0.5, -ns + 0.5, (ns - 0.5) * 2, (ns - 0.5) * 2);
            ctx.restore();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0"
    />
  );
}

/* ─── CSS Wave Pattern (Original) ─── */
function WavesBg({ paused }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 grid-warp"
      style={{ animationPlayState: paused ? "paused" : "running" }}
    />
  );
}

/* ─── Canvas Background: Constellation / Starfield ─── */
function ConstellationBg({ paused }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);
  const starsRef = useRef([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const mobile = isMobile();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars();
    }

    function initStars() {
      const count = mobile ? 60 : 140;
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.4,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        brightness: 0.3 + Math.random() * 0.7,
        // Subtle drift
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
      }));
    }

    resize();
    window.addEventListener("resize", resize);
    const connectDist = mobile ? 100 : 130;

    function draw() {
      if (!pausedRef.current) timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);
      // Soft off-white background
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, w, h);

      const stars = starsRef.current;

      if (!pausedRef.current) {
        for (const s of stars) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < 0) s.x = w;
          if (s.x > w) s.x = 0;
          if (s.y < 0) s.y = h;
          if (s.y > h) s.y = 0;
        }
      }

      // Constellation lines
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * 0.1;
            ctx.strokeStyle = `rgba(100, 120, 160, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Stars with twinkling
      for (const s of stars) {
        const twinkle =
          0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const alpha = s.brightness * twinkle;
        // Outer glow
        if (!mobile) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(80, 100, 150, ${alpha * 0.06})`;
          ctx.fill();
        }
        // Core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60, 80, 130, ${alpha * 0.55})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0"
    />
  );
}

/* ─── Canvas Background: Topographic Contours ─── */
function TopoBg({ paused }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const mobile = isMobile();

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

    // Simplex-like noise using layered sine waves
    const centers = Array.from({ length: mobile ? 4 : 6 }, () => ({
      x: Math.random() * 1.4 - 0.2,
      y: Math.random() * 1.4 - 0.2,
      freq: 0.8 + Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 0.02,
      driftY: (Math.random() - 0.5) * 0.02,
    }));

    function heightAt(px, py, t) {
      let val = 0;
      for (const c of centers) {
        const cx = c.x + Math.sin(t * c.drift * 5) * 0.1;
        const cy = c.y + Math.cos(t * c.driftY * 5) * 0.1;
        const dx = px - cx;
        const dy = py - cy;
        val +=
          Math.sin(Math.sqrt(dx * dx + dy * dy) * c.freq * 8 + t * 0.5) * 0.5;
      }
      return val;
    }

    const contourLevels = mobile ? 12 : 18;
    const resolution = mobile ? 6 : 4;

    function draw() {
      if (!pausedRef.current) timeRef.current += 0.008;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Compute height field
      const cols = Math.ceil(w / resolution);
      const rows = Math.ceil(h / resolution);
      const field = new Float32Array(cols * rows);

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          field[gy * cols + gx] = heightAt(gx / cols, gy / rows, t);
        }
      }

      // Draw contour lines using marching squares (simplified)
      for (let level = 0; level < contourLevels; level++) {
        const threshold = -1 + (2 * level) / contourLevels;
        const alpha = 0.06 + (level % 3 === 0 ? 0.08 : 0);
        const lw = level % 3 === 0 ? 1.2 : 0.6;

        ctx.strokeStyle = `rgba(80, 60, 40, ${alpha})`;
        ctx.lineWidth = lw;
        ctx.beginPath();

        for (let gy = 0; gy < rows - 1; gy++) {
          for (let gx = 0; gx < cols - 1; gx++) {
            const tl = field[gy * cols + gx];
            const tr = field[gy * cols + gx + 1];
            const bl = field[(gy + 1) * cols + gx];
            const br = field[(gy + 1) * cols + gx + 1];

            const x0 = gx * resolution;
            const y0 = gy * resolution;

            // Simple contour: if threshold crosses any edge, draw segment
            const edges = [];
            if ((tl - threshold) * (tr - threshold) < 0) {
              const frac = (threshold - tl) / (tr - tl);
              edges.push([x0 + frac * resolution, y0]);
            }
            if ((tr - threshold) * (br - threshold) < 0) {
              const frac = (threshold - tr) / (br - tr);
              edges.push([x0 + resolution, y0 + frac * resolution]);
            }
            if ((bl - threshold) * (br - threshold) < 0) {
              const frac = (threshold - bl) / (br - bl);
              edges.push([x0 + frac * resolution, y0 + resolution]);
            }
            if ((tl - threshold) * (bl - threshold) < 0) {
              const frac = (threshold - tl) / (bl - tl);
              edges.push([x0, y0 + frac * resolution]);
            }

            if (edges.length >= 2) {
              ctx.moveTo(edges[0][0], edges[0][1]);
              ctx.lineTo(edges[1][0], edges[1][1]);
            }
          }
        }
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0"
    />
  );
}

/* ─── Canvas Background: Hexagonal Grid with Ripples ─── */
function HexBg({ paused }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const mobile = isMobile();
    const hexSize = mobile ? 28 : 22;

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

    const sqrt3 = Math.sqrt(3);
    const rippleSources = [
      { x: 0.3, y: 0.4, speed: 1.2, phase: 0 },
      { x: 0.7, y: 0.6, speed: 0.9, phase: 2 },
      { x: 0.5, y: 0.2, speed: 1.5, phase: 4 },
    ];

    function drawHex(cx, cy, size, alpha) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = cx + size * Math.cos(angle);
        const hy = cy + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.stroke();
    }

    function draw() {
      if (!pausedRef.current) timeRef.current += 0.012;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = mobile ? 0.5 : 0.7;
      const hW = hexSize * sqrt3;
      const hH = hexSize * 1.5;

      const cols = Math.ceil(w / hW) + 2;
      const rows = Math.ceil(h / hH) + 2;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const offset = row % 2 === 0 ? 0 : hW / 2;
          const cx = col * hW + offset;
          const cy = row * hH;

          // Compute ripple effect
          let rippleVal = 0;
          const nx = cx / w;
          const ny = cy / h;
          for (const src of rippleSources) {
            const dx = nx - src.x;
            const dy = ny - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            rippleVal +=
              Math.sin(dist * 20 - t * src.speed * 3 + src.phase) * 0.5;
          }

          const alpha = 0.04 + Math.max(0, rippleVal * 0.08);
          const sizeScale = 1 + rippleVal * 0.06;
          drawHex(cx, cy, hexSize * sizeScale * 0.95, alpha);

          // Fill bright hexes
          if (rippleVal > 0.6) {
            ctx.fillStyle = `rgba(0, 0, 0, ${(rippleVal - 0.6) * 0.04})`;
            ctx.fill();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0"
    />
  );
}

/* ─── Canvas Background: Floating Geometric Shapes ─── */
function GeoBg({ paused }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);
  const shapesRef = useRef([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const mobile = isMobile();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initShapes();
    }

    function initShapes() {
      const count = mobile ? 18 : 35;
      shapesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 12 + Math.random() * (mobile ? 25 : 40),
        sides: [3, 4, 5, 6][Math.floor(Math.random() * 4)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.008,
        alpha: 0.04 + Math.random() * 0.08,
        lineWidth: 0.6 + Math.random() * 0.8,
      }));
    }

    resize();
    window.addEventListener("resize", resize);

    function drawPoly(cx, cy, size, sides, rotation) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = ((Math.PI * 2) / sides) * i + rotation;
        const px = cx + size * Math.cos(angle);
        const py = cy + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    function draw() {
      if (!pausedRef.current) timeRef.current += 0.016;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      const shapes = shapesRef.current;

      for (const s of shapes) {
        if (!pausedRef.current) {
          s.x += s.vx;
          s.y += s.vy;
          s.rotation += s.rotSpeed;
          // Wrap around
          if (s.x < -s.size * 2) s.x = w + s.size;
          if (s.x > w + s.size * 2) s.x = -s.size;
          if (s.y < -s.size * 2) s.y = h + s.size;
          if (s.y > h + s.size * 2) s.y = -s.size;
        }

        ctx.lineWidth = s.lineWidth;
        ctx.strokeStyle = `rgba(0, 0, 0, ${s.alpha})`;
        drawPoly(s.x, s.y, s.size, s.sides, s.rotation);
        ctx.stroke();

        // Inner shape (smaller, rotated opposite)
        ctx.strokeStyle = `rgba(0, 0, 0, ${s.alpha * 0.5})`;
        ctx.lineWidth = s.lineWidth * 0.6;
        drawPoly(s.x, s.y, s.size * 0.5, s.sides, -s.rotation * 1.5);
        ctx.stroke();
      }

      // Connection lines between nearby shapes
      if (!mobile) {
        for (let i = 0; i < shapes.length; i++) {
          for (let j = i + 1; j < shapes.length; j++) {
            const dx = shapes[i].x - shapes[j].x;
            const dy = shapes[i].y - shapes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              const alpha = (1 - dist / 180) * 0.04;
              ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
              ctx.lineWidth = 0.4;
              ctx.beginPath();
              ctx.moveTo(shapes[i].x, shapes[i].y);
              ctx.lineTo(shapes[j].x, shapes[j].y);
              ctx.stroke();
            }
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0"
    />
  );
}

/* ─── Background Switcher ─── */
const BG_OPTIONS = [
  { key: "waves", label: "Waves", icon: "〰" },
  { key: "dots", label: "Particles", icon: "⋯" },
  { key: "dna", label: "DNA", icon: "⌬" },
  { key: "circuit", label: "Circuit", icon: "⏚" },
  { key: "constellation", label: "Stars", icon: "✦" },
  { key: "topo", label: "Contours", icon: "◎" },
  { key: "hex", label: "Hexgrid", icon: "⬡" },
  { key: "geo", label: "Geometry", icon: "△" },
];

function BgSwitcher({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click / tap
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {open && (
        <div className="bg-switcher-options">
          {BG_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              className={`bg-switcher-option ${current === opt.key ? "active" : ""}`}
              title={opt.label}
            >
              <span className="bg-switcher-icon">{opt.icon}</span>
              <span className="bg-switcher-label">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-switcher-toggle"
        aria-label="Change background"
        title="Change background"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
    </div>
  );
}

function Noise() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 opacity-[0.045] mix-blend-multiply"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

function Section({ title, hint, children, open, onToggle }) {
  return (
    <div className="border-l-2 border-black/30 pl-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-3 flex items-center justify-between gap-4 text-left"
      >
        <div className="flex-1">
          <div className="text-sm font-bold text-black">{title}</div>
        </div>
        <div className="text-sm text-black/60 font-mono">
          {open ? "−" : "+"}
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 top-0 bottom-0 overflow-auto">
        <div className="mx-auto w-[min(1000px,94vw)] py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-black">{title}</div>
              <div className="text-xs text-black/55 mt-1">All my work</div>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-4"
            >
              Close
            </button>
          </div>

          <div className="mt-4 border-t border-black/10 pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const profile = useMemo(
    () => ({
      name: "Srujan Yamali",
      title: "Software Engineer, AI/ML",
      location: "Bay Area • Philadelphia • NYC",
      oneLiner: "",
      phone: "(302) 509-8614",
      email: "srujanyamali@berkeley.edu",
      site: "srujanyamali.com",
      github: "github.com/srujyama",
      linkedin: "linkedin.com/in/srujanyamali",
    }),
    [],
  );

  const socialLinks = [
    {
      img: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
      alt: "LinkedIn",
      href: "https://linkedin.com/in/srujanyamali",
    },
    {
      img: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
      alt: "GitHub",
      href: "https://github.com/srujyama",
    },
    {
      img: "https://cdn-icons-png.flaticon.com/512/561/561127.png",
      alt: "Email",
      href: "mailto:srujanyamali@berkeley.edu",
    },
  ];

  const experience = useMemo(
    () => [
      {
        org: "Visa",
        role: "Software Engineer Intern",
        where: "Remote",
        dates: "Jan 2025 – Present",
        logo: "/visa.png",
        description:
          "Developed LLM-powered automation for large-scale license verification",
      },
      {
        org: "Mercor",
        role: "Software Engineer",
        where: "San Francisco, CA",
        dates: "Aug 2025 – Jan 2025",
        logo: "/Mercor_Logo.png",
        description:
          "Built out Applied AI systems and delivered data to top AI labs",
      },
      {
        org: "Children's Hospital of Philadelphia",
        role: "Data Science Intern",
        where: "Philadelphia, PA",
        dates: "June 2024 – Aug 2025",
        logo: "/UniversityofPennsylvania_Shield_RGB-2.png",
        description: "Data Driven Research into Recombination",
      },
      {
        org: "Cornell University",
        role: "Machine Learning Engineer Intern",
        where: "Remote",
        dates: "Sept 2023 – May 2024",
        logo: "/Cornell_University_seal.png",
        description: "Organism Behavior Analysis w/ Deep learning",
      },
      {
        org: "University of Delaware",
        role: "Software Development Intern",
        where: "Newark, DE",
        dates: "June 2023 – Aug 2023",
        logo: "/Udel.png",
        description: "Organism Behavior Analysis w/ Computer Vision",
      },
    ],
    [],
  );

  const projects = useMemo(
    () => [
      {
        name: "FlyFlirt — Real-Time Behavioral Detection and Tracking",
        tagline: "Teaching computers to watch fruit flies flirt",
        stack: "Python, OpenCV, PyQt6, Pandas",
        github: "https://github.com/Srujyama/FlyFlirt",
        description:
          "Real-time computer vision pipeline tracking Drosophila courtship across hundreds of hours of video, cutting manual annotation time by 90%.",
      },
      {
        name: "RedCarpet — Genomic Changepoint Detection",
        tagline: "Finding where bacterial genomes swapped DNA",
        stack: "Python, Ruptures, Scikit-learn, Matplotlib",
        github: "https://github.com/microbialARC/Redcarpet",
        description:
          "Parallelized changepoint detection engine using KDTree similarity search to identify recombination events across large bacterial genome datasets.",
      },
      {
        name: "Sylor — AI Simulation Platform",
        tagline: "Stress-test your decisions with AI agents",
        stack: "Next.js, TypeScript, FastAPI, Firebase",
        github: "https://github.com/Srujyama/sylor",
        website: "https://sylor.us",
        description:
          "Multi-agent AI platform that simulates market, pricing, and competitive dynamics so founders can pressure-test decisions before committing.",
      },
      {
        name: "Stryda — Workflow Automation Platform",
        tagline: "Zapier, but for people who actually build things",
        stack: "Python, TypeScript, React, Docker",
        website: "https://stryda.ai",
        description:
          "Developer-first automation platform with a Python execution engine for chaining APIs, AI models, and internal tools with branching logic and retries.",
      },
      {
        name: "Stryda — iOS Tipping App (Pre-Pivot)",
        tagline: "Where Stryda started — tap your phone, leave a tip",
        stack: "Swift, SwiftUI, NFC, Firebase",
        github: "https://github.com/Srujyama/Stryda",
        description:
          "NFC-first iOS tipping app with QR fallbacks, tip configuration, and rewards tracking built on SwiftUI and Firebase.",
      },
    ],
    [],
  );

  const publications = useMemo(
    () => [
      {
        title: "High-Throughput Behavioral Assay Unveils Female Courtship in Drosophila",
        authors: ["R. Oliver", "S. Yamali", "S. Knox", "T. Dadyala", "L. Shao"],
        venue: "International Behavioral and Neural Genetics Society",
        location: "Western University, London",
        year: "2024",
      },
      {
        title: "High-Throughput Behavioral Assay Unveils Female Courtship in Drosophila",
        authors: ["R. Oliver", "S. Yamali", "S. Knox", "T. Dadyala", "L. Shao"],
        venue: "Sexually Dimorphic Circuits and Behaviors",
        location: "Janelia Research Campus, HHMI, Ashburn, VA",
        year: "2024",
      },
      {
        title: "Redcarpet: Rapid Recombination Detection in Staphylococcus aureus and Other Species Amid Expanding Genomic Databases",
        authors: ["A. Moustafa", "E. Theiller", "A. Lal", "S. Yamali", "A. Feder", "A. Narechania", "P. Planet"],
        venue: "19th International Symposium on Staphylococci and Staphylococcal Infections",
        location: "Perth",
        year: "2024",
      },
    ],
    [],
  );

  const [modal, setModal] = useState("");
  const [openKey, setOpenKey] = useState("");
  const [animationPaused, setAnimationPaused] = useState(false);
  const [bgType, setBgType] = useState("topo");
  const [introComplete, setIntroComplete] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeModal = () => setModal("");

  const BgComponent = {
    waves: WavesBg,
    dots: DotsBg,
    dna: DnaBg,
    circuit: CircuitBg,
    constellation: ConstellationBg,
    topo: TopoBg,
    hex: HexBg,
    geo: GeoBg,
  }[bgType];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Intro Animation */}
      {!introComplete && (
        <IntroAnimation
          jsonPath="/stipple_data.json"
          onComplete={() => setIntroComplete(true)}
        />
      )}

      {/* Main site — fades in after intro */}
      <div
        className="site-content"
        style={{
          opacity: introComplete ? 1 : 0,
          transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: introComplete ? "auto" : "none",
        }}
      >
        {isMobileView ? (
          <div aria-hidden="true" className="mobile-static-bg" />
        ) : (
          <>
            <BgComponent paused={animationPaused} />
            <Noise />
          </>
        )}

        {/* Unified sidebar */}
        <div className="social-links-container">
          {socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              target={
                link.target ||
                (link.href.startsWith("mailto") ? undefined : "_blank")
              }
              rel={
                link.href.startsWith("mailto")
                  ? undefined
                  : "noopener noreferrer"
              }
              download={link.download || undefined}
              className="hover:scale-110 transition-transform duration-200 ease-out block social-icon-link"
              aria-label={link.alt}
            >
              <img src={link.img} alt={link.alt} className="social-icon-img" />
            </a>
          ))}

          {!isMobileView && (
            <>
              <div className="sidebar-divider" />

              <button
                onClick={() => setAnimationPaused(!animationPaused)}
                className="hover:scale-110 transition-transform duration-200 ease-out control-btn"
                aria-label={
                  animationPaused ? "Resume Animation" : "Pause Animation"
                }
              >
                <img
                  src={
                    animationPaused
                      ? "https://cdn-icons-png.flaticon.com/512/727/727245.png"
                      : "https://cdn-icons-png.flaticon.com/512/2404/2404385.png"
                  }
                  alt={animationPaused ? "Resume" : "Pause"}
                  className="control-btn-img"
                />
              </button>

              <BgSwitcher current={bgType} onChange={setBgType} />
            </>
          )}
        </div>

        {/* Featured-projects sidebar — always visible, labels on hover */}
        <div className="featured-links-container">
          <a
            href="https://thoughts.srujanyamali.com"
            target="_blank"
            rel="noopener noreferrer"
            className="featured-link"
            aria-label="Thoughts"
          >
            <img src="/thoughts_logo.png" alt="" className="featured-link-img" />
            <span className="featured-link-label">Thoughts</span>
          </a>
          <a
            href="https://stryda.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="featured-link"
            aria-label="Stryda"
          >
            <img src="/stryda_logo.svg" alt="" className="featured-link-img" />
            <span className="featured-link-label">Stryda</span>
          </a>
        </div>

        <main className="relative z-10 mx-auto max-w-[900px] px-8 py-16 mobile-content">
          <section className="p-10 mobile-section">
            {/* Header */}
            <div className="pb-12 border-b-2 border-black/20">
              <h1
                className="text-7xl mobile-title font-black text-black tracking-tight mb-6 leading-tight"
                style={{ textShadow: "0 0 30px rgba(255,255,255,0.9)" }}
              >
                {profile.name}
              </h1>
              <div className="space-y-3">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "rgba(88, 60, 140, 0.85)", textShadow: "0 0 20px rgba(255,255,255,0.8)" }}
                >
                  {profile.title}
                </div>
                <div
                  className="text-xl text-black/90 font-medium"
                  style={{ textShadow: "0 0 20px rgba(255,255,255,0.8)" }}
                >
                  {profile.location}
                </div>
                {profile.oneLiner && (
                  <div
                    className="text-lg text-black/90 mt-6 leading-relaxed max-w-2xl font-medium"
                    style={{ textShadow: "0 0 20px rgba(255,255,255,0.8)" }}
                  >
                    {profile.oneLiner}
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="pt-10 grid gap-6">
              {/* Education */}
              <div className="border-l-4 pl-6 py-2" style={{ borderColor: "rgba(0, 50, 98, 0.35)" }}>
                <div className="py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div
                      className="text-xl font-bold"
                      style={{ color: "#FDB515" }}
                    >
                      University of California, Berkeley
                    </div>
                  </div>
                  <div
                    className="mt-2 text-lg font-semibold"
                    style={{ color: "#003262" }}
                  >
                    B.S. in Computer Science
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpenKey(openKey === "education" ? "" : "education")
                  }
                  className="w-full py-1 flex items-center justify-between gap-4 text-left"
                >
                  <div
                    className="text-sm font-bold text-black"
                    style={{ textShadow: "0 0 15px rgba(255,255,255,0.8)" }}
                  >
                    Coursework
                  </div>
                  <div className="text-lg text-black/60 font-mono">
                    {openKey === "education" ? "−" : "+"}
                  </div>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openKey === "education" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <div
                      className="pt-1 pb-2 text-sm text-black/90 leading-relaxed"
                      style={{ textShadow: "0 0 15px rgba(255,255,255,0.8)" }}
                    >
                      Machine Learning, Computer Architecture, Data Structures,
                      Algorithms, Discrete Mathematics & Probability Theory,
                      Signals & Systems, Circuits & Devices, Linear Algebra,
                      Artificial Intelligence, Efficient Algorithms
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="border-l-4 pl-5 py-1" style={{ borderColor: "rgba(88, 60, 140, 0.3)" }}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenKey(openKey === "experience" ? "" : "experience")
                  }
                  className="w-full py-4 flex items-center justify-between gap-4 text-left"
                >
                  <div
                    className="text-xl font-bold text-black"
                    style={{ textShadow: "0 0 20px rgba(255,255,255,0.9)" }}
                  >
                    Experience
                  </div>
                  <div className="text-lg text-black/60 font-mono">
                    {openKey === "experience" ? "−" : "+"}
                  </div>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openKey === "experience" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <div className="pt-3 pb-4 space-y-6">
                      {experience.map((e, idx) => (
                        <div
                          key={idx}
                          className="pb-6 border-b-2 border-black/10 last:border-b-0"
                        >
                          <div className="flex items-start gap-4">
                            <img
                              src={e.logo}
                              alt={`${e.org} logo`}
                              className="flex-shrink-0 mt-1 rounded exp-logo"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline justify-between gap-3">
                                <div
                                  className="text-lg font-bold text-black"
                                  style={{
                                    textShadow:
                                      "0 0 20px rgba(255,255,255,0.9)",
                                  }}
                                >
                                  {e.org}
                                </div>
                                <div
                                  className="text-sm text-black/80 font-semibold"
                                  style={{
                                    textShadow:
                                      "0 0 15px rgba(255,255,255,0.8)",
                                  }}
                                >
                                  {e.where}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-baseline justify-between gap-3 mt-1">
                                <div
                                  className="text-base text-black/90 font-semibold"
                                  style={{
                                    textShadow:
                                      "0 0 15px rgba(255,255,255,0.8)",
                                  }}
                                >
                                  {e.role}
                                </div>
                                <div
                                  className="text-sm text-black/70 font-medium"
                                  style={{
                                    textShadow:
                                      "0 0 15px rgba(255,255,255,0.8)",
                                  }}
                                >
                                  {e.dates}
                                </div>
                              </div>
                              <p
                                className="mt-2 text-base text-black/85 leading-relaxed"
                                style={{
                                  textShadow: "0 0 15px rgba(255,255,255,0.8)",
                                }}
                              >
                                {e.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 flex gap-3 mobile-resume-buttons">
                        <a
                          href="/Srujan_Yamali_SWE_Resume_April_2026.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-3 text-black font-semibold rounded-lg transition-all resume-btn"
                        >
                          View Resume
                        </a>
                        <a
                          href="/Srujan_Yamali_SWE_Resume_April_2026.pdf"
                          download
                          className="flex-1 px-4 py-3 text-black font-semibold rounded-lg transition-all resume-btn"
                        >
                          Download Resume
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div className="border-l-4 pl-6 py-2" style={{ borderColor: "rgba(40, 140, 140, 0.3)" }}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenKey(openKey === "projects" ? "" : "projects")
                  }
                  className="w-full py-4 flex items-center justify-between gap-4 text-left"
                >
                  <div
                    className="text-xl font-bold text-black"
                    style={{ textShadow: "0 0 20px rgba(255,255,255,0.9)" }}
                  >
                    Projects
                  </div>
                  <div className="text-lg text-black/60 font-mono">
                    {openKey === "projects" ? "−" : "+"}
                  </div>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openKey === "projects" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <div className="pt-2 pb-4 project-list">
                      {projects.map((p, idx) => (
                        <article key={idx} className="project-card">
                          <header className="project-header">
                            <h3 className="project-title">{p.name}</h3>
                            <div className="project-links">
                              {p.github && (
                                <a
                                  href={p.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="project-link-icon"
                                  aria-label={`GitHub repository for ${p.name}`}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.41-1.27.74-1.56-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 2.9-.39c.98.01 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.26 5.69.42.36.79 1.08.79 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.68.8.56A11.52 11.52 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5Z"/>
                                  </svg>
                                </a>
                              )}
                              {p.website && (
                                <a
                                  href={p.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="project-link-icon"
                                  aria-label={`Website for ${p.name}`}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M7 17L17 7" />
                                    <path d="M8 7h9v9" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </header>
                          {p.tagline && (
                            <p className="project-tagline">{p.tagline}</p>
                          )}
                          {p.stack && (
                            <div className="project-stack">
                              {p.stack.split(",").map((t, i) => (
                                <span key={i} className="project-stack-pill">
                                  {t.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          {p.description && (
                            <p className="project-description">{p.description}</p>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Publications */}
              <div className="border-l-4 pl-6 py-2" style={{ borderColor: "rgba(60, 100, 160, 0.25)" }}>
                <button
                  type="button"
                  onClick={() => setOpenKey(openKey === "pubs" ? "" : "pubs")}
                  className="w-full py-4 flex items-center justify-between gap-4 text-left"
                >
                  <div
                    className="text-xl font-bold text-black"
                    style={{ textShadow: "0 0 20px rgba(255,255,255,0.9)" }}
                  >
                    Publications & Conferences
                  </div>
                  <div className="text-lg text-black/60 font-mono">
                    {openKey === "pubs" ? "−" : "+"}
                  </div>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openKey === "pubs" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <div className="pt-3 pb-4 space-y-5">
                      {publications.map((p, i) => (
                        <div
                          key={i}
                          className="pb-5 border-b-2 border-black/10 last:border-b-0"
                          style={{
                            textShadow: "0 0 15px rgba(255,255,255,0.8)",
                          }}
                        >
                          <div className="text-base font-semibold text-black leading-snug pub-title">
                            {p.title}
                          </div>
                          <div className="mt-1.5 text-sm text-black/70 leading-relaxed pub-authors">
                            {p.authors.map((a, j) => (
                              <span key={j}>
                                {j > 0 && ", "}
                                {a === "S. Yamali" ? (
                                  <span className="font-semibold" style={{ color: "rgba(88, 60, 140, 0.85)" }}>{a}</span>
                                ) : (
                                  a
                                )}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1 text-sm italic pub-venue" style={{ color: "rgba(60, 100, 160, 0.7)" }}>
                            {p.venue} — {p.location} ({p.year})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="pt-8 text-sm text-black font-medium border-t-2 border-black/20"
                style={{ textShadow: "0 0 15px rgba(255,255,255,0.8)" }}
              >
                <div>
                  © {new Date().getFullYear()} {profile.name}
                </div>
              </div>
            </div>
          </section>
        </main>

        <Modal
          open={modal === "experience"}
          title="Experience"
          onClose={closeModal}
        >
          <div className="space-y-6">
            {experience.map((e) => (
              <div
                key={e.org}
                className="pb-6 border-b border-black/10 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={e.logo}
                    alt={`${e.org} logo`}
                    className="flex-shrink-0 mt-1 rounded"
                    style={{
                      width: "36px",
                      height: "36px",
                      objectFit: "contain",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-sm font-bold text-black">
                        {e.org}
                      </div>
                      <div className="text-xs text-black/80 font-medium">
                        {e.where}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mt-1">
                      <div className="text-sm text-black/90 font-semibold">
                        {e.role}
                      </div>
                      <div className="text-xs text-black/70 font-medium">
                        {e.dates}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-black/85 leading-relaxed">
                      {e.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </div>
      {/* end site-content */}
    </div>
  );
}
