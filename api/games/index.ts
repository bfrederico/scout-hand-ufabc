import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { supabaseAdmin } from "../_lib/supabaseAdmin";

interface RosterInput {
  athlete_id: string;
  is_goalkeeper: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("games")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === "POST") {
    const { date, competition, phase, opponent, location, video_url, roster } = req.body as {
      date: string;
      competition?: string;
      phase?: string;
      opponent: string;
      location?: string;
      video_url?: string;
      roster: RosterInput[];
    };

    if (!date || !opponent) {
      res.status(400).json({ error: "Campos obrigatórios: date, opponent" });
      return;
    }

    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .insert({
        date,
        competition,
        phase,
        opponent,
        location,
        video_url,
        status: "in_progress",
      })
      .select()
      .single();

    if (gameError) {
      res.status(500).json({ error: gameError.message });
      return;
    }

    if (roster?.length) {
      const rows = roster.map((r) => ({
        game_id: game.id,
        athlete_id: r.athlete_id,
        present: true,
        is_goalkeeper: r.is_goalkeeper,
      }));
      const { error: rosterError } = await supabaseAdmin.from("game_roster").insert(rows);
      if (rosterError) {
        res.status(500).json({ error: rosterError.message });
        return;
      }
    }

    res.status(201).json(game);
    return;
  }

  res.status(405).end();
}
