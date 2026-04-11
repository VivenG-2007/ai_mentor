const Groq = require('groq-sdk');

let groq;
try {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (e) {
  console.warn('⚠️  Groq SDK init failed, using mock responses');
}

const MODEL = 'llama-3.1-8b-instant';

// Generate a chat completion
async function chatCompletion(messages, maxTokens = 1024) {
  if (!groq || !process.env.GROQ_API_KEY) {
    return getMockResponse(messages);
  }
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error.message);
    return getMockResponse(messages);
  }
}

// Generate weekly session questions
async function generateSessionQuestions(userProfile = {}, questionCount = 9) {
  const themes = ['Technical Leadership', 'System Design Thinking', 'Scalability & Optimization', 'Agile & DevOps Culture', 'Ethical AI & Data Privacy', 'Technical Debt Management', 'Full-stack Problem Solving', 'Cross-functional Collaboration', 'Code Review Best Practices', 'Innovation in Engineering'];
  const grammarTopics = ['Technical Documentation Clarity', 'Professional Email Etiquette for Engineers', 'Concise Status Reporting', 'Requirement Specification Precision', 'Logical Connector Usage'];
  const vocabThemes = ['Engineering Industry Jargon', 'Architectural Pattern Terminology', 'Process-oriented Verbs', 'Nuanced Analytical Adjectives', 'Software Development Lifecycle (SDLC) Vocabulary'];
  const essayTopics = ['The Impact of Microservices on Scalability', 'Ethics of Automated Decision Making', 'Balancing Technical Debt vs. Feature Development', 'The Role of Open Source in Modern Infrastructure', 'Challenges of Distributed Systems', 'Improving Developer Experience (DevEx)'];
  const oceans = ['openness','conscientiousness','extraversion','agreeableness','neuroticism'];

  const pickedThemes = [...themes].sort(() => Math.random() - 0.5).slice(0, 3).join(', ');
  const pickedGrammar = grammarTopics[Math.floor(Math.random() * grammarTopics.length)];
  const pickedVocab = vocabThemes[Math.floor(Math.random() * vocabThemes.length)];
  const pickedEssay = essayTopics[Math.floor(Math.random() * essayTopics.length)];
  const shuffledOceans = [...oceans].sort(() => Math.random() - 0.5);

  const subjectiveCount = Math.max(1, Math.round(questionCount * 3 / 9));
  const englishCount = Math.min(3, Math.max(1, Math.round(questionCount * 3 / 9)));
  const psychoCount = Math.max(1, questionCount - subjectiveCount - englishCount);

  const prompt = `You are a high-level Engineering Manager and Mentor. Generate exactly ${questionCount} UNIQUE and RIGOROUS engineering-focused mentoring questions. 

SAFETY & ETHICS:
- Strictly AVOID any inappropriate, offensive, vulgar, or sensitive content.
- Maintain a high level of professional ethics.
- Focus exclusively on technical leadership, engineering logic, and career growth.

User Profile: ${JSON.stringify(userProfile)}
Primary Engineering Focus: ${pickedThemes}

Schema Constraints:
- "type": "subjective" (scenario-based engineering leadership), "english" (tech documentation & communication), "psychometric" (OCEAN traits)
- "subType": "general", "grammar", "vocabulary", "essay", "comprehension", "ocean", "behavioral"

Content Plan:
- ${subjectiveCount} scenario-based "subjective" questions on "${pickedThemes}".
- ${englishCount} "english" questions (Grammar: "${pickedGrammar}", Vocab: "${pickedVocab}", Essay: "${pickedEssay}").
- ${psychoCount} "psychometric" OCEAN traits: ${shuffledOceans.slice(0, psychoCount).join(', ')}.

Tone: Professional, technically grounded, and growth-oriented. Return ONLY a valid JSON array:
[{"type":"subjective","subType":"general","questionText":"...","difficulty":"medium","order":1,"expectedDuration":120}]`;

  const content = await chatCompletion([{ role: 'user', content: prompt }], 2048);
  
  try {
    const startIdx = content.indexOf('[');
    const endIdx = content.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1) return getMockQuestions(questionCount);
    
    const jsonStr = content.substring(startIdx, endIdx + 1);
    let parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed)) return getMockQuestions(questionCount);

    // SAFETY SCAN: Production-ready keyword filter
    const sensitivePattern = /vulgar|offensive|sexual|explicit|violent|hate|racist|death|kill/i;
    const safeParsed = parsed.filter(q => {
      const text = q.questionText || '';
      return !sensitivePattern.test(text);
    });

    // If safety scan stripped too many, fallback to mock instead of broken UI
    if (safeParsed.length < parsed.length / 2) return getMockQuestions(questionCount);
    parsed = safeParsed;

    // Normalize and validate
    const validTypes = ['subjective', 'english', 'psychometric'];
    const validSubTypes = ['general', 'grammar', 'vocabulary', 'essay', 'comprehension', 'ocean', 'behavioral'];
    
    return parsed.map(q => {
      // Normalize type
      let type = (q.type || 'subjective').toLowerCase();
      if (!validTypes.includes(type)) type = 'subjective';
      
      // Normalize subType
      let subType = (q.subType || 'general').toLowerCase();
      // Map specific topics GROQ might hallucinate as subTypes back to enums
      if (subType.includes('voice') || subType.includes('tense') || subType.includes('grammar')) subType = 'grammar';
      if (subType.includes('personality') || subType.includes('ocean')) subType = 'ocean';
      if (subType.includes('word') || subType.includes('vocab')) subType = 'vocabulary';
      
      if (!validSubTypes.includes(subType)) subType = 'general';

      return {
        ...q,
        type,
        subType,
        questionText: q.questionText || 'Tell me about your goals.',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty?.toLowerCase()) ? q.difficulty.toLowerCase() : 'medium',
      };
    });
  } catch {
    return getMockQuestions(questionCount);
  }
}


