import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Game } from "@/types";
import { cacheGame, getCachedGames } from "@/database/db";

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/games", { credentials: "include" });
        if (res.ok) {
          const data: Game[] = await res.json();
          await Promise.all(data.map(cacheGame));
          setGames(data);
          return;
        }
      } catch {
        // offline
      }
      setGames(await getCachedGames());
    })();
  }, []);

  return (
    <div>
      <h1>Partidas</h1>
      <Link to="/partidas/novo" className="btn btn-primary" style={{ display: "block", textAlign: "center", marginBottom: 16 }}>
        + NOVO JOGO
      </Link>
      {games
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((g) => (
          <div className="card" key={g.id}>
            <strong>{g.our_score} × {g.opponent_score} {g.opponent}</strong>
            <p style={{ color: "var(--color-text-muted)" }}>{g.date} • {g.competition} {g.phase}</p>
            <Link to={g.status === "finished" ? `/partidas/${g.id}/relatorio` : `/partidas/${g.id}/scout`} className="btn">
              {g.status === "finished" ? "Ver relatório" : "Ir para o scout"}
            </Link>
          </div>
        ))}
    </div>
  );
}
