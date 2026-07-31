// heroPref.js — can this device actually run the 3D world?
//
// The world lives at its own route now, so there is no preference to persist
// any more; the only question left is whether to hand someone a WebGL2 island
// or tell them their device can't take it.
import { useEffect, useState } from "react";

export function canRunWorld() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (!window.matchMedia("(pointer: fine)").matches) return false;
  if (window.innerWidth < 768) return false;
  try {
    // three r155+ requests a webgl2 context only.
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export function useCanRunWorld() {
  const [capable, setCapable] = useState(canRunWorld);

  // Checked live so dragging a window past the breakpoint falls back.
  useEffect(() => {
    const recheck = () => setCapable(canRunWorld());
    recheck();
    window.addEventListener("resize", recheck);
    return () => window.removeEventListener("resize", recheck);
  }, []);

  return capable;
}
