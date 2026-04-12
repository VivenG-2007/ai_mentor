const groqService = require('./groqService');
const memoryService = require('./memoryService');
const User = require('../models/User');

/**
 * AI Engine Service: The "Brain" of the platform.
 * Synchronizes Career Tracks, Adaptive Questioning, and Personalization.
 */
class AIEngineService {
  /**
   * Generates a personalized questioning plan for a session
   */
  async generateAdaptiveQuestions(userId, sessionOptions = {}) {
    const user = await User.findById(userId);
    const { mode = 'practice', difficulty = 3, careerTrack = user.careerTrack || 'SDE' } = sessionOptions;

    // 1. Fetch long-term memory & context
    const context = await memoryService.getRelevantContext(userId, "Identify common patterns in past sessions", 10);
    const weakAreas = await memoryService.getWeakAreas(userId);

    // 2. Prepare specialized instructions for the LLM
    const specializedPrompt = `
      You are the ${user.mentorPreference?.tone || 'professional'} Mentor for a ${careerTrack} professional.
      
      CAREER TRACK: ${careerTrack}
      CURRENT LEVEL: ${user.level}
      SESSION MODE: ${mode} (Pressure: ${mode === 'pressure' ? 'High - ask aggressive follow-ups' : 'Standard'})
      DIFFICULTY TARGET: ${difficulty}/10
      
      USER CONTEXT FROM MEMORY:
      ${context || 'New user, no history.'}
      
      WEAK AREAS TO ADDRESS:
      ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None identified yet.'}
      
      INSTRUCTIONS:
      - Reference past sessions/answers if possible to make the user feel heard.
      - If in 'pressure' mode, simulate an intense interview atmosphere.
      - Align difficulty precisely with level ${user.level}.
    `;

    // 3. Delegate to Groq with enriched context
    const questions = await groqService.generateSessionQuestions({
      ...user.toObject(),
      instructions: specializedPrompt,
      sessionMode: mode
    }, 6); // Flagship sessions are more focused (6 high-quality questions)

    return questions;
  }

  /**
   * Real-time adjustment of difficulty based on performance
   */
  calculateNextDifficulty(currentDifficulty, lastScore) {
    if (lastScore > 85) return Math.min(10, currentDifficulty + 1);
    if (lastScore < 50) return Math.max(1, currentDifficulty - 1);
    return currentDifficulty;
  }

  /**
   * Advanced Metrics Calculation
   */
  async computeAdvancedMetrics(answer, question) {
    // Logic to detect filler words, response latency (if passed), and semantic consistency
    const fillerWords = ['basically', 'actually', 'maybe', 'I guess', 'sort of', 'um', 'uh'];
    let confidenceDeduction = 0;
    
    fillerWords.forEach(word => {
      const count = (answer.match(new RegExp(`\\b${word}\\b`, 'gi')) || []).length;
      confidenceDeduction += count * 5;
    });

    const clarityScore = Math.max(0, 100 - (answer.length < 20 ? 40 : 0)); // Very short answers lack clarity
    const confidenceScore = Math.max(0, 100 - confidenceDeduction);

    return {
      confidence: confidenceScore,
      clarity: clarityScore,
      consistency: 85, // Placeholder for semantic consistency check vs memory
    };
  }
}

module.exports = new AIEngineService();
