import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { supabaseAdmin } from "../_lib/supabaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;

  const id = req.query.id as string;

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("games").select("*").eq("id", id).single();
    if (error) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === "PATCH") {
    // usado para atualizar placar em tempo real e para finalizar a partida
    const updates = req.body ?? {};
    const { data, error } = await supabaseAdmin
      .from("games")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  res.status(405).end();
}
