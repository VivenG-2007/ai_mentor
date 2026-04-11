import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Target, PieChart as PieIcon, Brain, RefreshCw } from 'lucide-react';
import {
  WeeklyPerformanceChart,
  SectionBarChart,
  PersonalityRadarChart,
  ScoreDistributionPie,
} from '../components/Charts';
import api from '../services/api';
import { PulseLoader } from '../components/UI/LoadingScreen';

const TRAIT_DESCRIPTIONS = {
  Openness: 'Curiosity, creativity, and openness to new experiences',
  Conscientiousness: 'Organization, dependability, and self-discipline',
  Extraversion: 'Social energy, assertiveness, and outgoing nature',
  Agreeableness: 'Cooperation, trust, and empathy toward others',
  Neuroticism: 'Emotional sensitivity and tendency toward negative emotions',
};

function ChartCard({ title, icon: Icon, children, color = 'brand', info }) {
  const colors = {
    brand: 'text-brand-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="glass-card">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center ${colors[color]}`}>
            <Icon size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold dark:text-white light:text-slate-900 text-base">{title}</h3>
            {info && <p className="text-xs text-slate-500 mt-0.5">{info}</p>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b dark:border-white/5 light:border-slate-100 last:border-0">
      <span className="text-sm dark:text-slate-400 light:text-slate-600">{label}</span>
      <span className="font-bold font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState(12);

  const fetchAnalytics = () => {
    setLoading(true);
    api.get(`/analytics?weeks=${weeks}`)
      .then(r => setData(r.data.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnalytics(); }, [weeks]);

  if (loading) return <PulseLoader />;

  const hasData = data?.totalReports > 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            {hasData ? `Based on ${data.totalReports} completed sessions` : 'Complete sessions to unlock analytics'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={weeks} onChange={e => setWeeks(Number(e.target.value))}
            className="input-field w-auto text-sm py-2">
            <option value={4}>Last 4 weeks</option>
            <option value={8}>Last 8 weeks</option>
            <option value={12}>Last 12 weeks</option>
            <option value={24}>Last 24 weeks</option>
          </select>
          <button onClick={fetchAnalytics}
            className="p-2.5 rounded-xl glass text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </motion.div>

      {/* Overall average banner */}
      {hasData && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card bg-gradient-to-r from-brand-500/10 to-purple-600/5 border-brand-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="label mb-1">Overall Average Score</p>
              <p className="text-4xl font-display font-bold text-gradient">{data.overallAverage}%</p>
            </div>
            <div className="text-right space-y-1">
              <StatPill label="Subjective" value={data.sectionAverages?.subjective || 0} color="#8b5cf6" />
              <StatPill label="English" value={data.sectionAverages?.english || 0} color="#06b6d4" />
              <StatPill label="Psychometric" value={data.sectionAverages?.psychometric || 0} color="#f59e0b" />
            </div>
          </div>
        </motion.div>
      )}

      {!hasData ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="card text-center py-16">
          <BarChart3 size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-display font-bold text-lg mb-2">No Analytics Yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Complete at least one mentoring session to start seeing your performance analytics and trends.
          </p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Performance Line */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-2">
            <ChartCard title="Weekly Performance Trend" icon={TrendingUp} color="brand"
              info="Overall and section-wise score progression">
              <WeeklyPerformanceChart data={data.weeklyPerformance} />
            </ChartCard>
          </motion.div>

          {/* Section Bar */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <ChartCard title="Section Averages" icon={BarChart3} color="cyan"
              info="Average scores by assessment type">
              <SectionBarChart data={data.sectionAverages} />
            </ChartCard>
          </motion.div>

          {/* Score Distribution Pie */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ChartCard title="Score Distribution" icon={PieIcon} color="amber"
              info="Breakdown of performance bands">
              <ScoreDistributionPie data={data.scoreDistribution} />
            </ChartCard>
          </motion.div>

          {/* Personality Radar */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="lg:col-span-2">
            <ChartCard title="Big Five Personality Profile (OCEAN)" icon={Brain} color="purple"
              info="Based on psychometric assessment responses">
              <div className="grid lg:grid-cols-2 gap-6 items-center">
                <PersonalityRadarChart data={data.personalityData} />
                <div className="space-y-3">
                  {data.personalityData?.map(({ trait, value }) => (
                    <div key={trait}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="text-sm font-semibold dark:text-white light:text-slate-900">{trait}</span>
                          <p className="text-xs text-slate-500">{TRAIT_DESCRIPTIONS[trait]}</p>
                        </div>
                        <span className={`text-sm font-bold font-mono ${
                          value >= 70 ? 'text-green-500' : value >= 50 ? 'text-brand-500' : 'text-amber-500'
                        }`}>{value}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-brand-500 rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${value}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
