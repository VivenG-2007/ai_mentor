import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Send, RotateCcw, AlertCircle } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';

export default function VoiceControls({ onSubmit, disabled, currentAnswer, onAnswerChange }) {
  const [mode, setMode] = useState('voice'); // 'voice' | 'text'
  const {
    isListening, isSpeaking, transcript, interimTranscript,
    hasPermission, error, startListening, stopListening,
    stopSpeaking, clearTranscript, isSupported, fullTranscript
  } = useVoice();

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) onAnswerChange(transcript);
    } else {
      clearTranscript();
      startListening();
    }
  };

  const handleSubmit = () => {
    const answer = mode === 'voice' ? (transcript || currentAnswer) : currentAnswer;
    if (!answer?.trim()) return;
    stopListening();
    onSubmit(answer.trim());
    clearTranscript();
    onAnswerChange('');
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-surface-900 rounded-xl w-fit">
        {['voice', 'text'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            {m === 'voice' ? '🎤 Voice' : '⌨️ Text'}
          </button>
        ))}
      </div>

      {/* Voice mode */}
      {mode === 'voice' && (
        <div className="space-y-3">
          {!isSupported && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
              <AlertCircle size={16} />
              <span>Voice not supported. Use text mode.</span>
            </div>
          )}

          {hasPermission === false && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>Microphone permission denied. Please allow access.</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Transcript display */}
          <AnimatePresence>
            {(transcript || interimTranscript) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-surface-800/60 border border-white/5 min-h-[80px]">
                <p className="text-sm text-slate-500 mb-1 font-mono">Transcript</p>
                <p className="text-white text-sm leading-relaxed">
                  {transcript}
                  <span className="text-slate-500">{interimTranscript}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Mic button */}
            <motion.button
              onClick={handleMicToggle}
              disabled={disabled || !isSupported}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200
                ${isListening
                  ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-recording'
                  : 'bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-red-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.button>

            {/* Stop speaking */}
            {isSpeaking && (
              <button onClick={stopSpeaking}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-sm transition-colors">
                <VolumeX size={16} />
                Stop
              </button>
            )}

            {/* Clear */}
            {transcript && (
              <button onClick={clearTranscript}
                className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <RotateCcw size={16} />
              </button>
            )}

            {/* Submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={disabled || (!transcript && !currentAnswer)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Send size={16} />
              Submit Answer
            </motion.button>
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Listening... speak your answer clearly
            </div>
          )}
        </div>
      )}

      {/* Text mode */}
      {mode === 'text' && (
        <div className="space-y-3">
          <textarea
            value={currentAnswer}
            onChange={e => onAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            disabled={disabled}
            rows={5}
            className="input-field resize-none leading-relaxed"
          />
          <motion.button
            onClick={() => { onSubmit(currentAnswer); onAnswerChange(''); }}
            disabled={disabled || !currentAnswer?.trim()}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Submit Answer
          </motion.button>
        </div>
      )}
    </div>
  );
}
