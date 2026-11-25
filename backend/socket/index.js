const { Server } = require('socket.io');
const userModel = require('../models/userModel');
const { isIntegerId } = require('../utils/validation');

let ioInstance = null;

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

      const userRow = await userModel.findById(sessionUserId);
      if (!userRow) {
        return next(new Error('UNAUTHORIZED'));
      }

      const user = userModel.publicUser(userRow);
      socket.user = user;
      socket.userId = user.id;
      return next();
    } catch (error) {
      return next(error);
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    const sessionId = socket.request.sessionID;
    if (sessionId) {
      socket.join(`session:${sessionId}`);
    }
  });

  ioInstance = io;
  return io;
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${String(userId)}`).emit(event, payload);
}

function disconnectSession(sessionId) {
  if (!ioInstance || !sessionId) return;
  ioInstance.in(`session:${String(sessionId)}`).disconnectSockets(true);
}

module.exports = {
  initSocket,
  emitToUser,
  disconnectSession,
};
