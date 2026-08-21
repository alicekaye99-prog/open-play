'use client';

import React, { useState } from 'react';
import { OpenPlayProvider, useOpenPlay } from '../context/OpenPlayContext';
import { SessionLanding } from '../components/SessionLanding';
import { OnboardingFlow } from '../components/OnboardingFlow';
import { CourtCard } from '../components/CourtCard';
import { SidebarWidgets } from '../components/SidebarWidgets';
import { AdventureGuildCards } from '../components/AdventureGuildCards';
import { RecordResultModal, AddPlayerModal, SessionSettingsModal } from '../components/Modals';
import { PlayerProfileModal } from '../components/PlayerProfileModal';
import { PodiumSocialCard } from '../components/PodiumSocialCard';
import { Match } from '../types/pickleball';
import { getSessionRemainingTime } from '../lib/storage';
import { isCloudConfigured } from '../lib/supabase';
import { Settings, Plus, RotateCcw, Sparkles, Clock, Trophy, Minus, MapPin, Cloud, ArrowLeftRight } from 'lucide-react';

function TournamentApp() {
  const {
    currentVenue,
    session,
    courts,
    checkins,
    players,
    isLoaded,
    autoFillCourts,
    setCourtCount,
    advanceStep,
    leaveVenue,
    selectedPlayerId,
    setSelectedPlayerId,
    playersMap
  } = useOpenPlay();

  const [activeTab, setActiveTab] = useState<'courts' | 'players' | 'leaderboard' | 'matchlog'>('courts');
  const [selectedMatchResult, setSelectedMatchResult] = useState<Match | null>(null);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPodiumOpen, setIsPodiumOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center font-mono text-xs text-slate-400">
        INITIALIZING OPEN PLAY CLOUD HUB...
      </div>
    );
  }

  // 1. Session Gate / Landing Screen
  if (session.onboarding_step === 'session_gate' || session.onboarding_step === 'venue_select') {
    return (
      <div className="min-h-screen bg-[#0b1220] text-slate-100 flex flex-col stadium-lights-backdrop">
        <SessionLanding />
      </div>
    );
  }

  // 2. Onboarding Flow (court_setup -> player_setup -> checkin_ready)
  if (session.onboarding_step !== 'active_hub') {
    return (
      <div className="min-h-screen bg-[#0b1220] text-slate-100 flex flex-col stadium-lights-backdrop">
        <header className="border-b border-slate-800/80 px-4 sm:px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#fbbf24] flex items-center justify-center p-2 shadow-[0_0_16px_rgba(251,191,36,0.35)]">
                <svg viewBox="0 0 24 24" fill="#0b1220" className="w-full h-full">
                  <circle cx="12" cy="12" r="10" stroke="#0b1220" strokeWidth="1.5" fill="none" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="16" cy="8" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="8" cy="16" r="1.5" />
                  <circle cx="16" cy="16" r="1.5" />
                </svg>
              </div>
              <div>
                <h1 className="font-scoreboard text-2xl font-bold tracking-tight text-white uppercase italic leading-none">
                  OPEN PLAY
                </h1>
                <p className="text-[11px] text-slate-400">
                  {currentVenue?.name || session.name} • Session Setup
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={leaveVenue}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Landing</span>
            </button>
          </div>
        </header>

        <main className="flex-1">
          <OnboardingFlow />
        </main>

        {selectedPlayerId && playersMap.get(selectedPlayerId) && (
          <PlayerProfileModal
            player={playersMap.get(selectedPlayerId)!}
            onClose={() => setSelectedPlayerId(null)}
          />
        )}
      </div>
    );
  }

  // 3. Main Live Dashboard (active_hub)
  const busyIds = new Set<string>();
  courts.forEach(c => {
    c.current_match?.team_a_ids.forEach(id => busyIds.add(id));
    c.current_match?.team_b_ids.forEach(id => busyIds.add(id));
    c.next_up_match?.team_a_ids.forEach(id => busyIds.add(id));
    c.next_up_match?.team_b_ids.forEach(id => busyIds.add(id));
  });

  const waitingQueue = checkins.filter(c => !busyIds.has(c.player_id));
  const remainingSessionTime = getSessionRemainingTime(session);

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 flex flex-col stadium-lights-backdrop pb-12">
      {/* TOP HEADER */}
      <header className="border-b border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* BRAND */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-full bg-[#fbbf24] flex items-center justify-center p-2 shadow-[0_0_20px_rgba(251,191,36,0.35)] flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="#0b1220" className="w-full h-full">
                <circle cx="12" cy="12" r="10" stroke="#0b1220" strokeWidth="1.5" fill="none" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="16" cy="8" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="8" cy="16" r="1.5" />
                <circle cx="16" cy="16" r="1.5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-scoreboard text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase italic leading-none">
                  OPEN PLAY
                </h1>
                <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#111c30] border border-slate-700 text-slate-300">
                  <Cloud className={`w-3 h-3 ${isCloudConfigured ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
                  <span>{isCloudConfigured ? 'Cloud Live' : 'Local'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans tracking-wide">
                {currentVenue?.name || session.name} • {session.name}
              </p>
            </div>
          </div>

          {/* SESSION INFO BADGE & QUICK ACTIONS */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* VENUE SWITCHER PILL */}
            <button
              onClick={leaveVenue}
              className="px-3 py-1.5 rounded-full bg-[#0b1220] hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center space-x-1.5 transition cursor-pointer"
              title="Switch court location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span className="font-bold text-white max-w-[130px] truncate">{currentVenue?.name || 'Venue'}</span>
              <span className="text-[10px] text-slate-500">⇄</span>
            </button>

            {/* SESSION INFO BADGE */}
            <div className="px-4 py-1.5 rounded-full bg-[#111c30] border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center space-x-2.5">
              <span className="text-slate-400">
                <span className="capitalize">{session.mode}</span>
              </span>

              {/* QUICK IN-SESSION COURT ADJUSTER */}
              <div className="flex items-center space-x-1.5 bg-[#0b1220] px-2 py-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setCourtCount(courts.length - 1)}
                  disabled={courts.length <= 1}
                  className="text-slate-400 hover:text-white disabled:opacity-30 p-0.5 cursor-pointer"
                  title="Remove Court"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono text-[#fbbf24] font-bold text-[11px]">
                  {courts.length} Courts
                </span>
                <button
                  type="button"
                  onClick={() => setCourtCount(courts.length + 1)}
                  disabled={courts.length >= 16}
                  className="text-slate-400 hover:text-white disabled:opacity-30 p-0.5 cursor-pointer"
                  title="Add Court"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[#2dd4bf] font-mono font-bold pl-1 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{remainingSessionTime}</span>
              </span>
            </div>

            {/* PODIUM BUTTON */}
            <button
              onClick={() => setIsPodiumOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#fbbf24] hover:from-amber-400 hover:to-[#f59e0b] text-slate-950 font-scoreboard text-xs uppercase italic font-bold tracking-tight shadow-md flex items-center space-x-1.5 transition active:scale-[0.98] cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              <span>End Session / Podium 🏆</span>
            </button>

            {/* FILL ALL COURTS */}
            <button
              onClick={autoFillCourts}
              className="px-4 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs tracking-tight shadow-md transition flex items-center space-x-1.5 active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Fill All Courts</span>
            </button>

            <button
              onClick={() => setIsAddPlayerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#111c30] hover:bg-slate-800 text-white font-medium text-xs border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Player</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-[#111c30] hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Settings & Courts"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="max-w-7xl mx-auto mt-5 flex space-x-6 text-xs sm:text-sm font-semibold border-t border-slate-800/60 pt-2">
          {[
            { id: 'courts', label: 'Courts' },
            { id: 'players', label: `Players Directory (${players.length})` },
            { id: 'leaderboard', label: 'Leaderboard' },
            { id: 'matchlog', label: 'Match Log' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 transition relative cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#fbbf24] font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fbbf24] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6">
        {activeTab === 'courts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <div className="font-scoreboard text-xl sm:text-2xl font-bold tracking-tight text-white uppercase italic">
                  ACTIVE COURTS
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {waitingQueue.length} Players Waiting in Queue
                </div>
              </div>

              {/* 2x2 Court Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {courts.map(court => (
                  <CourtCard
                    key={court.court_number}
                    court={court}
                    onRecordResult={m => setSelectedMatchResult(m)}
                  />
                ))}
              </div>

              {/* 1-CLICK AUTO-FILL ALL OPEN COURTS */}
              <div className="p-5 rounded-3xl bg-[#111c30] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono uppercase text-[#fbbf24] font-bold flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Live Matchmaking & Rotation</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <span>
                      <strong className="text-white">{waitingQueue.length} players</strong> waiting in queue. Group doubles pairs directly in the sidebar queue below.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={autoFillCourts}
                  className="px-6 py-3 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-base uppercase italic font-bold tracking-tight shadow-lg flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Fill All Open Courts</span>
                </button>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="lg:col-span-5">
              <SidebarWidgets onOpenNewPlayer={() => setIsAddPlayerOpen(true)} />
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <AdventureGuildCards onOpenNewPlayer={() => setIsAddPlayerOpen(true)} />
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="font-scoreboard text-xl sm:text-2xl font-bold tracking-tight text-white uppercase italic">
              REAL-TIME RANKED ELO LADDER
            </div>
            <SidebarWidgets onOpenNewPlayer={() => setIsAddPlayerOpen(true)} />
          </div>
        )}

        {activeTab === 'matchlog' && (
          <div className="space-y-4">
            <div className="font-scoreboard text-xl sm:text-2xl font-bold tracking-tight text-white uppercase italic">
              SESSION MATCH HISTORY & ELO DELTAS
            </div>
            <SidebarWidgets onOpenNewPlayer={() => setIsAddPlayerOpen(true)} />
          </div>
        )}
      </main>

      {/* MODALS */}
      {selectedMatchResult && (
        <RecordResultModal
          match={selectedMatchResult}
          onClose={() => setSelectedMatchResult(null)}
        />
      )}

      {isAddPlayerOpen && (
        <AddPlayerModal onClose={() => setIsAddPlayerOpen(false)} />
      )}

      {isSettingsOpen && (
        <SessionSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {selectedPlayerId && playersMap.get(selectedPlayerId) && (
        <PlayerProfileModal
          player={playersMap.get(selectedPlayerId)!}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {isPodiumOpen && (
        <PodiumSocialCard onClose={() => setIsPodiumOpen(false)} />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <OpenPlayProvider>
      <TournamentApp />
    </OpenPlayProvider>
  );
}
