'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Action, Settings, Team } from '@/game/types';
import type { Credential, Reply, RoomSnapshot } from '@/server/rooms';
export function useRoom() {
  const socket = useRef<Socket | null>(null),
    credentialRef = useRef<Credential | null>(null),
    snapshotRef = useRef<RoomSnapshot | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null),
    [credential, setCredential] = useState<Credential | null>(null),
    [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [offset, setOffset] = useState(0);
  const accept = useCallback((value: RoomSnapshot) => {
    snapshotRef.current = value;
    setSnapshot(value);
    setOffset(value.serverTime - Date.now());
  }, []);
  const save = useCallback((value: Credential) => {
    credentialRef.current = value;
    setCredential(value);
    try {
      sessionStorage.setItem(`bb-room-${value.code}`, JSON.stringify(value));
    } catch {
      /* Reconnect remains available in this page. */
    }
  }, []);
  const getSocket = useCallback(() => {
    if (socket.current) return socket.current;
    const s = io(process.env.NEXT_PUBLIC_REALTIME_ORIGIN || undefined, {
      path: process.env.NEXT_PUBLIC_REALTIME_PATH || '/socket.io',
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 8000,
    });
    socket.current = s;
    s.on('state', accept);
    s.on('connect', () => {
      if (credentialRef.current) {
        s.timeout(8000).emit('resume', credentialRef.current, (err: Error | null, reply: Reply) => {
          if (err || !reply?.ok) {
            setConnected(false);
            setError(reply && !reply.ok ? reply.error : 'Could not reconnect. Try again.');
            return;
          }
          accept(reply.snapshot);
          setConnected(true);
          setError('');
        });
      } else setConnected(true);
    });
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () =>
      setError('Can’t reach the game server. Check your connection and try again.'),
    );
    s.on('expired', () => {
      setConnected(false);
      setError('This room has expired. Create a new game to play again.');
      s.disconnect();
    });
    s.connect();
    return s;
  }, [accept]);
  const send = useCallback(
    async (event: string, data: unknown) => {
      setError('');
      const s = getSocket();
      if (!s.connected) s.connect();
      return new Promise<boolean>((resolve) => {
        s.timeout(10000).emit(event, data, (err: Error | null, reply: Reply) => {
          if (err || !reply) {
            setError('The server didn’t respond. Please try again.');
            resolve(false);
            return;
          }
          if (!reply.ok) {
            setError(reply.error);
            resolve(false);
            return;
          }
          if (reply.credential) save(reply.credential);
          accept(reply.snapshot);
          setConnected(true);
          resolve(true);
        });
      });
    },
    [accept, getSocket, save],
  );
  useEffect(
    () => () => {
      socket.current?.disconnect();
      socket.current = null;
    },
    [],
  );
  useEffect(() => {
    if (!credential) return;
    const timer = setInterval(() => {
      if (socket.current?.connected) void send('sync', {});
    }, 20000);
    return () => clearInterval(timer);
  }, [credential, send]);
  const create = async (settings: Settings, teams: Omit<Team, 'score'>[]) => {
    setBusy(true);
    try {
      return await send('create', { settings, teams });
    } finally {
      setBusy(false);
    }
  };
  const join = useCallback(
    async (code: string, name: string, display = false) => {
      setBusy(true);
      try {
        return await send('join', { code: code.toUpperCase().trim(), name, display });
      } finally {
        setBusy(false);
      }
    },
    [send],
  );
  const resume = useCallback(
    async (code: string) => {
      try {
        const raw = sessionStorage.getItem(`bb-room-${code}`);
        if (!raw) return false;
        const saved: Credential = JSON.parse(raw);
        save(saved);
        return await send('resume', saved);
      } catch {
        return false;
      }
    },
    [save, send],
  );
  const action = useCallback(
    (action: Action) => {
      const current = snapshotRef.current;
      if (!current) return;
      void send('command', {
        id: crypto.randomUUID(),
        revision: current.game.revision,
        gameId: current.game.id,
        action,
      });
    },
    [send],
  );
  const leave = () => {
    socket.current?.emit('leave');
    socket.current?.disconnect();
    socket.current = null;
    credentialRef.current = null;
    snapshotRef.current = null;
    setSnapshot(null);
    setCredential(null);
    setError('');
    setConnected(false);
  };
  return {
    snapshot,
    credential,
    connected,
    busy,
    error,
    setError,
    offset,
    create,
    join,
    resume,
    action,
    replay: () => void send('replay', {}),
    switchTeam: (id: string) => void send('switchTeam', id),
    leave,
  };
}
