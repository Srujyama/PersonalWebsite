// _redis.js — the visit log lives in an Upstash Redis database, reached over
// its REST API so the functions need no client library. Connecting the
// database to the Vercel project (Storage → Upstash for Redis) sets the URL
// and token; either naming scheme works. Files starting with _ are not routes.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasRedis = () => Boolean(URL_ && TOKEN);

// Runs the commands as one pipeline and returns each command's result.
export async function redis(...commands) {
  if (!hasRedis()) throw new Error("Redis is not configured");
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const out = await res.json();
  return out.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}
