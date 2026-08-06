// Experience.jsx — the record of what I have worked on, and nothing else.
import { motion } from "motion/react";
import { EASE_OUT } from "../motion";
import { experience } from "../data";

/* A rail of company marks only reads as one family if the marks are optically
   the same size, and matching their heights does not do that. SpaceX is eight
   times wider than it is tall and Penn's shield is taller than it is wide; set
   both to 34px and the wordmark carries several times the ink and swamps the
   column. Matching their areas instead over-corrects, shrinking a long
   wordmark to a thread.
   So: height falls off with aspect ratio, damped. p = 0.5 is equal area, p = 0
   is equal height; 0.38 sits where a designer would put them by eye. The
   ratio is read off the loaded image, so a logo added later normalises itself
   with no numbers to maintain in data.js. */
const MARK_H = 34; // the height a square mark gets
const DAMP = 0.38;

function OrgMark({ src }) {
  return (
    <span className="tl-logo-slot">
      <img
        src={src}
        alt=""
        className="tl-logo"
        loading="lazy"
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (!w || !h) return;
          e.currentTarget.style.height = `${MARK_H * Math.pow(h / w, DAMP)}px`;
        }}
      />
    </span>
  );
}

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
        {item.logo && <OrgMark src={item.logo} />}
        <span className="tl-dates">{item.dates}</span>
        <span className="tl-where">{item.where}</span>
      </div>

      <div className="tl-node" aria-hidden="true" />

      <div className="tl-body">
        <div className="tl-head">
          <h3 className="tl-org">{item.org}</h3>
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
