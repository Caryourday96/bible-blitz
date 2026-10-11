import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { RoomService } from './rooms';

/** Mount independent Bible Blitz rooms alongside an existing HTTP/Socket.IO app. */
export function attachBibleBlitz(http: HttpServer, options: { path?: string; origins: string[] }) {
  const origins = new Set(options.origins);
  const io = new Server(http, {
    path: options.path ?? '/bibleblitz/socket.io',
    serveClient: false,
    maxHttpBufferSize: 16384,
    destroyUpgrade: false,
    cors: { origin: [...origins], methods: ['GET', 'POST'] },
    allowRequest: (req, callback) =>
      callback(null, !req.headers.origin || origins.has(req.headers.origin)),
  });
  const rooms = new RoomService(io);
  return {
    io,
    rooms,
    // The embedding app owns the shared HTTP server and closes it separately.
    dispose() {
      rooms.close();
      io.disconnectSockets(true);
      io.engine.close();
    },
  };
}
