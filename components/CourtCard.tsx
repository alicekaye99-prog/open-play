'use client';

import React from 'react';
import { Court, Match } from '../types/pickleball';
import { useOpenPlay } from '../context/OpenPlayContext';
import { getRankInfo, PARTNER_GAP_THRESHOLD } from '../lib/progression';
import { Link, Ban } from 'lucide-react';

interface CourtCardProps {
  court: Court;
  onRecordResult: (match: Match) => void;
}

export function CourtCard({ court, onRecordResult }: CourtCardProps) {
  const { playersMap, session, setSelectedPlayerId, voidMatch } = useOpenPlay();
  const current = court.current_match;
  const nextUp = court.next_up_match;

  const padNum = String(court.court_number).padStart(2, '0');

  // Skill gap inspection using Rank Value (1-19)
  const hasTeamAGap = current && session.mode === 'doubles' && current.team_a_ids.length === 2 &&
    Math.abs((playersMap.get(current.team_a_ids[0])?.rank_value || 1) - (playersMap.get(current.team_a_ids[1])?.rank_value || 1)) >= PARTNER_GAP_THRESHOLD;

  const hasTeamBGap = current && session.mode === 'doubles' && current.team_b_ids.length === 2 &&
    Math.abs((playersMap.get(current.team_b_ids[0])?.rank_value || 1) - (playersMap.get(current.team_b_ids[1])?.rank_value || 1)) >= PARTNER_GAP_THRESHOLD;

  const isCourtLive = court.status === 'live' || Boolean(current);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top-Down Court Surface Box */}
      <div className={`w-full rounded-[22px] bg-[#0c2e1b] border-2 ${
        isCourtLive ? 'border-[#fbbf24] shadow-[0_0_25px_rgba(251,191,36,0.22)]' : 'border-[#1b4d2e]'
      } p-5 relative overflow-hidden transition-all duration-200`}>

        {/* Court Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="font-scoreboard text-4xl sm:text-5xl font-bold tracking-tight text-white italic drop-shadow-md">
            {padNum}
          </div>

          <div className="flex items-center space-x-2">
            {current && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  voidMatch(court.court_number);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-950/90 hover:bg-rose-900 text-[#f97316] border border-rose-800 font-mono text-[10px] font-bold flex items-center space-x-1 transition active:scale-[0.96] cursor-pointer"
                title="End match with 0 points added/subtracted"
              >
                <Ban className="w-3 h-3" />
                <span>End (Void)</span>
              </button>
            )}

            <div className="flex items-center space-x-1.5 font-mono text-xs tracking-wider uppercase font-semibold">
              {isCourtLive ? (
                <div className="flex items-center space-x-1.5 text-[#fbbf24]">
                  <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-ping" />
                  <span>● LIVE</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>● IDLE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Court Playing Surface */}
        {current ? (
          <div className="space-y-3">
            {/* Team A (Near Side) */}
            <div className="space-y-1">
              {current.team_a_ids.map((id, idx) => {
                const p = playersMap.get(id);
                const rank = getRankInfo(p?.rank_value || 1);
                const isLocked = p?.locked_partner_id;

                return (
                  <div
                    key={id}
                    onClick={() => setSelectedPlayerId(id)}
                    className="flex items-center justify-between text-white font-medium text-sm sm:text-base hover:text-[#fbbf24] cursor-pointer transition select-none group"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="group-hover:underline">{current.team_a_names[idx]}</span>
                      {isLocked && <Link className="w-3 h-3 text-[#2dd4bf]" />}
                    </div>

                    <div className="flex items-center space-x-2 font-mono">
                      <span className={`text-[11px] font-bold ${rank.textColor}`}>
                        {rank.displayName}
                      </span>
                      <span className="text-xs text-slate-300">
                        {p?.stars || 0}⭐
                      </span>
                    </div>
                  </div>
                );
              })}
              {hasTeamAGap && (
                <div className="text-[11px] font-medium text-[#fbbf24] border-b border-[#fbbf24]/50 pb-0.5 pt-0.5">
                  Large rank gap on this team
                </div>
              )}
            </div>

            {/* KITCHEN LINE */}
            <div className="relative py-1 flex items-center justify-center my-1">
              <div className="w-full border-t-2 border-white/80" />
              <div className="absolute px-2 bg-[#0c2e1b] text-[9px] font-mono text-white/50 uppercase tracking-widest">
                Kitchen
              </div>
            </div>

            {/* Team B (Far Side) */}
            <div className="space-y-1">
              {current.team_b_ids.map((id, idx) => {
                const p = playersMap.get(id);
                const rank = getRankInfo(p?.rank_value || 1);
                const isLocked = p?.locked_partner_id;

                return (
                  <div
                    key={id}
                    onClick={() => setSelectedPlayerId(id)}
                    className="flex items-center justify-between text-white font-medium text-sm sm:text-base hover:text-[#fbbf24] cursor-pointer transition select-none group"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="group-hover:underline">{current.team_b_names[idx]}</span>
                      {isLocked && <Link className="w-3 h-3 text-[#2dd4bf]" />}
                    </div>

                    <div className="flex items-center space-x-2 font-mono">
                      <span className={`text-[11px] font-bold ${rank.textColor}`}>
                        {rank.displayName}
                      </span>
                      <span className="text-xs text-slate-300">
                        {p?.stars || 0}⭐
                      </span>
                    </div>
                  </div>
                );
              })}
              {hasTeamBGap && (
                <div className="text-[11px] font-medium text-[#fbbf24] border-b border-[#fbbf24]/50 pb-0.5 pt-0.5">
                  Large rank gap on this team
                </div>
              )}
            </div>

            {/* Record Result Button */}
            <button
              type="button"
              onClick={() => onRecordResult(current)}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-bold text-sm tracking-tight transition shadow-lg active:scale-[0.98] cursor-pointer"
            >
              Record Result
            </button>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-mono text-xs italic">
            Court is open. Ready for match.
          </div>
        )}
      </div>

      {/* TICKET STUB */}
      {nextUp && (
        <div className="w-[90%] -mt-1 ticket-stub px-4 py-2 text-center shadow-md flex items-center justify-center space-x-2 text-[11px] font-mono tracking-tight text-slate-900 border-t border-slate-400">
          <span className="font-bold uppercase tracking-wider text-slate-950">NEXT UP:</span>
          <span className="truncate">
            {nextUp.team_a_names.join(' / ')} <span className="font-bold">vs</span> {nextUp.team_b_names.join(' / ')}
          </span>
        </div>
      )}
    </div>
  );
}
