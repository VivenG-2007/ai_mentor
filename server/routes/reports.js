const express = require('express');
const router = express.Router();
const { Report, Answer, Question } = require('../models/index');
const Session = require('../models/Session');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateSessionSummary } = require('../services/groqService');
const { generatePDFReport } = require('../services/pdfService');

// Generate report for a session
router.post('/generate/:sessionId', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const answers = await Answer.find({ session: session._id });
    const questions = await Question.find({ session: session._id });
    
    // Calculate scores
    const subjectiveAnswers = answers.filter(a => {
      const q = questions.find(q => q._id.toString() === a.question.toString());
      return q?.type?.toLowerCase() === 'subjective';
    });
    const englishAnswers = answers.filter(a => {
      const q = questions.find(q => q._id.toString() === a.question.toString());
      return q?.type?.toLowerCase() === 'english';
    });
    const psychoAnswers = answers.filter(a => {
      const q = questions.find(q => q._id.toString() === a.question.toString());
      return q?.type?.toLowerCase() === 'psychometric';
    });
    
    const avg = arr => arr.length ? Math.round(arr.reduce((s, a) => s + a.score, 0) / arr.length) : 0;
    
    // Only count answers that belong to current questions (avoids orphaned answers inflating count)
    const validAnswers = [...subjectiveAnswers, ...englishAnswers, ...psychoAnswers];
    const scores = {
      subjective: avg(subjectiveAnswers),
      english: avg(englishAnswers),
      psychometric: avg(psychoAnswers),
      overall: avg(validAnswers),
    };
    
    // Aggregate personality traits
    const personalityTraits = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
    if (psychoAnswers.length > 0) {
      psychoAnswers.forEach(a => {
        if (a.traitScores) {
          // Robust key matching (ignore case)
          const keys = Object.keys(a.traitScores);
          Object.keys(personalityTraits).forEach(targetKey => {
            const actualKey = keys.find(k => k.toLowerCase() === targetKey);
            const val = actualKey ? (a.traitScores[actualKey] || 0) : 0;
            personalityTraits[targetKey] += val / psychoAnswers.length;
          });
        }
      });
      // Round final averages
      Object.keys(personalityTraits).forEach(k => {
        personalityTraits[k] = Math.round(personalityTraits[k]);
      });
    }
    
    // Aggregate strengths/improvements from individual answer evaluations
    const allStrengths = validAnswers.flatMap(a => a.strengths || []);
    const allImprovements = validAnswers.flatMap(a => a.improvements || []);

    // Generate AI summary with rich context
    const summary = await generateSessionSummary({
      scores,
      personalityTraits,
      questionsAnswered: validAnswers.length,
      totalQuestions: questions.length,
      answerStrengths: allStrengths,
      answerImprovements: allImprovements,
      session: { weekNumber: session.weekNumber, year: session.year },
    });
    
    // Fallback: if Groq returned empty arrays, use aggregated answer-level data
    const finalStrengths   = (summary.strengths   && summary.strengths.length)   ? summary.strengths   : [...new Set(allStrengths)].slice(0, 4);
    const finalImprovements= (summary.improvements&& summary.improvements.length) ? summary.improvements: [...new Set(allImprovements)].slice(0, 3);

    // Upsert report so re-runs always reflect latest data
    let report = await Report.findOneAndUpdate(
      { session: session._id },
      {
        session: session._id,
        user: req.user._id,
        weekNumber: session.weekNumber,
        year: session.year,
        scores,
        personalityTraits,
        strengths: finalStrengths,
        improvements: finalImprovements,
        overallFeedback: summary.overallFeedback || '',
        sessionDuration: session.totalDuration || 0,
        questionsAnswered: validAnswers.length,
        totalQuestions: questions.length,
      },
      { upsert: true, new: true }
    );
    
    // Generate PDF
    try {
      const { filepath } = await generatePDFReport({
        user: req.user,
        session,
        report,
        answers,
        questions,
      });
      
      report.pdfPath = filepath;
      report.pdfGeneratedAt = new Date();
      await report.save();
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr.message);
    }
    
    // Link report to session
    await Session.findByIdAndUpdate(session._id, {
      report: report._id,
      scores,
      personalityTraits,
      strengths: summary.strengths || [],
      improvements: summary.improvements || [],
    });
    
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all reports for user
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reports = await Report.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('session', 'weekNumber year status');
    
    const total = await Report.countDocuments({ user: req.user._id });
    res.json({ success: true, reports, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single report
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id })
      .populate('session');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;