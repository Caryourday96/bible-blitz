# Session handoff

- Branch: main. Casting release deployed on 2026-10-11.
- Live URL: https://adeticket.com/bibleblitz. No account required. The Adeticket portfolio preserves all six entries.
- Pinned application revision: `7bafc33aa43dc087b58e2d59fe95575183e38d9c`. Subsequent documentation/verification commits do not change the deployed bundle. Read origin/main for the latest handoff revision.
- Frontend: personal_site `5931f2e2a27f40359da2d05b19dc6f231fe6de36`, Azure deployment 38154777337 succeeded.
- Backend/receiver: adeticket-ff `83626ca0a5bc69a5c761b297963aca76111a8366`, Azure deployment 38154638074 succeeded. Existing Azure resources, same Cast app ID/receiver URL, no new paid infrastructure or Cloudflare changes.
- Completed: 336-entry bank; Party, Solo, hosted and online games; Google Cast controls for hosted rooms; display-only TV route; readiness acknowledgement, reconnect/change/stop; iPhone/iPad AirPlay guidance. Sounds remain on the host device. Local Party/Solo use screen/tab mirroring or HDMI.
- Validation: 368 unit/socket tests; all 18 desktop/mobile Chromium browser scenarios locally/CI and on the public URL; lint, typecheck, audit and both production builds passed. Shared receiver: 106 Vitest + 7 Node tests and all 27 browser tests passed. Five Grouper tests passed. Existing public portfolio/game routes remain available.
- Additional live check: set `E2E_BASE_URL=https://adeticket.com/bibleblitz/` and run `node scripts/cast-production-check.mjs`. It runs deployed pages, real iframe restrictions and real sockets; verifies matching TV acknowledgement, scoring/results/replay, network recovery and stop. Google Cast transport is simulated. No page errors or failed first-party HTTP responses were observed.
- Pending device acceptance: physical Chromecast/Google TV discovery and launch, receiver availability on the actual TV, Wi-Fi recovery and AirPlay picture/audio. These are not established by SDK fixtures. Follow CASTING.md; no further software deployment step is pending.
- Existing limits: one-process memory-only rooms expire on restart; local games reset on reload; personal best is browser-local; bank content is public. Broader browser engines, persistence before scaling and editorial review remain in the backlog.
- Update/rollback: keep both integration pins compatible; deploy receiver changes before frontend changes. Only the TV document permits embedding by ff.adeticket.com. Preserve other route restrictions and portfolio entries. See DEPLOYMENT.md.
