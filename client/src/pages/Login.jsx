import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles, LogIn, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authorization failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden dark:bg-surface-950 light:bg-slate-50 transition-colors duration-500">
      <div className="bg-mesh" />
      
      {/* Theme Toggle Button */}
      <button onClick={toggleTheme} 
        className="fixed top-6 right-6 p-3 rounded-2xl glass hover:scale-110 transition-all duration-300 z-50">
        {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-[2rem] bg-brand-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-500/40 overflow-hidden">
            <img src="/favicon.png" alt="AI Mentor Logo" className="w-full h-full object-cover scale-110" />
          </div>
          <h1 className="text-4xl font-display font-bold dark:text-white light:text-slate-900 tracking-tight">Access Intel</h1>
          <p className="text-slate-500 mt-2 font-medium">Welcome back to your neural mentor</p>
        </div>

        <div className="glass-card">
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm mb-6">
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Identity (Email)</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="agent@vault.com" required className="input-premium" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Secure Key</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" required className="input-premium pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-500 transition-colors">
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-premium w-full mt-4">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={20} /> Authorize Access</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t dark:border-white/5 light:border-slate-100 text-center">
            <p className="text-sm dark:text-slate-400 light:text-slate-600">
              New identity required?{' '}
              <Link to="/register" className="text-brand-500 hover:text-brand-400 font-bold transition-colors">
                Initialize ID
              </Link>
            </p>
          </div>
        </div>

        {/* Guest access hint */}
        <p className="text-center text-[10px] uppercase tracking-widest text-slate-500 mt-8 font-bold opacity-60">
          Neural encryption enabled • SEC-256 compliant
        </p>
      </motion.div>
    </div>
  );
}
