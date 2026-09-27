import { useEffect, useState } from "react";
import { getCachedGames } from "@/database/db";
import type { Game } from "@/types";
import { Link } from "react-router-dom";

// Versão inicial: lista partidas finalizadas com link para o relatório.
// O cálculo detalhado (eficiência, mapas, gráficos — seções 37 e 41) é o
// próximo passo depois deste scaffold estar rodando.
export default function Statistics() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    getCachedGames().then((list) => setGames(list.filter((g) => g.status === "finished")));
  }, []);

  return (
    <div>
      <h1>Estatísticas</h1>
      {games.length === 0 && <p style={{ color: "var(--color-text-muted)" }}>Nenhuma partida finalizada ainda.</p>}
      {games.map((g) => (
        <Link key={g.id} to={`/partidas/${g.id}/relatorio`} className="card" style={{ display: "block", color: "inherit", textDecoration: "none" }}>
          <strong>{g.our_score} × {g.opponent_score} {g.opponent}</strong>
          <p style={{ color: "var(--color-text-muted)" }}>{g.date}</p>
        </Link>
      ))}
    </div>
  );
}
