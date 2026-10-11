# Bible Blitz

A Bible word scramble party game for the living room, youth group, and big screen.

Repository: https://github.com/Caryourday96/bible-blitz

## Play

Canonical deployment: https://adeticket.com/bibleblitz (Azure rollout in progress).

- **Party:** one device, 2–8 teams, spoken answers and host scoring.
- **Host + big screen:** a phone controls a synchronized TV or projector view.
- **Online:** private room codes, invite links and QR joining, teams, buzzers, typed or spoken answers, reconnect.
- **Solo:** hints, streak bonuses and a personal best saved in this browser.

No account is required. The bank has 336 entries across ten categories and four difficulty levels. Games support configurable timers and rounds, pause/resume, penalties, steals, undo, tiebreakers and replay. Audio is optional; presentation screens contain no host controls.

## Run locally

Use Node 24 (minimum Node 22). Run `npm ci`, then `npm run dev` and open http://localhost:3000. For a production build run `npm run build` then `npm start`. See `.env.example` for configuration. Public variables are compiled into the frontend; never put secrets in them.

Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx playwright install chromium`, and `npm run test:e2e`. The browser suite covers desktop and mobile Chromium. CI also validates the static export.

## Architecture

Next.js + React + TypeScript. A shared deterministic game engine powers browser-local Party/Solo games and server-authoritative Socket.IO rooms. Production uses the owner's existing Azure Static Web Apps site for `/bibleblitz` and the existing Friends Showdown Azure App Service for the independent `/bibleblitz/socket.io` endpoint. No new infrastructure is needed.

Online rooms are kept in one process, expire after six hours (or one hour idle), and are lost on a server restart. A disconnected host pauses play. Reconnect tokens live in tab session storage. Party/Solo games reset on page refresh; only the Solo personal best persists. The question bank is public client content, so this is a social game rather than an anti-cheat tournament platform.

See [deployment](docs/DEPLOYMENT.md), [architecture](docs/ARCHITECTURE.md), [progress](docs/PROGRESS.md), [backlog](docs/IMPLEMENTATION_BACKLOG.md), and [handoff](docs/SESSION_HANDOFF.md).
