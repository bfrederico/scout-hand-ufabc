import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthenticated } from "../_lib/auth.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (isAuthenticated(req)) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
}
