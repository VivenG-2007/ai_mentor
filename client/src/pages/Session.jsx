import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircle, PauseCircle, ChevronRight, CheckCircle2, Clock,
  Brain, Languages, Star, Sparkles, AlertCircle, Trophy, Download
} from 'lucide-react';
import AvatarScene from '../components/Avatar/AvatarScene';
import VoiceControls from '../components/Avatar/VoiceControls';
import { useVoice } from '../hooks/useVoice';
import api from '../services/api';
import { getSocket } from '../services/socket';

const TYPE_CONFIG = {
  subjective: { 
    color: 'dark:text-purple-400 light:text-purple-600', 
    bg: 'dark:bg-purple-500/10 dark:border-purple-500/20 light:bg-purple-600/5 light:border-purple-600/20', 
    icon: Brain, 
    label: 'Subjective' 
  },
  english: { 
    color: 'dark:text-cyan-400 light:text-cyan-600', 
    bg: 'dark:bg-cyan-500/10 dark:border-cyan-500/20 light:bg-cyan-600/5 light:border-cyan-600/20', 
    icon: Languages, 
    label: 'English' 
  },
  psychometric: { 
    color: 'dark:text-amber-400 light:text-amber-600', 
    bg: 'dark:bg-amber-500/10 dark:border-amber-500/20 light:bg-amber-600/5 light:border-amber-600/20', 
    icon: Star, 
    label: 'Psychometric' 
  },
};

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

function ScoreDisplay({ score, feedback, strengths, improvements, onNext, isLast }) {
  const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="label">Your Score</span>
          <p className={`text-4xl font-display font-bold ${color}`}>{score}%</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          {score >= 70 ? <CheckCircle2 size={28} className="text-green-400" /> : <AlertCircle size={28} className="text-amber-400" />}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl dark:bg-black/20 light:bg-slate-50 border dark:border-white/5 light:border-slate-100">
          <p className="text-sm dark:text-slate-300 light:text-slate-700 leading-relaxed">{feedback}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {strengths?.length > 0 && (
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/15">
            <p className="text-xs font-semibold text-green-400 mb-1.5">Strengths</p>
            {strengths.map((s, i) => (
              <p key={i} className="text-xs text-slate-400 flex items-start gap-1.5 mb-1">
                <span className="text-green-400 mt-0.5">✓</span>{s}
              </p>
            ))}
          </div>
        )}
        {improvements?.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <p className="text-xs font-semibold text-amber-400 mb-1.5">Improve</p>
            {improvements.map((imp, i) => (
              <p key={i} className="text-xs text-slate-400 flex items-start gap-1.5 mb-1">
                <span className="text-amber-400 mt-0.5">→</span>{imp}
              </p>
            ))}
          </div>
        )}
      </div>

      <motion.button onClick={onNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="w-full btn-primary flex items-center justify-center gap-2">
        {isLast ? <><Trophy size={16} />Complete Session</> : <><ChevronRight size={16} />Next Question</>}
      </motion.button>
    </motion.div>
  );
}

