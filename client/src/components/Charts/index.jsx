import React from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e'];

const getChartTheme = (theme) => {
  const isDark = theme === 'dark';
  return {
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text: isDark ? '#94a3b8' : '#475569',
    tooltip: {
      content: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        padding: '10px 12px',
        boxShadow: isDark ? 'none' : '0 10px 15px -3px rgba(0,0,0,0.1)'
      },
      item: {
        color: isDark ? '#f1f5f9' : '#0f172a',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '2px 0'
      },
      label: {
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: '10px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '4px',
        display: 'block'
      }
    }
  };
};

// Weekly Performance Line Chart
export function WeeklyPerformanceChart({ data }) {
  const { theme } = useTheme();
  const t = getChartTheme(theme);
  
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
        <XAxis dataKey="week" tick={{ fill: t.text, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: t.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={t.tooltip.content} itemStyle={t.tooltip.item} labelStyle={t.tooltip.label} />
        <Legend wrapperStyle={{ color: t.text, fontSize: 12, paddingTop: '10px' }} />
        <Line type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Overall" />
        <Line type="monotone" dataKey="english" stroke="#06b6d4" strokeWidth={2} dot={false} name="English" strokeDasharray="4 2" />
        <Line type="monotone" dataKey="subjective" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Subjective" strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Section Scores Bar Chart
export function SectionBarChart({ data }) {
  const { theme } = useTheme();
  const t = getChartTheme(theme);

  const chartData = [
    { name: 'Subjective', score: data?.subjective || 0 },
    { name: 'English', score: data?.english || 0 },
    { name: 'Psychometric', score: data?.psychometric || 0 },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
        <XAxis dataKey="name" tick={{ fill: t.text, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: t.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip 
          contentStyle={t.tooltip.content} 
          itemStyle={t.tooltip.item} 
          labelStyle={t.tooltip.label} 
          cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} 
        />
        <Bar dataKey="score" name="Score" radius={[6, 6, 0, 0]}>
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Personality Radar Chart
export function PersonalityRadarChart({ data }) {
  const { theme } = useTheme();
  const t = getChartTheme(theme);

  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke={t.grid} />
        <PolarAngleAxis dataKey="trait" tick={{ fill: t.text, fontSize: 11 }} />
        <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
        <Tooltip 
          contentStyle={t.tooltip.content} 
          itemStyle={t.tooltip.item} 
          labelStyle={t.tooltip.label} 
          formatter={(v) => [`${v}%`, 'Score']} 
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Score Distribution Pie Chart
export function ScoreDistributionPie({ data }) {
  const { theme } = useTheme();
  const t = getChartTheme(theme);

  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
          paddingAngle={4} dataKey="value" nameKey="name">
          {data.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip 
          contentStyle={t.tooltip.content} 
          itemStyle={t.tooltip.item} 
          labelStyle={t.tooltip.label} 
          formatter={(v, n) => [v + ' sessions', n]} 
        />
        <Legend wrapperStyle={{ color: t.text, fontSize: 11 }} iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Mini sparkline
export function MiniSparkline({ data, color = '#6366f1' }) {
  if (!data?.length) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div className="h-48 flex items-center justify-center text-slate-500 text-sm italic">
      No data available yet
    </div>
  );
}
