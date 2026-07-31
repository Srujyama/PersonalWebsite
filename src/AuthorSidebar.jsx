// AuthorSidebar.jsx — the persistent author profile: who you are, where you
// are, and every way to reach you, present on every page rather than buried in
// a footer.
//
// No standing bio paragraph. The main page says it better and at length, and
// repeating a compressed version on every page makes readers skip both.
import { profile, education, experience, socialLinks } from "./data";
import { Github, LinkedIn, Mail, Doc, Pin, Building } from "./icons";

const ICON = { GitHub: Github, LinkedIn: LinkedIn, Email: Mail };

export default function AuthorSidebar() {
  const current = experience.find((e) => /present/i.test(e.dates));
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  const links = [
    ...socialLinks
      .filter((l) => ICON[l.label])
      .map((l) => ({ ...l, Icon: ICON[l.label] })),
    { label: "Résumé (PDF)", href: profile.resume, Icon: Doc },
    { label: "Research CV (PDF)", href: profile.researchResume, Icon: Doc },
  ];

  return (
    <aside className="author" aria-label="About the author">
      <div className="author-card">
        <div className="author-avatar" aria-hidden="true">
          {initials}
        </div>

        <h2 className="author-name">{profile.name}</h2>
        <p className="author-role">{profile.title}</p>

        {/* Affiliation carries the seal. On an academic site the institution is
            not a line of metadata, it is the letterhead. */}
        <div className="author-affil">
          <img
            className="author-seal"
            src={education.logo}
            alt=""
            width="46"
            height="46"
            loading="lazy"
          />
          <div>
            <div className="author-school">{education.school}</div>
            <div className="author-degree">{education.degree}</div>
          </div>
        </div>

        <ul className="author-meta">
          <li>
            <Pin />
            <span>{profile.location.split(" • ")[0]}</span>
          </li>
          {current && (
            <li>
              <Building />
              <span>
                {current.role}, {current.org}
              </span>
            </li>
          )}
        </ul>

        <ul className="author-links">
          {links.map(({ label, href, Icon }) => {
            const external = !href.startsWith("mailto");
            return (
              <li key={label}>
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                >
                  <Icon />
                  <span>{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
