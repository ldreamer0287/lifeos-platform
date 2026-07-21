/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  User,
  Sliders,
  Sparkles,
  Lock,
  Radio,
  Save,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Database,
  Camera,
  Upload,
  Image as ImageIcon,
  Mail,
  Briefcase,
  UserCheck,
} from 'lucide-react';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  userName: string;
  setUserName: (name: string) => void;
  userTitle: string;
  setUserTitle: (title: string) => void;
  user?: {
    name: string;
    title: string;
    email?: string;
    isAdmin?: boolean;
    avatarUrl?: string;
    bio?: string;
    department?: string;
    username?: string;
  };
  onUpdateProfile?: (updatedFields: Partial<{
    name: string;
    title: string;
    email: string;
    avatarUrl: string;
    bio: string;
    department: string;
    username: string;
  }>) => void;
}

export default function SettingsView({
  theme,
  setTheme,
  userName,
  setUserName,
  userTitle,
  setUserTitle,
  user,
  onUpdateProfile,
}: SettingsViewProps) {
  const [name, setName] = useState(user?.name || userName);
  const [title, setTitle] = useState(user?.title || userTitle);
  const [email, setEmail] = useState(user?.email || 'operator@lifeos.io');
  const [username, setUsername] = useState(user?.username || 'operator');
  const [department, setDepartment] = useState(user?.department || 'LifeOS Core');
  const [bio, setBio] = useState(user?.bio || user?.title || 'Personal Operating System Admin');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  const [hotkey, setHotkey] = useState('Ctrl + K');
  const [focusSound, setFocusSound] = useState('ambient');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync Toggles
  const [notionSync, setNotionSync] = useState(true);
  const [linearSync, setLinearSync] = useState(false);
  const [spotifySync, setSpotifySync] = useState(false);

  // Feedback States
  const [feedbackCategory, setFeedbackCategory] = useState('Google Workspace');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarPresets = [
    { name: 'Creative Tech', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { name: 'Developer Mode', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { name: 'Atmospheric Synth', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { name: 'Digital Minimalist', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { name: 'Astronaut Cyber', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setAvatarUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedbackMessage.trim()) return;
    const newFeedback = {
      id: `fdb_user_${Date.now()}`,
      user: userName || 'operator@lifeos.io',
      message: feedbackMessage.trim(),
      category: feedbackCategory,
      rating: feedbackRating,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'new'
    };

    try {
      const stored = localStorage.getItem('lifeos_feedbacks');
      const parsed = stored ? JSON.parse(stored) : [];
      const updated = [newFeedback, ...parsed];
      localStorage.setItem('lifeos_feedbacks', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setFeedbackMessage('');
    alert('Thank you for your feedback! It was dispatched to the Root Admin console.');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        name,
        title,
        email,
        username,
        department,
        bio,
        avatarUrl,
      });
    } else {
      setUserName(name);
      setUserTitle(title);
    }
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            System Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure user profiles, toggle API synchronizations, and personalize visual theme palettes.
          </p>
        </div>

        {showSavedToast && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-3.5 py-2 rounded-xl animate-fade-in flex items-center gap-1.5">
            <CheckCircle size={12} /> Config Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* User profile */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-5 flex items-center gap-2">
            <User size={16} className="text-indigo-400" />
            <h3 className="font-bold text-sm">Personal Profile Settings</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Col: Avatar Modification */}
            <div className="flex flex-col items-center gap-4 w-full md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800/10 dark:border-zinc-800/30 pb-5 md:pb-0 md:pr-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 self-start md:self-center">Profile Picture</span>
              
              {/* Dynamic Image Preview */}
              <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/10 shrink-0">
                <img
                  src={avatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                >
                  <Camera size={18} className="text-indigo-300" />
                  <span className="text-[9px] font-bold mt-1">Change Image</span>
                </button>
              </div>

              {/* Upload file button */}
              <div className="w-full text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Upload size={12} />
                  <span>Upload Image File</span>
                </button>
              </div>

              {/* Curated Presets list */}
              <div className="w-full space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Or Choose Preset</span>
                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                  {avatarPresets.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      title={preset.name}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all hover:scale-115 ${
                        avatarUrl === preset.url ? 'border-indigo-500 scale-110 shadow' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct image URL input field */}
              <div className="w-full">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Or Paste Image URL</label>
                <input
                  type="text"
                  value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      setAvatarUrl(e.target.value.trim());
                    }
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className={`w-full px-2.5 py-1.5 text-[10px] rounded-lg border mt-1 outline-none ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                  }`}
                />
              </div>
            </div>

            {/* Right Col: Identity Information forms */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <User size={10} className="text-zinc-500" />
                    <span>Display Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 outline-none focus:border-indigo-500 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-white border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Briefcase size={10} className="text-zinc-500" />
                    <span>Professional Title / Role</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 outline-none focus:border-indigo-500 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-white border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Mail size={10} className="text-zinc-500" />
                    <span>Primary Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 outline-none focus:border-indigo-500 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-white border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <UserCheck size={10} className="text-zinc-500" />
                    <span>Username / Handle</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 outline-none focus:border-indigo-500 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-white border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Database size={10} className="text-zinc-500" />
                    <span>Core Department / division</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 outline-none focus:border-indigo-500 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-white border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Biography / Core Motto</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    placeholder="Tell us a little bit about yourself..."
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 outline-none resize-none focus:border-indigo-500 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-700'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System configurations */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center gap-2">
            <Sliders size={16} className="text-indigo-400" />
            <h3 className="font-bold text-sm">Global System Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Theme selector */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">Visual Palette Theme</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-950 border-indigo-500 text-indigo-400 shadow shadow-indigo-500/5'
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                  }`}
                >
                  Dark Slate (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                    theme === 'light'
                      ? 'bg-white border-indigo-500 text-indigo-500 shadow shadow-indigo-500/5'
                      : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  Classic Light
                </button>
              </div>
            </div>

            {/* Hotkey configuration */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Command Palette Shortcut</label>
              <select
                value={hotkey}
                onChange={(e) => setHotkey(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border mt-2 outline-none ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-700'
                }`}
              >
                <option value="Ctrl + K">Ctrl + K (Default)</option>
                <option value="Ctrl + Shift + P">Ctrl + Shift + P</option>
                <option value="Alt + C">Alt + C</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Secrets Panels */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2">
              <Lock size={16} className="text-indigo-400" /> API Credentials Integrations
            </span>
            <span className="text-[10px] font-mono text-zinc-500 font-bold bg-zinc-500/5 px-2 py-0.5 rounded border border-zinc-800/30">
              Integrity Valid
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-zinc-800/10 dark:border-zinc-800/40 bg-zinc-950/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/5 text-indigo-400 border border-indigo-500/10">
                  <Database size={15} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-200">GEMINI_API_KEY</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Parsed from AI Studio secrets system.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded uppercase">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Third Party sync connectors */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center gap-2">
            <Radio size={16} className="text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-sm">Third-Party Synchronization Connectors</h3>
          </div>

          <div className="divide-y divide-zinc-800/10 dark:divide-zinc-800/30 space-y-4">
            <div className="flex items-center justify-between pt-3">
              <div>
                <h4 className="font-bold text-xs text-zinc-200">Notion Connection</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Bi-directionally sync notes databases.</p>
              </div>
              <button type="button" onClick={() => setNotionSync(!notionSync)} className="text-zinc-400">
                {notionSync ? <ToggleRight size={32} className="text-indigo-500" /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="font-bold text-xs text-zinc-200">Linear Syncing</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Map team tasks directly to your dashboard.</p>
              </div>
              <button type="button" onClick={() => setLinearSync(!linearSync)} className="text-zinc-400">
                {linearSync ? <ToggleRight size={32} className="text-indigo-500" /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="font-bold text-xs text-zinc-200">Spotify Playlists Link</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Focus using synchronized atmospheric tracks.</p>
              </div>
              <button type="button" onClick={() => setSpotifySync(!spotifySync)} className="text-zinc-400">
                {spotifySync ? <ToggleRight size={32} className="text-indigo-500" /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>
        </div>

        {/* User Support Feedback form */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center gap-2">
            <Radio size={16} className="text-indigo-400" />
            <h3 className="font-bold text-sm">Send Platform Feedback & Support Recommendations</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Feedback Category</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 outline-none ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-700'
                  }`}
                >
                  <option value="Google Workspace">Google Workspace</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Design & UI">Design & UI</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Star Rating ({feedbackRating}/5)</label>
                <div className="flex items-center gap-1.5 mt-2 text-xl text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="hover:scale-110 transition-all"
                    >
                      {star <= feedbackRating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Your Message</label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Suggest new integrations, report glitches, or request more mock document templates here..."
                rows={3}
                className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 outline-none resize-none ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-700'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitFeedback}
              className="px-4 py-2 bg-gradient-to-tr from-indigo-500 to-cyan-400 hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all shadow"
            >
              Submit Feedback Entry
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/15"
        >
          <Save size={14} /> Commit Changes
        </button>
      </form>
    </div>
  );
}
