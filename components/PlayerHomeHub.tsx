'use client';

import React, { useState, useRef } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { getRankInfo } from '../lib/progression';
import { PvPGrindModal } from './PvPGrindModal';
import { 
  Home, 
  BarChart2, 
  Swords, 
  Trophy, 
  User, 
  Settings, 
  HelpCircle, 
  Camera, 
  LogOut, 
  Sparkles, 
  Info,
  Menu, 
  X,
  History,
  TrendingUp,
  Target,
  MapPin,
  ArrowRight
} from 'lucide-react';

/* Custom SVG Laurel Wreath */
function LaurelWreathIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.5 4.5 8.3L6 22l3-1 3 1v-3" />
      <path d="M12 2c5.5 0 10 4.5 10 10 0 3.5-1.8 6.5-4.5 8.3L18 22l-3-1-3 1v-3" />
    </svg>
  );
}

/* Custom SVG Pickleball Ball Watermark */
function PickleballBallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
    </svg>
  );
}

/* Paddle Silhouette with Question Mark for Provisional Rank */
function ProvisionalPaddleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 48" fill="currentColor" className={className}>
      <rect x="4" y="2" width="24" height="30" rx="8" fill="#334155" />
      <rect x="13" y="32" width="6" height="14" rx="2" fill="#1e293b" />
      <text x="16" y="22" fill="#94a3b8" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">?</text>
    </svg>
  );
}

