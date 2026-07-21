/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, CheckSquare, FileText, Bookmark as BookmarkIcon, Folder, CheckCircle2, Navigation } from 'lucide-react';
import { Task, Note, Habit, Bookmark, FileItem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: Note[];
  habits: Habit[];
  bookmarks: Bookmark[];
  files: FileItem[];
  setActiveTab: (tab: string) => void;
  onSelectItem: (type: string, id: string) => void;
  theme: 'dark' | 'light';
}

export default function CommandPalette({
  isOpen,
  onClose,
  tasks,
  notes,
  habits,
  bookmarks,
  files,
  setActiveTab,
  onSelectItem,
  theme,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on escape press or click outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Compile search items
  const navigationItems = [
    { id: 'dashboard', name: 'Go to Dashboard', category: 'Navigation', icon: Navigation },
    { id: 'tasks', name: 'Go to Tasks', category: 'Navigation', icon: CheckSquare },
    { id: 'calendar', name: 'Go to Calendar', category: 'Navigation', icon: Navigation },
    { id: 'notes', name: 'Go to Notes', category: 'Navigation', icon: FileText },
    { id: 'study', name: 'Go to Study Dashboard', category: 'Navigation', icon: Navigation },
    { id: 'habits', name: 'Go to Habit Tracker', category: 'Navigation', icon: CheckCircle2 },
    { id: 'goals', name: 'Go to Goal Tracker', category: 'Navigation', icon: Navigation },
    { id: 'finance', name: 'Go to Finance', category: 'Navigation', icon: Navigation },
    { id: 'bookmarks', name: 'Go to Bookmarks', category: 'Navigation', icon: BookmarkIcon },
    { id: 'files', name: 'Go to Files', category: 'Navigation', icon: Folder },
    { id: 'ai', name: 'Go to AI Assistant', category: 'Navigation', icon: Sparkles },
    { id: 'analytics', name: 'Go to Analytics', category: 'Navigation', icon: Navigation },
    { id: 'settings', name: 'Go to Settings', category: 'Navigation', icon: Navigation },
  ];

  const searchItems = [
    ...navigationItems.map(item => ({ ...item, type: 'nav' })),
    ...tasks.map(t => ({ id: t.id, name: t.title, category: 'Tasks', icon: CheckSquare, type: 'task' })),
    ...notes.map(n => ({ id: n.id, name: n.title, category: 'Notes', icon: FileText, type: 'note' })),
    ...habits.map(h => ({ id: h.id, name: h.name, category: 'Habits', icon: CheckCircle2, type: 'habit' })),
    ...bookmarks.map(b => ({ id: b.id, name: b.title, category: 'Bookmarks', icon: BookmarkIcon, type: 'bookmark' })),
    ...files.map(f => ({ id: f.id, name: f.name, category: 'Files', icon: Folder, type: 'file' })),
  ];

  const filteredItems = searchItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8); // Limit to 8 items for premium clean spacing

  const handleSelect = (item: typeof searchItems[0]) => {
    if (item.type === 'nav') {
      setActiveTab(item.id);
    } else {
      onSelectItem(item.type, item.id);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-md">
      <div
        ref={modalRef}
        onKeyDown={handleKeyDown}
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-zinc-950/80 border-white/10 text-zinc-100 shadow-black/80'
            : 'bg-white/80 border-zinc-900/10 text-zinc-800 shadow-zinc-200/60'
        }`}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/10 dark:border-zinc-800/50">
          <Search size={20} className="text-zinc-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search tasks, notes, habits, navigation commands..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-base font-normal placeholder-zinc-400 focus:ring-0"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-700/30 text-[10px] font-mono text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto py-2 px-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                      : theme === 'dark'
                      ? 'hover:bg-zinc-800/60 text-zinc-300'
                      : 'hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-white' : 'text-zinc-400'} />
                  <span className="flex-1 truncate font-medium">{item.name}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-indigo-700/60 text-white/95'
                        : theme === 'dark'
                        ? 'bg-zinc-800 text-zinc-400'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {item.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-zinc-400 text-sm flex flex-col items-center justify-center gap-2">
              <Search size={24} className="stroke-1 text-zinc-500" />
              <span>No results found for "{searchQuery}"</span>
            </div>
          )}
        </div>

        {/* Command Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800/10 dark:border-zinc-800/50 bg-zinc-500/5 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Global Palette</span>
        </div>
      </div>
    </div>
  );
}
