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
      </div>
    </main>
  );
}
