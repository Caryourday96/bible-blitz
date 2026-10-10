# Decisions

- Empty repository confirmed on 2026-10-10 via GitHub metadata and `git ls-remote --heads`. Authenticated owner has push/admin permission. Origin is the requested repository. No existing application to preserve.
- Use preferred Next.js/TypeScript stack. CSS is handwritten for a distinctive game interface; a utility framework is not required for this size of application.
- Use Socket.IO on a persistent Node server. It supports cross-device rooms without paid managed infrastructure. Static Sites hosting cannot provide this Node Socket.IO runtime; repository delivery and local preview are the current scope, with deployment prerequisites documented.
- No accounts or database. Random in-memory session tokens with bounded room lifetime provide room ownership. Local game state is inherently inspectable; online answers stay server-side until reveal.
- Use public-domain Bible names and book titles. Do not add unverified factual claims or invented verse citations. Record source checking with the bank.
- Instagram reference could not be retrieved; use the competitive scramble behavior described in the supplied brief.
- Keep the Adeticket portfolio addition pending until a canonical live URL and portfolio repository are available. Preserve all existing portfolio entries and publish only under relevant authorization.
