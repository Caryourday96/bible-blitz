# Session handoff

- Branch: main.
- Latest verified remote before this application checkpoint: c17b6953ebd6bfe629b4beb2854d177db4672242. The application checkpoint commit is the commit containing this handoff; verify origin/main for its full SHA.
- Completed: 336-entry bank, engine, Party, Solo, host/display, online room management, keyboard/audio, responsive UI, security validation and automated tests.
- Validation: 360 unit/integration tests and 10 desktop/mobile Chromium E2E tests passed; typecheck/lint, normal build and base-path static export passed.
- In progress: deploy to existing Azure Static Web App through personal_site, and mount independent realtime service in adeticket-ff. Both repositories must pin the pushed application commit.
- Portfolio card, guide and sitemap are prepared in personal_site; preserve its other five projects.
- Known limitations: online rooms expire on server restart; single-process service; local games reset on reload; only personal best persists. Chromium tested, other browser engines not yet tested. No paid infrastructure created; no Cloudflare changes.
- Next: push this application checkpoint; integrate, test and deploy backend and portfolio; verify public browser flows and exact remote SHAs; update live release evidence.
