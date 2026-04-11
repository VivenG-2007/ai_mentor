import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Briefcase, Target, Bell, Palette, Lock, Save,
  CheckCircle2, AlertCircle, Camera, Shield, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-brand-400">
          <Icon size={17} />
        </div>
        <h3 className="font-display font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
        ${type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400'
          : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </motion.div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    profession: user?.profession || '',
    goals: (user?.goals || []).join(', '),
    avatar: user?.avatar || '',
    theme: user?.theme || 'dark',
    notifications: { email: user?.notifications?.email ?? true, push: user?.notifications?.push ?? true },
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updates = {
        name: profile.name,
        profession: profile.profession,
        goals: profile.goals.split(',').map(g => g.trim()).filter(Boolean),
        avatar: profile.avatar,
        theme: profile.theme,
        notifications: profile.notifications,
      };
      const { data } = await api.put('/auth/me', updates);
      updateUser(data.user);
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/password', { currentPassword: passwords.current, newPassword: passwords.new });
      setPasswords({ current: '', new: '', confirm: '' });
      showToast('Password changed successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(p => ({ ...p, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    setProfile(p => ({ ...p, avatar: '' }));
    showToast('Photo removed. Click Save to finalize.');
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title">Profile & Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="card flex items-center gap-5">
        <div 
          className="relative cursor-pointer group"
          onClick={() => document.getElementById('avatar-upload').click()}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-display font-bold text-3xl overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
            {profile.avatar ? (
              <img src={profile.avatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-surface-800 border border-white/10 flex items-center justify-center text-slate-400">
            <Camera size={12} />
          </div>
          <input 
            type="file" id="avatar-upload" className="hidden" 
            accept="image/*" onChange={handleFileChange} 
          />
        </div>
        <div className="flex-1">
          <h2 className="font-display font-bold text-white text-lg">{user?.name}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="score-badge bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Shield size={10} />
              {user?.role === 'admin' ? 'Admin' : 'Learner'}
            </span>
            {profile.avatar && (
              <button 
                onClick={handleDeletePhoto}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={12} />
                Delete Photo
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Profile Info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section title="Personal Information" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label mb-1.5 block">
                <span className="flex items-center gap-1.5"><User size={12} />Full Name</span>
              </label>
              <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="input-field" placeholder="Your full name" />
            </div>
            <div className="sm:col-span-2">
              <label className="label mb-1.5 block">
                <span className="flex items-center gap-1.5"><Mail size={12} />Email</span>
              </label>
              <input value={user?.email} disabled
                className="input-field opacity-50 cursor-not-allowed" />
            </div>
            <div className="sm:col-span-2">
              <label className="label mb-1.5 block">
                <span className="flex items-center gap-1.5"><Briefcase size={12} />Profession</span>
              </label>
              <input value={profile.profession} onChange={e => setProfile(p => ({ ...p, profession: e.target.value }))}
                className="input-field" placeholder="e.g. Software Engineer, Student, Manager" />
            </div>
            <div className="sm:col-span-2">
              <label className="label mb-1.5 block">
                <span className="flex items-center gap-1.5"><Camera size={12} />Avatar URL</span>
              </label>
              <input value={profile.avatar} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))}
                className="input-field" placeholder="https://example.com/photo.jpg" />
            </div>
            <div className="sm:col-span-2">
              <label className="label mb-1.5 block">
                <span className="flex items-center gap-1.5"><Target size={12} />Goals (comma-separated)</span>
              </label>
              <input value={profile.goals} onChange={e => setProfile(p => ({ ...p, goals: e.target.value }))}
                className="input-field" placeholder="Improve communication, Leadership skills, ..." />
            </div>
          </div>

          <motion.button onClick={handleSaveProfile} disabled={savingProfile}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {savingProfile ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
            ) : (
              <><Save size={16} />Save Changes</>
            )}
          </motion.button>
        </Section>
      </motion.div>

      {/* Preferences */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Section title="Preferences" icon={Palette}>
          <div className="space-y-4">
            <div>
              <label className="label mb-2 block">Theme</label>
              <div className="flex gap-3">
                {['dark', 'light'].map(t => (
                  <button key={t} onClick={() => setProfile(p => ({ ...p, theme: t }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                      ${profile.theme === t
                        ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                        : 'bg-surface-800/50 border-white/5 text-slate-400 hover:text-white'}`}>
                    <span>{t === 'dark' ? '🌙' : '☀️'}</span>
                    {t.charAt(0).toUpperCase() + t.slice(1)} Mode
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label mb-2 block">
                <span className="flex items-center gap-1.5"><Bell size={12} />Notifications</span>
              </label>
              <div className="space-y-2">
                {[
                  { key: 'email', label: 'Email notifications', desc: 'Session reminders and reports via email' },
                  { key: 'push', label: 'Push notifications', desc: 'Browser push notifications' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/40 cursor-pointer hover:bg-surface-800/60 transition-colors">
                    <div>
                      <p className="text-sm text-white font-medium">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <div
                      onClick={() => setProfile(p => ({ ...p, notifications: { ...p.notifications, [key]: !p.notifications[key] } }))}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0
                        ${profile.notifications[key] ? 'bg-brand-500' : 'bg-surface-700'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform
                        ${profile.notifications[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <motion.button onClick={handleSaveProfile} disabled={savingProfile}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {savingProfile ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
            ) : (
              <><Save size={16} />Save Preferences</>
            )}
          </motion.button>
        </Section>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Section title="Security" icon={Lock}>
          <div className="space-y-3">
            {[
              { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
              { key: 'new', label: 'New Password', placeholder: 'Min. 6 characters' },
              { key: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="label mb-1.5 block">{label}</label>
                <input type="password" value={passwords[key]}
                  onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder} className="input-field" />
              </div>
            ))}
          </div>

          <motion.button onClick={handleChangePassword} disabled={savingPassword || !passwords.current || !passwords.new}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {savingPassword ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</>
            ) : (
              <><Lock size={16} />Update Password</>
            )}
          </motion.button>
        </Section>
      </motion.div>
    </div>
  );
}
