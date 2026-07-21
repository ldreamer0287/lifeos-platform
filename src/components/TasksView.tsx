/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  List,
  Kanban,
  Calendar,
  Search,
  Plus,
  Trash2,
  Paperclip,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertTriangle,
  FolderMinus,
} from 'lucide-react';
import { Task, Priority, Subtask } from '../types';
import { getRelativeDateString } from '../utils';

interface TasksViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  theme: 'dark' | 'light';
}

type ViewMode = 'list' | 'kanban' | 'calendar';

export default function TasksView({ tasks, setTasks, theme }: TasksViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'todo', 'completed'

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('work');
  const [tagsInput, setTagsInput] = useState('');
  const [deadline, setDeadline] = useState('');
  const [subtasksInput, setSubtasksInput] = useState('');

  // Expand state for subtasks view in List mode
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Derived filtered tasks
  const filteredTasks = tasks.filter((task) => {
    const matchSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchCategory = filterCategory === 'all' || task.category === filterCategory;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && task.isCompleted) ||
      (filterStatus === 'todo' && !task.isCompleted);

    return matchSearch && matchPriority && matchCategory && matchStatus;
  });

  // Calculate Subtask Progress
  const calculateProgress = (subtasks: Subtask[]) => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter((s) => s.isCompleted).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.isCompleted;
          // If completing the task, make all subtasks completed
          const updatedSubtasks = t.subtasks.map((s) => ({ ...s, isCompleted: nextCompleted }));
          return {
            ...t,
            isCompleted: nextCompleted,
            subtasks: updatedSubtasks,
            progress: nextCompleted ? 100 : 0,
          };
        }
        return t;
      })
    );
  };

  const toggleSubtaskCompleted = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
          );
          const progress = calculateProgress(updatedSubtasks);
          const isCompleted = progress === 100;
          return { ...t, subtasks: updatedSubtasks, progress, isCompleted };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedSubtasks: Subtask[] = subtasksInput
      .split('\n')
      .filter((s) => s.trim())
      .map((s, idx) => ({
        id: `sub_${Date.now()}_${idx}`,
        title: s.trim(),
        isCompleted: false,
      }));

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title,
      description,
      priority,
      category,
      tags: parsedTags,
      deadline: deadline || undefined,
      subtasks: parsedSubtasks,
      attachments: [],
      isCompleted: false,
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    setTasks([newTask, ...tasks]);

    // Reset Form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('work');
    setTagsInput('');
    setDeadline('');
    setSubtasksInput('');
    setShowForm(false);
  };

  // Move task state in Kanban mode (To Do, In Progress, Completed)
  // We can treat `isCompleted` as complete, and for in-progress we can use `progress > 0 && progress < 100`
  const getTaskStage = (task: Task): 'todo' | 'progress' | 'completed' => {
    if (task.isCompleted) return 'completed';
    if (task.progress > 0) return 'progress';
    return 'todo';
  };

  const moveTaskStage = (taskId: string, targetStage: 'todo' | 'progress' | 'completed') => {
    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          if (targetStage === 'completed') {
            return {
              ...t,
              isCompleted: true,
              progress: 100,
              subtasks: t.subtasks.map((s) => ({ ...s, isCompleted: true })),
            };
          } else if (targetStage === 'progress') {
            return {
              ...t,
              isCompleted: false,
              progress: Math.max(15, t.progress === 100 ? 50 : t.progress), // Set active progress
            };
          } else {
            return {
              ...t,
              isCompleted: false,
              progress: 0,
              subtasks: t.subtasks.map((s) => ({ ...s, isCompleted: false })),
            };
          }
        }
        return t;
      })
    );
  };

  // Custom Calendar Generator for deadline viewing
  const renderCalendarDeadlines = () => {
    // Generate dates for July 2026
    const daysInMonth = 31;
    const startDayOfWeek = 3; // July 1st 2026 is Wednesday (3)
    const calendarGrid: (string | null)[] = [];

    // Fill in offset days
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarGrid.push(null);
    }

    // Fill in July days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `2026-07-${String(d).padStart(2, '0')}`;
      calendarGrid.push(dayStr);
    }

    const weeks: (string | null)[][] = [];
    for (let i = 0; i < calendarGrid.length; i += 7) {
      weeks.push(calendarGrid.slice(i, i + 7));
    }

    return (
      <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl overflow-hidden bg-zinc-500/5 backdrop-blur-xl">
        <div className="p-4 border-b border-zinc-800/10 dark:border-zinc-800/50 bg-indigo-500/5 flex items-center justify-between">
          <h3 className="font-bold text-sm">Deadlines Calendar: July 2026</h3>
          <span className="text-xs font-mono font-bold text-indigo-400">Baseline Target Month</span>
        </div>
        <div className="grid grid-cols-7 border-b border-zinc-800/10 dark:border-zinc-800/40 text-center py-2 bg-zinc-500/5 text-xs font-semibold text-zinc-400 font-mono">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>
        <div className="divide-y divide-zinc-800/10 dark:divide-zinc-800/40">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 divide-x divide-zinc-800/10 dark:divide-zinc-800/40 h-28">
              {week.map((day, dIdx) => {
                if (!day) return <div key={dIdx} className="bg-zinc-500/2 dark:bg-zinc-950/40" />;

                const dayNum = day.split('-')[2];
                const dayTasks = tasks.filter((t) => t.deadline === day);
                const isBaseline = day === '2026-07-19';

                return (
                  <div
                    key={dIdx}
                    className={`p-1.5 flex flex-col justify-between overflow-hidden relative ${
                      isBaseline ? 'bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                          isBaseline
                            ? 'bg-indigo-600 text-white'
                            : 'text-zinc-400'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto mt-1 space-y-1 custom-scrollbar">
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`text-[9px] leading-tight font-semibold px-1 py-0.5 rounded truncate border ${
                            t.isCompleted
                              ? 'bg-zinc-500/10 text-zinc-500 border-transparent line-through'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15'
                          }`}
                          title={t.title}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Task Manager
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Organize tasks, map deadlines, and coordinate subtasks.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Control Matrix (Search, Filters, View Toggles) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pb-2">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500'
                : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-indigo-500'
            }`}
          />
        </div>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className={`px-3 py-2.5 text-sm rounded-xl border outline-none ${
            theme === 'dark'
              ? 'bg-zinc-900/40 border-zinc-800 text-zinc-200'
              : 'bg-white border-zinc-200 text-zinc-700'
          }`}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* View Switchers */}
        <div className="flex rounded-xl border border-zinc-800/10 dark:border-zinc-800/50 p-1 self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg flex-1 flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <List size={14} /> List
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-lg flex-1 flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              viewMode === 'kanban'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Kanban size={14} /> Kanban
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-1.5 rounded-lg flex-1 flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar size={14} /> Calendar
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {viewMode === 'list' && (
        <div className="space-y-3.5">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const isExpanded = expandedTask === task.id;
              const hasSubtasks = task.subtasks.length > 0;

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700/80'
                      : 'bg-white border-zinc-200 hover:border-zinc-300/80'
                  }`}
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left Checklist */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => toggleTaskCompleted(task.id)}
                        className="rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3
                            className={`font-semibold text-base truncate ${
                              task.isCompleted ? 'text-zinc-500 line-through' : ''
                            }`}
                          >
                            {task.title}
                          </h3>
                          <span
                            className={`text-[9px] font-mono tracking-widest uppercase font-bold px-2 py-0.5 rounded-full ${
                              task.priority === 'urgent'
                                ? 'bg-rose-500/15 text-rose-400'
                                : task.priority === 'high'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-zinc-500/15 text-zinc-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className={`text-xs text-zinc-400 mt-1 line-clamp-1 ${
                          task.isCompleted ? 'text-zinc-500' : ''
                        }`}>
                          {task.description}
                        </p>

                        {/* Badges */}
                        <div className="flex items-center gap-3.5 mt-3 flex-wrap">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                            {task.category}
                          </span>
                          {task.deadline && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              📅 {task.deadline}
                            </span>
                          )}
                          {task.tags.map((tg) => (
                            <span
                              key={tg}
                              className="text-[10px] bg-zinc-500/10 px-2 py-0.5 rounded-full text-zinc-400 font-medium flex items-center gap-1"
                            >
                              <Tag size={8} /> {tg}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Progress & Expand Controls */}
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      {hasSubtasks && (
                        <div className="flex flex-col items-end min-w-[100px]">
                          <span className="text-xs text-zinc-400 font-mono font-medium mb-1.5">
                            {task.progress}% done
                          </span>
                          <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {hasSubtasks && (
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className={`p-1.5 rounded-lg border border-zinc-800/10 dark:border-zinc-800/40 text-zinc-400 hover:text-zinc-200`}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 rounded-lg border border-zinc-800/10 dark:border-zinc-800/40 text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subtasks Expanded Panel */}
                  {isExpanded && hasSubtasks && (
                    <div className="px-10 pb-5 border-t border-zinc-800/5 dark:border-zinc-800/30 pt-4 space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Subtasks</p>
                      {task.subtasks.map((sub) => (
                        <label
                          key={sub.id}
                          className="flex items-center gap-3 text-sm cursor-pointer hover:text-zinc-200 text-zinc-400"
                        >
                          <input
                            type="checkbox"
                            checked={sub.isCompleted}
                            onChange={() => toggleSubtaskCompleted(task.id, sub.id)}
                            className="rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span className={sub.isCompleted ? 'line-through text-zinc-600' : ''}>
                            {sub.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
              <FolderMinus size={36} className="stroke-1 text-zinc-500" />
              <p className="text-base font-semibold">No tasks matched your search metrics.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setFilterPriority('all');
                  setFilterCategory('all');
                }}
                className="text-xs text-indigo-400 hover:underline font-bold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TO DO Board */}
          <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-4 bg-zinc-500/2 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <h3 className="font-bold text-sm tracking-tight">To Do</h3>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-zinc-500/10 rounded-full text-zinc-400">
                {filteredTasks.filter((t) => getTaskStage(t) === 'todo').length}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredTasks
                .filter((t) => getTaskStage(t) === 'todo')
                .map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border border-zinc-800/10 dark:border-zinc-800/40 bg-zinc-950/20 hover:border-zinc-700/60 transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold">
                        {task.category}
                      </span>
                      <span
                        className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          task.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-zinc-500/15 text-zinc-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mt-2">{task.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{task.description}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-800/10 dark:border-zinc-800/30 pt-3">
                      <span className="text-[10px] text-zinc-500 font-mono">{task.deadline || 'No due'}</span>
                      <button
                        onClick={() => moveTaskStage(task.id, 'progress')}
                        className="text-[10px] text-indigo-400 hover:underline font-bold"
                      >
                        Start task →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* IN PROGRESS Board */}
          <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-4 bg-zinc-500/2 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="font-bold text-sm tracking-tight">In Progress</h3>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-zinc-500/10 rounded-full text-zinc-400">
                {filteredTasks.filter((t) => getTaskStage(t) === 'progress').length}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredTasks
                .filter((t) => getTaskStage(t) === 'progress')
                .map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border border-zinc-800/10 dark:border-zinc-800/40 bg-zinc-950/20 hover:border-zinc-700/60 transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold">
                        {task.category}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{task.progress}%</span>
                    </div>
                    <h4 className="font-semibold text-sm mt-2">{task.title}</h4>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${task.progress}%` }} />
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-800/10 dark:border-zinc-800/30 pt-3">
                      <button
                        onClick={() => moveTaskStage(task.id, 'todo')}
                        className="text-[10px] text-zinc-400 hover:underline"
                      >
                        ← Move back
                      </button>
                      <button
                        onClick={() => moveTaskStage(task.id, 'completed')}
                        className="text-[10px] text-emerald-400 hover:underline font-bold"
                      >
                        Complete ✓
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* COMPLETED Board */}
          <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-4 bg-zinc-500/2 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm tracking-tight">Completed</h3>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-zinc-500/10 rounded-full text-zinc-400">
                {filteredTasks.filter((t) => getTaskStage(t) === 'completed').length}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredTasks
                .filter((t) => getTaskStage(t) === 'completed')
                .map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border border-zinc-800/10 dark:border-zinc-800/40 bg-zinc-950/20 opacity-75 hover:border-zinc-700/60 transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold line-through">
                        {task.category}
                      </span>
                      <Check size={14} className="text-emerald-500" />
                    </div>
                    <h4 className="font-semibold text-sm mt-2 text-zinc-500 line-through">{task.title}</h4>
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-800/10 dark:border-zinc-800/30 pt-3">
                      <button
                        onClick={() => moveTaskStage(task.id, 'progress')}
                        className="text-[10px] text-zinc-400 hover:underline"
                      >
                        Re-open task
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'calendar' && renderCalendarDeadlines()}

      {/* Creation Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 overflow-hidden ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30">
              <h3 className="font-bold text-lg">Create LifeOS Task</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Task Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Deploy LifeOS Server Core API"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                    theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-850 text-zinc-100 focus:border-indigo-500'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Description</label>
                <textarea
                  placeholder="Details of the work item..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none h-20 resize-none ${
                    theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-850 text-zinc-100 focus:border-indigo-500'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="personal">Personal</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Vite, AI, NodeJS"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-100'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Subtasks (one per line)</label>
                <textarea
                  placeholder="Configure subtasks...&#10;Implement Vite server&#10;Conduct final build audits"
                  value={subtasksInput}
                  onChange={(e) => setSubtasksInput(e.target.value)}
                  className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none h-16 resize-none ${
                    theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-850 text-zinc-100 focus:border-indigo-500'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow transition-all mt-4"
              >
                Assemble Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
