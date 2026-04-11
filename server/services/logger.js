/**
 * Production-ready logger
 * In production, it outputs JSON for better log management (Datadog, CloudWatch, Render logs).
 * In development, it outputs clean, readable strings.
 */

const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  info: (message, meta = {}) => {
    if (isProduction) {
      console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
    } else {
      console.log(`[INFO] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
  error: (message, error = {}, meta = {}) => {
    if (isProduction) {
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    } else {
      console.error(`[ERROR] ${message}`, error);
    }
  },
  warn: (message, meta = {}) => {
    if (isProduction) {
      console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
    } else {
      console.warn(`[WARN] ${message}`, meta);
    }
  }
};

module.exports = logger;
