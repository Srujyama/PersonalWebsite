// track.js — records one page view. src/track.js sends it with sendBeacon.
//
// Where the visitor is comes from the headers Vercel adds at its edge, so
// no lookup service is involved. Crawlers and link-preview fetchers are
// dropped, and the log keeps the newest MAX views.

import { hasRedis, redis } from "./_redis.js";

const MAX = 10000;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python|axios|node-fetch|go-http/i;

const clip = (v, n) => String(v ?? "").slice(0, n);
const header = (h, name) => {
  const v = h.get(name) || "";
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

export async function POST(request) {
  const h = request.headers;
  const ua = h.get("user-agent") || "";
  if (!hasRedis() || BOT.test(ua)) return new Response(null, { status: 204 });

  let body = {};
  try {
    body = JSON.parse(await request.text());
  } catch {}

  const visit = {
    t: Date.now(),
    path: clip(body.path || "/", 200),
    ref: clip(body.ref, 300),
    vid: clip(body.vid, 40),
    screen: clip(body.screen, 20),
    lang: clip(h.get("accept-language")?.split(",")[0], 20),
    ip: clip((h.get("x-forwarded-for") || "").split(",")[0].trim(), 64),
    city: clip(header(h, "x-vercel-ip-city"), 80),
    region: clip(header(h, "x-vercel-ip-country-region"), 20),
    country: clip(header(h, "x-vercel-ip-country"), 4),
    ua: clip(ua, 300),
  };

  try {
    await redis(["LPUSH", "visits", JSON.stringify(visit)], ["LTRIM", "visits", "0", String(MAX - 1)]);
  } catch (e) {
    console.error("track:", e.message);
  }
  return new Response(null, { status: 204 });
}
