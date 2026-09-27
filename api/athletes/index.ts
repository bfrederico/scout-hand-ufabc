import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("athletes")
      .select("*")
      .order("number", { ascending: true });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === "POST") {
    const { name, number, position, active } = req.body ?? {};
    if (!name || number === undefined || !position) {
      res.status(400).json({ error: "Campos obrigatórios: name, number, position" });
      return;
    }
    const { data, error } = await supabaseAdmin
      .from("athletes")
      .insert({ name, number, position, active: active ?? true })
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
    return;
  }

  res.status(405).end();
}
