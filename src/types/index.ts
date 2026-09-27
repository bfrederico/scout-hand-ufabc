// Tipos do domínio SCOUT-HAND-UFABC — espelham o modelo conceitual da seção 42 do spec

export type Position =
  | "goleira"
  | "ponta_esquerda"
  | "ponta_direita"
  | "armadora"
  | "central"
  | "pivo";

export interface Athlete {
  id: string;
  name: string;
  number: number;
  position: Position;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type GameStatus = "scheduled" | "in_progress" | "finished";

export interface Game {
  id: string;
  date: string;
  competition: string;
  phase: string;
  opponent: string;
  location: string;
  video_url?: string;
  status: GameStatus;
  our_score: number;
  opponent_score: number;
  created_at: string;
  updated_at: string;
}

export interface GameRosterEntry {
  id: string;
  game_id: string;
  athlete_id: string;
  present: boolean;
  is_goalkeeper: boolean;
}

export type Period = "1T" | "intervalo" | "2T";

// Categorias de evento (seção 22)
export type EventType =
  | "arremesso"
  | "gol"
  | "passe"
  | "assistencia"
  | "perda"
  | "falta_sofrida"
  | "sete_metros"
  | "contra_ataque"
  | "roubo_bola"
  | "bloqueio"
  | "falta_cometida"
  | "punicao"
  | "defesa_goleira"
  | "gol_sofrido";

// Zona de origem do arremesso (seção 20)
export type OriginZone =
  | "6m"
  | "7m"
  | "9m"
  | "ponta_esquerda"
  | "ponta_direita"
  | "contra_ataque";

// Direção do arremesso, mapeada nas 9 zonas do gol (seção 21)
export type Direction =
  | "cima_esquerda"
  | "cima_centro"
  | "cima_direita"
  | "meio_esquerda"
  | "meio_centro"
  | "meio_direita"
  | "baixo_esquerda"
  | "baixo_centro"
  | "baixo_direita";

export type ShotType = "direto" | "quicado" | "apoio";

export type ShotResult = "gol" | "fora" | "defesa" | "bloqueio" | "trave";

// Categorias de perda de bola (seção 29)
export type TurnoverType =
  | "passe_errado"
  | "passos"
  | "drible"
  | "falta_tecnica"
  | "bola_roubada"
  | "jogo_passivo"
  | "outra";

export type PenaltyType = "advertencia" | "dois_minutos" | "desqualificacao";

export type SyncStatus = "PENDING" | "SYNCED" | "ERROR";

// Evento de scout — a tabela central do sistema (seção 42-32)
export interface ScoutEvent {
  id: string; // uuid gerado no cliente (seção 46) — garante idempotência na sync
  game_id: string;
  timestamp_ms: number; // tempo de partida em ms (seção 32)
  period: Period;
  athlete_id: string;
  event_type: EventType;

  // campos específicos de arremesso / gol sofrido / 7m / contra-ataque
  origin_zone?: OriginZone;
  direction?: Direction;
  shot_type?: ShotType;
  result?: ShotResult;

  // perda de bola
  turnover_type?: TurnoverType;

  // falta / punição
  penalty_type?: PenaltyType;

  // assistência (seção 28): athlete_id = finalizadora, related_athlete_id = assistente
  related_athlete_id?: string;

  created_at: string;
  updated_at: string;

  // controle de sincronização — não existe na tabela do Supabase, só no IndexedDB
  sync_status: SyncStatus;
}
