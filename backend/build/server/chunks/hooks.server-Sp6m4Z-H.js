import { b as private_env } from './shared-server-cF6ckHns.js';

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  // URL frontend production (dari env variable)
  ...private_env.FRONTEND_URL ? [private_env.FRONTEND_URL.trim().replace(/\/$/, "")] : []
];
async function handle({ event, resolve }) {
  const origin = event.request.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  const corsOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];
  if (event.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true"
      }
    });
  }
  const response = await resolve(event);
  response.headers.set("Access-Control-Allow-Origin", corsOrigin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export { handle };
//# sourceMappingURL=hooks.server-Sp6m4Z-H.js.map
