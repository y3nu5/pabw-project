import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { b as private_env } from "./shared-server.js";
const AUTH_COOKIE_NAME = "auth_token";
const DEFAULT_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const DEFAULT_BCRYPT_ROUNDS = 12;
function getJwtSecret() {
  if (!private_env.JWT_SECRET) {
    throw new Error("JWT_SECRET belum di-set.");
  }
  return private_env.JWT_SECRET;
}
function getBcryptRounds() {
  const rounds = Number(private_env.BCRYPT_SALT_ROUNDS ?? DEFAULT_BCRYPT_ROUNDS);
  return Number.isFinite(rounds) && rounds >= 8 ? Math.trunc(rounds) : DEFAULT_BCRYPT_ROUNDS;
}
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, getBcryptRounds());
}
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}
function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role
    },
    getJwtSecret(),
    {
      expiresIn: private_env.JWT_EXPIRES_IN || "7d"
    }
  );
}
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}
function setAuthCookie(cookies, token) {
  const isProd = private_env.NODE_ENV === "production";
  cookies.set(AUTH_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    // Di production (cross-domain): sameSite=none + secure=true
    // Di development (same-domain): sameSite=lax
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: Number(private_env.JWT_COOKIE_MAX_AGE ?? DEFAULT_TOKEN_MAX_AGE)
  });
}
function clearAuthCookie(cookies) {
  const isProd = private_env.NODE_ENV === "production";
  cookies.delete(AUTH_COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd
  });
}
function getAuthenticatedUser(cookies) {
  const token = cookies.get(AUTH_COOKIE_NAME);
  if (!token) return null;
  const decoded = verifyAccessToken(token);
  if (!decoded || typeof decoded !== "object") return null;
  const payload = decoded;
  return {
    id: Number(payload.sub),
    email: typeof payload.email === "string" ? payload.email : "",
    role: typeof payload.role === "string" ? payload.role : "guest"
  };
}
export {
  clearAuthCookie as a,
  createAccessToken as c,
  getAuthenticatedUser as g,
  hashPassword as h,
  setAuthCookie as s,
  verifyPassword as v
};
