import { CAST_NAMESPACE, displayStatusMessage, validRoomCode } from './protocol';

export interface CastSession {
  sendMessage(namespace: string, message: unknown): Promise<void>;
  addMessageListener(namespace: string, listener: (namespace: string, data: unknown) => void): void;
  removeMessageListener(
    namespace: string,
    listener: (namespace: string, data: unknown) => void,
  ): void;
  endSession(stop: boolean): void;
  getCastDevice(): { friendlyName: string };
}
export interface CastContext {
  setOptions(options: { receiverApplicationId: string; autoJoinPolicy: string }): void;
  getCurrentSession(): CastSession | null;
  requestSession(): Promise<void>;
  addEventListener(type: string, listener: (event: { sessionState?: string }) => void): void;
  removeEventListener(type: string, listener: (event: { sessionState?: string }) => void): void;
}
type CastWindow = Window & {
  __onGCastApiAvailable?: (available: boolean) => void;
  cast?: { framework: { CastContext?: { getInstance(): CastContext } } };
};
export function isIOSBrowser() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}
let pending: Promise<CastContext> | undefined;
export function loadCastSender(): Promise<CastContext> {
  if (isIOSBrowser())
    return Promise.reject(
      new Error(
        'Use AirPlay Screen Mirroring on iPhone or iPad. Google Cast needs Chrome on a computer or Android.',
      ),
    );
  const w = window as CastWindow;
  if (w.cast?.framework.CastContext)
    return Promise.resolve(w.cast.framework.CastContext.getInstance());
  if (pending) return pending;
  pending = new Promise<CastContext>((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const finish = (error?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      w.__onGCastApiAvailable = undefined;
      if (error || !w.cast?.framework.CastContext) {
        script.remove();
        reject(
          new Error(
            error ||
              'Google Cast is unavailable. Use Chrome on a computer or Android, or the TV options below.',
          ),
        );
      } else resolve(w.cast.framework.CastContext.getInstance());
    };
    const timer = setTimeout(
      () => finish('Google Cast did not load. Check your connection and try again.'),
      15000,
    );
    w.__onGCastApiAvailable = (available) =>
      finish(
        available
          ? undefined
          : 'Google Cast is unavailable in this browser. Try Chrome on a computer or Android.',
      );
    script.async = true;
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    script.onerror = () =>
      finish('Google Cast could not load. Check your connection and try again.');
    document.head.appendChild(script);
  });
  void pending.catch(() => {
    pending = undefined;
  });
  return pending;
}
export type TVState = { state: 'connecting' | 'ready' | 'reconnecting' | 'error'; text: string };
/** Only the room code crosses Cast; readiness requires the TV's matching acknowledgement. */
export function connectCastRoom(
  session: CastSession,
  room: string,
  onState: (state: TVState) => void,
) {
  if (!validRoomCode(room)) throw new Error('Invalid room code.');
  const requestId = crypto.randomUUID();
  let disposed = false;
  onState({ state: 'connecting', text: 'Connecting the game to your TV…' });
  const timer = setTimeout(() => {
    if (!disposed)
      onState({
        state: 'error',
        text: 'The TV has not confirmed the game. Reconnect the game, or stop casting and try again.',
      });
  }, 15000);
  const receive = (_namespace: string, data: unknown) => {
    const status = displayStatusMessage(data);
    if (disposed || status?.room !== room || status.requestId !== requestId) return;
    if (status.status !== 'reconnecting') clearTimeout(timer);
    if (status.status === 'ready')
      onState({
        state: 'ready',
        text: 'Game connected to TV. Check the picture on your TV before starting.',
      });
    else if (status.status === 'reconnecting')
      onState({ state: 'reconnecting', text: 'The TV is reconnecting to the game…' });
    else
      onState({
        state: 'error',
        text: 'The TV could not open this room. Reconnect the game or create a new room.',
      });
  };
  session.addMessageListener(CAST_NAMESPACE, receive);
  void session.sendMessage(CAST_NAMESPACE, { type: 'SHOW_ROOM', room, requestId }).catch(() => {
    clearTimeout(timer);
    if (!disposed)
      onState({
        state: 'error',
        text: 'Could not send the game to your TV. Stop casting and reconnect.',
      });
  });
  return () => {
    disposed = true;
    clearTimeout(timer);
    session.removeMessageListener(CAST_NAMESPACE, receive);
  };
}
