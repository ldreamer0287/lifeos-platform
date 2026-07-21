/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { googleSignIn } from '../lib/firebase';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Database,
  Sparkles,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (userName: string, userTitle: string, userEmail?: string, isAdmin?: boolean, avatarUrl?: string) => void;
  theme: 'dark' | 'light';
}

export default function AuthView({ onLoginSuccess, theme }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Initialize pre-registered users in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lifeos_registered_users');
    if (!stored) {
      const defaultUsers = [
        {
          email: 'admin@gmail.com',
          password: '123456admin',
          name: 'System Admin',
          title: 'Root Administrator',
          isAdmin: true
        },
        {
          email: 'operator@lifeos.io',
          password: 'operator',
          name: 'Chief Operator',
          title: 'Productivity Pioneer',
          isAdmin: false
        },
        {
          email: 'guest@lifeos.io',
          password: 'guest',
          name: 'Guest Operator',
          title: 'LifeOS Sandbox',
          isAdmin: false
        }
      ];
      localStorage.setItem('lifeos_registered_users', JSON.stringify(defaultUsers));
    }
  }, []);

  // Monitor Caps Lock status
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setConnecting(true);

    setTimeout(() => {
      setConnecting(false);
      try {
        const stored = localStorage.getItem('lifeos_registered_users');
        const users = stored ? JSON.parse(stored) : [];

        if (isSignUp) {
          // Sign Up flow
          const alreadyExists = users.some(
            (u: any) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (alreadyExists) {
            setErrorMsg('This email address is already registered inside LifeOS.');
            return;
          }

          const newUser = {
            email: email.trim(),
            password: password,
            name: name.trim() || email.split('@')[0],
            title: 'Chief Operator',
            isAdmin: false
          };

          const updatedUsers = [...users, newUser];
          localStorage.setItem('lifeos_registered_users', JSON.stringify(updatedUsers));
          
          // Log in instantly!
          onLoginSuccess(newUser.name, newUser.title, newUser.email, false);
        } else {
          // Sign In flow
          const matchedUser = users.find(
            (u: any) =>
              u.email.toLowerCase() === email.toLowerCase() && u.password === password
          );

          if (matchedUser) {
            onLoginSuccess(
              matchedUser.name,
              matchedUser.title,
              matchedUser.email,
              matchedUser.isAdmin || false
            );
          } else {
            setErrorMsg('Incorrect email or password.');
          }
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Security database is busy. Please try again.');
      }
    }, 1200);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setGoogleConnecting(true);

    try {
      const result = await googleSignIn();
      setGoogleConnecting(false);
      if (result) {
        const { user: firebaseUser, accessToken } = result;
        const googleUserEmail = firebaseUser.email || 'ldreamer669@gmail.com';
        const googleUserName = firebaseUser.displayName || 'Leo Dreamer';
        const googlePhotoURL = firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

        const stored = localStorage.getItem('lifeos_registered_users');
        const users = stored ? JSON.parse(stored) : [];
        
        let existingUser = users.find((u: any) => u.email.toLowerCase() === googleUserEmail.toLowerCase());
        if (!existingUser) {
          existingUser = {
            email: googleUserEmail,
            password: `google_${Date.now()}`,
            name: googleUserName,
            title: 'Google Workspace Operator',
            avatarUrl: googlePhotoURL,
            isAdmin: false
          };
          localStorage.setItem('lifeos_registered_users', JSON.stringify([...users, existingUser]));
        } else {
          existingUser.avatarUrl = googlePhotoURL;
          existingUser.name = googleUserName;
          localStorage.setItem('lifeos_registered_users', JSON.stringify(users));
        }

        onLoginSuccess(
          existingUser.name,
          existingUser.title || 'Google Workspace Operator',
          existingUser.email,
          existingUser.isAdmin || false,
          googlePhotoURL
        );
      }
    } catch (err: any) {
      setGoogleConnecting(false);
      console.error(err);
      setErrorMsg(`Google Authentication failed: ${err.message || err}`);
    }
  };

  const handleGuestLogin = () => {
    onLoginSuccess('Guest Operator', 'LifeOS Sandbox', 'guest@lifeos.io', false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#02040a] text-zinc-100 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Frosted Glass Background Accents */}
      <div className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[550px] h-[550px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none z-0"></div>

      <div className="w-full max-w-md p-6 sm:p-8 glass-widget relative z-10 text-center animate-fade-in">
        {/* Launcher icon */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 mb-5">
          Ω
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-indigo-400 bg-clip-text text-transparent">
          LifeOS Operating System
        </h1>
        <p className="text-xs text-zinc-500 mt-1.5 font-mono">Personal Workspace Console v1.0.4</p>

        {errorMsg && (
          <div className="mt-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 flex items-start gap-2 text-left">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 text-left">
          {isSignUp && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Your Full Name</label>
              <div className="relative mt-1.5">
                <User size={13} className="absolute left-3 top-3.5 text-zinc-500" />
                <input
                  required
                  type="text"
                  placeholder="e.g. Alexis Carter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs outline-none border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] placeholder-zinc-500 glass-input transition-all duration-300"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email</label>
            <div className="relative mt-1.5">
              <Mail size={13} className="absolute left-3 top-3.5 text-zinc-500" />
              <input
                required
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs outline-none border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] placeholder-zinc-500 glass-input transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Password</label>
            <div className="relative mt-1.5">
              <KeyRound size={13} className="absolute left-3 top-3.5 text-zinc-500" />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                onKeyUp={handlePasswordKeyDown}
                className="w-full pl-9 pr-10 py-2.5 text-xs outline-none border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] placeholder-zinc-500 glass-input transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {isCapsLockOn && (
              <p className="text-[10px] text-amber-400 font-medium mt-1 flex items-center gap-1 animate-pulse">
                <AlertCircle size={11} className="shrink-0" /> Caps Lock is on
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={connecting || googleConnecting}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSignUp ? 'Initializing Database...' : 'Verifying Credentials...'}
              </>
            ) : isSignUp ? (
              <>
                Initialize Database & Log In <ArrowRight size={13} />
              </>
            ) : (
              <>
                Enter Workspace <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="my-5 flex items-center justify-between text-[10px] uppercase font-mono text-zinc-600">
          <span className="w-1/4 h-[1px] bg-zinc-800" />
          <span>Or continue with</span>
          <span className="w-1/4 h-[1px] bg-zinc-800" />
        </div>

        {/* Google Authentication */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={connecting || googleConnecting}
          className="w-full py-2.5 rounded-2xl border border-zinc-800 hover:border-zinc-700 bg-[#0d0e12] hover:bg-[#12141a] text-zinc-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100 shadow-md cursor-pointer disabled:cursor-not-allowed"
        >
          {googleConnecting ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting Google...
            </>
          ) : (
            <>
              {/* Colored SVG Google G Logo */}
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Guest fallback trigger */}
        <div className="mt-5 pt-4 border-t border-white/10 text-xs">
          <p className="text-zinc-500 mb-2.5 font-medium">Want to explore instantly without DB setup?</p>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] shadow rounded-2xl cursor-pointer"
          >
            <Sparkles size={12} className="text-indigo-400" /> Continue as Guest
          </button>
        </div>

        {/* Toggle mode link */}
        <p className="text-[11px] text-zinc-500 mt-6">
          {isSignUp ? 'Already registered?' : 'New to LifeOS?'} {' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-indigo-400 hover:underline font-bold bg-transparent border-none cursor-pointer focus:outline-none"
          >
            {isSignUp ? 'Connect Existing Node' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
}
