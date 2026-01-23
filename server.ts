import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer(handler);
  
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
    },
  });

  // lightweight auth on socket handshake: accept `token` in auth payload or cookie
  const { getToken } = await import('next-auth/jwt');

  io.use(async (socket, nextFn) => {
    try {
      const token = (socket.handshake.auth && (socket.handshake.auth.token || socket.handshake.auth.accessToken)) || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return nextFn(new Error('Unauthorized'));
      // validate token using next-auth's getToken helper
      const fakeReq: any = { headers: { authorization: `Bearer ${token}` } };
      const jwt = await getToken({ req: fakeReq, secret: process.env.NEXTAUTH_SECRET });
      if (!jwt?.sub && !jwt?.id) return nextFn(new Error('Unauthorized'));
      // attach minimal user info for handlers
      (socket as any).user = { id: jwt.id ?? jwt.sub, role: jwt.role, permissions: jwt.permissions ?? [] };
      return nextFn();
    } catch (err) {
      return nextFn(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected (auth):', socket.id, (socket as any).user?.id);

    socket.on('emergency-alert', (data) => {
      // optionally enforce permission server-side
      io.emit('emergency-alert', data);
    });

    socket.on('notification', (data) => {
      io.emit('notification', data);
    });

    socket.on('bed-status-update', (data) => {
      io.emit('bed-status-update', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});