// SiteChrome.jsx — an academic-site frame: a persistent top nav, a persistent
// author sidebar, and the page in the remaining column. The sidebar carries
// the identity, so the header needs no wordmark.
//
// The one exception is the 3D world, which is a full-bleed fixed canvas, so
// the frame steps out of the way and shows only the nav floating over it.
import { useEffect } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import AuthorSidebar from "./AuthorSidebar";
import SocialRail from "./SocialRail";
import { WashLink } from "./wash";
import { useCanRunWorld } from "./heroPref";

export const NAV = [
  { to: "/", label: "Main" },
  { to: "/experience", label: "Experience" },
  { to: "/projects", label: "Projects" },
  { to: "/research", label: "Research" },
  { to: "/publications", label: "Publications" },
  { to: "/ventures", label: "Ventures" },
];

function Header({ theme, onToggleTheme, pathname }) {
  return (
    <header className="chrome">
      <nav className="topnav" aria-label="Primary">
        {NAV.map((n) => {
          const active =
            n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          return (
            <WashLink
              key={n.to}
              to={n.to}
              className={`topnav-link ${active ? "topnav-link-on" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {n.label}
            </WashLink>
          );
        })}
      </nav>

      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={
          theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
        }
      >
        <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        <span className="theme-toggle-label">
          {theme === "dark" ? "light" : "dark"}
        </span>
      </button>
    </header>
  );
}

export default function SiteChrome({ theme, onToggleTheme }) {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  // Fresh navigation starts at the top; back/forward keeps restored scroll.
  useEffect(() => {
    if (navType !== "POP") window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, navType]);

  // /explore only takes over the frame when the world can actually run. On a
  // phone it renders a written fallback instead, and that page wants the normal
  // sidebar rather than the world's floating rail.
  const capable = useCanRunWorld();
  const worldOpen = pathname === "/explore" && capable;
  // The main page is short enough to sit centred rather than pinned to the top.
  const home = pathname === "/";

  return (
    <div className={`shell ${worldOpen ? "shell-world" : ""}`}>
      <Header theme={theme} onToggleTheme={onToggleTheme} pathname={pathname} />
      {worldOpen ? (
        <>
          <Outlet />
          {/* The sidebar's labelled links go with it, so the rail is the only
              way out to GitHub / LinkedIn / email while in the world. */}
          <SocialRail />
        </>
      ) : (
        <div className={`layout ${home ? "layout-home" : ""}`}>
          <AuthorSidebar />
          <div className="layout-main">
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}
