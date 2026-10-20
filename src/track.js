// track.js — tells /api/track that this page was viewed, for the log at /admin.
//
// One beacon per page load, sent without delaying anything. A random id kept
// in localStorage groups one visitor's views together. Signing in at /admin
// sets "notrack" on that browser, so your own visits stay out of the log, and
// nothing is sent from a local dev server.

const ID_KEY = "vid";

function store(fn) {
  try {
    return fn(localStorage);
  } catch {
    return null;
  }
}

function visitorId() {
  let id = store((s) => s.getItem(ID_KEY));
  if (!id) {
    id = Math.random().toString(36).slice(2, 12);
    store((s) => s.setItem(ID_KEY, id));
  }
  return id;
}

const local = /^(localhost|127\.|\[::1\])/.test(location.hostname);
if (!local && !store((s) => s.getItem("notrack")) && navigator.sendBeacon) {
  navigator.sendBeacon(
    "/api/track",
    JSON.stringify({
      path: location.pathname + location.search,
      ref: document.referrer,
      vid: visitorId(),
      screen: `${screen.width}x${screen.height}`,
    }),
  );
}
