import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Game } from "@/types";
import { getCachedGames } from "@/database/db";

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    getCachedGames().then((list) =>
      setGames(list.sort((a, b) => (a.date < b.date ? 1 : -1)))
    );
  }, []);

  return (
    <div>
      <h1>SCOUT-HAND-UFABC</h1>

      <Link to="/partidas/novo" className="btn btn-primary" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
        + NOVO JOGO
      </Link>

      <h3>Partidas recentes</h3>
      {games.length === 0 && <p style={{ color: "var(--color-text-muted)" }}>Nenhuma partida ainda.</p>}
      {games.map((game) => (
        <div className="card" key={game.id}>
          <strong>
            Nossa equipe {game.our_score} × {game.opponent_score} {game.opponent}
          </strong>
          <p style={{ color: "var(--color-text-muted)", margin: "4px 0 12px" }}>
            {game.date} • {game.status === "finished" ? "Finalizado" : game.status === "in_progress" ? "Em andamento" : "Agendado"}
          </p>
          {game.status === "finished" ? (
            <Link to={`/partidas/${game.id}/relatorio`} className="btn">
              VER RELATÓRIO
            </Link>
          ) : (
            <Link to={`/partidas/${game.id}/scout`} className="btn btn-primary">
              {game.status === "in_progress" ? "CONTINUAR SCOUT" : "COMEÇAR SCOUT"}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
