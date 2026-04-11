const jwt = require('jsonwebtoken');
const User = require('../models/User');

function setupSocketHandlers(io) {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.userId})`);
    socket.join(`user:${socket.userId}`);
    
    // Session events
    socket.on('session:start', (data) => {
      socket.to(`user:${socket.userId}`).emit('session:started', data);
    });
    
    socket.on('session:pause', (data) => {
      io.to(`user:${socket.userId}`).emit('session:paused', data);
    });
    
    socket.on('session:resume', (data) => {
      io.to(`user:${socket.userId}`).emit('session:resumed', data);
    });
    
    // Question progression
    socket.on('question:next', (data) => {
      io.to(`user:${socket.userId}`).emit('question:changed', data);
    });
    
    // Answer submitted
    socket.on('answer:submitted', (data) => {
      io.to(`user:${socket.userId}`).emit('answer:received', data);
    });
    
    // Score update
    socket.on('score:update', (data) => {
      io.to(`user:${socket.userId}`).emit('score:updated', {
        ...data,
        timestamp: new Date(),
      });
    });
    
    // Avatar state change
    socket.on('avatar:state', (data) => {
      socket.emit('avatar:stateChanged', data);
    });
    
    // Voice events
    socket.on('voice:start', () => {
      socket.emit('avatar:listening');
    });
    
    socket.on('voice:stop', () => {
      socket.emit('avatar:idle');
    });
    
    socket.on('tts:start', () => {
      socket.emit('avatar:speaking');
    });
    
    socket.on('tts:stop', () => {
      socket.emit('avatar:idle');
    });
    
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user?.name}`);
    });
  });
}

module.exports = { setupSocketHandlers };
