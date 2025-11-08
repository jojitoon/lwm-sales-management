// Custom server file to run Socket.io alongside Next.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '192.168.0.144'; //'0.0.0.0'; // Listen on all interfaces
const port = parseInt(process.env.PORT || '3000', 10);

// Set environment variable to ensure Next.js doesn't hardcode localhost
// This is critical for CSS and asset loading when accessed via IP
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  // Don't set a base URL - let Next.js use relative paths
  // This ensures assets work when accessed via any IP or hostname
}

// Initialize Next.js app with proper hostname configuration
// This ensures assets are served correctly when accessed via IP
// Note: hostname should be '0.0.0.0' to accept connections from all interfaces
// Next.js will use relative paths for assets by default
const app = next({
  dev,
  hostname,
  port,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // Handle OPTIONS requests for CORS
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.statusCode = 200;
        res.end();
        return;
      }

      // Ensure proper headers for asset requests
      // This helps with CORS and asset loading when accessed via IP
      if (parsedUrl.pathname?.startsWith('/_next/')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      }

      // Ensure proper content-type headers for CSS and JS files
      if (parsedUrl.pathname?.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (parsedUrl.pathname?.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }

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

  // Handle graceful shutdown to close database connections
  let isShuttingDown = false;
  const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n> Received ${signal}, closing server gracefully...`);

    // Close HTTP server first to stop accepting new requests
    httpServer.close(() => {
      console.log('> HTTP server closed');
    });

    // Give some time for existing requests to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Disconnect Prisma client
    try {
      const { prisma } = require('./lib/prisma');
      await prisma.$disconnect();
      console.log('> Database connections closed');
    } catch (error) {
      console.error('> Error closing database connections:', error);
    }

    process.exit(0);
  };

  // Only register handlers once
  if (
    !process
      .listeners('SIGTERM')
      .some((listener) => listener.name === 'gracefulShutdown')
  ) {
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }
  if (
    !process
      .listeners('SIGINT')
      .some((listener) => listener.name === 'gracefulShutdown')
  ) {
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
});
