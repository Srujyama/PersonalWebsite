// Cursor.jsx — SmoothCursor, ported from the Framer module
// (framer.com/m/Smoothcursor-o8zdlR.js): a springy arrow pointer that
// rotates to face its direction of travel, squishes slightly while moving
// and squashes down on click.
// Kept from the previous cursor: pointer:fine + prefers-reduced-motion
// gating, touch-safe pointer-event filtering, and hiding the native cursor
// only once the custom one is actually visible.
import { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "motion/react";

const CURSOR_SIZE = 40;

function CursorArrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 50 54"
      fill="none"
    >
      <g filter="url(#sc_shadow)">
        <path
          d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
          fill="black"
        />
        <path
          d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
          stroke="white"
          strokeWidth="2.25825"
        />
      </g>
      <defs>
        <filter
          id="sc_shadow"
          x="0.602397"
          y="0.952444"
          width="49.0584"
          height="52.428"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2.25825" />
          <feGaussianBlur stdDeviation="2.25825" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  const cursorX = useSpring(-100, { stiffness: 400, damping: 45, mass: 1 });
  const cursorY = useSpring(-100, { stiffness: 400, damping: 45, mass: 1 });
  const rotation = useSpring(0, { stiffness: 300, damping: 60 });
  const scale = useSpring(1, { stiffness: 500, damping: 35 });

  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastUpdateTime = useRef(0);
  const previousAngle = useRef(0);
  const accumulatedRotation = useRef(0);
  const isMouseDown = useRef(false);
  const squishTimeout = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduced.matches);
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  // Hide the native cursor only while the custom one is actually shown.
  useEffect(() => {
    document.documentElement.classList.toggle(
      "has-custom-cursor",
      enabled && visible,
    );
    return () => document.documentElement.classList.remove("has-custom-cursor");
  }, [enabled, visible]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e) => {
      if (e.pointerType !== "mouse") return;
      const now = performance.now();
      const dt = now - lastUpdateTime.current;
      const pos = { x: e.clientX, y: e.clientY };

      cursorX.set(pos.x);
      cursorY.set(pos.y);
      setVisible(true);

      if (dt > 0 && lastUpdateTime.current > 0) {
        const vx = (pos.x - lastMousePos.current.x) / dt;
        const vy = (pos.y - lastMousePos.current.y) / dt;
        const speed = Math.hypot(vx, vy);

        if (speed > 0.1) {
          // Rotate the arrow to face the direction of travel, accumulating
          // past ±180° so the spring never takes the long way around.
          const currentAngle = Math.atan2(vy, vx) * (180 / Math.PI) + 90;
          let angleDiff = currentAngle - previousAngle.current;
          if (angleDiff > 180) angleDiff -= 360;
          if (angleDiff < -180) angleDiff += 360;
          accumulatedRotation.current += angleDiff;
          rotation.set(accumulatedRotation.current);
          previousAngle.current = currentAngle;

          if (!isMouseDown.current) {
            scale.set(0.95);
            clearTimeout(squishTimeout.current);
            squishTimeout.current = setTimeout(() => {
              if (!isMouseDown.current) scale.set(1);
            }, 150);
          }
        }
      }
      lastUpdateTime.current = now;
      lastMousePos.current = pos;
    };

    const onDown = (e) => {
      if (e.pointerType !== "mouse") {
        setVisible(false); // switched to touch — hide the stranded cursor
        return;
      }
      isMouseDown.current = true;
      scale.set(0.7);
    };
    const onUp = (e) => {
      if (e.pointerType !== "mouse") return;
      isMouseDown.current = false;
      scale.set(1);
    };
    const onOut = (e) => {
      if (e.pointerType !== "mouse") return;
      if (!e.relatedTarget) {
        isMouseDown.current = false;
        setVisible(false);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerout", onOut);
      clearTimeout(squishTimeout.current);
    };
  }, [enabled, cursorX, cursorY, rotation, scale]);

  if (!enabled) return null;

  return (
    <motion.div
      className="cursor-layer smooth-cursor"
      aria-hidden="true"
      style={{
        x: cursorX,
        y: cursorY,
        rotate: rotation,
        scale,
        width: CURSOR_SIZE,
        height: CURSOR_SIZE,
        marginLeft: -CURSOR_SIZE / 2,
        marginTop: -CURSOR_SIZE / 2,
      }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <CursorArrow />
    </motion.div>
  );
}
