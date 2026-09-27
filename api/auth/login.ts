import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSessionToken, setSessionCookie } from "../_lib/auth.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const { email, password } = req.body ?? {};

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const token = createSessionToken(email);
  setSessionCookie(res, token);
  res.status(200).json({ ok: true });
}
