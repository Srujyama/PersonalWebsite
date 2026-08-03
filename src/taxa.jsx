// taxa.jsx — italicise scientific names inside a plain title string.
//
// Publication titles arrive as plain text, but a genus or a binomial is set in
// italic everywhere else in biology, and a reference list that ignores that
// reads as though it was typed by someone outside the field. This is a small
// fixed list rather than a general parser: it only has to cover the organisms
// that actually appear in this work, and a wrong guess would be worse than no
// italic at all.
const NAMES = [
  "Staphylococcus aureus",
  "Drosophila melanogaster",
  "Drosophila",
  "S. aureus",
];

const PATTERN = new RegExp(`(${NAMES.join("|")})`, "g");

export default function Taxa({ children }) {
  if (typeof children !== "string") return children;
  const parts = children.split(PATTERN);
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={i}>{part}</em> : part,
  );
}
