import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Athlete } from "@/types";
import { getCachedAthletes, cacheAthletes } from "@/database/db";

export default function NewGame() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [goalkeepers, setGoalkeepers] = useState<Set<string>>(new Set());

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [competition, setCompetition] = useState("");
  const [phase, setPhase] = useState("");
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/athletes", { credentials: "include" });
        if (res.ok) {
          const data: Athlete[] = await res.json();
          setAthletes(data.filter((a) => a.active));
          await cacheAthletes(data);
          return;
        }
      } catch {
        // offline
      }
      setAthletes((await getCachedAthletes()).filter((a) => a.active));
    })();
  }, []);

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        date,
        competition,
        phase,
        opponent,
        location,
        video_url: videoUrl,
        roster: athletes
          .filter((a) => present.has(a.id))
          .map((a) => ({ athlete_id: a.id, is_goalkeeper: goalkeepers.has(a.id) })),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const game = await res.json();
      navigate(`/partidas/${game.id}/scout`);
    }
  }

  return (
    <div>
      <h1>Novo jogo</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>Data
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>Competição
          <input value={competition} onChange={(e) => setCompetition(e.target.value)} />
        </label>
        <label>Fase
          <input value={phase} onChange={(e) => setPhase(e.target.value)} />
        </label>
        <label>Adversário
          <input value={opponent} onChange={(e) => setOpponent(e.target.value)} required />
        </label>
        <label>Local
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label>Vídeo da partida (URL YouTube)
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </label>

        <h3>Atletas presentes</h3>
        {athletes.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={present.has(a.id)}
              onChange={() => toggle(present, setPresent, a.id)}
            />
            <span>#{a.number} {a.name}</span>
            {present.has(a.id) && a.position === "goleira" && (
              <label style={{ marginLeft: "auto", fontSize: 13, color: "var(--color-text-muted)" }}>
                <input
                  type="checkbox"
                  checked={goalkeepers.has(a.id)}
                  onChange={() => toggle(goalkeepers, setGoalkeepers, a.id)}
                />
                {" "}goleira em quadra
              </label>
            )}
          </div>
        ))}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Criando..." : "COMEÇAR SCOUT"}
        </button>
      </form>
    </div>
  );
}
