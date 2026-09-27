import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import type {
  Athlete,
  Direction,
  EventType,
  OriginZone,
  Period,
  PenaltyType,
  ScoutEvent,
  ShotResult,
  ShotType,
  TurnoverType,
} from "@/types";
import {
  deleteEventLocally,
  getCachedAthletes,
  getEventsForGame,
  saveEventLocally,
} from "@/database/db";
import { syncPendingEvents } from "@/sync/syncEngine";
import CourtZoneSelector from "@/components/CourtZoneSelector";
import GoalDirectionSelector from "@/components/GoalDirectionSelector";

const SHOT_TYPES: { value: ShotType; label: string }[] = [
  { value: "direto", label: "Direto" },
  { value: "quicado", label: "Quicado" },
  { value: "apoio", label: "De apoio" },
];

const RESULTS: { value: ShotResult; label: string }[] = [
  { value: "gol", label: "GOL" },
  { value: "defesa", label: "Defesa" },
  { value: "fora", label: "Fora" },
  { value: "trave", label: "Trave" },
  { value: "bloqueio", label: "Bloqueio" },
];

const TURNOVER_TYPES: { value: TurnoverType; label: string }[] = [
  { value: "passe_errado", label: "Passe errado" },
  { value: "passos", label: "Passos" },
  { value: "drible", label: "Drible" },
  { value: "falta_tecnica", label: "Falta técnica" },
  { value: "bola_roubada", label: "Bola roubada" },
  { value: "jogo_passivo", label: "Jogo passivo" },
  { value: "outra", label: "Outra" },
];

const PENALTY_TYPES: { value: PenaltyType; label: string }[] = [
  { value: "advertencia", label: "Advertência" },
  { value: "dois_minutos", label: "2 minutos" },
  { value: "desqualificacao", label: "Vermelho" },
];

type Step =
  | "action"
  | "shot_zone"
  | "shot_type"
  | "shot_direction"
  | "shot_result"
  | "turnover_type"
  | "penalty_type";

function baseEvent(gameId: string, athleteId: string, period: Period, elapsedMs: number): ScoutEvent {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    game_id: gameId,
    timestamp_ms: elapsedMs,
    period,
    athlete_id: athleteId,
    event_type: "passe",
    created_at: now,
    updated_at: now,
    sync_status: "PENDING",
  };
}

