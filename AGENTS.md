# AGENTS.md

Compact guidance for AI agents working in this repo. Only items that are repo-specific, non-obvious, or easy to get wrong.

## What this repo is

`hermes-marvis` — single-page React dashboard for a multi-Agent system ("赛博宫廷 / Cyber Palace"), themed after Chinese imperial aesthetics. Connects to a local Hermes Agent backend (WSL2, port 8642) for real Agent status, chat, skills, cron jobs, and system info.

## Commands

```bash
npm run dev      # concurrently: vite + obsidian-server (8643) + cron-server (8644)
npm run build    # tsc -b && vite build  ← typecheck runs FIRST; build fails on any TS error
npm run lint     # ESLint flat config (src/**/*.{ts,tsx})
npm run preview  # Serve dist/
```

No test runner. No formatter. Do not invent `npm test` or `npm format`.

## Stack and conventions

- **React 19** + **TypeScript** + **Vite 8** + **Tailwind v4** + **Framer Motion 12** + **lucide-react**
- **Tailwind v4**: no `tailwind.config.js`. Tokens defined in `src/index.css` `@theme {}` block as CSS variables, consumed as `bg-ink`, `text-cyan`, etc.
- **TS strict**: `tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. Consequences:
  - Every import must be used or `tsc -b` fails.
  - Types imported via `import type { ... }` only.
  - No `enum` / `namespace` / parameter properties.
- **framer-motion**: ease strings on `variants` need `as const` to satisfy `Easing` type. `whileHover` only works on `<motion.button>`, not plain `<button>`.
- **lucide-react v1.x**: some icons don't exist (e.g. `Horse`). If build fails with "no exported member", the icon isn't in this version.

## Architecture

### Frontend (src/)

```
src/
  main.tsx              React root (StrictMode)
  App.tsx               Top-level state: activeNavId, responsive, layout toggles
  data.ts               Mock Agent[] (9 entries) with position%, skills, memory, todos
  index.css             Tailwind v4 import, @theme tokens, keyframe animations
  types/hermes.ts       Hermes API types (Session, Message, Skill, Toolset)
  api/
    hermes.ts           Hermes backend client (port 8642) — health, sessions, chat SSE, skills
    cron.ts             Cron job CRUD client (port 8644)
    system.ts           System info client — drives, WSL distros, WSL mounts
  hooks/
    useAgentStatus.ts   Infers agent status from Hermes sessions (15s poll)
    useAgentMemory.ts   Builds per-agent memory from session messages (30s refresh)
    useHermesStats.ts   Aggregated stats for right sidebar
    useHermes.ts        useHermesHealth, useSessions, useChat (sessionIdRef avoids stale closure)
  components/           One file per feature module. No subfolders.
```

### Backend services (scripts/)

| Service | Port | Role |
|---------|------|------|
| Hermes Agent API | 8642 | Agent sessions, chat (SSE), skills, toolsets |
| Obsidian vault server | 8643 | Serves markdown file tree + content from vault dir |
| Cron + System server | 8644 | `hermes cron` CLI wrapper + Windows drives + WSL info |

### Vite proxy (`vite.config.ts`)

- `/api`, `/health`, `/v1` → `localhost:8642` (Hermes)
- `/obsidian-api` → `localhost:8643` (path rewrite strips prefix)
- `/cron-api` → `localhost:8644` (path rewrite strips prefix)

## How the UI is wired

- **Navigation**: `App.tsx` owns `activeNavId`. `LeftNav` is controlled (`activeId` + `onNavChange`). Account button → `onOpenSettings` (modal), not nav.
- **Page switching**: `activeNavId` maps: `'workspace'`→desk layout, `'new'`→NewChatPage, `'task'`→AutoTaskPage, `'skills'`→SkillsPage, `'knowledge'`→KnowledgePage, `'assets'`→AssetsPage, `'device'`→DevicePage, `'chats'`→ChatListPage. Adding a page = component + nav branch + `LeftNav` nav item.
- **Entry ritual**: `StarEntryRitual` runs once on mount, gates UI behind `entryDone`. Gate new visible content on `entryDone`.
- **Responsive**: `isMobile = w < 768`, `isTablet = 768 ≤ w < 1280`. Desk layout scales 0.6–0.7 on tablet. Mobile is a flat list. Keep separate branches.
- **Agent status colors**: `online=#00f0ff`, `busy=#ffd700`, `slacking=#39ff14`, `offline=#666`.
- **Agent status inference**: `useAgentStatus` matches Hermes sessions to agents by title keywords (e.g. "首辅"→shoufu) and source (e.g. "slack"→yibu). No matching session → `slacking` (not `offline`). Hermes down → `offline`.
- **Agent memory**: `useAgentMemory` builds per-agent memory from real Hermes session messages, falls back to `data.ts` static memory.

## Hermes API quirks

- List responses: `{ object: "list", data: [...] }`
- Create session: `{ object: "hermes.session", session: {...} }`
- SSE chat (`/api/sessions/:id/chat/stream`): events `run.started`, `message.started`, `assistant.delta` (uses `delta` field). No `[DONE]` sentinel.
- Message IDs are numeric, timestamps are Unix floats.
- `sendChat` 5th param: `attachments?: {name, dataUrl}[]` converts `{message: string}` to `{message: ContentPart[]}` multimodal array with `text` + `image_url` parts.
- API uses RSA public key Bearer auth.

## Cron server (cron-server.py)

- Runs inside WSL Ubuntu-22.04 via `wsl -d Ubuntu-22.04 -- bash -c "python3 ..."`
- Cron jobs stored at `~/.hermes/cron/jobs.json`
- System endpoints call `powershell.exe` and `wsl.exe` from within WSL — PS scripts must use `"\n".join([...])` for proper multi-line formatting (Python implicit string concat loses all whitespace)
- `Get-Volume` `Used` property is null on this system; compute as `Size - SizeRemaining`
- `wsl.exe -l -v` output is UTF-16LE encoded

## Things to avoid

- **No** `tailwind.config.js` — will conflict with Tailwind v4.
- **No** state library (Redux/Zustand/Jotai). All state is local `useState`, intentional.
- **No** changes to `tsconfig.app.json` strictness flags without asking.
- **No** adding npm scripts the user didn't ask for.
- **No** path aliases (`@/components/...`) without confirmation — none exist.
- **No** committing `node_modules` or `dist`.
- **No** code comments unless asked.

## External dependencies

- User environment: Windows 11, WSL2 (Ubuntu-22.04 default running, Ubuntu-24.04 stopped, docker-desktop stopped)
- Hermes Agent: `/home/hermes-kabuto/.local/bin/hermes`, API port 8642
- Obsidian vault: `C:\work\Huanyu Hub\Huanyu-Knowledge`
- Only C: drive exists (930 GB, ~55% used) — no D: or E:
- `DESIGN_SPEC.md` is the visual design source of truth. Read it before changing colors, layout, or status semantics.
- `SettingsModal` has 8 sections matching Hermes Agent's actual config surface — do not collapse.
