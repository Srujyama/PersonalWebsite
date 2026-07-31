// Explore.jsx — the 3D world, on its own route. It used to share "/" with the
// flat page behind a stored preference, which meant one URL rendered two
// different sites depending on your localStorage. Giving it an address is
// simpler for everyone, including the load-in, which now always has the same
// relief to dissolve into on "/".
import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TerrainFallback } from "../TerrainBackground";
import WorldPanel from "../WorldPanel";
import { WashLink } from "../wash";
import { useCanRunWorld } from "../heroPref";
import {
  profile,
  socialLinks,
  experience,
  projects,
  ventures,
  publicationWorks,
} from "../data";

const World3D = lazy(() => import("../World3D"));

function WorldLoading() {
  return (
    <>
      <TerrainFallback />
      <div className="explore-loading" role="status" aria-live="polite">
        <span>Loading 3D world…</span>
      </div>
    </>
  );
}

export default function Explore({ theme }) {
  const capable = useCanRunWorld();
  const navigate = useNavigate();
  const [station, setStation] = useState(null);

  // Leaving the world, and every way the world can fail (render error, lost
  // context), all land in the same place: the written site.
  const leave = useCallback(() => navigate("/"), [navigate]);

  // Esc closes an open station panel.
  useEffect(() => {
    if (!station) return;
    const onKey = (e) => {
      if (e.key === "Escape") setStation(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [station]);

  // The world wants a fine pointer, a real GPU and no reduced-motion
  // preference. Say so plainly instead of handing over a blank canvas.
  if (!capable) {
    return (
      <main className="page">
        <header className="page-head">
          <h1 className="h1">Explore</h1>
          <p className="page-lede">
            The 3D version needs WebGL2, a mouse or trackpad, and a window at
            least 768px wide, and it stays off when your system asks for reduced
            motion. Everything in it is on the written pages as well.
          </p>
        </header>
        <div className="landing-cta">
          <WashLink to="/research" className="pill pill-accent">
            Research
          </WashLink>
          <WashLink to="/cv" className="pill">
            CV
          </WashLink>
        </div>
      </main>
    );
  }

  return (
    <main className="explore-root">
      <h1 className="sr-only">Srujan Yamali — explorable portfolio</h1>
      <Suspense fallback={<WorldLoading />}>
        <World3D
          theme={theme}
          activeStation={station}
          onOpenStation={setStation}
          onExitWorld={leave}
        />
      </Suspense>
      <WorldPanel
        station={station}
        onClose={() => setStation(null)}
        profile={profile}
        socialLinks={socialLinks}
        experience={experience}
        projects={projects}
        ventures={ventures}
        publications={publicationWorks}
      />
    </main>
  );
}
