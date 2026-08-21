'use client';

import React from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { QueueSection } from './QueueSection';
import { getRankInfo } from '../lib/progression';
import { Link } from 'lucide-react';

export function SidebarWidgets({ onOpenNewPlayer }: { onOpenNewPlayer: () => void }) {
  const {
    players,
    matches,
    setSelectedPlayerId
  } = useOpenPlay();

  // Sort Leaderboard by Court Points (CP) & Rank
  const sortedLeaderboard = [...players].sort((a, b) => {
    if ((b.rank_value || 1) !== (a.rank_value || 1)) {
      return (b.rank_value || 1) - (a.rank_value || 1);
    }
    return (b.current_cp || 0) - (a.current_cp || 0);
  });

  return (
    <div className="space-y-6">
      {/* 1. WAITING QUEUE SECTION */}
      <QueueSection onOpenNewPlayer={onOpenNewPlayer} />

      {/* 2. COURT POINTS LEADERBOARD (WOOD III -> MASTER) */}
      <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base">🪜</span>
            <h3 className="font-scoreboard text-lg font-bold tracking-tight uppercase italic text-white">
              COURT POINTS LEADERBOARD
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#fbbf24] font-bold">Wood → Master</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                <th className="pb-2 pl-1 w-8">RANK</th>
                <th className="pb-2">PLAYER</th>
                <th className="pb-2">TIER</th>
                <th className="pb-2 font-mono">CP</th>
                <th className="pb-2">STARS</th>
                <th className="pb-2 text-right pr-1">WIN RATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-mono text-xs italic">
                    No ranked players yet.
                  </td>
                </tr>
              ) : (
                sortedLeaderboard.slice(0, 6).map((player, idx) => {
                  const rank = getRankInfo(player.rank_value || 1);
                  const wins = (player.wins_doubles || 0) + (player.wins_singles || 0);
                  const losses = (player.losses_doubles || 0) + (player.losses_singles || 0);
                  const total = wins + losses;
                  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                  const isTop3 = idx < 3;

                  return (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition group"
                    >
                      <td className="py-2.5 pl-1 font-mono font-bold text-white relative">
                        <span>{idx + 1}</span>
                        {isTop3 && (
                          <div className="absolute bottom-1 left-1 w-3 h-0.5 bg-[#fbbf24] rounded-full" />
                        )}
                      </td>
                      <td className="py-2.5 font-medium text-slate-200 group-hover:text-[#fbbf24] transition">
                        <div className="flex items-center space-x-1">
                          <span>{player.name}</span>
                          {player.locked_partner_id && <Link className="w-2.5 h-2.5 text-[#2dd4bf]" />}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${rank.borderColor} ${rank.badgeBg} ${rank.textColor} font-bold`}>
                          {rank.displayName}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-200 font-bold group-hover:text-[#fbbf24]">
                        {player.current_cp || 0}
                      </td>
                      <td className="py-2.5 font-mono text-[#fbbf24]">
                        {player.stars || 0}⭐
                      </td>
                      <td className="py-2.5 text-right pr-1 font-mono text-slate-300">
                        {winRate}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. REAL-TIME MATCH LOG (SHOWS +/- CP AND STARS) */}
      <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base">📝</span>
            <h3 className="font-scoreboard text-lg font-bold tracking-tight uppercase italic text-white">
              MATCH LOG
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Session History</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                <th className="pb-2 pl-1">COURT</th>
                <th className="pb-2">MODE</th>
                <th className="pb-2">TIME</th>
                <th className="pb-2">TEAMS</th>
                <th className="pb-2 text-right pr-1 font-mono">WINNER / DELTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono text-xs italic">
                    No matches completed yet.
                  </td>
                </tr>
              ) : (
                matches.slice(0, 5).map(m => {
                  const teamAWon = m.status === 'teamA_win';
                  const winnerName = teamAWon ? m.team_a_names.join('/') : m.team_b_names.join('/');
                  const padCourt = String(m.court_number).padStart(2, '0');

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 pl-1 font-mono font-bold text-white">
                        {padCourt}
                      </td>
                      <td className="py-2.5 text-slate-400 capitalize">
                        {m.mode}
                      </td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                        {m.time_str}
                      </td>
                      <td className="py-2.5 text-slate-300 text-[11px]">
                        <div>{m.team_a_names.join('/')}</div>
                        <div className="text-slate-500">vs {m.team_b_names.join('/')}</div>
                      </td>
                      <td className="py-2.5 text-right pr-1 font-mono text-[#2dd4bf] font-bold text-[11px]">
                        <div>{winnerName}</div>
                        <div className="text-[10px] text-[#fbbf24] font-normal">+20 CP</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
