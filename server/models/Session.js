const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  weekNumber: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'paused', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true,
  },
  startTime: { type: Date },
  endTime: { type: Date },
  pausedAt: { type: Date },
  totalDuration: { type: Number, default: 0 }, // in seconds
  
  scores: {
    overall: { type: Number, default: 0 },
    subjective: { type: Number, default: 0 },
    english: { type: Number, default: 0 },
    psychometric: { type: Number, default: 0 },
  },
  
  personalityTraits: {
    openness: { type: Number, default: 0 },
    conscientiousness: { type: Number, default: 0 },
    extraversion: { type: Number, default: 0 },
    agreeableness: { type: Number, default: 0 },
    neuroticism: { type: Number, default: 0 },
  },
  
  strengths: [String],
  improvements: [String],
  feedback: { type: String, default: '' },
  
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  
  answers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
  }],
  
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  },
  
  currentQuestionIndex: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  
  isScheduled: { type: Boolean, default: false },
  scheduledFor: { type: Date },
}, {
  timestamps: true,
});

sessionSchema.index({ user: 1, weekNumber: 1, year: 1 });
sessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);
