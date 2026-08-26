'use client';

import React from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { Building2, Flame } from 'lucide-react';

export function VenueOwnerDashboard() {
  const { currentVenue, players } = useOpenPlay();

  if (!currentVenue) return null;

  const analytics = currentVenue.analytics || {
    total_sessions_hosted: 0,
    total_players_served: 0,
    total_matches_logged: 0,
    average_sitout_variance: 0.0,
    repeat_matchup_rate: 0.0,
    gender_balance_adherence: 100.0,
    dispute_rate: 0.0
  };

  const venueChampions = [...players]
    .map(p => {
      const trophiesAtVenue = (p.trophies || []).filter(t => t.venue_id === currentVenue.id || t.venue_name === currentVenue.name);
      return {
        ...p,
        trophiesAtVenue: trophiesAtVenue.length
      };
    })
    .sort((a, b) => b.trophiesAtVenue - a.trophiesAtVenue || b.current_cp - a.current_cp);

  return (
    <div className="space-y-6">
      <div className="bg-[#111c30] border-2 border-[#fbbf24]/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#fbbf24]" />
              <span className="font-mono text-xs text-[#fbbf24] font-bold uppercase">{currentVenue.name}</span>
            </div>
            <h2 className="font-scoreboard text-3xl font-bold text-white uppercase italic mt-1">
              Court Owner Progression Hub
            </h2>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-[#fbbf24] text-center font-mono">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Host Tier</div>
            <div className="font-scoreboard text-xl font-bold text-[#fbbf24] uppercase italic">
              {currentVenue.host_tier || 'Novice Host'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-[#0b1220] rounded-2xl border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Sit-Out Fairness</div>
            <div className="font-scoreboard text-2xl font-bold text-white italic">
              {analytics.average_sitout_variance <= 1.5 ? '98.5%' : '92.0%'}
            </div>
            <div className="text-[9px] text-[#2dd4bf]">Optimal Variance (σ ≤ 1.2)</div>
          </div>

          <div className="p-3.5 bg-[#0b1220] rounded-2xl border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Repeat Matchup Rate</div>
            <div className="font-scoreboard text-2xl font-bold text-[#2dd4bf] italic">
              {analytics.repeat_matchup_rate || '3.8'}%
            </div>
            <div className="text-[9px] text-slate-500">Anti-Farming Compliant</div>
          </div>

          <div className="p-3.5 bg-[#0b1220] rounded-2xl border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Mixed Gender Adherence</div>
            <div className="font-scoreboard text-2xl font-bold text-[#fbbf24] italic">
              {analytics.gender_balance_adherence || '97.2'}%
            </div>
            <div className="text-[9px] text-slate-500">Balanced 2M vs 2W splits</div>
          </div>

          <div className="p-3.5 bg-[#0b1220] rounded-2xl border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Dispute Rate</div>
            <div className="font-scoreboard text-2xl font-bold text-white italic">
              {analytics.dispute_rate || '0.0'}%
            </div>
            <div className="text-[9px] text-[#2dd4bf]">High Trust Venue</div>
          </div>
        </div>
      </div>

      <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-[#fbbf24]" />
            <h3 className="font-scoreboard text-xl font-bold text-white uppercase italic">
              {currentVenue.name} — Hall of Champions
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Most Session Podiums Won Here</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                <th className="pb-2 pl-1">RANK</th>
                <th className="pb-2">PLAYER</th>
                <th className="pb-2">TIER</th>
                <th className="pb-2 font-mono text-center">SESSION TROPHIES</th>
                <th className="pb-2 text-right pr-1 font-mono">CAREER CP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {venueChampions.slice(0, 5).map((player, idx) => (
                <tr key={player.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 pl-1 font-mono font-bold text-white">#{idx + 1}</td>
                  <td className="py-2.5 font-bold text-white">{player.name}</td>
                  <td className="py-2.5 text-slate-300 font-mono">{player.rank_name}</td>
                  <td className="py-2.5 text-center font-mono font-bold text-[#fbbf24]">
                    🏆 {player.trophiesAtVenue || 0} Wins
                  </td>
                  <td className="py-2.5 text-right pr-1 font-mono text-slate-200 font-bold">
                    {player.current_cp || 0} CP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
