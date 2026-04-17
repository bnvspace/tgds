# Gift's & Daggers

Telegram Mini App action-roguelite with a manual-stop slot combat loop inspired by Slots & Daggers.

## Current State

- Manual stop combat flow with left-to-right reel stops
- Shared symbol inventory, shop/removal flow, match-3 resolution, enemy intents
- Timed stop skill checks, armor/magic/poison/stun combat math
- Meta modifiers with 3-5 reels, shop discount, revive, damage reduction, chip respec
- Atmosphere layer: haptics, audio, reward bursts, screen shake, safe-area handling
- Endless arena mode and leaderboard API backed by Vercel Blob
- Optional frontend runtime monitoring through Sentry
- Lazy-loaded screens and split vendor chunks for a lighter initial app bundle

## Stack

- React 19
- TypeScript 5.9
- Vite 8
- Zustand
- Framer Motion
- Telegram Mini App APIs
- Vercel Functions + Blob for leaderboard storage

## Local Commands

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
npm run preview
```

## Environment

Leaderboard writes require:

```bash
BLOB_READ_WRITE_TOKEN=...
VITE_SENTRY_DSN=...
VITE_APP_VERSION=...
```

Without `BLOB_READ_WRITE_TOKEN`, `/api/leaderboard` returns a server error and the game falls back gracefully on the client.
Without `VITE_SENTRY_DSN`, monitoring stays disabled.

## Project Layout

```text
src/
  components/   UI building blocks
  screens/      Flow screens: start, map, combat, shop, meta, leaderboard
  game/         Pure game logic: symbols, enemies, resolution, map generation
  store/        Zustand game state
  i18n/         RU / EN localization
  utils/        audio, haptics, leaderboard helpers
api/
  leaderboard.ts
docs/
  mechanics.md
  tasklist.md
  workflow.md
```

## Still Open

- Broader automated coverage for store flows, combat orchestration, and regression cases
- Optional server-side monitoring for API routes
- Real-device Telegram QA for one-hand combat UX
- Final asset pass for temporary icons like Axe and Sawblade
- Production deployment checklist for leaderboard env/config
