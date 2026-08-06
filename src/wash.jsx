// wash.jsx — one 1100ms sweep per forward navigation. The route swaps at the
// midpoint, hidden under full coverage, so a page change reads as a deliberate
// turn rather than a cut. Lives above <Routes> so a single run spans both the
// origin and the destination page.
//
// The sweep used to be a solid slab sliding across. It worked, but it was the
// one piece of motion on the site that had nothing to do with the rest of it:
// the landing assembles out of stipple dots, the background is drawn in dots,
// and then a page change was a rectangle. This is the same idea in the same
// vocabulary — a curtain of dots swells shut across the screen, holds long
// enough to cover the swap, and disperses off the far side.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DotCurtain, { preloadCurtainDots, TIMING } from "./DotCurtain.jsx";

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

  // Fetch the Campanile stipple while the first page is being read, so the
  // first navigation already has it. If it is late the curtain just closes and
  // opens without the tower — it never waits on the network.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 700));
    idle(() => preloadCurtainDots());
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
      // Reduced motion used to return here and navigate on the spot, which
      // meant the preference removed the transition entirely rather than
      // removing the movement in it. DotCurtain has a still cut for exactly
      // this: the same picture, cross-faded, with nothing travelling.
      const T = reduced ? TIMING.still : TIMING.motion;

      // One sweep at a time. Without this, a second click queues another
      // deferred navigate() that can fire after the user has already pressed
      // Back — yanking them to a page they no longer asked for — and can also
      // leave `active` stuck true under a full-screen overlay.
      if (inFlight.current) return;
      inFlight.current = true;

      // Both beats belong to the curtain, which exports them: the swap happens
      // while it is opaque, and it comes down when the tower has faded out.
      setActive(true);
      timers.current.push(setTimeout(() => navigate(href), T.swapAt));
      timers.current.push(
        setTimeout(() => {
          setActive(false);
          inFlight.current = false;
          timers.current = [];
        }, T.run),
      );
    },
    [navigate, reduced],
  );

  return (
    <WashContext.Provider value={{ go, active }}>
      {children}
      {active && <DotCurtain still={reduced} />}
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
