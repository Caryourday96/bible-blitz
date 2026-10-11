export const CAST_NAMESPACE = 'urn:x-cast:com.adeticket.bibleblitz';
export const CAST_APP_ID = '0AF8BA4D';
export const RECEIVER_ORIGIN = 'https://ff.adeticket.com';
export const DISPLAY_ORIGIN = 'https://adeticket.com';
export const DISPLAY_PATH = '/bibleblitz/tv';
export const validRoomCode = (value: unknown): value is string =>
  typeof value === 'string' && value.length === 6 && /^[A-Z2-9]{6}$/.test(value);
export const validRequestId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length === 36 &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export interface CastRoomMessage {
  type: 'SHOW_ROOM';
  room: string;
  requestId: string;
}
export interface DisplayStatusMessage {
  type: 'DISPLAY_STATUS';
  room: string;
  requestId: string;
  status: 'ready' | 'reconnecting' | 'error';
}
function parse(input: unknown): Record<string, unknown> | null {
  try {
    if (typeof input === 'string') {
      if (input.length > 2048) return null;
      input = JSON.parse(input);
    }
    return input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
export function castRoomMessage(input: unknown): CastRoomMessage | null {
  const data = parse(input);
  return data?.type === 'SHOW_ROOM' && validRoomCode(data.room) && validRequestId(data.requestId)
    ? { type: 'SHOW_ROOM', room: data.room, requestId: data.requestId }
    : null;
}
export function displayStatusMessage(input: unknown): DisplayStatusMessage | null {
  const data = parse(input);
  return data?.type === 'DISPLAY_STATUS' &&
    validRoomCode(data.room) &&
    validRequestId(data.requestId) &&
    (data.status === 'ready' || data.status === 'reconnecting' || data.status === 'error')
    ? { type: 'DISPLAY_STATUS', room: data.room, requestId: data.requestId, status: data.status }
    : null;
}
export function castDisplayUrl(message: CastRoomMessage): string {
  const valid = castRoomMessage(message);
  if (!valid) throw new Error('Invalid TV room.');
  return `${DISPLAY_ORIGIN}${DISPLAY_PATH}?${new URLSearchParams({ room: valid.room, requestId: valid.requestId })}`;
}
