// Landing.jsx — the main page. A statement, a bio, and the publications, in
// that order. The copy stays short on purpose: the pages behind it hold the
// detail, and a front page that tries to hold all of it gets skimmed instead
// of read.
import { motion } from "motion/react";
import TerrainBackground from "../TerrainBackground";
import { WashLink } from "../wash";
import { EASE_OUT } from "../motion";
import { research, publicationWorks } from "../data";

// The three that carry the research on their own.
const FEATURED = [
  "redcarpet-nctc-heatmap",
  "redcarpet-nctc-profile",
  "flyflirt-methods",
]
  .map((slug) => research.find((a) => a.file.includes(slug)))
  .filter(Boolean);

const lead = (delay) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE_OUT, delay },
});

const rise = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: EASE_OUT },
};

export default function Landing({ theme }) {
  return (
    <main className="classic">
      <TerrainBackground theme={theme} />

      <div className="landing-col">
        <motion.p className="landing-lede" {...lead(0.05)}>
          I study computer science at UC Berkeley and I work on measurement.
          Most of what I have built started as a judgement a person was making
          by hand, and the question each time was whether the same judgement
          could be read out of the data directly, at a scale a person cannot
          reach.
        </motion.p>

        <motion.section {...lead(0.12)}>
          <h2 className="h">Bio</h2>
          <p>
            From 2023 to 2025 I worked in two labs. At the Shao lab I built the
            computer vision behind a high-throughput <em>Drosophila</em>{" "}
            courtship assay, which replaced scoring the same behaviour by eye;
            it was presented at IBNGS and at HHMI Janelia. At the
            Children&rsquo;s Hospital of Philadelphia I worked on{" "}
            <WashLink to="/research">RedCarpet</WashLink>, which finds where
            bacterial genomes have taken DNA from each other by reading protein
            similarity as a signal along the chromosome and detecting where it
            shifts. That went to ISSSI in Perth.
          </p>
          <p>
            A method that only runs on the machine it was written on is not a
            method yet, so most of the work is tests, a pinned environment and a
            workflow somebody else in the lab can run. I do the same job outside
            the lab: LLM tooling at Visa now, developer tooling at Mercor
            before that. Mostly Python and TypeScript. There is also a{" "}
            <WashLink to="/explore">3D version of this site</WashLink> if you
            would rather walk around it.
          </p>
        </motion.section>

        <motion.section className="landing-work" {...rise}>
          <h2 className="h">
            From the research
            <WashLink to="/research" className="h-more">
              all {research.length} →
            </WashLink>
          </h2>

          <ul className="landing-figs">
            {FEATURED.map((f) => (
              <li key={f.file} className="landing-fig">
                <a href={f.file} target="_blank" rel="noopener noreferrer">
                  <span className="landing-fig-frame">
                    <img src={f.file} alt={f.title} loading="lazy" decoding="async" />
                  </span>
                  <span className="landing-fig-title">{f.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section className="landing-pubs" {...rise}>
          <h2 className="h">
            Publications
            <WashLink to="/publications" className="h-more">
              with citations →
            </WashLink>
          </h2>

          <ol className="landing-pub-list">
            {publicationWorks.map((w) => (
              <li key={w.title} className="landing-pub">
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
