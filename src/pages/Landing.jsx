// Landing.jsx — the main page. Two short paragraphs, centred, and nothing
// else. Publications live on their own page.
import { motion } from "motion/react";
import TerrainBackground from "../TerrainBackground";
import { WashLink } from "../wash";
import { EASE_OUT } from "../motion";

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
          I study computer science at UC Berkeley, and the work splits about
          evenly between industry software and research. On the industry side I
          build LLM tooling at Visa, I do contract engineering for SpaceX
          through a subcontractor, and before those I shipped developer tooling
          and a production experimentation service at Mercor. The research half
          is measurement. At the Shao lab I wrote the computer vision behind a
          high-throughput <em>Drosophila</em> courtship assay so the behaviour
          did not have to be scored by eye, and at the Children&rsquo;s
          Hospital of Philadelphia I worked on{" "}
          <WashLink to="/research">RedCarpet</WashLink>, which finds where
          bacterial genomes have taken DNA from each other by reading protein
          similarity as a signal along the chromosome and detecting where it
          shifts. Both of those started as something that ran once on my machine
          and only mattered once they became a pipeline with tests and a pinned
          environment that somebody else could run. Outside all of that I build{" "}
          <WashLink to="/ventures">products</WashLink> with a few friends,
          mostly things we wanted to exist, and I write about what I am reading.
          There is a <WashLink to="/explore">3D version of this site</WashLink>{" "}
          if you would rather walk around it.
        </motion.p>
      </div>
    </main>
  );
}
