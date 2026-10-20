// admin.js — the password check and the visit log behind /admin.
//
//   POST   {password}  sign in; sets an HttpOnly session cookie
//   GET                the visit log, newest first (needs the cookie)
//   DELETE             sign out
//
// The password is the ADMIN_PASSWORD environment variable, never the source:
// the repository is public. The session cookie is an expiry time signed with
// a key derived from the password, so changing the password signs everyone
// out. Sign-in attempts are limited per IP so the password can't be guessed
// by brute force.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { hasRedis, redis } from "./_redis.js";

const COOKIE = "admin_session";
const SESSION_S = 7 * 24 * 3600;
const ATTEMPTS = 8; // per IP per window
const WINDOW_S = 15 * 60;

const PASSWORD = process.env.ADMIN_PASSWORD || "";
const KEY = createHash("sha256").update(`session:${PASSWORD}`).digest();

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });

const sha = (s) => createHash("sha256").update(s).digest();
const sign = (s) => createHmac("sha256", KEY).update(s).digest("base64url");
const sameText = (a, b) => timingSafeEqual(sha(a), sha(b));

function cookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/api/admin; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

function signedIn(request) {
  const raw = (request.headers.get("cookie") || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw || !PASSWORD) return false;
  const [exp, mac] = raw.slice(COOKIE.length + 1).split(".");
  if (!exp || !mac || Number(exp) < Date.now() / 1000) return false;
  return sameText(mac, sign(exp));
}

export async function POST(request) {
  if (!PASSWORD) return json({ error: "ADMIN_PASSWORD is not set on the server." }, 500);

  const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (hasRedis()) {
    const [tries] = await redis(["INCR", `login:${ip}`], ["EXPIRE", `login:${ip}`, String(WINDOW_S), "NX"]);
    if (tries > ATTEMPTS) return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  }

  let password = "";
  try {
    password = String((await request.json()).password ?? "");
  } catch {}
  if (!sameText(password, PASSWORD)) return json({ error: "Wrong password." }, 401);

  if (hasRedis()) await redis(["DEL", `login:${ip}`]);
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_S);
  return json({ ok: true }, 200, { "Set-Cookie": cookie(`${exp}.${sign(exp)}`, SESSION_S) });
}

export async function GET(request) {
  if (!signedIn(request)) return json({ error: "Not signed in." }, 401);
  if (!hasRedis()) return json({ error: "No database is connected to this project yet." }, 503);
  const [rows] = await redis(["LRANGE", "visits", "0", "-1"]);
  const visits = rows.flatMap((r) => {
    try {
      return [JSON.parse(r)];
    } catch {
      return [];
    }
  });
  return json({ visits });
}

export async function DELETE() {
  return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
}
