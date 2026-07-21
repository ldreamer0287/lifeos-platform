/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
  createdAt: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string; // 'work' | 'personal' | 'study' | 'finance' | etc.
  tags: string[];
  deadline?: string; // YYYY-MM-DD
  reminder?: string; // HH:MM or date-time
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  subtasks: Subtask[];
  attachments: string[]; // URLs or file names
  isCompleted: boolean;
  progress: number; // 0 to 100 based on subtasks
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown text
  folder: string; // Folder name
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string; // ISO date-time
  end: string; // ISO date-time
  category: string;
  isRecurring: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly';
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  history: string[]; // Array of YYYY-MM-DD completed dates
  createdAt: string;
}

export interface StudySubject {
  id: string;
  name: string;
  color: string;
  credits: number;
  gpaGoal: number;
}

export interface StudyAssignment {
  id: string;
  subjectId: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface QuizTracker {
  id: string;
  subjectId: string;
  title: string;
  score: number;
  maxScore: number;
  date: string;
}

export interface ExamSchedule {
  id: string;
  subjectId: string;
  title: string;
  date: string;
  room?: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  durationMs: number; // Duration in milliseconds
  notes: string;
  date: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'long-term' | 'short-term';
  milestones: GoalMilestone[];
  progress: number; // 0 to 100
  deadline: string;
  category?: string;
  targetDate?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  notes: string;
  title?: string;
  isRecurring: boolean;
}

export type FinanceTransaction = Transaction;

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
}

export interface FinanceSummary {
  income: number;
  expenses: number;
  budget: number;
  savingsGoal: number;
  savingsCurrent: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  icon?: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  type?: 'article' | 'video' | 'github' | 'link';
  folderId?: string;
  createdAt?: string;
  category?: string;
  tags?: string[];
}

export type BookmarkItem = Bookmark;


export interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'other' | 'code' | 'archive' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'text';
  size: number; // in bytes
  sizeBytes?: number;
  url: string; // data URL or mock path
  folder: string;
  createdAt: string;
  content?: string;
  isFavorite?: boolean;
  lastModifiedAt?: string;
  localPath?: string;
  handle?: any;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'reminder' | 'study' | 'habit' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  language: string;
  timezone: string;
  notificationsEnabled: boolean;
  emailReminders: boolean;
}
