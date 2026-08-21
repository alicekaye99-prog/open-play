'use client';

import React, { useState } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { GameMode, Gender, Player } from '../types/pickleball';
import { ArrowRight, Plus, Check, Sparkles, Search, UserPlus, Shield, UserCheck } from 'lucide-react';

export function OnboardingFlow() {
  const {
    session,
    players = [],
    checkins = [],
    setupSession,
    createPlayer,
    recruitPlayerToSession,
    removePlayerFromSession,
    advanceStep,
    toggleCheckIn,
    checkInAll,
    clearAllCheckins,
    autoFillCourts,
    setSelectedPlayerId
  } = useOpenPlay();

  // STEP 1 FORM STATE: Venue & Queue Allocation
  const [courtName, setCourtName] = useState(session?.name || 'Friday Night Open');
  const [courtCount, setCourtCount] = useState(session?.court_count || 4);
  const [queuePlayersPerCourt, setQueuePlayersPerCourt] = useState(session?.queue_players_per_court || 12);
  const [mode, setMode] = useState<GameMode>(session?.mode || 'doubles');

  // STEP 2 FORM STATE: Search Stored & Create New
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAge, setNewPlayerAge] = useState<number | ''>('');
  const [newPlayerGender, setNewPlayerGender] = useState<Gender>('Male');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Dynamic capacity calculations
  const activePerCourt = mode === 'singles' ? 2 : 4;
  const totalCapacity = (courtCount || 4) * (queuePlayersPerCourt || 12);
  const activeCapacity = (courtCount || 4) * activePerCourt;
  const queueCapacity = Math.max(0, totalCapacity - activeCapacity);

  const recruitedPlayerIds = new Set((checkins || []).map(c => c?.player_id).filter(Boolean));

  // Safe search filter
  const filteredStoredPlayers = (players || []).filter(p => {
    if (!p) return false;
    const name = (p.name || '').toLowerCase();
    const id = (p.id || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    return name.includes(query) || id.includes(query);
  });

  const handleProceedToStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setupSession(courtName || 'Open Play Session', Number(courtCount) || 4, mode, Number(queuePlayersPerCourt) || 12);
  };

  const handleCreateNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    // Strictly saves player to permanent directory without auto-queueing
    createPlayer(
      newPlayerName,
      newPlayerAge ? Number(newPlayerAge) : undefined,
      newPlayerGender
    );
    setNewPlayerName('');
    setNewPlayerAge('');
    setIsCreatingNew(false);
  };

  const handleStartTournament = () => {
    advanceStep('active_hub');
    autoFillCourts();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* ONBOARDING PROGRESS INDICATOR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        {[
          { step: 'court_setup', label: '1. Venue & Capacity' },
          { step: 'player_setup', label: '2. Search & Recruit Players' },
          { step: 'checkin_ready', label: '3. Check-In & Launch' }
        ].map((item, idx) => {
          const isActive = session.onboarding_step === item.step;
          const isDone =
            (item.step === 'court_setup' && session.onboarding_step !== 'court_setup') ||
            (item.step === 'player_setup' && session.onboarding_step === 'checkin_ready');

          return (
            <div key={item.step} className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-scoreboard font-bold text-xs ${
                isActive
                  ? 'bg-[#fbbf24] text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                  : isDone
                  ? 'bg-[#14532d] text-[#2dd4bf]'
                  : 'bg-[#111c30] text-slate-500 border border-slate-700'
              }`}>
                {isDone ? '✓' : idx + 1}
              </div>
              <span className={`text-xs sm:text-sm font-semibold ${
                isActive ? 'text-white font-bold' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: VENUE & QUEUE CAPACITY SETUP */}
      {session.onboarding_step === 'court_setup' && (
        <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div>
            <div className="font-scoreboard text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase italic">
              CONFIGURE VENUE & QUEUE CAPACITY
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Set your court count and players per court budget. Total capacity is auto-computed.
            </p>
          </div>

          <form onSubmit={handleProceedToStep2} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Court / Session Name
                </label>
                <input
                  type="text"
                  required
                  value={courtName}
                  onChange={e => setCourtName(e.target.value)}
                  placeholder="e.g. Friday Night Open"
                  className="w-full bg-[#0b1220] border border-slate-700 focus:border-[#fbbf24] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    How Many Courts?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    required
                    value={courtCount}
                    onChange={e => setCourtCount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#0b1220] border border-slate-700 focus:border-[#fbbf24] rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Total Players Per Court
                  </label>
                  <input
                    type="number"
                    min={activePerCourt}
                    max="30"
                    required
                    value={queuePlayersPerCourt}
                    onChange={e => setQueuePlayersPerCourt(Math.max(activePerCourt, Number(e.target.value)))}
                    className="w-full bg-[#0b1220] border border-slate-700 focus:border-[#fbbf24] rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none transition"
                  />
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">e.g. 12 players/court</span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value as GameMode)}
                    className="w-full bg-[#0b1220] border border-slate-700 focus:border-[#fbbf24] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                  >
                    <option value="doubles">Doubles (4 Active on Court)</option>
                    <option value="singles">Singles (2 Active on Court)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AUTO-TOTAL CAPACITY CARD */}
            <div className="p-5 rounded-2xl bg-[#0c2e1b] border border-[#1b4d2e] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#2dd4bf] font-bold">
                  Total Session Capacity
                </div>
                <div className="font-scoreboard text-3xl font-bold text-white italic">
                  {totalCapacity}
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {courtCount} Courts × {queuePlayersPerCourt} Players
                </div>
              </div>

              <div className="sm:border-l border-slate-700/80 sm:pl-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Active On Courts
                </div>
                <div className="font-scoreboard text-3xl font-bold text-[#fbbf24] italic">
                  {activeCapacity}
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {courtCount} Courts × {activePerCourt} Playing
                </div>
              </div>

              <div className="sm:border-l border-slate-700/80 sm:pl-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Waiting Queue Budget
                </div>
                <div className="font-scoreboard text-3xl font-bold text-slate-200 italic">
                  {queueCapacity}
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Rotating in Queue
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleProceedToStep2()}
              className="w-full py-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-lg uppercase italic font-bold tracking-tight shadow-xl flex items-center justify-center space-x-2 transition active:scale-[0.99] cursor-pointer"
            >
              <span>Continue to Player Recruitment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: SEARCH & RECRUIT STORED PLAYERS + REGISTER NEW WALK-INS */}
      {session.onboarding_step === 'player_setup' && (
        <div className="space-y-6">
          <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="font-scoreboard text-2xl font-bold tracking-tight text-white uppercase italic">
                  RECRUIT PLAYERS FOR TODAY'S SESSION
                </div>
                <p className="text-xs text-slate-400">
                  Search registered players and tap <strong>+ Recruit</strong> to import them into today's queue.
                </p>
              </div>

              <div className="font-mono text-xs text-[#fbbf24] bg-[#0b1220] px-3.5 py-1.5 rounded-xl border border-slate-700 font-bold">
                Recruited: {checkins.length} / {session.total_session_capacity || 48} Target
              </div>
            </div>

            {/* SEARCH STORED PLAYERS BAR */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search registered players by name or ID (PL-101)..."
                  className="w-full bg-[#0b1220] border border-slate-700 focus:border-[#fbbf24] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0b1220] hover:bg-slate-800 text-[#fbbf24] border border-[#fbbf24]/40 font-mono text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isCreatingNew ? 'Close Form' : '+ New Player'}</span>
              </button>
            </div>

            {/* REGISTER NEW PLAYER FORM */}
            {isCreatingNew && (
              <form onSubmit={handleCreateNewPlayer} className="p-4 bg-[#0b1220] border border-[#fbbf24]/40 rounded-2xl space-y-3">
                <div className="text-xs font-mono uppercase text-[#fbbf24] font-bold">
                  Register Player to Directory (Assigned ID: PL-{100 + (players?.length || 0) + 1})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Player Name *</label>
                    <input
                      type="text"
                      required
                      value={newPlayerName}
                      onChange={e => setNewPlayerName(e.target.value)}
                      placeholder="e.g. Jordan Chen"
                      className="w-full bg-[#111c30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Age (Optional)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={newPlayerAge}
                      onChange={e => setNewPlayerAge(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 26"
                      className="w-full bg-[#111c30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Gender</label>
                    <select
                      value={newPlayerGender}
                      onChange={e => setNewPlayerGender(e.target.value as Gender)}
                      className="w-full bg-[#111c30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Co-ed / Other">Co-ed / Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#fbbf24] text-slate-950 font-bold text-xs"
                >
                  Save to Directory
                </button>
              </form>
            )}

            {/* SEARCH / RECRUIT PLAYERS LIST */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredStoredPlayers.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-mono text-xs italic bg-[#0b1220] rounded-2xl border border-slate-800">
                  No registered players found. Click <strong className="text-white">+ New Player</strong> above to register.
                </div>
              ) : (
                filteredStoredPlayers.map(p => {
                  const isRecruited = recruitedPlayerIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        isRecruited
                          ? 'bg-[#0c2e1b] border-[#2dd4bf]/50'
                          : 'bg-[#0b1220] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[#fbbf24]">{p.id}</span>
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">• {p.rank_name || 'Wood III'}</span>
                      </div>

                      {isRecruited ? (
                        <button
                          type="button"
                          onClick={() => removePlayerFromSession(p.id)}
                          className="px-3 py-1 rounded-lg bg-rose-950/80 text-[#f97316] border border-rose-800 font-mono text-[11px] font-bold"
                        >
                          Remove ✕
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => recruitPlayerToSession(p.id)}
                          className="px-3 py-1 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-mono text-[11px] font-bold shadow-sm"
                        >
                          + Recruit to Session
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => advanceStep('checkin_ready')}
                disabled={checkins.length === 0}
                className="w-full py-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-40 text-slate-950 font-scoreboard text-base uppercase italic font-bold tracking-tight shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <span>Proceed to Check-In ({checkins.length} Players Recruited) →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TICK ACTIVE PLAYERS & LAUNCH MATCHMAKING */}
      {session.onboarding_step === 'checkin_ready' && (
        <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="font-scoreboard text-2xl font-bold tracking-tight text-white uppercase italic">
                CONFIRM PLAYERS FOR MATCHMAKING
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                First {(session.active_players_per_court || 4) * (session.court_count || 4)} fill courts 1–{session.court_count || 4}, remainder wait in queue.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-sans">
              <button
                type="button"
                onClick={checkInAll}
                className="px-3 py-1.5 rounded-lg bg-[#fbbf24] text-slate-950 font-bold"
              >
                Tick All
              </button>
              <button
                type="button"
                onClick={clearAllCheckins}
                className="px-3 py-1.5 rounded-lg bg-[#0b1220] text-slate-400 hover:text-white border border-slate-700"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {(checkins || []).map(chk => {
              const player = (players || []).find(p => p?.id === chk?.player_id);
              if (!player) return null;

              return (
                <div
                  key={player.id}
                  className="p-3.5 rounded-2xl border bg-[#0c2e1b] border-[#fbbf24] text-white shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-md bg-[#fbbf24] text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{player.name}</div>
                      <div className="text-[10px] font-mono text-slate-300">{player.id} • {player.gender}</div>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-slate-300">
                    {player.rank_name || 'Wood III'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-mono uppercase text-slate-400">Queue Ready</div>
              <div className="text-sm font-semibold text-white">
                <span className="font-scoreboard text-xl text-[#fbbf24] mr-1">{checkins.length}</span>
                Players ready ({Math.min(checkins.length, (session.active_players_per_court || 4) * (session.court_count || 4))} fill courts, {Math.max(0, checkins.length - ((session.active_players_per_court || 4) * (session.court_count || 4)))} in waiting queue)
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartTournament}
              disabled={checkins.length === 0}
              className="px-8 py-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-950 font-scoreboard text-lg uppercase italic font-bold tracking-tight shadow-xl flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Matchmaking & Open Courts</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
