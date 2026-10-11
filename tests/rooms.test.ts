import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { createServer, type Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { io as client, type Socket } from 'socket.io-client';
import {
  RoomService,
  ROOM_LIFETIME,
  type Reply,
  type Credential,
  type RoomSnapshot,
} from '../src/server/rooms';
import { defaultSettings, type Action } from '../src/game/types';
let http: HttpServer, io: Server, service: RoomService, url: string, time: number;
const clients: Socket[] = [];
const teams = [
  { id: 'a', name: 'Grace', color: '#f8d477' },
  { id: 'b', name: 'Faith', color: '#85dad2' },
];
async function connect() {
  const socket = client(url, { transports: ['websocket'], forceNew: true });
  clients.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}
async function send(socket: Socket, event: string, data: unknown): Promise<Reply> {
  return new Promise((resolve, reject) =>
    socket
      .timeout(2000)
      .emit(event, data, (err: Error | null, reply: Reply) => (err ? reject(err) : resolve(reply))),
  );
}
function success(reply: Reply) {
  expect(reply.ok).toBe(true);
  if (!reply.ok) throw Error(reply.error);
  return reply;
}
async function create(socket: Socket, overrides = {}) {
  return success(
    await send(socket, 'create', {
      settings: {
        ...defaultSettings,
        mode: 'online',
        answerMode: 'buzz-typed',
        rounds: 1,
        questionsPerRound: 2,
        seconds: 20,
        ...overrides,
      },
      teams,
    }),
  );
}
async function command(
  socket: Socket,
  snapshot: RoomSnapshot,
  action: Action,
  id = crypto.randomUUID(),
) {
  return send(socket, 'command', {
    id,
    revision: snapshot.game.revision,
    gameId: snapshot.game.id,
    action,
  });
}
beforeEach(async () => {
  time = 100000;
  http = createServer();
  io = new Server(http);
  service = new RoomService(io, () => time);
  await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
  const address = http.address();
  if (!address || typeof address === 'string') throw Error('No address');
  url = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  for (const socket of clients) socket.disconnect();
  clients.length = 0;
  service.close();
  await new Promise<void>((resolve) => io.close(() => resolve()));
  http.close();
});
describe('authoritative rooms over real sockets', () => {
  it('creates rooms, joins players and spectators, switches teams and hides the deck', async () => {
    const host = await connect(),
      player = await connect(),
      display = await connect();
    const created = await create(host);
    const code = created.snapshot.code;
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    expect(created.credential?.token.length).toBe(48);
    const joined = success(await send(player, 'join', { code, name: 'Ada' }));
    expect(joined.credential?.role).toBe('player');
    expect(joined.snapshot.game).not.toHaveProperty('deck');
    expect(joined.snapshot.game.question).toBeNull();
    const switched = success(await send(player, 'switchTeam', 'b'));
    expect(switched.credential?.teamId).toBe('b');
    const watched = success(await send(display, 'join', { code, name: 'Screen', display: true }));
    expect(watched.credential?.role).toBe('display');
    expect((await command(display, watched.snapshot, { type: 'START' })).ok).toBe(false);
  });
  it('rejects player host actions, forged teams, stale commands and invalid input', async () => {
    const host = await connect(),
      player = await connect();
    const created = await create(host);
    const joined = success(
      await send(player, 'join', { code: created.snapshot.code, name: 'Ada' }),
    );
    expect((await command(player, joined.snapshot, { type: 'START' })).ok).toBe(false);
    expect((await command(player, joined.snapshot, { type: 'AWARD', teamId: 'a' })).ok).toBe(false);
    expect(
      (await command(player, joined.snapshot, { type: 'ANSWER', teamId: 'b', answer: 'Jesus' })).ok,
    ).toBe(false);
    expect((await send(player, 'switchTeam', 'not-a-team')).ok).toBe(false);
    const started = success(await command(host, created.snapshot, { type: 'START' }));
    expect((await command(host, created.snapshot, { type: 'END_GAME' })).ok).toBe(false);
    expect(
      (
        await send(player, 'command', {
          id: crypto.randomUUID(),
          revision: started.snapshot.game.revision,
          gameId: started.snapshot.game.id,
          action: { type: 'AWARD', teamId: 'a', score: 99999 },
        })
      ).ok,
    ).toBe(false);
    const bad = await send(await connect(), 'join', {
      code: created.snapshot.code,
      name: '<script>alert(1)</script>',
    });
    expect(bad.ok).toBe(false);
  });
  it('orders simultaneous buzzes, scores once, rejects post-deadline answers and permits replay', async () => {
    const host = await connect(),
      p1 = await connect(),
      p2 = await connect(),
      created = await create(host, { tiebreaker: false });
    const code = created.snapshot.code;
    await send(p1, 'join', { code, name: 'One' });
    await send(p2, 'join', { code, name: 'Two' });
    await send(p2, 'switchTeam', 'b');
    await command(host, created.snapshot, { type: 'START' });
    time += 3000;
    service.tick();
    const state = success(await send(host, 'sync', {})).snapshot;
    const buzzes = await Promise.all([
      command(p1, state, { type: 'BUZZ', teamId: 'a' }),
      command(p2, state, { type: 'BUZZ', teamId: 'b' }),
    ]);
    expect(buzzes.filter((r) => r.ok).length).toBe(1);
    const current = success(await send(host, 'sync', {})).snapshot;
    const first = current.game.buzzTeam!;
    const answering = first === 'a' ? p1 : p2;
    const authoritative = service.rooms.get(code)!.game;
    const answer = authoritative.deck[0].answer;
    const id = crypto.randomUUID();
    const scored = success(
      await command(answering, current, { type: 'ANSWER', teamId: first, answer }, id),
    );
    expect(scored.snapshot.game.teams.find((t) => t.id === first)?.score).toBe(100);
    const repeated = success(
      await command(answering, current, { type: 'ANSWER', teamId: first, answer }, id),
    );
    expect(repeated.snapshot.game.teams.find((t) => t.id === first)?.score).toBe(100);
    await command(host, scored.snapshot, { type: 'NEXT' });
    time += 3000;
    service.tick();
    let s = success(await send(host, 'sync', {})).snapshot;
    await command(answering, s, { type: 'BUZZ', teamId: first });
    s = success(await send(host, 'sync', {})).snapshot;
    time += 20000;
    const late = await command(answering, s, {
      type: 'ANSWER',
      teamId: first,
      answer: service.rooms.get(code)!.game.deck[1].answer,
    });
    expect(late.ok).toBe(false);
    s = success(await send(host, 'sync', {})).snapshot;
    expect(s.game.teams.find((t) => t.id === first)?.score).toBe(100);
    s = success(await command(host, s, { type: 'NEXT' })).snapshot;
    expect(s.game.phase).toBe('GAME_RESULTS');
    const replayed = success(await send(host, 'replay', {}));
    expect(replayed.snapshot.game.phase).toBe('LOBBY');
    expect(replayed.snapshot.game.teams.every((t) => t.score === 0)).toBe(true);
    expect((await command(host, s, { type: 'START' })).ok).toBe(false);
  });
  it('restores host and player credentials on fresh connections without duplicate members', async () => {
    const host = await connect(),
      player = await connect(),
      created = await create(host);
    const joined = success(
      await send(player, 'join', { code: created.snapshot.code, name: 'Reconnect' }),
    );
    await send(player, 'switchTeam', 'b');
    const cred = success(await send(player, 'resume', joined.credential)).credential as Credential;
    await command(host, created.snapshot, { type: 'START' });
    host.disconnect();
    player.disconnect();
    await new Promise((r) => setTimeout(r, 30));
    const host2 = await connect(),
      player2 = await connect();
    const resumed = success(await send(host2, 'resume', created.credential));
    expect(resumed.snapshot.game.phase).toBe('PAUSED');
    expect(resumed.credential?.role).toBe('host');
    const p = success(await send(player2, 'resume', cred));
    expect(p.credential?.teamId).toBe('b');
    expect(p.snapshot.members.length).toBe(1);
    expect(p.snapshot.members[0].connected).toBe(true);
    const fake = await send(await connect(), 'resume', {
      code: created.snapshot.code,
      token: 'x'.repeat(48),
    });
    expect(fake.ok).toBe(false);
  });
  it('isolates two rooms, expires idle games and enforces request limits', async () => {
    const a = await connect(),
      b = await connect();
    const first = await create(a),
      second = await create(b);
    await command(a, first.snapshot, { type: 'START' });
    expect(success(await send(b, 'sync', {})).snapshot.game.phase).toBe('LOBBY');
    expect(first.snapshot.code).not.toBe(second.snapshot.code);
    for (let n = 0; n < 155; n++) await send(b, 'sync', {});
    expect((await send(b, 'sync', {})).ok).toBe(false);
    time += ROOM_LIFETIME + 1;
    service.tick();
    expect(service.rooms.size).toBe(0);
    expect(
      (await send(await connect(), 'join', { code: first.snapshot.code, name: 'Late' })).ok,
    ).toBe(false);
  });
});
