// ===== QUESTIONS ROUTES =====
const express = require('express');
const questionsRouter = express.Router();
const { Question } = require('../models/index');
const { protect } = require('../middleware/auth');

questionsRouter.get('/session/:sessionId', protect, async (req, res) => {
  try {
    const questions = await Question.find({ session: req.params.sessionId, user: req.user._id }).sort('order');
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = questionsRouter;

// ===== ANSWERS ROUTES =====
const answersRouter = express.Router();
const { Answer } = require('../models/index');
const Session = require('../models/Session');
const { evaluateAnswer } = require('../services/groqService');

answersRouter.post('/', protect, async (req, res) => {
  try {
    const { sessionId, questionId, answerText, inputMode, timeTaken } = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    
    const evaluation = await evaluateAnswer(question.questionText, answerText, question.type);
    
    const answer = await Answer.create({
      session: sessionId,
      question: questionId,
      user: req.user._id,
      answerText,
      inputMode: inputMode || 'text',
      timeTaken: timeTaken || 0,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      grammarScore: evaluation.grammarScore,
      vocabularyScore: evaluation.vocabularyScore,
      coherenceScore: evaluation.coherenceScore,
      traitScores: evaluation.personalityTraits,
      isEvaluated: true,
      evaluatedAt: new Date(),
    });
    
    // Mark question as answered
    await Question.findByIdAndUpdate(questionId, { isAnswered: true });
    
    // Update session answers array
    await Session.findByIdAndUpdate(sessionId, {
      $addToSet: { answers: answer._id },
      $inc: { currentQuestionIndex: 1 },
    });
    
    // Emit real-time score update
    if (req.io) {
      req.io.to(`user:${req.user._id}`).emit('score:updated', {
        answerId: answer._id,
        score: evaluation.score,
        feedback: evaluation.feedback,
      });
    }
    
    res.json({ success: true, answer, evaluation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

answersRouter.get('/session/:sessionId', protect, async (req, res) => {
  try {
    const answers = await Answer.find({ session: req.params.sessionId, user: req.user._id })
      .populate('question', 'questionText type subType order');
    res.json({ success: true, answers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { questionsRouter, answersRouter };
