# Test plan

- Unit: all question records; letter preservation/nonidentity; accepted spelling and normalization; nonrepeating decks; scoring/penalties/undo; deadlines and pause; rounds; ties; invalid and duplicate transitions.
- Integration: complete Party session/replay; room creation; isolated rooms; host authorization; joins/team changes; first buzz; answer locks; reconnection; answer redaction; expiry and rate limits.
- Browser: create and configure Party game, finish multiple questions, score, see winner, replay; Solo hint/best; host/player/display interactions; mobile and large display layouts; keyboard and automated accessibility checks.
- Release: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit --omit=dev`.
- Each phase records actual commands, results and unresolved limits. No claimed success without execution.

Validated 2026-10-11: 360 unit/integration tests and all 10 desktop/mobile Chromium E2E tests passed. Both regular and static export builds pass. Real socket test proves coexistence with a pre-existing Socket.IO path, WebSocket/polling, CORS allowlist, denied foreign origins, and preserved HTTP handling. Live Azure rerun follows deployment.
