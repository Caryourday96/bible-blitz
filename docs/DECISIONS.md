# Decisions

- Empty repository confirmed on 2026-10-10 via GitHub metadata and `git ls-remote --heads`. Authenticated owner has push/admin permission. Origin is the requested repository. No existing application to preserve.
- Use preferred Next.js/TypeScript stack. CSS is handwritten for a distinctive game interface; a utility framework is not required for this size of application.
- Use Socket.IO on a persistent Node server. It supports cross-device rooms without paid managed infrastructure. Static Sites hosting cannot provide this Node Socket.IO runtime; repository delivery and local preview are the current scope, with deployment prerequisites documented.
- No accounts or database. Random in-memory session tokens with bounded room lifetime provide room ownership. Local game state is inherently inspectable; online answers stay server-side until reveal.
- Use public-domain Bible names and book titles. Do not add unverified factual claims or invented verse citations. Record source checking with the bank.
- Instagram reference could not be retrieved; use the competitive scramble behavior described in the supplied brief.
- Keep the Adeticket portfolio addition pending until a canonical live URL and portfolio repository are available. Preserve all existing portfolio entries and publish only under relevant authorization.

## Deployment scope update — 2026-10-11

- The owner supplied the reference video; extracted frames confirm two teams solving one name aloud with quick host scoring. Party Mode follows that loop.
- The owner authorized `adeticket.com/bibleblitz`. Azure CLI confirmed the domain belongs to the existing `adeticket-site` Static Web App. The existing `adeticket-ff` App Service supports Socket.IO. Export pages to the former and attach independent rooms to the latter. No Cloudflare changes and no new paid resource.
- The actual portfolio repository is `Caryourday96/personal_site`, with five existing entries. Add Bible Blitz as a sixth entry, with no sign-in requirement. Deployment and portfolio publication now have authorization.
- Pin the released Bible Blitz commit in both integrating repositories for reproducible builds and straightforward rollback.
- Room snapshots redact hidden answers and future questions, but the local-game bank is public frontend data. This is appropriate for social play; it does not prevent a determined player from consulting the bank.
