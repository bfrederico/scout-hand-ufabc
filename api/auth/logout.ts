import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearSessionCookie } from "../_lib/auth.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
