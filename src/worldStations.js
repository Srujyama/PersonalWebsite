// worldStations.js — station metadata shared by the 3D world (lazy chunk)
// and the content panel (main chunk). Keep this module dependency-free so
// importing it never pulls in three.js/R3F.
// view: [camera x,y,z, target x,y,z]
export const STATIONS = {
  about: {
    title: "Srujan",
    sub: "about + resume",
    position: [0, 0, 0],
    view: [0.6, 2.8, 5.6, 0, 1.3, 0],
  },
  education: {
    title: "Education",
    sub: "UC Berkeley",
    position: [-2.9, 0, -3.0],
    view: [-6.6, 3.9, 2.1, -2.9, 1.9, -3.0],
  },
  experience: {
    title: "Experience",
    sub: "Visa · Mercor · CHOP",
    position: [2.9, 0, -3.0],
    view: [6.8, 3.5, 1.9, 2.9, 1.3, -3.0],
  },
  projects: {
    title: "Projects",
    sub: "3 builds",
    position: [4.2, 0, 0.6],
    view: [5.7, 2.3, 3.6, 4.2, 0.5, 0.6],
  },
  publications: {
    title: "Publications",
    sub: "3 venues",
    position: [-4.2, 0, 0.6],
    view: [-6.9, 2.9, 4.6, -4.2, 0.72, 0.75],
  },
  ventures: {
    title: "Ventures",
    sub: "Stryda · Sylor · Stryier",
    position: [1.9, 0, 3.6],
    view: [4.0, 2.6, 7.0, 1.9, 0.85, 3.6],
  },
  contact: {
    title: "Contact",
    sub: "say hi",
    position: [-1.9, 0, 3.6],
    view: [-3.9, 2.4, 6.7, -1.9, 0.95, 3.6],
  },
};

export const OVERVIEW = [0, 7.2, 12.8, 0, 1.2, 0];
