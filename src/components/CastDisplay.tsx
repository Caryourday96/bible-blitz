'use client';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import {
  RECEIVER_ORIGIN,
  validRequestId,
  validRoomCode,
  type DisplayStatusMessage,
} from '@/cast/protocol';
import { GameScreen } from './GameScreen';
import { useRoom } from './useRoom';

export function CastDisplay() {
  const [input, setInput] = useState<{ code: string; requestId: string } | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room'),
      requestId = params.get('requestId');
    queueMicrotask(() =>
      setInput({
        code: validRoomCode(code) ? code : '',
        requestId: validRequestId(requestId) ? requestId : '',
      }),
    );
  }, []);
  return (
    <div className="app-shell is-presentation cast-display">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">
            <Zap size={24} fill="currentColor" />
          </span>
          <span>
            BIBLE<span>BLITZ</span>
          </span>
        </div>
        <span className="eyebrow">THE BIG SCREEN</span>
      </header>
      {input?.code ? (
        <DisplaySession key={input.code} code={input.code} requestId={input.requestId} />
      ) : (
        <main className="join-page">
          <h1>{input ? 'Choose a game from your host.' : 'Connecting your game…'}</h1>
          <p className="muted">Open Host + big screen in Bible Blitz, then choose Cast to TV.</p>
        </main>
      )}
    </div>
  );
}
function DisplaySession({ code, requestId }: { code: string; requestId: string }) {
  const { join, snapshot, connected, error, offset } = useRoom();
  useEffect(() => {
    void join(code, 'TV display', true);
  }, [code, join]);
  const status: DisplayStatusMessage['status'] = error
    ? 'error'
    : snapshot && connected
      ? 'ready'
      : 'reconnecting';
  useEffect(() => {
    if (!requestId || window.parent === window) return;
    // Only the fixed Cast receiver origin receives status; never send session credentials.
    const message: DisplayStatusMessage = { type: 'DISPLAY_STATUS', room: code, requestId, status };
    window.parent.postMessage(message, RECEIVER_ORIGIN);
  }, [code, requestId, status]);
  return (
    <>
      {error && (
        <p className="connection-banner" role="alert">
          {error}
        </p>
      )}
      {!error && snapshot && !snapshot.hostConnected && (
        <p className="connection-banner" role="status">
          Waiting for the host to reconnect.
        </p>
      )}
      {snapshot ? (
        <GameScreen
          view={snapshot.game}
          presentation
          remote
          connected={connected}
          serverOffset={offset}
          onAction={() => {}}
          onReplay={() => {}}
        />
      ) : (
        <main className="join-page">
          <h1>{error ? 'The game is unavailable.' : 'Connecting your game…'}</h1>
          <p className="muted">
            {error ? 'Reconnect from the host, or create a new room.' : `Joining room ${code}`}
          </p>
        </main>
      )}
    </>
  );
}
