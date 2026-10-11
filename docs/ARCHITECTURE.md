# Architecture

## Runtime

Next.js App Router renders the application shell. Client components handle local play. Locally, a custom Node HTTP server serves Next.js and Socket.IO on one origin. Production exports the frontend to the existing Adeticket Azure static site and mounts the realtime adapter on the existing Friends Showdown App Service, with a separate path and origin allowlist. See [deployment](DEPLOYMENT.md).

`src/game` contains the serializable state model, question data, scramble engine, transitions, and validation. Timers use deadlines, not accumulated client interval ticks. Online actions pass through server validation; clients never submit scores or authoritative times. The server serializes requests on its event loop and uses question/version guards to reject stale or duplicated actions.

The public online projection never includes unrevealed answers or the future deck. Random session tokens authorize host/player reconnection; room codes only authorize joining. Display sessions cannot control the game. Rooms are isolated, capped, rate limited, and expired automatically.

## Persistence and operational boundary

Party/Solo state is browser-local and resets on reload. Personal bests use localStorage. Online rooms live in one Node process; restarting it expires rooms. Multi-instance deployments require sticky routing and a shared authoritative room store, outside this initial release. The Socket.IO server needs one long-lived HTTPS runtime with WebSocket upgrades; only the exported frontend is served statically. The source question bank ships with local play, so determined players can inspect it; never claim tournament-grade answer secrecy.

## References

- https://nextjs.org/docs/app/guides/custom-server
- https://socket.io/docs/v4/tutorial/handling-disconnections/
- https://socket.io/docs/v4/server-api/
