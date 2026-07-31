// CV.jsx — the aggregated document: every section on one page, in order, plus
// the PDFs. The individual pages stay single-purpose; this is the one place
// that deliberately gathers everything.
import { motion } from "motion/react";
import { EASE_OUT } from "../motion";
import {
  profile,
  education,
  experience,
  projects,
  ventures,
  publicationWorks,
  skills,
} from "../data";

const Section = ({ title, children, delay = 0 }) => (
  <motion.section
    className="cv-section"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE_OUT, delay }}
  >
    <h2 className="cv-section-title">{title}</h2>
    <div className="cv-section-body">{children}</div>
  </motion.section>
);

const host = (u) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Build({ item }) {
  const href = item.website || item.github;
  return (
    <article className="cv-entry">
      <div className="cv-row">
        <div className="cv-org">
          {item.name}
          <span className="cv-sub"> — {item.subtitle}</span>
        </div>
        {href && (
          <a
            className="cv-link entry-dates"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {host(href)}
          </a>
        )}
      </div>
      <p className="cv-note">{item.description}</p>
      {item.stack && <div className="cv-stack">{item.stack}</div>}
    </article>
  );
}

export default function CV() {
  return (
    <main className="page cv">
      <motion.header
        className="cv-head"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
      >
        <h1 className="h1">Curriculum vitae</h1>
        <div className="cv-actions">
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="pill pill-accent"
          >
            Software PDF
          </a>
          <a
            href={profile.researchResume}
            target="_blank"
            rel="noopener noreferrer"
            className="pill"
          >
            Research PDF
          </a>
        </div>
      </motion.header>

      <Section title="Education" delay={0.04}>
        <div className="cv-row">
          <div>
            <div className="cv-org">{education.school}</div>
            <div className="cv-role">{education.degree}</div>
          </div>
          <div className="entry-dates">Berkeley, CA</div>
        </div>
        <p className="cv-note">
          <span className="cv-note-label">Relevant coursework — </span>
          {education.coursework}
        </p>
      </Section>

      <Section title="Experience" delay={0.08}>
        {experience.map((e) => (
          <article key={e.org} className="cv-entry">
            <div className="cv-row">
              <div>
                <div className="cv-org">{e.org}</div>
                <div className="cv-role">{e.role}</div>
              </div>
              <div className="cv-meta">
                <div className="entry-dates">{e.dates}</div>
                <div className="entry-dates">{e.where}</div>
              </div>
            </div>
            <ul className="cv-points">
              {(e.bullets || [e.description]).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </Section>

      <Section title="Publications" delay={0.12}>
        {publicationWorks.map((w) => (
          <article key={w.title} className="cv-entry">
            <div className="cv-org cv-pub">{w.title}</div>
            <p className="cv-note">
              {w.authors.map((a, j) => (
                <span key={a}>
                  {j > 0 && ", "}
                  {a === "S. Yamali" ? <strong>{a}</strong> : a}
                </span>
              ))}
              , {w.year}.
            </p>
            <ul className="cv-points">
              {w.venues.map((v) => (
                <li key={v.venue}>
                  <em>{v.venue}</em>, {v.location}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </Section>

      <Section title="Ventures" delay={0.16}>
        {ventures.map((v) => (
          <Build key={v.name} item={v} />
        ))}
      </Section>

      <Section title="Projects" delay={0.2}>
        {projects.map((p) => (
          <Build key={p.name} item={p} />
        ))}
      </Section>

      <Section title="Skills" delay={0.24}>
        {skills.map((s) => (
          <div key={s.label} className="cv-skill">
            <div className="cv-skill-label">{s.label}</div>
            <div className="cv-skill-items">{s.items}</div>
          </div>
        ))}
      </Section>
    </main>
  );
}
