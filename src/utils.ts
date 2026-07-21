/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Note, CalendarEvent, Habit, StudySubject, StudyAssignment, QuizTracker, ExamSchedule, StudySession, Goal, Transaction, UserProfile, UserSettings, FileItem, NotificationItem } from './types';

// Baseline date helper for 2026-07-19
export const BASELINE_DATE = '2026-07-19';

export function getRelativeDateString(daysOffset: number): string {
  const date = new Date(BASELINE_DATE);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initial Data Seed
export const DEFAULT_PROFILE: UserProfile = {
  id: 'user_1',
  email: 'ldreamer669@gmail.com',
  fullName: 'Leo Dreamer',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Full Stack Engineer & Creative Designer. Architecting life workflows in LifeOS.',
  createdAt: '2026-01-15T00:00:00Z',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  language: 'English',
  timezone: 'America/Los_Angeles',
  notificationsEnabled: true,
  emailReminders: true,
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_1',
    title: 'Deploy LifeOS Server Core API',
    description: 'Integrate Express Vite bundle with Google GenAI SDK and bundle on port 3000.',
    priority: 'urgent',
    category: 'work',
    tags: ['Vite', 'NodeJS', 'AI'],
    deadline: getRelativeDateString(0), // Today
    reminder: '10:00',
    repeat: 'none',
    isCompleted: false,
    progress: 33,
    subtasks: [
      { id: 'sub_1_1', title: 'Mount Vite dev server middleware', isCompleted: true },
      { id: 'sub_1_2', title: 'Setup server-side Gemini 3.5 routing', isCompleted: false },
      { id: 'sub_1_3', title: 'Configure esbuild bundle task', isCompleted: false },
    ],
    attachments: ['server.ts', 'package.json'],
    createdAt: '2026-07-18T08:00:00Z',
  },
  {
    id: 'task_2',
    title: 'Study: Physics Final Prep - Thermomechanics',
    description: 'Read Chapter 12 and solve practice problems from Thermodynamics set.',
    priority: 'high',
    category: 'study',
    tags: ['Physics', 'Exam Prep'],
    deadline: getRelativeDateString(4), // 4 days from now
    reminder: '15:30',
    repeat: 'none',
    isCompleted: false,
    progress: 0,
    subtasks: [
      { id: 'sub_2_1', title: 'Review Carnot engine efficiencies', isCompleted: false },
      { id: 'sub_2_2', title: 'Solve 10 Chapter Review questions', isCompleted: false },
    ],
    attachments: ['physics_cheatsheet.pdf'],
    createdAt: '2026-07-18T10:00:00Z',
  },
  {
    id: 'task_3',
    title: 'Weekly Financial Portfolio Rebalancing',
    description: 'Update the LifeOS finance journal and transfer $250 to high-yield savings.',
    priority: 'medium',
    category: 'finance',
    tags: ['Budget', 'Savings'],
    deadline: getRelativeDateString(1), // Tomorrow
    reminder: '18:00',
    repeat: 'weekly',
    isCompleted: false,
    progress: 50,
    subtasks: [
      { id: 'sub_3_1', title: 'Review expense category allocations', isCompleted: true },
      { id: 'sub_3_2', title: 'Transfer savings goal budget', isCompleted: false },
    ],
    attachments: [],
    createdAt: '2026-07-19T06:00:00Z',
  },
  {
    id: 'task_4',
    title: 'Publish Design System on Figma Community',
    description: 'Figma-friendly export of modern glassmorphic buttons, inputs, widgets.',
    priority: 'low',
    category: 'personal',
    tags: ['Design', 'UIUX'],
    deadline: getRelativeDateString(6),
    reminder: '12:00',
    repeat: 'none',
    isCompleted: true,
    progress: 100,
    subtasks: [
      { id: 'sub_4_1', title: 'Format component tokens', isCompleted: true },
      { id: 'sub_4_2', title: 'Generate high-res cover template', isCompleted: true },
    ],
    attachments: ['design_system_cover.png'],
    createdAt: '2026-07-15T14:22:00Z',
  },
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt_1',
    title: 'LifeOS Product Architecture Review',
    description: 'Review fullstack API controllers, frontend routes and responsive performance testing.',
    start: `${getRelativeDateString(0)}T13:00:00`,
    end: `${getRelativeDateString(0)}T14:30:00`,
    category: 'work',
    isRecurring: false,
  },
  {
    id: 'evt_2',
    title: 'Linear Algebra Prep Session',
    description: 'Discuss vector projections, eigenvalues, and coordinate matrix transitions.',
    start: `${getRelativeDateString(1)}T10:00:00`,
    end: `${getRelativeDateString(1)}T12:00:00`,
    category: 'study',
    isRecurring: false,
  },
  {
    id: 'evt_3',
    title: 'Cardio Core Training',
    description: 'High intensity interval training at local stadium track.',
    start: `${getRelativeDateString(0)}T17:30:00`,
    end: `${getRelativeDateString(0)}T18:30:00`,
    category: 'personal',
    isRecurring: true,
    recurrence: 'daily',
  },
  {
    id: 'evt_4',
    title: 'Weekly Budget Audit',
    description: 'Align expenses against monthly savings goals and rebalance portfolio.',
    start: `${getRelativeDateString(3)}T16:00:00`,
    end: `${getRelativeDateString(3)}T17:00:00`,
    category: 'finance',
    isRecurring: true,
    recurrence: 'weekly',
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note_1',
    title: 'Product Launch Roadmap 🚀',
    content: `# LifeOS Product Launch Roadmap

## Stage 1: MVP Design Check
- Premium responsive glassmorphic CSS styling.
- Core pages completed (Tasks, Notes, Habits, Goals, Analytics, Settings, Files, Finance).
- Core interactive features: drag-and-drop widget reordering, pomodoro timers, global Ctrl+K search palette.

## Stage 2: Server Intelligence Proxy
- Configured \`gemini-3.5-flash\` connection.
- High intelligence command prompt parsing so users can type "I have an exam on July 25th" and immediately get matched to study tasks.

---
"Simplify workflows, compound atomic habits."
`,
    folder: 'Work',
    tags: ['LifeOS', 'Launch', 'Specs'],
    isFavorite: true,
    isPinned: true,
    createdAt: getRelativeDateString(-2) + 'T09:00:00Z',
    updatedAt: getRelativeDateString(0) + 'T14:10:00Z',
  },
  {
    id: 'note_2',
    title: 'Thermodynamics Formulas Summary 📖',
    content: `# Physics Final Cheat-Sheet: Thermodynamics

- **First Law of Thermodynamics:** $\\Delta U = Q - W$
- **Entropy Change:** $dS = \\frac{dQ}{T}$
- **Carnot Efficiency:** $\\eta_C = 1 - \\frac{T_C}{T_H}$
- **Ideal Gas Equation:** $PV = nRT$

Focus specifically on adiabatic expansion pathways and gas cycles (Otto, Diesel, Stirling).
`,
    folder: 'Study',
    tags: ['Physics', 'Thermodynamics', 'Equations'],
    isFavorite: false,
    isPinned: true,
    createdAt: getRelativeDateString(-5) + 'T11:00:00Z',
    updatedAt: getRelativeDateString(-1) + 'T16:00:00Z',
  },
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'hab_1',
    name: 'Read 10 Pages of Philosophy',
    frequency: 'daily',
    streak: 14,
    history: [
      getRelativeDateString(-4),
      getRelativeDateString(-3),
      getRelativeDateString(-2),
      getRelativeDateString(-1),
      getRelativeDateString(0),
    ],
    createdAt: getRelativeDateString(-20),
  },
  {
    id: 'hab_2',
    name: 'Diaphragmatic Deep Breathing (10m)',
    frequency: 'daily',
    streak: 8,
    history: [
      getRelativeDateString(-3),
      getRelativeDateString(-2),
      getRelativeDateString(-1),
      getRelativeDateString(0),
    ],
    createdAt: getRelativeDateString(-10),
  },
  {
    id: 'hab_3',
    name: 'Weekly Finance Balancing & Log',
    frequency: 'weekly',
    streak: 3,
    history: [
      getRelativeDateString(-14),
      getRelativeDateString(-7),
    ],
    createdAt: getRelativeDateString(-25),
  },
];

