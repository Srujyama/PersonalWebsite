// TerrainBackground.jsx — picks the live sculpted relief or a static stand-in
// (no WebGL / reduced motion / context loss) and lazy-loads the three.js chunk.
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { TERRAIN_PALETTE, TERRAIN_PALETTE_SOFT } from "./theme";

const TerrainHero = lazy(() => import("./TerrainHero"));

// three r155+ requests a webgl2 context only, so testing webgl1 here would
// green-light a device the renderer then fails on — leaving a blank hero
// instead of the static fallback.
function hasWebGL() {
  if (typeof window === "undefined") return false;
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

// Static approximation of the relief, no motion.
export function TerrainFallback() {
  return <div className="terrain-fallback" aria-hidden="true" />;
}

export default function TerrainBackground({ theme = "light" }) {
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const webgl = useMemo(hasWebGL, []);
  const [lost, setLost] = useState(false);

  // Narrow screens get the low-contrast relief so type stays readable over it.
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 820,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 819px)");
    const onChange = (e) => setNarrow(e.matches);
    setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduced || !webgl || lost) return <TerrainFallback />;

  const set = narrow ? TERRAIN_PALETTE_SOFT : TERRAIN_PALETTE;

  return (
    <Suspense fallback={<TerrainFallback />}>
      <TerrainHero
        palette={set[theme] || set.light}
        onLost={() => setLost(true)}
      />
    </Suspense>
  );
}
