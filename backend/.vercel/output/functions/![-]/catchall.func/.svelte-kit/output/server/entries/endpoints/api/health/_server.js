import { json } from "@sveltejs/kit";
async function GET() {
  return json({
    ok: true,
    service: "booking-hotel-backend-api (SvelteKit)"
  });
}
export {
  GET
};
