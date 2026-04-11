require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');
const helmet = require('helmet');
const logger = require('./services/logger');

// Validation: Critical check for production environment
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('your-super-secret')) {
    logger.warn('JWT_SECRET is using a default or insecure value in production!');
  }
}

const authRoutes = require('./routes/auth');
const { dashboardRouter, analyticsRouter } = require('./routes/dashboard');
const sessionRoutes = require('./routes/sessions');
const { questionsRouter, answersRouter } = require('./routes/questions');
const reportRoutes = require('./routes/reports');
const assistantRoutes = require('./routes/assistant');

const { scheduleWeeklySessions } = require('./services/scheduler');
const { setupSocketHandlers } = require('./services/socketHandlers');

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://ai-mentor-client.vercel.app'
].filter(Boolean);

const app = express();
const httpServer = http.createServer(app);

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.error(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

const io = new Server(httpServer, { cors: corsOptions });

// Intelligent Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }); // Increased for production

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);
app.use('/reports', express.static(path.join(__dirname, 'reports')));
app.use((req, res, next) => { req.io = io; next(); });

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionsRouter);
app.use('/api/answers', answersRouter);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRouter);
app.use('/api/assistant', assistantRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK' }));

setupSocketHandlers(io);

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    logger.info('MongoDB connected successfully to Atlas');
    cron.schedule('0 9 * * 1', scheduleWeeklySessions);
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      logger.info(`AI Mentor Server running on port ${PORT}`, { environment: process.env.NODE_ENV || 'development' });
    });
  })
  .catch(err => {
    logger.error('MongoDB Connection Error!', err);
    process.exit(1);
  });

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.url} - Error: ${err.message}`, err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  httpServer.close(() => process.exit(1));
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Graceful Shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('Process terminated!');
    });
  });
});
