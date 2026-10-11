# Implementation backlog

| Epic / feature      | User story and acceptance criteria                                                    | Priority | Dependencies    | Status      | Implementation / validation                                                                           |
| ------------------- | ------------------------------------------------------------------------------------- | -------- | --------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| Discovery           | Owner can trace repository, stack and decisions; inspect origin, refs and permissions | P0       | GitHub          | Verified    | Empty repo, push permission confirmed; discovery and engine pushes verified                           |
| Question engine     | Host gets 200+ unique questions, valid scrambles and deterministic matching           | P0       | None            | Verified    | Unit validation of all records and filters                                                            |
| Party game          | Host can configure teams/settings and finish/replay a complete session                | P0       | Engine          | Verified    | Unit, integration and browser tests                                                                   |
| Polish              | Players can use touch/keyboard, muted audio and reduced motion                        | P1       | Party           | Verified    | Browser and accessibility checks                                                                      |
| Host/display        | Separate display synchronizes without administrative controls                         | P1       | Rooms           | Verified    | Multiple browser sessions / responsive QA                                                             |
| Online              | Players join, switch team, buzz/type and reconnect with authoritative scoring         | P1       | Engine          | Verified    | Socket integration and multi-context E2E                                                              |
| Solo                | Player can use hints, build streaks and save personal best                            | P1       | Engine          | Verified    | Unit and browser tests                                                                                |
| Hardening           | Invalid, duplicate and unauthorized commands fail safely                              | P0       | All modes       | Verified    | Build, typecheck, lint, dependency audit, unit/integration/E2E                                        |
| Deployment          | Owner can play at https://adeticket.com/bibleblitz                                    | P1       | Verified app    | In Progress | Static export and shared-server adapter tested; integrate existing Azure repositories and verify live |
| Adeticket portfolio | Add accurate canonical URL and no-account requirement, preserve five entries          | P1       | Live deployment | In Progress | personal_site repository found; portfolio card, guide and sitemap prepared under owner authorization  |

Statuses: Not Started, In Progress, Blocked, Completed, Verified. Verified requires actual test evidence.

Release validation on 2026-10-11: 360 unit/integration tests; 10 desktop/mobile Chromium E2E tests; zero axe violations on home/setup; typecheck, lint, normal build and /bibleblitz static export passed. Other browser engines and physical projector hardware remain future checks.

| Follow-up        | Acceptance criteria                                                     | Priority | Status      |
| ---------------- | ----------------------------------------------------------------------- | -------- | ----------- |
| Broader browsers | Validate Safari/WebKit and Firefox, including audio/fullscreen          | P2       | Not Started |
| Event resilience | Persist active rooms across restarts before scaling to multiple servers | P2       | Not Started |
| Editorial review | Human review of difficulty balance and optional verified verse hints    | P2       | Not Started |
