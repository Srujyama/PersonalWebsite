// WorldPanel.jsx — the glass content panel that slides in from the right
// when a station in the 3D world is opened. Reuses the site's real data.
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT, listContainer, listItem } from "./motion";
import { STATIONS } from "./worldStations";
import { education } from "./data";

function PanelShell({ station, onClose, children }) {
  const def = STATIONS[station];
  const closeRef = useRef(null);
  const asideRef = useRef(null);

  // Move focus into the panel on open, restore it to the opener on close,
  // and trap Tab within the panel while it's open.
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== "Tab" || !asideRef.current) return;
      const focusables = asideRef.current.querySelectorAll(
        'a[href], button, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  return (
    <motion.aside
      ref={asideRef}
      className="world-panel"
      initial={{ x: "105%" }}
      animate={{ x: 0 }}
      exit={{ x: "105%" }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
      role="dialog"
      aria-modal="true"
      aria-label={def.title}
    >
      <div className="world-panel-head">
        <div>
          <div className="world-panel-eyebrow">{def.sub}</div>
          <h2 className="world-panel-title">{def.title}</h2>
        </div>
        <button
          type="button"
          className="world-panel-close"
          onClick={onClose}
          ref={closeRef}
        >
          ESC ✕
        </button>
      </div>
      <motion.div
        className="world-panel-body"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>
    </motion.aside>
  );
}

const Item = ({ children, className = "" }) => (
  <motion.div variants={listItem} className={`world-item ${className}`}>
    {children}
  </motion.div>
);

/* One row shared by the projects and ventures stations. */
const BuildItem = ({ item }) => (
  <Item>
    <div className="world-proj-head">
      <div className="world-org">{item.name}</div>
      <div className="world-proj-links">
        {item.github && (
          <a
            className="world-link"
            href={item.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
        )}
        {item.website && (
          <a
            className="world-link"
            href={item.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Site ↗
          </a>
        )}
      </div>
    </div>
    {item.tagline && <div className="world-tagline">{item.tagline}</div>}
    <p className="world-p">{item.description}</p>
  </Item>
);

export default function WorldPanel({
  station,
  onClose,
  profile,
  socialLinks,
  experience,
  projects,
  ventures,
  publications,
}) {
  return (
    <AnimatePresence>
      {station && (
        <PanelShell key={station} station={station} onClose={onClose}>
          {station === "about" && (
            <>
              <Item>
                <p className="world-p">
                  I'm {profile.name.split(" ")[0]} — a software engineer working
                  in AI/ML, studying CS at Berkeley. I build computer-vision
                  pipelines for biology, ship AI products, and occasionally
                  teach computers to watch fruit flies flirt.
                </p>
              </Item>
              <Item>
                <div className="world-kv">
                  <span className="meta-micro text-black/50">Based</span>
                  <span>{profile.location}</span>
                </div>
                <div className="world-kv">
                  <span className="meta-micro text-black/50">Email</span>
                  <a className="world-link" href={`mailto:${profile.email}`}>
                    {profile.email}
                  </a>
                </div>
              </Item>
              <Item className="world-btn-row">
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="world-btn"
                >
                  View resume
                </a>
                <a href={profile.resume} download className="world-btn">
                  Download
                </a>
              </Item>
            </>
          )}

          {station === "education" && (
            <>
              <Item>
                <div className="world-org">
                  University of California, Berkeley
                </div>
                <div className="world-role">B.S. in Computer Science</div>
              </Item>
              <Item>
                <div className="world-panel-eyebrow">Coursework</div>
                <p className="world-p">{education.coursework}</p>
              </Item>
            </>
          )}

          {station === "experience" &&
            experience.map((e) => (
              <Item key={e.org}>
                <div className="world-exp-head">
                  <img src={e.logo} alt="" className="world-exp-logo" />
                  <div className="min-w-0 flex-1">
                    <div className="world-org">{e.org}</div>
                    <div className="world-role">{e.role}</div>
                  </div>
                </div>
                <div className="world-exp-meta meta-micro text-black/50">
                  {e.where} · {e.dates}
                </div>
                <p className="world-p">{e.description}</p>
              </Item>
            ))}

          {station === "projects" &&
            projects.map((p) => <BuildItem key={p.name} item={p} />)}

          {station === "publications" &&
            publications.map((w) => (
              <Item key={w.title}>
                <div className="world-org world-pub-title">{w.title}</div>
                <div className="world-p world-pub-authors">
                  {w.authors.join(", ")}
                </div>
                {w.venues.map((v) => (
                  <div
                    key={v.venue}
                    className="world-exp-meta meta-micro text-black/50"
                  >
                    {v.venue} · {v.location} ({w.year})
                  </div>
                ))}
              </Item>
            ))}

          {station === "ventures" &&
            ventures.map((v) => <BuildItem key={v.name} item={v} />)}

          {station === "contact" && (
            <>
              <Item>
                <p className="world-p">
                  Recruiting, research, or a press you want settled — my inbox
                  is open.
                </p>
              </Item>
              {socialLinks.map((l) => (
                <Item key={l.alt}>
                  <a
                    className="world-link world-contact-link"
                    href={l.href}
                    target={l.href.startsWith("mailto") ? undefined : "_blank"}
                    rel={
                      l.href.startsWith("mailto")
                        ? undefined
                        : "noopener noreferrer"
                    }
                  >
                    {l.alt} ↗
                  </a>
                </Item>
              ))}
              <Item>
                <div className="world-kv">
                  <span className="meta-micro text-black/50">Email</span>
                  <a className="world-link" href={`mailto:${profile.email}`}>
                    {profile.email}
                  </a>
                </div>
              </Item>
            </>
          )}
        </PanelShell>
      )}
    </AnimatePresence>
  );
}
