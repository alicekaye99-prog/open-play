'use client';

import React, { useState, useEffect } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { GameMode, Match } from '../types/pickleball';
import { X, Swords, QrCode, Play, CheckCircle, Copy, ShieldAlert, Timer } from 'lucide-react';

export function PvPGrindModal({ onClose }: { onClose: () => void }) {
  const { players = [], createPvPMatch, joinPvPMatch, submitPvPScore, matches = [] } = useOpenPlay();
  const [step, setStep] = useState<'create' | 'join' | 'live_match'>('create');
  
  const [selectedCreatorId, setSelectedCreatorId] = useState(players[0]?.id || '');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [pvpMode, setPvpMode] = useState<GameMode>('singles');
  const [activePvPMatch, setActivePvPMatch] = useState<Match | null>(null);

  const [joinCode, setJoinCode] = useState('');
  const [joinPlayerId, setJoinPlayerId] = useState(players[1]?.id || '');
  const [joinPartnerId, setJoinPartnerId] = useState('');

  const [myTeamScore, setMyTeamScore] = useState<number>(11);
  const [oppTeamScore, setOppTeamScore] = useState<number>(9);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activePvPMatch && activePvPMatch.status === 'in-progress') {
      interval = setInterval(() => {
        if (activePvPMatch.started_at) {
          const sec = Math.floor((Date.now() - new Date(activePvPMatch.started_at).getTime()) / 1000);
          setElapsedSeconds(sec);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activePvPMatch]);

  const handleCreateInvite = async () => {
    if (!selectedCreatorId) return;
    const match = await createPvPMatch(selectedCreatorId, selectedPartnerId || null, pvpMode);
    setActivePvPMatch(match);
  };

  const handleJoinInvite = async () => {
    if (!joinCode || !joinPlayerId) return;
    const match = await joinPvPMatch(joinCode.trim(), joinPlayerId, joinPartnerId || null);
    if (match) {
      setActivePvPMatch(match);
      setStep('live_match');
    } else {
      alert('Invalid challenge code or match already started.');
    }
  };

  const handleSubmitScore = async (submittingPlayerId: string) => {
    if (!activePvPMatch) return;
    const isTeamA = activePvPMatch.team_a_ids.includes(submittingPlayerId);
    const scoreA = isTeamA ? myTeamScore : oppTeamScore;
    const scoreB = isTeamA ? oppTeamScore : myTeamScore;

    await submitPvPScore(activePvPMatch.id, submittingPlayerId, scoreA, scoreB);
    setHasSubmittedScore(true);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentMatchState = activePvPMatch ? (matches.find(m => m.id === activePvPMatch.id) || activePvPMatch) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111c30] border border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-[#fbbf24] text-slate-950">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-scoreboard text-xl font-bold tracking-tight text-white uppercase italic">
                Standalone PvP Grind
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Ranked Match • No Venue Required</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-[#0b1220] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!activePvPMatch && (
          <div className="flex bg-[#0b1220] p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <button
              onClick={() => setStep('create')}
              className={`flex-1 py-2 rounded-lg transition ${
                step === 'create' ? 'bg-[#fbbf24] text-slate-950' : 'text-slate-400'
              }`}
            >
              1. Create Challenge Code
            </button>
            <button
              onClick={() => setStep('join')}
              className={`flex-1 py-2 rounded-lg transition ${
                step === 'join' ? 'bg-[#fbbf24] text-slate-950' : 'text-slate-400'
              }`}
            >
              2. Accept Code / Scan
            </button>
          </div>
        )}

        {step === 'create' && !activePvPMatch && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Select Your Profile *</label>
                <select
                  value={selectedCreatorId}
                  onChange={e => setSelectedCreatorId(e.target.value)}
                  className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id}) • {p.rank_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Mode</label>
                  <select
                    value={pvpMode}
                    onChange={e => setPvpMode(e.target.value as GameMode)}
                    className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="singles">Singles (1v1)</option>
                    <option value="doubles">Doubles (2v2)</option>
                  </select>
                </div>

                {pvpMode === 'doubles' && (
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Partner (Optional)</label>
                    <select
                      value={selectedPartnerId}
                      onChange={e => setSelectedPartnerId(e.target.value)}
                      className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">No Partner</option>
                      {players.filter(p => p.id !== selectedCreatorId).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateInvite}
              className="w-full py-3.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-sm uppercase italic font-bold tracking-tight shadow-md flex items-center justify-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Generate Challenge Invite</span>
            </button>
          </div>
        )}

        {activePvPMatch && activePvPMatch.status === 'pending' && (
          <div className="p-5 bg-[#0c2e1b] border-2 border-[#fbbf24] rounded-2xl text-center space-y-4">
            <div className="text-xs font-mono uppercase text-[#2dd4bf] font-bold">
              Challenge Ready — Waiting for Opponent
            </div>

            <div className="p-4 bg-[#0b1220] rounded-2xl border border-slate-700 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Match ID / Invite Code</div>
              <div className="font-mono text-lg font-bold text-white tracking-widest flex items-center justify-center space-x-2">
                <span>{activePvPMatch.id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activePvPMatch.id);
                    alert('Challenge code copied!');
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Share this code with your opponent. When they accept, the match timer begins.
            </p>
          </div>
        )}

        {step === 'join' && !activePvPMatch && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Paste Challenge Code *</label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="e.g. pvp-172441029384..."
                className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Your Profile *</label>
              <select
                value={joinPlayerId}
                onChange={e => setJoinPlayerId(e.target.value)}
                className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleJoinInvite}
              className="w-full py-3.5 rounded-2xl bg-[#2dd4bf] hover:bg-[#14b8a6] text-slate-950 font-scoreboard text-sm uppercase italic font-bold tracking-tight shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Accept Challenge & Start Timer</span>
            </button>
          </div>
        )}

        {currentMatchState && currentMatchState.status === 'in-progress' && (
          <div className="space-y-5">
            <div className="p-4 bg-[#0b1220] border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-[#fbbf24] animate-pulse" />
                <span className="font-mono text-xl font-bold text-white">{formatTimer(elapsedSeconds)}</span>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                elapsedSeconds >= (currentMatchState.mode === 'singles' ? 180 : 240)
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}>
                {elapsedSeconds >= (currentMatchState.mode === 'singles' ? 180 : 240) ? 'CP Validated' : 'Min Duration Floor Active'}
              </span>
            </div>

            <div className="p-3 bg-[#0c2e1b] rounded-2xl border border-slate-700 text-xs font-mono text-center space-y-1">
              <div className="font-bold text-white">{currentMatchState.team_a_names.join(' & ')}</div>
              <div className="text-slate-400">VS</div>
              <div className="font-bold text-white">{currentMatchState.team_b_names.join(' & ')}</div>
            </div>

            {!hasSubmittedScore ? (
              <div className="space-y-3 p-4 bg-[#0b1220] rounded-2xl border border-slate-800">
                <div className="text-xs font-mono uppercase text-[#fbbf24] font-bold">
                  Submit Final Score (Both Players Must Submit)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">Your Team Score</label>
                    <input
                      type="number"
                      value={myTeamScore}
                      onChange={e => setMyTeamScore(Number(e.target.value))}
                      className="w-full bg-[#111c30] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">Opponent Score</label>
                    <input
                      type="number"
                      value={oppTeamScore}
                      onChange={e => setOppTeamScore(Number(e.target.value))}
                      className="w-full bg-[#111c30] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold text-center"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSubmitScore(currentMatchState.team_a_ids[0])}
                    className="flex-1 py-2.5 bg-[#fbbf24] text-slate-950 font-bold text-xs rounded-xl"
                  >
                    Submit as Team A ({currentMatchState.team_a_names[0]})
                  </button>
                  <button
                    onClick={() => handleSubmitScore(currentMatchState.team_b_ids[0])}
                    className="flex-1 py-2.5 bg-[#2dd4bf] text-slate-950 font-bold text-xs rounded-xl"
                  >
                    Submit as Team B ({currentMatchState.team_b_names[0]})
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center bg-[#0c2e1b] rounded-2xl border border-[#2dd4bf] space-y-2">
                <CheckCircle className="w-6 h-6 text-[#2dd4bf] mx-auto" />
                <div className="text-sm font-bold text-white">Score Submitted!</div>
                <p className="text-xs text-slate-300">
                  Waiting for opponent submission. CP updates automatically once both match.
                </p>
              </div>
            )}
          </div>
        )}

        {currentMatchState && currentMatchState.status === 'disputed' && (
          <div className="p-5 bg-rose-950/80 border-2 border-rose-600 rounded-2xl text-center space-y-2 text-xs">
            <ShieldAlert className="w-8 h-8 text-[#f97316] mx-auto animate-bounce" />
            <div className="font-bold text-white uppercase text-sm">Match Conflict / Disputed</div>
            <p className="text-slate-300">
              Submitted scores did not match. No CP was awarded and trust audit flags were logged.
            </p>
          </div>
        )}

        {currentMatchState && (currentMatchState.status === 'confirmed' || currentMatchState.status === 'teamA_win' || currentMatchState.status === 'teamB_win') && (
          <div className="p-5 bg-[#0c2e1b] border-2 border-[#2dd4bf] rounded-2xl text-center space-y-2 text-xs">
            <CheckCircle className="w-8 h-8 text-[#2dd4bf] mx-auto" />
            <div className="font-bold text-white uppercase text-sm">Match Confirmed & CP Applied!</div>
            <p className="text-slate-300">
              Rank progression, stars, and leaderboards have been updated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
