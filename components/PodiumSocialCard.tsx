'use client';

import React, { useRef } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { getRankInfo } from '../lib/progression';
import { Crown, Sparkles, X, Share2, ShieldCheck, Trophy } from 'lucide-react';

interface PlayerSessionStats {
  id: string;
  name: string;
  gender?: string;
  tier: string;
  rankName: string;
  currentCP: number;
  sessionWins: number;
  sessionLosses: number;
  sessionMatches: number;
  sessionWinRate: number;
  sessionNetCP: number;
}

export function PodiumSocialCard({ onClose }: { onClose: () => void }) {
  const { session, matches = [], players = [], clearAllData, advanceStep, finalizeSessionPodium } = useOpenPlay();
  const cardRef = useRef<HTMLDivElement>(null);

  const sessionPlayerStatsMap = new Map<string, PlayerSessionStats>();

  (matches || []).forEach(m => {
    const isTeamAWon = m.status === 'teamA_win';
    
    (m.team_a_ids || []).forEach((id, idx) => {
      const p = players.find(x => x.id === id);
      const rank = getRankInfo(p?.rank_value || 1);
      const existing = sessionPlayerStatsMap.get(id) || {
        id,
        name: (m.team_a_names && m.team_a_names[idx]) || p?.name || 'Player',
        gender: p?.gender,
        tier: rank.tier,
        rankName: rank.displayName,
        currentCP: p?.current_cp || 0,
        sessionWins: 0,
        sessionLosses: 0,
        sessionMatches: 0,
        sessionWinRate: 0,
        sessionNetCP: 0
      };

      if (isTeamAWon) existing.sessionWins++;
      else existing.sessionLosses++;
      existing.sessionMatches++;

      const delta = m.player_cp_deltas ? (m.player_cp_deltas[id] || 0) : (isTeamAWon ? (m.team_a_cp_delta || 20) : (m.team_b_cp_delta || -20));
      existing.sessionNetCP += delta;

      sessionPlayerStatsMap.set(id, existing);
    });

    (m.team_b_ids || []).forEach((id, idx) => {
      const p = players.find(x => x.id === id);
      const rank = getRankInfo(p?.rank_value || 1);
      const existing = sessionPlayerStatsMap.get(id) || {
        id,
        name: (m.team_b_names && m.team_b_names[idx]) || p?.name || 'Player',
        gender: p?.gender,
        tier: rank.tier,
        rankName: rank.displayName,
        currentCP: p?.current_cp || 0,
        sessionWins: 0,
        sessionLosses: 0,
        sessionMatches: 0,
        sessionWinRate: 0,
        sessionNetCP: 0
      };

      if (!isTeamAWon) existing.sessionWins++;
      else existing.sessionLosses++;
      existing.sessionMatches++;

      const delta = m.player_cp_deltas ? (m.player_cp_deltas[id] || 0) : (!isTeamAWon ? (m.team_b_cp_delta || 20) : (m.team_a_cp_delta || -20));
      existing.sessionNetCP += delta;

      sessionPlayerStatsMap.set(id, existing);
    });
  });

  const rankedSessionPlayers = Array.from(sessionPlayerStatsMap.values()).map(p => ({
    ...p,
    sessionWinRate: p.sessionMatches > 0 ? Math.round((p.sessionWins / p.sessionMatches) * 100) : 0
  })).sort((a, b) => {
    if (b.sessionWinRate !== a.sessionWinRate) return b.sessionWinRate - a.sessionWinRate;
    if (b.sessionWins !== a.sessionWins) return b.sessionWins - a.sessionWins;
    if (b.sessionNetCP !== a.sessionNetCP) return b.sessionNetCP - a.sessionNetCP;
    return b.currentCP - a.currentCP;
  });

  const firstPlace = rankedSessionPlayers[0];
  const secondPlace = rankedSessionPlayers[1];
  const thirdPlace = rankedSessionPlayers[2];

  const handleFinishAndArchive = async () => {
    if (confirm("Conclude session? 1st Place will be awarded +1 Star bonus and an official Champion Trophy.")) {
      if (firstPlace) {
        await finalizeSessionPodium(firstPlace.id, secondPlace?.id, thirdPlace?.id);
      }
      clearAllData();
      onClose();
      advanceStep('session_gate');
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl space-y-4 my-auto py-6">
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#fbbf24] uppercase font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Official Daily Podium & Shareable Social Card</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#111c30] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={cardRef}
          className="w-full bg-gradient-to-b from-[#0b1220] via-[#111c30] to-[#070b14] border-2 border-[#fbbf24]/80 rounded-[32px] p-6 sm:p-8 shadow-[0_0_50px_rgba(251,191,36,0.25)] relative overflow-hidden space-y-6"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#fbbf24]/15 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full bg-[#fbbf24] flex items-center justify-center p-2 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
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
                <div className="font-scoreboard text-2xl font-bold tracking-tight text-white uppercase italic leading-none">
                  PIKOL LEGENDS
                </div>
                <div className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest mt-0.5">
                  Daily Championship Podium
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xs font-bold text-white uppercase">{session.name}</div>
              <div className="text-[10px] text-slate-400">{todayStr} • <span className="capitalize">{session.mode}</span></div>
            </div>
          </div>

          {rankedSessionPlayers.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs italic bg-[#0b1220]/80 rounded-2xl border border-slate-800">
              No matches completed in this session yet.
            </div>
          ) : (
            <div className="pt-6 pb-2 grid grid-cols-3 gap-2 sm:gap-4 items-end relative z-10">
              
              {/* 2ND PLACE */}
              <div className="flex flex-col items-center text-center space-y-2">
                {secondPlace ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center text-slate-200 font-scoreboard text-lg font-bold shadow-lg">
                      2
                    </div>
                    <div className="space-y-0.5 w-full">
                      <div className="text-xs sm:text-sm font-bold text-white truncate px-1">{secondPlace.name}</div>
                      <div className="font-scoreboard text-xl sm:text-2xl font-bold text-slate-200 leading-none">{secondPlace.sessionWinRate}%</div>
                      <div className="text-[10px] font-mono text-slate-400">{secondPlace.sessionWins}W - {secondPlace.sessionLosses}L</div>
                      <div className="text-[10px] font-mono font-bold text-[#2dd4bf]">
                        {secondPlace.sessionNetCP >= 0 ? `+${secondPlace.sessionNetCP}` : secondPlace.sessionNetCP} CP
                      </div>
                    </div>
                    <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-slate-900 to-slate-800/80 border-t-2 border-x-2 border-slate-400/60 flex items-center justify-center">
                      <span className="font-scoreboard text-3xl font-black text-slate-400 italic">2ND</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-24 rounded-t-2xl bg-slate-900/50 border border-slate-800" />
                )}
              </div>

              {/* 1ST PLACE */}
              <div className="flex flex-col items-center text-center space-y-2.5 -mt-6">
                {firstPlace && (
                  <>
                    <div className="relative">
                      <Crown className="w-6 h-6 text-[#fbbf24] absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-[#fbbf24] border-2 border-yellow-200 flex items-center justify-center text-slate-950 font-scoreboard text-2xl font-black shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                        1
                      </div>
                    </div>

                    <div className="space-y-0.5 w-full">
                      <div className="text-sm sm:text-base font-black text-white truncate px-1 drop-shadow">{firstPlace.name}</div>
                      <div className="font-scoreboard text-2xl sm:text-3xl font-black text-[#fbbf24] leading-none drop-shadow">{firstPlace.sessionWinRate}%</div>
                      <div className="text-[11px] font-mono text-slate-300 font-semibold">{firstPlace.sessionWins}W - {firstPlace.sessionLosses}L</div>
                      <div className="text-[11px] font-mono font-black text-[#2dd4bf]">
                        {firstPlace.sessionNetCP >= 0 ? `+${firstPlace.sessionNetCP}` : firstPlace.sessionNetCP} CP • +1 ⭐ Bonus
                      </div>
                    </div>

                    <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-[#0c2e1b] via-[#14532d] to-[#165b32] border-t-2 border-x-2 border-[#fbbf24] flex flex-col items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.3)]">
                      <span className="font-scoreboard text-4xl font-black text-[#fbbf24] italic drop-shadow">1ST</span>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#2dd4bf]">CHAMPION</span>
                    </div>
                  </>
                )}
              </div>

              {/* 3RD PLACE */}
              <div className="flex flex-col items-center text-center space-y-2">
                {thirdPlace ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-950 border-2 border-amber-600 flex items-center justify-center text-amber-300 font-scoreboard text-lg font-bold shadow-lg">
                      3
                    </div>
                    <div className="space-y-0.5 w-full">
                      <div className="text-xs sm:text-sm font-bold text-white truncate px-1">{thirdPlace.name}</div>
                      <div className="font-scoreboard text-xl sm:text-2xl font-bold text-amber-400 leading-none">{thirdPlace.sessionWinRate}%</div>
                      <div className="text-[10px] font-mono text-slate-400">{thirdPlace.sessionWins}W - {thirdPlace.sessionLosses}L</div>
                      <div className="text-[10px] font-mono font-bold text-[#2dd4bf]">
                        {thirdPlace.sessionNetCP >= 0 ? `+${thirdPlace.sessionNetCP}` : thirdPlace.sessionNetCP} CP
                      </div>
                    </div>
                    <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-t from-amber-950/80 to-amber-900/60 border-t-2 border-x-2 border-amber-700/60 flex items-center justify-center">
                      <span className="font-scoreboard text-3xl font-black text-amber-500 italic">3RD</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-20 rounded-t-2xl bg-slate-900/50 border border-slate-800" />
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80 relative z-10">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2dd4bf]" />
              <span>OFFICIAL COURT POINTS (CP) SYSTEM</span>
            </span>
            <span>PIKOL LEGENDS</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => alert('Screenshot this card on your phone or tablet to post directly to social media! 📸')}
            className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-sm uppercase italic font-bold tracking-tight shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Screenshot & Share Social Card</span>
          </button>

          <button
            onClick={handleFinishAndArchive}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900 text-[#f97316] border border-rose-800 font-scoreboard text-sm uppercase italic font-bold tracking-tight transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Archive Session (+1 ⭐ & Trophy to 1st)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
