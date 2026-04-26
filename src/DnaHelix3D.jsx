// DnaHelix3D.jsx
//
// A guided 3D DNA hero. As the user scrolls, the helix rotates and different
// chapters (Education → Experience → Projects → Publications → Explore) light
// up in sequence. Only the rungs for the current chapter have labels; the rest
// are dim backdrop. Clicking any label opens the matching section below and
// scrolls to it.
//
// Perf: geometry is merged, label DOM is updated via batched cssText writes,
// projection runs every 2nd frame, particles are small, render loop pauses
// when tab is hidden or stage is out of view.

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/* ── Palette ── */
const NAVY   = "#003262";
const GOLD   = "#FDB515";
const PURPLE = "#583c8c";
const TEAL   = "#2d8f8f";
const PURPLE_DEEP = "#3a2a5c";

/* ── Rung data. Each rung is a real piece of work.
   `chapter` groups them — only the active chapter's rungs light up. */
const RUNGS = [
  { chapter: "edu",  label: "UC Berkeley",          sub: "B.S. Computer Science",          scrollTo: "#section-education",     color: NAVY,   accent: GOLD },

  { chapter: "exp",  label: "Visa",                 sub: "SWE Intern · LLM ops",           scrollTo: "#exp-visa",              color: PURPLE, accent: TEAL },
  { chapter: "exp",  label: "Mercor",               sub: "SWE · Applied AI",               scrollTo: "#exp-mercor",            color: TEAL,   accent: PURPLE },
  { chapter: "exp",  label: "CHOP · UPenn",         sub: "Data Science · Recomb.",         scrollTo: "#exp-chop",              color: PURPLE, accent: TEAL },
  { chapter: "exp",  label: "Cornell",              sub: "ML Eng · Behavior",              scrollTo: "#exp-cornell",           color: TEAL,   accent: PURPLE },
  { chapter: "exp",  label: "UDelaware",            sub: "SWE · Computer Vision",          scrollTo: "#exp-udel",              color: PURPLE, accent: TEAL },

  { chapter: "proj", label: "FlyFlirt",             sub: "Real-time CV pipeline",          scrollTo: "#proj-flyflirt",         color: TEAL,   accent: PURPLE },
  { chapter: "proj", label: "RedCarpet",            sub: "Genomic changepoints",           scrollTo: "#proj-redcarpet",        color: PURPLE, accent: TEAL },
  { chapter: "proj", label: "Sylor",                sub: "Agentic simulation",             scrollTo: "#proj-sylor",            color: TEAL,   accent: PURPLE },
  { chapter: "proj", label: "Stryda",               sub: "Dev-first automation",           scrollTo: "#proj-stryda",           color: PURPLE, accent: TEAL },
  { chapter: "proj", label: "Stryda iOS",           sub: "NFC tipping app",                scrollTo: "#proj-stryda-ios",       color: TEAL,   accent: PURPLE },

  { chapter: "pub",  label: "IBNGS 2024",           sub: "Drosophila courtship",           scrollTo: "#section-publications",  color: PURPLE, accent: TEAL },
  { chapter: "pub",  label: "HHMI Janelia 2024",    sub: "Sex-dimorphic circuits",         scrollTo: "#section-publications",  color: TEAL,   accent: PURPLE },
  { chapter: "pub",  label: "ISSSI Perth 2024",     sub: "RedCarpet · S. aureus",          scrollTo: "#section-publications",  color: PURPLE, accent: TEAL },
];

/* ── Chapter choreography ──
   Each chapter owns a slice of scroll progress. The helix rotates so that the
   chapter's rungs face the camera during its window. */
const CHAPTERS = [
  { key: "intro",   title: "",              hint: "scroll ↓",                       range: [0.00, 0.10] },
  { key: "edu",     title: "Education",     hint: "where it started",               range: [0.10, 0.25] },
  { key: "exp",     title: "Experience",    hint: "5 roles · research → industry",  range: [0.25, 0.45] },
  { key: "proj",    title: "Projects",      hint: "things I've built",              range: [0.45, 0.63] },
  { key: "pub",     title: "Publications",  hint: "3 conferences · 2024",           range: [0.63, 0.78] },
  { key: "explore", title: "Explore",       hint: "click any card to jump",         range: [0.78, 0.88] },
  { key: "exit",    title: "",              hint: "",                               range: [0.88, 1.00] },
];

