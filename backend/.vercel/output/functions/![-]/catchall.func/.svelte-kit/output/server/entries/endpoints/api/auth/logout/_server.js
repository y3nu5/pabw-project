import { json } from "@sveltejs/kit";
import { a as clearAuthCookie } from "../../../../../chunks/auth.js";
async function POST({ cookies }) {
  clearAuthCookie(cookies);
  return json({
    message: "Logout berhasil."
  });
}
export {
  POST
};
