/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Terminal,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Brain,
  Cpu,
  Zap,
  Play,
  AlertTriangle,
  RotateCcw,
  FileText,
  Database,
  Calendar,
  Lock,
  Compass,
  Briefcase,
  Layers,
  Search,
} from 'lucide-react';
import {
  Task,
  CalendarEvent,
  Note,
  ExamSchedule,
  FinanceTransaction,
  StudySubject,
  StudyAssignment,
  QuizTracker,
  StudySession,
  Habit,
  Goal,
  SavingsGoal,
  BookmarkItem,
  FileItem,
} from '../types';

interface AIViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
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
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  transactions: FinanceTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<FinanceTransaction[]>>;
  savingsGoals: SavingsGoal[];
  setSavingsGoals: React.Dispatch<React.SetStateAction<SavingsGoal[]>>;
  bookmarks: BookmarkItem[];
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkItem[]>>;
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  selectedFileId: string | undefined;
  setSelectedFileId: React.Dispatch<React.SetStateAction<string | undefined>>;
  user: any;
  handleLogout: () => void;
  theme: 'dark' | 'light';
  chats: any[];
  setChats: React.Dispatch<React.SetStateAction<any[]>>;
  activeChatId: string;
  setActiveChatId: React.Dispatch<React.SetStateAction<string>>;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  actionsDetected?: Array<{
    action: string;
    payload: any;
    status: 'pending' | 'executed' | 'failed' | 'denied';
  }>;
}

interface AutomationRule {
  id: string;
  trigger: string;
  action: string;
  active: boolean;
}

interface MemoryItem {
  key: string;
  value: string;
  label: string;
}

interface ThinkingStep {
  label: string;
  status: 'pending' | 'loading' | 'done';
}

