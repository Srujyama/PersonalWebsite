// App.jsx — router shell: theme, cursor, wash transition, routes, load-in.
import "./style.css";
import { useCallback, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import Cursor from "./Cursor";
import IntroAnimation from "./IntroAnimation";
import SiteChrome from "./SiteChrome";
import Landing from "./pages/Landing";
import Experience from "./pages/Experience";
import Projects from "./pages/Projects";
import Ventures from "./pages/Ventures";
import Publications from "./pages/Publications";
import Research from "./pages/Research";
import Explore from "./pages/Explore";
import { useTheme } from "./theme";
import { WashProvider } from "./wash";
import usePageMeta from "./usePageMeta";
// three.js lives in lazy chunks — nothing heavy is imported here.

/* Inside the router so it can read the location for per-route metadata. */
function Shell({ theme, toggle }) {
  usePageMeta();

  return (
    <>
      <Cursor />
      {/* Route changes are announced here for screen readers. */}
      <div
        id="route-status"
        className="sr-only"
        role="status"
        aria-live="polite"
      />

      <Routes>
        <Route element={<SiteChrome theme={theme} onToggleTheme={toggle} />}>
          <Route path="/" element={<Landing theme={theme} />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/ventures" element={<Ventures />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/research" element={<Research />} />
          <Route path="/explore" element={<Explore theme={theme} />} />
          {/* Old routes, kept alive. /elsewhere was contact-as-a-page; the
              author sidebar carries those links on every page now. */}
          <Route path="/work" element={<Navigate to="/experience" replace />} />
          <Route path="/archive" element={<Navigate to="/research" replace />} />
          <Route path="/elsewhere" element={<Navigate to="/" replace />} />
          <Route path="/cv" element={<Navigate to="/experience" replace />} />
          <Route path="/resume" element={<Navigate to="/experience" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

const INTRO_INK = { light: "#121211", dark: "#f2f1ed" };
const INTRO_SEEN = "intro_seen";

// TEMPORARY, for tuning the handoff: replay the load-in on every visit.
// Set back to false to restore once-per-visitor. `?intro` forces it either way,
// which is worth keeping permanently so it can be demoed without clearing
// storage.
const INTRO_ALWAYS = true;

// First visit only, on "/" only, never under reduced motion. Anyone who has
// already watched it once goes straight to the page — a load screen you have
// to sit through twice is a toll, not a welcome.
function shouldPlayIntro() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.location.pathname !== "/") return false;
  const q = new URLSearchParams(window.location.search);
  if (q.has("nointro")) return false; // escape hatch while INTRO_ALWAYS is on
  if (INTRO_ALWAYS || q.has("intro")) return true;
  try {
    return window.localStorage.getItem(INTRO_SEEN) !== "1";
  } catch {
    // Private mode / storage blocked: play it, but only this once per load.
    return true;
  }
}

export default function App() {
  const { theme, toggle } = useTheme();

  // "playing"  — dots assembling over blank paper. The relief is mounted and
  //              rendering (the readback needs real pixels) but not shown.
  // "settling" — dots flying out to the contour positions. Still no relief:
  //              the pattern appearing on screen is theirs, not the map's.
  // "forming"  — every dot has landed, so the relief fades up underneath the
  //              pattern the dots just drew, and they fade out into it.
  // "done"     — overlay gone, the rest of the UI fades in.
  const [phase, setPhase] = useState(() =>
    shouldPlayIntro() ? "playing" : "done",
  );

  const onSettle = useCallback(() => setPhase("settling"), []);
  const onFormed = useCallback(() => setPhase("forming"), []);
  const onComplete = useCallback(() => {
    setPhase("done");
    try {
      window.localStorage.setItem(INTRO_SEEN, "1");
    } catch {
      /* storage blocked — the intro just replays next load */
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {phase !== "done" && (
        <IntroAnimation
          jsonPath="/stipple_data.json"
          ink={INTRO_INK[theme]}
          onSettle={onSettle}
          onFormed={onFormed}
          onComplete={onComplete}
        />
      )}
      <div className={`site-content intro-${phase}`}>
        <WashProvider>
          <Shell theme={theme} toggle={toggle} />
        </WashProvider>
      </div>
    </MotionConfig>
  );
}
