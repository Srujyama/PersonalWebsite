// Ventures.jsx — products with users behind them.
import WorkList from "./WorkList";
import { ventures } from "../data";

export default function Ventures() {
  return (
    <WorkList title="Ventures" items={ventures} />
  );
}
