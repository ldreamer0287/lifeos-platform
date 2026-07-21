/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import DashboardView from './components/DashboardView';
import TasksView from './components/TasksView';
import CalendarView from './components/CalendarView';
import NotesView from './components/NotesView';
import StudyView from './components/StudyView';
import HabitsView from './components/HabitsView';
import GoalsView from './components/GoalsView';
import FinanceView from './components/FinanceView';
import BookmarksView from './components/BookmarksView';
import FilesView from './components/FilesView';
import AIView from './components/AIView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import AdminDashboardView from './components/AdminDashboardView';
import CollaborationHubView from './components/CollaborationHubView';

import {
  Task,
  CalendarEvent,
  Note,
  StudySubject,
  StudyAssignment,
  QuizTracker,
  ExamSchedule,
  StudySession,
  Habit,
  Goal,
  FinanceTransaction,
  SavingsGoal,
  BookmarkItem,
  FileItem,
  UserProfile,
} from './types';

import { LifeOSStore } from './utils';
import { initAuth, logoutGoogle, getAccessToken } from './lib/firebase';
import {
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  fetchGoogleTasks,
  createGoogleTask,
  fetchGoogleDriveFiles
} from './utils/googleSync';

export default function App() {
  const [user, setUser] = useState<{ name: string; title: string; email?: string; isAdmin?: boolean; avatarUrl?: string; bio?: string; department?: string; username?: string } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);

  // Google Workspace selection binding
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);

  // Track feature clicks for Admin Dashboard Analytics
  useEffect(() => {
    if (!activeTab || loading) return;
    try {
      const stored = localStorage.getItem('lifeos_feature_clicks');
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[activeTab] = (parsed[activeTab] || 0) + 1;
      localStorage.setItem('lifeos_feature_clicks', JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }
  }, [activeTab, loading]);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Quick note scratchpad state
  const [quickNote, setQuickNote] = useState('');

  // Core domain state blocks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [assignments, setAssignments] = useState<StudyAssignment[]>([]);
  const [quizzes, setQuizzes] = useState<QuizTracker[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // Google Sync State
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [googleLastSyncTime, setGoogleLastSyncTime] = useState<string>('');
  const [googleSyncStatus, setGoogleSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'disconnected'>('disconnected');

  // Persistent AI Chat Sessions
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');

  // Keyboard shortcut listener for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Initial State Hydration
  useEffect(() => {
    const store = LifeOSStore.load();
    setTasks(store.tasks);
    setEvents(store.events);
    setNotes(store.notes);
    setSubjects(store.subjects);
    setAssignments(store.assignments);
    setQuizzes(store.quizzes);
    setExams(store.exams);
    setSessions(store.sessions);
    setHabits(store.habits);
    setGoals(store.goals);
    setTransactions(store.transactions);
    setSavingsGoals(store.savingsGoals);
    setBookmarks(store.bookmarks);
    setFiles(store.files);

    const cachedSession = localStorage.getItem('lifeos_session');
    if (cachedSession) {
      setUser(JSON.parse(cachedSession));
    }

    const cachedTheme = localStorage.getItem('lifeos_theme');
    if (cachedTheme === 'light') {
      setTheme('light');
    }

    const cachedChats = localStorage.getItem('lifeos_ai_chats');
    const cachedActiveChatId = localStorage.getItem('lifeos_ai_active_chat_id');
    if (cachedChats) {
      const parsed = JSON.parse(cachedChats);
      setChats(parsed);
      if (cachedActiveChatId) {
        setActiveChatId(cachedActiveChatId);
      } else if (parsed.length > 0) {
        setActiveChatId(parsed[0].id);
      }
    } else {
      const defaultChat = {
        id: `chat_${Date.now()}`,
        title: 'New Chat',
        messages: [
          {
            role: 'model',
            text: `Greetings, Operator. LifeOS Intelligent Core is online. I have established a deep real-time neural link to all active system modules. Let me know how I can support you.`,
          }
        ],
        createdAt: new Date().toISOString()
      };
      setChats([defaultChat]);
      setActiveChatId(defaultChat.id);
    }

    setLoading(false);
  }, []);

  // Hydrate Google connection
  useEffect(() => {
    const isConnected = localStorage.getItem('lifeos_google_connected') === 'true';
    if (isConnected) {
      setGoogleConnected(true);
      setGoogleEmail(localStorage.getItem('lifeos_google_email') || '');
      setGoogleLastSyncTime(localStorage.getItem('lifeos_google_last_sync') || '');
      setGoogleSyncStatus('synced');
    }
  }, []);

  // Firebase auth state sync
  useEffect(() => {
    const unsubscribe = initAuth(
      (firebaseUser, token) => {
        setGoogleConnected(true);
        setGoogleEmail(firebaseUser.email || '');
        setGoogleSyncStatus('synced');
        localStorage.setItem('lifeos_google_connected', 'true');
        localStorage.setItem('lifeos_google_email', firebaseUser.email || '');
      },
      () => {
        // Do not force logout unless cleared
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-persist AI chats
  useEffect(() => {
    if (loading) return;
    localStorage.setItem('lifeos_ai_chats', JSON.stringify(chats));
  }, [chats, loading]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('lifeos_ai_active_chat_id', activeChatId);
    }
  }, [activeChatId]);

  // 2. State Auto-Persistence sync
  useEffect(() => {
    if (loading) return;

    LifeOSStore.save({
      tasks,
      events,
      notes,
      subjects,
      assignments,
      quizzes,
      exams,
      sessions,
      habits,
      goals,
      transactions,
      savingsGoals,
      bookmarks,
      files,
    });
  }, [
    loading,
    tasks,
    events,
    notes,
    subjects,
    assignments,
    quizzes,
    exams,
    sessions,
    habits,
    goals,
    transactions,
    savingsGoals,
    bookmarks,
    files,
  ]);

  // Adjust document body theme selectors
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#02040a'; // Frosted Glass Theme Dark
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f8fafc'; // Frosted Glass Theme Light
    }
    localStorage.setItem('lifeos_theme', theme);
  }, [theme]);

  const handleLoginSuccess = (userName: string, userTitle: string, userEmail?: string, isAdmin?: boolean) => {
    const session = { name: userName, title: userTitle, email: userEmail, isAdmin: isAdmin || false };
    setUser(session);
    localStorage.setItem('lifeos_session', JSON.stringify(session));
    if (isAdmin) {
      setActiveTab('admin-dashboard');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lifeos_session');
  };

  const handleUpdateUserName = (name: string) => {
    if (!user) return;
    const session = { ...user, name };
    setUser(session);
    localStorage.setItem('lifeos_session', JSON.stringify(session));
  };

  const handleUpdateUserTitle = (title: string) => {
    if (!user) return;
    const session = { ...user, title };
    setUser(session);
    localStorage.setItem('lifeos_session', JSON.stringify(session));
  };

  const handleUpdateProfile = (updatedFields: Partial<{
    name: string;
    title: string;
    email: string;
    avatarUrl: string;
    bio: string;
    department: string;
    username: string;
  }>) => {
    if (!user) return;
    const session = { ...user, ...updatedFields };
    setUser(session);
    localStorage.setItem('lifeos_session', JSON.stringify(session));
  };

  // Convert quickNote input to a real note
  const handleAddQuickNote = () => {
    if (!quickNote.trim()) return;
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: 'Quick Dashboard Scratchpad',
      content: quickNote,
      folder: 'Ideas',
      tags: ['Quick'],
      isFavorite: false,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setQuickNote('');
  };

  // Process search selection
  const handleSelectItem = (type: string, id: string) => {
    if (type === 'task') setActiveTab('tasks');
    else if (type === 'note') setActiveTab('notes');
    else if (type === 'habit') setActiveTab('habits');
    else if (type === 'bookmark') setActiveTab('bookmarks');
    else if (type === 'file') setActiveTab('files');
  };

  const handleViewInWorkspace = (fileId: string) => {
    setSelectedFileId(fileId);
    setActiveTab('google-workspace');
  };

  // Construct active profile structure
  const profile: UserProfile = {
    id: 'user_1',
    email: user?.email || 'user@lifeos.io',
    fullName: user?.name || 'Guest Operator',
    avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: user?.bio || user?.title || 'Personal Operating System Admin',
    createdAt: new Date().toISOString(),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-mono text-xs font-bold gap-3.5">
        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0" />
        <span>Booting LifeOS Core System...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthView onLoginSuccess={handleLoginSuccess} theme={theme} />;
  }

  // Page view routers
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            tasks={tasks}
            setTasks={setTasks}
            events={events}
            habits={habits}
            setHabits={setHabits}
            goals={goals}
            subjects={subjects}
            quickNote={quickNote}
            setQuickNote={setQuickNote}
            onAddQuickNote={handleAddQuickNote}
            theme={theme}
            setActiveTab={setActiveTab}
          />
        );
      case 'tasks':
        return <TasksView tasks={tasks} setTasks={setTasks} theme={theme} />;
      case 'calendar':
        // Let's resolve what CalendarView expects. It expects events and setEvents, which we have.
        // Wait, is there a CalendarView or CalendarEvent import issue?
        // Let's check below.
        return <CalendarView events={events} setEvents={setEvents} theme={theme} />;
      case 'notes':
        return <NotesView notes={notes} setNotes={setNotes} theme={theme} />;
      case 'study':
        return (
          <StudyView
            subjects={subjects}
            setSubjects={setSubjects}
            assignments={assignments}
            setAssignments={setAssignments}
            quizzes={quizzes}
            setQuizzes={setQuizzes}
            exams={exams}
            setExams={setExams}
            sessions={sessions}
            setSessions={setSessions}
            theme={theme}
          />
        );
      case 'collaboration':
        return <CollaborationHubView theme={theme} user={user} />;
      case 'habits':
        return <HabitsView habits={habits} setHabits={setHabits} theme={theme} />;
      case 'goals':
        return <GoalsView goals={goals} setGoals={setGoals} theme={theme} />;
      case 'finance':
        return (
          <FinanceView
            transactions={transactions}
            setTransactions={setTransactions}
            savingsGoals={savingsGoals}
            setSavingsGoals={setSavingsGoals}
            theme={theme}
          />
        );
      case 'bookmarks':
        return <BookmarksView bookmarks={bookmarks} setBookmarks={setBookmarks} theme={theme} />;
      case 'files':
        return <FilesView files={files} setFiles={setFiles} theme={theme} onViewInWorkspace={handleViewInWorkspace} />;
      case 'admin-dashboard':
        return <AdminDashboardView theme={theme} />;
      case 'ai':
        return (
          <AIView
            tasks={tasks}
            setTasks={setTasks}
            events={events}
            setEvents={setEvents}
            notes={notes}
            setNotes={setNotes}
            subjects={subjects}
            setSubjects={setSubjects}
            assignments={assignments}
            setAssignments={setAssignments}
            quizzes={quizzes}
            setQuizzes={setQuizzes}
            exams={exams}
            setExams={setExams}
            sessions={sessions}
            setSessions={setSessions}
            habits={habits}
            setHabits={setHabits}
            goals={goals}
            setGoals={setGoals}
            transactions={transactions}
            setTransactions={setTransactions}
            savingsGoals={savingsGoals}
            setSavingsGoals={setSavingsGoals}
            bookmarks={bookmarks}
            setBookmarks={setBookmarks}
            files={files}
            setFiles={setFiles}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedFileId={selectedFileId}
            setSelectedFileId={setSelectedFileId}
            user={user}
            handleLogout={handleLogout}
            theme={theme}
            chats={chats}
            setChats={setChats}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            tasks={tasks}
            habits={habits}
            transactions={transactions}
            sessions={sessions}
            theme={theme}
          />
        );
      case 'settings':
        return (
          <SettingsView
            theme={theme}
            setTheme={setTheme}
            userName={user.name}
            setUserName={handleUpdateUserName}
            userTitle={user.title}
            setUserTitle={handleUpdateUserTitle}
            user={user}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      default:
        return <div className="py-20 text-center">Dashboard view template</div>;
    }
  };

  return (
    <div className={`min-h-screen flex p-4 gap-4 overflow-hidden relative selection:bg-indigo-500/30 ${
      theme === 'dark' ? 'bg-[#02040a] text-slate-100' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      {/* Frosted Glass Background Accents */}
      <div className="fixed top-[-100px] left-[-100px] w-[450px] h-[450px] bg-indigo-600/15 dark:bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-100px] right-[-100px] w-[550px] h-[550px] bg-cyan-600/10 dark:bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none z-0"></div>

      {/* 1. Universal Sidebar Panel */}
      <div className="relative z-10 flex shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          setTheme={setTheme}
          profile={profile}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onLogout={handleLogout}
          isAdmin={user?.isAdmin}
        />
      </div>

      {/* 2. Scrollable Canvas Panel inside floating frosted container */}
      <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar h-[calc(100vh-2rem)] rounded-[32px] relative z-10 backdrop-blur-2xl transition-all duration-300 border ${
        theme === 'dark'
          ? 'bg-white/5 border-white/10 text-slate-100 shadow-2xl shadow-black/40'
          : 'bg-zinc-900/5 border-zinc-900/10 text-zinc-800 shadow-2xl shadow-zinc-200/40'
      }`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {renderActiveView()}
        </div>
      </main>

      {/* 3. Global command palette (Ctrl+K fuzzy triggers) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        notes={notes}
        habits={habits}
        bookmarks={bookmarks}
        files={files}
        setActiveTab={setActiveTab}
        onSelectItem={handleSelectItem}
        theme={theme}
      />
    </div>
  );
}
