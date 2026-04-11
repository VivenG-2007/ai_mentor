import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PlayCircle, Clock, BarChart3, User, LogOut,
  Menu, X, Sparkles, Bell, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import AssistantHub from './AssistantHub';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/session', icon: PlayCircle, label: 'Live Session', pill: true },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-white/5 dark:border-white/5 light:border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shadow-lg shadow-brand-500/10 overflow-hidden">
          <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-none dark:text-white light:text-slate-900">AI Mentor</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1.5">Personal Intel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, pill }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-link group ${isActive ? 'active' : ''}`}>
            <Icon size={22} className="flex-shrink-0" />
            <span className="text-sm tracking-tight">{label}</span>
            {pill && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase text-green-600 dark:text-green-400 opacity-60">Live</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle & User */}
      <div className="p-4 space-y-4 border-t border-white/5 dark:border-white/5 light:border-slate-100">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl glass transition-all duration-300 dark:hover:bg-white/10 light:hover:bg-slate-100">
          {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
          <span className="text-sm font-semibold dark:text-slate-300 light:text-slate-700">
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </span>
        </button>

        <div className="flex items-center gap-3 p-3 rounded-2xl dark:hover:bg-white/5 light:hover:bg-slate-50 transition-colors group relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl premium-gradient flex items-center justify-center text-white font-bold text-sm shadow-xl overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold dark:text-white light:text-slate-900 truncate">{user?.name}</p>
            <p className="text-[10px] dark:text-slate-500 light:text-slate-400 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden dark:bg-surface-950 light:bg-slate-50 transition-colors duration-500">
      <div className="bg-mesh" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 glass border-r dark:border-white/5 light:border-slate-200 flex-shrink-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-[320px] dark:bg-surface-950 light:bg-white border-r dark:border-white/5 light:border-slate-200 z-50 lg:hidden shadow-2xl">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="bg-mesh-animated" />
        
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 dark:bg-surface-950/80 light:bg-white/80 backdrop-blur-xl border-b dark:border-white/5 light:border-slate-200 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-xl dark:bg-white/5 light:bg-slate-100 dark:text-slate-300 light:text-slate-600">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold dark:text-white light:text-slate-900 tracking-tight">AI Mentor</span>
          </div>
          <button className="p-2.5 rounded-xl dark:bg-white/5 light:bg-slate-100 dark:text-slate-300 light:text-slate-600">
            <Bell size={20} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full relative px-4 py-6 md:p-8 lg:p-10"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* AI Assistant Floating Component */}
        <AssistantHub />
      </div>
    </div>
  );
}
