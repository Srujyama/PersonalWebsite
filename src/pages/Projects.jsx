// Projects.jsx — things built for their own sake: research tooling and writing.
import WorkList from "./WorkList";
import { projects } from "../data";

export default function Projects() {
  return (
    <WorkList title="Projects" items={projects} />
  );
}
