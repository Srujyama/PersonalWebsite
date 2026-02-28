// IntroAnimation.jsx
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * IntroAnimation — Loads stipple JSON, animates dots:
 *   1. Dots start scattered randomly
 *   2. Assemble into the stippled fly eye image
 *   3. Hold briefly
 *   4. Dots disperse outward with flowing physics
 *   5. Fade out → callback to show main site
 *
 * Props:
 *   - jsonPath: path to the stipple JSON (e.g. "/fly_stipple.json")
 *   - onComplete: called when intro is done
 *   - skipDelay: ms before "skip" hint appears (default 2000)
 */

// Easing functions
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function easeInCubic(t) {
    return t * t * t;
}

export default function IntroAnimation({ jsonPath = "/fly_stipple.json", onComplete }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const stateRef = useRef({
        phase: "loading", // loading → assembling → holding → dispersing → done
        dots: [],
        time: 0,
        opacity: 1,
        imageAspect: 1,
    });
    const [showSkip, setShowSkip] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const completedRef = useRef(false);

    const finish = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        setFadeOut(true);
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 600);
    }, [onComplete]);

    useEffect(() => {
        const timer = setTimeout(() => setShowSkip(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let w, h, dpr;
        const state = stateRef.current;

        // Timing constants (in seconds)
        const ASSEMBLE_DURATION = 2.5;
        const HOLD_DURATION = 1.2;
        const DISPERSE_DURATION = 2.0;
        const FADE_DURATION = 0.8;

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

        // Load stipple data
        fetch(jsonPath)
            .then((r) => r.json())
            .then((data) => {
                const isMobile = window.innerWidth < 768;

                // Support both formats:
                //   Compact: { w, h, n, d: [[x,y,r], ...] }
                //   Program: { width, height, dotCount, dots: [{x,y,r}, ...] }
                const imgOrigW = data.w || data.width;
                const imgOrigH = data.h || data.height;
                const rawDots = data.d || data.dots;

                const aspect = imgOrigW / imgOrigH;
                state.imageAspect = aspect;

                // Calculate image render size (centered on screen)
                const maxSize = isMobile
                    ? Math.min(w * 0.75, h * 0.55)
                    : Math.min(w * 0.45, h * 0.6);
                const imgW = aspect >= 1 ? maxSize : maxSize * aspect;
                const imgH = aspect >= 1 ? maxSize / aspect : maxSize;
                const offX = (w - imgW) / 2;
                const offY = (h - imgH) / 2;

                // Subsample dots on mobile for performance
                let dotData = rawDots;
                if (isMobile && dotData.length > 5000) {
                    const step = Math.ceil(dotData.length / 5000);
                    dotData = dotData.filter((_, i) => i % step === 0);
                }

                // Normalize each dot to [x, y, r] regardless of input format
                const normalized = dotData.map((d) => {
                    if (Array.isArray(d)) return d; // already [x, y, r]
                    return [d.x, d.y, d.r];         // convert {x, y, r}
                });

                // Initialize dots
                const dots = normalized.map(([nx, ny, r]) => {
                    // Target position (where the dot goes to form the image)
                    const tx = offX + nx * imgW;
                    const ty = offY + ny * imgH;

                    // Start position: scattered from center outward
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 200 + Math.random() * Math.max(w, h) * 0.6;
                    const sx = w / 2 + Math.cos(angle) * dist;
                    const sy = h / 2 + Math.sin(angle) * dist;

                    // Disperse end position: fly outward
                    const disperseAngle = Math.atan2(ty - h / 2, tx - w / 2) + (Math.random() - 0.5) * 1.2;
                    const disperseDist = 300 + Math.random() * Math.max(w, h) * 0.8;
                    const dx = tx + Math.cos(disperseAngle) * disperseDist;
                    const dy = ty + Math.sin(disperseAngle) * disperseDist;

                    // Stagger: dots closer to center assemble first
                    const distFromCenter = Math.sqrt(
                        (nx - 0.5) ** 2 + (ny - 0.5) ** 2
                    );
                    const stagger = distFromCenter * 0.4 + Math.random() * 0.15;

                    const scale = isMobile ? 0.7 : 1.0;

                    return {
                        sx, sy,       // start
                        tx, ty,       // target (image)
                        dx, dy,       // disperse end
                        x: sx, y: sy, // current
                        r: r * scale * (isMobile ? 1.8 : 2.2),
                        stagger,
                        disperseDelay: Math.random() * 0.3,
                    };
                });

                state.dots = dots;
                state.phase = "assembling";
                state.time = 0;
            })
            .catch((err) => {
                console.error("Failed to load stipple data:", err);
                finish();
            });

        let lastTime = performance.now();

        function draw(now) {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            state.time += dt;

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);

            const dots = state.dots;
            if (!dots.length) {
                animRef.current = requestAnimationFrame(draw);
                return;
            }

            const t = state.time;

            if (state.phase === "assembling") {
                // Dots fly from scattered positions to image positions
                for (const d of dots) {
                    const localT = Math.max(0, Math.min(1,
                        (t - d.stagger * ASSEMBLE_DURATION * 0.5) / (ASSEMBLE_DURATION * 0.7)
                    ));
                    const ease = easeOutQuart(localT);
                    d.x = d.sx + (d.tx - d.sx) * ease;
                    d.y = d.sy + (d.ty - d.sy) * ease;
                }

                if (t >= ASSEMBLE_DURATION) {
                    // Snap to target
                    for (const d of dots) { d.x = d.tx; d.y = d.ty; }
                    state.phase = "holding";
                    state.time = 0;
                }
            } else if (state.phase === "holding") {
                for (const d of dots) { d.x = d.tx; d.y = d.ty; }

                if (t >= HOLD_DURATION) {
                    state.phase = "dispersing";
                    state.time = 0;
                }
            } else if (state.phase === "dispersing") {
                for (const d of dots) {
                    const localT = Math.max(0, Math.min(1,
                        (t - d.disperseDelay) / (DISPERSE_DURATION * 0.9)
                    ));
                    const ease = easeInCubic(localT);
                    d.x = d.tx + (d.dx - d.tx) * ease;
                    d.y = d.ty + (d.dy - d.ty) * ease;
                }

                // Overall fade out
                state.opacity = Math.max(0, 1 - easeInCubic(t / DISPERSE_DURATION));

                if (t >= DISPERSE_DURATION) {
                    state.phase = "done";
                    finish();
                }
            }

            // Draw dots
            ctx.globalAlpha = state.opacity;
            ctx.fillStyle = "#000000";
            for (const d of dots) {
                // Skip off-screen dots
                if (d.x < -50 || d.x > w + 50 || d.y < -50 || d.y > h + 50) continue;

                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fill();
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
    }, [jsonPath, finish]);

    return (
        <div
            className="fixed inset-0 z-[100]"
            style={{
                opacity: fadeOut ? 0 : 1,
                transition: "opacity 0.6s ease",
                cursor: "pointer",
            }}
            onClick={finish}
        >
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0"
                style={{ width: "100vw", height: "100vh" }}
            />
            {showSkip && !fadeOut && (
                <div
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[101]"
                    style={{
                        animation: "fadeInUp 0.5s ease",
                    }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); finish(); }}
                        style={{
                            background: "none",
                            border: "1px solid rgba(0,0,0,0.2)",
                            borderRadius: "20px",
                            padding: "8px 24px",
                            color: "rgba(0,0,0,0.4)",
                            fontSize: "13px",
                            cursor: "pointer",
                            backdropFilter: "blur(8px)",
                            fontWeight: 500,
                            letterSpacing: "0.02em",
                        }}
                    >
                        tap to skip
                    </button>
                </div>
            )}
        </div>
    );
}
