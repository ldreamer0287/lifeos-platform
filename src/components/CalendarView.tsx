/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { CalendarEvent } from '../types';
import { getRelativeDateString } from '../utils';

interface CalendarViewProps {
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  theme: 'dark' | 'light';
}

type CalViewMode = 'month' | 'week' | 'day' | 'agenda';

export default function CalendarView({ events, setEvents, theme }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<string>('2026-07-19'); // Sunday July 19th 2026
  const [gcalSynced, setGcalSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Event Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('work');
  const [startDate, setStartDate] = useState('2026-07-19');
  const [startTime, setStartTime] = useState('12:00');
  const [endDate, setEndDate] = useState('2026-07-19');
  const [endTime, setEndTime] = useState('13:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent: CalendarEvent = {
      id: `evt_${Date.now()}`,
      title,
      description,
      start: `${startDate}T${startTime}:00`,
      end: `${endDate}T${endTime}:00`,
      category,
      isRecurring,
      recurrence: isRecurring ? recurrence : undefined,
    };

    setEvents([...events, newEvent]);

    // Reset Form
    setTitle('');
    setDescription('');
    setCategory('work');
    setStartDate('2026-07-19');
    setStartTime('12:00');
    setEndDate('2026-07-19');
    setEndTime('13:00');
    setIsRecurring(false);
    setShowForm(false);
  };

  const triggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setGcalSynced(true);
    }, 1500);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'work':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25';
      case 'study':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'personal':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'finance':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-550';
    }
  };

  // Generate Month Grid Dates (July 2026)
  const renderMonthGrid = () => {
    const daysInMonth = 31;
    const startOffset = 3; // July 1st 2026 is Wednesday
    const grid: (string | null)[] = [];

    for (let i = 0; i < startOffset; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(`2026-07-${String(d).padStart(2, '0')}`);
    }

    const weeks: (string | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) {
      weeks.push(grid.slice(i, i + 7));
    }

    return (
      <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl overflow-hidden bg-zinc-500/5 backdrop-blur-xl">
        <div className="grid grid-cols-7 border-b border-zinc-800/10 dark:border-zinc-800/30 text-center py-2.5 bg-zinc-500/5 text-xs font-semibold text-zinc-400 font-mono">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>
        <div className="divide-y divide-zinc-800/10 dark:divide-zinc-800/30">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 divide-x divide-zinc-800/10 dark:divide-zinc-800/30 h-28">
              {week.map((day, dIdx) => {
                if (!day) return <div key={dIdx} className="bg-zinc-500/1 dark:bg-zinc-950/40" />;

                const isSelected = selectedDay === day;
                const isBaseline = day === '2026-07-19';
                const dayNum = day.split('-')[2];
                const dayEvents = events.filter((e) => e.start.startsWith(day));

                return (
                  <div
                    key={dIdx}
                    onClick={() => {
                      setSelectedDay(day);
                      setStartDate(day);
                      setEndDate(day);
                    }}
                    className={`p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 ring-1 ring-inset ring-indigo-500'
                        : isBaseline
                        ? 'bg-zinc-800/10 dark:bg-zinc-800/30'
                        : 'hover:bg-zinc-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                          isBaseline
                            ? 'bg-indigo-600 text-white shadow-md'
                            : isSelected
                            ? 'text-indigo-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/5 px-1.5 py-0.1 rounded font-bold">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto mt-2 space-y-1 custom-scrollbar">
                      {dayEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          className={`text-[9px] leading-tight px-1.5 py-0.5 rounded truncate border ${getCategoryColor(
                            evt.category
                          )}`}
                          title={`${evt.title}: ${evt.description}`}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] text-zinc-500 block text-right font-semibold">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
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

  // Weekly Grid Layout (July 19th Week)
  const renderWeeklyGrid = () => {
    // Hour rows from 8 AM to 8 PM
    const hours = Array.from({ length: 13 }, (_, i) => i + 8);
    const weekDays = Array.from({ length: 7 }, (_, idx) => {
      const date = new Date('2026-07-19');
      date.setDate(date.getDate() - date.getDay() + idx);
      return date.toISOString().split('T')[0];
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl overflow-x-auto bg-zinc-500/5 backdrop-blur-xl">
        <div className="min-w-[650px]">
          {/* Week Days Header */}
          <div className="grid grid-cols-8 border-b border-zinc-800/10 dark:border-zinc-800/30 py-3 text-center text-xs font-bold text-zinc-400 bg-zinc-500/5 font-mono">
            <span className="border-r border-zinc-800/10 dark:border-zinc-800/30">Hours</span>
            {weekDays.map((day, idx) => {
              const dayNum = day.split('-')[2];
              const isBaseline = day === '2026-07-19';
              return (
                <div key={idx} className="flex flex-col items-center">
                  <span>{dayNames[idx]}</span>
                  <span
                    className={`mt-1 font-bold text-sm w-6 h-6 flex items-center justify-center rounded-full ${
                      isBaseline ? 'bg-indigo-600 text-white' : ''
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hour Grid Rows */}
          <div className="divide-y divide-zinc-800/10 dark:divide-zinc-800/30 max-h-[500px] overflow-y-auto">
            {hours.map((hour) => {
              const hourStr = String(hour).padStart(2, '0');
              const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;

              return (
                <div key={hour} className="grid grid-cols-8 divide-x divide-zinc-800/10 dark:divide-zinc-800/30 min-h-[48px]">
                  {/* Hour label */}
                  <div className="text-[10px] text-zinc-500 font-bold font-mono flex items-center justify-center pr-2 bg-zinc-500/2">
                    {displayHour}
                  </div>

                  {/* Day cells */}
                  {weekDays.map((day, dIdx) => {
                    const hourEvents = events.filter(
                      (e) => e.start.startsWith(`${day}T${hourStr}`)
                    );

                    return (
                      <div
                        key={dIdx}
                        onClick={() => {
                          setSelectedDay(day);
                          setStartDate(day);
                          setEndDate(day);
                          setStartTime(`${hourStr}:00`);
                          setEndTime(`${String(hour + 1).padStart(2, '0')}:00`);
                          setShowForm(true);
                        }}
                        className="p-1 relative hover:bg-zinc-500/5 transition-all min-h-[48px]"
                      >
                        {hourEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Do you want to delete event "${evt.title}"?`)) {
                                handleDeleteEvent(evt.id);
                              }
                            }}
                            className={`text-[9px] leading-tight font-semibold p-1.5 rounded border shadow-sm truncate absolute top-1 left-1 right-1 cursor-pointer hover:opacity-90 ${getCategoryColor(
                              evt.category
                            )}`}
                            title={`${evt.title}: ${evt.description}`}
                          >
                            <p className="font-bold truncate">{evt.title}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Agenda View
  const renderAgendaView = () => {
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return (
      <div className="space-y-3.5">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((evt) => {
            const dateStr = evt.start.split('T')[0];
            const timeStr = evt.start.split('T')[1]?.substring(0, 5) || 'All Day';
            return (
              <div
                key={evt.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  theme === 'dark'
                    ? 'bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700'
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center text-xs font-mono font-bold bg-indigo-500/5 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/10 min-w-[70px]">
                    <span className="font-black uppercase">{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">{dateStr.split('-')[2]}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{evt.title}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{evt.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(evt.category)}`}>
                        {evt.category}
                      </span>
                      {evt.isRecurring && (
                        <span className="text-[9px] font-mono font-semibold text-zinc-500 bg-zinc-500/10 px-1.5 py-0.5 rounded">
                          🔁 {evt.recurrence}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <span className="text-xs font-semibold text-zinc-400 font-mono flex items-center gap-1">
                    <Clock size={12} /> {timeStr}
                  </span>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-1.5 rounded-lg border border-zinc-800/10 dark:border-zinc-800/40 text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <CalendarIcon size={36} className="stroke-1 text-zinc-500" />
            <p className="text-base font-semibold">No upcoming events cataloged.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            LifeOS Calendar
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Map out daily milestones, track commitments, and synchronize timelines.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      {/* Sync Matrix */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
          theme === 'dark'
            ? 'bg-zinc-900/30 border-zinc-800/80'
            : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-3.5 text-left">
          <div className="p-2.5 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 shrink-0">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Google Calendar Synchronization</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sync your meetings, lectures, and goals seamlessly across calendars.
            </p>
          </div>
        </div>

        <button
          onClick={triggerSync}
          disabled={syncing}
          className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all shrink-0 ${
            gcalSynced
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'border-zinc-800/30 dark:border-zinc-800 hover:bg-zinc-500/5'
          }`}
        >
          {syncing ? (
            <>
              <RefreshCw size={13} className="animate-spin" /> Syncing...
            </>
          ) : gcalSynced ? (
            <>
              <CheckCircle size={13} /> Synced Core
            </>
          ) : (
            <>
              <RefreshCw size={13} /> Connect Google Calendar
            </>
          )}
        </button>
      </div>

      {/* Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex rounded-xl border border-zinc-800/10 dark:border-zinc-800/50 p-1 bg-zinc-500/5">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'month' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'week' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'agenda' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400'
            }`}
          >
            Agenda
          </button>
        </div>

        <div className="font-mono text-xs text-zinc-400 font-bold bg-zinc-500/5 px-3 py-1.5 rounded-xl border border-zinc-800/10 dark:border-zinc-800/40">
          Target Date: Sunday July 19, 2026
        </div>
      </div>

      {/* Main Grid View render */}
      {viewMode === 'month' && renderMonthGrid()}
      {viewMode === 'week' && renderWeeklyGrid()}
      {viewMode === 'agenda' && renderAgendaView()}

      {/* Creation Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30">
              <h3 className="font-bold text-lg">Schedule Calendar Event</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Event Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. LifeOS Product Review"
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
                  placeholder="Notes about the agenda item..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none h-16 resize-none ${
                    theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-850 text-zinc-100 focus:border-indigo-500'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="flex items-center gap-3.5 pt-6">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-zinc-650 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4.5 h-4.5"
                  />
                  <label htmlFor="isRecurring" className="text-xs font-bold uppercase text-zinc-400 tracking-wider cursor-pointer">
                    Recurring Event
                  </label>
                </div>
              </div>

              {isRecurring && (
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Recurrence Pattern</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`w-full mt-1.5 px-3 py-2 text-sm rounded-xl border outline-none ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-850 text-zinc-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow mt-4 transition-all"
              >
                Assemble Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