export const INITIAL_STUDY_SUBJECTS: StudySubject[] = [
  { id: 'sub_1', name: 'Physics AP', color: 'indigo', credits: 4, gpaGoal: 4.0 },
  { id: 'sub_2', name: 'Linear Algebra', color: 'emerald', credits: 3, gpaGoal: 3.8 },
  { id: 'sub_3', name: 'Human Psychology', color: 'amber', credits: 3, gpaGoal: 4.0 },
];

export const INITIAL_STUDY_ASSIGNMENTS: StudyAssignment[] = [
  { id: 'asg_1', subjectId: 'sub_1', title: 'Chapter 12 Thermocouples Problem Set', dueDate: getRelativeDateString(3), isCompleted: false },
  { id: 'asg_2', subjectId: 'sub_2', title: 'Vector Space Axioms proofs', dueDate: getRelativeDateString(1), isCompleted: true },
  { id: 'asg_3', subjectId: 'sub_3', title: 'Cognitive Behavioral Research Abstract', dueDate: getRelativeDateString(5), isCompleted: false },
];

export const INITIAL_STUDY_QUIZZES: QuizTracker[] = [
  { id: 'qz_1', subjectId: 'sub_1', title: 'Thermodynamics Mid-Unit Quiz', score: 18, maxScore: 20, date: getRelativeDateString(-5) },
  { id: 'qz_2', subjectId: 'sub_2', title: 'Linear Subspaces Quiz 1', score: 10, maxScore: 10, date: getRelativeDateString(-2) },
];