export default function Scout() {
  const { gameId } = useParams<{ gameId: string }>();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [events, setEvents] = useState<ScoutEvent[]>([]);

  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [step, setStep] = useState<Step>("action");
  const [draft, setDraft] = useState<Partial<ScoutEvent>>({});

  const [period, setPeriod] = useState<Period>("1T");
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!gameId) return;
    getCachedAthletes().then(setAthletes);
    getEventsForGame(gameId).then((list) =>
      setEvents(list.sort((a, b) => a.timestamp_ms - b.timestamp_ms))
    );
  }, [gameId]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsedMs((ms) => ms + 1000), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const score = useMemo(() => {
    let ours = 0;
    let theirs = 0;
    for (const ev of events) {
      if (ev.event_type === "gol") ours += 1;
      if (ev.event_type === "gol_sofrido") theirs += 1;
    }
    return { ours, theirs };
  }, [events]);

  const lastEvent = events[events.length - 1];

  function formatClock(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  async function commitEvent(partial: Partial<ScoutEvent>) {
    if (!selectedAthlete || !gameId) return;
    const event: ScoutEvent = {
      ...baseEvent(gameId, selectedAthlete.id, period, elapsedMs),
      ...partial,
    };
    await saveEventLocally(event);
    setEvents((prev) => [...prev, event]);
    syncPendingEvents();
    reset();
  }

  function reset() {
    setSelectedAthlete(null);
    setStep("action");
    setDraft({});
  }

  async function handleUndo() {
    if (!lastEvent) return;
    await deleteEventLocally(lastEvent.id);
    setEvents((prev) => prev.slice(0, -1));
  }

  function chooseAction(action: EventType) {
    setDraft({ event_type: action });
    if (action === "arremesso" || action === "sete_metros" || action === "contra_ataque" || action === "defesa_goleira" || action === "gol_sofrido") {
      setStep(action === "sete_metros" ? "shot_type" : "shot_zone");
    } else if (action === "perda") {
      setStep("turnover_type");
    } else if (action === "falta_cometida") {
      setStep("penalty_type");
    } else {
      // ações simples: passe, roubo_bola, bloqueio, falta_sofrida
      commitEvent({ event_type: action });
    }
  }

  function chooseZone(zone: OriginZone) {
    setDraft((d) => ({ ...d, origin_zone: zone }));
    setStep("shot_type");
  }

  function chooseShotType(type: ShotType) {
    setDraft((d) => ({ ...d, shot_type: type }));
    setStep("shot_direction");
  }

  function chooseDirection(dir: Direction) {
    setDraft((d) => ({ ...d, direction: dir }));
    setStep("shot_result");
  }

  function chooseResult(result: ShotResult) {
    const finalType = draft.event_type === "gol_sofrido" || draft.event_type === "defesa_goleira"
      ? result === "gol" ? "gol_sofrido" : "defesa_goleira"
      : result === "gol" ? "gol" : draft.event_type!;
    commitEvent({ ...draft, result, event_type: finalType as EventType });
  }

  function chooseTurnover(type: TurnoverType) {
    commitEvent({ event_type: "perda", turnover_type: type });
  }

  function choosePenalty(type: PenaltyType) {
    commitEvent({ event_type: "falta_cometida", penalty_type: type });
  }

  if (!gameId) return <p>Partida não encontrada.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Cabeçalho: placar e relógio (seção 16, 32-34) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
        <strong>Nossa equipe</strong>
        <span style={{ fontSize: 24, fontWeight: 700 }}>{score.ours} × {score.theirs}</span>
        <strong>Adversário</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          <option value="1T">1º tempo</option>
          <option value="intervalo">Intervalo</option>
          <option value="2T">2º tempo</option>
        </select>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatClock(elapsedMs)}</span>
        <button className="btn" onClick={() => setRunning((r) => !r)}>{running ? "Pausar" : "Iniciar"}</button>
      </div>

      {/* Corpo: atletas + ação (seção 16-19) */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!selectedAthlete && (
          <>
            <h3>Selecione a atleta</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 8 }}>
              {athletes.map((a) => (
                <button key={a.id} className="btn" onClick={() => setSelectedAthlete(a)}>
                  #{a.number}
                </button>
              ))}
            </div>
          </>
        )}

        {selectedAthlete && step === "action" && (
          <>
            <h3>#{selectedAthlete.number} {selectedAthlete.name} — ação</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              <button className="btn btn-primary" onClick={() => chooseAction("arremesso")}>Arremesso</button>
              <button className="btn" onClick={() => chooseAction("passe")}>Passe</button>
              <button className="btn" onClick={() => chooseAction("sete_metros")}>7 metros</button>
              <button className="btn" onClick={() => chooseAction("contra_ataque")}>Contra-ataque</button>
              <button className="btn" onClick={() => chooseAction("perda")}>Perda de bola</button>
              <button className="btn" onClick={() => chooseAction("falta_sofrida")}>Falta sofrida</button>
              <button className="btn" onClick={() => chooseAction("roubo_bola")}>Roubo de bola</button>
              <button className="btn" onClick={() => chooseAction("bloqueio")}>Bloqueio</button>
              <button className="btn btn-danger" onClick={() => chooseAction("falta_cometida")}>Falta cometida</button>
              {selectedAthlete.position === "goleira" && (
                <button className="btn" onClick={() => chooseAction("gol_sofrido")}>Arremesso adversário</button>
              )}
            </div>
            <button className="btn" style={{ marginTop: 16 }} onClick={reset}>Cancelar</button>
          </>
        )}

        {step === "shot_zone" && (
          <>
            <h3>Origem — toque na quadra</h3>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <CourtZoneSelector onSelect={chooseZone} />
            </div>
          </>
        )}

        {step === "shot_type" && (
          <>
            <h3>Tipo</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {SHOT_TYPES.map((t) => (
                <button key={t.value} className="btn" onClick={() => chooseShotType(t.value)}>{t.label}</button>
              ))}
            </div>
          </>
        )}

        {step === "shot_direction" && (
          <>
            <h3>Direção — toque no gol</h3>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <GoalDirectionSelector onSelect={chooseDirection} />
            </div>
          </>
        )}

        {step === "shot_result" && (
          <>
            <h3>Resultado</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {RESULTS.map((r) => (
                <button key={r.value} className={r.value === "gol" ? "btn btn-primary" : "btn"} onClick={() => chooseResult(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "turnover_type" && (
          <>
            <h3>Tipo de perda</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {TURNOVER_TYPES.map((t) => (
                <button key={t.value} className="btn" onClick={() => chooseTurnover(t.value)}>{t.label}</button>
              ))}
            </div>
          </>
        )}

        {step === "penalty_type" && (
          <>
            <h3>Punição</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(1, 1fr)", gap: 8 }}>
              {PENALTY_TYPES.map((p) => (
                <button key={p.value} className="btn btn-danger" onClick={() => choosePenalty(p.value)}>{p.label}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Última ação + desfazer (seção 16, 35-36) */}
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
          {lastEvent
            ? `Última ação: #${athletes.find((a) => a.id === lastEvent.athlete_id)?.number ?? "?"} • ${lastEvent.event_type}`
            : "Nenhuma ação registrada"}
        </span>
        <button className="btn" onClick={handleUndo} disabled={!lastEvent}>DESFAZER</button>
      </div>
    </div>
  );
}
