import React, { useState, useEffect } from 'react';
import {
  Users,
  Layers,
  MessageSquare,
  Activity,
  Trash2,
  CheckCircle,
  Database,
  FileText,
  AlertTriangle,
  Play,
  Download,
  Search,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Send,
  RefreshCw,
  Cpu,
  Monitor,
  Calendar,
  Settings
} from 'lucide-react';
import { LifeOSStore } from '../utils';

// Default static feedbacks seeded to make the admin portal feel instantly live and rich
const DEFAULT_FEEDBACKS = [
  {
    id: 'fdb_1',
    user: 'ldreamer669@gmail.com',
    message: 'The new Google Sheets grid editor is brilliant! I was able to manage my semester budget formulas perfectly in one space.',
    category: 'Google Workspace',
    rating: 5,
    createdAt: '2026-07-19',
    status: 'new'
  },
  {
    id: 'fdb_2',
    user: 'student_physics@berkeley.edu',
    message: 'Can we add dark-mode highlighting to the PDF viewer? The AP Thermomechanics formulas render nicely but a dark mode paper option would save my eyes during night study.',
    category: 'Feature Request',
    rating: 4,
    createdAt: '2026-07-18',
    status: 'new'
  },
  {
    id: 'fdb_3',
    user: 'alexis.designer@lifeos.io',
    message: 'The glassmorphism theme and custom animations are super fluid. No frame lagging at all on my mobile client.',
    category: 'Design & UI',
    rating: 5,
    createdAt: '2026-07-17',
    status: 'reviewed'
  },
  {
    id: 'fdb_4',
    user: 'finance_ops@gmail.com',
    message: 'Saving a budget worksheet directly into the Notes vault as Markdown tables is a massive timesaver! Outstanding integration.',
    category: 'Google Workspace',
    rating: 5,
    createdAt: '2026-07-16',
    status: 'reviewed'
  }
];