export const INITIAL_STUDY_EXAMS: ExamSchedule[] = [
  { id: 'ex_1', subjectId: 'sub_1', title: 'Physics Final Exam', date: getRelativeDateString(4), room: 'Hall B' },
  { id: 'ex_2', subjectId: 'sub_2', title: 'Linear Transformations Midterm', date: getRelativeDateString(8), room: 'Room 404' },
];

export const INITIAL_STUDY_SESSIONS: StudySession[] = [
  { id: 'ses_1', subjectId: 'sub_1', durationMs: 45 * 60 * 1000, notes: 'Studied carnot efficiency equations and completed practice set.', date: getRelativeDateString(-1) },
  { id: 'ses_2', subjectId: 'sub_2', durationMs: 60 * 60 * 1000, notes: 'Reviewed eigenvalue formulations and proved projection properties.', date: getRelativeDateString(-2) },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal_1',
    title: 'Achieve Cumulative 3.9 GPA',
    description: 'Build robust understanding in core physical mechanics, linear matrices, and psychological dynamics.',
    type: 'short-term',
    milestones: [
      { id: 'm_1_1', title: 'A+ in Physics AP', isCompleted: false },
      { id: 'm_1_2', title: 'A in Linear Algebra', isCompleted: false },
      { id: 'm_1_3', title: 'Submit Psychology honors thesis', isCompleted: true },
    ],
    progress: 33,
    deadline: '2026-08-15',
    createdAt: '2026-05-15T00:00:00Z',
  },
  {
    id: 'goal_2',
    title: 'Acquire Financial Independence Portfolio',
    description: 'Grow primary liquid savings portfolio to $15k and minimize non-essential lifestyle overhead.',
    type: 'long-term',
    milestones: [
      { id: 'm_2_1', title: 'Accumulate $5,000 liquid capital', isCompleted: true },
      { id: 'm_2_2', title: 'Automate weekly deposit targets ($250)', isCompleted: false },
      { id: 'm_2_3', title: 'Formulate index-fund rebalancing script', isCompleted: false },
    ],
    progress: 33,
    deadline: '2026-12-31',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tr_1', type: 'income', amount: 1500, category: 'Freelance Design', date: getRelativeDateString(-4), notes: 'UIUX work completed for Figma dashboard.', isRecurring: false },
  { id: 'tr_2', type: 'expense', amount: 45, category: 'Subscriptions', date: getRelativeDateString(-3), notes: 'Vite server node runner service.', isRecurring: true },
  { id: 'tr_3', type: 'expense', amount: 120, category: 'Food & Dining', date: getRelativeDateString(-1), notes: 'Weekly organic grocery order.', isRecurring: false },
  { id: 'tr_4', type: 'income', amount: 500, category: 'Scholarship Stiped', date: getRelativeDateString(-10), notes: 'Academic study award.', isRecurring: true },
];

