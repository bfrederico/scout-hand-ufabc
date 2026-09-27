import { useState } from "react";
import type { Direction } from "@/types";

/** Gol interativo com a grade 3×3 da seção 21 do spec. */
interface Props {
  onSelect: (direction: Direction) => void;
}

const CELLS: { key: Direction; icon: string; col: number; row: number }[] = [
  { key: "cima_esquerda", icon: "↖", col: 0, row: 0 },
  { key: "cima_centro", icon: "↑", col: 1, row: 0 },
  { key: "cima_direita", icon: "↗", col: 2, row: 0 },
  { key: "meio_esquerda", icon: "←", col: 0, row: 1 },
  { key: "meio_centro", icon: "●", col: 1, row: 1 },
  { key: "meio_direita", icon: "→", col: 2, row: 1 },
  { key: "baixo_esquerda", icon: "↙", col: 0, row: 2 },
  { key: "baixo_centro", icon: "↓", col: 1, row: 2 },
  { key: "baixo_direita", icon: "↘", col: 2, row: 2 },
];

const FRAME_X = 20;
const FRAME_Y = 20;
const FRAME_W = 260;
const FRAME_H = 160;
const CELL_W = FRAME_W / 3;
const CELL_H = FRAME_H / 3;

export default function GoalDirectionSelector({ onSelect }: Props) {
  const [pressed, setPressed] = useState<Direction | null>(null);

  return (
    <svg
      viewBox="0 0 300 210"
      style={{ width: "100%", maxWidth: 340, touchAction: "manipulation" }}
      role="group"
      aria-label="Selecione a direção do arremesso no gol"
    >
      <defs>
        <pattern id="goalNet" width={8} height={8} patternUnits="userSpaceOnUse">
          <path d="M0,8 L8,0" stroke="var(--color-text-muted)" strokeWidth={0.5} opacity={0.35} />
          <path d="M-2,2 L2,-2" stroke="var(--color-text-muted)" strokeWidth={0.5} opacity={0.35} />
          <path d="M6,10 L10,6" stroke="var(--color-text-muted)" strokeWidth={0.5} opacity={0.35} />
        </pattern>
      </defs>

      <rect x={FRAME_X} y={FRAME_Y} width={FRAME_W} height={FRAME_H} fill="url(#goalNet)" pointerEvents="none" />

      {CELLS.map((cell) => {
        const x = FRAME_X + cell.col * CELL_W;
        const y = FRAME_Y + cell.row * CELL_H;
        const isPressed = pressed === cell.key;
        return (
          <g key={cell.key}>
            <rect
              x={x}
              y={y}
              width={CELL_W}
              height={CELL_H}
              fill={isPressed ? "var(--color-primary)" : "transparent"}
              fillOpacity={isPressed ? 0.85 : 1}
              onPointerDown={() => setPressed(cell.key)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onClick={() => onSelect(cell.key)}
              style={{ cursor: "pointer" }}
            />
            <text
              x={x + CELL_W / 2}
              y={y + CELL_H / 2 + 8}
              textAnchor="middle"
              fontSize={22}
              fill="var(--color-text)"
              pointerEvents="none"
              style={{ userSelect: "none" }}
            >
              {cell.icon}
            </text>
          </g>
        );
      })}

      {/* traves */}
      <rect
        x={FRAME_X - 6}
        y={FRAME_Y - 6}
        width={FRAME_W + 12}
        height={FRAME_H + 12}
        fill="none"
        stroke="var(--color-text)"
        strokeWidth={6}
        rx={2}
        pointerEvents="none"
      />

      {/* linhas internas da grade */}
      <line x1={FRAME_X + CELL_W} y1={FRAME_Y} x2={FRAME_X + CELL_W} y2={FRAME_Y + FRAME_H} stroke="var(--color-border)" strokeWidth={1} pointerEvents="none" />
      <line x1={FRAME_X + 2 * CELL_W} y1={FRAME_Y} x2={FRAME_X + 2 * CELL_W} y2={FRAME_Y + FRAME_H} stroke="var(--color-border)" strokeWidth={1} pointerEvents="none" />
      <line x1={FRAME_X} y1={FRAME_Y + CELL_H} x2={FRAME_X + FRAME_W} y2={FRAME_Y + CELL_H} stroke="var(--color-border)" strokeWidth={1} pointerEvents="none" />
      <line x1={FRAME_X} y1={FRAME_Y + 2 * CELL_H} x2={FRAME_X + FRAME_W} y2={FRAME_Y + 2 * CELL_H} stroke="var(--color-border)" strokeWidth={1} pointerEvents="none" />
    </svg>
  );
}
