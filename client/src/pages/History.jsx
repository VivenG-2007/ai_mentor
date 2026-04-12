import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Download, Eye, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, PlayCircle, Calendar, BarChart3
} from 'lucide-react';
import api from '../services/api';
import { PulseLoader } from '../components/UI/LoadingScreen';

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'dark:text-green-400 light:text-green-600 dark:bg-green-500/10 light:bg-green-600/5 border-green-500/20', icon: CheckCircle2 },
  'in-progress': { label: 'In Progress', color: 'dark:text-brand-400 light:text-brand-600 dark:bg-brand-500/10 light:bg-brand-600/5 border-brand-500/20', icon: PlayCircle },
  paused: { label: 'Paused', color: 'dark:text-amber-400 light:text-amber-600 dark:bg-amber-500/10 light:bg-amber-600/5 border-amber-500/20', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'dark:text-slate-400 light:text-slate-500 dark:bg-slate-700/30 light:bg-slate-200 border-slate-600/20', icon: Calendar },
  cancelled: { label: 'Cancelled', color: 'dark:text-red-400 light:text-red-600 dark:bg-red-500/10 light:bg-red-600/5 border-red-500/20', icon: XCircle },
};

// Calculate backend base URL (remove /api from the end if present)
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

function getReportUrl(reportId) {
  if (!reportId) return '#';
  return `${BACKEND_URL}/reports/view/${reportId}`;
}

function ScoreBar({ score, color = '#6366f1' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
      <span className="text-xs font-mono dark:text-slate-400 light:text-slate-600 w-8 text-right">{score}%</span>
    </div>
  );
}

function SessionDetailModal({ session, onClose }) {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?._id) {
      api.get(`/answers/session/${session._id}`)
        .then(r => setAnswers(r.data.answers))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (!session) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="glass dark:bg-surface-900 border dark:border-white/10 light:border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h3 className="font-display font-bold dark:text-white light:text-slate-900 text-lg">
              Week {session.weekNumber} · {session.year}
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">
              {session.startTime ? new Date(session.startTime).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
              }) : 'No date'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        {/* Scores */}
        {session.scores?.overall > 0 && (
          <div className="p-6 border-b border-white/5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400">Overall Score</span>
                  <span className="text-xl font-display font-bold text-brand-400">{Math.round(session.scores.overall)}%</span>
                </div>
                <ScoreBar score={Math.round(session.scores.overall)} color="#6366f1" />
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Subjective', key: 'subjective', color: '#8b5cf6' },
                { label: 'English', key: 'english', color: '#06b6d4' },
                { label: 'Psychometric', key: 'psychometric', color: '#f59e0b' },
              ].map(({ label, key, color }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                  <ScoreBar score={Math.round(session.scores[key] || 0)} color={color} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answers */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <h4 className="text-sm font-semibold dark:text-slate-300 light:text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={15} />
            Question & Answer Review
          </h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : answers.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6 italic">No answers recorded</p>
          ) : (
            <div className="space-y-3">
              {answers.map((answer, i) => (
                <div key={answer._id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-500 font-bold">Q{i + 1}</span>
                      {answer.question?.type && (
                        <span className={`score-badge text-[10px] ${
                          answer.question.type === 'english' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          answer.question.type === 'psychometric' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {answer.question.type.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${
                      answer.score >= 80 ? 'text-green-500' : answer.score >= 60 ? 'text-amber-500' : 'text-red-500'
                    }`}>{answer.score}%</span>
                  </div>
                  {answer.question?.questionText && (
                    <p className="text-xs dark:text-slate-400 light:text-slate-600 leading-relaxed font-medium italic">
                      "{answer.question.questionText}"
                    </p>
                  )}
                  <div className="p-3 rounded-xl dark:bg-black/20 light:bg-slate-50 border dark:border-white/5 light:border-slate-100">
                    <p className="text-sm dark:text-slate-200 light:text-slate-800 leading-relaxed">
                      {answer.answerText}
                    </p>
                  </div>
                  {answer.feedback && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-brand-500/5 border border-brand-500/10">
                       <span className="text-xs text-brand-500">💡</span>
                       <p className="text-xs dark:text-slate-400 light:text-slate-600 leading-relaxed">{answer.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {session.report?._id && (
          <div className="p-4 border-t border-white/5">
            <a href={getReportUrl(session.report._id)} target="_blank" rel="noopener noreferrer"
              className="w-full btn-primary flex items-center justify-center gap-2 text-sm">
              <Download size={15} />
              Download PDF Report
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handler = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      api.get(`/sessions?${params}`)
        .then(r => {
          setSessions(r.data.sessions);
          setTotal(r.data.total);
          setPages(r.data.pages);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 400); // 400ms debounce

    return () => clearTimeout(handler);
  }, [page, statusFilter, search]);

  const filtered = sessions;

  if (loading) return <PulseLoader />;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title">Session History</h1>
        <p className="text-slate-400 text-sm mt-1">{total} total sessions recorded</p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by week, status, year..."
            className="input-field pl-9" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field pl-9 pr-8 w-full sm:w-auto appearance-none cursor-pointer">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="paused">Paused</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card p-0 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-2">Week</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Overall Score</div>
          <div className="col-span-2">Sections</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No sessions found</p>
            <p className="text-slate-600 text-sm mt-1">Complete your first session to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((session, i) => {
              const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
              const StatusIcon = statusCfg.icon;
              const hasScore = session.scores?.overall > 0;

              return (
                <motion.div key={session._id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-white/2 transition-colors group">
                  <div className="col-span-2">
                    <span className="font-display font-bold dark:text-white light:text-slate-900 text-sm">W{session.weekNumber}</span>
                    <span className="text-slate-500 text-xs ml-1">'{String(session.year).slice(-2)}</span>
                  </div>
                  <div className="col-span-2 text-xs dark:text-slate-400 light:text-slate-600">
                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                  <div className="col-span-2">
                    <span className={`score-badge border text-xs ${statusCfg.color}`}>
                      <StatusIcon size={11} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="col-span-3">
                    {hasScore ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full transition-all"
                            style={{ width: `${session.scores.overall}%` }} />
                        </div>
                        <span className={`text-sm font-bold font-mono flex-shrink-0 ${
                          session.scores.overall >= 80 ? 'text-green-500' :
                          session.scores.overall >= 60 ? 'text-amber-500' : 'text-red-500'
                        }`}>{Math.round(session.scores.overall)}%</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">No score</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    {hasScore && (
                      <div className="flex gap-1.5">
                        {[
                          { score: session.scores.subjective, color: '#8b5cf6' },
                          { score: session.scores.english, color: '#06b6d4' },
                          { score: session.scores.psychometric, color: '#f59e0b' },
                        ].map(({ score, color }, j) => (
                          <div key={j} className="flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold"
                              style={{ backgroundColor: `${color}20`, color }}>
                              {Math.round(score || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <button onClick={() => setSelected(session)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                      <Eye size={15} />
                    </button>
                    {session.report?._id && (
                      <a href={getReportUrl(session.report._id)} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/5 text-slate-400 hover:text-brand-400 transition-all">
                        <Download size={15} />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl glass text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-xl text-sm font-medium transition-all ${
                  page === p ? 'bg-brand-500 text-white' : 'glass text-slate-400 hover:text-white'
                }`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="p-2 rounded-xl glass text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && <SessionDetailModal session={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
