import { useState } from "react";
import type { OriginZone } from "@/types";

/**
 * Quadra interativa (seções 19-20 do spec).
 *
 * "7m" tem fluxo próprio (ação "7 metros" pula direto para o tipo de
 * arremesso) e por isso não é uma zona tocável aqui.
 */
export type CourtZone = Exclude<OriginZone, "7m">;

interface Props {
  onSelect: (zone: CourtZone) => void;
}

const CX = 200;
const CY = 6;
const R_6M = 80;
const R_9M = 140;
const R_OUTER = 232;
const WING_ANGLE = 36; // limite do setor central (6m / 9m)
const MAX_ANGLE = 82; // limite das pontas / largura da quadra

function polar(r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY + r * Math.cos(rad) };
}

/** Setor de anel (fatia entre dois raios e dois ângulos), aproximado por polígono
 * para não depender de flags de sweep de arco SVG. */
function sectorPath(rInner: number, rOuter: number, a1: number, a2: number, steps = 24): string {
  const outer: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a1 + ((a2 - a1) * i) / steps;
    const p = polar(rOuter, a);
    outer.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  const inner: string[] = [];
  for (let i = steps; i >= 0; i--) {
    const a = a1 + ((a2 - a1) * i) / steps;
    const p = polar(rInner, a);
    inner.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return `M ${[...outer, ...inner].join(" L ")} Z`;
}

const mid6 = polar(R_6M * 0.55, 0);
const mid9 = polar((R_6M + R_9M) / 2, 0);
const midCA = polar((R_9M + R_OUTER) / 2, 0);
const midEsq = polar(R_9M * 0.72, -(WING_ANGLE + MAX_ANGLE) / 2);
const midDir = polar(R_9M * 0.72, (WING_ANGLE + MAX_ANGLE) / 2);

const ZONES: { key: CourtZone; label: string; path: string; labelPos: { x: number; y: number } }[] = [
  { key: "6m", label: "6m", path: sectorPath(0, R_6M, -WING_ANGLE, WING_ANGLE), labelPos: mid6 },
  { key: "9m", label: "9m", path: sectorPath(R_6M, R_9M, -WING_ANGLE, WING_ANGLE), labelPos: mid9 },
  {
    key: "ponta_esquerda",
    label: "PONTA E",
    path: sectorPath(0, R_9M, -MAX_ANGLE, -WING_ANGLE),
    labelPos: midEsq,
  },
  {
    key: "ponta_direita",
    label: "PONTA D",
    path: sectorPath(0, R_9M, WING_ANGLE, MAX_ANGLE),
    labelPos: midDir,
  },
  {
    key: "contra_ataque",
    label: "CONTRA-ATAQUE",
    path: sectorPath(R_9M, R_OUTER, -MAX_ANGLE, MAX_ANGLE),
    labelPos: midCA,
  },
];

const ZONE_FILL: Record<CourtZone, string> = {
  "6m": "var(--color-primary)",
  "9m": "var(--color-primary-light)",
  ponta_esquerda: "var(--color-pass)",
  ponta_direita: "var(--color-pass)",
  contra_ataque: "var(--color-surface-alt)",
};

export default function CourtZoneSelector({ onSelect }: Props) {
  const [pressed, setPressed] = useState<CourtZone | null>(null);

  return (
    <svg
      viewBox="0 0 400 250"
      style={{ width: "100%", maxWidth: 440, touchAction: "manipulation" }}
      role="group"
      aria-label="Selecione a origem do arremesso na quadra"
    >
      {ZONES.map((zone) => {
        const isPressed = pressed === zone.key;
        return (
          <g key={zone.key}>
            <path
              d={zone.path}
              fill={ZONE_FILL[zone.key]}
              fillOpacity={isPressed ? 0.95 : 0.28}
              stroke="var(--color-border)"
              strokeWidth={1.5}
              onPointerDown={() => setPressed(zone.key)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onClick={() => onSelect(zone.key)}
              style={{ cursor: "pointer", transition: "fill-opacity 80ms ease" }}
            />
            <text
              x={zone.labelPos.x}
              y={zone.labelPos.y}
              textAnchor="middle"
              fill="var(--color-text)"
              fontSize={zone.key === "contra_ataque" ? 12 : 14}
              fontWeight={700}
              pointerEvents="none"
              style={{ userSelect: "none" }}
            >
              {zone.label}
            </text>
          </g>
        );
      })}

      {/* traves do gol, apenas de referência visual */}
      <rect
        x={170}
        y={-14}
        width={60}
        height={16}
        rx={2}
        fill="none"
        stroke="var(--color-text)"
        strokeWidth={3}
        pointerEvents="none"
      />
    </svg>
  );
}
