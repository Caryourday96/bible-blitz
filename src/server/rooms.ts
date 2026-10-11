import { randomBytes, randomInt } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { createGame, gameView, hostPlan, transition } from '../game/engine';
import { questions } from '../game/questions';
import { actionSchema, nameSchema, setupSchema } from '../game/validation';
import type { Game, GameView, HostPlan } from '../game/types';

type Role = 'host' | 'player' | 'display';
interface Session {
  token: string;
  id: string;
  role: Role;
  name: string;
  teamId?: string;
  sockets: Set<string>;
}
interface Room {
  code: string;
  game: Game;
  sessions: Map<string, Session>;
  created: number;
  touched: number;
  commands: Set<string>;
}
export interface Member {
  id: string;
  name: string;
  teamId?: string;
  connected: boolean;
}
export interface RoomSnapshot {
  hostPlan?: HostPlan;
  code: string;
  game: GameView;
  members: Member[];
  hostConnected: boolean;
  serverTime: number;
  expiresAt: number;
}
export interface Credential {
  code: string;
  token: string;
  role: Role;
  teamId?: string;
  name: string;
}
export type Reply =
  { ok: true; credential?: Credential; snapshot: RoomSnapshot } | { ok: false; error: string };
type Ack = (reply: Reply) => void;
const joinSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^[A-Z2-9]+$/),
  name: nameSchema,
  display: z.boolean().optional(),
});
const resumeSchema = z.object({ code: z.string().length(6), token: z.string().length(48) });
const commandSchema = z.object({
  id: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  gameId: z.string().uuid(),
  action: actionSchema,
});
export const ROOM_LIFETIME = 6 * 60 * 60 * 1000;
export class RoomService {
  readonly rooms = new Map<string, Room>();
  private memberships = new Map<string, { room: Room; session: Session }>();
  private rate = new Map<string, { count: number; reset: number }>();
  private interval: ReturnType<typeof setInterval>;
  constructor(
    private io: Server,
    private now: () => number = Date.now,
  ) {
    io.on('connection', (socket) => this.connect(socket));
    this.interval = setInterval(() => this.tick(), 200);
    this.interval.unref();
  }
  close() {
    clearInterval(this.interval);
    this.rooms.clear();
    this.rate.clear();
    this.memberships.clear();
  }
  private checkRate(key: string, limit: number) {
    const now = this.now();
    let bucket = this.rate.get(key);
    if (!bucket || now >= bucket.reset) {
      bucket = { count: 0, reset: now + 60000 };
      this.rate.set(key, bucket);
    }
    if (++bucket.count > limit) throw new Error('A little too fast. Wait a minute and try again.');
  }
  private snapshot(room: Room, role?: Role): RoomSnapshot {
    return {
      ...(role === 'host' ? { hostPlan: hostPlan(room.game) } : {}),
      code: room.code,
      game: gameView(room.game),
      members: [...room.sessions.values()]
        .filter((s) => s.role === 'player')
        .map((s) => ({ id: s.id, name: s.name, teamId: s.teamId, connected: s.sockets.size > 0 })),
      hostConnected: [...room.sessions.values()].some(
        (s) => s.role === 'host' && s.sockets.size > 0,
      ),
      serverTime: this.now(),
      expiresAt: room.created + ROOM_LIFETIME,
    };
  }
  private broadcast(room: Room) {
    for (const session of room.sessions.values()) {
      if (!session.sockets.size) continue;
      const snapshot = this.snapshot(room, session.role);
      for (const id of session.sockets) this.io.to(id).emit('state', snapshot);
    }
  }
  private room(code: string) {
    const room = this.rooms.get(code);
    if (!room || this.now() - room.created >= ROOM_LIFETIME)
      throw new Error('Room not found or expired. Ask your host for a new code.');
    return room;
  }
  private membership(socket: Socket) {
    const value = this.memberships.get(socket.id);
    if (!value || !this.rooms.has(value.room.code)) throw new Error('Join a room first.');
    return value;
  }
  private bind(socket: Socket, room: Room, session: Session) {
    this.detach(socket);
    session.sockets.add(socket.id);
    this.memberships.set(socket.id, { room, session });
    void socket.join(room.code);
    room.touched = this.now();
    this.broadcast(room);
  }
  private detach(socket: Socket) {
    const current = this.memberships.get(socket.id);
    if (!current) return;
    current.session.sockets.delete(socket.id);
    void socket.leave(current.room.code);
    this.memberships.delete(socket.id);
    if (current.session.role === 'host' && current.session.sockets.size === 0) {
      current.room.game = transition(current.room.game, { type: 'PAUSE' }, this.now());
    }
    this.broadcast(current.room);
  }
  private session(role: Role, name: string, teamId?: string): Session {
    return {
      id: randomBytes(12).toString('hex'),
      token: randomBytes(24).toString('hex'),
      role,
      name,
      teamId,
      sockets: new Set(),
    };
  }
  private credential(room: Room, s: Session): Credential {
    return { code: room.code, token: s.token, role: s.role, name: s.name, teamId: s.teamId };
  }
  private connect(socket: Socket) {
    const ip = socket.handshake.address;
    const on = (event: string, fn: (data: unknown) => Reply) =>
      socket.on(event, (data: unknown, ack?: Ack) => {
        if (typeof ack !== 'function') return;
        try {
          this.checkRate(`socket:${socket.id}`, 150);
          this.checkRate(`ip:${ip}`, 1500);
          ack(fn(data));
        } catch (error) {
          ack({
            ok: false,
            error:
              error instanceof z.ZodError
                ? 'Check the game settings or room details.'
                : error instanceof Error
                  ? error.message
                  : 'The action could not be completed.',
          });
        }
      });
    on('create', (data) => {
      this.checkRate(`create:${ip}`, 10);
      if (this.rooms.size >= 200) throw new Error('All rooms are busy. Please try again later.');
      const { settings, teams } = setupSchema.parse(data);
      if (!['host', 'online'].includes(settings.mode))
        throw new Error('Choose a connected game mode.');
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code: string;
      do {
        code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('');
      } while (this.rooms.has(code));
      const room: Room = {
        code,
        game: createGame(settings, teams, questions),
        sessions: new Map(),
        created: this.now(),
        touched: this.now(),
        commands: new Set(),
      };
      const session = this.session('host', 'Host');
      room.sessions.set(session.token, session);
      this.rooms.set(code, room);
      this.bind(socket, room, session);
      return {
        ok: true,
        credential: this.credential(room, session),
        snapshot: this.snapshot(room, session.role),
      };
    });
    on('join', (data) => {
      this.checkRate(`join:${ip}`, 80);
      const input = joinSchema.parse(data),
        room = this.room(input.code);
      if (room.sessions.size >= 101) throw new Error('This room is full.');
      if (!input.display && room.game.phase !== 'LOBBY')
        throw new Error(
          'This game has started. You can watch the big screen or join the next game.',
        );
      if (!input.display && room.game.settings.mode === 'host')
        throw new Error('This room is for a host and big screen. Join as a display.');
      const session = this.session(
        input.display ? 'display' : 'player',
        input.name,
        input.display ? undefined : room.game.teams[0].id,
      );
      room.sessions.set(session.token, session);
      this.bind(socket, room, session);
      return {
        ok: true,
        credential: this.credential(room, session),
        snapshot: this.snapshot(room, session.role),
      };
    });
    on('resume', (data) => {
      const input = resumeSchema.parse(data),
        room = this.room(input.code),
        session = room.sessions.get(input.token);
      if (!session) throw new Error('Session expired. Rejoin with the room code.');
      this.bind(socket, room, session);
      return {
        ok: true,
        credential: this.credential(room, session),
        snapshot: this.snapshot(room, session.role),
      };
    });
    on('switchTeam', (data) => {
      const { room, session } = this.membership(socket);
      const teamId = z.string().max(40).parse(data);
      if (
        session.role !== 'player' ||
        room.game.phase !== 'LOBBY' ||
        !room.game.teams.some((t) => t.id === teamId)
      )
        throw new Error('Teams can only be changed in the lobby.');
      session.teamId = teamId;
      room.touched = this.now();
      this.broadcast(room);
      return {
        ok: true,
        credential: this.credential(room, session),
        snapshot: this.snapshot(room, session.role),
      };
    });
    on('command', (data) => {
      const { room, session } = this.membership(socket),
        input = commandSchema.parse(data),
        action = input.action;
      if (session.role === 'display') throw new Error('The big screen is view-only.');
      if (
        session.role === 'player' &&
        (!['BUZZ', 'ANSWER'].includes(action.type) ||
          !('teamId' in action) ||
          action.teamId !== session.teamId)
      )
        throw new Error('Only the host can do that.');
      room.game = transition(room.game, { type: 'TICK' }, this.now());
      if (input.gameId !== room.game.id) throw new Error('A new game has started. Try again.');
      if (room.commands.has(input.id))
        return { ok: true, snapshot: this.snapshot(room, session.role) };
      // Buzz ordering follows server receipt order. First accepted command advances revision.
      if (input.revision !== room.game.revision) {
        this.broadcast(room);
        throw new Error('The game just moved on. Try again.');
      }
      const next = transition(room.game, action, this.now());
      if (next === room.game) throw new Error('That action is not available right now.');
      room.game = next;
      room.commands.add(input.id);
      if (room.commands.size > 2000) room.commands.delete(room.commands.values().next().value!);
      room.touched = this.now();
      this.broadcast(room);
      return { ok: true, snapshot: this.snapshot(room, session.role) };
    });
    on('replay', () => {
      const { room, session } = this.membership(socket);
      if (session.role !== 'host' || !['GAME_RESULTS', 'CANCELLED'].includes(room.game.phase))
        throw new Error('Only the host can restart a finished game.');
      room.game = {
        ...createGame(room.game.settings, room.game.teams, questions),
        presentation: room.game.presentation,
      };
      room.commands.clear();
      room.touched = this.now();
      this.broadcast(room);
      return { ok: true, snapshot: this.snapshot(room, session.role) };
    });
    on('sync', () => {
      const { room, session } = this.membership(socket);
      return { ok: true, snapshot: this.snapshot(room, session.role) };
    });
    socket.on('leave', () => this.detach(socket));
    socket.on('disconnect', () => {
      this.detach(socket);
      this.rate.delete(`socket:${socket.id}`);
    });
  }
  tick() {
    const now = this.now();
    for (const [key, bucket] of this.rate) if (bucket.reset <= now) this.rate.delete(key);
    for (const [code, room] of this.rooms) {
      if (now - room.created >= ROOM_LIFETIME || now - room.touched >= 60 * 60 * 1000) {
        this.io.to(code).emit('expired');
        for (const [id, m] of this.memberships)
          if (m.room === room) {
            this.memberships.delete(id);
            void this.io.sockets.sockets.get(id)?.leave(code);
          }
        this.rooms.delete(code);
        continue;
      }
      const next = transition(room.game, { type: 'TICK' }, now);
      if (next !== room.game) {
        room.game = next;
        this.broadcast(room);
      }
    }
  }
}
