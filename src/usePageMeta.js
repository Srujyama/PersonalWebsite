// usePageMeta.js — per-route <title> + description, and an accessible route
// change: announce the new page and move focus to the top of it, since a
// client-side navigation otherwise leaves focus on <body> silently.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const META = {
  "/": {
    title: "Srujan Yamali — Software Engineer",
    description:
      "I build the tools that outlive the experiment. LLM tooling at Visa; computer vision and genomics pipelines at CHOP, Cornell and Delaware. UC Berkeley, B.S. Computer Science.",
  },
  "/experience": {
    title: "Experience — Srujan Yamali",
    description:
      "Roles at Visa, Mercor, Children's Hospital of Philadelphia, Cornell and the University of Delaware.",
  },
  "/research": {
    title: "Research — Srujan Yamali",
    description:
      "Behavioural genetics and bacterial genomics: a high-throughput Drosophila courtship assay, and RedCarpet, which detects recombination in bacterial genomes. Figures and methods.",
  },
  "/projects": {
    title: "Projects — Srujan Yamali",
    description:
      "Research tooling and writing — FlyFlirt, RedCarpet, and Thoughts.",
  },
  "/ventures": {
    title: "Ventures — Srujan Yamali",
    description:
      "Products with users behind them — Stryda, Sylor, Stryier, M&A Toolkit, Tap to Tip.",
  },
  "/publications": {
    title: "Publications — Srujan Yamali",
    description:
      "Co-authored research presented at IBNGS, HHMI Janelia, and ISSSI in 2024.",
  },
  "/cv": {
    title: "CV — Srujan Yamali",
    description:
      "Full curriculum vitae — education, experience, publications, ventures, projects and skills. PDF available.",
  },
  "/explore": {
    title: "Explore in 3D — Srujan Yamali",
    description: "The portfolio as an explorable 3D world.",
  },
};

export default function usePageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = META[pathname] || META["/"];
    document.title = meta.title;
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute("content", meta.description);

    // Announce, then hand focus to the page container so keyboard and screen
    // reader users land in the new content instead of back at the document.
    const live = document.getElementById("route-status");
    if (live) live.textContent = `${meta.title.split(" — ")[0]} page loaded`;

    const main = document.querySelector("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  }, [pathname]);
}
