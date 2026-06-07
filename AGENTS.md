# AGENTS.md

Compact guidance for AI agents working in this repo. Skip this file if you already know React + Vite — only the items below are repo-specific or non-obvious.

## What this repo is

`hermes-marvis` — a single-page React visualization for a multi-Agent system ("赛博宫廷 / Cyber Palace"), themed after Chinese imperial aesthetics. The UI is a near-final design; **real Agent data integration is pending** (the user said "再进行调整" after the Agent backend is live). All Agent state, todos, memories, and skills in `src/data.ts` are mock.

## Commands

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # tsc -b && vite build  ← typecheck runs FIRST; build fails on any TS error
npm run lint     # ESLint flat config (src/**/*.{ts,tsx})
npm run preview  # Serve dist/
```

No test runner is configured. No formatter is wired up. Do not invent `npm test` or `npm format`.

## Stack and conventions

- **React 19** + **TypeScript** + **Vite 8** + **Tailwind v4** + **Framer Motion 12** + **lucide-react**
- **Tailwind v4** uses `@import "tailwindcss"` and an `@theme {}` block in `src/index.css`. There is **no `tailwind.config.js`** — color tokens (e.g. `--color-ink`, `--color-cyan`) are defined in the CSS `@theme` block and consumed as `bg-ink`, `text-cyan`, etc. Adding a token = add a CSS variable, not a JS config entry.
- **TS is strict.** `tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. Practical consequences:
  - Every import must be used, or `tsc -b` fails. Don't leave stray imports.
  - Types must be imported via `import type { ... }` (see e.g. `App.tsx:8`).
  - No `enum` / `namespace` / `parameter properties` — use unions/literals instead.
- **`framer-motion` typing**: ease strings on `variants` need `as const` to satisfy the `Easing` type (see `AgentAvatar.tsx`). Without it, tsc complains. `ease: 'easeInOut' as const`.
- **lucide-react v1.x**: A few names are different from mainstream lucide — e.g. `Horse` does not exist, use `Rocket` or similar. If a build fails with "no exported member", the icon is just not in this version.
- **`lucide-react` `whileHover` on a button**: a plain `<button>` does not accept `whileHover`; you must use `<motion.button>`. Same for any HTML element you want Framer props on.

## File map

- `src/main.tsx` → React root, mounts `<App />` in StrictMode.
- `src/App.tsx` → top-level state owner: `activeNavId`, `leftCollapsed`, `rightCollapsed`, `showSettings`, `entryDone`, `isMobile`/`isTablet`. Renders the three-column shell, two modals (`ScrollDetailModal`, `SettingsModal`), and switches the center pane by `activeNavId`.
- `src/data.ts` → mock data: `Agent[]` with 9 entries (首辅 + 吏/户/礼/兵/刑/工/仓/驿), each with `skills[]`, `memory[]`, `todos[]`, and percentage-based `position`. The dev UI is positioned via these `position.x/y` percentages — that is intentional, do not refactor to grid coordinates.
- `src/components/` → one file per feature module. Naming is stable; do not split into folders without a strong reason. New pages go next to their siblings (e.g. `KnowledgePage.tsx`, `AssetsPage.tsx`).
- `src/index.css` → global styles, Tailwind v4 import, `@theme` tokens, and a few keyframe animations (`twinkle`, `meteor`, `pillarFlow`, `breathe`, `stampDrop`) referenced by class name `animation: ...`.
- `DESIGN_SPEC.md` → long-form visual spec the original implementation was built from. Read it before changing color tokens, status semantics, or the desk layout. It is the source of truth for visual intent.
- `public/icons.svg` → starter asset from the Vite template; not used by the app.

## How the UI is wired (worth knowing before edits)

- **Navigation state** lives in `App.tsx` (`activeNavId`). `LeftNav` receives `activeId` + `onNavChange` and is a controlled component. The account button at the bottom of `LeftNav` is wired to `onOpenSettings` (opens the modal), **not** to nav switching.
- **Page switching** happens inside `App.tsx`'s center column: `activeNavId === 'new' | 'task' | 'skills' | 'knowledge' | 'assets' | 'device'` renders the respective `<XxxPage />`. The `'workspace'` (大殿) id renders the desk layout. Adding a new page = add a component, an `activeNavId` branch, and a nav item in `LeftNav.tsx`'s `navStructure`.
- **Entry ritual** (`StarEntryRitual`) only runs once on mount and gates UI behind `entryDone`. If you add new visible content that depends on initial layout, gate it on `entryDone` to avoid a flash of pre-animation state.
- **Responsive breakpoints** (see `App.tsx:38-46`): `isMobile = w < 768`, `isTablet = 768 ≤ w < 1280`. The desk layout uses `scale(0.6-0.7)` and `drag` only on tablet. The mobile path renders a flat list. Do not collapse these into one branch.
- **Status colors** for Agent: `online=#00f0ff`, `busy=#ffd700`, `slacking=#39ff14`, `offline=#666`. These recur in `DeskStation`, `AgentAvatar`, `BambooScrollSidebar`, and `RightOverview`. Centralizing them in `data.ts` is a good idea but not done yet.

## Things to avoid

- **Do not** add a `tailwind.config.js` — Tailwind v4 is configured entirely in `src/index.css`. Adding a v3-style config will conflict.
- **Do not** introduce a state library (Redux/Zustand/Jotai). All state is local React `useState` and is intentional.
- **Do not** change `tsconfig.app.json` strictness flags without asking — they exist to keep the codebase clean and the user has not asked to relax them.
- **Do not** add `package.json` scripts the user did not ask for (no `format`, `test`, `typecheck` alias, etc.). The current four are intentional.
- **Do not** commit `node_modules` or `dist`. `.gitignore` already excludes them; do not remove those lines.
- **Do not** add path aliases (`@/components/...`) without confirmation — none exist today and adding one touches `vite.config.ts` + `tsconfig.app.json` + every import.

## External notes

- The app is themed to a local Hermes Agent backend (WSL2-based, Obsidian + LLM Wiki). `DevicePage` mocks Windows drive letters (C:/D:/E:) and WSL distro paths. If/when real disk and WSL APIs are wired in, prefer plugging the data in via a hook in `App.tsx` rather than mutating `data.ts`.
- The `SettingsModal` has 8 sections (account / general / ai / agent / storage / security / network / about) modeled on Hermes Agent's actual configuration surface. Keep that mapping intact; do not collapse sections to fit Marvis's 5 — the extra ones are intentional.
- The user reviews the design only after the Hermes Agent backend is running, per their last message. Do not propose to revert to a "simpler" design without checking first.