export function PlayerHomeHub() {
  const { 
    currentPlayer, 
    matches = [], 
    updatePlayerAvatar,
    logout,
    setSelectedPlayerId,
    setActiveRole,
    advanceStep
  } = useOpenPlay();

  const [activeNav, setActiveNav] = useState<'home' | 'stats' | 'matches' | 'rankings' | 'profile'>('home');
  const [isPvPModalOpen, setIsPvPModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentPlayer) return null;

  const isProvisional = currentPlayer.placement_status === 'provisional';
  const placementMatches = currentPlayer.placement_matches_played || 0;

  const rankInfo = getRankInfo(currentPlayer.rank_value || 1);
  const highestRankInfo = getRankInfo(currentPlayer.highest_rank_value || currentPlayer.rank_value || 1);

  const totalDoubles = (currentPlayer.wins_doubles || 0) + (currentPlayer.losses_doubles || 0);
  const totalSingles = (currentPlayer.wins_singles || 0) + (currentPlayer.losses_singles || 0);
  const totalMatches = totalDoubles + totalSingles;
  const totalWins = (currentPlayer.wins_doubles || 0) + (currentPlayer.wins_singles || 0);
  const totalLosses = (currentPlayer.losses_doubles || 0) + (currentPlayer.losses_singles || 0);
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Please select an image smaller than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        updatePlayerAvatar(currentPlayer.id, reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'matches', label: 'Matches', icon: Swords },
    { id: 'rankings', label: 'Rankings', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col justify-between max-w-md mx-auto relative pb-24 shadow-2xl">
      
      {/* ========================================================================= */}
      {/* STICKY MOBILE TOP BAR (Safe Area Supported) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#07080c]/95 backdrop-blur-md border-b border-[#161a26] px-4 py-3 safe-top flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-xl bg-[#0e111a] text-slate-300 hover:text-white border border-slate-800 transition active:scale-95 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="text-center flex flex-col items-center">
          <span className="font-scoreboard text-2xl font-black italic tracking-tighter text-[#f59e0b] uppercase leading-none drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            PIKOL
          </span>
          <span className="text-[8px] font-mono font-bold tracking-widest text-slate-300 uppercase leading-none mt-0.5">
            LEGENDS
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-[#0e111a] hover:border-[#f59e0b] text-slate-300 hover:text-[#f59e0b] font-mono text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </header>

      {/* ========================================================================= */}
      {/* MAIN MOBILE APP FEED */}
      {/* ========================================================================= */}
      <main className="px-4 py-4 space-y-4 flex-1">
        
        {/* 1. PLAYER PROFILE CARD WITH EMBEDDED CTA BUTTON */}
        <div className="rounded-3xl bg-[#0c0f17] border border-[#192030] shadow-xl p-5 space-y-4 relative">
          
          <div className="flex items-center space-x-3.5">
            {/* Avatar Frame with Upload Badge */}
            <div className="relative flex-shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-2xl bg-[#111624] border border-slate-700 hover:border-[#f59e0b] flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition"
                title="Upload Photo"
              >
                {currentPlayer.avatar_url ? (
                  <img
                    src={currentPlayer.avatar_url}
                    alt={currentPlayer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <User className="w-7 h-7" />
                    <span className="text-[7px] font-mono font-bold mt-0.5">ADD PHOTO</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#f59e0b] text-slate-950 flex items-center justify-center shadow-md border border-[#0c0f17] transition cursor-pointer"
              >
                <Camera className="w-3 h-3" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Identity & Metadata */}
            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold text-[#f59e0b] bg-[#07080c] px-2 py-0.5 rounded border border-[#f59e0b]/50">
                  {currentPlayer.id || 'PL-184'}
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  {currentPlayer.gender || 'Male'} • {currentPlayer.age ? `${currentPlayer.age} yrs` : '22 yrs'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 pt-0.5">
                {isProvisional && (
                  <span className="text-[9px] font-mono font-bold bg-[#071c1f] text-[#2dd4bf] border border-[#14534f] px-2 py-0.5 rounded-full">
                    Provisional ({placementMatches}/5)
                  </span>
                )}
              </div>
              <h1 className="font-scoreboard text-3xl font-black text-white uppercase italic tracking-tight leading-none pt-0.5 truncate">
                {currentPlayer.name || 'BRYCE1'}
              </h1>
            </div>
          </div>

          {/* Full-Width Mobile Gold PvP Grind Button */}
          <button
            type="button"
            onClick={() => setIsPvPModalOpen(true)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-[#f59e0b] to-amber-500 hover:brightness-110 text-slate-950 font-scoreboard text-base uppercase italic font-black tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer"
          >
            <Swords className="w-4 h-4 stroke-[2.5]" />
            <span>PVP GRIND (1V1 / 2V2)</span>
          </button>
        </div>

        {/* 2. PLACEMENT / PROVISIONAL CALIBRATION CARD */}
        <div className="rounded-3xl bg-gradient-to-b from-[#0b0e14] via-[#090b10] to-[#07080c] border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.1)] p-5 space-y-3.5 relative overflow-hidden">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-12 flex-shrink-0 flex items-center justify-center">
                <ProvisionalPaddleIcon className="w-full h-full text-slate-500" />
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#f59e0b] font-bold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#f59e0b]" />
                  <span>PLACEMENT MODE ACTIVE</span>
                </div>
                <div className="font-scoreboard text-3xl font-black text-white uppercase italic leading-none">
                  {isProvisional ? 'PROVISIONAL' : rankInfo.displayName}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {5 - placementMatches} placement matches remaining
                </div>
              </div>
            </div>

            <div className="text-right font-mono flex-shrink-0">
              <div className="text-[9px] uppercase text-slate-400 font-bold">STATUS</div>
              <div className="font-scoreboard text-2xl font-black text-[#f59e0b] leading-none mt-0.5">
                {placementMatches} / 5 PLACED
              </div>
            </div>
          </div>

          {/* 5-Segment Progress Bar */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-300 font-medium flex items-center space-x-1">
                <span>Placement Calibration</span>
                <Info className="w-3 h-3 text-slate-400" />
              </span>
              <span className="text-[#f59e0b] font-bold">{placementMatches} / 5 Completed</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {[1, 2, 3, 4, 5].map(matchNum => {
                const isCompleted = matchNum <= placementMatches;
                return (
                  <div
                    key={matchNum}
                    className={`flex-1 h-2.5 rounded-full transition-all ${
                      isCompleted
                        ? 'bg-gradient-to-r from-amber-500 to-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : 'bg-[#11141c] border border-slate-800'
                    }`}
                  />
                );
              })}
            </div>

            <p className="text-[10px] font-mono text-slate-400 leading-snug">
              Play matches in live venue open play or PvP Grind. After match 5, your official tier will calibrate.
            </p>
          </div>
        </div>

        {/* 3. 2x2 MOBILE STAT CARDS GRID */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Card 1: Total Matches */}
          <div className="p-4 bg-[#0c0f17] border border-[#192030] rounded-2xl space-y-1 relative overflow-hidden shadow-md flex flex-col justify-between">
            <div>
              <div className="text-[9px] font-mono uppercase text-slate-400 font-bold">TOTAL MATCHES</div>
              <div className="font-scoreboard text-3xl font-black text-white italic leading-tight">{totalMatches}</div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Recorded</div>
            <PickleballBallIcon className="w-18 h-18 absolute -right-2 -bottom-2 text-slate-600 opacity-10 pointer-events-none" />
          </div>

          {/* Card 2: W/L Record */}
          <div className="p-4 bg-[#0c0f17] border border-[#192030] rounded-2xl space-y-1 relative overflow-hidden shadow-md flex flex-col justify-between">
            <div>
              <div className="text-[9px] font-mono uppercase text-slate-400 font-bold">W / L RECORD</div>
              <div className="font-scoreboard text-3xl font-black italic leading-tight">
                <span className="text-[#2dd4bf]">{totalWins}W</span> <span className="text-slate-500 font-sans text-xl">-</span> <span className="text-[#f97316]">{totalLosses}L</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Overall</div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-18 h-18 absolute -right-2 -bottom-2 text-[#f59e0b] opacity-15 pointer-events-none">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>

          {/* Card 3: Win Rate */}
          <div className="p-4 bg-[#0c0f17] border border-[#192030] rounded-2xl space-y-1 relative overflow-hidden shadow-md flex flex-col justify-between">
            <div>
              <div className="text-[9px] font-mono uppercase text-slate-400 font-bold">WIN RATE</div>
              <div className="font-scoreboard text-3xl font-black text-[#f59e0b] italic leading-tight">{overallWinRate}%</div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Career</div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-18 h-18 absolute -right-2 -bottom-2 text-[#f59e0b] opacity-15 pointer-events-none">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>

          {/* Card 4: Highest Rank */}
          <div className="p-4 bg-[#0c0f17] border border-[#192030] rounded-2xl space-y-1 relative overflow-hidden shadow-md flex flex-col justify-between">
            <div>
              <div className="text-[9px] font-mono uppercase text-slate-400 font-bold">HIGHEST RANK</div>
              <div className="py-0.5">
                <ProvisionalPaddleIcon className="w-4 h-6 text-slate-400" />
              </div>
              <div className="font-scoreboard text-xs font-black text-white uppercase italic leading-tight truncate">
                {isProvisional ? `PROVISIONAL (${placementMatches}/5)` : highestRankInfo.displayName}
              </div>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">Peak Career</div>
            <LaurelWreathIcon className="w-18 h-18 absolute -right-2 -bottom-2 text-slate-500 opacity-15 pointer-events-none" />
          </div>

        </div>

        {/* 4. FULL-WIDTH SLIM TAGLINE BANNER */}
        <div className="w-full py-3 px-4 rounded-2xl bg-[#090c13] border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)] flex items-center justify-center space-x-2 text-center">
          <Trophy className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
          <span className="font-scoreboard text-xs tracking-wider uppercase italic font-bold text-white">
            RANK UP. <span className="text-[#f59e0b]">EARN CP.</span> BECOME A LEGEND.
          </span>
        </div>

        {/* 5. RECENT ACTIVITY CARD */}
        <div className="rounded-3xl bg-[#0c0f17] border border-[#192030] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-[#f59e0b]" />
              <span className="font-scoreboard text-sm font-bold uppercase italic tracking-wide text-white">
                RECENT MATCHES
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400">{playerMatches.length} Matches</span>
          </div>

          {playerMatches.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#07080c] border border-slate-800/60 text-center space-y-2.5">
              <p className="text-xs text-slate-400 font-sans">
                No matches recorded yet. Start your placement grind!
              </p>
              <button
                type="button"
                onClick={() => setIsPvPModalOpen(true)}
                className="w-full py-2 rounded-xl bg-amber-500/10 text-[#f59e0b] border border-amber-500/30 font-scoreboard text-xs uppercase italic font-bold flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
              >
                <span>Launch PvP Grind</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {playerMatches.slice(0, 3).map(m => {
                const inTeamA = (m.team_a_ids || []).includes(currentPlayer.id);
                const isWinner = (m.status === 'teamA_win' && inTeamA) || (m.status === 'teamB_win' && !inTeamA);
                const cpDelta = m.player_cp_deltas ? (m.player_cp_deltas[currentPlayer.id] || 0) : (isWinner ? 20 : -20);
                return (
                  <div key={m.id} className="p-2.5 bg-[#07080c] border border-slate-800/60 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="font-bold text-white text-[11px]">Court {m.court_number || 'PvP'} • <span className="capitalize text-slate-400">{m.mode}</span></div>
                      <div className="text-[10px] text-slate-500">{m.time_str}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isWinner ? 'bg-emerald-950 text-[#2dd4bf]' : 'bg-rose-950 text-[#f97316]'}`}>
                        {isWinner ? 'WIN' : 'LOSS'}
                      </span>
                      <div className="text-[10px] text-slate-300 font-bold mt-0.5">
                        {isProvisional ? 'Placement' : `${cpDelta >= 0 ? `+${cpDelta}` : cpDelta} CP`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* ========================================================================= */}
      {/* PERSISTENT MOBILE BOTTOM NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#090b10]/95 backdrop-blur-lg border-t border-[#141824] px-3 py-2 safe-bottom flex items-center justify-around z-40 shadow-2xl">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveNav(item.id);
                if (item.id === 'profile') {
                  setSelectedPlayerId(currentPlayer.id);
                }
              }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center space-y-1 transition active:scale-95 cursor-pointer ${
                isActive ? 'text-[#f59e0b]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] drop-shadow-[0_0_8px_#f59e0b]' : ''}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#f59e0b] rounded-full shadow-[0_0_6px_#f59e0b]" />
                )}
              </div>
              <span className={`text-[10px] font-sans font-semibold tracking-tight leading-none ${isActive ? 'text-[#f59e0b]' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER / SLIDE-OVER MENU */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start">
          <div className="w-4/5 max-w-xs bg-[#090b10] border-r border-[#141824] h-full p-5 flex flex-col justify-between safe-top safe-bottom">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="font-scoreboard text-2xl font-black text-[#f59e0b] italic">
                  PIKOL LEGENDS
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setSelectedPlayerId(currentPlayer.id);
                  }}
                  className="w-full p-3 rounded-2xl bg-[#0c0f17] border border-slate-800 flex items-center space-x-3 text-left"
                >
                  <User className="w-5 h-5 text-[#f59e0b]" />
                  <div>
                    <div className="text-xs font-bold text-white">{currentPlayer.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{currentPlayer.id} • Player</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveRole('venue_owner');
                    advanceStep('session_gate');
                  }}
                  className="w-full p-3 rounded-2xl bg-[#0c0f17] border border-slate-800 flex items-center space-x-3 text-left hover:border-teal-500/50"
                >
                  <MapPin className="w-5 h-5 text-[#2dd4bf]" />
                  <div>
                    <div className="text-xs font-bold text-white">Court Owner Hub</div>
                    <div className="text-[10px] font-mono text-slate-400">Host Venues & Stacking</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => alert('Settings configured to tournament standards.')}
                className="w-full py-2.5 rounded-xl bg-[#0c0f17] text-slate-300 border border-slate-800 text-xs font-mono flex items-center justify-center space-x-2"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>App Settings</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-900 text-xs font-mono flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PVP GRIND MODAL */}
      {isPvPModalOpen && (
        <PvPGrindModal onClose={() => setIsPvPModalOpen(false)} />
      )}
    </div>
  );
}
