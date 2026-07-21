/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  PieChart as PieIcon,
  Flame,
  Calendar,
} from 'lucide-react';
import { Task, Habit, FinanceTransaction, StudySession } from '../types';

interface AnalyticsViewProps {
  tasks: Task[];
  habits: Habit[];
  transactions: FinanceTransaction[];
  sessions: StudySession[];
  theme: 'dark' | 'light';
}

export default function AnalyticsView({
  tasks,
  habits,
  transactions,
  sessions,
  theme,
}: AnalyticsViewProps) {
  // 1. Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalDailyHabits = habits.filter((h) => h.frequency === 'daily').length;
  const avgHabitStreak = habits.length > 0 ? Math.round(habits.reduce((acc, h) => acc + h.streak, 0) / habits.length) : 0;

  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

  const studyMinutes = Math.round(sessions.reduce((acc, s) => acc + s.durationMs / 60000, 0));

  // 2. Mock Chart data for handcrafted SVGs (July 2026 Focus hours Distribution)
  const studyDays = [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 90 },
    { day: 'Wed', value: 60 },
    { day: 'Thu', value: 120 },
    { day: 'Fri', value: 30 },
    { day: 'Sat', value: 75 },
    { day: 'Sun', value: studyMinutes || 40 },
  ];

  const maxVal = Math.max(...studyDays.map((d) => d.value), 1);

  // Spend categories
  const spendCategories = [
    { name: 'Food', value: transactions.filter(t => t.category === 'food').reduce((acc, t) => acc + t.amount, 0) || 120 },
    { name: 'Tech', value: transactions.filter(t => t.category === 'tech').reduce((acc, t) => acc + t.amount, 0) || 85 },
    { name: 'Housing', value: transactions.filter(t => t.category === 'housing').reduce((acc, t) => acc + t.amount, 0) || 600 },
    { name: 'Misc', value: 45 },
  ];

  const maxSpend = Math.max(...spendCategories.map((c) => c.value), 1);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="text-left">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Analytics Engine
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Review diagnostic reports mapping academic performance, habit consistency, and cash flows.
        </p>
      </div>

      {/* Ratios Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 shrink-0">
            <CheckCircle size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Task Completion</h4>
            <p className="text-xl font-black mt-1">{taskCompletionRate}%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 shrink-0">
            <Flame size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Habit Consistency</h4>
            <p className="text-xl font-black mt-1">{avgHabitStreak} d streak</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-amber-500/5 text-amber-400 border border-amber-500/10 shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Study Logged</h4>
            <p className="text-xl font-black mt-1">{studyMinutes} mins</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-purple-500/5 text-purple-400 border border-purple-500/10 shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Savings Ratio</h4>
            <p className="text-xl font-black mt-1">
              {totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Handcrafted Visual SVG Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Focus */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Weekly Focus Hours (mins)</h3>
          </div>

          <div className="flex items-end justify-between h-48 pt-6 font-mono text-[9px] font-bold text-zinc-500">
            {studyDays.map((d) => {
              const heightPercent = Math.max(10, (d.value / maxVal) * 100);
              return (
                <div key={d.day} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.value}m
                  </span>
                  <div className="w-6 sm:w-8 bg-indigo-600/10 hover:bg-indigo-600/30 border border-indigo-500/20 rounded-t-lg transition-all relative overflow-hidden" style={{ height: `${heightPercent}px` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-indigo-600 h-2/3 rounded-t-sm" />
                  </div>
                  <span>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses categories chart */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Categorical Expense Breakdown ($)</h3>
          </div>

          <div className="space-y-4 pt-3 text-xs">
            {spendCategories.map((cat) => {
              const barPercent = Math.max(5, (cat.value / maxSpend) * 100);
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between font-bold text-[10px] uppercase tracking-wider">
                    <span className="text-zinc-400">{cat.name}</span>
                    <span className="text-indigo-400">${cat.value.toFixed(0)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Log Feed ticker */}
      <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
        <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Activity size={16} className="text-indigo-400" /> Executive Timeline Log
          </h3>
          <span className="text-[10px] font-mono text-zinc-500 font-bold bg-zinc-500/5 px-2.5 py-0.5 rounded border border-zinc-850">
            Realtime Ticker
          </span>
        </div>

        <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar font-mono text-xs text-zinc-400">
          <div className="p-3 bg-zinc-950/20 rounded-xl border border-zinc-850 flex items-center justify-between gap-3">
            <span className="text-indigo-400 font-bold">11:14:02 UTC</span>
            <span className="flex-1 text-left truncate text-zinc-300">Synchronized study sessions with the core server proxy.</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-500">System</span>
          </div>
          <div className="p-3 bg-zinc-950/20 rounded-xl border border-zinc-850 flex items-center justify-between gap-3">
            <span className="text-indigo-400 font-bold">11:02:18 UTC</span>
            <span className="flex-1 text-left truncate text-zinc-300">Hydrated user configurations from browser LocalStorage database.</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-500">User</span>
          </div>
          <div className="p-3 bg-zinc-950/20 rounded-xl border border-zinc-850 flex items-center justify-between gap-3">
            <span className="text-indigo-400 font-bold">10:50:00 UTC</span>
            <span className="flex-1 text-left truncate text-zinc-300">Injected 5 custom tasks using XML commands block parse loop.</span>
            <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">AI Core</span>
          </div>
        </div>
      </div>
    </div>
  );
}
