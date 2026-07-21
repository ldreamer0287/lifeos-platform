/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  Star,
  Pin,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  Search,
  Tag,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import { Note } from '../types';

interface NotesViewProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  theme: 'dark' | 'light';
}

export default function NotesView({ notes, setNotes, theme }: NotesViewProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('preview');

  // New Note Folder creation
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folders, setFolders] = useState<string[]>(['Work', 'Study', 'Personal', 'Ideas']);

  // Current active note object
  const activeNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: 'Untitled Scratchpad Note',
      content: '# New Note Scratchpad\n\nStart typing markdown structures...',
      folder: activeFolder === 'All' ? 'Ideas' : activeFolder,
      tags: ['New'],
      isFavorite: false,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setEditMode('edit');
  };

  const handleUpdateNoteContent = (content: string) => {
    setNotes(
      notes.map((n) =>
        n.id === selectedNoteId
          ? { ...n, content, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  const handleUpdateNoteTitle = (title: string) => {
    setNotes(
      notes.map((n) =>
        n.id === selectedNoteId
          ? { ...n, title, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  const toggleFavorite = (id: string) => {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, isFavorite: !n.isFavorite } : n))
    );
  };

  const togglePin = (id: string) => {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  const deleteNote = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (selectedNoteId === id && remaining.length > 0) {
      setSelectedNoteId(remaining[0].id);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders([...folders, newFolderName.trim()]);
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };

  // Compile notes matching queries
  const filteredNotes = notes.filter((n) => {
    const matchFolder = activeFolder === 'All' || n.folder === activeFolder;
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchFavorite = !filterFavorites || n.isFavorite;
    return matchFolder && matchSearch && matchFavorite;
  });

  // Sort: Pinned first, then by date updatedAt desc
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Mini Markdown parser compiled on-the-fly for Preview Mode
  const renderMarkdown = (md: string) => {
    if (!md) return <p className="text-zinc-500 text-xs italic">Empty document</p>;

    const lines = md.split('\n');
    return (
      <div className="space-y-4 text-zinc-300">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-2xl sm:text-3xl font-black text-zinc-100 mt-6 pb-2 border-b border-zinc-800 tracking-tight">
                {line.substring(2)}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg sm:text-xl font-bold text-zinc-100 mt-5 tracking-tight">
                {line.substring(3)}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-zinc-200 mt-4 tracking-tight">
                {line.substring(4)}
              </h3>
            );
          }

          // Bullet lists
          if (line.startsWith('- ')) {
            return (
              <ul key={idx} className="list-disc pl-5 text-sm space-y-1.5 font-normal text-zinc-300">
                <li>{line.substring(2)}</li>
              </ul>
            );
          }

          // Blockquotes
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-indigo-600 pl-4 py-1 italic text-zinc-400 bg-indigo-500/5 rounded-r-lg my-3 text-sm">
                {line.substring(2)}
              </blockquote>
            );
          }

          // Dividers
          if (line === '---') {
            return <hr key={idx} className="border-zinc-800 my-6" />;
          }

          // Checkboxes
          if (line.startsWith('- [ ] ')) {
            return (
              <div key={idx} className="flex items-center gap-2.5 text-sm my-1 text-zinc-300">
                <input type="checkbox" disabled className="rounded border-zinc-700 text-indigo-500" />
                <span>{line.substring(6)}</span>
              </div>
            );
          }
          if (line.startsWith('- [x] ')) {
            return (
              <div key={idx} className="flex items-center gap-2.5 text-sm my-1 text-zinc-500 line-through">
                <input type="checkbox" checked disabled className="rounded border-zinc-700 text-indigo-500" />
                <span>{line.substring(6)}</span>
              </div>
            );
          }

          // Empty lines
          if (!line.trim()) return <div key={idx} className="h-2" />;

          // Default text
          return (
            <p key={idx} className="text-sm font-normal text-zinc-300 leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col sm:flex-row rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 overflow-hidden bg-zinc-500/1 backdrop-blur-xl">
      {/* 1. Folders Directory Panel (Left Side Rail) */}
      <div className="w-full sm:w-56 border-r border-zinc-800/10 dark:border-zinc-800/50 flex flex-col p-4 space-y-4 shrink-0 bg-zinc-500/2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Folders</span>
          <button
            onClick={() => setShowFolderModal(true)}
            className="p-1 rounded hover:bg-zinc-500/10 text-zinc-400 hover:text-indigo-400 transition-all"
          >
            <FolderPlus size={15} />
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          <button
            onClick={() => setActiveFolder('All')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFolder === 'All'
                ? 'bg-indigo-600/10 text-indigo-400'
                : 'text-zinc-400 hover:bg-zinc-500/5 hover:text-zinc-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bookmark size={13} /> All Notes
            </span>
            <span className="text-[10px] font-mono">{notes.length}</span>
          </button>

          {folders.map((fold) => {
            const count = notes.filter((n) => n.folder === fold).length;
            return (
              <button
                key={fold}
                onClick={() => setActiveFolder(fold)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFolder === fold
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-zinc-400 hover:bg-zinc-500/5 hover:text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Folder size={13} /> {fold}
                </span>
                <span className="text-[10px] font-mono">{count}</span>
              </button>
            );
          })}
        </nav>

        {/* Favorite Star Filter toggle */}
        <button
          onClick={() => setFilterFavorites(!filterFavorites)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
            filterFavorites
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              : 'border-zinc-800/10 dark:border-zinc-800/50 text-zinc-400 hover:bg-zinc-500/5'
          }`}
        >
          <Star size={13} className={filterFavorites ? 'fill-white text-white' : ''} />
          <span>Star Favorites</span>
        </button>
      </div>

      {/* 2. Notes List panel (Middle Rail) */}
      <div className="w-full sm:w-64 border-r border-zinc-800/10 dark:border-zinc-800/50 flex flex-col shrink-0 bg-zinc-500/1">
        {/* Search */}
        <div className="p-3 border-b border-zinc-800/10 dark:border-zinc-800/50 relative">
          <Search size={14} className="absolute left-6 top-6 text-zinc-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border outline-none ${
              theme === 'dark'
                ? 'bg-zinc-950 border-zinc-850 text-zinc-100 placeholder-zinc-500'
                : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
            }`}
          />
        </div>

        {/* Note Item Column */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/10 dark:divide-zinc-800/30 custom-scrollbar">
          {sortedNotes.length > 0 ? (
            sortedNotes.map((note) => {
              const isSelected = selectedNoteId === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-3.5 cursor-pointer text-left transition-all relative ${
                    isSelected
                      ? 'bg-indigo-600/5 border-l-2 border-indigo-500'
                      : 'hover:bg-zinc-500/2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <h4 className={`font-bold text-xs truncate flex-1 ${
                      isSelected ? 'text-indigo-400' : ''
                    }`}>
                      {note.title}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      {note.isPinned && <Pin size={10} className="text-indigo-500 fill-indigo-500" />}
                      {note.isFavorite && <Star size={10} className="text-amber-500 fill-amber-500" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-snug">
                    {note.content.replace(/[#*`>]/g, '')}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-[9px] font-mono font-medium text-zinc-500">
                    <span>{note.folder}</span>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
              <BookOpen size={20} className="text-zinc-500 stroke-1" />
              <span>No notes cataloged.</span>
            </div>
          )}
        </div>

        {/* Create Note Footer */}
        <button
          onClick={handleCreateNote}
          className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus size={14} /> Compose Note
        </button>
      </div>

      {/* 3. Editor/Viewer panel (Right Side Workspace) */}
      <div className="flex-1 flex flex-col bg-zinc-950/20">
        {activeNote ? (
          <>
            {/* Split Screen Toggle & Notes Commands */}
            <div className="p-3 border-b border-zinc-800/10 dark:border-zinc-800/50 flex items-center justify-between gap-4 bg-zinc-500/1">
              {/* Title input field */}
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleUpdateNoteTitle(e.target.value)}
                className="font-bold text-sm tracking-tight bg-transparent border-none outline-none text-zinc-100 flex-1 focus:ring-0 max-w-[280px] sm:max-w-md"
              />

              {/* Toolbar */}
              <div className="flex items-center gap-2.5">
                {/* Favorites & Pins */}
                <button
                  onClick={() => togglePin(activeNote.id)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    activeNote.isPinned
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                      : 'border-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Pin Note"
                >
                  <Pin size={11} className={activeNote.isPinned ? 'fill-indigo-400' : ''} />
                </button>
                <button
                  onClick={() => toggleFavorite(activeNote.id)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    activeNote.isFavorite
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'border-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Favorite Note"
                >
                  <Star size={11} className={activeNote.isFavorite ? 'fill-amber-400' : ''} />
                </button>
                <button
                  onClick={() => deleteNote(activeNote.id)}
                  className="p-1.5 rounded-lg border border-zinc-800/40 text-rose-500 hover:bg-rose-500/10 transition-all"
                  title="Delete Note"
                >
                  <Trash2 size={11} />
                </button>

                <div className="w-px h-4 bg-zinc-800 mx-1" />

                {/* Edit Mode Toggle */}
                <div className="flex border border-zinc-800/50 p-0.5 rounded-lg bg-zinc-950/60 text-xs">
                  <button
                    onClick={() => setEditMode('edit')}
                    className={`px-2 py-1 rounded flex items-center gap-1 font-bold ${
                      editMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <Edit3 size={10} /> Editor
                  </button>
                  <button
                    onClick={() => setEditMode('preview')}
                    className={`px-2 py-1 rounded flex items-center gap-1 font-bold ${
                      editMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <BookOpen size={10} /> Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Workspace */}
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
              {editMode === 'edit' ? (
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleUpdateNoteContent(e.target.value)}
                  className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed text-zinc-300 focus:ring-0"
                  placeholder="Draft your thoughts using markdown structures..."
                />
              ) : (
                <div className="max-w-2xl mx-auto py-4">
                  {renderMarkdown(activeNote.content)}
                </div>
              )}
            </div>

            {/* Note metadata footer */}
            <div className="p-2 border-t border-zinc-800/10 dark:border-zinc-800/50 flex items-center justify-between text-[10px] font-mono text-zinc-500 bg-zinc-500/1">
              <span>Modified: {new Date(activeNote.updatedAt).toLocaleString()}</span>
              <span>Tags: {activeNote.tags.join(', ')}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <BookOpen size={36} className="stroke-1 text-zinc-600" />
            <p className="text-sm font-semibold">Select or compose a note to get started.</p>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Create New Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                required
                type="text"
                placeholder="Folder Name (e.g. Finance)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                }`}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Assemble Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
