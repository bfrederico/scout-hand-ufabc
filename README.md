# SCOUT-HAND-UFABC

Sistema web (PWA) de scout e análise de partidas de handebol.

Este repositório é o **scaffold inicial** do projeto, gerado a partir do
documento de especificação. Cobre a fundação técnica e o fluxo principal de
scout; funcionalidades marcadas como `TODO` nos comentários do código
(geração de PDF completa, mapas/gráficos, quadra interativa com toque livre)
são a próxima etapa.

## Stack

- **Frontend:** React + TypeScript + Vite + `vite-plugin-pwa` (manifest, ícone, service worker e cache offline)
- **Backend:** Vercel Functions (`/api`)
- **Banco:** Supabase / PostgreSQL, com Row Level Security travando escrita direta do navegador
- **Offline-first:** IndexedDB (via `idb`) para eventos de scout, com fila de sincronização (`PENDING` → `SYNCED` / `ERROR`)

## Decisões de arquitetura (o que difere do diagrama literal do spec)

- **Escrita sempre via backend:** o diagrama da seção 43 mostra o Sync Engine
  falando direto com o Supabase. Aqui o Sync Engine fala com as Vercel
  Functions (`/api/events`, `/api/games`, `/api/athletes`), que usam a
  service role key para gravar no Supabase. Isso permite manter o RLS
  totalmente travado para o navegador (seção 11: nenhuma credencial
  administrativa no cliente), sem depender do Supabase Auth (que não faz
  sentido aqui, já que o login é único e customizado — seção 10).
- **Autenticação:** cookie `HttpOnly` assinado (HMAC com `SESSION_SECRET`),
  comparando com `ADMIN_EMAIL` / `ADMIN_PASSWORD` das variáveis de ambiente.
  Sem Supabase Auth, sem JWT de terceiros.
- **Frontend com React:** o spec pede "HTML/CSS/JS ou TS com Vite"; usei
  React por cima disso para viabilizar a tela de scout (que tem bastante
  estado) em tempo razoável. Se preferir vanilla TS, é possível reescrever
  mantendo a mesma arquitetura de dados.

## Setup local

```bash
npm install
cp .env.example .env
# preencha .env com as chaves do seu projeto Supabase e as credenciais admin
npm run dev
```

Para testar as Vercel Functions localmente:

```bash
npm i -g vercel
vercel dev
```

## Banco de dados

Rode a migration em `supabase/migrations/0001_init.sql` no seu projeto
Supabase (SQL editor ou `supabase db push` se estiver usando a CLI).

## Estrutura do repositório

```text
scout-hand-ufabc/
│
├── public/
│   └── icons/
│       └── icon.svg              # placeholder — gerar icon-192.png e icon-512.png reais
│
├── src/
│   ├── components/                # (vazio por enquanto — componentes compartilhados futuros)
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Home.tsx               # seção 13
│   │   ├── Athletes.tsx           # seção 14
│   │   ├── Games.tsx
│   │   ├── NewGame.tsx            # seção 15
│   │   ├── Scout.tsx              # seções 16-36 (núcleo do sistema)
│   │   ├── Statistics.tsx         # seção 37 (versão inicial)
│   │   └── Report.tsx             # seções 38-41 (placeholder do PDF)
│   ├── layouts/
│   │   └── MainLayout.tsx         # barra de navegação inferior (seção 12)
│   ├── services/
│   │   ├── supabaseClient.ts
│   │   └── authContext.tsx
│   ├── database/
│   │   └── db.ts                  # wrapper do IndexedDB (seção 44)
│   ├── sync/
│   │   └── syncEngine.ts          # fila de sincronização (seção 45-46)
│   ├── statistics/                 # (vazio — cálculos agregados futuros)
│   ├── reports/                    # (vazio — geração de PDF futura)
│   ├── pwa/                         # (vazio — o vite-plugin-pwa cobre o essencial por ora)
│   ├── styles/
│   │   └── globals.css            # tokens de cor e identidade visual (seções 4-5)
│   ├── types/
│   │   └── index.ts               # modelo de domínio (seção 42)
│   ├── utils/                       # (vazio)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── api/                            # Vercel Functions
│   ├── _lib/
│   │   ├── auth.ts                # cookie de sessão assinado
│   │   └── supabaseAdmin.ts       # cliente com service role key
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── me.ts
│   ├── athletes/
│   │   ├── index.ts               # GET (listar) / POST (criar)
│   │   └── [id].ts                # PATCH (editar/desativar)
│   ├── games/
│   │   ├── index.ts               # GET (listar) / POST (criar + roster)
│   │   └── [id].ts                # GET / PATCH (placar, finalizar)
│   ├── events/
│   │   ├── index.ts               # GET (por partida) / POST (upsert idempotente)
│   │   └── [id].ts                # DELETE (usado pelo desfazer)
│   └── reports/
│       └── generate.ts            # TODO: geração real do PDF
│
├── supabase/
│   └── migrations/
│       └── 0001_init.sql          # schema + RLS (seção 42, 11)
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                 # config do PWA (manifest + service worker)
├── vercel.json
└── README.md
```

## O que já funciona neste scaffold

- Login único com cookie de sessão
- Cadastro e listagem de atletas
- Criação de partida com seleção de atletas presentes/goleiras
- Tela de scout: seleção de atleta → ação → detalhes (zona/tipo/direção/resultado) → registro do evento
- Placar automático a partir dos eventos de gol
- Botão de desfazer (último evento)
- Eventos gravados primeiro no IndexedDB e sincronizados em segundo plano, com retry
- PWA instalável (manifest + service worker gerados pelo `vite-plugin-pwa`)

## Próximos passos sugeridos

1. Gerar os ícones reais (`icon-192.png`, `icon-512.png`) a partir do SVG placeholder
2. Quadra interativa com toque livre (hoje a origem/direção são botões, não uma quadra desenhada — seções 19-21)
3. Estatísticas de intervalo e tela de estatísticas detalhada (seção 37)
4. Geração real do PDF com gráficos e mapas (seções 39-41)
5. Tela de finalização de partida com confirmação (seção 38) — hoje falta o botão explícito de finalizar
6. Testes automatizados