// Evaluate a user answer
async function evaluateAnswer(question, answer, questionType) {
  const prompt = `You are an Expert Engineering Mentor. Evaluate the user's answer for technical logic, professional communication, and emotional maturity. 

Question Type: ${questionType}
Question: ${question}
User's Answer: ${answer}

Return ONLY a valid JSON object. Do not include any markdown, triple backticks, or extra text.
{
  "score": <0-100>,
  "feedback": "<specific feedback>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<area1>", "<area2>"],
  "grammarScore": <0-100>,
  "vocabularyScore": <0-100>,
  "coherenceScore": <0-100>,
  "personalityTraits": {
    "openness": <0-100>,
    "conscientiousness": <0-100>,
    "extraversion": <0-100>,
    "agreeableness": <0-100>,
    "neuroticism": <0-100>
  }
} (Ensure all strings are properly escaped)`;

  const content = await chatCompletion([{ role: 'user', content: prompt }]);
  
  try {
    // Robust JSON extraction: Find the first '{' and the last '}'
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) throw new Error('No JSON object found');
    
    const jsonStr = content.substring(startIdx, endIdx + 1);
    const result = JSON.parse(jsonStr);
    
    // Ensure personalityTraits exist
    const sensitivePattern = /vulgar|offensive|sexual|explicit|violent|hate|racist|death|kill/i;
    if (result.feedback && sensitivePattern.test(result.feedback)) {
       result.feedback = "Focus on technical rigor and structural clarity in your responses.";
    }

    if (!result.personalityTraits) {
      result.personalityTraits = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
    } else {
      // Ensure all specific keys exist (case-insensitive normalization)
      const targetKeys = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
      const normalizedTraits = {};
      const actualKeys = Object.keys(result.personalityTraits);
      
      targetKeys.forEach(tk => {
        const found = actualKeys.find(ak => ak.toLowerCase() === tk);
        normalizedTraits[tk] = found ? (result.personalityTraits[found] || 0) : 0;
      });
      result.personalityTraits = normalizedTraits;
    }
    
    return result;
  } catch (error) {
    console.error('Answer evaluation parse error:', error.message);
    return getMockEvaluation();
  }
}

// Generate session summary
async function generateSessionSummary(sessionData) {
  const { scores, personalityTraits, questionsAnswered, totalQuestions, answerStrengths = [], answerImprovements = [] } = sessionData;
  const prompt = `You are a Principal Engineering Lead and Career Coach. Produce a DEEP, DATA-DRIVEN PERFORMANCE REVIEW for an engineering student.

Scores: ${JSON.stringify(scores)}
Personality (OCEAN): ${JSON.stringify(personalityTraits)}
Questions answered: ${questionsAnswered} of ${totalQuestions}
Strengths observed in answers: ${answerStrengths.join(', ') || 'none recorded'}
Areas for improvement from answers: ${answerImprovements.join(', ') || 'none recorded'}

Return ONLY valid JSON (no markdown), with this structure:
{
  "overallFeedback": "<3-4 sentences: highlight their unique communication style, overall performance arc, and one surprising insight you noticed>",
  "strengths": [
    "<strength 1 — be specific, e.g. 'Exceptional ability to structure arguments under pressure'>",
    "<strength 2 — link it to a personality trait>",
    "<strength 3 — mention how it helps them professionally>",
    "<strength 4 — optional: language/vocabulary strength>"
  ],
  "improvements": [
    "<improvement 1 — name the gap and give a concrete tip>",
    "<improvement 2 — tie to a measurable behavior>",
    "<improvement 3 — actionable 7-day challenge>"
  ],
  "personalityInsights": "<3-4 sentences: interpret their OCEAN scores deeply — which traits dominate, how they interact, what this means for their career and relationships, any hidden patterns in their word choices>",
  "communicationProfile": "<2 sentences: describe their natural speaking/writing style — logical vs emotional, direct vs diplomatic, formal vs casual>",
  "careerFitInsights": "<2 sentences: based on personality and skill scores, what roles or environments would they thrive in?>",
  "weeklyGoals": [
    "<specific, measurable goal 1 for next 7 days>",
    "<specific, measurable goal 2>",
    "<optional goal 3>"
  ],
  "motivationalNote": "<1 uplifting, personalized sentence that references something specific about their responses>"
}`;

  const content = await chatCompletion([{ role: 'user', content: prompt }]);
  
  try {
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) throw new Error('No JSON object found');
    
    const jsonStr = content.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonStr);
  } catch {
    return {
      overallFeedback: 'You demonstrated strong engagement throughout the session.',
      strengths: ['Clear communication', 'Thoughtful responses', 'Good time management'],
      improvements: ['Expand vocabulary', 'Provide more specific examples', 'Develop analytical depth'],
      personalityInsights: 'Your responses indicate high conscientiousness and openness to new ideas.',
      weeklyGoals: ['Practice active listening', 'Review grammar fundamentals'],
    };
  }
}

