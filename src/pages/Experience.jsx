// Experience.jsx — the record of what I have worked on, and nothing else.
import { motion } from "motion/react";
import { EASE_OUT } from "../motion";
import { experience } from "../data";

function Role({ item, current }) {
  return (
    <motion.li
      className={`tl-item ${current ? "tl-current" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.04 }}
    >
      <div className="tl-when">
        <span className="tl-dates">{item.dates}</span>
        <span className="tl-where">{item.where}</span>
      </div>

      <div className="tl-node" aria-hidden="true" />

      <div className="tl-body">
        <div className="tl-head">
          <h3 className="tl-org">{item.org}</h3>
          {item.logo && (
            <img src={item.logo} alt="" className="tl-logo" loading="lazy" />
          )}
        </div>
        <div className="tl-role">{item.role}</div>

        <ul className="tl-points">
          {(item.bullets || [item.description]).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        {item.stack && (
          <div className="tl-stack">
            {item.stack.split(",").map((t) => (
              <span key={t}>{t.trim()}</span>
            ))}
          </div>
        )}
      </div>
    </motion.li>
  );
}

export default function Experience() {
  return (
    <main className="page">
      <header className="page-head">
        <h1 className="h1">Experience</h1>
      </header>

      <ol className="timeline">
        {experience.map((e) => (
          <Role key={e.org} item={e} current={/present/i.test(e.dates)} />
        ))}
      </ol>
    </main>
  );
}
