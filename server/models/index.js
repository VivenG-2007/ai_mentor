const mongoose = require('mongoose');

// ===== QUESTION MODEL =====
const questionSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['subjective', 'english', 'psychometric'],
    required: true,
    index: true,
  },
  subType: {
    type: String,
    enum: ['general', 'grammar', 'vocabulary', 'essay', 'comprehension', 'ocean', 'behavioral'],
    default: 'general',
  },
  questionText: {
    type: String,
    required: true,
  },
  options: [String], // For multiple choice
  expectedDuration: { type: Number, default: 120 }, // seconds
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  order: { type: Number, default: 0 },
  isAnswered: { type: Boolean, default: false },
  trait: { type: String }, // For psychometric: openness, conscientiousness, etc.
}, {
  timestamps: true,
});

questionSchema.index({ session: 1, order: 1 });

// ===== ANSWER MODEL =====
const answerSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answerText: {
    type: String,
    required: true,
  },
  inputMode: {
    type: String,
    enum: ['voice', 'text'],
    default: 'text',
  },
  timeTaken: { type: Number, default: 0 }, // seconds
  score: { type: Number, default: 0, min: 0, max: 100 },
  feedback: { type: String, default: '' },
  strengths: [String],
  improvements: [String],
  grammarScore: { type: Number },
  vocabularyScore: { type: Number },
  coherenceScore: { type: Number },
  confidenceScore: { type: Number },
  clarityScore: { type: Number },
  consistencyScore: { type: Number },
  traitScores: {
    openness: Number,
    conscientiousness: Number,
    extraversion: Number,
    agreeableness: Number,
    neuroticism: Number,
  },
  studentGrowthTip: { type: String, default: '' },
  isEvaluated: { type: Boolean, default: false },
  evaluatedAt: { type: Date },
}, {
  timestamps: true,
});

answerSchema.index({ session: 1, question: 1 });

// ===== REPORT MODEL =====
const reportSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  weekNumber: { type: Number, required: true },
  year: { type: Number, required: true },
  
  scores: {
    overall: { type: Number, default: 0 },
    subjective: { type: Number, default: 0 },
    english: { type: Number, default: 0 },
    psychometric: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    consistency: { type: Number, default: 0 },
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
  overallFeedback: { type: String, default: '' },
  
  pdfPath: { type: String },
  pdfGeneratedAt: { type: Date },
  
  sessionDuration: { type: Number, default: 0 },
  questionsAnswered: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
}, {
  timestamps: true,
});

reportSchema.index({ user: 1, createdAt: -1 });

const Question = mongoose.model('Question', questionSchema);
const Answer = mongoose.model('Answer', answerSchema);
const Report = mongoose.model('Report', reportSchema);

module.exports = { Question, Answer, Report };
