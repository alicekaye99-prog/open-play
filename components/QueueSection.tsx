'use client';

import React, { useState } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { getRankInfo } from '../lib/progression';
import { Link, Unlink, Plus, Check } from 'lucide-react';

export function QueueSection({ onOpenNewPlayer }: { onOpenNewPlayer: () => void }) {
  const {
    checkins = [],
    playersMap,
    courts = [],
    groupQueuePair,
    dissolveQueuePair,
    setSelectedPlayerId
  } = useOpenPlay();

  const [selectedForPairing, setSelectedForPairing] = useState<string[]>([]);

  const busyIds = new Set<string>();
  (courts || []).forEach(c => {
    c.current_match?.team_a_ids.forEach(id => busyIds.add(id));
    c.current_match?.team_b_ids.forEach(id => busyIds.add(id));
    c.next_up_match?.team_a_ids.forEach(id => busyIds.add(id));
    c.next_up_match?.team_b_ids.forEach(id => busyIds.add(id));
  });

  const waitingCheckins = (checkins || []).filter(c => !busyIds.has(c.player_id));

  const handleToggleSelect = (playerId: string) => {
    if (selectedForPairing.includes(playerId)) {
      setSelectedForPairing(prev => prev.filter(id => id !== playerId));
    } else {
      if (selectedForPairing.length < 2) {
        setSelectedForPairing(prev => [...prev, playerId]);
      } else {
        setSelectedForPairing([selectedForPairing[0], playerId]);
      }
    }
  };

  const handleGroupSelected = () => {
    if (selectedForPairing.length === 2) {
      groupQueuePair(selectedForPairing[0], selectedForPairing[1]);
      setSelectedForPairing([]);
    }
  };

  const p1 = selectedForPairing[0] ? playersMap.get(selectedForPairing[0]) : null;
  const p2 = selectedForPairing[1] ? playersMap.get(selectedForPairing[1]) : null;

  return (
    <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="text-base">⏳</span>
          <h3 className="font-scoreboard text-lg font-bold tracking-tight uppercase italic text-white">
            WAITING QUEUE ({waitingCheckins.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenNewPlayer}
          className="px-3 py-1.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs flex items-center space-x-1 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Player</span>
        </button>
      </div>

      {selectedForPairing.length > 0 && (
        <div className="p-3 bg-[#0c2e1b] border-2 border-[#2dd4bf] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(45,212,191,0.2)]">
          <div className="text-xs font-mono text-slate-200">
            <span className="text-[#2dd4bf] font-bold">Pairing Selection: </span>
            <span>{p1?.name || 'Player 1'}</span>
            {p2 ? <span className="text-white font-bold"> & {p2.name}</span> : <span className="text-slate-400"> (Select 1 more)</span>}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedForPairing([])}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGroupSelected}
              disabled={selectedForPairing.length !== 2}
              className="px-4 py-1.5 rounded-xl bg-[#2dd4bf] hover:bg-[#14b8a6] disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Group as Pair 🔗</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {waitingCheckins.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs italic bg-[#0b1220] rounded-2xl border border-slate-800">
            No players currently in waiting queue.
          </div>
        ) : (
          waitingCheckins.map(chk => {
            const player = playersMap.get(chk.player_id);
            if (!player) return null;

            const isSelected = selectedForPairing.includes(player.id);
            const isProvisional = player.placement_status === 'provisional';
            const partner = player.locked_partner_id ? playersMap.get(player.locked_partner_id) : null;
            const rank = getRankInfo(player.rank_value || 1);

            return (
              <div
                key={player.id}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition ${
                  isSelected
                    ? 'bg-[#0c2e1b] border-[#2dd4bf] shadow-md'
                    : partner
                    ? 'bg-[#0b1220] border-[#2dd4bf]/40'
                    : 'bg-[#0b1220] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    onClick={() => handleToggleSelect(player.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#2dd4bf] text-slate-950'
                        : 'border border-slate-600 hover:border-[#2dd4bf]'
                    }`}
                    title="Select to Group as Pair"
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div
                    onClick={() => setSelectedPlayerId(player.id)}
                    className="cursor-pointer hover:text-[#fbbf24] transition group"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white group-hover:underline">{player.name}</span>
                      <span className="text-[10px] font-mono text-[#fbbf24]">({player.id})</span>
                    </div>

                    {partner ? (
                      <div className="text-[10px] font-mono text-[#2dd4bf] flex items-center space-x-1">
                        <Link className="w-2.5 h-2.5" />
                        <span>Paired with {partner.name}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-slate-400">
                        {chk.games_played_today || 0} games played today • Solo
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  {partner ? (
                    <button
                      type="button"
                      onClick={() => dissolveQueuePair(player.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-[#f97316] border border-rose-800 font-mono text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                      title="Dissolve this pair back to solo players"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Dissolve ✕</span>
                    </button>
                  ) : (
                    <div className="text-right font-mono">
                      {isProvisional ? (
                        <>
                          <div className="text-[11px] font-bold text-[#2dd4bf]">Provisional</div>
                          <div className="text-[9px] text-slate-400">{player.placement_matches_played || 0}/5 Placed</div>
                        </>
                      ) : (
                        <>
                          <div className="text-[11px] font-bold text-slate-200">{player.current_cp || 0} CP</div>
                          <div className={`text-[9px] ${rank.textColor}`}>{rank.displayName}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
