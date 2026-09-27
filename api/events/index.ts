import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { supabaseAdmin } from "../_lib/supabaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const gameId = req.query.game_id as string | undefined;
    if (!gameId) {
      res.status(400).json({ error: "game_id é obrigatório" });
      return;
    }
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("game_id", gameId)
      .order("timestamp_ms", { ascending: true });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === "POST") {
    // sync_status é um campo só do IndexedDB local — não existe na tabela do Supabase
    const { sync_status, ...event } = req.body ?? {};

    // upsert por id (chave gerada no cliente) garante idempotência: reenviar
    // o mesmo evento (ex: retry após falha de rede) não cria duplicata.
    const { data, error } = await supabaseAdmin
      .from("events")
      .upsert(event, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // gol/gol_sofrido atualiza o placar automaticamente (seção 34)
    if (event.event_type === "gol" || event.event_type === "gol_sofrido") {
      const column = event.event_type === "gol" ? "our_score" : "opponent_score";
      const { data: game } = await supabaseAdmin
        .from("games")
        .select(column)
        .eq("id", event.game_id)
        .single();
      if (game) {
        await supabaseAdmin
          .from("games")
          .update({ [column]: (game as any)[column] + 1 })
          .eq("id", event.game_id);
      }
    }

    res.status(200).json(data);
    return;
  }

  res.status(405).end();
}
