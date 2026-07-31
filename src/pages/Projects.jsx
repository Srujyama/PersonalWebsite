// Projects.jsx — things built for their own sake: research tooling and writing.
import WorkList from "./WorkList";
import { projects } from "../data";

export default function Projects() {
  return (
    <WorkList
      title="Projects"
      lede="Things I built because I needed them to exist. Two came out of lab work that could not move without them, and the third is where I write."
      items={projects}
    />
  );
}