/* Snap points — one per chapter. User's wheel advances to the next snap. */
const SNAP_POINTS = CHAPTERS.map((c) => c.range[0] + (c.range[1] - c.range[0]) * 0.5);

function chapterAt(p) {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (p >= CHAPTERS[i].range[0]) return CHAPTERS[i];
  }
  return CHAPTERS[0];
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* ── Target rotations so each chapter's rungs face the camera ──
   The helix has rungs evenly distributed in angle; we pre-compute the angle
   each chapter "should" sit at for comfortable reading. */
function chapterTargetRotation(key, rungAngles, rungChapters) {
  const idxs = rungChapters
    .map((c, i) => (c === key ? i : -1))
    .filter((i) => i >= 0);
  if (idxs.length === 0) return 0;
  // Pick middle rung of chapter
  const mid = idxs[Math.floor(idxs.length / 2)];
  // Target: rotate so that rung angle faces camera (i.e. ends up at angle π/2 in world space)
  return Math.PI / 2 - rungAngles[mid];
}

export default function DnaHelix3D({ onExitRequest, onRungClick }) {
  const zoneRef    = useRef(null);
  const canvasRef  = useRef(null);
  const labelsRef  = useRef(null);
  const nameRef    = useRef(null);
  const chapterTitleRef = useRef(null);
  const chapterHintRef  = useRef(null);
  const scrubberDotsRef = useRef(null);
  const scrollPct  = useRef(0);
  const scrollPctS = useRef(0);

  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 900 : false,
  );

  const onRungClickRef = useRef(onRungClick);
  useEffect(() => { onRungClickRef.current = onRungClick; }, [onRungClick]);

  useEffect(() => {
    const r = () => setMobile(window.innerWidth < 900);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  /* ── Three.js setup ── */
  useEffect(() => {
    if (mobile) return;
    const canvas = canvasRef.current;
    const labels = labelsRef.current;
    const zone   = zoneRef.current;
    if (!canvas || !labels || !zone) return;

    const stageEl = zone.querySelector(".dna3d-stage");

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff, 0);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      42, window.innerWidth / window.innerHeight, 0.1, 200,
    );
    camera.position.set(0, 0, 13);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const onScroll = () => {
      const rect = zone.getBoundingClientRect();
      const total = zone.offsetHeight - window.innerHeight;
      const y = -rect.top;
      scrollPct.current = Math.max(0, Math.min(1, y / Math.max(1, total)));

      const outOfView = rect.bottom < 40 || rect.top > window.innerHeight;
      if (stageEl) {
        // Fully out of view — hard hide. Otherwise let render loop control opacity.
        if (outOfView) stageEl.classList.add("dna3d-stage-hidden");
        else stageEl.classList.remove("dna3d-stage-hidden");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ── Chapter snap scrolling ──
       Each wheel/touch/key gesture advances one chapter. Prevents the "slide
       through everything" feeling — every scroll lands on a meaningful frame. */
    let snapLock = false;
    const unlockSnap = () => { snapLock = false; };

    const scrollToSnap = (snapIdx) => {
      const zoneTop = zone.offsetTop;
      const zoneH = zone.offsetHeight - window.innerHeight;
      const clamped = Math.max(0, Math.min(SNAP_POINTS.length - 1, snapIdx));
      const target = zoneTop + SNAP_POINTS[clamped] * zoneH;
      snapLock = true;
      window.scrollTo({ top: target, behavior: "smooth" });
      // Release lock once scrolling settles
      clearTimeout(scrollToSnap._t);
      scrollToSnap._t = setTimeout(unlockSnap, 700);
    };

    const currentSnapIndex = () => {
      const p = scrollPct.current;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < SNAP_POINTS.length; i++) {
        const d = Math.abs(p - SNAP_POINTS[i]);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return best;
    };

    let wheelAccum = 0;
    const onWheel = (e) => {
      // Only intercept when the DNA stage is the active view
      const rect = zone.getBoundingClientRect();
      const active = rect.top <= 10 && rect.bottom > window.innerHeight - 10;
      if (!active) return;
      // Past the last snap? Let native scroll take over (so user lands on classic content)
      const idx = currentSnapIndex();
      if (e.deltaY > 0 && idx === SNAP_POINTS.length - 1) return;
      if (e.deltaY < 0 && idx === 0 && scrollPct.current < 0.01) return;

      e.preventDefault();
      if (snapLock) return;
      wheelAccum += e.deltaY;
      if (Math.abs(wheelAccum) < 30) return;
      const dir = wheelAccum > 0 ? 1 : -1;
      wheelAccum = 0;
      scrollToSnap(idx + dir);
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    let touchStartY = 0;
    const onTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      const rect = zone.getBoundingClientRect();
      const active = rect.top <= 10 && rect.bottom > window.innerHeight - 10;
      if (!active || snapLock) return;
      const dy = touchStartY - e.touches[0].clientY;
      if (Math.abs(dy) < 40) return;
      const idx = currentSnapIndex();
      if (dy > 0 && idx === SNAP_POINTS.length - 1) return;
      if (dy < 0 && idx === 0 && scrollPct.current < 0.01) return;
      e.preventDefault();
      touchStartY = e.touches[0].clientY;
      scrollToSnap(idx + (dy > 0 ? 1 : -1));
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    const onKey = (e) => {
      const rect = zone.getBoundingClientRect();
      const active = rect.top <= 10 && rect.bottom > window.innerHeight - 10;
      if (!active || snapLock) return;
      const idx = currentSnapIndex();
      if ((e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") && idx < SNAP_POINTS.length - 1) {
        e.preventDefault(); scrollToSnap(idx + 1);
      } else if ((e.key === "ArrowUp" || e.key === "PageUp") && idx > 0) {
        e.preventDefault(); scrollToSnap(idx - 1);
      }
    };
    window.addEventListener("keydown", onKey);

    /* ── Geometry ── */
    const dna = new THREE.Group();
    scene.add(dna);

    const BP = RUNGS.length;
    const H = 9.2;
    const R = 1.25;
    const TWIST = Math.PI * 2.0;

    /* Strands — fewer segments (perf) */
    function makeStrand(phaseOffset, mat) {
      const pts = [];
      const SEG = 48;
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const y = (t - 0.5) * H;
        const a = t * TWIST + phaseOffset;
        pts.push(new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R));
      }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    }

    const strandMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(PURPLE_DEEP),
      transparent: true, opacity: 0.55,
    });
    const strandA = makeStrand(0, strandMat);
    const strandB = makeStrand(Math.PI, strandMat);
    dna.add(strandA, strandB);

    /* Precompute rung positions & angles */
    const rungAngles = [];
    const rungChapters = [];
    const rungsData = [];
    for (let i = 0; i < BP; i++) {
      const t = i / (BP - 1);
      const y = (t - 0.5) * H;
      const a = t * TWIST;
      rungAngles.push(a);
      rungChapters.push(RUNGS[i].chapter);

      const pL = new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R);
      const pR = new THREE.Vector3(Math.cos(a + Math.PI) * R, y, Math.sin(a + Math.PI) * R);
      rungsData.push({ y, a, pL, pR, def: RUNGS[i] });
    }

    /* Rung lines — batched as one geometry for perf */
    const rungLinePts = [];
    const rungLineColors = [];
    const tmpColor = new THREE.Color();
    rungsData.forEach((r) => {
      rungLinePts.push(r.pL.x, r.pL.y, r.pL.z, r.pR.x, r.pR.y, r.pR.z);
      tmpColor.set(r.def.color);
      // two vertices per rung
      rungLineColors.push(tmpColor.r, tmpColor.g, tmpColor.b, tmpColor.r, tmpColor.g, tmpColor.b);
    });
    const rungLineGeo = new THREE.BufferGeometry();
    rungLineGeo.setAttribute("position", new THREE.Float32BufferAttribute(rungLinePts, 3));
    rungLineGeo.setAttribute("color", new THREE.Float32BufferAttribute(rungLineColors, 3));
    const rungLineMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.5,
    });
    const rungLines = new THREE.LineSegments(rungLineGeo, rungLineMat);
    dna.add(rungLines);

    /* Per-rung node meshes (still one sphere each, but all share one geometry) */
    const nodeGeo = new THREE.SphereGeometry(0.11, 8, 8);
    const nodes = []; // per rung: { left, right, matL, matR }
    rungsData.forEach((r) => {
      const matL = new THREE.MeshBasicMaterial({
        color: new THREE.Color(r.def.color),
        transparent: true, opacity: 0.35,
      });
      const matR = new THREE.MeshBasicMaterial({
        color: new THREE.Color(r.def.accent || r.def.color),
        transparent: true, opacity: 0.35,
      });
      const left  = new THREE.Mesh(nodeGeo, matL);
      const right = new THREE.Mesh(nodeGeo, matR);
      left.position.copy(r.pL).multiplyScalar(0.72);  left.position.y = r.y;
      right.position.copy(r.pR).multiplyScalar(0.72); right.position.y = r.y;
      dna.add(left, right);
      nodes.push({ left, right, matL, matR });
    });

    /* Phosphate beads — merged single Points object for perf */
    const phosPts = [];
    rungsData.forEach((r) => {
      phosPts.push(r.pL.x, r.pL.y, r.pL.z);
      phosPts.push(r.pR.x, r.pR.y, r.pR.z);
    });
    const phosGeo = new THREE.BufferGeometry();
    phosGeo.setAttribute("position", new THREE.Float32BufferAttribute(phosPts, 3));
    const phosMat = new THREE.PointsMaterial({
      color: new THREE.Color(TEAL),
      size: 0.12, transparent: true, opacity: 0.7,
      sizeAttenuation: true,
    });
    const phosPoints = new THREE.Points(phosGeo, phosMat);
    dna.add(phosPoints);

    /* Caps */
    const capMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(GOLD), transparent: true, opacity: 0.7 });
    const capGeo = new THREE.SphereGeometry(0.22, 10, 10);
    const capTop = new THREE.Mesh(capGeo, capMat);
    const capBot = new THREE.Mesh(capGeo, capMat);
    capTop.position.y =  H / 2 + 0.55;
    capBot.position.y = -H / 2 - 0.55;
    dna.add(capTop, capBot);

    /* Dust removed — was barely visible and cost a draw call per frame. */

    /* Pre-compute chapter target rotations */
    const chapterRots = {};
    for (const ch of CHAPTERS) {
      chapterRots[ch.key] = chapterTargetRotation(ch.key, rungAngles, rungChapters);
    }
    chapterRots.intro   = 0;
    chapterRots.exit    = chapterRots.pub || 0;
    chapterRots.explore = Math.PI * 0.5; // face camera for break-apart

    /* ── Build label DOM (once) ── */
    labels.innerHTML = "";
    const labelEls = rungsData.map((r) => {
      if (!r.def.scrollTo) return null;
      const el = document.createElement("a");
      el.className = "dna3d-label";
      el.href = r.def.scrollTo;
      el.style.willChange = "transform, opacity";
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof onRungClickRef.current === "function") {
          onRungClickRef.current(r.def.scrollTo);
        }
        setTimeout(() => {
          const tgt = document.querySelector(r.def.scrollTo);
          if (tgt) tgt.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 140);
      });
      const tick = document.createElement("span");
      tick.className = "dna3d-label-tick";
      tick.style.background = r.def.color;
      const title = document.createElement("span");
      title.className = "dna3d-label-title";
      title.textContent = r.def.label;
      title.style.color = r.def.accent || r.def.color;
      const sub = document.createElement("span");
      sub.className = "dna3d-label-sub";
      sub.textContent = r.def.sub || "";
      el.append(tick, title, sub);
      labels.appendChild(el);
      return el;
    });

    /* Cache last values so we only touch DOM when something changed.
       Skipping dom writes that don't change anything = massive perf win. */
    const labelState = labelEls.map(() => ({ x: 0, y: 0, op: 0, visible: false }));

    /* Build scrubber dots (chapter progress) */
    if (scrubberDotsRef.current) {
      scrubberDotsRef.current.innerHTML = "";
      CHAPTERS.filter((c) => c.title).forEach((c) => {
        const d = document.createElement("div");
        d.className = "dna3d-scrubber-dot";
        d.dataset.chapter = c.key;
        d.title = c.title;
        d.addEventListener("click", () => {
          const idx = CHAPTERS.findIndex((x) => x.key === c.key);
          if (idx >= 0) scrollToSnap(idx);
        });
        scrubberDotsRef.current.appendChild(d);
      });
    }

    /* ── Render loop ── */
    const clock = new THREE.Clock();
    const _v = new THREE.Vector3();
    const _m = new THREE.Matrix4();
    let raf = 0;
    let frameCount = 0;
    let currentRotY = 0;
    let currentCamX = 0;
    let currentCamZ = 13;
    let lastRender = 0;
    let idleCounter = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      if (document.hidden) return;
      if (stageEl && stageEl.classList.contains("dna3d-stage-hidden")) {
        clock.getDelta();
        return;
      }

      // If nothing moved this frame, skip render entirely. Otherwise throttle to
      // 20fps once scroll has truly settled. Free GPU budget when idle.
      const scrollDelta = Math.abs(scrollPct.current - scrollPctS.current);
      const now = performance.now();
      const converged = scrollDelta < 0.0003;
      if (converged) idleCounter++; else idleCounter = 0;
      // Aggressive idle: after ~0.5s of no scroll, drop to 20fps
      if (idleCounter > 30 && now - lastRender < 50) return;
      lastRender = now;

      frameCount++;
      const dt = Math.min(0.05, clock.getDelta());
      const t  = clock.getElapsedTime();

      /* Smooth scroll progress — fast enough to settle within a single snap duration */
      scrollPctS.current += (scrollPct.current - scrollPctS.current) * 0.22;
      const p = scrollPctS.current;
      const chapter = chapterAt(p);
      const pExplore = smoothstep(0.78, 0.86, p) - smoothstep(0.86, 0.92, p);
      const pDissolve = smoothstep(0.88, 1.0, p);

      /* Stage-wide fade on exit so the hand-off into the classic header is
         seamless (no pop). By the time user hits the classic hero below, the
         whole DNA stage has already faded to 0. */
      const stageOp = 1 - smoothstep(0.90, 1.0, p);
      if (stageEl && stageEl._op !== stageOp) {
        stageEl.style.opacity = stageOp;
        stageEl._op = stageOp;
      }

      /* Intro name visibility — fully gone by 10% */
      if (nameRef.current) {
        const op = 1 - smoothstep(0.02, 0.10, p);
        const prev = nameRef.current._op;
        if (prev !== op) {
          nameRef.current.style.opacity = op;
          nameRef.current._op = op;
        }
        const offset = p * 40;
        const prevY = nameRef.current._offy;
        if (prevY !== offset) {
          nameRef.current.style.transform = `translate(-50%, calc(-50% - ${offset}px))`;
          nameRef.current._offy = offset;
        }
      }

      /* Chapter title update — fade in the chapter panel only during chapter phases */
      const chapterPanelEl = chapterTitleRef.current && chapterTitleRef.current.parentElement;
      if (chapterPanelEl) {
        const panelOp = chapter.key === "intro" ? 0 : (1 - pDissolve);
        if (chapterPanelEl._op !== panelOp) {
          chapterPanelEl.style.opacity = panelOp;
          chapterPanelEl._op = panelOp;
        }
      }
      if (chapterTitleRef.current && chapterTitleRef.current._key !== chapter.key) {
        chapterTitleRef.current._key = chapter.key;
        chapterTitleRef.current.textContent = chapter.title || "";
      }
      if (chapterHintRef.current && chapterHintRef.current._key !== chapter.key) {
        chapterHintRef.current._key = chapter.key;
        chapterHintRef.current.textContent = chapter.hint || "";
      }
      /* Scrubber */
      if (scrubberDotsRef.current) {
        for (const d of scrubberDotsRef.current.children) {
          const active = d.dataset.chapter === chapter.key;
          if (d._active !== active) {
            d._active = active;
            d.classList.toggle("dna3d-scrubber-dot-active", active);
          }
        }
      }

      /* Camera: sit off-center during chapter phases so left side has room for text.
         Center + pull back during intro/explore/exit. */
      let targetCamX = -2.3;
      let targetCamZ = 11;
      let targetFov  = 44;
      if (chapter.key === "intro") { targetCamX = 0;   targetCamZ = 13; }
      if (chapter.key === "explore") { targetCamX = 0; targetCamZ = 14; }
      if (chapter.key === "exit")    { targetCamX = 0; targetCamZ = 22; }

      currentCamX += (targetCamX - currentCamX) * 0.12;
      currentCamZ += (targetCamZ - currentCamZ) * 0.12;
      camera.position.x = currentCamX;
      camera.position.y = 0;
      camera.position.z = currentCamZ;
      camera.lookAt(-currentCamX * 0.55, 0, 0);

      /* Helix target rotation: face the active chapter toward camera */
      const targetRot = chapterRots[chapter.key] || 0;
      currentRotY += (targetRot - currentRotY) * 0.10;
      dna.rotation.y = currentRotY;
      dna.rotation.x = -0.08;

      /* Helix Y position — shift down during chapter phases so the focused rung
         sits vertically centered. Within chapter, interpolate across its rungs. */
      const focused = rungsData
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.def.chapter === chapter.key);
      let targetDnaY = 0;
      if (focused.length > 0 && chapter.key !== "intro" && chapter.key !== "explore" && chapter.key !== "exit") {
        // Progress inside the chapter
        const c = chapter.range;
        const ip = smoothstep(c[0], c[1], p);
        const idxFloat = ip * (focused.length - 1);
        const idx = Math.max(0, Math.min(focused.length - 1, Math.round(idxFloat)));
        const activeRung = focused[idx].r;
        targetDnaY = -activeRung.y;
      }
      dna.position.y += (targetDnaY - dna.position.y) * 0.12;

      /* Explore phase — break apart */
      strandA.position.x =  1.2 * pExplore;
      strandB.position.x = -1.2 * pExplore;
      phosPoints.position.x = 0;
      rungLineMat.opacity = (0.5 + 0.3 * pExplore) * (1 - pDissolve);
      strandMat.opacity   = (0.55)                 * (1 - pDissolve);

      /* Per-rung node opacity: dim by default, bright if in active chapter */
      for (let i = 0; i < rungsData.length; i++) {
        const r = rungsData[i];
        const isActive = r.def.chapter === chapter.key;
        const targetOp = pExplore > 0.01
          ? 0.95
          : isActive ? 0.95 : 0.22;
        const cur = nodes[i].matL.opacity;
        const next = cur + (targetOp * (1 - pDissolve) - cur) * 0.12;
        nodes[i].matL.opacity = next;
        nodes[i].matR.opacity = next;
      }

      /* Caps: static opacity — skip per-frame write */
      if (capMat._pdiss !== pDissolve) {
        capMat.opacity = 0.75 * (1 - pDissolve);
        capMat._pdiss = pDissolve;
      }

      /* Label projection — every 2nd frame normally; every frame during transitions;
         skip entirely when scene has fully settled (labels were already placed). */
      const doLabels = idleCounter < 10 && ((frameCount % 2 === 0) || chapter.key === "explore" || pExplore > 0.01);
      if (doLabels) {
        const w2 = window.innerWidth;
        const h2 = window.innerHeight;
        dna.updateMatrixWorld();
        _m.copy(dna.matrixWorld);

        for (let i = 0; i < rungsData.length; i++) {
          const el = labelEls[i];
          if (!el) continue;
          const r = rungsData[i];
          const isActive = r.def.chapter === chapter.key;

          // Show when chapter is active, or during explore
          let baseVis = 0;
          if (isActive) baseVis = smoothstep(chapter.range[0], chapter.range[0] + 0.04, p);
          if (pExplore > 0.01) baseVis = Math.max(baseVis, pExplore);
          baseVis *= (1 - pDissolve);

          if (baseVis < 0.01) {
            // hide — only touch DOM if state changed
            const st = labelState[i];
            if (st.visible) {
              el.style.opacity = "0";
              el.style.pointerEvents = "none";
              el.style.transform = "translate3d(-9999px,-9999px,0)";
              st.visible = false;
              st.op = 0;
            }
            continue;
          }

          /* Pick which end of the rung to label — alternate sides */
          const useLeft = (i % 2 === 0);
          _v.copy(useLeft ? r.pL : r.pR).applyMatrix4(_m).project(camera);
          const inFront = _v.z < 1;
          if (!inFront) {
            const st = labelState[i];
            if (st.visible) {
              el.style.opacity = "0";
              el.style.pointerEvents = "none";
              st.visible = false;
            }
            continue;
          }
          const x = (_v.x * 0.5 + 0.5) * w2;
          const y = (-_v.y * 0.5 + 0.5) * h2;

          // Chapter panel occupies left ~520px vertically-centered. During chapter
          // phases, force any label whose natural position would end up in or
          // near the panel column to land safely to its right.
          const chapterPanelWidth = 520;
          const chapterRowTop = h2 * 0.5 - 170;
          const chapterRowBot = h2 * 0.5 + 170;
          const inPanelRow = y > chapterRowTop && y < chapterRowBot;
          // Also block if the label, after its normal L-side push, would land
          // inside the panel.
          const wouldPushLeftInto = x < chapterPanelWidth + 180;
          const mustGoRight =
            chapter.key !== "explore" && chapter.key !== "intro" &&
            inPanelRow && wouldPushLeftInto;

          const onLeft = mustGoRight ? false : x < w2 * 0.5;
          const pushX = onLeft ? -80 : 80;
          let finalX = x + pushX;
          // Clamp labels to stay right of the chapter panel column
          if (mustGoRight) finalX = Math.max(finalX, chapterPanelWidth);
          // Keep labels on screen
          finalX = Math.max(20, Math.min(w2 - 20, finalX));
          const finalY = Math.max(40, Math.min(h2 - 40, y));

          const st = labelState[i];
          const opNorm = Math.round(baseVis * 100) / 100;

          // Only write to DOM when values have actually changed meaningfully
          if (Math.abs(st.x - finalX) > 0.5 || Math.abs(st.y - finalY) > 0.5) {
            const anchor = onLeft ? "translate(-100%,-50%)" : "translate(0,-50%)";
            el.style.transform = `translate3d(${finalX.toFixed(1)}px,${finalY.toFixed(1)}px,0) ${anchor}`;
            st.x = finalX; st.y = finalY;
            if (st.side !== (onLeft ? "L" : "R")) {
              el.dataset.side = onLeft ? "L" : "R";
              st.side = onLeft ? "L" : "R";
            }
          }
          if (st.op !== opNorm) {
            el.style.opacity = opNorm;
            el.style.pointerEvents = opNorm > 0.5 ? "auto" : "none";
            st.op = opNorm;
          }
          if (!st.visible) st.visible = true;
        }
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      labels.innerHTML = "";
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [mobile]);

  /* ── Reduced-motion / mobile fallback ── */
  const reduced = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  if (reduced || mobile) {
    return (
      <section className="dna3d-fallback" aria-label="Srujan Yamali — Hero">
        <h1 className="dna3d-fallback-name">Srujan Yamali</h1>
        <p className="dna3d-fallback-title">Software Engineer · AI / ML</p>
        <div className="dna3d-fallback-grid">
          {RUNGS.map((r) => (
            <a
              key={r.label}
              href={r.scrollTo}
              onClick={(e) => {
                e.preventDefault();
                if (typeof onRungClick === "function") onRungClick(r.scrollTo);
                setTimeout(() => {
                  const tgt = document.querySelector(r.scrollTo);
                  if (tgt) tgt.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 140);
              }}
              className="dna3d-fallback-card"
              style={{ borderLeftColor: r.accent || r.color }}
            >
              <span className="dna3d-fallback-dot" style={{ background: r.color }} />
              <span className="dna3d-fallback-card-title" style={{ color: r.accent || r.color }}>
                {r.label}
              </span>
              <span className="dna3d-fallback-card-sub">{r.sub}</span>
            </a>
          ))}
        </div>
        <button className="dna3d-archive-btn dna3d-archive-btn-inline" onClick={onExitRequest}>
          Switch to classic hero →
        </button>
      </section>
    );
  }

  return (
    <section ref={zoneRef} className="dna3d-zone" aria-label="Srujan Yamali — Hero">
      <div className="dna3d-stage">
        <canvas ref={canvasRef} className="dna3d-canvas" aria-hidden="true" />

        {/* Name — visible only during intro */}
        <div ref={nameRef} className="dna3d-name">
          <h1 className="dna3d-name-title">
            <span>Srujan</span>
            <span className="dna3d-name-last">Yamali</span>
          </h1>
          <p className="dna3d-name-sub">Software Engineer · AI / ML</p>
        </div>

        {/* Chapter panel — left side */}
        <div className="dna3d-chapter">
          <div className="dna3d-chapter-eyebrow">—  Chapter</div>
          <h2 ref={chapterTitleRef} className="dna3d-chapter-title"></h2>
          <p ref={chapterHintRef} className="dna3d-chapter-hint"></p>
        </div>

        {/* Scrubber — chapter dots, vertical */}
        <nav className="dna3d-scrubber" aria-label="Jump to chapter">
          <div ref={scrubberDotsRef} className="dna3d-scrubber-dots" />
          <div className="dna3d-scrubber-line" />
        </nav>

        {/* Floating labels */}
        <div ref={labelsRef} className="dna3d-labels" aria-hidden="false" />

        {/* Skip-to-resume shortcut */}
        <button
          className="dna3d-skip-btn"
          onClick={() => {
            const main = document.querySelector("main");
            if (main) main.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          aria-label="Skip to resume"
        >
          Skip to resume ↓
        </button>
      </div>
    </section>
  );
}
