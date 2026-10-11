import { afterEach, expect, it, vi } from 'vitest';
import {
  CAST_NAMESPACE,
  castDisplayUrl,
  castRoomMessage,
  displayStatusMessage,
} from '../src/cast/protocol';
import { connectCastRoom, type CastSession, type TVState } from '../src/cast/sender';
const requestId = 'aeb59dad-2392-42dd-aacb-533648555be4';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});
it('accepts only a room selection and constructs a fixed-origin display URL', () => {
  const message = { type: 'SHOW_ROOM' as const, room: 'ABC234', requestId };
  expect(castRoomMessage(JSON.stringify(message))).toEqual(message);
  expect(
    castRoomMessage({ ...message, url: 'https://unrelated.example', hostToken: 'private' }),
  ).toEqual(message);
  expect(castDisplayUrl(message)).toBe(
    `https://adeticket.com/bibleblitz/tv?room=ABC234&requestId=${requestId}`,
  );
  for (const input of [
    null,
    [],
    'not json',
    'x'.repeat(2049),
    { ...message, type: 'COMMAND' },
    { ...message, room: 'ABC234\n' },
    { ...message, room: '../../' },
    { ...message, requestId: 'invalid' },
  ])
    expect(castRoomMessage(input)).toBeNull();
});
it('validates receiver status without accepting arbitrary status or host credentials', () => {
  const message = { type: 'DISPLAY_STATUS', room: 'ABC234', requestId, status: 'ready' };
  expect(displayStatusMessage({ ...message, token: 'private' })).toEqual(message);
  expect(displayStatusMessage({ ...message, status: '<script>' })).toBeNull();
  expect(displayStatusMessage({ ...message, requestId: requestId + '\n' })).toBeNull();
});
function sessionFixture() {
  let receive: ((namespace: string, data: unknown) => void) | undefined;
  const session: CastSession = {
    sendMessage: vi.fn(async () => {}),
    addMessageListener: vi.fn((_namespace, callback) => {
      receive = callback;
    }),
    removeMessageListener: vi.fn(),
    endSession: vi.fn(),
    getCastDevice: () => ({ friendlyName: 'Test TV' }),
  };
  return { session, receive: (message: unknown) => receive?.(CAST_NAMESPACE, message) };
}
it('requires a matching TV acknowledgement and cleans up without ending the game or receiver', async () => {
  const { session, receive } = sessionFixture();
  const states: TVState[] = [];
  const dispose = connectCastRoom(session, 'ABC234', (value) => states.push(value));
  const sent = vi.mocked(session.sendMessage).mock.calls[0][1] as { requestId: string };
  expect(session.sendMessage).toHaveBeenCalledWith(CAST_NAMESPACE, {
    type: 'SHOW_ROOM',
    room: 'ABC234',
    requestId: sent.requestId,
  });
  await Promise.resolve();
  expect(states.at(-1)?.state).toBe('connecting');
  receive({ type: 'DISPLAY_STATUS', room: 'ABC234', requestId, status: 'ready' });
  expect(states.at(-1)?.state).toBe('connecting');
  receive({ type: 'DISPLAY_STATUS', room: 'ABC234', requestId: sent.requestId, status: 'ready' });
  expect(states.at(-1)?.state).toBe('ready');
  receive({
    type: 'DISPLAY_STATUS',
    room: 'ABC234',
    requestId: sent.requestId,
    status: 'reconnecting',
  });
  expect(states.at(-1)?.state).toBe('reconnecting');
  dispose();
  expect(session.removeMessageListener).toHaveBeenCalledOnce();
  expect(session.endSession).not.toHaveBeenCalled();
});
it('reports a TV readiness timeout rather than treating send success as display success', () => {
  vi.useFakeTimers();
  const { session, receive } = sessionFixture();
  const onState = vi.fn();
  const dispose = connectCastRoom(session, 'ABC234', onState);
  const sent = vi.mocked(session.sendMessage).mock.calls[0][1] as { requestId: string };
  receive({
    type: 'DISPLAY_STATUS',
    room: 'ABC234',
    requestId: sent.requestId,
    status: 'reconnecting',
  });
  vi.advanceTimersByTime(15000);
  expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'error' }));
  dispose();
});
it('reports send failures', async () => {
  const { session } = sessionFixture();
  vi.mocked(session.sendMessage).mockRejectedValue(new Error('Disconnected'));
  const onState = vi.fn();
  const dispose = connectCastRoom(session, 'ABC234', onState);
  await Promise.resolve();
  expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'error' }));
  dispose();
});
function browserFixture() {
  const w: { __onGCastApiAvailable?: (available: boolean) => void; cast?: unknown } = {};
  const scripts: { src: string; onerror?: () => void; remove: ReturnType<typeof vi.fn> }[] = [];
  vi.stubGlobal('navigator', { userAgent: 'Chrome', platform: 'Win32', maxTouchPoints: 0 });
  vi.stubGlobal('window', w);
  vi.stubGlobal('document', {
    createElement: () => ({ remove: vi.fn() }),
    head: { appendChild: (script: (typeof scripts)[number]) => scripts.push(script) },
  });
  return { w, scripts };
}
it('loads one sender SDK and waits for availability', async () => {
  const { w, scripts } = browserFixture();
  const { loadCastSender } = await import('../src/cast/sender');
  const pending = loadCastSender();
  expect(loadCastSender()).toBe(pending);
  expect(scripts).toHaveLength(1);
  expect(scripts[0].src).toContain('loadCastFramework=1');
  const context = {};
  w.cast = { framework: { CastContext: { getInstance: () => context } } };
  w.__onGCastApiAvailable?.(true);
  expect(await pending).toBe(context);
});
it('can retry after the SDK fails to load', async () => {
  const { w, scripts } = browserFixture();
  const { loadCastSender } = await import('../src/cast/sender');
  const first = loadCastSender();
  scripts[0].onerror?.();
  await expect(first).rejects.toThrow('could not load');
  expect(scripts[0].remove).toHaveBeenCalledOnce();
  const retry = loadCastSender();
  expect(scripts).toHaveLength(2);
  w.__onGCastApiAvailable?.(false);
  await expect(retry).rejects.toThrow('unavailable');
});
it('offers screen mirroring on iOS without loading an unsupported Cast SDK', async () => {
  const { scripts } = browserFixture();
  vi.stubGlobal('navigator', { userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 5 });
  const { loadCastSender } = await import('../src/cast/sender');
  await expect(loadCastSender()).rejects.toThrow('Screen Mirroring');
  expect(scripts).toHaveLength(0);
});
