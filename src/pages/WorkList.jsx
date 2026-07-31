// WorkList.jsx — the editorial index used by /projects and /ventures.
// Numbered rows, hairline rules, the whole row is the link target.
import { motion } from "motion/react";
import { EASE_OUT } from "../motion";

function Row({ item, index }) {
  const href = item.website || item.github;
  const n = String(index + 1).padStart(2, "0");

  const inner = (
    <>
      <span className="idx">{n}</span>
      <span className="row-main">
        <span className="row-head">
          <span className="row-name">{item.name}</span>
          {item.subtitle && <span className="row-sub">{item.subtitle}</span>}
        </span>
        <span className="row-desc">{item.description}</span>
        <span className="row-meta">
          {item.stack &&
            item.stack.split(",").map((s) => (
              <span key={s} className="stack-item">
                {s.trim()}
              </span>
            ))}
          {item.github && item.website && (
            <span className="stack-item">source</span>
          )}
        </span>
      </span>
      {href && (
        <span className="row-arrow" aria-hidden="true">
          ↗
        </span>
      )}
    </>
  );

  return (
    <motion.li
      className="row"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay: (index % 3) * 0.05 }}
    >
      {href ? (
        <a
          className="row-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {inner}
        </a>
      ) : (
        <div className="row-link row-static">{inner}</div>
      )}
    </motion.li>
  );
}

export default function WorkList({ title, lede, items }) {
  return (
    <main className="page">
      <header className="page-head">
        <h1 className="h1">{title}</h1>
        {lede && <p className="page-lede">{lede}</p>}
      </header>

      <ol className="rows">
        {items.map((item, i) => (
          <Row key={item.name} item={item} index={i} />
        ))}
      </ol>
    </main>
  );
}
