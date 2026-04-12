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
    const { mode = 'practice', difficulty = 3, careerTrack = user.careerTrack || 'SDE', questionCount = 6 } = sessionOptions;

    // 1. Fetch long-term memory & context
    const context = await memoryService.getRelevantContext(userId, "Identify common patterns in past sessions", 10);
    const weakAreas = await memoryService.getWeakAreas(userId);

    // 2. Prepare specialized instructions for the LLM
    const specializedPrompt = `
      You are a specialized Mentor for a ${user.collegeYear}-year B.Tech Student.
      
      STUDENT ACADEMIC YEAR: Year ${user.collegeYear} (B.Tech)
      CAREER TRACK: ${careerTrack}
      CURRENT LEVEL: ${user.level}
      SESSION MODE: ${mode}
      DIFFICULTY TARGET: ${difficulty}/10
      
      YEAR-SPECIFIC FOCUS:
      - Year 1: Fundamentals, logic, growth mindset, adjusting to engineering.
      - Year 2: Data structures, core engineering, collaborative coding.
      - Year 3: Practical projects, specialized tech, internship preparation.
      - Year 4: Advanced architecture, placement readiness, professional ethics.
      
      USER CONTEXT FROM MEMORY:
      ${context || 'New user, no history.'}
      
      INSTRUCTIONS:
      - REFERENCE past sessions if possible.
      - MANDATORY: Include at least ONE question focused specifically on Personality Development (soft skills, leadership, or mental resilience).
      - Ensure technical questions are strictly appropriate for a Year ${user.collegeYear} student.
    `;

    // 3. Delegate to Groq with enriched context
    const questions = await groqService.generateSessionQuestions({
      ...user.toObject(),
      instructions: specializedPrompt,
      sessionMode: mode
    }, questionCount);

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