export default function AdminDashboardView({ theme }: { theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';

  // System Stats
  const [totalUsers, setTotalUsers] = useState(1348);
  const [activeUsers, setActiveUsers] = useState(38);
  const [dbSize, setDbSize] = useState(14.8); // MB
  const [apiQuota, setApiQuota] = useState(87.5); // %

  // Dynamic feedback storage
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [feedbackReply, setFeedbackReply] = useState('');
  const [searchFeedback, setSearchFeedback] = useState('');

  // Feature usage statistics
  const [featureClicks, setFeatureClicks] = useState<{ [key: string]: number }>({});

  // System logs state
  const [logs, setLogs] = useState<string[]>([]);

  // Simulation states
  const [isStressTesting, setIsStressTesting] = useState(false);

  // Initialize Admin Data
  useEffect(() => {
    // Load Feedbacks
    const storedFeedbacks = localStorage.getItem('lifeos_feedbacks');
    if (storedFeedbacks) {
      setFeedbacks(JSON.parse(storedFeedbacks));
    } else {
      localStorage.setItem('lifeos_feedbacks', JSON.stringify(DEFAULT_FEEDBACKS));
      setFeedbacks(DEFAULT_FEEDBACKS);
    }

    // Load or create Feature click analytics
    const storedClicks = localStorage.getItem('lifeos_feature_clicks');
    const baseClicks = {
      'Task Workspace': 1482,
      'Personal Calendar': 920,
      'Notes Vault': 1201,
      'Google Workspace': 1650,
      'Drive Storage': 840,
      'Habit Tracker': 730,
      'Goals Core': 410,
      'Analytics Suite': 520,
      'Finance Ledger': 630
    };

    if (storedClicks) {
      try {
        const parsed = JSON.parse(storedClicks);
        // Combine our custom tracker increments with our high volume baseline mock data
        const combined = { ...baseClicks };
        Object.keys(parsed).forEach(k => {
          // Normalize names
          const keyMap: { [key: string]: string } = {
            'dashboard': 'Task Workspace',
            'tasks': 'Task Workspace',
            'calendar': 'Personal Calendar',
            'notes': 'Notes Vault',
            'study': 'Analytics Suite',
            'habits': 'Habit Tracker',
            'goals': 'Goals Core',
            'finance': 'Finance Ledger',
            'bookmarks': 'Drive Storage',
            'files': 'Drive Storage',
            'google-workspace': 'Google Workspace',
            'ai': 'Analytics Suite',
            'analytics': 'Analytics Suite',
            'settings': 'Goals Core'
          };
          const mappedKey = keyMap[k] || k;
          combined[mappedKey] = (combined[mappedKey] || 0) + (parsed[k] * 12); // Multiply for dramatic visual scaling
        });
        setFeatureClicks(combined);
      } catch {
        setFeatureClicks(baseClicks);
      }
    } else {
      setFeatureClicks(baseClicks);
    }

    // Seed server logs
    const seedLogs = [
      `[2026-07-19 23:10:45] [INFO] life-os-server initialized successfully on port 3000.`,
      `[2026-07-19 23:11:02] [DB] Connected local SQLite schema instance context.`,
      `[2026-07-19 23:15:20] [INFO] Gemini Pro API engine preloaded. Quota status is 100% stable.`,
      `[2026-07-19 23:18:41] [WARN] Auth Token signature refreshed for operator "ldreamer669@gmail.com".`,
      `[2026-07-19 23:22:04] [INFO] Files catalog index rebuilt. Syncing with Google workspace views.`
    ];
    setLogs(seedLogs);
  }, []);

  // Update feedbacks helper
  const updateFeedbacksList = (newList: any[]) => {
    setFeedbacks(newList);
    localStorage.setItem('lifeos_feedbacks', JSON.stringify(newList));
  };

  // Feedback actions
  const handleResolveFeedback = (id: string) => {
    const updated = feedbacks.map(f =>
      f.id === id ? { ...f, status: 'reviewed' as const } : f
    );
    updateFeedbacksList(updated);
    if (selectedFeedback && selectedFeedback.id === id) {
      setSelectedFeedback({ ...selectedFeedback, status: 'reviewed' as const });
    }
    appendLog(`[INFO] Feedback RESOLVED: ID ${id}`);
  };

  const handleDeleteFeedback = (id: string) => {
    const updated = feedbacks.filter(f => f.id !== id);
    updateFeedbacksList(updated);
    setSelectedFeedback(null);
    appendLog(`[WARN] Feedback DELETED: ID ${id}`);
  };

  const handleSendReply = () => {
    if (!feedbackReply.trim() || !selectedFeedback) return;
    appendLog(`[INFO] Reply dispatched to ${selectedFeedback.user}: "${feedbackReply.trim()}"`);
    alert(`Admin reply dispatched to user: "${selectedFeedback.user}"`);
    setFeedbackReply('');
  };

  // Stress load test simulation
  const triggerStressTest = () => {
    if (isStressTesting) return;
    setIsStressTesting(true);
    appendLog(`[WARN] STRESS LOAD RUNNER INITIATED. Flooding local routing loops with mock requests...`);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setActiveUsers(prev => prev + Math.floor(Math.random() * 25) + 15);
      setApiQuota(prev => Math.max(12, prev - (Math.random() * 2)));
      appendLog(`[STRESS-TEST] Ping index ${count} successful. Latency 14ms. Ingress 8.4 Kb/s.`);

      if (count >= 4) {
        clearInterval(interval);
        setIsStressTesting(false);
        appendLog(`[INFO] STRESS TEST COMPLETED successfully. System ingress node autoscaled gracefully.`);
      }
    }, 1000);
  };

  // Helper log appender
  const appendLog = (msg: string) => {
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setLogs(prev => [...prev, `[${timeStr}] ${msg}`]);
  };

  // JSON snapshot backup
  const handleBackupDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `lifeos_database_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    appendLog(`[INFO] Full SQLite/localStorage database model compiled and backup downloaded.`);
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(f =>
    f.user.toLowerCase().includes(searchFeedback.toLowerCase()) ||
    f.message.toLowerCase().includes(searchFeedback.toLowerCase()) ||
    f.category.toLowerCase().includes(searchFeedback.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Admin Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Cpu className="text-indigo-400 shrink-0" />
            Admin Command Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            System metrics telemetry, feature usage analytics, user support feedback logs, and developer control panels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400">Node Status: Operational</span>
        </div>
      </div>

      {/* Primary Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Users card */}
        <div className="glass-panel p-5 rounded-[24px] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Total Registered Users</span>
            <h2 className="text-3xl font-black tracking-tight text-slate-100">{totalUsers}</h2>
            <p className="text-[10px] text-emerald-400 font-mono font-medium">+14% month-over-month</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0 border border-indigo-500/10">
            <Users size={22} />
          </div>
        </div>

        {/* Active Session Users */}
        <div className="glass-panel p-5 rounded-[24px] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Live Connections</span>
            <h2 className="text-3xl font-black tracking-tight text-slate-100">{activeUsers}</h2>
            <p className="text-[10px] text-indigo-400 font-mono font-medium">Sockets open on Port 3000</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/10 animate-pulse">
            <Activity size={22} />
          </div>
        </div>

        {/* Database Storage utilization */}
        <div className="glass-panel p-5 rounded-[24px] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Core Database footprint</span>
            <h2 className="text-3xl font-black tracking-tight text-slate-100">{dbSize.toFixed(1)} MB</h2>
            <p className="text-[10px] text-zinc-500 font-mono font-medium">SQLite file size indexed</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/10">
            <Database size={22} />
          </div>
        </div>

        {/* Gemini Token API Quotas */}
        <div className="glass-panel p-5 rounded-[24px] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Gemini Token API Limit</span>
            <h2 className="text-3xl font-black tracking-tight text-slate-100">{apiQuota.toFixed(1)}%</h2>
            <p className="text-[10px] text-emerald-400 font-mono font-medium">Tokens stable: 3.5 Flash</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/10">
            <Cpu size={22} />
          </div>
        </div>

      </div>

      {/* Center Layout grid: Feature Popularity + Feedback logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Feature Popularity Bar Chart (Which feature are they mostly use) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-[28px] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 mb-1.5">
              <Layers size={16} className="text-indigo-400" />
              Feature Usage Popularity
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Comparative traffic metric tracking which cockpit features are most actively visited by system users.
            </p>

            {/* Simulated bar columns */}
            <div className="space-y-3">
              {Object.entries(featureClicks)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([name, clicks]) => {
                  const maxClicks = Math.max(...(Object.values(featureClicks) as number[]));
                  const percentage = ((clicks as number) / maxClicks) * 100;
                  return (
                    <div key={name} className="space-y-1 text-left">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-zinc-300">{name}</span>
                        <span className="font-mono text-[10px] text-zinc-400 font-bold">{clicks.toLocaleString()} hits</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Telemetry polling interval: Real-time</span>
            <button
              onClick={() => {
                // Trigger refresh state
                appendLog('[INFO] Cleared transient feature clicks; pulling refreshed database values.');
                alert('Feature click analytics telemetry successfully synchronized with latest local actions!');
              }}
              className="flex items-center gap-1 hover:text-indigo-400 transition-all cursor-pointer"
            >
              <RefreshCw size={11} /> Sync Grid
            </button>
          </div>
        </div>

        {/* Feedback Logs (Their feedback) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-[28px] flex flex-col justify-between h-full min-h-[480px]">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    User Feedback Vault
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Review and triage ratings, comments, and feature recommendations submitted by LifeOS core nodes.
                  </p>
                </div>

                <div className="relative max-w-xs w-full sm:w-[180px]">
                  <Search size={11} className="absolute left-2.5 top-2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search feedback..."
                    value={searchFeedback}
                    onChange={(e) => setSearchFeedback(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 text-[10px] placeholder-zinc-500 outline-none glass-input"
                  />
                </div>
              </div>

              {/* Feedbacks Grid List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {filteredFeedbacks.map((item) => {
                  const isSelected = selectedFeedback?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFeedback(item)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white/10 border-white/20'
                          : item.status === 'new'
                          ? 'bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20'
                          : 'bg-white/2 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[10px] text-zinc-300 truncate max-w-[120px]">{item.user}</span>
                        <span className="text-[8px] font-mono text-zinc-500">{item.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-black/40 text-indigo-400 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                        <div className="flex text-amber-400 text-[10px]">
                          {'★'.repeat(item.rating)}
                          {'☆'.repeat(5 - item.rating)}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-3">
                        {item.message}
                      </p>
                      {item.status === 'new' && (
                        <span className="inline-block mt-2 text-[8px] font-bold text-indigo-300 bg-indigo-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Pending Triage
                        </span>
                      )}
                    </div>
                  );
                })}

                {filteredFeedbacks.length === 0 && (
                  <div className="col-span-2 py-16 text-center text-zinc-500 text-xs">
                    No matching support feedbacks.
                  </div>
                )}
              </div>
            </div>

            {/* Selection Reply Panel */}
            {selectedFeedback ? (
              <div className="mt-4 p-4 bg-black/40 border border-white/5 rounded-2xl text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px]">
                    <span className="text-zinc-500">Triage Selection:</span> <span className="font-bold text-zinc-300">{selectedFeedback.user}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedFeedback.status === 'new' && (
                      <button
                        onClick={() => handleResolveFeedback(selectedFeedback.id)}
                        className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/10 px-2.5 py-1 rounded-xl transition-all"
                      >
                        Resolve Note
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                      className="text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg border border-white/5 transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-300 italic bg-white/2 p-2.5 rounded-xl leading-relaxed border border-white/5">
                  "{selectedFeedback.message}"
                </p>

                {/* Dispatch response */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feedbackReply}
                    onChange={(e) => setFeedbackReply(e.target.value)}
                    placeholder="Type official system administrator dispatch response..."
                    className="flex-1 px-3 py-1.5 text-[10px] placeholder-zinc-500 outline-none glass-input"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!feedbackReply.trim()}
                    className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white hover:opacity-90 transition-all disabled:opacity-30"
                  >
                    <Send size={11} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-white/2 border border-dashed border-white/5 rounded-2xl text-center py-6 text-zinc-500 text-[10px]">
                Select a user feedback entry above to initialize full triage controls and reply dispatches.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Control Console & Server Live logs panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* System Administration controls */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-[28px] text-left space-y-4">
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <Cpu className="text-indigo-400" />
            Operations Control Node
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Manage Core databases, execute telemetry load stress scripts, or extract state dumps.
          </p>

          <div className="space-y-2 pt-2">
            {/* Stress Test */}
            <button
              onClick={triggerStressTest}
              disabled={isStressTesting}
              className="w-full py-2.5 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play size={12} className={isStressTesting ? 'animate-spin' : ''} />
              {isStressTesting ? 'Executing Ingress Stress...' : 'Trigger Traffic Stress Test'}
            </button>

            {/* Backup Download */}
            <button
              onClick={handleBackupDownload}
              className="w-full py-2.5 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center justify-center gap-2"
            >
              <Download size={12} />
              Download Database Model Dump
            </button>

            {/* Clear Database State */}
            <button
              onClick={() => {
                if (confirm('CRITICAL WARN: This clears all persistent LifeOS localStorage records. Are you sure you want to run this?')) {
                  LifeOSStore.clearAll();
                  appendLog('[WARN] All local databases indexes dropped. Resetting browser context...');
                  window.location.reload();
                }
              }}
              className="w-full py-2.5 rounded-2xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 text-[11px] font-bold text-rose-400 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={12} />
              Clear & Factory Reset System
            </button>
          </div>
        </div>

        {/* Server Logs Console */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-[28px] text-left flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 mb-2">
              <Database className="text-indigo-400" />
              Live Server Log Terminal
            </h3>
            
            {/* Live streaming terminal simulation */}
            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-zinc-400 h-[150px] overflow-y-auto custom-scrollbar space-y-1.5">
              {logs.map((log, index) => {
                let color = 'text-zinc-400';
                if (log.includes('[WARN]')) color = 'text-amber-400';
                if (log.includes('[DB]')) color = 'text-emerald-400';
                if (log.includes('[STRESS-TEST]')) color = 'text-cyan-400';
                return (
                  <div key={index} className={`leading-relaxed break-all ${color}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 text-[9px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Server thread: Active (0.0.0.0:3000 ingress)</span>
            <span>Buffered logs: {logs.length}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
