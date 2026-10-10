# Bible Blitz

A Bible word scramble party game for the living room, youth group, and big screen.

Repository: https://github.com/Caryourday96/bible-blitz

## Delivery status

Discovery complete. Implementation and validation are in progress. See [progress](docs/PROGRESS.md), [backlog](docs/IMPLEMENTATION_BACKLOG.md), and [session handoff](docs/SESSION_HANDOFF.md) for actual verification status.

## Architecture

Next.js + React + TypeScript. A shared deterministic game engine powers browser-local Party/Solo games and server-authoritative Socket.IO rooms. Rooms use process memory with bounded lifetime; no account, database, or paid service is required. Deployment needs a long-running Node server supporting WebSockets. No infrastructure has been provisioned.
