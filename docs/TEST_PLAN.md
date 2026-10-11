# Test plan

Casting release validated 2026-10-11: 368 unit/socket tests, 18 desktop/mobile browser scenarios (including all 18 against production), normal and static builds, typecheck/lint/audit. Shared receiver: 106 Vitest + 7 Node tests and all 27 browser regressions pass in CI. The production casting check additionally verifies actual cross-origin iframe policies and sockets, readiness acknowledgement, scoring/results/replay, offline recovery and stop controls. Cast SDK transport is simulated; physical TV discovery/launch and AirPlay remain unverified hardware checks.

- Unit: all question records; letter preservation/nonidentity; accepted spelling and normalization; nonrepeating decks; scoring/penalties/undo; deadlines and pause; rounds; ties; invalid and duplicate transitions.
- Integration: complete Party session/replay; room creation; isolated rooms; host authorization; joins/team changes; first buzz; answer locks; reconnection; answer redaction; expiry and rate limits.
- Browser: create and configure Party game, finish multiple questions, score, see winner, replay; Solo hint/best; host/player/display interactions; mobile and large display layouts; keyboard and automated accessibility checks.
- Release: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit --omit=dev`.
- Each phase records actual commands, results and unresolved limits. No claimed success without execution.

Validated 2026-10-11: 360 unit/integration tests and all 10 desktop/mobile Chromium E2E tests passed. Both regular and static export builds pass. Real socket test proves coexistence with a pre-existing Socket.IO path, WebSocket/polling, CORS allowlist, denied foreign origins, and preserved HTTP handling. Live Azure rerun follows deployment.

Public release verification: all 10 existing E2E tests passed with `E2E_BASE_URL=https://adeticket.com/bibleblitz/`. With the same variable, `node scripts/production-check.mjs` verifies responsive layouts through 1920px, reduced motion, keyboard scoring, local presentation synchronization and concurrent-game isolation. That script passed on 2026-10-11. No Firefox/WebKit or physical TV hardware validation is claimed.
