// motion.js — the site's motion vocabulary.
// Three tiers, used everywhere so the site moves as one system:
//   1. Entrances: 700ms quintOut, y-lift decreasing down the stack (24 → 20 → 16px)
//   2. Micro-interactions: 200ms easeInOutCubic
//   3. Springs for tactile hovers/presses only
export const EASE_OUT = [0.22, 1, 0.36, 1]; // quintOut — entrances
export const EASE_INOUT = [0.65, 0, 0.35, 1]; // easeInOutCubic — micros

export const ENTRANCE = { duration: 0.7, ease: EASE_OUT };
export const MICRO = { duration: 0.2, ease: EASE_INOUT };

export const SPRING_HOVER = { type: "spring", stiffness: 400, damping: 17 };

/* Rise-in variant for a single element. Lift decreases for later elements. */
export const rise = (y = 24) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: ENTRANCE },
});

/* Parent container that staggers its `rise` children. */
export const cascade = (stagger = 0.12, delay = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/* Accordion content: stagger in on open, quick fade on close. */
export const listContainer = {
  hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
};

export const listItem = {
  hidden: { opacity: 0, y: 14, transition: { duration: 0.15, ease: "easeIn" } },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};
