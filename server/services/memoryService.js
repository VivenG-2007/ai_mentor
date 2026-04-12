const Memory = require('../models/Memory');
const Groq = require('./groqService'); // For summarization if needed

/**
 * AI Memory Service (RAG Implementation)
 * Handles long-term memory and context retrieval for personalized mentoring.
 */
class MemoryService {
  /**
   * Store a new memory entry (Optimized: Selective storage)
   */
  async storeMemory(userId, sessionId, content, type = 'answer', metadata = {}) {
    try {
      // OPTIMIZATION: Only store weak answers (< 60) or key insights
      const isWeak = metadata.score !== undefined && metadata.score < 60;
      const isInsight = type === 'fact' || type === 'trait' || metadata.isKeyInsight;

      if (!isWeak && !isInsight) {
        console.log('Skipping memory storage for strong/standard answer to save tokens/space.');
        return null;
      }

      // const embedding = await OpenAI.createEmbedding(content);
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

      const memory = new Memory({
        user: userId,
        session: sessionId,
        content,
        embedding: mockEmbedding,
        type,
        metadata,
      });

      await memory.save();
      return memory;
    } catch (error) {
      console.error('Error storing memory:', error);
    }
  }

  /**
   * Retrieve relevant context for a user
   * Uses Vector Search (Atlas Search implementation placeholder)
   */
  async getRelevantContext(userId, query, limit = 5) {
    try {
      // Placeholder for Atlas Vector Search logic
      // In production: return Memory.aggregate([{ $vectorSearch: { ... } }])
      
      const memories = await Memory.find({ user: userId })
        .sort({ 'metadata.timestamp': -1 })
        .limit(limit);

      return memories.map(m => `[Topic: ${m.metadata?.topic || 'General'}] ${m.content}`).join('\n');
    } catch (error) {
      console.error('Error retrieving context:', error);
      return '';
    }
  }

  /**
   * Identify weak areas based on past performance
   */
  async getWeakAreas(userId) {
    const memories = await Memory.find({ 
      user: userId, 
      'metadata.score': { $lt: 60 } 
    }).limit(10);
    
    return [...new Set(memories.map(m => m.metadata.topic).filter(Boolean))];
  }
}

module.exports = new MemoryService();
