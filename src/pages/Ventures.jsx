// Ventures.jsx — products with users behind them.
import WorkList from "./WorkList";
import { ventures } from "../data";

export default function Ventures() {
  return (
    <WorkList
      title="Ventures"
      lede="These went further than a project does. Each has users, a domain, and somebody who notices when it breaks."
      items={ventures}
    />
  );
}
