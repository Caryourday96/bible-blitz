'use client';
import { useEffect, useRef, useState } from 'react';
import { Cast, Monitor, RotateCw } from 'lucide-react';
import { CAST_APP_ID } from '@/cast/protocol';
import { connectCastRoom, isIOSBrowser, loadCastSender, type CastContext } from '@/cast/sender';

export function CastControls({ code, displayUrl }: { code: string; displayUrl: string }) {
  const [context, setContext] = useState<CastContext | null>(null);
  const [status, setStatus] = useState('Preparing TV controls…');
  const [device, setDevice] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(false);
  const [ios, setIOS] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reconnect = useRef<() => void>(() => {});
  useEffect(() => {
    let alive = true;
    let stopRoom = () => {};
    let detach = () => {};
    void loadCastSender()
      .then((cast) => {
        if (!alive) return;
        cast.setOptions({
          receiverApplicationId: CAST_APP_ID,
          autoJoinPolicy: 'tab_and_origin_scoped',
        });
        setContext(cast);
        const send = () => {
          stopRoom();
          const session = cast.getCurrentSession();
          if (!session) {
            setDevice('');
            setRetry(false);
            setStatus('Choose a Google Cast TV on the same Wi-Fi.');
            return;
          }
          setDevice(session.getCastDevice().friendlyName);
          stopRoom = connectCastRoom(session, code, (next) => {
            if (!alive) return;
            setStatus(next.text);
            setRetry(next.state === 'error');
          });
        };
        reconnect.current = send;
        const update = (event: { sessionState?: string }) => {
          if (!alive) return;
          if (
            ['SESSION_STARTED', 'SESSION_RESUMED', 'SESSION_ENDED'].includes(
              event.sessionState || '',
            )
          )
            send();
        };
        cast.addEventListener('sessionstatechanged', update);
        detach = () => cast.removeEventListener('sessionstatechanged', update);
        send();
      })
      .catch((error: Error) => {
        if (!alive) return;
        setIOS(isIOSBrowser());
        setStatus(error.message);
      });
    return () => {
      alive = false;
      stopRoom();
      detach();
      reconnect.current = () => {};
    };
  }, [code, attempt]);
  const chooseTV = async () => {
    if (!context) return;
    setBusy(true);
    try {
      await context.requestSession();
    } catch (error) {
      const cancelled =
        error === 'cancel' ||
        (error && typeof error === 'object' && 'code' in error && error.code === 'cancel');
      setStatus(
        cancelled
          ? 'TV selection cancelled. Your game is still running.'
          : 'Could not connect. Check your TV and Wi-Fi, then try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="cast-panel" aria-label="Cast to TV">
      <div className="cast-actions">
        {!ios && (
          <button
            className="button secondary"
            disabled={!context || busy}
            onClick={() => void chooseTV()}
          >
            <Cast size={18} />
            {busy ? 'Choosing TV…' : device ? 'Change TV' : 'Cast to TV'}
          </button>
        )}
        {device && (
          <>
            <strong className="cast-device">
              <Monitor size={16} />
              {device}
            </strong>
            {retry && (
              <button className="text-button" onClick={() => reconnect.current()}>
                <RotateCw size={15} /> Reconnect game
              </button>
            )}
            <button
              className="text-button"
              onClick={() => context?.getCurrentSession()?.endSession(true)}
            >
              Stop casting
            </button>
          </>
        )}
        {!context && !ios && (
          <button
            className="text-button"
            onClick={() => {
              setStatus('Preparing TV controls…');
              setAttempt((value) => value + 1);
            }}
          >
            Retry TV controls
          </button>
        )}
      </div>
      <p className="small muted cast-status" role="status">
        {status}
      </p>
      <details className="tv-help" open={ios}>
        <summary>{ios ? 'AirPlay / Screen Mirroring' : 'AirPlay and other TV options'}</summary>
        <p>
          Google Cast works from Chrome on a computer or Android with a Chromecast or Google Cast TV
          on the same Wi-Fi.
        </p>
        <p>
          On iPhone or iPad, open Control Center, choose <strong>Screen Mirroring</strong>, then
          select your Apple TV or AirPlay-compatible TV. This mirrors your screen; it does not
          create a separate host display.
        </p>
        <p>
          For a clean game board,{' '}
          <a href={displayUrl} target="_blank" rel="noreferrer">
            open the big-screen view
          </a>{' '}
          on the device you mirror and keep the host controls on another device. You can also cast
          that display tab from Chrome’s menu, or connect it by HDMI.
        </p>
        <p>
          Keep the host tab open. Game sounds play on the host device. Check the TV picture before
          starting your game.
        </p>
      </details>
    </section>
  );
}
