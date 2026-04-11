import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Minus, Maximize2 } from 'lucide-react';
import api from '../../services/api';

export default function AssistantHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Mentor Assistant. I can help with engineering concepts, technical skills, or personality development. How can I support your growth today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/assistant/chat', { message: input, history });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection lost. I am temporarily offline.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[90vw] max-w-[400px] h-[550px] glass dark:bg-surface-950/95 light:bg-white/95 rounded-[2rem] border dark:border-white/10 light:border-slate-200 shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b dark:border-white/5 light:border-slate-100 flex items-center justify-between premium-gradient text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">Mentor Assistant</h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Focus: Growth & Intel</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Minus size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                      : 'dark:bg-white/5 light:bg-slate-100 dark:text-slate-200 light:text-slate-800 border dark:border-white/5 light:border-slate-200'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="dark:bg-white/5 light:bg-slate-100 p-4 rounded-2xl flex gap-1.5">
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-5 border-t dark:border-white/5 light:border-slate-100 bg-black/5">
              <div className="relative">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about skills, education..."
                  className="w-full bg-white/5 dark:bg-white/5 light:bg-white border dark:border-white/10 light:border-slate-200 rounded-xl px-5 py-3.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-white light:text-slate-900"
                />
                <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-lg">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-slate-800 text-white rotate-90' : 'premium-gradient text-white hover:shadow-brand-500/40'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
           <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-surface-950 rounded-full" />
        )}
      </motion.button>
    </div>
  );
}
