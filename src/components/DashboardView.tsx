/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  Play,
  Pause,
  RotateCcw,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
} from 'lucide-react';
import { Task, CalendarEvent, Habit, Goal, Note, StudySubject } from '../types';
import { getRelativeDateString, formatCurrency } from '../utils';

interface DashboardViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  events: CalendarEvent[];
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  goals: Goal[];
  subjects: StudySubject[];
  quickNote: string;
  setQuickNote: (note: string) => void;
  onAddQuickNote: () => void;
  theme: 'dark' | 'light';
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({
  tasks,
  setTasks,
  events,
  habits,
  setHabits,
  goals,
  subjects,
  quickNote,
  setQuickNote,
  onAddQuickNote,
  theme,
  setActiveTab,
}: DashboardViewProps) {
  // Real-time Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Pomodoro State
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSeconds, setPomoSeconds] = useState(0);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: any = null;
    if (pomoActive) {
      interval = setInterval(() => {
        if (pomoSeconds > 0) {
          setPomoSeconds(pomoSeconds - 1);
        } else if (pomoSeconds === 0) {
          if (pomoMinutes === 0) {
            // Timer expired
            if (pomoMode === 'work') {
              setPomoMode('break');
              setPomoMinutes(5);
            } else {
              setPomoMode('work');
              setPomoMinutes(25);
            }
            setPomoActive(false);
            // Non-blocking browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('LifeOS Pomodoro', {
                body: pomoMode === 'work' ? 'Time for a break!' : 'Back to focus!',
              });
            }
          } else {
            setPomoMinutes(pomoMinutes - 1);
            setPomoSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoSeconds, pomoMinutes, pomoMode]);

  const resetPomo = () => {
    setPomoActive(false);
    setPomoMode('work');
    setPomoMinutes(25);
    setPomoSeconds(0);
  };

  // Weather Simulation
  const [weather] = useState({
    temp: 72,
    city: 'San Francisco',
    condition: 'Sunny Intervals',
    high: 76,
    low: 58,
  });

  // Widget Order State (Reordering Bento Layout)
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    'pomo_weather',
    'today_tasks',
    'schedule_calendar',
    'study_habits',
    'goals_notes',
  ]);
  const [customizeMode, setCustomizeMode] = useState(false);

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...widgetOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      setWidgetOrder(newOrder);
    }
  };

  // Derived today items
  const todayStr = getRelativeDateString(0);
  const todayTasks = tasks.filter((t) => t.deadline === todayStr && !t.isCompleted);
  const todayEvents = events.filter((e) => e.start.startsWith(todayStr));

  // Toggle task complete inline
  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  // Toggle habit completed for today
  const toggleHabit = (id: string) => {
    setHabits(
      habits.map((h) => {
        if (h.id === id) {
          const alreadyDone = h.history.includes(todayStr);
          let newHistory = [...h.history];
          let newStreak = h.streak;
          if (alreadyDone) {
            newHistory = newHistory.filter((d) => d !== todayStr);
            newStreak = Math.max(0, h.streak - 1);
          } else {
            newHistory.push(todayStr);
            newStreak += 1;
          }
          return { ...h, history: newHistory, streak: newStreak };
        }
        return h;
      })
    );
  };

  // Render Widget helpers
  const renderWidget = (widgetId: string, idx: number) => {
    const isDark = theme === 'dark';

    const widgetFrame = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
      <div
        key={widgetId}
        className="relative flex flex-col p-5 transition-all duration-300 glass-widget"
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="text-indigo-500">{icon}</span>
            <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
          </div>
          {customizeMode && (
            <div className="flex items-center gap-1">
              <button
                disabled={idx === 0}
                onClick={() => moveWidget(idx, 'up')}
                className="p-1 rounded hover:bg-zinc-500/10 text-zinc-400 hover:text-indigo-400 disabled:opacity-30"
              >
                <ArrowUp size={13} />
              </button>
              <button
                disabled={idx === widgetOrder.length - 1}
                onClick={() => moveWidget(idx, 'down')}
                className="p-1 rounded hover:bg-zinc-500/10 text-zinc-400 hover:text-indigo-400 disabled:opacity-30"
              >
                <ArrowDown size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col">{content}</div>
      </div>
    );

    switch (widgetId) {
      case 'pomo_weather':
        return (
          <div key={widgetId} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pomodoro */}
            <div
              className="p-5 flex flex-col items-center justify-center transition-all glass-widget"
            >
              <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest font-bold text-indigo-400">
                <Clock size={12} />
                <span>Pomodoro: {pomoMode}</span>
              </div>
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="stroke-zinc-850 fill-transparent"
                    strokeWidth="5"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="stroke-indigo-500 fill-transparent transition-all duration-1000"
                    strokeWidth="5"
                    strokeDasharray={351.8}
                    strokeDashoffset={
                      351.8 -
                      (351.8 * (pomoMinutes * 60 + pomoSeconds)) /
                        (pomoMode === 'work' ? 25 * 60 : 5 * 60)
                    }
                  />
                </svg>
                <span className="text-3xl font-bold font-mono">
                  {String(pomoMinutes).padStart(2, '0')}:{String(pomoSeconds).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setPomoActive(!pomoActive)}
                  className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                >
                  {pomoActive ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={resetPomo}
                  className={`p-2 rounded-full border transition-all ${
                    isDark
                      ? 'border-white/10 hover:bg-white/5 text-zinc-400'
                      : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Weather */}
            <div
              className="p-5 flex flex-col justify-between transition-all glass-widget"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-400 uppercase tracking-widest">Weather</h4>
                  <p className="font-semibold text-lg mt-1">{weather.city}</p>
                </div>
                <CloudSun size={32} className="text-indigo-400 shrink-0" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-black">{weather.temp}°F</span>
                <span className="text-xs text-zinc-400 font-medium">{weather.condition}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500 font-mono">
                <span>H: {weather.high}°</span>
                <span>L: {weather.low}°</span>
              </div>
            </div>
          </div>
        );

      case 'today_tasks':
        return widgetFrame(
          "Today's Tasks",
          <CheckCircle2 size={16} />,
          <div className="flex-1 flex flex-col gap-3">
            {todayTasks.length > 0 ? (
              todayTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isDark
                      ? 'bg-zinc-950/20 border-zinc-800/40 hover:border-zinc-800'
                      : 'bg-zinc-50/50 border-zinc-200/40 hover:border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => toggleTask(task.id)}
                      className="rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[180px] sm:max-w-[280px]">
                        {task.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 capitalize">{task.category}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                      task.priority === 'urgent'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : task.priority === 'high'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-zinc-500/15 text-zinc-400'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-zinc-400 text-xs text-center">
                <CheckCircle2 size={24} className="stroke-1 text-zinc-500 mb-2" />
                <p className="font-medium">All tasks cleared for today!</p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="mt-2 text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Create tasks <ArrowRight size={10} />
                </button>
              </div>
            )}
          </div>
        );

      case 'schedule_calendar':
        return widgetFrame(
          "Today's Schedule",
          <CalendarIcon size={16} />,
          <div className="flex-1 flex flex-col gap-3">
            {todayEvents.length > 0 ? (
              todayEvents.map((event) => {
                const startTime = event.start.split('T')[1]?.substring(0, 5) || 'All Day';
                const endTime = event.end.split('T')[1]?.substring(0, 5) || '';
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all ${
                      isDark
                        ? 'bg-zinc-950/20 border-zinc-800/40'
                        : 'bg-zinc-50/50 border-zinc-200/40'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center text-xs font-mono font-bold text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-lg">
                      <span>{startTime}</span>
                      {endTime && <span className="text-[10px] text-zinc-500">{endTime}</span>}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold truncate">{event.title}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{event.description}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-zinc-400 text-xs text-center">
                <CalendarIcon size={24} className="stroke-1 text-zinc-500 mb-2" />
                <p className="font-medium">No events scheduled today.</p>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="mt-2 text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Add Event <ArrowRight size={10} />
                </button>
              </div>
            )}
          </div>
        );

      case 'study_habits':
        return widgetFrame(
          'Study & Habits Progress',
          <BookOpen size={16} />,
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Habits list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2.5">Habits</h4>
              <div className="space-y-2">
                {habits.slice(0, 3).map((habit) => {
                  const doneToday = habit.history.includes(todayStr);
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-zinc-800/10 dark:border-zinc-800/40 text-sm"
                    >
                      <span className="truncate max-w-[120px] font-medium">{habit.name}</span>
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                          doneToday
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/15'
                        }`}
                      >
                        {doneToday ? `Done 🔥 ${habit.streak}` : 'Log'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GPA Goal progress */}
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2.5">GPA Track</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent">
                    3.93
                  </span>
                  <span className="text-xs text-zinc-400">/ 4.0 GPA Goal</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="font-semibold">Academic Completion</span>
                  <span className="font-mono">82%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'goals_notes':
        return widgetFrame(
          'Goals & Quick Notes',
          <Award size={16} />,
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Goals Milestone list */}
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Primary Goal</h4>
                <p className="text-sm font-bold truncate">Achieve Cumulative 3.9 GPA</p>
                <p className="text-xs text-zinc-400 mt-1">Deadline: Aug 15, 2026</p>
              </div>
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '33%' }} />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">33% completed</span>
              </div>
            </div>

            {/* Quick Notes Pad */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Quick Note</h4>
              <textarea
                placeholder="Type anything to save instantly to Notes..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className={`w-full flex-1 p-2.5 text-xs rounded-xl border outline-none resize-none ${
                  isDark
                    ? 'bg-zinc-950/40 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500'
                    : 'bg-zinc-50/50 border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-indigo-500'
                }`}
              />
              <button
                disabled={!quickNote.trim()}
                onClick={onAddQuickNote}
                className="mt-2 text-xs py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Plus size={12} /> Save Note
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-black text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-full">
            Core Operating System
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
            Good day, Leo
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Baseline Date: Sunday, July 19th, 2026
          </p>
        </div>

        {/* Real-time Glassmorphic Clock */}
        <div className="flex items-center gap-3.5 bg-zinc-500/5 dark:bg-zinc-500/5 border border-zinc-800/10 dark:border-zinc-800/50 p-3 rounded-2xl backdrop-blur-xl">
          <Clock size={20} className="text-indigo-400" />
          <div className="font-mono text-left">
            <p className="text-lg font-bold leading-none">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mt-1">
              {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Bento Grid layout config */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/10 dark:border-zinc-800/50">
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-indigo-400" />
          <span className="text-sm font-bold tracking-tight">Personalized Bento Workspace</span>
        </div>
        <button
          onClick={() => setCustomizeMode(!customizeMode)}
          className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
            customizeMode
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
              : 'border-zinc-800/20 hover:border-zinc-800/40 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {customizeMode ? 'Done Customizing' : 'Customize Layout'}
        </button>
      </div>

      {/* Grid of Bento widgets */}
      <div className="grid grid-cols-1 gap-6">
        {widgetOrder.map((widgetId, idx) => renderWidget(widgetId, idx))}
      </div>
    </div>
  );
}
