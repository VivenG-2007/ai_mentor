import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 dark:bg-surface-950 light:bg-white flex items-center justify-center z-50 transition-colors duration-500">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 glow-brand overflow-hidden"
        >
          <img src="/favicon.png" alt="Loading Logo" className="w-full h-full object-cover" />
        </motion.div>
        <h2 className="font-display font-bold dark:text-white light:text-slate-900 text-xl mb-2">AI Mentor</h2>
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-500"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PulseLoader() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full"
      />
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Synchronizing Intelligence Metrics...</p>
    </div>
  );
}
