/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  BarChart,
  Award,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { StudySubject, StudyAssignment, QuizTracker, ExamSchedule, StudySession } from '../types';
import { getRelativeDateString } from '../utils';

interface StudyViewProps {
  subjects: StudySubject[];
  setSubjects: React.Dispatch<React.SetStateAction<StudySubject[]>>;
  assignments: StudyAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<StudyAssignment[]>>;
  quizzes: QuizTracker[];
  setQuizzes: React.Dispatch<React.SetStateAction<QuizTracker[]>>;
  exams: ExamSchedule[];
  setExams: React.Dispatch<React.SetStateAction<ExamSchedule[]>>;
  sessions: StudySession[];
  setSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  theme: 'dark' | 'light';
}

export default function StudyView({
  subjects,
  setSubjects,
  assignments,
  setAssignments,
  quizzes,
  setQuizzes,
  exams,
  setExams,
  sessions,
  setSessions,
  theme,
}: StudyViewProps) {
  // Study Timer (Stopwatch Focus Engine)
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [sessionNotes, setSessionNotes] = useState('');

  // Forms Modals
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);

  // Subject Form State
  const [subName, setSubName] = useState('');
  const [subCredits, setSubCredits] = useState(3);
  const [subColor, setSubColor] = useState('indigo');
  const [subGpaGoal, setSubGpaGoal] = useState(4.0);

  // Assignment Form State
  const [asgTitle, setAsgTitle] = useState('');
  const [asgSubjectId, setAsgSubjectId] = useState(subjects[0]?.id || '');
  const [asgDueDate, setAsgDueDate] = useState('2026-07-23');

  // Quiz Form State
  const [qzTitle, setQzTitle] = useState('');
  const [qzSubjectId, setQzSubjectId] = useState(subjects[0]?.id || '');
  const [qzScore, setQzScore] = useState(10);
  const [qzMaxScore, setQzMaxScore] = useState(10);

  // Exam Form State
  const [exTitle, setExTitle] = useState('');
  const [exSubjectId, setExSubjectId] = useState(subjects[0]?.id || '');
  const [exDate, setExDate] = useState('2026-07-23');
  const [exRoom, setExRoom] = useState('Hall B');

  // Stopwatch ticking
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleSaveSession = () => {
    if (seconds < 5) {
      alert('Focus session must be at least 5 seconds before saving.');
      return;
    }

    const durationMs = seconds * 1000;
    const newSession: StudySession = {
      id: `ses_${Date.now()}`,
      subjectId: selectedSubjectId,
      durationMs,
      notes: sessionNotes || 'Standard Study session logged.',
      date: getRelativeDateString(0),
    };

    setSessions([newSession, ...sessions]);
    setSeconds(0);
    setTimerActive(false);
    setSessionNotes('');
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    const newSubject: StudySubject = {
      id: `sub_${Date.now()}`,
      name: subName,
      credits: subCredits,
      color: subColor,
      gpaGoal: subGpaGoal,
    };

    setSubjects([...subjects, newSubject]);
    setSubName('');
    setSubCredits(3);
    setSubGpaGoal(4.0);
    setShowSubjectForm(false);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim()) return;

    const newAsg: StudyAssignment = {
      id: `asg_${Date.now()}`,
      subjectId: asgSubjectId,
      title: asgTitle,
      dueDate: asgDueDate,
      isCompleted: false,
    };

    setAssignments([...assignments, newAsg]);
    setAsgTitle('');
    setShowAssignmentForm(false);
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qzTitle.trim()) return;

    const newQuiz: QuizTracker = {
      id: `qz_${Date.now()}`,
      subjectId: qzSubjectId,
      title: qzTitle,
      score: qzScore,
      maxScore: qzMaxScore,
      date: getRelativeDateString(0),
    };

    setQuizzes([...quizzes, newQuiz]);
    setQzTitle('');
    setShowQuizForm(false);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exTitle.trim()) return;

    const newExam: ExamSchedule = {
      id: `ex_${Date.now()}`,
      subjectId: exSubjectId,
      title: exTitle,
      date: exDate,
      room: exRoom || undefined,
    };

    setExams([...exams, newExam]);
    setExTitle('');
    setShowExamForm(false);
  };

  const toggleAssignment = (id: string) => {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, isCompleted: !a.isCompleted } : a))
    );
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const formatTimerTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculations
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + s.durationMs / 60000, 0);
  const averageGpa = 3.93; // Derived average performance metric

  const getSubjectColorClass = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'amber':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'rose':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Study Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Map subject performance metrics, track quiz grades, and log focus hours.
          </p>
        </div>

        <button
          onClick={() => setShowSubjectForm(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 shrink-0">
            <Award size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Target GPA Goal</h4>
            <p className="text-2xl font-black mt-1">3.93 <span className="text-xs text-zinc-500">/ 4.0</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Focus Logged</h4>
            <p className="text-2xl font-black mt-1">
              {Math.round(totalStudyMinutes)} <span className="text-xs text-zinc-500">mins</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-amber-500/5 text-amber-400 border border-amber-500/10 shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Class Load</h4>
            <p className="text-2xl font-black mt-1">
              {subjects.length} <span className="text-xs text-zinc-500">Subjects</span>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Stopwatch Focus Clock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Clock size={16} className="text-indigo-400" /> Focus Stopwatch Session
            </h3>
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded">
              Academic Engine
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-5xl font-black font-mono tracking-tight text-zinc-100 mb-2">
              {formatTimerTime(seconds)}
            </span>
            <span className="text-xs text-zinc-400">Select Subject & log focused hours below</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className={`w-full mt-1.5 px-3 py-2 text-xs rounded-xl border outline-none ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-zinc-200'
                  }`}
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Session Log Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Read Chapter 12 thermoelectrics proofs"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className={`w-full mt-1.5 px-3 py-2 text-xs rounded-xl border outline-none ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-zinc-200'
                  }`}
                />
              </div>
            </div>

            {/* Timer Controllers */}
            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow shadow-indigo-600/20"
              >
                {timerActive ? (
                  <>
                    <Pause size={12} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={12} /> Start Session
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setSeconds(0);
                  setTimerActive(false);
                }}
                className={`px-3 py-2 rounded-xl border transition-all text-xs font-semibold ${
                  theme === 'dark' ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <RotateCcw size={12} /> Reset
              </button>

              <button
                disabled={seconds === 0}
                onClick={handleSaveSession}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
              >
                Save Focus Log
              </button>
            </div>
          </div>
        </div>

        {/* Subjects list column */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <GraduationCap size={16} className="text-indigo-400" /> Active Subjects Load
            </h3>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
            {subjects.map((sub) => {
              const subSessions = sessions.filter((s) => s.subjectId === sub.id);
              const subMinutes = subSessions.reduce((acc, s) => acc + s.durationMs / 60000, 0);

              return (
                <div
                  key={sub.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    theme === 'dark' ? 'bg-zinc-950/20 border-zinc-850' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="overflow-hidden text-left">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getSubjectColorClass(sub.color)}`}>
                      {sub.credits} Credits
                    </span>
                    <h4 className="font-bold text-xs mt-2 truncate">{sub.name}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                      Target: {sub.gpaGoal.toFixed(1)} GPA • Logged: {Math.round(subMinutes)}m
                    </p>
                  </div>

                  <button
                    onClick={() => deleteSubject(sub.id)}
                    className="p-1 rounded text-zinc-500 hover:text-rose-500 transition-all shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assignment Tracker, Exams and Quizzes split grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assignments */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-4 bg-zinc-500/2 backdrop-blur-xl flex flex-col justify-between">
          <div className="pb-2 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Pending Assignments</h3>
            <button
              onClick={() => {
                if (subjects.length === 0) {
                  alert('Please create a subject first.');
                  return;
                }
                setAsgSubjectId(subjects[0].id);
                setShowAssignmentForm(true);
              }}
              className="text-xs text-indigo-400 hover:underline font-bold flex items-center gap-1"
            >
              <Plus size={10} /> Add
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
            {assignments.map((asg) => {
              const sub = subjects.find((s) => s.id === asg.subjectId);
              return (
                <div
                  key={asg.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs text-left ${
                    theme === 'dark' ? 'bg-zinc-950/20 border-zinc-850' : 'bg-white border-zinc-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={asg.isCompleted}
                    onChange={() => toggleAssignment(asg.id)}
                    className="rounded border-zinc-750 text-indigo-600 cursor-pointer"
                  />
                  <div className="overflow-hidden flex-1">
                    <p className={`font-semibold truncate ${asg.isCompleted ? 'line-through text-zinc-500' : ''}`}>
                      {asg.title}
                    </p>
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">
                      {sub?.name || 'Academic'} • Due: {asg.dueDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exams */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-4 bg-zinc-500/2 backdrop-blur-xl flex flex-col justify-between">
          <div className="pb-2 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Exam Planners</h3>
            <button
              onClick={() => {
                if (subjects.length === 0) {
                  alert('Please create a subject first.');
                  return;
                }
                setExSubjectId(subjects[0].id);
                setShowExamForm(true);
              }}
              className="text-xs text-indigo-400 hover:underline font-bold flex items-center gap-1"
            >
              <Plus size={10} /> Plan
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
            {exams.map((ex) => {
              const sub = subjects.find((s) => s.id === ex.subjectId);
              return (
                <div
                  key={ex.id}
                  className={`p-2.5 rounded-lg border text-xs text-left ${
                    theme === 'dark' ? 'bg-zinc-950/20 border-zinc-850' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-semibold text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                      📅 {ex.date}
                    </span>
                    {ex.room && (
                      <span className="text-[9px] text-zinc-500 font-mono font-bold">Room: {ex.room}</span>
                    )}
                  </div>
                  <h4 className="font-bold mt-2 truncate">{ex.title}</h4>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">{sub?.name || 'General'}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiz Performance */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-4 bg-zinc-500/2 backdrop-blur-xl flex flex-col justify-between">
          <div className="pb-2 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Quiz Grades</h3>
            <button
              onClick={() => {
                if (subjects.length === 0) {
                  alert('Please create a subject first.');
                  return;
                }
                setQzSubjectId(subjects[0].id);
                setShowQuizForm(true);
              }}
              className="text-xs text-indigo-400 hover:underline font-bold flex items-center gap-1"
            >
              <Plus size={10} /> Log
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
            {quizzes.map((qz) => {
              const sub = subjects.find((s) => s.id === qz.subjectId);
              const percent = Math.round((qz.score / qz.maxScore) * 100);
              return (
                <div
                  key={qz.id}
                  className={`p-2.5 rounded-lg border text-xs text-left ${
                    theme === 'dark' ? 'bg-zinc-950/20 border-zinc-850' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <h4 className="font-bold truncate max-w-[120px]">{qz.title}</h4>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{sub?.name || 'Academic'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-xs">{qz.score} / {qz.maxScore}</span>
                      <span className="text-[9px] text-emerald-400 font-bold font-mono block mt-0.5">{percent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forms Modals */}
      {showSubjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Add Class Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Subject Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Physics AP"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Credit Load</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={subCredits}
                    onChange={(e) => setSubCredits(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">GPA Goal</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="4.0"
                    value={subGpaGoal}
                    onChange={(e) => setSubGpaGoal(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Color Palette</label>
                <select
                  value={subColor}
                  onChange={(e) => setSubColor(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <option value="indigo">Indigo Blue</option>
                  <option value="emerald">Emerald Green</option>
                  <option value="amber">Amber Gold</option>
                  <option value="rose">Rose Red</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Confirm Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignmentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Add Pending Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Assignment Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Chapter 12 Projections set"
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Class Subject</label>
                  <select
                    value={asgSubjectId}
                    onChange={(e) => setAsgSubjectId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Due Date</label>
                  <input
                    type="date"
                    value={asgDueDate}
                    onChange={(e) => setAsgDueDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignmentForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuizForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Log Quiz Score</h3>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Quiz Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Unit 3 Trigonometry Quiz"
                  value={qzTitle}
                  onChange={(e) => setQzTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Your Score</label>
                  <input
                    type="number"
                    value={qzScore}
                    onChange={(e) => setQzScore(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Maximum Score</label>
                  <input
                    type="number"
                    value={qzMaxScore}
                    onChange={(e) => setQzMaxScore(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Class Subject</label>
                <select
                  value={qzSubjectId}
                  onChange={(e) => setQzSubjectId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuizForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Log Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExamForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Plan Examination</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Exam Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Physics Final Exam"
                  value={exTitle}
                  onChange={(e) => setExTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Class Subject</label>
                  <select
                    value={exSubjectId}
                    onChange={(e) => setExSubjectId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Exam Date</label>
                  <input
                    type="date"
                    value={exDate}
                    onChange={(e) => setExDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Examination Room</label>
                <input
                  type="text"
                  placeholder="e.g. Hall B or Online"
                  value={exRoom}
                  onChange={(e) => setExRoom(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowExamForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
