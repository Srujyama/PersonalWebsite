// Landing.jsx — the main page. Two short paragraphs and the publications.
// Everything else has a page of its own, and a front page that tries to hold
// all of it gets skimmed instead of read.
import { motion } from "motion/react";
import TerrainBackground from "../TerrainBackground";
import { WashLink } from "../wash";
import { EASE_OUT } from "../motion";
import { publicationWorks } from "../data";

const lead = (delay) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE_OUT, delay },
});

export default function Landing({ theme }) {
  return (
    <main className="classic">
      <TerrainBackground theme={theme} />

      <div className="landing-col">
        <motion.p className="landing-lede" {...lead(0.05)}>
          I study computer science at UC Berkeley and I work on measurement.
          Most of what I have built started as a judgement a person was making
          by hand, and the question each time was whether the same judgement
          could be read out of the data directly.
        </motion.p>

        <motion.p {...lead(0.12)}>
          That took me through two labs, some{" "}
          <WashLink to="/research">behavioural genetics and bacterial
          genomics</WashLink>, and now contract work for SpaceX and LLM tooling
          at Visa. There is a{" "}
          <WashLink to="/explore">3D version of this site</WashLink> if you
          would rather walk around it.
        </motion.p>

        <motion.section className="landing-pubs" {...lead(0.2)}>
          <h2 className="h">
            Publications
            <WashLink to="/publications" className="h-more">
              with citations →
            </WashLink>
          </h2>

          <ol className="landing-pub-list">
            {publicationWorks.map((w) => (
              <li key={w.title + w.venues[0].venue} className="landing-pub">
                <div className="landing-pub-title">{w.title}</div>
                <div className="landing-pub-authors">
                  {w.authors.map((a, j) => (
                    <span key={a}>
                      {j > 0 && ", "}
                      {a === "S. Yamali" ? <strong className="pub-me">{a}</strong> : a}
                    </span>
                  ))}
                  .
                </div>
                <div className="landing-pub-venues">
                  {w.venues.map((v) => v.venue).join(". ")} {w.year}
                </div>
              </li>
            ))}
          </ol>
        </motion.section>
      </div>
    </main>
  );
}
