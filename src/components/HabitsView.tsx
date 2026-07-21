/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Trash2,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  Flame,
} from 'lucide-react';
import { Habit } from '../types';
import { getRelativeDateString } from '../utils';

interface HabitsViewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  theme: 'dark' | 'light';
}

export default function HabitsView({ habits, setHabits, theme }: HabitsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Last 7 days helper list to build timeline columns
  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    return getRelativeDateString(-6 + idx);
  });

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
  };

  const toggleDayCompletion = (habitId: string, dateStr: string) => {
    setHabits(
      habits.map((h) => {
        if (h.id === habitId) {
          const isDone = h.history.includes(dateStr);
          let newHistory = [...h.history];
          let nextStreak = h.streak;

          if (isDone) {
            newHistory = newHistory.filter((d) => d !== dateStr);
            nextStreak = Math.max(0, h.streak - 1);
          } else {
            newHistory.push(dateStr);
            // Simple streak bump if marking completed today or yesterday
            if (dateStr === getRelativeDateString(0) || dateStr === getRelativeDateString(-1)) {
              nextStreak += 1;
            }
          }
          return { ...h, history: newHistory, streak: nextStreak };
        }
        return h;
      })
    );
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const newHabit: Habit = {
      id: `hab_${Date.now()}`,
      name: habitName,
      frequency,
      streak: 0,
      history: [],
      createdAt: getRelativeDateString(0),
    };

    setHabits([newHabit, ...habits]);
    setHabitName('');
    setFrequency('daily');
    setShowForm(false);
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  // Calculations
  const activeDailyHabits = habits.filter((h) => h.frequency === 'daily');
  const todayStr = getRelativeDateString(0);
  const completedTodayCount = activeDailyHabits.filter((h) => h.history.includes(todayStr)).length;
  const todayCompletionRate =
    activeDailyHabits.length > 0 ? Math.round((completedTodayCount / activeDailyHabits.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Habit Tracker
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Build consistency, logging streaks, and reviewing overall habits completion metrics.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Add Habit
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 shrink-0">
            <Flame size={20} className="animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Streak Leader</h4>
            <p className="text-2xl font-black mt-1">
              {habits.length > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0} <span className="text-xs text-zinc-500">days</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Today's Rate</h4>
            <p className="text-2xl font-black mt-1">
              {todayCompletionRate}% <span className="text-xs text-zinc-500">completed</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-amber-500/5 text-amber-400 border border-amber-500/10 shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Habits Catalog</h4>
            <p className="text-2xl font-black mt-1">{habits.length} Active</p>
          </div>
        </div>
      </div>

      {/* Main Grid View render */}
      <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl overflow-hidden bg-zinc-500/5 backdrop-blur-xl">
        <div className="p-4 border-b border-zinc-800/10 dark:border-zinc-800/40 bg-zinc-500/5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-sm">7-Day Completion Grid</h3>
          <span className="text-xs text-zinc-400 font-mono font-medium">Click columns to log completion historical dates</span>
        </div>

        <div className="divide-y divide-zinc-800/10 dark:divide-zinc-800/30">
          {habits.map((habit) => {
            return (
              <div
                key={habit.id}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all hover:bg-zinc-500/1"
              >
                {/* Left metadata */}
                <div className="text-left overflow-hidden min-w-[200px]">
                  <h4 className="font-bold text-sm truncate">{habit.name}</h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2 py-0.5 rounded-full">
                      {habit.frequency}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Streak: <span className="font-bold text-amber-400">🔥 {habit.streak} days</span>
                    </span>
                  </div>
                </div>

                {/* Right interactive day row */}
                <div className="flex items-center gap-3.5 flex-wrap justify-start md:justify-end">
                  {last7Days.map((day) => {
                    const isDone = habit.history.includes(day);
                    const isToday = day === todayStr;
                    return (
                      <div
                        key={day}
                        onClick={() => toggleDayCompletion(habit.id, day)}
                        className="flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
                          {getDayLabel(day)}
                        </span>
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20 scale-105'
                              : isToday
                              ? 'border-indigo-500 bg-indigo-500/5 text-indigo-400 ring-1 ring-indigo-500/10'
                              : 'border-zinc-800/40 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {isDone ? <CheckCircle2 size={15} /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />}
                        </div>
                      </div>
                    );
                  })}

                  <div className="w-px h-8 bg-zinc-800/50 mx-2 hidden md:block" />

                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 rounded-lg border border-zinc-800/10 dark:border-zinc-800/50 text-rose-500 hover:bg-rose-500/10 transition-all self-end md:self-auto"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creation Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Add Habit Core</h3>
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Habit Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Read 10 Pages of Philosophy"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  }`}
                >
                  <option value="daily">Daily Habit</option>
                  <option value="weekly">Weekly Habit</option>
                  <option value="monthly">Monthly Habit</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Confirm Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
