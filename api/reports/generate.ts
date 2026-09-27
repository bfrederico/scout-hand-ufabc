import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";

// TODO (próxima etapa, seções 39-41 do spec): buscar eventos + estatísticas
// agregadas do jogo e montar o PDF (ex: com pdf-lib ou @react-pdf/renderer),
// incluindo mapas de arremesso/gol/defesa e gráficos de desempenho.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;
  res.status(501).json({ error: "Geração de PDF ainda não implementada" });
}
