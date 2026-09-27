import { useEffect, useState, type FormEvent } from "react";
import type { Athlete, Position } from "@/types";
import { cacheAthletes, getCachedAthletes } from "@/database/db";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "goleira", label: "Goleira" },
  { value: "ponta_esquerda", label: "Ponta esquerda" },
  { value: "ponta_direita", label: "Ponta direita" },
  { value: "armadora", label: "Armadora" },
  { value: "central", label: "Central" },
  { value: "pivo", label: "Pivô" },
];

export default function Athletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState<Position>("armadora");

  async function loadAthletes() {
    try {
      const res = await fetch("/api/athletes", { credentials: "include" });
      if (res.ok) {
        const data: Athlete[] = await res.json();
        setAthletes(data);
        await cacheAthletes(data);
        return;
      }
    } catch {
      // sem conexão — cai para o cache local
    }
    setAthletes(await getCachedAthletes());
  }

  useEffect(() => {
    loadAthletes();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/athletes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, number: Number(number), position, active: true }),
    });
    setName("");
    setNumber("");
    setShowForm(false);
    loadAthletes();
  }

  const active = athletes.filter((a) => a.active).sort((a, b) => a.number - b.number);

  return (
    <div>
      <h1>Minha equipe</h1>

      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowForm((s) => !s)}>
        + NOVA ATLETA
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required
            style={{ padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-alt)", color: "var(--color-text)" }} />
          <input placeholder="Número" type="number" value={number} onChange={(e) => setNumber(e.target.value)} required
            style={{ padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-alt)", color: "var(--color-text)" }} />
          <select value={position} onChange={(e) => setPosition(e.target.value as Position)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-alt)", color: "var(--color-text)" }}>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">Salvar</button>
        </form>
      )}

      {active.map((a) => (
        <div className="card" key={a.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <strong style={{ fontSize: 20, color: "var(--color-primary-light)" }}>#{a.number}</strong>
          <div>
            <div>{a.name}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              {POSITIONS.find((p) => p.value === a.position)?.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
