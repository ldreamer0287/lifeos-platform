/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Trash2,
  Bookmark,
  ExternalLink,
  Search,
  Tag,
  Star,
} from 'lucide-react';
import { BookmarkItem } from '../types';

interface BookmarksViewProps {
  bookmarks: BookmarkItem[];
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkItem[]>>;
  theme: 'dark' | 'light';
}

export default function BookmarksView({ bookmarks, setBookmarks, theme }: BookmarksViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Tech');
  const [tagsStr, setTagsStr] = useState('');

  const folders = ['Tech', 'Research', 'Design', 'Inspiration', 'Utilities'];

  const handleCreateBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    // Ensure protocol
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const parsedTags = tagsStr
      .split(/[,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newBookmark: BookmarkItem = {
      id: `bm_${Date.now()}`,
      title,
      url: formattedUrl,
      category,
      tags: parsedTags,
    };

    setBookmarks([newBookmark, ...bookmarks]);

    // Reset Form
    setTitle('');
    setUrl('');
    setCategory('Tech');
    setTagsStr('');
    setShowForm(false);
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((bm) => bm.id !== id));
  };

  const filteredBookmarks = bookmarks.filter((bm) => {
    const matchFolder = activeFolder === 'All' || bm.category === activeFolder;
    const matchSearch =
      bm.title.toLowerCase().includes(search.toLowerCase()) ||
      bm.url.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Bookmark Manager
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Organize core reference portals, SaaS dashboards, and academic resources.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Save Bookmark
        </button>
      </div>

      {/* Main Grid: Left Folders Sidebar, Right Items list */}
      <div className="flex flex-col sm:flex-row rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 overflow-hidden bg-zinc-500/2 backdrop-blur-xl min-h-[500px]">
        {/* Folders list sidebar */}
        <div className="w-full sm:w-56 border-r border-zinc-800/10 dark:border-zinc-800/50 p-4 space-y-4 shrink-0 text-left bg-zinc-500/1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Library Directories</span>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveFolder('All')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'All'
                  ? 'bg-indigo-600/10 text-indigo-400'
                  : 'text-zinc-400 hover:bg-zinc-500/5 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark size={13} /> All Portals
              </span>
              <span className="text-[10px] font-mono">{bookmarks.length}</span>
            </button>

            {folders.map((fold) => {
              const count = bookmarks.filter((bm) => bm.category === fold).length;
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
        </div>

        {/* Portals list area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-zinc-800/10 dark:border-zinc-800/50 relative">
            <Search size={14} className="absolute left-7 top-7 text-zinc-500" />
            <input
              type="text"
              placeholder="Search bookmark titles or links..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border outline-none ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-850 text-zinc-100 placeholder-zinc-500'
                  : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
              }`}
            />
          </div>

          {/* Grid of cards */}
          <div className="p-5 overflow-y-auto flex-1 max-h-[450px] custom-scrollbar">
            {filteredBookmarks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between min-h-[120px] ${
                      theme === 'dark'
                        ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-zinc-200 truncate flex-1">{bm.title}</h4>
                        <button
                          onClick={() => deleteBookmark(bm.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-500 transition-all shrink-0"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono truncate mt-1">{bm.url}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {bm.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <a
                        href={bm.url}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="px-2.5 py-1.5 text-[10px] font-bold bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-sm"
                      >
                        Launch <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-3">
                <Bookmark size={24} className="stroke-1 text-zinc-650" />
                <span>No saved bookmark portals in this directory.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Creation Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Save Portal Bookmark</h3>
            <form onSubmit={handleCreateBookmark} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Portal Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. OpenAI Playground"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Target URL *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. platform.openai.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Category Folder</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    {folders.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="ai, core, api"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Confirm Bookmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
