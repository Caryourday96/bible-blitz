# Progress

## Casting implementation — 2026-10-11

Added Google Cast controls to hosted games, a display-only TV route, acknowledgement/retry handling and iPhone/iPad AirPlay guidance. Reuses the existing receiver and Azure resources. Application `7bafc33aa43dc087b58e2d59fe95575183e38d9c` is live. Receiver `83626ca0a5bc69a5c761b297963aca76111a8366` deployed successfully (Azure run 38154638074); frontend `5931f2e2a27f40359da2d05b19dc6f231fe6de36` deployed successfully (run 38154777337).

368 unit/socket tests and all 18 desktop/mobile browser scenarios pass, including the live URL. Lint, typecheck, audit, normal/static builds and application CI pass. Receiver validation and all 27 browser regressions pass in CI; five Grouper tests pass. A real cross-origin production check verifies restricted iframe headers, host → receiver → TV socket join → matching acknowledgement, scoring, results, replay, network recovery and stop. Only the Google Cast hardware transport was simulated. The guide is updated; all six portfolio projects and existing game routes remain available. Physical TV discovery/launch and AirPlay picture/audio remain device acceptance checks.

## 2026-10-10 — discovery

- Read complete owner brief.
- GitHub connector confirms authenticated repository owner and push/admin access.
- Cloned requested empty repository and fetched origin. No branches exist yet.
- Selected Next.js/TypeScript with shared engine and a Node Socket.IO runtime; no database.
- Added requirements, architecture, decisions, backlog, test plan and handoff.
- Implementation has not yet been validated. Discovery checkpoint push pending.

Discovery push verified: `3514c1bb97ff49749a4d39b36dac8c5702ba69ad` on `origin/main`.

## Question engine checkpoint

- Implemented 336 deduplicated questions across ten categories, overlapping tags, four difficulty levels and accepted spelling variants.
- All non-book canonical names or aliases found in normalized KJV source text; no unmatched entries. Source checksum is recorded in QUESTION_SOURCES.md.
- Implemented deterministic state transitions, deadline timers, penalties, steals, undo, rounds, ties, hints and streaks; public views omit unrevealed answers, countdown scrambles and the future deck.
- Type checking and lint pass. Full local suite currently has 359 passing engine/bank/socket tests. The engine is committed first; UI and sockets are the following checkpoint.
- Local browser gameplay checks have passed Party, Solo, multiplayer and host/display flows on desktop Chromium and emulated mobile Chromium. Accessibility checks pass for home and setup after layout/contrast fixes. Final combined release rerun remains pending.

## Complete game checkpoint — 2026-10-11

All four modes implemented. 360 unit/integration tests passed, including real-socket isolation/CORS on a shared HTTP server. All 10 Playwright scenarios passed across desktop and mobile Chromium. Home/setup axe checks passed. Typecheck, lint, production build and static export at /bibleblitz passed. Reference video reviewed. Azure integration is prepared; live rollout remains in progress.

## Live Azure release — 2026-10-11

https://adeticket.com/bibleblitz is live, without sign-in. The app source release 1d3bd91bcb8b8b9e6c15b527efcec372d5a23899 is pinned by both integrations. Portfolio release 491e569dd5d120b91b0202dbdda9fff2aa614774 deployed successfully (run 38117476370). Backend 249b257a6158dbd9beba5c686042d8e39eb3f561 deployed successfully (run 38117677307). The first backend smoke check detected a missing platform CORS origin; an additive, persisted Azure allowlist fix resolved it. Existing origins and Friends Showdown permissions were preserved.

All ten browser tests were rerun against the public app: six Party/Solo/accessibility tests and four host/display/online tests passed. The additional production check passed 320/768/1280/1920px layouts, reduced motion, keyboard reveal/scoring, local display synchronization and independent concurrent local games. No JavaScript page errors or failed first-party assets were observed by that check. Live portfolio, guide, sitemap and Grouper return HTTP 200; six project cards remain. Both socket paths reject foreign origins; Friends Showdown health/config/Cast/ads routes pass.
