import { afterEach, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io, type Socket } from 'socket.io-client';
import { attachBibleBlitz } from '../src/server/attach';
import { defaultSettings } from '../src/game/types';

const http = createServer((_req, res) => res.end('existing app'));
const existing = new Server(http);
existing.on('connection', (socket) => socket.on('ping-existing', (ack) => ack('pong')));
const blitz = attachBibleBlitz(http, { origins: ['https://adeticket.com'] });
const clients: Socket[] = [];
afterEach(async () => {
  clients.forEach((client) => client.disconnect());
  blitz.dispose();
  await new Promise<void>((resolve) => existing.close(() => resolve()));
});
it('isolates two games on one HTTP server, allows portfolio CORS and blocks foreign origins', async () => {
  await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
  const address = http.address();
  if (!address || typeof address === 'string') throw Error('No listening address');
  const url = `http://127.0.0.1:${address.port}`;
  const connect = async (path: string, transport: 'websocket' | 'polling') => {
    const client = io(url, {
      path,
      transports: [transport],
      forceNew: true,
      reconnection: false,
      extraHeaders: { Origin: 'https://adeticket.com' },
    });
    clients.push(client);
    await new Promise<void>((resolve, reject) => {
      client.once('connect', resolve);
      client.once('connect_error', reject);
    });
    return client;
  };
  const original = await connect('/socket.io', 'websocket');
  const host = await connect('/bibleblitz/socket.io', 'websocket');
  const player = await connect('/bibleblitz/socket.io', 'polling');
  const created = await host.timeout(3000).emitWithAck('create', {
    settings: { ...defaultSettings, mode: 'online' },
    teams: [
      { id: 'a', name: 'Grace', color: '#f8d477' },
      { id: 'b', name: 'Faith', color: '#85dad2' },
    ],
  });
  expect(created.ok).toBe(true);
  expect(
    (await player.timeout(3000).emitWithAck('join', { code: created.snapshot.code, name: 'Ada' }))
      .ok,
  ).toBe(true);
  // Engine.IO's unrelated-upgrade cleanup fires after one second; both paths must survive it.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  expect(await original.timeout(2000).emitWithAck('ping-existing')).toBe('pong');
  expect((await host.timeout(2000).emitWithAck('sync', {})).ok).toBe(true);
  const allowed = await fetch(`${url}/bibleblitz/socket.io/?EIO=4&transport=polling`, {
    headers: { Origin: 'https://adeticket.com' },
  });
  expect(allowed.headers.get('access-control-allow-origin')).toBe('https://adeticket.com');
  const denied = await fetch(`${url}/bibleblitz/socket.io/?EIO=4&transport=polling`, {
    headers: { Origin: 'https://unrelated.example' },
  });
  expect(denied.status).toBe(403);
  expect(await (await fetch(url)).text()).toBe('existing app');
});
