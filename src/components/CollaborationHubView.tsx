import React from 'react';
import { motion } from 'motion/react';
import { Users, Sparkles, MessageSquare, Shield, FolderGit, Cpu } from 'lucide-react';

interface CollaborationHubProps {
  theme: 'light' | 'dark';
  user: { name: string; title: string; email?: string; isAdmin?: boolean };
}

export default function CollaborationHubView({ theme, user }: CollaborationHubProps) {
  const isDark = theme === 'dark';

  const previewFeatures = [
    {
      icon: MessageSquare,
      title: 'Peer-to-Peer Chat',
      desc: 'Lightweight text and emoji messaging with instant read receipts.',
    },
    {
      icon: FolderGit,
      title: 'Rich File Sharing',
      desc: 'Seamless drag-and-drop support for documents, archives, and code files.',
    },
    {
      icon: Users,
      title: 'Student & Peer Directory',
      desc: 'Find and connect instantly with classmates by email or username.',
    },
    {
      icon: Shield,
      title: 'Secure Environment',
      desc: 'Local-first encrypted message caching and strict file owner access control.',
    },
  ];

  return (
    <div className={`min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6 transition-colors duration-300 ${
      isDark ? 'bg-[#090a0f] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Premium Gradient Glow Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        
        {/* Status Pill Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-bold tracking-wider uppercase bg-indigo-550/10"
          style={{
            borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
            color: isDark ? '#a5b4fc' : '#4f46e5'
          }}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-mono">LifeOS Connect</span>
        </motion.div>

        {/* Hero Section */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`text-4xl md:text-5xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}
          >
            Coming Soon
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-sm md:text-base max-w-lg mx-auto leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            A streamlined peer-to-peer workspace communication hub. Chat with classmates, coordinate groups, and securely share files in real-time.
          </motion.p>
        </div>

        {/* Feature Preview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
        >
          {previewFeatures.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all duration-350 hover:scale-[1.01] ${
                  isDark 
                    ? 'bg-[#11131c]/80 border-zinc-800/80 hover:border-zinc-700/60' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <IconComponent size={16} />
                  </div>
                  <h3 className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {feat.title}
                  </h3>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </motion.div>



      </div>
    </div>
  );
}
