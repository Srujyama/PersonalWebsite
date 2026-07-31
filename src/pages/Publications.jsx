// Publications.jsx — grouped by year, my name bold, citations behind a toggle.
// One work presented at two venues is one entry with two venue lines, not two
// entries with the same title.
import { useState } from "react";
import { motion } from "motion/react";
import { EASE_OUT } from "../motion";
import { publicationWorks, citationFor } from "../data";

const byYear = [...new Set(publicationWorks.map((w) => w.year))].map((year) => ({
  year,
  works: publicationWorks.filter((w) => w.year === year),
}));

function Entry({ work, index }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cites = work.venues.map((v) => citationFor(work, v));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cites.join("\n\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the citation is expanded, so it can be selected */
    }
  };

  return (
    <motion.li
      className="pub"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: (index % 3) * 0.05 }}
    >
      <h3 className="pub-heading">{work.title}</h3>

      <p className="pub-byline">
        {work.authors.map((a, j) => (
          <span key={a}>
            {j > 0 && ", "}
            {a === "S. Yamali" ? <strong className="pub-me">{a}</strong> : a}
          </span>
        ))}
      </p>

      <ul className="pub-venues">
        {work.venues.map((v) => (
          <li key={v.venue} className="pub-venue-line">
            <em>{v.venue}</em> — {v.location}
          </li>
        ))}
      </ul>

      <div className="pub-cite">
        <button
          type="button"
          className="pub-cite-btn"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide citation" : "Cite"}
        </button>
        {open && (
          <button type="button" className="pub-cite-btn" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {open && (
        <div className="pub-cite-block">
          {cites.map((c) => (
            <code key={c} className="pub-cite-text">
              {c}
            </code>
          ))}
        </div>
      )}
    </motion.li>
  );
}

export default function Publications() {
  return (
    <main className="page">
      <header className="page-head">
        <h1 className="h1">Publications</h1>
        <p className="page-lede">
          Work I co-authored in behavioural genetics and bacterial genomics.
        </p>
      </header>

      {byYear.map(({ year, works }) => (
        <section key={year} className="pub-year">
          <h2 className="pub-year-label">{year}</h2>
          <ol className="pub-list">
            {works.map((w, i) => (
              <Entry key={w.title} work={w} index={i} />
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