// Mock fallbacks
function getMockResponse(messages) {
  return JSON.stringify({
    score: 72,
    feedback: 'Good response demonstrating understanding of the topic.',
    strengths: ['Clear expression', 'Relevant points'],
    improvements: ['Add more detail', 'Improve structure'],
    grammarScore: 75,
    vocabularyScore: 70,
    coherenceScore: 72,
    personalityTraits: { openness: 70, conscientiousness: 75, extraversion: 60, agreeableness: 80, neuroticism: 35 },
  });
}

function getMockQuestions(count = 9) {
  const all = [
    { type: 'subjective', subType: 'general', questionText: 'Describe your biggest professional achievement in the past year and what you learned from it.', difficulty: 'medium', order: 1, expectedDuration: 120 },
    { type: 'subjective', subType: 'general', questionText: 'What are your primary goals for the next six months, and how do you plan to achieve them?', difficulty: 'medium', order: 2, expectedDuration: 120 },
    { type: 'subjective', subType: 'behavioral', questionText: 'Tell me about a time you faced a significant challenge. How did you overcome it?', difficulty: 'medium', order: 3, expectedDuration: 120 },
    { type: 'english', subType: 'grammar', questionText: 'Identify and correct any grammatical errors in this sentence: "Neither the manager nor the employees was present at the meeting what was scheduled for Monday."', difficulty: 'easy', order: 4, expectedDuration: 90 },
    { type: 'english', subType: 'vocabulary', questionText: 'Use the words "ephemeral", "resilient", and "pragmatic" in separate sentences that demonstrate their meaning.', difficulty: 'medium', order: 5, expectedDuration: 90 },
    { type: 'english', subType: 'essay', questionText: 'Write a short essay (150-200 words) on: "The role of technology in modern education – benefits and challenges."', difficulty: 'hard', order: 6, expectedDuration: 180 },
    { type: 'psychometric', subType: 'ocean', questionText: 'How often do you seek out new experiences, explore creative ideas, or engage with abstract concepts? Describe with an example.', difficulty: 'easy', order: 7, expectedDuration: 60, trait: 'openness' },
    { type: 'psychometric', subType: 'ocean', questionText: 'How do you typically plan and organize your tasks? Do you prefer structure or flexibility in your work approach?', difficulty: 'easy', order: 8, expectedDuration: 60, trait: 'conscientiousness' },
    { type: 'psychometric', subType: 'ocean', questionText: 'Describe your social energy. Do you feel energized by social interactions, or do you prefer working independently?', difficulty: 'easy', order: 9, expectedDuration: 60, trait: 'extraversion' },
  ];
  return all.slice(0, count);
}

function getMockEvaluation() {
  return {
    score: Math.floor(Math.random() * 30) + 60,
    feedback: 'Good response with clear structure and relevant insights.',
    strengths: ['Clear communication', 'Relevant examples'],
    improvements: ['Add more depth', 'Strengthen vocabulary'],
    grammarScore: Math.floor(Math.random() * 20) + 70,
    vocabularyScore: Math.floor(Math.random() * 20) + 65,
    coherenceScore: Math.floor(Math.random() * 20) + 68,
    personalityTraits: {
      openness: Math.floor(Math.random() * 30) + 60,
      conscientiousness: Math.floor(Math.random() * 30) + 60,
      extraversion: Math.floor(Math.random() * 40) + 40,
      agreeableness: Math.floor(Math.random() * 30) + 60,
      neuroticism: Math.floor(Math.random() * 30) + 20,
    },
  };
}

module.exports = { generateSessionQuestions, evaluateAnswer, generateSessionSummary };