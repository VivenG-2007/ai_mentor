
const { generateSessionQuestions } = require('../server/services/groqService');
require('dotenv').config({ path: './server/.env' });

async function test() {
  try {
    const questions = await generateSessionQuestions({ name: 'Test', profession: 'Dev', goals: ['Learn AI'] }, 3);
    console.log('QUESTIONS:', JSON.stringify(questions, null, 2));
    console.log('COUNT:', questions.length);
  } catch (err) {
    console.error('FAILED:', err);
  }
}

test();
