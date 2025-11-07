// Custom server file to run Socket.io alongside Next.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0'; // Listen on all interfaces
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Make io available globally for the event emitter
  global.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Handle subscription to specific rooms/channels
    socket.on('subscribe', (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} subscribed to ${room}`);
    });

    socket.on('unsubscribe', (room) => {
      socket.leave(room);
      console.log(`Client ${socket.id} unsubscribed from ${room}`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(
        `> Ready on http://${
          hostname === '0.0.0.0' ? 'localhost' : hostname
        }:${port}`
      );
      console.log(
        `> WebSocket server running on ws://${
          hostname === '0.0.0.0' ? 'localhost' : hostname
        }:${port}`
      );
      if (hostname === '0.0.0.0') {
        console.log(`> Server is accessible from all network interfaces`);
      }
    });
});
