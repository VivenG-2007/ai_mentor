const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const { protect } = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const systemPrompt = `You are the AI Mentor Assistant, a precise and professional companion for engineering students.
    RULE 1: Only answer questions related to EDUCATION (engineering, computer science, technical skills) or PERSONALITY DEVELOPMENT (soft skills, leadership, productivity, mental resilience).
    RULE 2: If a question is about any other topic (movies, sports, off-topic chat), politely state that you are specialized in professional growth and cannot assist with that.
    RULE 3: Responses must be PRECISE, high-level, and professional. 
    RULE 4: Responses MUST BE CONCISE, keep your total response length between 2 to 3 lines.
    RULE 5: Do not use flowery language. Be an efficient engineering mentor.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-5), // Last 5 messages for context
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('Assistant Error:', err);
    res.status(500).json({ message: 'Assistant is temporarily offline.' });
  }
});

module.exports = router;
