/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FileText,
  GraduationCap,
  Users,
  CheckCircle2,
  Target,
  PiggyBank,
  Bookmark,
  Folder,
  Bot,
  BarChart3,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  profile: UserProfile;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  profile,
  collapsed,
  setCollapsed,
  onLogout,
  isAdmin,
}: SidebarProps) {
  const menuItems = isAdmin
    ? [
        { id: 'admin-dashboard', name: 'Admin Telemetry', icon: BarChart3 },
        { id: 'settings', name: 'Settings', icon: Settings },
      ]
    : [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'tasks', name: 'Tasks', icon: CheckSquare },
        { id: 'calendar', name: 'Calendar', icon: Calendar },
        { id: 'notes', name: 'Notes', icon: FileText },
        { id: 'study', name: 'Study', icon: GraduationCap },
        { id: 'collaboration', name: 'LifeOS Connect', icon: Users, highlight: true },
        { id: 'habits', name: 'Habits', icon: CheckCircle2 },
        { id: 'goals', name: 'Goals', icon: Target },
        { id: 'finance', name: 'Finance', icon: PiggyBank },
        { id: 'bookmarks', name: 'Bookmarks', icon: Bookmark },
        { id: 'files', name: 'Files', icon: Folder },
        { id: 'ai', name: 'AI Assistant', icon: Bot, highlight: true },
        { id: 'analytics', name: 'Analytics', icon: BarChart3 },
        { id: 'settings', name: 'Settings', icon: Settings },
      ];

  return (
    <aside
      className={`relative h-[calc(100vh-2rem)] flex flex-col border transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      } ${
        theme === 'dark'
          ? 'bg-white/5 border-white/10 text-slate-100 backdrop-blur-2xl rounded-[32px] shadow-2xl'
          : 'bg-zinc-900/5 border-zinc-900/10 text-zinc-800 backdrop-blur-2xl rounded-[32px] shadow-2xl'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-900/10 dark:border-white/10">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-sm">L</span>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#02040a]" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              LifeOS
            </span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-xl border transition-all ${
            theme === 'dark'
              ? 'border-white/10 hover:bg-white/5 text-zinc-400 hover:text-zinc-100'
              : 'border-zinc-900/10 hover:bg-zinc-900/5 text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Profile Card */}
      {!collapsed ? (
        <div className={`p-3 mx-3 my-4 rounded-2xl border flex items-center gap-3 transition-all ${
          theme === 'dark'
            ? 'border-white/5 bg-white/5'
            : 'border-zinc-900/5 bg-zinc-900/5'
        }`}>
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            referrerPolicy="no-referrer"
            className={`w-9 h-9 rounded-full object-cover border ${
              theme === 'dark' ? 'border-white/10' : 'border-zinc-900/10'
            }`}
          />
          <div className="overflow-hidden">
            <h4 className="font-bold text-xs truncate">{profile.fullName}</h4>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{profile.email}</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center my-4">
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            referrerPolicy="no-referrer"
            className={`w-9 h-9 rounded-full object-cover border ${
              theme === 'dark' ? 'border-white/10' : 'border-zinc-900/10'
            }`}
          />
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20'
                  : theme === 'dark'
                  ? 'hover:bg-white/5 hover:text-white text-slate-400'
                  : 'hover:bg-zinc-900/5 hover:text-zinc-900 text-zinc-600'
              } ${item.highlight && !isActive ? 'text-indigo-400 font-bold' : ''}`}
            >
              <Icon size={18} className={item.highlight && !isActive ? 'animate-pulse text-indigo-400' : ''} />
              {!collapsed && (
                <span className="flex-1 text-left truncate flex items-center justify-between">
                  {item.name}
                  {item.highlight && (
                    <Sparkles size={12} className="text-indigo-400 ml-1.5" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Controls */}
      <div className="p-3 border-t border-zinc-900/10 dark:border-white/10 flex flex-col gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
            theme === 'dark'
              ? 'hover:bg-white/5 text-slate-400 hover:text-white'
              : 'hover:bg-zinc-900/5 text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {!collapsed && (
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              theme === 'dark'
                ? 'hover:bg-white/5 text-slate-400 hover:text-white'
                : 'hover:bg-zinc-900/5 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span className="text-rose-500 hover:text-rose-400 text-left">Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
