'use client';

import React, { useState } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { Gender, Player } from '../types/pickleball';
import { X, Sparkles, ShieldCheck } from 'lucide-react';

export function PlayerOnboardingModal({
  onClose,
  onComplete
}: {
  onClose: () => void;
  onComplete: (player: Player) => void;
}) {
  const { createPlayer } = useOpenPlay();
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('Co-ed / Other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newP = createPlayer(
      name,
      age ? Number(age) : undefined,
      gender
    );
    onComplete(newP);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#111c30] border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#fbbf24]" />
            <h3 className="font-scoreboard text-xl font-bold text-white uppercase italic">
              Create Player Profile
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Display Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-[#0b1220] border border-slate-700 focus:border-[#fbbf24] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
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
                placeholder="e.g. 24"
                className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
                className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Co-ed / Other">Co-ed / Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-[#0c2e1b] rounded-2xl border border-[#1b4d2e] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#2dd4bf] uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Provisional Placement System</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              All new players start in a <strong>Provisional State</strong>. Complete <strong>5 placement matches</strong> across live sessions or PvP grinds to calibrate and unlock your official rank tier!
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-sm uppercase italic font-bold tracking-tight shadow-md transition"
        >
          Initialize Profile & Enter Home
        </button>
      </form>
    </div>
  );
}
