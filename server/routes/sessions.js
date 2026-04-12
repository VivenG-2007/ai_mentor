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
    const { page = 1, limit = 10, status, search } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    
    if (search) {
      const searchNum = parseInt(search);
      filter.$or = [
        { status: { $regex: search, $options: 'i' } },
        { careerTrack: { $regex: search, $options: 'i' } }
      ];
      if (!isNaN(searchNum)) {
        filter.$or.push({ weekNumber: searchNum }, { year: searchNum });
      }
    }
    
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
    const questionCount = Math.min(10, Math.max(2, parseInt(req.body.questionCount) || 3));
    const mode = req.body.mode || 'practice';
    const careerTrack = req.body.careerTrack || req.user.careerTrack || 'General';
    const difficulty = parseInt(req.body.difficulty) || 3;
    
    // Check for existing active session
    let session = await Session.findOne({ 
      user: req.user._id, 
      status: 'in-progress' 
    });

    if (session) {
      const questions = await Question.find({ session: session._id }).sort({ order: 1 });
      return res.json({ success: true, session, questions, resumed: true });
    }

    // Create fresh session if none active
    session = await Session.create({ 
      user: req.user._id, 
      weekNumber, 
      year, 
      status: 'in-progress', 
      startTime: now,
      mode,
      difficultyLevel: difficulty
    });
    
    const uiInstructions = `Mode: ${mode}, Career Track: ${careerTrack}`;
    
    const aiEngine = require('../services/aiEngineService');
    const questionsData = await aiEngine.generateAdaptiveQuestions(req.user._id, { 
      mode, 
      difficulty, 
      careerTrack 
    });
    
    const questions = await Question.insertMany(
      questionsData.map((q, i) => ({ 
        ...q, 
        order: i + 1, 
        session: session._id, 
        user: req.user._id 
      }))
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