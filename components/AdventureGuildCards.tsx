'use client';

import React, { useState } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { getRankInfo } from '../lib/progression';
import { Shield, Link, Plus, Search, UserPlus, Users, Trophy, ShieldCheck } from 'lucide-react';

export function AdventureGuildCards({ onOpenNewPlayer }: { onOpenNewPlayer: () => void }) {
  const {
    players = [],
    playersMap,
    checkins = [],
    courts = [],
    recruitPlayerToSession,
    removePlayerFromSession,
    checkInAll,
    setSelectedPlayerId
  } = useOpenPlay();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'in_queue' | 'not_in_queue'>('all');

  const activeIds = new Set<string>();
  (courts || []).forEach(c => {
    c.current_match?.team_a_ids.forEach(id => activeIds.add(id));
    c.current_match?.team_b_ids.forEach(id => activeIds.add(id));
  });

  const nextUpIds = new Set<string>();
  (courts || []).forEach(c => {
    c.next_up_match?.team_a_ids.forEach(id => nextUpIds.add(id));
    c.next_up_match?.team_b_ids.forEach(id => nextUpIds.add(id));
  });

  const inSessionIds = new Set((checkins || []).map(c => c.player_id));

  const filteredPlayers = (players || []).filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const isInSession = inSessionIds.has(p.id);
    if (filterTab === 'in_queue') return isInSession;
    if (filterTab === 'not_in_queue') return !isInSession;
    return true;
  });

  const unqueuedCount = (players || []).filter(p => !inSessionIds.has(p.id)).length;

  return (
    <div className="space-y-6">
      {/* HEADER TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111c30] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="font-scoreboard text-xl sm:text-2xl font-bold tracking-tight text-white uppercase italic flex items-center space-x-2">
            <Shield className="w-6 h-6 text-[#fbbf24]" />
            <span>PLAYER DIRECTORY & GUILD CARDS ({players.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Recruit registered players into today's queue or click a card to view full career stats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full bg-[#0b1220] border border-slate-700 focus:border-[#fbbf24] rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {unqueuedCount > 0 && (
            <button
              type="button"
              onClick={checkInAll}
              className="px-3.5 py-2 rounded-xl bg-[#0c2e1b] hover:bg-[#165b32] text-[#2dd4bf] border border-[#2dd4bf]/40 font-mono text-xs font-bold transition flex items-center space-x-1.5 shadow cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Recruit All to Queue ({unqueuedCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewPlayer}
            className="px-4 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-sm uppercase italic font-bold tracking-tight shadow-md flex items-center space-x-1 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Player</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-1 text-xs font-mono">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterTab === 'all' ? 'bg-[#fbbf24] text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Players ({players.length})
        </button>
        <button
          onClick={() => setFilterTab('in_queue')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterTab === 'in_queue' ? 'bg-[#fbbf24] text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          In Live Queue ({checkins.length})
        </button>
        <button
          onClick={() => setFilterTab('not_in_queue')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterTab === 'not_in_queue' ? 'bg-[#fbbf24] text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Available to Recruit ({unqueuedCount})
        </button>
      </div>

      {/* GUILD CARDS GRID */}
      {filteredPlayers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 font-mono text-sm italic bg-[#111c30] border border-slate-800 rounded-3xl">
          No players found matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlayers.map(player => {
            const isProvisional = player.placement_status === 'provisional';
            const placementMatches = player.placement_matches_played || 0;

            const rank = getRankInfo(player.rank_value || 1);
            const wins = (player.wins_doubles || 0) + (player.wins_singles || 0);
            const losses = (player.losses_doubles || 0) + (player.losses_singles || 0);
            const total = wins + losses;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

            const isInSession = inSessionIds.has(player.id);
            const isPlaying = activeIds.has(player.id);
            const isOnDeck = nextUpIds.has(player.id);
            const trophyCount = (player.trophies || []).length;

            const lockedPartner = player.locked_partner_id ? playersMap.get(player.locked_partner_id) : null;

            const cardBorder = isProvisional ? 'border-teal-700/80' : rank.borderColor;
            const cardBg = isProvisional ? 'bg-[#0b1b24]' : rank.badgeBg;

            return (
              <div
                key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                className={`rounded-3xl border-2 ${cardBorder} ${cardBg} p-5 relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.02] flex flex-col justify-between space-y-4 shadow-lg`}
              >
                {/* TOP IDENTITY & RANK */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-950 bg-[#fbbf24] px-2 py-0.5 rounded shadow">
                        {player.id}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {player.gender} {player.age ? `• ${player.age} yrs` : ''}
                      </span>
                    </div>

                    <h3 className="font-scoreboard text-2xl font-bold tracking-tight text-white uppercase italic mt-1 leading-none drop-shadow">
                      {player.name}
                    </h3>
                  </div>

                  {/* RANK EMBLEM & STARS */}
                  <div className="text-right font-mono">
                    <div className={`font-scoreboard text-xl sm:text-2xl font-black italic leading-none ${
                      isProvisional ? 'text-[#2dd4bf]' : rank.textColor
                    }`}>
                      {isProvisional ? 'Provisional' : rank.displayName}
                    </div>
                    <div className="text-xs text-[#fbbf24] font-bold mt-1">
                      {isProvisional ? (
                        <span className="text-[#2dd4bf] font-mono">{placementMatches}/5 Placed</span>
                      ) : (
                        <span>{player.stars || 0} / 5 ⭐</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* FIXED DOUBLES PARTNER BANNER */}
                {lockedPartner ? (
                  <div className="p-2.5 rounded-xl bg-[#0b1220]/80 border border-[#2dd4bf]/40 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-[#2dd4bf] font-medium">
                      <Link className="w-3.5 h-3.5" />
                      <span>Fixed Pair:</span>
                      <span className="font-bold text-white">{lockedPartner.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">({lockedPartner.id})</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-slate-400 italic px-1 flex items-center justify-between">
                    <span>Solo Player</span>
                    {trophyCount > 0 && (
                      <span className="text-[#fbbf24] font-bold not-italic flex items-center space-x-1">
                        <Trophy className="w-3 h-3 fill-[#fbbf24]" />
                        <span>{trophyCount} Trophy</span>
                      </span>
                    )}
                  </div>
                )}

                {/* STATS BAR: CP, W/L, WIN RATE */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#0b1220]/90 border border-slate-800 text-center font-mono">
                  <div>
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Court Points</div>
                    <div className="text-sm font-bold text-white">
                      {isProvisional ? <span className="text-[#2dd4bf] text-xs">Calibrating</span> : `${player.current_cp || 0} CP`}
                    </div>
                  </div>
                  <div className="border-x border-slate-800">
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Record</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      <span className="text-[#2dd4bf]">{wins}W</span>-<span className="text-[#f97316]">{losses}L</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Win Rate</div>
                    <div className="text-xs font-bold text-[#fbbf24] mt-0.5">{winRate}%</div>
                  </div>
                </div>

                {/* QUEUE STATUS FOOTER */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                    {isPlaying ? (
                      <span className="text-[#2dd4bf] font-bold">● Active on Court</span>
                    ) : isOnDeck ? (
                      <span className="text-[#fbbf24] font-bold">● Next Up on Deck</span>
                    ) : isInSession ? (
                      <span className="text-emerald-400 font-medium">● In Live Queue</span>
                    ) : (
                      <span className="text-slate-500">Not in Queue</span>
                    )}
                  </div>

                  {isInSession ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlayerFromSession(player.id);
                      }}
                      className="px-3 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-[#f97316] border border-rose-800 font-mono text-[10px] font-bold transition cursor-pointer"
                    >
                      Remove ✕
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        recruitPlayerToSession(player.id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-mono text-[11px] font-bold transition shadow flex items-center space-x-1 cursor-pointer active:scale-[0.97]"
                    >
                      <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Add to Queue</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
