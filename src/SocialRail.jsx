// SocialRail.jsx — GitHub / LinkedIn / Email pinned to the right edge. It only
// appears over the 3D world, where the author sidebar (which carries the same
// links, labelled) has stepped aside for the full-bleed canvas.
import { socialLinks } from "./data";
import { Github, LinkedIn, Mail } from "./icons";

const ICON = { GitHub: Github, LinkedIn: LinkedIn, Email: Mail };

export default function SocialRail() {
  return (
    <nav className="social-rail" aria-label="Social links">
      {socialLinks
        .filter((l) => ICON[l.label])
        .map(({ label, href }) => {
          const Icon = ICON[label];
          const external = !href.startsWith("mailto");
          return (
            <a
              key={label}
              href={href}
              className="social-rail-link"
              aria-label={label}
              title={label}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              <Icon />
            </a>
          );
        })}
    </nav>
  );
}
