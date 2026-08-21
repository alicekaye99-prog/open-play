'use client';

import React from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { getSessionRemainingTime, isSessionValid } from '../lib/storage';
import { Play, Plus, Clock, Users, Shield, Sparkles, RotateCcw } from 'lucide-react';

export function SessionLanding() {
  const {
    session,
    players,
    hasExistingSession,
    continueExistingSession,
    advanceStep,
    clearAllData
  } = useOpenPlay();

  const isSessionActive = hasExistingSession && isSessionValid(session);
  const remainingTimeStr = getSessionRemainingTime(session);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* BRAND BANNER */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#fbbf24] flex items-center justify-center p-3 shadow-[0_0_30px_rgba(251,191,36,0.35)] mx-auto">
          <svg viewBox="0 0 24 24" fill="#0b1220" className="w-full h-full">
            <circle cx="12" cy="12" r="10" stroke="#0b1220" strokeWidth="1.5" fill="none" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="16" cy="8" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="8" cy="16" r="1.5" />
            <circle cx="16" cy="16" r="1.5" />
          </svg>
        </div>
        <h1 className="font-scoreboard text-4xl sm:text-5xl font-bold tracking-tight text-white uppercase italic leading-none">
          OPEN PLAY
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-mono">
          Ranked Pickleball Session Manager & Matchmaking Queue
        </p>
      </div>

      {/* PERMANENT DATABASE STATUS CHIP */}
      <div className="p-4 rounded-2xl bg-[#111c30] border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-300">
          <Shield className="w-4 h-4 text-[#fbbf24]" />
          <span>Permanent Player Registry:</span>
        </div>
        <span className="font-bold text-white bg-[#0b1220] px-3 py-1 rounded-xl border border-slate-700">
          {players.length} Players Stored Across Sessions
        </span>
      </div>

      {/* 12-HOUR ACTIVE SESSION CARD */}
      {isSessionActive ? (
        <div className="bg-[#111c30] border-2 border-[#fbbf24] rounded-3xl p-6 sm:p-8 shadow-[0_0_30px_rgba(251,191,36,0.15)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-ping" />
                <span className="text-xs font-mono font-bold text-[#fbbf24] uppercase tracking-wider">
                  Active 12-Hour Session Found
                </span>
              </div>
              <h2 className="font-scoreboard text-2xl sm:text-3xl font-bold text-white uppercase italic mt-1">
                {session.name}
              </h2>
            </div>

            <div className="flex items-center space-x-1.5 font-mono text-xs text-[#2dd4bf] bg-[#0b1220] px-3 py-1.5 rounded-xl border border-[#2dd4bf]/40 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{remainingTimeStr}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#0b1220] rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Format</div>
              <div className="text-white font-bold capitalize mt-0.5">{session.mode} Play</div>
            </div>
            <div className="p-3 bg-[#0b1220] rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Courts</div>
              <div className="text-white font-bold mt-0.5">{session.court_count} Courts Active</div>
            </div>
            <div className="p-3 bg-[#0b1220] rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-slate-400 text-[10px] uppercase">Queue Capacity</div>
              <div className="text-white font-bold mt-0.5">{session.total_session_capacity} Total Players</div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={continueExistingSession}
              className="w-full py-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-lg uppercase italic font-bold tracking-tight shadow-xl flex items-center justify-center space-x-2 transition active:scale-[0.99]"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Continue Active Session</span>
            </button>

            <button
              onClick={() => advanceStep('court_setup')}
              className="w-full py-3 rounded-2xl bg-[#0b1220] hover:bg-slate-800 text-slate-300 font-mono text-xs font-semibold border border-slate-700 transition"
            >
              Start Fresh Session (Archive Current) +
            </button>
          </div>
        </div>
      ) : (
        /* NO ACTIVE SESSION OR SESSION EXPIRED (>12 HOURS) */
        <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="space-y-2">
            <div className="font-scoreboard text-2xl sm:text-3xl font-bold text-white uppercase italic">
              START TODAY'S OPEN PLAY
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Sessions last 12 hours. All previously registered players stay saved in your registry — search and recruit them for today's session in the next step.
            </p>
          </div>

          <button
            onClick={() => advanceStep('court_setup')}
            className="w-full py-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-lg uppercase italic font-bold tracking-tight shadow-xl flex items-center justify-center space-x-2 transition active:scale-[0.99]"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create New Session Setup</span>
          </button>
        </div>
      )}
    </div>
  );
}
