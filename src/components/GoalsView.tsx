/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  Flag,
  Sparkles,
  Award,
} from 'lucide-react';
import { Goal } from '../types';
import { getRelativeDateString } from '../utils';

interface GoalsViewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  theme: 'dark' | 'light';
}

export default function GoalsView({ goals, setGoals, theme }: GoalsViewProps) {
  const [showForm, setShowForm] = useState(false);

  // Goal Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'short-term' | 'long-term'>('short-term');
  const [targetDate, setTargetDate] = useState('2026-12-31');

  // Milestones local building state during goal creation
  const [milestonesText, setMilestonesText] = useState('');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Parse milestone text list separated by commas or newlines
    const parsedMilestones = milestonesText
      .split(/[\n,]+/)
      .map((str) => str.trim())
      .filter((str) => str.length > 0)
      .map((str, idx) => ({
        id: `ms_${Date.now()}_${idx}`,
        title: str,
        isCompleted: false,
      }));

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title,
      description,
      category,
      targetDate,
      type: (category === 'long-term' || category === 'short-term') ? category : 'short-term',
      deadline: targetDate,
      progress: 0,
      milestones: parsedMilestones,
      createdAt: new Date().toISOString(),
    };

    setGoals([...goals, newGoal]);

    // Reset Form
    setTitle('');
    setDescription('');
    setCategory('short-term');
    setTargetDate('2026-12-31');
    setMilestonesText('');
    setShowForm(false);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(
      goals.map((g) => {
        if (g.id === goalId) {
          const nextMilestones = g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
          );
          const completedCount = nextMilestones.filter((m) => m.isCompleted).length;
          const nextProgress =
            nextMilestones.length > 0
              ? Math.round((completedCount / nextMilestones.length) * 100)
              : 0;

          return {
            ...g,
            milestones: nextMilestones,
            progress: nextProgress,
          };
        }
        return g;
      })
    );
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const getDaysRemaining = (targetStr: string) => {
    const target = new Date(targetStr);
    const today = new Date('2026-07-19'); // Constant baseline date
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculations
  const completedGoalsCount = goals.filter((g) => g.progress === 100).length;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Goal Tracker
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Establish strategic milestones, track key results, and realize long-term visions.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Establish Goal
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 shrink-0">
            <Award size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Visions Met</h4>
            <p className="text-2xl font-black mt-1">
              {completedGoalsCount} <span className="text-xs text-zinc-500">Goals Done</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Milestones Tracked</h4>
            <p className="text-2xl font-black mt-1">
              {goals.reduce((acc, g) => acc + g.milestones.length, 0)} Active
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-amber-500/5 text-amber-400 border border-amber-500/10 shrink-0">
            <Flag size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pending Execution</h4>
            <p className="text-2xl font-black mt-1">
              {goals.filter((g) => g.progress < 100).length} Ongoing
            </p>
          </div>
        </div>
      </div>

      {/* Goals Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Short Term Goals */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/10 dark:border-zinc-800/30">
            <Sparkles size={16} className="text-indigo-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Short-Term Milestones</h3>
          </div>

          {goals
            .filter((g) => g.category === 'short-term')
            .map((goal) => {
              const daysLeft = getDaysRemaining(goal.targetDate);
              return (
                <div
                  key={goal.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-black text-sm tracking-tight">{goal.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{goal.description}</p>
                    </div>

                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-500 transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Progress Line */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-zinc-500">Progress</span>
                      <span className="font-bold text-indigo-400">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones list checklist */}
                  {goal.milestones.length > 0 && (
                    <div className="mt-5 space-y-2 border-t border-zinc-800/10 dark:border-zinc-800/30 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Milestones List</span>
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar">
                        {goal.milestones.map((ms) => (
                          <div
                            key={ms.id}
                            onClick={() => toggleMilestone(goal.id, ms.id)}
                            className="flex items-center gap-2.5 cursor-pointer hover:bg-zinc-500/2 p-1.5 rounded-lg text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={ms.isCompleted}
                              onChange={() => {}} // Swallowed, handled by div click
                              className="rounded border-zinc-750 text-indigo-600 cursor-pointer"
                            />
                            <span className={ms.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-300'}>
                              {ms.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target date tags */}
                  <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-800/10 dark:border-zinc-800/30 pt-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> Target: {goal.targetDate}
                    </span>
                    <span className={`font-bold ${daysLeft > 0 ? 'text-amber-400' : 'text-rose-500'}`}>
                      {daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline exceeded'}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Long Term Goals */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/10 dark:border-zinc-800/30">
            <Award size={16} className="text-indigo-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Long-Term Core Visions</h3>
          </div>

          {goals
            .filter((g) => g.category === 'long-term')
            .map((goal) => {
              const daysLeft = getDaysRemaining(goal.targetDate);
              return (
                <div
                  key={goal.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-black text-sm tracking-tight">{goal.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{goal.description}</p>
                    </div>

                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-500 transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Progress line */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-zinc-500">Progress</span>
                      <span className="font-bold text-indigo-400">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones check list */}
                  {goal.milestones.length > 0 && (
                    <div className="mt-5 space-y-2 border-t border-zinc-800/10 dark:border-zinc-800/30 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Milestones List</span>
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar">
                        {goal.milestones.map((ms) => (
                          <div
                            key={ms.id}
                            onClick={() => toggleMilestone(goal.id, ms.id)}
                            className="flex items-center gap-2.5 cursor-pointer hover:bg-zinc-500/2 p-1.5 rounded-lg text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={ms.isCompleted}
                              onChange={() => {}} // Swallowed, handled by click
                              className="rounded border-zinc-750 text-indigo-600 cursor-pointer"
                            />
                            <span className={ms.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-300'}>
                              {ms.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target date tag */}
                  <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-800/10 dark:border-zinc-800/30 pt-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> Target: {goal.targetDate}
                    </span>
                    <span className="font-bold text-amber-400">
                      {daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline passed'}
                    </span>
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
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Establish Strategic Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Goal Vision Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Master Linear Regression Proofs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Goal Description</label>
                <input
                  type="text"
                  placeholder="Explain the overarching purpose of this milestone..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Time Scope</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-750'
                    }`}
                  >
                    <option value="short-term">Short-Term (Quarterly)</option>
                    <option value="long-term">Long-Term (Yearly)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Target Deadline</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-200' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Milestones (separate with commas or newlines)</label>
                <textarea
                  placeholder="Review formulas, Solve problem set, Submit project draft..."
                  value={milestonesText}
                  onChange={(e) => setMilestonesText(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 h-20 resize-none ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}
                />
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
                  Publish Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
