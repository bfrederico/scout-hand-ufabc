-- SCOUT-HAND-UFABC — schema inicial (seção 42 do spec)
-- Segurança (seção 11): RLS habilitado em tudo. Só a service_role (usada
-- pelas Vercel Functions) tem acesso. O anon key do frontend NUNCA escreve
-- direto no Supabase — toda escrita passa pelo backend (api/*).

create extension if not exists "pgcrypto";

create table athletes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number integer not null,
  position text not null check (position in ('goleira','ponta_esquerda','ponta_direita','armadora','central','pivo')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  competition text,
  phase text,
  opponent text not null,
  location text,
  video_url text,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','finished')),
  our_score integer not null default 0,
  opponent_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table game_roster (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  present boolean not null default true,
  is_goalkeeper boolean not null default false,
  unique (game_id, athlete_id)
);

create table events (
  id uuid primary key, -- gerado no cliente (offline-first, seção 46)
  game_id uuid not null references games(id) on delete cascade,
  timestamp_ms bigint not null,
  period text not null check (period in ('1T','intervalo','2T')),
  athlete_id uuid not null references athletes(id),
  event_type text not null,

  origin_zone text,
  direction text,
  shot_type text,
  result text,

  turnover_type text,
  penalty_type text,
  related_athlete_id uuid references athletes(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_game_id_idx on events(game_id);
create index events_athlete_id_idx on events(athlete_id);

-- RLS: nega tudo por padrão para anon/authenticated; service_role sempre ignora RLS
alter table athletes enable row level security;
alter table games enable row level security;
alter table game_roster enable row level security;
alter table events enable row level security;

-- (nenhuma policy criada de propósito = acesso negado para anon/authenticated)
