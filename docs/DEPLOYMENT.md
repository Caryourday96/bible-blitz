# Azure deployment

The owner authorized https://adeticket.com/bibleblitz. Use existing Azure resources; no Cloudflare deployment or new paid resource.

## Frontend

`Caryourday96/personal_site` deploys `sites/adeticket` to the existing `adeticket-site` Azure Static Web App in `personal-site_group`. Its pipeline imports a pinned commit of this repository, installs from the lockfile, builds and copies `out` into `sites/adeticket/bibleblitz`.

Build-time environment:

```text
STATIC_EXPORT=true
NEXT_PUBLIC_BASE_PATH=/bibleblitz
NEXT_PUBLIC_REALTIME_ORIGIN=https://ff.adeticket.com
NEXT_PUBLIC_REALTIME_PATH=/bibleblitz/socket.io
```

The static host rewrites `/bibleblitz` to `/bibleblitz/index.html`. The portfolio lists the canonical URL and no-account requirement. Existing portfolio entries remain intact.

## Realtime

`Caryourday96/adeticket-ff` runs on the existing single-process `adeticket-ff` Azure App Service in `Kayode_IGO`. It imports `attachBibleBlitz` from `bible-blitz/server`, pinned by full Git commit. This creates independent room state and Socket.IO transport at `/bibleblitz/socket.io`. Its origin allowlist includes only the production portfolio origin (plus local origins in development). Existing Friends Showdown endpoints and credentials remain separate.

The adapter's `dispose()` clears rooms/connections; the embedding app owns HTTP shutdown. Do not scale out without adding shared room coordination and sticky routing. Deployments restart the process and expire active Bible Blitz rooms. No Bible Blitz secrets, accounts or database migrations are needed.

## Release and rollback

1. Validate and push this repository; verify `git ls-remote origin refs/heads/main`.
2. Update the pinned revision in the backend dependency and portfolio build manifest.
3. Run the existing backend checks and the static build, then push their main branches to trigger existing Azure workflows.
4. Confirm workflows succeed and test the public app, cross-origin multiplayer, existing Friends Showdown health, and portfolio links.
5. Roll back by reverting the integrating commits in those repositories and letting their existing workflows redeploy. Preserve existing site content and data.

Browser verification against a deployment: set `E2E_BASE_URL=https://adeticket.com/bibleblitz/` and run `npm run test:e2e`. This creates temporary test rooms and does not touch Friends Showdown games.

Documentation: [Azure prebuilt static deployment](https://learn.microsoft.com/azure/static-web-apps/build-configuration#skip-building-front-end-app), [Socket.IO server options](https://socket.io/docs/v4/server-options/).

## Verified live release — 2026-10-11

- Application revision pinned by both integrations: `1d3bd91bcb8b8b9e6c15b527efcec372d5a23899`.
- Portfolio revision: `491e569dd5d120b91b0202dbdda9fff2aa614774`; [successful Azure deployment](https://github.com/Caryourday96/personal_site/actions/runs/38117476370).
- Backend revision: `249b257a6158dbd9beba5c686042d8e39eb3f561`; [successful Azure deployment](https://github.com/Caryourday96/adeticket-ff/actions/runs/38117677307).
- The existing Azure platform CORS layer must also allow `https://adeticket.com`. The backend workflow now adds it idempotently while preserving the legacy origin.
- All 10 public browser scenarios and the supplementary production check passed. All existing portfolio entries remain live.

Later documentation/test commits do not change the deployed application bundle until these pins are intentionally updated.
