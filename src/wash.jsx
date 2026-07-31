// wash.jsx — one 1100ms accent sweep per forward navigation. The route swaps
// at the midpoint, hidden under full coverage, so a page change reads as a
// deliberate turn rather than a cut. Lives above <Routes> so a single keyframe
// run spans both the origin and destination page.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const WashContext = createContext({ go: () => {}, active: false });

export function useWash() {
  return useContext(WashContext);
}

export function WashProvider({ children }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const timers = useRef([]);
  const inFlight = useRef(false);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const t = timers;
    return () => t.current.forEach(clearTimeout);
  }, []);

  // A browser Back/Forward during a sweep must win: drop the pending
  // navigate() and clear the overlay instead of fighting the user.
  useEffect(() => {
    const onPop = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      inFlight.current = false;
      setActive(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback(
    (href) => {
      if (reduced) {
        navigate(href);
        return;
      }
      // One sweep at a time. Without this, a second click queues another
      // deferred navigate() that can fire after the user has already pressed
      // Back — yanking them to a page they no longer asked for — and can also
      // leave `active` stuck true under a full-screen overlay.
      if (inFlight.current) return;
      inFlight.current = true;

      setActive(true);
      timers.current.push(setTimeout(() => navigate(href), 550));
      timers.current.push(
        setTimeout(() => {
          setActive(false);
          inFlight.current = false;
          timers.current = [];
        }, 1100),
      );
    },
    [navigate, reduced],
  );

  return (
    <WashContext.Provider value={{ go, active }}>
      {children}
      {active && <div className="wash" aria-hidden="true" />}
    </WashContext.Provider>
  );
}

/* A link that plays the wash instead of navigating instantly. Keeps a real
   href so middle-click / cmd-click / "open in new tab" still work. */
export function WashLink({ to, children, className, ...rest }) {
  const { go } = useWash();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