export const INITIAL_BOOKMARKS = [
  { id: 'bm_1', title: 'Linear Algebra lectures - MIT 18.06', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', type: 'video', folderId: 'f_1', createdAt: getRelativeDateString(-8) },
  { id: 'bm_2', title: 'Lucide React Icons Documentation', url: 'https://lucide.dev/icons', type: 'link', folderId: 'f_2', createdAt: getRelativeDateString(-2) },
  { id: 'bm_3', title: 'Google GenAI SDK GitHub Repo', url: 'https://github.com/google/generative-ai-js', type: 'github', folderId: 'f_2', createdAt: getRelativeDateString(0) },
];

export const INITIAL_BOOKMARK_FOLDERS = [
  { id: 'f_1', name: 'Study Resources', icon: 'GraduationCap' },
  { id: 'f_2', name: 'Development Core', icon: 'Folder' },
];

export const INITIAL_FILES: FileItem[] = [
  { id: 'fil_1', name: 'physics_cheatsheet.pdf', type: 'pdf', size: 1024 * 350, url: '#', folder: 'Academics', createdAt: getRelativeDateString(-3) },
  { id: 'fil_2', name: 'design_system_cover.png', type: 'image', size: 1024 * 1200, url: 'https://images.unsplash.com/photo-1541462608141-27b2c7453c6e?w=500&auto=format&fit=crop&q=80', folder: 'Designs', createdAt: getRelativeDateString(-1) },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'not_1', title: 'Upcoming Deadline', message: 'Task "Deploy LifeOS Server Core API" is due today!', type: 'deadline', isRead: false, createdAt: getRelativeDateString(0) + 'T08:00:00Z' },
  { id: 'not_2', title: 'Study Session Reminder', message: 'Scheduled "Linear Algebra Prep Session" is tomorrow at 10 AM.', type: 'study', isRead: false, createdAt: getRelativeDateString(0) + 'T07:30:00Z' },
];

// LocalStorage Hydrator Store Pattern
export class LifeOSStore {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(`lifeos_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`lifeos_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving local storage:', e);
    }
  }

  static load() {
    return {
      tasks: this.get<Task[]>('tasks', INITIAL_TASKS),
      events: this.get<CalendarEvent[]>('events', INITIAL_CALENDAR_EVENTS),
      notes: this.get<Note[]>('notes', INITIAL_NOTES),
      subjects: this.get<StudySubject[]>('subjects', INITIAL_STUDY_SUBJECTS),
      assignments: this.get<StudyAssignment[]>('assignments', INITIAL_STUDY_ASSIGNMENTS),
      quizzes: this.get<QuizTracker[]>('quizzes', INITIAL_STUDY_QUIZZES),
      exams: this.get<ExamSchedule[]>('exams', INITIAL_STUDY_EXAMS),
      sessions: this.get<StudySession[]>('sessions', INITIAL_STUDY_SESSIONS),
      habits: this.get<Habit[]>('habits', INITIAL_HABITS),
      goals: this.get<Goal[]>('goals', INITIAL_GOALS),
      transactions: this.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS),
      savingsGoals: this.get<any[]>('savingsGoals', []),
      bookmarks: this.get<any[]>('bookmarks', INITIAL_BOOKMARKS),
      files: this.get<FileItem[]>('files', INITIAL_FILES),
    };
  }

  static save(state: any) {
    this.set('tasks', state.tasks);
    this.set('events', state.events);
    this.set('notes', state.notes);
    this.set('subjects', state.subjects);
    this.set('assignments', state.assignments);
    this.set('quizzes', state.quizzes);
    this.set('exams', state.exams);
    this.set('sessions', state.sessions);
    this.set('habits', state.habits);
    this.set('goals', state.goals);
    this.set('transactions', state.transactions);
    this.set('savingsGoals', state.savingsGoals);
    this.set('bookmarks', state.bookmarks);
    this.set('files', state.files);
  }

  static clearAll(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('lifeos_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error(e);
    }
  }
}
