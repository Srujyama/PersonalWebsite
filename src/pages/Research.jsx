// Research.jsx — the biology, told properly, with the artifacts that came out
// of it. Every other page describes what I built; this one explains what the
// work was for and then hands over the figures so a reader can check it.
import { motion } from "motion/react";
import { EASE_OUT } from "../motion";
import { research, researchProjects, publicationWorks } from "../data";

const isImage = (f) => /\.(png|jpe?g|svg|webp)$/i.test(f);

function Item({ item, index }) {
  const image = isImage(item.file);

  return (
    <motion.li
      className={`arc ${item.feature ? "arc-feature" : ""}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay: (index % 3) * 0.05 }}
    >
      <div className="arc-head">
        <h4 className="arc-title">{item.title}</h4>
        <span className="arc-tag">
          {item.kind} · {item.year}
        </span>
      </div>

      {image && (
        <a
          className="arc-frame"
          href={item.file}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={item.file} alt={item.title} loading="lazy" decoding="async" />
        </a>
      )}

      <p className="arc-caption">{item.caption}</p>

      <a
        className="arc-link"
        href={item.file}
        target="_blank"
        rel="noopener noreferrer"
      >
        {image ? "Open full size" : "Open"}
        {item.meta && <span className="arc-meta">{item.meta}</span>}
        <span className="arc-arrow" aria-hidden="true">
          ↗
        </span>
      </a>
    </motion.li>
  );
}

export default function Research() {
  return (
    <main className="page">
      <header className="page-head">
        <h1 className="h1">Research</h1>
        <p className="page-lede">
          Both lines of work start in the same place. Something is being judged
          by a person, or not judged at all because there is too much of it, and
          the question is whether the data can be made to answer directly.
        </p>
      </header>

      {researchProjects.map((proj) => {
        const items = research.filter((r) => r.project === proj.key);
        const pubs = publicationWorks.filter((w) =>
          proj.key === "redcarpet"
            ? /redcarpet/i.test(w.title)
            : !/redcarpet/i.test(w.title),
        );

        return (
          <motion.section
            key={proj.key}
            className="rsc"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <div className="rsc-head">
              <h2 className="rsc-title">{proj.title}</h2>
              <div className="rsc-meta">
                <span>{proj.lab}</span>
                <span>{proj.years}</span>
              </div>
            </div>

            <div className="rsc-body">
              {proj.body.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>

            {pubs.length > 0 && (
              <ul className="rsc-pubs">
                {pubs.map((w) => (
                  <li key={w.title}>
                    <span className="rsc-pub-title">{w.title}</span>
                    <span className="rsc-pub-venue">
                      {w.venues.map((v) => v.venue).join(" · ")} ({w.year})
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <ol className="arc-list">
              {items.map((item, i) => (
                <Item key={item.file} item={item} index={i} />
              ))}
            </ol>
          </motion.section>
        );
      })}
    </main>
  );
}
