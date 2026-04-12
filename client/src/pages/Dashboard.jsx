import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Flame, Star, Calendar, ChevronRight, PlayCircle,
  TrendingUp, Clock, CheckCircle2, BookOpen, Brain, Languages, 
  ArrowUpRight, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { MiniSparkline } from '../components/Charts';
import { PulseLoader } from '../components/UI/LoadingScreen';

import Copilot from '../components/UI/Copilot';

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

function XpBar({ xp, level }) {
  const targetXp = level * 1000;
  const progress = (xp / targetXp) * 100;
  return (
    <div className="flex flex-col gap-1 w-full max-w-[200px]">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span>Level {level}</span>
        <span>{Math.round(xp)} / {targetXp} XP</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${progress}%` }} 
          className="h-full bg-brand-500" 
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, colorByTheme, trend }) {
  const { theme } = useTheme();
  return (
    <motion.div {...fadeIn()} className="glass-card flex flex-col justify-between group cursor-default">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 group-hover:scale-110 transition-transform duration-500">
          <Icon size={22} className="text-brand-500" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
            <ArrowUpRight size={10} />
            {trend}%
          </div>
        )}
      </div>
      <div className="mt-6">
        <h3 className="text-3xl font-display font-bold leading-none dark:text-white light:text-slate-900">{value}</h3>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

function ScoreIndicator({ score, label, color }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" className="stroke-slate-200 dark:stroke-white/5" strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={circ - progress}
            strokeLinecap="round" className="transition-all duration-1000 ease-out shadow-lg" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-display font-bold dark:text-white light:text-slate-900">{score}%</span>
        </div>
      </div>
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState(user?.careerTrack || 'SDE');

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleTrackChange = async (newTrack) => {
    try {
      setTrack(newTrack);
      await api.put('/auth/profile', { careerTrack: newTrack });
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeUntilNext = (date) => {
    if (!date) return 'Flexible Schedule';
    const diff = new Date(date) - new Date();
    if (diff <= 0) return 'Ready whenever you are';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const latestScores = data?.latestReport?.scores;

  if (loading) return <PulseLoader />;

  return (
    <div className="space-y-10 pb-12 relative">
      <Copilot />

      {/* Hero Welcome */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <motion.div {...fadeIn(0)}>
          <div className="flex items-center gap-4 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-500">Welcome back, mentor</p>
            <XpBar xp={user?.xp || 0} level={user?.level || 1} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-[1.3] pb-2 dark:text-white light:text-slate-900">
            Master the Day, <br/>
            <span className="text-gradient leading-none">{user?.name?.split(' ')[0]}</span>
          </h1>
          
          <div className="flex items-center gap-3 mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Track:</span>
            <select 
              value={track} 
              onChange={(e) => handleTrackChange(e.target.value)}
              className="bg-slate-100 dark:bg-white/5 border-none text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-1 ring-brand-500 dark:text-white"
            >
              <option value="SDE">Software Engineer</option>
              <option value="Data Science">Data Science</option>
              <option value="Product Management">Product Management</option>
              <option value="General">Foundational</option>
            </select>
          </div>
        </motion.div>
        
        <motion.div {...fadeIn(0.1)} className="flex items-center gap-3">
          <button
            onClick={() => navigate('/session')}
            className="btn-premium flex-1 lg:flex-none">
            <PlayCircle size={20} />
            <span>{data?.currentSession?.status === 'in-progress' ? 'Resume Intel' : 'Initialize Session'}</span>
          </button>
          <button onClick={() => navigate('/history')} className="btn-outline">
            History
          </button>
        </motion.div>
      </section>

      {/* Grid: 2 columns on mobile, 4 on desktop */}
      {/* Grid: 1 column on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" role="list" aria-label="Key Performance Indicators">
        <StatCard icon={Target} label="Sessions" value={data?.stats?.totalSessions || 0} />
        <StatCard icon={TrendingUp} label="Avg Score" value={`${data?.stats?.averageScore || 0}%`} trend={3.2} />
        <StatCard icon={Flame} label="Streak" value={`${data?.stats?.currentStreak || 0}`} sub="Current Week" />
        <StatCard icon={Trophy} label="Rank" value={`#${data?.rank || '-'}`} sub="Global Leaderboard" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Performance Section */}
        <motion.div {...fadeIn(0.2)} className="lg:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-10 pb-5 border-b dark:border-white/5 light:border-slate-100">
            <div>
              <h2 className="text-xl font-bold dark:text-white light:text-slate-900">Performance Intelligence</h2>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Latest session insights</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold dark:text-brand-400 light:text-brand-600">WEEK {data?.latestReport?.weekNumber || 0}</span>
              <span className="text-[10px] text-slate-500 font-medium">REPORT #{(data?.latestReport?._id || '000').slice(-3)}</span>
            </div>
          </div>

          {latestScores ? (
            <div className="flex flex-wrap items-center justify-around gap-y-10 py-4">
              <ScoreIndicator score={Math.round(latestScores.overall || 0)} label="Overall" color="#6366f1" />
              <ScoreIndicator score={Math.round(latestScores.confidence || 0)} label="Confidence" color="#6366f1" />
              <ScoreIndicator score={Math.round(latestScores.clarity || 0)} label="Clarity" color="#a855f7" />
              <ScoreIndicator score={Math.round(latestScores.consistency || 0)} label="Consistency" color="#06b6d4" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-slate-400" />
              </div>
              <p className="dark:text-white light:text-slate-900 font-bold">Intelligence Feed Idle</p>
              <p className="text-slate-500 text-xs mt-1 max-w-[200px]">Complete your foundational session to unlock neural metrics.</p>
            </div>
          )}

          {data?.scoreTrend?.length > 1 && (
            <div className="mt-12 pt-8 border-t dark:border-white/5 light:border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Historical Trend</p>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                   <span className="text-[10px] font-bold text-slate-400">OVERALL INDEX</span>
                </div>
              </div>
              <div className="h-16 w-full">
                <MiniSparkline data={data.scoreTrend.map(d => d.score)} color="#6366f1" />
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <motion.div {...fadeIn(0.3)} className="glass-card bg-gradient-to-br dark:from-brand-500/10 dark:to-transparent light:from-brand-50 light:to-white border-brand-500/20 shadow-xl shadow-brand-500/5">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Calendar size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-bold py-1 px-3 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">UPCOMING</span>
            </div>
            <h3 className="text-2xl font-display font-bold dark:text-white light:text-slate-900 mb-1">
              {data?.nextSession ? new Date(data.nextSession).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Open Cycle'}
            </h3>
            <p className="text-slate-500 text-sm">{getTimeUntilNext(data?.nextSession)}</p>
            
            <div className="mt-8 pt-6 border-t dark:border-white/5 light:border-slate-100 space-y-3">
              {[
                { icon: Brain, text: 'Subjective Module' },
                { icon: Languages, text: 'Linguistic Audit' },
                { icon: Star, text: 'OCEAN Psychometric' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <Icon size={12} className="text-brand-500" />
                  </div>
                  <span className="dark:text-slate-300 light:text-slate-600 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeIn(0.4)} className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold dark:text-white light:text-slate-900 flex items-center gap-2 text-sm">
                <Clock size={16} className="text-slate-500" />
                Audit Logs
              </h3>
            </div>
            <div className="space-y-4">
              {data?.recentSessions?.length > 0 ? (
                data.recentSessions.slice(0, 3).map(s => (
                  <div key={s._id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        s.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold dark:text-white light:text-slate-900">Week {s.weekNumber}</p>
                        <p className="text-[10px] text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {s.report?.scores?.overall != null && (
                      <span className="text-xs font-mono font-bold text-brand-500">{Math.round(s.report.scores.overall)}%</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-4 italic">Sequential logs empty.</p>
              )}
            </div>
            <button
              onClick={() => navigate('/history')}
              className="w-full mt-8 p-3 rounded-xl dark:bg-white/5 light:bg-slate-50 dark:text-slate-400 light:text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-brand-500 transition-all">
              Full Archive
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
