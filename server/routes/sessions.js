// ===== SESSIONS ROUTES =====
const express = require('express');
const sessionsRouter = express.Router();
const Session = require('../models/Session');
const { Question, Answer, Report } = require('../models/index');
const { protect } = require('../middleware/auth');
const { generateSessionQuestions } = require('../services/groqService');
const { getWeekNumber } = require('../services/scheduler');

// Get all sessions for user
sessionsRouter.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    
    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('report', 'scores pdfPath')
      .lean();
    
    const total = await Session.countDocuments(filter);
    res.json({ success: true, sessions, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single session
sessionsRouter.get('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id })
      .populate('questions')
      .populate('answers')
      .populate('report');
    
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or get current week's session
sessionsRouter.post('/start', protect, async (req, res) => {
  try {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();
    const questionCount = Math.min(15, Math.max(3, parseInt(req.body.questionCount) || 9));
    
    // Always create a fresh session so questions are new every time
    let session = await Session.findOne({ user: req.user._id, weekNumber, year, status: 'in-progress' });
    
    if (!session) {
      session = await Session.create({ user: req.user._id, weekNumber, year, status: 'in-progress', startTime: now });
    }
    
    // Always generate fresh questions — wipe old questions AND answers so counts are clean
    await Question.deleteMany({ session: session._id });
    await Answer.deleteMany({ session: session._id });
    session.answers = [];
    
    const questionsData = await generateSessionQuestions({
      name: req.user.name,
      profession: req.user.profession,
      goals: req.user.goals,
    }, questionCount);
    
    const questions = await Question.insertMany(
      questionsData.map((q, i) => ({ ...q, order: i + 1, session: session._id, user: req.user._id }))
    );
    
    session.questions = questions.map(q => q._id);
    session.totalQuestions = questions.length;
    session.currentQuestionIndex = 0;
    await session.save();
    
    res.json({ success: true, session, questions });
  } catch (error) {
    console.error('Error in /sessions/start:', error); // Expanded logging
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pause session
sessionsRouter.put('/:id/pause', protect, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'paused', pausedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete session
sessionsRouter.put('/:id/complete', protect, async (req, res) => {
  try {
    const { scores, personalityTraits, strengths, improvements, feedback } = req.body;
    
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        status: 'completed',
        endTime: new Date(),
        scores: scores || {},
        personalityTraits: personalityTraits || {},
        strengths: strengths || [],
        improvements: improvements || [],
        feedback: feedback || '',
      },
      { new: true }
    );
    
    // Update user stats
    const allSessions = await Session.find({ user: req.user._id, status: 'completed' });
    const avgScore = allSessions.reduce((sum, s) => sum + (s.scores?.overall || 0), 0) / allSessions.length;
    
    await require('../models/User').findByIdAndUpdate(req.user._id, {
      totalSessions: allSessions.length,
      averageScore: Math.round(avgScore),
    });
    
    if (req.io) req.io.to(`user:${req.user._id}`).emit('session:completed', { sessionId: session._id });
    
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = sessionsRouter;