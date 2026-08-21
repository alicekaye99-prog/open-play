'use client';

import React, { useState } from 'react';
import { Player } from '../types/pickleball';
import { useOpenPlay } from '../context/OpenPlayContext';
import { getRankInfo } from '../lib/progression';
import { X, History, Activity, Award } from 'lucide-react';

export function PlayerProfileModal({
  player,
  onClose
}: {
  player: Player;
  onClose: () => void;
}) {
  const { matches } = useOpenPlay();
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const rankInfo = getRankInfo(player.rank_value || 1);
  const highestRankInfo = getRankInfo(player.highest_rank_value || player.rank_value || 1);

  // Real-Time Career Stats
  const totalDoubles = (player.wins_doubles || 0) + (player.losses_doubles || 0);
  const totalSingles = (player.wins_singles || 0) + (player.losses_singles || 0);
  const totalMatches = totalDoubles + totalSingles;
  const totalWins = (player.wins_doubles || 0) + (player.wins_singles || 0);
  const totalLosses = (player.losses_doubles || 0) + (player.losses_singles || 0);
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const doublesWinRate = totalDoubles > 0 ? Math.round(((player.wins_doubles || 0) / totalDoubles) * 100) : 0;
  const singlesWinRate = totalSingles > 0 ? Math.round(((player.wins_singles || 0) / totalSingles) * 100) : 0;

  // Filter player's previous 10 matches only
  const playerMatches = matches
    .filter(m => (m.team_a_ids || []).includes(player.id) || (m.team_b_ids || []).includes(player.id))
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111c30] border border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER: CLEAN IDENTITY */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#fbbf24] bg-[#0b1220] px-2.5 py-0.5 rounded border border-[#fbbf24]/40">
                {player.id}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {player.gender} {player.age ? `• ${player.age} yrs` : ''}
              </span>
            </div>
            <h2 className="font-scoreboard text-3xl font-bold tracking-tight text-white uppercase italic mt-1 leading-none">
              {player.name}
            </h2>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-[#0b1220] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL TABS */}
        <div className="flex bg-[#0b1220] p-1 rounded-xl border border-slate-800 text-xs font-bold font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'overview' ? 'bg-[#fbbf24] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview & Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'history' ? 'bg-[#fbbf24] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Match History (Last 10)</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: OVERVIEW (HERO GREEN BOX WITH BIG BADGE + STATS GRID)
            ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            
            {/* HERO GREEN CARD: BIG UN-CROPPED BADGE + CURRENT RANK + CAREER CP + STARS */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0c2e1b] border-2 border-[#1b4d2e] shadow-lg space-y-4">
              
              {/* TOP ROW: LARGE EMBLEM + RANK TITLE + CAREER CP */}
              <div className="flex items-center justify-between gap-3">
                
                {/* Left: Big Uncropped Badge + Rank Name */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center p-1 bg-[#071910]/80 rounded-2xl border border-emerald-500/30 shadow-md">
                    <img
                      src={`/assets/${rankInfo.tier}.png`}
                      alt={rankInfo.displayName}
                      className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#2dd4bf]/90 font-bold">
                      Current Rank
                    </div>
                    <div className="font-scoreboard text-2xl sm:text-3xl font-black text-white uppercase italic truncate leading-none">
                      {rankInfo.displayName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 pt-0.5">
                      Tier Level <span className="text-[#fbbf24] font-bold">{rankInfo.rankValue}</span> of 19
                    </div>
                  </div>
                </div>

                {/* Right: Career CP */}
                <div className="text-right font-mono flex-shrink-0 pl-2">
                  <div className="text-[9px] sm:text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    Career CP
                  </div>
                  <div className="font-scoreboard text-2xl sm:text-3xl font-black text-[#fbbf24] leading-none mt-0.5">
                    {player.current_cp || 0}
                    <span className="text-xs font-normal text-slate-300 ml-1">CP</span>
                  </div>
                </div>
              </div>

              {/* 5-STAR SUB-TIER PROGRESSION METER */}
              {player.rank_value < 19 && (
                <div className="space-y-1.5 pt-3 border-t border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">Sub-Tier Promotion Stars:</span>
                    <span className="text-[#fbbf24] font-bold">{player.stars || 0} / 5 Stars</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(starNum => {
                      const isEarned = starNum <= (player.stars || 0);
                      return (
                        <div
                          key={starNum}
                          className={`flex-1 h-3 rounded-md flex items-center justify-center transition-all ${
                            isEarned
                              ? 'bg-gradient-to-r from-amber-500 to-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                              : 'bg-slate-900 border border-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {player.active_promotion_series && (
                    <div className="mt-2 p-2.5 rounded-xl bg-yellow-500/20 border border-yellow-400 text-xs font-mono text-yellow-200 flex items-center justify-between">
                      <span className="font-bold uppercase">⚡ Bo3 Promotion Series:</span>
                      <span className="font-bold text-white">
                        {player.active_promotion_series.wins}W - {player.active_promotion_series.losses}L (Need 2 Wins)
                      </span>
                    </div>
                  )}

                  {(player.demotion_grace_matches || 0) > 0 && (
                    <div className="text-[10px] font-mono text-[#2dd4bf]">
                      🛡️ Demotion Grace Immunity: {player.demotion_grace_matches} matches remaining
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CAREER STATS 4-GRID (WITH "HIGHEST RANK" REPLACING REDUNDANT CURRENT RANK) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#0b1220] border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Played</div>
                <div className="font-scoreboard text-2xl font-bold text-white italic">{totalMatches}</div>
                <div className="text-[10px] text-slate-500 font-mono">Matches</div>
              </div>

              <div className="p-3.5 bg-[#0b1220] border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">W / L Record</div>
                <div className="font-scoreboard text-2xl font-bold text-white italic">
                  <span className="text-[#2dd4bf]">{totalWins}W</span> - <span className="text-[#f97316]">{totalLosses}L</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Overall</div>
              </div>

              <div className="p-3.5 bg-[#0b1220] border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Win Rate</div>
                <div className="font-scoreboard text-2xl font-bold text-[#fbbf24] italic">{overallWinRate}%</div>
                <div className="text-[10px] text-slate-500 font-mono">Career</div>
              </div>

              {/* HIGHEST / PEAK CAREER RANK BOX */}
              <div className="p-3.5 bg-[#0b1220] border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Highest Rank</div>
                <div className="flex items-center space-x-1.5 pt-0.5">
                  <img
                    src={`/assets/${highestRankInfo.tier}.png`}
                    alt={highestRankInfo.displayName}
                    className="w-6 h-6 object-contain drop-shadow flex-shrink-0"
                  />
                  <div className="font-scoreboard text-base font-bold text-white italic truncate leading-tight">
                    {highestRankInfo.displayName}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Peak Career</div>
              </div>
            </div>

            {/* FORMAT BREAKDOWN */}
            <div className="p-4 bg-[#0b1220] border border-slate-800 rounded-2xl space-y-2">
              <div className="text-xs font-mono uppercase text-[#2dd4bf] font-bold">
                Format Breakdown
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="text-white font-bold">Doubles Play</div>
                  <div className="text-slate-300">{player.wins_doubles || 0}W - {player.losses_doubles || 0}L ({doublesWinRate}%)</div>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <div className="text-white font-bold">Singles Play</div>
                  <div className="text-slate-300">{player.wins_singles || 0}W - {player.losses_singles || 0}L ({singlesWinRate}%)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MATCH HISTORY (PREVIOUS 10 MATCHES WITH +/- CP & +/- STARS)
            ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Showing Previous {playerMatches.length} of 10 Matches</span>
              <span>Court Points (CP) & Stars Delta</span>
            </div>

            {playerMatches.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs italic bg-[#0b1220] rounded-2xl border border-slate-800">
                No matches recorded for this player yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {playerMatches.map(m => {
                  const inTeamA = (m.team_a_ids || []).includes(player.id);
                  const isWinner = (m.status === 'teamA_win' && inTeamA) || (m.status === 'teamB_win' && !inTeamA);
                  
                  const cpDelta = m.player_cp_deltas ? (m.player_cp_deltas[player.id] || 0) : (isWinner ? 20 : -20);
                  const starDelta = m.player_star_deltas ? (m.player_star_deltas[player.id] || 0) : (isWinner ? 1 : -1);

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 bg-[#0b1220] border border-slate-800 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-white">Court {m.court_number}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 font-mono">{m.time_str}</span>
                          <span className="text-slate-500">•</span>
                          <span className="uppercase text-[10px] text-slate-400">{m.mode}</span>
                        </div>

                        <div className="text-slate-300 text-[11px] font-sans">
                          {m.team_a_names.join(' & ')} <span className="text-slate-500 font-mono">vs</span> {m.team_b_names.join(' & ')}
                        </div>
                      </div>

                      <div className="text-right font-mono space-y-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWinner ? 'bg-[#14532d] text-[#2dd4bf]' : 'bg-rose-950/80 text-[#f97316]'
                        }`}>
                          {isWinner ? 'WIN' : 'LOSS'}
                        </span>

                        <div className="text-xs font-bold text-white pt-1">
                          <span className={cpDelta >= 0 ? 'text-[#2dd4bf]' : 'text-[#f97316]'}>
                            {cpDelta >= 0 ? `+${cpDelta}` : cpDelta} CP
                          </span>
                          <span className="text-slate-500 mx-1">|</span>
                          <span className={starDelta >= 0 ? 'text-[#fbbf24]' : 'text-slate-400'}>
                            {starDelta >= 0 ? `+${starDelta} ⭐` : `${starDelta} ⭐`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
