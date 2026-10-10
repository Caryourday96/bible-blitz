# Architecture

## Runtime

Next.js App Router renders the application shell. Client components handle local play. A custom Node HTTP server serves Next.js and Socket.IO on the same origin, avoiding a database and a second hosting service.

`src/game` contains the serializable state model, question data, scramble engine, transitions, and validation. Timers use deadlines, not accumulated client interval ticks. Online actions pass through server validation; clients never submit scores or authoritative times. The server serializes requests on its event loop and uses question/version guards to reject stale or duplicated actions.

The public online projection never includes unrevealed answers or the future deck. Random session tokens authorize host/player reconnection; room codes only authorize joining. Display sessions cannot control the game. Rooms are isolated, capped, rate limited, and expired automatically.

## Persistence and operational boundary

Party/Solo state is browser-local. Personal bests use localStorage. Online rooms live in one Node process; restarting it expires rooms. Multi-instance deployments require sticky routing and a shared authoritative room store, which is outside this initial release. Deploy a single instance behind HTTPS with WebSocket upgrades enabled. Do not deploy this custom server to static hosting or ordinary serverless functions.

## References

- https://nextjs.org/docs/app/guides/custom-server
- https://socket.io/docs/v4/tutorial/handling-disconnections/
- https://socket.io/docs/v4/server-api/
