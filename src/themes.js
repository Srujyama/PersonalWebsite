// themes.js — every palette the site can wear, in one list.
//
// Light and dark are the Obsidian Typewriter pair I write in. The rest are
// the themes from my notes app, Thoughts, with the same names and the same
// colours, so the site switches the way that app does. The CSS holds the full
// palettes (src/site.css); this list only carries what scripts need before or
// without the CSS: the paper for the browser's theme-color, and the ink the
// load-in draws its dots in.
//
// The inline script in every page's <head> repeats the ids (it runs before
// any module can load). Add a theme there, here, and in site.css.

export const THEMES = [
  { id: "light", label: "light", bg: "#fcf5e4", fg: "#22211d", dark: false },
  { id: "dark", label: "dark", bg: "#262626", fg: "#e3e1da", dark: true },
  { id: "nord", label: "nord", bg: "#2e3440", fg: "#eceff4", dark: true },
  { id: "dracula", label: "dracula", bg: "#282a36", fg: "#f8f8f2", dark: true },
  { id: "solarized", label: "solarized", bg: "#fdf6e3", fg: "#475a60", dark: false },
  { id: "monokai", label: "monokai", bg: "#272822", fg: "#f8f8f2", dark: true },
  { id: "ocean", label: "ocean", bg: "#1b2838", fg: "#d4dae4", dark: true },
  { id: "cyberpunk", label: "cyberpunk", bg: "#050508", fg: "#c8d8e4", dark: true },
];

export const byId = (id) => THEMES.find((t) => t.id === id);
