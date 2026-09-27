import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const COOKIE_NAME = "scouthand_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET as string;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionToken(email: string) {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${email}.${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [email, expiresStr, signature] = parts;
  const expected = sign(`${email}.${expiresStr}`);
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return false;
  return Date.now() < Number(expiresStr);
}

export function setSessionCookie(res: VercelResponse, token: string) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`
  );
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
}

export function isAuthenticated(req: VercelRequest): boolean {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Não autenticado" });
    return false;
  }
  return true;
}