export default function AIView({
  tasks,
  setTasks,
  events,
  setEvents,
  notes,
  setNotes,
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
  habits,
  setHabits,
  goals,
  setGoals,
  transactions,
  setTransactions,
  savingsGoals,
  setSavingsGoals,
  bookmarks,
  setBookmarks,
  files,
  setFiles,
  activeTab,
  setActiveTab,
  selectedFileId,
  setSelectedFileId,
  user,
  handleLogout,
  theme,
  chats,
  setChats,
  activeChatId,
  setActiveChatId,
}: AIViewProps) {
  // Navigation tabs for AI panel
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'automations' | 'memory'>('chat');

  // Input text
  const [input, setInput] = useState('');
  
  // Audio state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceRepliesEnabled, setIsVoiceRepliesEnabled] = useState(false);
  const [micPulseLevel, setMicPulseLevel] = useState(0);

  // Core History linked to global App chats state
  const activeChat = chats.find((c) => c.id === activeChatId);
  const history = activeChat ? activeChat.messages : [];

  const setHistory = (updateFn: Message[] | ((prev: Message[]) => Message[])) => {
    setChats((prevChats) => {
      return prevChats.map((c) => {
        if (c.id === activeChatId) {
          const newMsgs = typeof updateFn === 'function' ? updateFn(c.messages) : updateFn;
          return { ...c, messages: newMsgs };
        }
        return c;
      });
    });
  };

  // Chat renaming & management states
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');

  const handleCreateNewChat = () => {
    const newChatId = `chat_${Date.now()}`;
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: [
        {
          role: 'model',
          text: `Greetings, Operator. LifeOS Intelligent Core is online. I have established a deep real-time neural link to all active system modules. Let me know how I can support you today.`,
        }
      ],
      createdAt: new Date().toISOString()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
  };

  const handleSaveRename = (id: string) => {
    if (editingChatTitle.trim()) {
      setChats(prev => prev.map(c => c.id === id ? { ...c, title: editingChatTitle.trim() } : c));
    }
    setEditingChatId(null);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chats.length <= 1) return;
    const remaining = chats.filter(c => c.id !== id);
    setChats(remaining);
    if (activeChatId === id) {
      setActiveChatId(remaining[0].id);
    }
  };

  const [loading, setLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Destructive confirmations
  const [pendingDestructive, setPendingDestructive] = useState<{
    messageIndex: number;
    actionIndex: number;
    action: string;
    payload: any;
  } | null>(null);

  // Automation Rule definitions
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [newTrigger, setNewTrigger] = useState('');
  const [newAction, setNewAction] = useState('');
  const [triggeredAutomationText, setTriggeredAutomationText] = useState<string | null>(null);

  // Memory block definitions
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemVal, setNewMemVal] = useState('');
  const [newMemLabel, setNewMemLabel] = useState('');

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);

  // Initial Data Loading for Core
  useEffect(() => {
    // 1. Core greeting is now loaded statically from the persistent state default.
    // 2. Load Automations
    const cachedAuto = localStorage.getItem('lifeos_ai_automations');
    if (cachedAuto) {
      setAutomations(JSON.parse(cachedAuto));
    } else {
      const defaultRules: AutomationRule[] = [
        { id: 'auto_1', trigger: 'When I upload lecture PDFs', action: 'Move to folder Semester 4', active: true },
        { id: 'auto_2', trigger: 'At 10:00 PM every night', action: 'Trigger wind-down note reminder', active: true },
        { id: 'auto_3', trigger: 'When freelancing salary arrives', action: 'Allocate 20% to savings goals', active: true },
      ];
      setAutomations(defaultRules);
      localStorage.setItem('lifeos_ai_automations', JSON.stringify(defaultRules));
    }

    // 3. Load Memories
    const cachedMemory = localStorage.getItem('lifeos_ai_memory');
    if (cachedMemory) {
      setMemories(JSON.parse(cachedMemory));
    } else {
      const defaultMemory: MemoryItem[] = [
        { key: 'preferred_wakeup', value: '07:30 AM', label: 'Wake-up Time' },
        { key: 'budget_limit', value: '$1,200 / Month', label: 'Monthly Budget Threshold' },
        { key: 'writing_style', value: 'Concise, Professional Bulletins', label: 'Communication Tone' },
        { key: 'favorite_project', value: 'Semester 4 Engineering Project', label: 'High Priority Project' },
        { key: 'timezone', value: 'America/New_York (EST)', label: 'Operational Timezone' },
      ];
      setMemories(defaultMemory);
      localStorage.setItem('lifeos_ai_memory', JSON.stringify(defaultMemory));
    }
  }, [user]);

  // Persist Automations
  useEffect(() => {
    if (automations.length > 0) {
      localStorage.setItem('lifeos_ai_automations', JSON.stringify(automations));
    }
  }, [automations]);

  // Persist Memories
  useEffect(() => {
    if (memories.length > 0) {
      localStorage.setItem('lifeos_ai_memory', JSON.stringify(memories));
    }
  }, [memories]);

  // Mic waveform simulator
  useEffect(() => {
    let interval: any;
    if (isVoiceActive) {
      interval = setInterval(() => {
        setMicPulseLevel(Math.floor(Math.random() * 80) + 10);
      }, 100);
    } else {
      setMicPulseLevel(0);
    }
    return () => clearInterval(interval);
  }, [isVoiceActive]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading, thinkingSteps, pendingDestructive]);

  // Extract <COMMAND_BLOCK> safely
  const parseServerResponse = (rawText: string): { cleanText: string; actions: any[] } => {
    const startTag = '<COMMAND_BLOCK>';
    const endTag = '</COMMAND_BLOCK>';

    const startIdx = rawText.indexOf(startTag);
    const endIdx = rawText.indexOf(endTag);

    if (startIdx !== -1 && endIdx !== -1) {
      const cleanText = (rawText.substring(0, startIdx) + rawText.substring(endIdx + endTag.length)).trim();
      const jsonStr = rawText.substring(startIdx + startTag.length, endIdx).trim();

      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.actions && Array.isArray(parsed.actions)) {
          return { cleanText, actions: parsed.actions };
        } else if (parsed.action) {
          return { cleanText, actions: [parsed] };
        }
      } catch (err) {
        console.error('Failed to unpack command block JSON', err);
      }
      return { cleanText, actions: [] };
    }

    return { cleanText: rawText, actions: [] };
  };

  // Check if an action is destructive
  const isActionDestructive = (action: string): boolean => {
    const dangerous = ['delete_task', 'delete_note', 'delete_finance', 'delete_file', 'clear_workspace', 'sign_out'];
    return dangerous.includes(action);
  };

  // Perform backend mutations in global state
  const executeCoreAction = (actionName: string, payload: any): 'executed' | 'failed' => {
    try {
      switch (actionName) {
        case 'create_task': {
          const newTask: Task = {
            id: `task_${Date.now()}`,
            title: payload.title || 'AI Task Brief',
            description: payload.description || 'Drafted via Natural Language Intelligent Core.',
            priority: payload.priority || 'medium',
            category: payload.category || 'General',
            tags: payload.tags || ['AI'],
            deadline: payload.deadline || undefined,
            isCompleted: false,
            progress: 0,
            subtasks: [],
            attachments: [],
            createdAt: new Date().toISOString(),
          };
          setTasks((prev) => [newTask, ...prev]);
          break;
        }

        case 'update_task': {
          setTasks((prev) =>
            prev.map((t) => (t.id === payload.id ? { ...t, ...payload } : t))
          );
          break;
        }

        case 'delete_task': {
          setTasks((prev) => prev.filter((t) => t.id !== payload.id));
          break;
        }

        case 'create_event': {
          const newEvent: CalendarEvent = {
            id: `evt_${Date.now()}`,
            title: payload.title || 'AI Scheduled Meeting',
            description: payload.description || 'Organized via Intelligent Core.',
            start: payload.start || new Date().toISOString(),
            end: payload.end || new Date(Date.now() + 3600000).toISOString(),
            category: payload.category || 'work',
            isRecurring: false,
          };
          setEvents((prev) => [newEvent, ...prev]);
          break;
        }

        case 'update_event': {
          setEvents((prev) =>
            prev.map((e) => (e.id === payload.id ? { ...e, ...payload } : e))
          );
          break;
        }

        case 'cancel_event': {
          setEvents((prev) => prev.filter((e) => e.id !== payload.id));
          break;
        }

        case 'create_note': {
          const newNote: Note = {
            id: `note_${Date.now()}`,
            title: payload.title || 'AI Draft Note',
            content: payload.content || '# Scratchpad\n\nNotes logged via Intelligent Core.',
            folder: payload.folder || 'Ideas',
            tags: payload.tags || ['AI'],
            isFavorite: false,
            isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setNotes((prev) => [newNote, ...prev]);
          break;
        }

        case 'update_note': {
          setNotes((prev) =>
            prev.map((n) => (n.id === payload.id ? { ...n, ...payload, updatedAt: new Date().toISOString() } : n))
          );
          break;
        }

        case 'delete_note': {
          setNotes((prev) => prev.filter((n) => n.id !== payload.id));
          break;
        }

        case 'create_study_exam': {
          const subName = payload.subjectName || 'General';
          let sub = subjects.find((s) => s.name.toLowerCase() === subName.toLowerCase());
          let subId = sub?.id;

          if (!subId) {
            const newSubId = `sub_${Date.now()}`;
            const newSub: StudySubject = {
              id: newSubId,
              name: subName,
              credits: 3,
              color: 'indigo',
              gpaGoal: 4.0,
            };
            setSubjects((prev) => [...prev, newSub]);
            subId = newSubId;
          }

          const newExam: ExamSchedule = {
            id: `ex_${Date.now()}`,
            subjectId: subId,
            title: payload.examTitle || 'Planned Exam',
            date: payload.date || '2026-07-25',
          };
          setExams((prev) => [newExam, ...prev]);
          break;
        }

        case 'create_study_session': {
          const subName = payload.subjectName || 'General';
          let sub = subjects.find((s) => s.name.toLowerCase() === subName.toLowerCase());
          let subId = sub?.id;

          if (!subId) {
            const newSubId = `sub_${Date.now()}`;
            const newSub: StudySubject = {
              id: newSubId,
              name: subName,
              credits: 3,
              color: 'indigo',
              gpaGoal: 4.0,
            };
            setSubjects((prev) => [...prev, newSub]);
            subId = newSubId;
          }

          const newSession: StudySession = {
            id: `session_${Date.now()}`,
            subjectId: subId,
            durationMs: payload.durationMs || 7200000,
            notes: payload.notes || 'Logged via AI Core Voice/Chat',
            date: new Date().toISOString().split('T')[0],
          };
          setSessions((prev) => [newSession, ...prev]);
          break;
        }

        case 'add_finance': {
          const newTransaction: FinanceTransaction = {
            id: `tr_${Date.now()}`,
            title: payload.notes || 'AI Ledger Item',
            notes: payload.notes || 'AI Ledger Item',
            amount: payload.amount || 0,
            type: payload.type || 'expense',
            category: payload.category || 'tech',
            date: new Date().toISOString().split('T')[0],
            isRecurring: false,
          };
          setTransactions((prev) => [newTransaction, ...prev]);
          break;
        }

        case 'delete_finance': {
          setTransactions((prev) => prev.filter((t) => t.id !== payload.id));
          break;
        }

        case 'create_habit': {
          const newHabit: Habit = {
            id: `habit_${Date.now()}`,
            name: payload.name || 'AI Habit Tracker',
            frequency: payload.frequency || 'daily',
            streak: 0,
            history: [],
            createdAt: new Date().toISOString(),
          };
          setHabits((prev) => [newHabit, ...prev]);
          break;
        }

        case 'log_habit': {
          const logDate = payload.date || new Date().toISOString().split('T')[0];
          setHabits((prev) =>
            prev.map((h) => {
              if (h.id === payload.id) {
                if (h.history.includes(logDate)) return h;
                return {
                  ...h,
                  history: [...h.history, logDate],
                  streak: h.streak + 1,
                };
              }
              return h;
            })
          );
          break;
        }

        case 'delete_habit': {
          setHabits((prev) => prev.filter((h) => h.id !== payload.id));
          break;
        }

        case 'create_goal': {
          const newGoal: Goal = {
            id: `goal_${Date.now()}`,
            title: payload.title || 'AI Planned Goal',
            description: payload.description || 'Target outline created via Intelligent Core.',
            type: payload.type || 'short-term',
            deadline: payload.deadline || new Date().toISOString().split('T')[0],
            milestones: (payload.milestones || []).map((title: string, index: number) => ({
              id: `milestone_${Date.now()}_${index}`,
              title,
              isCompleted: false,
            })),
            progress: 0,
            createdAt: new Date().toISOString(),
          };
          setGoals((prev) => [newGoal, ...prev]);
          break;
        }

        case 'open_file': {
          setSelectedFileId(payload.id);
          setActiveTab('google-workspace');
          break;
        }

        case 'rename_file': {
          setFiles((prev) =>
            prev.map((f) => (f.id === payload.id ? { ...f, name: payload.newName } : f))
          );
          break;
        }

        case 'move_file': {
          setFiles((prev) =>
            prev.map((f) => (f.id === payload.id ? { ...f, folder: payload.newFolder } : f))
          );
          break;
        }

        case 'delete_file': {
          setFiles((prev) => prev.filter((f) => f.id !== payload.id));
          break;
        }

        case 'create_folder': {
          // Folder creations are reflected inside the Files tree naturally
          break;
        }

        case 'change_tab': {
          setActiveTab(payload.tabName);
          break;
        }

        case 'create_automation': {
          const newRule: AutomationRule = {
            id: `auto_${Date.now()}`,
            trigger: payload.trigger,
            action: payload.actionText,
            active: true,
          };
          setAutomations((prev) => [...prev, newRule]);
          break;
        }

        case 'update_memory': {
          setMemories((prev) => {
            const exists = prev.some((m) => m.key === payload.key);
            if (exists) {
              return prev.map((m) => (m.key === payload.key ? { ...m, value: payload.value } : m));
            } else {
              return [...prev, { key: payload.key, value: payload.value, label: payload.label || payload.key }];
            }
          });
          break;
        }

        case 'clear_workspace': {
          setTasks([]);
          setEvents([]);
          setNotes([]);
          setExams([]);
          setSessions([]);
          setHabits([]);
          setGoals([]);
          setTransactions([]);
          setBookmarks([]);
          setFiles([]);
          break;
        }

        case 'sign_out': {
          handleLogout();
          break;
        }

        default:
          return 'failed';
      }
      return 'executed';
    } catch (e) {
      console.error(e);
      return 'failed';
    }
  };

  // Speak assistant text using webSpeechAPI
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Submit/Send query handler
  const handleQuerySend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const queryText = textToSend.trim();
    setInput('');
    setLoading(true);

    // Initial simulated progress steps
    setThinkingSteps([
      { label: 'Analyzing natural language core requests...', status: 'loading' },
      { label: 'Formulating authorized Workspace Context payload...', status: 'pending' },
      { label: 'Reclaiming neural database associations...', status: 'pending' },
    ]);

    // Add user message to history
    const userMsg: Message = { role: 'user', text: queryText };
    
    // Rename chat if first user message
    if (activeChat && activeChat.title === 'New Chat') {
      const firstTitle = queryText.length > 25 ? queryText.substring(0, 25) + '...' : queryText;
      setChats((prev) => prev.map((c) => (c.id === activeChatId ? { ...c, title: firstTitle } : c)));
    }

    setHistory((prev) => [...prev, userMsg]);

    // Active file binding
    const activeFileItem = files.find((f) => f.id === selectedFileId);

    // Format Memories for Context
    const memoryObj: { [key: string]: string } = {};
    memories.forEach((m) => {
      memoryObj[m.key] = m.value;
    });

    // Formulate Context
    const workspaceContext = {
      activeTab,
      activeFileId: selectedFileId || 'none',
      activeFileName: activeFileItem ? activeFileItem.name : 'none',
      activeFileType: activeFileItem ? activeFileItem.type : 'none',
      activeFileContent: activeFileItem ? (activeFileItem.url || 'Confidential document context') : 'none',
      currentTime: new Date().toISOString(),
      memory: memoryObj,
    };

    try {
      // Step 2 timer
      setTimeout(() => {
        setThinkingSteps((prev) => [
          { ...prev[0], status: 'done' },
          { ...prev[1], status: 'loading' },
          prev[2],
        ]);
      }, 500);

      // Step 3 timer
      setTimeout(() => {
        setThinkingSteps((prev) => [
          prev[0],
          { ...prev[1], status: 'done' },
          { ...prev[2], status: 'loading' },
        ]);
      }, 1000);

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: history.map((h) => ({
            role: h.role,
            parts: [{ text: h.text }],
          })),
          workspaceContext,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Finish loaders
      setThinkingSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));

      const { cleanText, actions } = parseServerResponse(data.text);

      // Trigger TTS if enabled
      if (isVoiceRepliesEnabled) {
        speakText(cleanText);
      }

      // Track actions layout
      const detectedActionsList = actions.map((act) => {
        const destructive = isActionDestructive(act.action);
        return {
          action: act.action,
          payload: act.payload,
          status: destructive ? ('pending' as const) : ('executed' as const),
        };
      });

      // Update message history with model message
      const modelMessage: Message = {
        role: 'model',
        text: cleanText,
        actionsDetected: detectedActionsList,
      };

      setHistory((prev) => [...prev, modelMessage]);

      // Execute non-destructive actions immediately
      actions.forEach((act, idx) => {
        if (!isActionDestructive(act.action)) {
          executeCoreAction(act.action, act.payload);
        } else {
          // Destructive action found: queue for user confirmation
          setPendingDestructive({
            messageIndex: history.length + 1, // index of next model msg added
            actionIndex: idx,
            action: act.action,
            payload: act.payload,
          });
        }
      });
    } catch (err: any) {
      console.error(err);
      setHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: `Neural connection to Core Brain disrupted: ${err.message || 'Make sure GEMINI_API_KEY is configured.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Authorize Destructive Action
  const authorizeDestructiveAction = () => {
    if (!pendingDestructive) return;

    const { messageIndex, actionIndex, action, payload } = pendingDestructive;
    const status = executeCoreAction(action, payload);

    setHistory((prev) => {
      const updated = [...prev];
      const msg = updated[messageIndex];
      if (msg && msg.actionsDetected) {
        msg.actionsDetected[actionIndex].status = status;
      }
      return updated;
    });

    setPendingDestructive(null);
  };

  // Deny Destructive Action
  const denyDestructiveAction = () => {
    if (!pendingDestructive) return;

    const { messageIndex, actionIndex } = pendingDestructive;

    setHistory((prev) => {
      const updated = [...prev];
      const msg = updated[messageIndex];
      if (msg && msg.actionsDetected) {
        msg.actionsDetected[actionIndex].status = 'denied';
      }
      return updated;
    });

    setPendingDestructive(null);
  };

  // Standard trigger templates
  const sampleTriggers = [
    { title: 'I studied for 2 hours', text: 'I studied for two hours today' },
    { title: 'I have an exam next Monday', text: 'I have a computer science exam next Monday' },
    { title: 'Add dynamic $15 coffee expense', text: 'Add an expense of $15.00 for client coffee' },
    { title: 'Summarize current document', text: 'Summarize the contents of this file' },
  ];

  // Voice recognition toggler
  const toggleVoiceMode = () => {
    if (isVoiceActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceActive(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Your current browser environment does not support web SpeechRecognition.');
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsVoiceActive(true);
      };

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setInput(text);
        // Wake-phrase logic or direct submit
        if (text.toLowerCase().includes('hey core') || text.toLowerCase().includes('hey lifeos')) {
          const cleanedText = text.replace(/hey core/gi, '').replace(/hey lifeos/gi, '').trim();
          handleQuerySend(cleanedText);
        } else {
          handleQuerySend(text);
        }
      };

      rec.onerror = (e: any) => {
        setIsVoiceActive(false);
        const errorType = e.error || 'unknown';
        let friendlyMessage = 'Voice input session ended.';
        
        if (errorType === 'not-allowed') {
          friendlyMessage = 'Microphone access was denied or is restricted in this frame. Please check your browser microphone permission settings or try opening the app in a new tab.';
        } else if (errorType === 'no-speech') {
          friendlyMessage = 'No speech was detected. Please try speaking again.';
        } else if (errorType === 'network') {
          friendlyMessage = 'A network error occurred during speech recognition. Please check your internet connection.';
        }

        setHistory((prev) => [
          ...prev,
          {
            role: 'model',
            text: `⚠️ Voice Assistance: ${friendlyMessage} (System code: ${errorType})`
          }
        ]);
      };

      rec.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Add automation manually
  const handleAddAutomation = () => {
    if (!newTrigger.trim() || !newAction.trim()) return;
    const newRule: AutomationRule = {
      id: `auto_${Date.now()}`,
      trigger: newTrigger,
      action: newAction,
      active: true,
    };
    setAutomations((prev) => [...prev, newRule]);
    setNewTrigger('');
    setNewAction('');
  };

  // Delete automation rule
  const handleDeleteAutomation = (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  };

  // Toggle automation rule state
  const handleToggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  // Add Memory Preference Item manually
  const handleAddMemory = () => {
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    const label = newMemLabel.trim() || newMemKey.trim();
    const key = newMemKey.toLowerCase().replace(/\s+/g, '_');
    setMemories((prev) => [...prev, { key, value: newMemVal, label }]);
    setNewMemKey('');
    setNewMemVal('');
    setNewMemLabel('');
  };

  // Delete learned memory
  const handleDeleteMemory = (key: string) => {
    setMemories((prev) => prev.filter((m) => m.key !== key));
  };

  // Simulation runner for triggers
  const runAutomationSimulation = (rule: AutomationRule) => {
    setTriggeredAutomationText(rule.action);
    if ('speechSynthesis' in window && isVoiceRepliesEnabled) {
      speakText(`Automation active: ${rule.action}`);
    }
    setTimeout(() => {
      setTriggeredAutomationText(null);
    }, 3200);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col xl:flex-row rounded-[24px] border border-zinc-800/10 dark:border-zinc-800/40 overflow-hidden bg-zinc-500/1 backdrop-blur-3xl text-left shadow-2xl relative">
      
      {/* Simulation Banner notification */}
      <AnimatePresence>
        {triggeredAutomationText && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 border border-indigo-400 text-white rounded-2xl px-6 py-3.5 shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2"
          >
            <Zap className="text-amber-400 animate-bounce" size={16} />
            <span>Automation Rule Fired: "{triggeredAutomationText}" successfully completed!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Prompt and controls sidebar panel (Left) */}
      <div className="w-full xl:w-72 border-r border-zinc-850 p-4 space-y-4 shrink-0 bg-zinc-950/20 flex flex-col justify-between custom-scrollbar overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={15} className="text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Intelligent Core</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono text-[9px] font-bold border border-indigo-500/15">
              v3.5 Live
            </div>
          </div>

          {/* Saved Chats Session manager list */}
          <div className="space-y-2 pt-2 border-b border-zinc-800/40 pb-4">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] uppercase font-mono font-bold text-zinc-500 flex items-center gap-1.5 select-none">
                <MessageSquare size={11} /> Saved Chats
              </h5>
              <button
                onClick={handleCreateNewChat}
                className="p-1 rounded-lg hover:bg-zinc-800/60 text-indigo-400 hover:text-indigo-300 transition-all flex items-center justify-center border border-indigo-500/10"
                title="New Conversation"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {chats.map((c) => {
                const isActive = c.id === activeChatId;
                const isEditing = editingChatId === c.id;

                return (
                  <div
                    key={c.id}
                    className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-200 font-semibold'
                        : 'hover:bg-zinc-800/30 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingChatTitle}
                        onChange={(e) => setEditingChatTitle(e.target.value)}
                        onBlur={() => handleSaveRename(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(c.id);
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                        className="bg-zinc-900 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 text-xs w-full outline-none font-sans"
                        autoFocus
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => setActiveChatId(c.id)}
                          className="flex-1 text-left truncate pr-2"
                        >
                          {c.title}
                        </button>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(c.id);
                              setEditingChatTitle(c.title);
                            }}
                            className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                            title="Rename"
                          >
                            <FileText size={10} />
                          </button>
                          {chats.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteChat(c.id, e)}
                              className="p-0.5 rounded hover:bg-zinc-800 text-rose-500 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Triggers Console */}
          <div className="space-y-2.5 pt-2">
            <h5 className="text-[10px] uppercase font-mono font-bold text-zinc-500 flex items-center gap-1.5 select-none">
              <Terminal size={11} /> Ready Triggers
            </h5>
            <div className="grid grid-cols-1 gap-2">
              {sampleTriggers.map((trig, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => handleQuerySend(trig.text)}
                  className={`w-full text-left p-3 rounded-2xl border text-[11px] leading-relaxed transition-all flex items-center justify-between gap-1.5 ${
                    theme === 'dark'
                      ? 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40 hover:border-zinc-700 text-zinc-300'
                      : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold text-zinc-400 block text-[9px] uppercase font-mono mb-0.5">Scenario {idx + 1}</span>
                    <span className="truncate">"{trig.title}"</span>
                  </div>
                  <ArrowRight size={11} className="shrink-0 text-indigo-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Core Analytics Tracker widget */}
          <div className="p-3 bg-white/[0.01] border border-zinc-800/30 rounded-2xl space-y-2">
            <h6 className="text-[9px] uppercase font-mono font-bold text-zinc-500">Core Brain Metrics</h6>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-black/30 p-2 rounded-xl text-left border border-white/5">
                <span className="text-zinc-500 text-[8px] block uppercase">Tasks Online</span>
                <span className="text-indigo-400 font-bold text-xs">{tasks.length}</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl text-left border border-white/5">
                <span className="text-zinc-500 text-[8px] block uppercase">Schedule Blocks</span>
                <span className="text-emerald-400 font-bold text-xs">{events.length}</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl text-left border border-white/5">
                <span className="text-zinc-500 text-[8px] block uppercase">Knowledge Notes</span>
                <span className="text-amber-400 font-bold text-xs">{notes.length}</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl text-left border border-white/5">
                <span className="text-zinc-500 text-[8px] block uppercase">Active Rules</span>
                <span className="text-purple-400 font-bold text-xs">{automations.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clear workspace trigger */}
        <div className="space-y-2 pt-4 border-t border-zinc-800/40">
          <button
            onClick={() => handleQuerySend("Clear the workspace logs and reset database")}
            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/10 text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1"
          >
            <Trash2 size={11} /> WRECK CONSOLE (RESET)
          </button>
          <div className="text-[10px] text-zinc-500 font-mono leading-relaxed text-center">
            System Local: Monday, July 20, 2026.
          </div>
        </div>
      </div>

      {/* 2. Main Console display panel with Tabs (Right) */}
      <div className="flex-1 flex flex-col bg-zinc-950/25 justify-between relative overflow-hidden">
        
        {/* Navigation Tabs bar */}
        <div className="p-3 border-b border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 z-10 text-left">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cpu size={13} /> Chat Core
            </button>
            <button
              onClick={() => setActiveSubTab('automations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'automations'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap size={13} /> Automations Hub
            </button>
            <button
              onClick={() => setActiveSubTab('memory')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'memory'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Brain size={13} /> Memory Bank
            </button>
          </div>

          {/* Context bar display */}
          <div className="flex items-center gap-2.5 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800/40 text-[10px] font-mono text-zinc-400 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5">
              <Compass size={11} className="text-emerald-400 shrink-0" />
              <span>Active Screen: <strong className="text-zinc-200">{activeTab.toUpperCase()}</strong></span>
            </div>
            {selectedFileId && (
              <div className="h-2.5 w-[1px] bg-zinc-800 shrink-0 hidden sm:block"></div>
            )}
            {selectedFileId && (
              <div className="hidden sm:flex items-center gap-1">
                <FileText size={11} className="text-indigo-400" />
                <span className="truncate max-w-[100px] text-zinc-300">
                  {files.find((f) => f.id === selectedFileId)?.name || 'Untitled doc'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Display Area */}
        {activeSubTab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Scrollable Messages Wrapper */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
              <div className="space-y-4 max-w-4xl mx-auto">
                {/* Messages wrapper */}
                <div className="flex-1 space-y-4 pb-20">
                {history.map((msg, msgIdx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msgIdx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} text-left`}>
                      <div className="max-w-[90%] sm:max-w-2xl space-y-2">
                        <div
                          className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                            isUser
                              ? 'bg-indigo-600 text-white font-medium rounded-br-none shadow-md shadow-indigo-600/10'
                              : theme === 'dark'
                              ? 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-200 rounded-bl-none shadow-lg'
                              : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none shadow-md'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Renders parsed command layout */}
                        {!isUser && msg.actionsDetected && msg.actionsDetected.length > 0 && (
                          <div className="space-y-2">
                            {msg.actionsDetected.map((act, actIdx) => {
                              const isDestructive = isActionDestructive(act.action);
                              return (
                                <div
                                  key={actIdx}
                                  className={`rounded-2xl border p-3 flex flex-col gap-2.5 transition-all text-left ${
                                    act.status === 'executed'
                                      ? 'border-emerald-500/20 bg-emerald-500/5'
                                      : act.status === 'pending'
                                      ? 'border-amber-500/20 bg-amber-500/5'
                                      : act.status === 'denied'
                                      ? 'border-zinc-800/30 bg-zinc-900/40 text-zinc-500'
                                      : 'border-rose-500/20 bg-rose-500/5'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      {act.status === 'executed' && (
                                        <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                                      )}
                                      {act.status === 'pending' && (
                                        <RefreshCw size={13} className="text-amber-400 animate-spin shrink-0" />
                                      )}
                                      {(act.status === 'failed' || act.status === 'denied') && (
                                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                                      )}
                                      <div className="overflow-hidden">
                                        <span
                                          className={`text-[9px] font-black uppercase tracking-widest font-mono ${
                                            act.status === 'executed'
                                              ? 'text-emerald-400'
                                              : act.status === 'pending'
                                              ? 'text-amber-400 animate-pulse'
                                              : 'text-zinc-500'
                                          }`}
                                        >
                                          {act.status === 'executed'
                                            ? 'Operation Complete'
                                            : act.status === 'pending'
                                            ? 'Authorization Required'
                                            : 'Operation Aborted'}
                                        </span>
                                        <h5 className="font-bold text-xs truncate text-zinc-200 mt-0.5 capitalize">
                                          {act.action.replace('_', ' ')}
                                        </h5>
                                      </div>
                                    </div>

                                    {/* Action description / stats */}
                                    <span className="text-[10px] font-mono text-zinc-500 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                                      {isDestructive ? '⚠️ HIGH IMPACT' : 'AUTOMATED'}
                                    </span>
                                  </div>

                                  {/* Action Payload Metadata Box */}
                                  <div className="p-2.5 bg-black/45 rounded-xl border border-white/5 font-mono text-[10px] text-zinc-400 space-y-1">
                                    {Object.entries(act.payload || {}).map(([k, v]: any) => (
                                      <div key={k} className="flex gap-2">
                                        <span className="text-zinc-500 uppercase font-bold w-20 shrink-0">{k}:</span>
                                        <span className="text-zinc-200 truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Intercept confirmation inline buttons for destructive actions */}
                                  {act.status === 'pending' && pendingDestructive && (
                                    <div className="flex gap-2.5 pt-1.5">
                                      <button
                                        onClick={authorizeDestructiveAction}
                                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/25"
                                      >
                                        <Lock size={12} /> Confirm Destructive Action
                                      </button>
                                      <button
                                        onClick={denyDestructiveAction}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-xl text-[11px] font-bold transition-all"
                                      >
                                        Abort
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Simulated Core Thinking steps progress */}
                {loading && (
                  <div className="flex justify-start text-left">
                    <div className="max-w-xl p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl rounded-bl-none shadow-lg space-y-3">
                      <div className="flex items-center gap-2.5">
                        <RefreshCw size={13} className="animate-spin text-indigo-400 shrink-0" />
                        <span className="text-xs font-mono font-black uppercase text-zinc-400 tracking-wider">
                          Thinking & Automating Workflow...
                        </span>
                      </div>

                      <div className="space-y-1.5 border-t border-zinc-800/40 pt-2.5 font-mono text-[10px] text-zinc-400">
                        {thinkingSteps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2">
                            {step.status === 'done' ? (
                              <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            ) : step.status === 'loading' ? (
                              <span className="text-indigo-400 animate-pulse font-bold shrink-0">●</span>
                            ) : (
                              <span className="text-zinc-600 font-bold shrink-0">○</span>
                            )}
                            <span className={step.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Stationary bottom inputs layout */}
          <div className="p-4 border-t border-zinc-850 bg-[#02040a]/80 backdrop-blur-md z-10 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleQuerySend(input);
                  }}
                  className="flex items-center gap-3 relative max-w-4xl mx-auto"
                >
                  {/* Voice input mic triggers */}
                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    className={`p-3 rounded-2xl border transition-all relative ${
                      isVoiceActive
                        ? 'bg-rose-500 border-rose-400 text-white animate-pulse shadow-md shadow-rose-950/20'
                        : theme === 'dark'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {isVoiceActive ? <MicOff size={15} /> : <Mic size={15} />}
                    {isVoiceActive && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    )}
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={
                        isVoiceActive
                          ? "Listening... Speak now (or say 'Hey Core...')"
                          : "Query Intelligent Core (e.g. Schedule meeting tomorrow at 2 PM)..."
                      }
                      value={input}
                      disabled={loading}
                      onChange={(e) => setInput(e.target.value)}
                      className={`w-full pl-4 pr-12 py-3.5 text-xs sm:text-sm rounded-2xl border outline-none font-sans ${
                        theme === 'dark'
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50'
                          : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-indigo-500/50'
                      }`}
                    />
                    
                    {/* Visual Mic wave elements when listening */}
                    {isVoiceActive && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 h-3">
                        <div className="w-[1.5px] bg-white rounded-full transition-all" style={{ height: `${micPulseLevel * 0.15}px` }}></div>
                        <div className="w-[1.5px] bg-white rounded-full transition-all animate-pulse" style={{ height: `${micPulseLevel * 0.3}px` }}></div>
                        <div className="w-[1.5px] bg-white rounded-full transition-all" style={{ height: `${micPulseLevel * 0.1}px` }}></div>
                      </div>
                    )}
                  </div>

                  {/* Submission and speech-output controls toggle block */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsVoiceRepliesEnabled(!isVoiceRepliesEnabled);
                        if (!isVoiceRepliesEnabled) {
                          speakText("Voice mode enabled");
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all ${
                        isVoiceRepliesEnabled
                          ? 'bg-indigo-600/15 border-indigo-500/20 text-indigo-400'
                          : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-400'
                      }`}
                      title="Toggle Voice Answers (TTS)"
                    >
                      {isVoiceRepliesEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all disabled:opacity-30 disabled:scale-100"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">

          {/* Automations Hub Panel */}
          {activeSubTab === 'automations' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Automation Vision statement */}
              <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
                    <Zap size={11} /> Universal Automation Engine
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Configure operational rules triggered by specific events. You can manage rules visually below or create rules simply by describing them to the AI Assistant.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-xl border border-white/5 font-mono text-[9px] text-zinc-500 select-none font-black">
                  OPERATIONAL: TRUE
                </div>
              </div>

              {/* Creator board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Active Rules List */}
                <div className="md:col-span-2 space-y-3">
                  <h5 className="text-[10px] uppercase font-mono font-bold text-zinc-500 select-none text-left flex items-center gap-1.5">
                    <Database size={11} /> Current Operating Rules ({automations.length})
                  </h5>
                  
                  {automations.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-4 text-left ${
                        rule.active
                          ? 'bg-zinc-900/40 border-zinc-800'
                          : 'bg-black/20 border-zinc-850 opacity-55'
                      }`}
                    >
                      <div className="space-y-2.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${rule.active ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-600'}`} />
                          <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            Rule: {rule.id}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-zinc-400 font-mono">
                            <span className="text-zinc-500 uppercase text-[9px] font-black mr-1">[IF]</span> {rule.trigger}
                          </p>
                          <p className="text-xs text-indigo-400 font-mono">
                            <span className="text-zinc-500 uppercase text-[9px] font-black mr-1">[THEN]</span> {rule.action}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Simulation trigger */}
                        <button
                          onClick={() => runAutomationSimulation(rule)}
                          disabled={!rule.active}
                          className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-30 rounded-xl border border-indigo-500/10 transition-all text-[10px] text-indigo-400 flex items-center gap-1 font-mono font-bold"
                          title="Simulate Event"
                        >
                          <Play size={11} /> Sim
                        </button>

                        {/* Toggle active state */}
                        <button
                          onClick={() => handleToggleAutomation(rule.id)}
                          className={`p-2 rounded-xl border transition-all text-xs font-bold ${
                            rule.active
                              ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400'
                              : 'bg-zinc-800/40 border-white/5 text-zinc-500'
                          }`}
                        >
                          {rule.active ? 'Active' : 'Muted'}
                        </button>

                        <button
                          onClick={() => handleDeleteAutomation(rule.id)}
                          className="p-2 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-xl border border-transparent hover:border-rose-500/10 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Automation Creator Form */}
                <div className="p-4 rounded-3xl bg-white/[0.01] border border-zinc-800/40 space-y-4 text-left h-fit">
                  <h5 className="text-[10px] uppercase font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                    <Plus size={12} /> Construct Rule
                  </h5>

                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">Trigger Event (IF)</label>
                      <input
                        type="text"
                        placeholder="e.g., When I upload lecture PDFs"
                        value={newTrigger}
                        onChange={(e) => setNewTrigger(e.target.value)}
                        className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">Action Resolution (THEN)</label>
                      <input
                        type="text"
                        placeholder="e.g., Put them in Semester 4"
                        value={newAction}
                        onChange={(e) => setNewAction(e.target.value)}
                        className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl outline-none"
                      />
                    </div>

                    <button
                      onClick={handleAddAutomation}
                      disabled={!newTrigger.trim() || !newAction.trim()}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-40"
                    >
                      Authorize Rule Creation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Memory Bank Panel */}
          {activeSubTab === 'memory' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Vision block */}
              <div className="p-4 rounded-3xl bg-purple-500/5 border border-purple-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-xs text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1">
                    <Brain size={11} /> Cognitive Memory Bank
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    View learned variables, work hours, budgets, and communication tone. These are dynamically updated during natural conversations or edited manually.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-xl border border-white/5 font-mono text-[9px] text-zinc-500 select-none font-bold">
                  KNOWLEDGE KEYS: {memories.length}
                </div>
              </div>

              {/* Memory Inspector list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Fact list view */}
                <div className="md:col-span-2 space-y-3">
                  <h5 className="text-[10px] uppercase font-mono font-bold text-zinc-500 select-none text-left flex items-center gap-1.5">
                    <Database size={11} /> Active Knowledge Variables
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {memories.map((mem) => (
                      <div
                        key={mem.key}
                        className="p-4 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex items-start justify-between gap-3 text-left"
                      >
                        <div className="space-y-2 overflow-hidden">
                          <span className="font-mono text-[9px] text-indigo-400 font-bold uppercase tracking-widest block">
                            Key: {mem.key}
                          </span>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-tight">{mem.label}</span>
                            <p className="text-xs font-medium text-zinc-300 font-mono break-all">{mem.value}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMemory(mem.key)}
                          className="p-1.5 hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 rounded-xl transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Memory Injector Form */}
                <div className="p-4 rounded-3xl bg-white/[0.01] border border-zinc-800/40 space-y-4 text-left h-fit">
                  <h5 className="text-[10px] uppercase font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                    <Plus size={12} /> Record Preference
                  </h5>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">Preference Name (Label)</label>
                      <input
                        type="text"
                        placeholder="e.g. Budget Threshold"
                        value={newMemLabel}
                        onChange={(e) => {
                          setNewMemLabel(e.target.value);
                          if (!newMemKey) {
                            setNewMemKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                          }
                        }}
                        className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">Identifier Key (Auto)</label>
                      <input
                        type="text"
                        placeholder="e.g. budget_limit"
                        value={newMemKey}
                        onChange={(e) => setNewMemKey(e.target.value)}
                        className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">Preference Value</label>
                      <input
                        type="text"
                        placeholder="e.g. $1,500/month"
                        value={newMemVal}
                        onChange={(e) => setNewMemVal(e.target.value)}
                        className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl outline-none"
                      />
                    </div>

                    <button
                      onClick={handleAddMemory}
                      disabled={!newMemKey.trim() || !newMemVal.trim()}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-40"
                    >
                      Record Variable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
      </div>
    </div>
  );
}
