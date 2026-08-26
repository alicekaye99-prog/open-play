'use client';

import React, { useState } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { UserRole, Gender } from '../types/pickleball';
import { 
  User, 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  UserPlus, 
  X, 
  Loader2, 
  ShieldAlert,
  Trophy 
} from 'lucide-react';

export function AuthLanding() {
  const { login, signup } = useOpenPlay();

  const [roleTab, setRoleTab] = useState<UserRole>('player');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('Co-ed / Other');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        await login(emailOrUsername.trim(), password, roleTab);
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter a display name for your profile.');
        }
        await signup({
          email: emailOrUsername.trim(),
          password,
          role: roleTab,
          displayName: displayName.trim(),
          age: age ? Number(age) : undefined,
          gender: gender
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMessage(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0f] text-slate-100 flex flex-col justify-between max-w-md mx-auto safe-bottom relative overflow-y-auto select-none shadow-2xl">
      
      {/* ========================================================================= */}
      {/* 1. FULL SPLASH ART (~48% OF SCREEN) + SOFT GRADIENT FADE + WORDMARK */}
      {/* ========================================================================= */}
      <div className="relative w-full aspect-square sm:h-[48vh] max-h-[440px] overflow-hidden flex-shrink-0 bg-[#0a0a0f]">
        {/* Full Character Artwork */}
        <img
          src="/assets/Splash-art.jpeg"
          alt="Pikol Legends Hero"
          className="w-full h-full object-cover object-top filter brightness-105 contrast-110 select-none pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/Splash-art.jpeg';
          }}
        />

        {/* Soft Vertical Dissolve Gradient on Bottom Edge */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to top, #0a0a0f 0%, rgba(10, 10, 15, 0.95) 14%, rgba(10, 10, 15, 0.5) 28%, transparent 55%),
              linear-gradient(to bottom, rgba(10, 10, 15, 0.4) 0%, transparent 15%)
            `
          }}
        />

        {/* Wordmark Logo Lockup (Scaled to 13.5 Ratio) */}
        <div className="absolute bottom-1 inset-x-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none z-10 space-y-1">
          <img
            src="/assets/pikol-legends-wordmark.png"
            alt="PIKOL LEGENDS"
            className="h-16 sm:h-20 w-auto max-w-[92%] object-contain drop-shadow-[0_4px_25px_rgba(245,158,11,0.75)]"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const textFallback = document.getElementById('wordmark-text-fallback');
              if (textFallback) textFallback.style.display = 'block';
            }}
          />
          
          <div id="wordmark-text-fallback" className="hidden font-scoreboard text-5xl sm:text-6xl font-black italic tracking-tight text-[#f59e0b] uppercase leading-none drop-shadow-[0_2px_20px_rgba(245,158,11,0.75)]">
            PIKOL LEGENDS
          </div>

          <p className="text-[13.5px] font-mono tracking-[0.22em] text-slate-200 uppercase font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            RANKED PICKLEBALL PROGRESSION ENGINE
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTH FORM CONTAINER */}
      {/* ========================================================================= */}
      <div className="px-5 pt-3 pb-3 space-y-3.5 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        
        {/* Two-Tab Role Selector (PLAYER vs COURT OWNER) */}
        <div className="grid grid-cols-2 gap-3 font-scoreboard">
          <button
            type="button"
            onClick={() => {
              setRoleTab('player');
              setErrorMessage(null);
            }}
            className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold uppercase italic tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              roleTab === 'player'
                ? 'bg-[#121927] text-[#f59e0b] border-2 border-[#f59e0b] shadow-[0_0_16px_rgba(245,158,11,0.3)]'
                : 'bg-[#0c1017] text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <User className="w-4 h-4 stroke-[2.5]" />
            <span>PLAYER</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab('venue_owner');
              setErrorMessage(null);
            }}
            className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold uppercase italic tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              roleTab === 'venue_owner'
                ? 'bg-[#121927] text-[#f59e0b] border-2 border-[#f59e0b] shadow-[0_0_16px_rgba(245,158,11,0.3)]'
                : 'bg-[#0c1017] text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4 stroke-[2]" />
            <span>COURT OWNER</span>
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/85 border border-rose-600/80 text-rose-200 text-xs font-mono flex items-center space-x-2 shadow-md">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Display Name (Sign Up Mode) */}
          {authMode === 'signup' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                DISPLAY NAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Bryce Rodriguez"
                  className="w-full bg-[#0c101a]/90 border border-slate-800 focus:border-[#f59e0b] rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition font-sans"
                />
              </div>
            </div>
          )}

          {/* Email or Username Input */}
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={emailOrUsername}
              onChange={e => setEmailOrUsername(e.target.value)}
              placeholder="Enter email or username"
              className="w-full bg-[#0c101a]/90 border border-slate-800 focus:border-[#f59e0b] rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition font-sans"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-[#0c101a]/90 border border-slate-800 focus:border-[#f59e0b] rounded-2xl pl-11 pr-11 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Signup Extra Details */}
          {authMode === 'signup' && roleTab === 'player' && (
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <div>
                <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">Age (Optional)</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={age}
                  onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 22"
                  className="w-full bg-[#0c101a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#f59e0b]"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as Gender)}
                  className="w-full bg-[#0c101a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f59e0b]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Co-ed / Other">Co-ed / Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          {/* Main LOG IN Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] hover:brightness-110 text-slate-950 font-scoreboard text-xl uppercase italic font-black tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center space-x-2 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : authMode === 'login' ? (
              <>
                <span>LOG IN</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </>
            ) : (
              <>
                <span>CREATE {roleTab === 'player' ? 'PLAYER' : 'OWNER'} ACCOUNT</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </>
            )}
          </button>

          {/* Forgot Password Link */}
          {authMode === 'login' && (
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-xs font-sans text-[#f59e0b]/90 hover:text-[#f59e0b] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* OR Divider */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full border-t border-slate-800/80" />
            <span className="absolute px-3 bg-[#0a0a0f] text-[10px] font-mono uppercase text-slate-500 tracking-widest font-bold">
              OR
            </span>
          </div>

          {/* Outlined CREATE NEW ACCOUNT Button */}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setErrorMessage(null);
            }}
            className="w-full py-3.5 rounded-2xl bg-transparent hover:bg-slate-900/40 border border-[#f59e0b]/75 hover:border-[#f59e0b] text-[#f59e0b] font-scoreboard text-sm uppercase italic font-bold tracking-wider transition flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>{authMode === 'login' ? 'CREATE NEW ACCOUNT' : 'ALREADY HAVE AN ACCOUNT? LOG IN'}</span>
          </button>
        </form>

      </div>

      {/* ========================================================================= */}
      {/* 3. FOOTER MOTTO LINE */}
      {/* ========================================================================= */}
      <div className="text-center text-[10px] font-mono tracking-[0.2em] text-[#f59e0b]/90 uppercase flex items-center justify-center space-x-2 py-3 flex-shrink-0">
        <Trophy className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
        <span>RANK UP. EARN CP. BECOME A LEGEND.</span>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1626] border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-scoreboard text-lg font-bold tracking-tight text-white uppercase italic">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-[#0c2e1b] rounded-2xl border border-[#2dd4bf] text-center space-y-1">
                <div className="text-xs font-mono font-bold text-[#2dd4bf]">Reset Email Sent</div>
                <p className="text-[11px] text-slate-300">Check your inbox for recovery instructions.</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-300">
                  Enter your email address to receive password recovery instructions.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0a0a0f] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#f59e0b]"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#f59e0b] text-[#0a0a0f] font-scoreboard text-xs uppercase italic font-bold tracking-wider cursor-pointer"
                >
                  Send Recovery Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