export default function Session() {
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | loading | question | evaluating | result | complete
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [lastEval, setLastEval] = useState(null);
  const [scores, setScores] = useState([]);
  const [avatarState, setAvatarState] = useState('idle');
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [report, setReport] = useState(null);
  const [questionCount, setQuestionCount] = useState(9);
  const timerRef = useRef(null);
  const { speak, stopSpeaking, isSpeaking } = useVoice();

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;
  const socket = getSocket();

  // Avatar sync with speaking state
  useEffect(() => {
    if (isSpeaking) setAvatarState('speaking');
    else if (phase === 'question') setAvatarState('listening');
    else if (phase === 'evaluating') setAvatarState('thinking');
    else setAvatarState('idle');
  }, [isSpeaking, phase]);

  // Timer
  useEffect(() => {
    if (phase === 'question' && !isPaused) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, isPaused]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.on('score:updated', (data) => {
      setScores(prev => [...prev, data.score]);
    });
    return () => socket.off('score:updated');
  }, [socket]);

  const startSession = async () => {
    setPhase('loading');
    try {
      const { data } = await api.post('/sessions/start', { questionCount });
      setSession(data.session);
      setQuestions(data.questions.sort((a, b) => a.order - b.order));
      setCurrentIdx(0);
      setPhase('question');
      setTimer(0);

      // Speak intro
      setTimeout(() => {
        speak(`Hello ${data.session?.user?.name || ''}, welcome to your weekly mentoring session. I'll be guiding you through ${data.questions.length} questions today. Let's begin with the first question.`, () => {
          setTimeout(() => speakQuestion(data.questions[0]), 500);
        });
      }, 500);
    } catch (err) {
      console.error('Start session error:', err);
      setPhase('idle');
    }
  };

  const speakQuestion = useCallback((q) => {
    if (!q) return;
    const prefix = q.type === 'psychometric' ? 'Personality question: ' : q.type === 'english' ? 'English assessment: ' : '';
    speak(prefix + q.questionText);
    setAvatarState('speaking');
  }, [speak]);

  const handleSubmitAnswer = async (answerText) => {
    if (!answerText?.trim() || !currentQ) return;
    stopSpeaking();
    setPhase('evaluating');
    setAvatarState('thinking');

    try {
      const { data } = await api.post('/answers', {
        sessionId: session._id,
        questionId: currentQ._id,
        answerText,
        inputMode: 'text',
        timeTaken: timer,
      });
      setLastEval(data.evaluation);
      setScores(prev => [...prev, data.evaluation.score]);
      setPhase('result');

      // Speak feedback
      speak(`Good answer! You scored ${data.evaluation.score} out of 100. ${data.evaluation.feedback}`);
    } catch (err) {
      console.error('Submit error:', err);
      setPhase('question');
    }
  };

  const handleNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      completeSession();
    } else {
      setCurrentIdx(nextIdx);
      setPhase('question');
      setLastEval(null);
      setTimer(0);
      setCurrentAnswer('');
      setTimeout(() => speakQuestion(questions[nextIdx]), 300);
    }
  };

  const completeSession = async () => {
    setPhase('loading');
    stopSpeaking();

    // Calculate scores
    const allAnswers = await api.get(`/answers/session/${session._id}`).then(r => r.data.answers);
    const byType = (type) => {
      const filtered = allAnswers.filter(a => {
        const q = questions.find(q => q._id === a.question?._id || q._id === a.question);
        return q?.type === type;
      });
      return filtered.length ? Math.round(filtered.reduce((s, a) => s + a.score, 0) / filtered.length) : 0;
    };

    const finalScores = {
      subjective: byType('subjective'),
      english: byType('english'),
      psychometric: byType('psychometric'),
      overall: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
    };

    // Aggregate personality traits
    const traitScores = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
    const psychoAnswers = allAnswers.filter(a => {
      const q = questions.find(q => q._id === a.question?._id || q._id === a.question);
      return q?.type === 'psychometric';
    });
    if (psychoAnswers.length > 0) {
      psychoAnswers.forEach(a => {
        if (a.traitScores) Object.keys(traitScores).forEach(k => { traitScores[k] += (a.traitScores[k] || 0) / psychoAnswers.length; });
      });
    }

    try {
      await api.put(`/sessions/${session._id}/complete`, {
        scores: finalScores,
        personalityTraits: traitScores,
      });
      const reportResp = await api.post(`/reports/generate/${session._id}`);
      setReport(reportResp.data.report);
    } catch (err) {
      console.error('Complete error:', err);
    }

    setPhase('complete');
    speak('Congratulations! You have completed your weekly mentoring session. Your performance report is ready. Well done!');
    setAvatarState('idle');
  };

  const handlePause = async () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
      await api.put(`/sessions/${session?._id}/pause`).catch(() => {});
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Avatar Panel */}
      <div className="relative lg:w-1/2 h-64 lg:h-full bg-gradient-to-b from-surface-950 to-surface-900 overflow-hidden">
        {/* State indicator */}
        <div className="absolute top-4 left-4 z-10">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold glass
            ${avatarState === 'speaking' ? 'text-brand-400 border-brand-500/30'
              : avatarState === 'listening' ? 'text-cyan-400 border-cyan-500/30'
              : avatarState === 'thinking' ? 'text-amber-400 border-amber-500/30'
              : 'text-slate-400 border-white/10'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              avatarState === 'speaking' ? 'bg-brand-400 animate-pulse' :
              avatarState === 'listening' ? 'bg-cyan-400 animate-pulse' :
              avatarState === 'thinking' ? 'bg-amber-400 animate-pulse' :
              'bg-slate-500'}`} />
            AI Mentor — {avatarState}
          </div>
        </div>

        {/* Live score */}
        {phase !== 'idle' && scores.length > 0 && (
          <div className="absolute top-4 right-4 z-10 glass px-3 py-1.5 rounded-full">
            <span className="text-xs text-slate-400">Avg: </span>
            <span className="text-sm font-bold text-brand-400">{avgScore}%</span>
          </div>
        )}

        <AvatarScene avatarState={avatarState} />
      </div>

      {/* Interaction Panel */}
      <div className="lg:w-1/2 flex flex-col glass dark:bg-surface-900/50 light:bg-white border-l dark:border-white/5 light:border-slate-200 overflow-y-auto">
        {/* Progress bar */}
        {questions.length > 0 && (
          <div className="h-1 bg-surface-800 flex-shrink-0">
            <motion.div className="h-full bg-gradient-to-r from-brand-500 to-purple-500"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        )}

        <div className="flex-1 p-6 space-y-5">
          {/* IDLE */}
          {phase === 'idle' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold dark:text-white light:text-slate-900 mb-2">Ready for your session?</h2>
                <p className="dark:text-slate-400 light:text-slate-600 text-sm leading-relaxed">
                  Fresh questions every session — tailored to your profile and designed to reveal new insights about you.
                </p>
              </div>

              {/* Question Count Selector */}
              <div className="card text-left space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold dark:text-white light:text-slate-800">How many questions?</p>
                  <span className="text-brand-500 font-bold text-lg">{questionCount}</span>
                </div>
                <input
                  type="range" min={3} max={15} step={1}
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>3 — Quick</span>
                  <span>9 — Standard</span>
                  <span>15 — Deep Dive</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[3, 6, 9, 12].map(n => (
                    <button key={n} onClick={() => setQuestionCount(n)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${questionCount === n ? 'bg-brand-500/20 border-brand-500/50 text-brand-400' : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <div key={type} className={`p-3 rounded-xl border ${cfg.bg} text-center`}>
                      <Icon size={20} className={`${cfg.color} mx-auto mb-1`} />
                      <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Randomized</p>
                    </div>
                  );
                })}
              </div>
              <motion.button onClick={startSession} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center justify-center gap-2 w-full py-4 text-base">
                <PlayCircle size={20} />
                Begin Session · {questionCount} Questions
              </motion.button>
            </motion.div>
          )}

          {/* LOADING */}
          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-brand-500/30 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={18} className="text-brand-400" />
                </div>
              </div>
              <p className="text-slate-400 text-sm">Preparing your session...</p>
            </div>
          )}

          {/* QUESTION */}
          {(phase === 'question' || phase === 'evaluating') && currentQ && (
            <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="space-y-5">
              {/* Question header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`score-badge ${TYPE_CONFIG[currentQ.type]?.bg} ${TYPE_CONFIG[currentQ.type]?.color}`}>
                    {TYPE_CONFIG[currentQ.type]?.label}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{currentQ.subType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Clock size={14} />
                    <span className="font-mono">{formatTime(timer)}</span>
                  </div>
                  <button onClick={handlePause}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                    {isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Question {currentIdx + 1}</span>
                <span>/</span>
                <span>{questions.length}</span>
                <div className="flex gap-1 ml-1">
                  {questions.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i < currentIdx ? 'bg-green-500' : i === currentIdx ? 'bg-brand-500' : 'bg-slate-700'
                    }`} />
                  ))}
                </div>
              </div>

              {/* Question text */}
              <div className="card">
                <p className="dark:text-white light:text-slate-900 leading-relaxed font-medium">{currentQ.questionText}</p>
              </div>

              {isPaused ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 mb-3">Session paused</p>
                  <button onClick={handlePause} className="btn-primary flex items-center gap-2 mx-auto">
                    <PlayCircle size={16} />Resume
                  </button>
                </div>
              ) : (
                <VoiceControls
                  onSubmit={handleSubmitAnswer}
                  disabled={phase === 'evaluating'}
                  currentAnswer={currentAnswer}
                  onAnswerChange={setCurrentAnswer}
                />
              )}

              {phase === 'evaluating' && (
                <div className="flex items-center justify-center gap-3 py-3 text-slate-400 text-sm">
                  <div className="w-4 h-4 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
                  AI is evaluating your answer...
                </div>
              )}
            </motion.div>
          )}

          {/* RESULT */}
          {phase === 'result' && lastEval && (
            <ScoreDisplay
              score={lastEval.score}
              feedback={lastEval.feedback}
              strengths={lastEval.strengths}
              improvements={lastEval.improvements}
              onNext={handleNext}
              isLast={currentIdx >= questions.length - 1}
            />
          )}

          {/* COMPLETE */}
          {phase === 'complete' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 py-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trophy size={28} className="text-green-500" />
                </div>
                <h2 className="font-display text-2xl font-bold dark:text-white light:text-slate-900">Session Complete!</h2>
                <p className="text-slate-500 mt-1 text-sm">Excellent work on completing your weekly session</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="card text-center">
                  <p className="text-3xl font-display font-bold text-brand-400">{avgScore}%</p>
                  <p className="text-xs text-slate-400 mt-1">Overall Score</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-display font-bold text-green-400">{scores.length}</p>
                  <p className="text-xs text-slate-400 mt-1">Questions Answered</p>
                </div>
              </div>

              {report?._id && (
                <a href={`${BACKEND_URL}/reports/view/${report._id}`} target="_blank" rel="noopener noreferrer"
                  className="w-full btn-primary flex items-center justify-center gap-2">
                  <Download size={16} />
                  Download Performance Report
                </a>
              )}
              <button onClick={() => { setPhase('idle'); setSession(null); setQuestions([]); setScores([]); setCurrentIdx(0); }}
                className="w-full btn-secondary flex items-center justify-center gap-2">
                Start New Session
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}