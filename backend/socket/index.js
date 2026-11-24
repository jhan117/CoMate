const { Server } = require('socket.io');
const messageModel = require('../models/messageModel');

let ioInstance = null;

function isIntegerId(value) {
  return /^\d+$/.test(String(value || '').trim());
}

function initSocket(httpServer, { sessionMiddleware, allowedOrigins }) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.engine.use(sessionMiddleware);

  io.use(async (socket, next) => {
    try {
      const sessionUserId = socket.request.session?.user?.id;
      if (!sessionUserId || !isIntegerId(sessionUserId)) {
        return next(new Error('UNAUTHORIZED'));
      }

      const user = await messageModel.findUserById(sessionUserId);
      if (!user) {
        return next(new Error('UNAUTHORIZED'));
      }

      socket.user = user;
      socket.userId = String(user.id);
      return next();
    } catch (error) {
      return next(error);
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  ioInstance = io;
  return io;
}

function getIO() {
  return ioInstance;
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${String(userId)}`).emit(event, payload);
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
};
