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

  // "Contract Engineer (via subcontractor), SpaceX" is 45 characters, which no
  // monospace is fitting into a sidebar column — it wrapped in the middle of
  // the parenthetical, which is the worst place to break it. The caveat is a
  // detail of the arrangement, and the timeline entry states it in full; here
  // the job is the job.
  const now = current && {
    role: current.role.replace(/\s*\([^)]*\)/g, "").trim(),
    org: current.org,
  };

  const links = [
    ...socialLinks
      .filter((l) => ICON[l.label])
      .map((l) => ({ ...l, Icon: ICON[l.label] })),
    { label: "Résumé (PDF)", href: profile.resume, Icon: Doc },
  ];

  return (
    <aside className="author" aria-label="About the author">
      <div className="author-card">
        <h2 className="author-name">{profile.name}</h2>

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
            {/* Set as the institution sets itself — the university on one
                line, the campus on the next. The string is 34 characters and
                no monospace fits that beside a seal in a sidebar column, so
                the choice was a deliberate two-line lockup or a wrap that
                stranded "Berkeley" on its own and looked like a mistake. */}
            <div className="author-school">
              {education.school.split(",").map((part) => (
                <span key={part}>{part.trim()}</span>
              ))}
            </div>
            <div className="author-degree">{education.degree}</div>
          </div>
        </div>

        {/* Where I am, what I do and how to reach me are one rail, not three
            blocks divided by rules. Every row is an icon in the same 15px
            column and a line of text off the same left edge, so the card reads
            top to bottom as a single thing. The facts are quiet, the links
            take the ink and the hover — that difference, not a border, is
            what separates them. */}
        <ul className="author-rail">
          <li className="author-fact">
            <Pin />
            <span>{profile.location.split(" • ")[0]}</span>
          </li>
          {now && (
            <li className="author-fact">
              <Building />
              <span>
                {now.role} <span className="author-at">at</span> {now.org}
              </span>
            </li>
          )}

          {links.map(({ label, href, Icon }, i) => {
            const external = !href.startsWith("mailto");
            return (
              <li
                key={label}
                className={i === 0 ? "author-link author-link-first" : "author-link"}
              >
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
