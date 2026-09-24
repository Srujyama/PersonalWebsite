// theme.js — the theme switch, and the clock behind "auto".
//
// "Auto" is light from 7am to 7pm local time and dark the rest of the day.
// Any other choice (light, dark, or one of the named themes from my notes
// app) is pinned and kept in localStorage; choosing auto again forgets it.
// The first paint is decided by the small inline script in every page's
// <head> (same rule, same key), so this module only wires the switch and
// flips the page when the clock crosses 7am or 7pm while it is open.
import { byId } from "./themes.js";

const KEY = "theme";
const DAY_START = 7; // hour, local
const DAY_END = 19;

const root = document.documentElement;

const byClock = (d = new Date()) => {
  const h = d.getHours();
  return h >= DAY_START && h < DAY_END ? "light" : "dark";
};

function stored() {
  try {
    const t = localStorage.getItem(KEY);
    return byId(t) ? t : null;
  } catch {
    return null;
  }
}

let mode = stored() || "auto";
const resolve = () => (mode === "auto" ? byClock() : mode);

function apply() {
  const t = byId(resolve());
  if (root.dataset.theme !== t.id) root.dataset.theme = t.id;
  root.style.colorScheme = t.dark ? "dark" : "light";
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) {
    m.setAttribute("content", t.bg);
  }
}

// Wake up at the next 7am or 7pm, whichever comes first.
let timer = 0;
function scheduleFlip() {
  clearTimeout(timer);
  if (mode !== "auto") return;
  const now = new Date();
  const next = new Date(now);
  const h = now.getHours();
  if (h < DAY_START) next.setHours(DAY_START, 0, 0, 0);
  else if (h < DAY_END) next.setHours(DAY_END, 0, 0, 0);
  else {
    next.setDate(next.getDate() + 1);
    next.setHours(DAY_START, 0, 0, 0);
  }
  timer = setTimeout(() => {
    apply();
    scheduleFlip();
  }, next - now + 1000);
}

const buttons = [...document.querySelectorAll(".theme button[data-theme-set]")];

function sync() {
  for (const b of buttons) {
    b.setAttribute("aria-pressed", String(b.dataset.themeSet === mode));
  }
}

function set(next) {
  mode = next === "auto" || byId(next) ? next : "auto";
  try {
    if (mode === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    /* storage blocked: the choice lasts until the page is left */
  }
  apply();
  sync();
  scheduleFlip();
}

for (const b of buttons) {
  b.addEventListener("click", () => set(b.dataset.themeSet));
}

// A timer in a background tab can run hours late, so check again whenever
// the page comes back into view.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  apply();
  scheduleFlip();
});

// A choice made in another tab applies here too.
window.addEventListener("storage", (e) => {
  if (e.key !== KEY && e.key !== null) return;
  mode = stored() || "auto";
  apply();
  sync();
  scheduleFlip();
});

apply();
sync();
scheduleFlip();
// The switch is laid out but invisible until this runs, so the properties
// keep their height with scripts off and there is never a control that does
// nothing.
const ctl = document.querySelector(".theme");
if (ctl) ctl.classList.add("is-on");
