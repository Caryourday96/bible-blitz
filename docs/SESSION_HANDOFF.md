# Session handoff

- Branch: main.
- Latest verified pushed application revision: 1d3bd91bcb8b8b9e6c15b527efcec372d5a23899. Both deployments pin this application revision. This handoff belongs to a subsequent documentation/test checkpoint; read origin/main for the current documentation revision.
- Live URL: https://adeticket.com/bibleblitz. No account required. Added to https://adeticket.com alongside all five existing projects.
- Completed: 336-entry bank; Party, Solo, host/display and online modes; setup, scoring, timers, rounds, ties, replay; reconnect; keyboard/audio; responsive UI; security and test coverage.
- Deployment: existing Azure Static Web App through personal_site at 491e569dd5d120b91b0202dbdda9fff2aa614774; independent realtime service on existing adeticket-ff at 249b257a6158dbd9beba5c686042d8e39eb3f561. Both Azure workflows succeeded. No new paid resource; no Cloudflare changes.
- Validation: 360 unit/integration tests; 10 local and 10 live desktop/mobile Chromium E2E scenarios; zero axe violations on home/setup. Typecheck/lint and both builds passed. Live layout/keyboard/local-display isolation check passed at phone/tablet/laptop/projector widths. Existing backend: 106 Vitest + 7 Node tests, build, audit and CI browser suite passed. Five Grouper tests passed. No known dependency vulnerabilities in either app audit.
- Known limitations: online rooms expire on server restart and require one process; local games reset on reload; personal best persists only in that browser; question bank is public game content. Other browser engines and physical TV/audio hardware remain unverified.
- No required release work remains. Future improvements: Firefox/WebKit and hardware QA, persistent room recovery before scaling, editorial difficulty review. See the backlog.
- Rollback/update instructions and successful workflow links are in DEPLOYMENT.md. Preserve existing portfolio entries and keep the app/backend pins compatible.
