// theme.js — light/dark with a pre-hydration class applied in index.html.
// The 2D UI is monochrome; the 3D world keeps its Berkeley colour.
import { useCallback, useEffect, useState } from "react";

const KEY = "theme";

export function initialTheme() {
  if (typeof window === "undefined") return "light";
  // localStorage throws in Safari private mode / when storage is blocked, and
  // an unguarded read here would take the whole site down with it.
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/* Terrain shading palettes. The relief is monochrome — all of these are tones
   of the same paper, which is what keeps the surface calm under type. */
export const TERRAIN_PALETTE = {
  light: {
    base: "#f4f3f0",
    deep: "#d2d0ca", // groove shadow
    light: "#fdfcfa", // groove highlight
    bodyShade: "#e6e4dd", // broad hill-body shadow
    bodyStrength: 1.0,
  },
  dark: {
    base: "#0e0e0d",
    deep: "#040404",
    light: "#2e2d2b",
    bodyShade: "#000000",
    bodyStrength: 0.0, // dark mode carries everything in the groove emboss
  },
};

/* Phone variant. On a narrow screen the text column covers the whole width,
   so the relief can't be hidden behind a heavy wash without losing the point
   of having it. Instead the relief itself is softened — same motion, same
   cursor/touch response, far less contrast — so it reads across the entire
   page while type stays comfortably legible on top of it. */
export const TERRAIN_PALETTE_SOFT = {
  light: {
    base: "#f4f3f0",
    deep: "#e4e2db",
    light: "#fbfaf7",
    bodyShade: "#edebe4",
    bodyStrength: 1.0,
  },
  dark: {
    base: "#0e0e0d",
    deep: "#080807",
    light: "#201f1d",
    bodyShade: "#000000",
    bodyStrength: 0.0,
  },
};

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  // Reflect onto the document, and keep the address-bar colour in step with
  // the *actual* theme (a media-only theme-color meta contradicts a manual
  // toggle).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute("content", theme === "dark" ? "#0e0e0d" : "#f4f3f0"));
  }, [theme]);

  // Follow the OS until there's an explicit choice — persisting the
  // OS-derived value on first mount would pin the theme forever.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      let explicit = null;
      try {
        explicit = window.localStorage.getItem(KEY);
      } catch {
        /* ignore */
      }
      if (!explicit) setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(
    () =>
      setTheme((t) => {
        const next = t === "dark" ? "light" : "dark";
        try {
          window.localStorage.setItem(KEY, next); // only an explicit choice persists
        } catch {
          /* ignore */
        }
        return next;
      }),
    [],
  );

  return { theme, toggle };
}
