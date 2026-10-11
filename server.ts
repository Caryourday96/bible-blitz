import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { RoomService } from './src/server/rooms';
const dev = !process.argv.includes('--production');
const port = Number(process.env.PORT || 3000),
  hostname = process.env.HOST || '0.0.0.0';
const app = next({ dev, hostname, port });
async function main() {
  await app.prepare();
  const handle = app.getRequestHandler();
  const server = createServer((req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    void handle(req, res);
  });
  const io = new Server(server, {
    maxHttpBufferSize: 16384,
    serveClient: false,
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      // Same-origin browser requests only. Non-browser clients still need session authorization.
      let allowed = !origin;
      try {
        if (origin) {
          allowed = process.env.PUBLIC_ORIGIN
            ? origin === process.env.PUBLIC_ORIGIN
            : new URL(origin).host === req.headers.host;
        }
      } catch {
        allowed = false;
      }
      callback(null, allowed);
    },
  });
  const rooms = new RoomService(io);
  server.listen(port, hostname, () => console.log(`Bible Blitz ready: http://localhost:${port}`));
  const shutdown = () => {
    rooms.close();
    io.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
