'use client';

import React, { useState } from 'react';
import { Match, Gender } from '../types/pickleball';
import { useOpenPlay } from '../context/OpenPlayContext';
import { X, Trophy, Plus, Minus } from 'lucide-react';

/* 1. INSTANT 1-TAP RECORD MATCH RESULT MODAL */
export function RecordResultModal({
  match,
  onClose
}: {
  match: Match;
  onClose: () => void;
}) {
  const { recordMatchResult } = useOpenPlay();

  const handleSelectWinner = (winner: 'teamA' | 'teamB') => {
    try {
      recordMatchResult(match.id, winner);
    } catch (err) {
      console.error('Error recording match result:', err);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111c30] border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-scoreboard text-xl font-bold tracking-tight text-white uppercase italic flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-[#fbbf24]" />
            <span>Record Court {match.court_number} Result</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Tap the winning team. Rating points will update and open courts will be prioritized automatically:
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSelectWinner('teamA')}
            className="w-full p-4 rounded-2xl bg-[#0c2e1b] hover:bg-[#165b32] border-2 border-[#1b4d2e] hover:border-[#fbbf24] text-left transition group active:scale-[0.99] cursor-pointer"
          >
            <div className="text-[10px] uppercase font-mono font-bold text-[#fbbf24] mb-1">Team A Winner</div>
            <div className="text-base font-bold text-white group-hover:text-[#2dd4bf]">
              {match.team_a_names.join(' & ')}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectWinner('teamB')}
            className="w-full p-4 rounded-2xl bg-[#0c2e1b] hover:bg-[#165b32] border-2 border-[#1b4d2e] hover:border-[#fbbf24] text-left transition group active:scale-[0.99] cursor-pointer"
          >
            <div className="text-[10px] uppercase font-mono font-bold text-[#2dd4bf] mb-1">Team B Winner</div>
            <div className="text-base font-bold text-white group-hover:text-[#2dd4bf]">
              {match.team_b_names.join(' & ')}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* 2. REGISTER PLAYER MODAL */
export function AddPlayerModal({ onClose }: { onClose: () => void }) {
  const { createPlayer, players = [] } = useOpenPlay();
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('Male');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createPlayer(name, age ? Number(age) : undefined, gender);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#111c30] border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-scoreboard text-lg font-bold tracking-tight text-white uppercase italic">
              Register New Player
            </h3>
            <p className="text-[11px] text-slate-400">
              Assigned ID: PL-{100 + (players?.length || 0) + 1} (Provisional • 0/5 Matches)
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Player Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Jordan Chen"
            className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fbbf24]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Age (Optional)</label>
            <input
              type="number"
              min="5"
              max="100"
              value={age}
              onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 26"
              className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#fbbf24]"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Gender</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value as Gender)}
              className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Co-ed / Other">Co-ed / Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-[#0b1220] rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400">
          ℹ️ Player will be saved as <strong>Provisional (0/5 Matches)</strong>. After 5 placement matches, their starting ladder rank will automatically calibrate.
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs">
            Save to Directory
          </button>
        </div>
      </form>
    </div>
  );
}

/* 3. SESSION SETTINGS MODAL */
export function SessionSettingsModal({ onClose }: { onClose: () => void }) {
  const { session, setCourtCount, clearAllData } = useOpenPlay();
  const [courts, setCourts] = useState(session.court_count);

  const handleSaveCourts = async (e: React.FormEvent) => {
    e.preventDefault();
    await setCourtCount(Number(courts));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111c30] border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-scoreboard text-lg font-bold tracking-tight text-white uppercase italic">
              Live Session & Court Controls
            </h3>
            <p className="text-[11px] text-slate-400">Adjust active courts in case of weather or broken nets</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveCourts} className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0b1220] border border-slate-800 space-y-2">
            <label className="block text-xs font-mono uppercase text-slate-300 font-bold">
              Active Court Count (1–16)
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setCourts(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition border border-slate-700"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center font-scoreboard text-3xl font-bold text-[#fbbf24]">
                {courts} Courts
              </div>

              <button
                type="button"
                onClick={() => setCourts(prev => Math.min(16, prev + 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition border border-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Reducing courts safely releases players back to queue. Adding courts automatically drafts next matches.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset and clear today\'s session matches?')) {
                  clearAllData();
                  onClose();
                }
              }}
              className="px-3.5 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition"
            >
              Reset Session
            </button>

            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs transition shadow-md">
              Apply & Auto-Balance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
