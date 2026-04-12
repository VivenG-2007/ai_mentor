const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const pdfService = require('./pdfService');
const aiEngineService = require('./aiEngineService');

// Initialize Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Queue Service
 * Manages background processing for intensive tasks.
 */
class QueueService {
  constructor() {
    this.reportQueue = new Queue('ReportProcessing', { connection });
    this.analyticsQueue = new Queue('AnalyticsProcessing', { connection });
    
    this.initializeWorkers();
  }

  /**
   * Add a job to generate a PDF report
   */
  async enqueueReport(sessionId) {
    await this.reportQueue.add('generate-report', { sessionId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  /**
   * Add a job to process session analytics
   */
  async enqueueAnalytics(sessionId, userData) {
    await this.analyticsQueue.add('process-analytics', { sessionId, userData });
  }

  /**
   * Initialize background workers
   */
  initializeWorkers() {
    // Worker for Reports
    new Worker('ReportProcessing', async (job) => {
      console.log(`Processing report job: ${job.id}`);
      await pdfService.generateSessionReport(job.data.sessionId);
    }, { connection });

    // Worker for Analytics
    new Worker('AnalyticsProcessing', async (job) => {
      console.log(`Processing analytics job: ${job.id}`);
      // In a real app, this would perform deep cross-session logic
    }, { connection });
  }
}

module.exports = new QueueService();
