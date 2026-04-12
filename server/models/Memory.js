const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  },
  content: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  type: {
    type: String,
    enum: ['answer', 'feedback', 'trait', 'fact'],
    default: 'answer',
  },
  metadata: {
    topic: String,
    difficulty: Number,
    score: Number,
    timestamp: { type: Date, default: Date.now },
  }
}, {
  timestamps: true,
});

// Index for vector search (This requires an Atlas Search index to be created manually or via API)
// We'll use this for RAG
memorySchema.index({ embedding: 'vector' }); 

module.exports = mongoose.model('Memory', memorySchema);
