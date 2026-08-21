'use client';

import React, { useState } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { GameMode } from '../types/pickleball';
import { getSessionRemainingTime, isSessionValid } from '../lib/storage';
import { isCloudConfigured } from '../lib/supabase';
import { Play, Plus, Clock, Shield, Sparkles, Building2, MapPin, Trash2, Cloud } from 'lucide-react';

export function SessionLanding() {
  const {
    venues = [],
    currentVenue,
    session,
    players = [],
    hasExistingSession,
    selectVenue,
    createVenue,
    deleteVenue,
    continueExistingSession,
    advanceStep
  } = useOpenPlay();

  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCourts, setNewVenueCourts] = useState(4);
  const [newVenueMode, setNewVenueMode] = useState<GameMode>('doubles');
  const [newVenueQueuePerCourt, setNewVenueQueuePerCourt] = useState(12);

  const isSessionActive = hasExistingSession && isSessionValid(session);
  const remainingTimeStr = getSessionRemainingTime(session);

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    await createVenue(
      newVenueName,
      Number(newVenueCourts),
      newVenueMode,
      Number(newVenueQueuePerCourt)
    );
    setNewVenueName('');
    setIsCreatingVenue(false);
    advanceStep('court_setup');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* BRAND & CLOUD STATUS */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#fbbf24] flex items-center justify-center p-3 shadow-[0_0_30px_rgba(251,191,36,0.35)] mx-auto">
          <svg viewBox="0 0 24 24" fill="#0b1220" className="w-full h-full">
            <circle cx="12" cy="12" r="10" stroke="#0b1220" strokeWidth="1.5" fill="none" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="16" cy="8" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="8" cy="16" r="1.5" />
            <circle cx="16" cy="16" r="1.5" />
          </svg>
        </div>
        <h1 className="font-scoreboard text-4xl sm:text-5xl font-bold tracking-tight text-white uppercase italic leading-none">
          OPEN PLAY
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-mono">
          Ranked Pickleball Session Manager & Matchmaking Queue
        </p>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#111c30] border border-slate-700 text-[11px] font-mono">
          <Cloud className={`w-3.5 h-3.5 ${isCloudConfigured ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
          <span className={isCloudConfigured ? 'text-[#2dd4bf] font-bold' : 'text-slate-400'}>
            {isCloudConfigured ? 'Vercel Cloud Synced (Supabase Online)' : 'IndexedDB Local Engine'}
          </span>
        </div>
      </div>

      {/* SAVED VENUES HUB */}
      <div className="bg-[#111c30] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="font-scoreboard text-2xl font-bold tracking-tight text-white uppercase italic flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-[#fbbf24]" />
              <span>SAVED COURT VENUES</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an existing location to load its players and rankings, or create a new venue.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingVenue(!isCreatingVenue)}
            className="px-4 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-sm uppercase italic font-bold tracking-tight shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isCreatingVenue ? 'Close Form' : '+ New Court Venue'}</span>
          </button>
        </div>

        {/* REGISTER NEW VENUE FORM */}
        {isCreatingVenue && (
          <form onSubmit={handleCreateVenue} className="p-5 bg-[#0b1220] border-2 border-[#fbbf24]/50 rounded-2xl space-y-4">
            <div className="text-xs font-mono uppercase text-[#fbbf24] font-bold flex items-center space-x-1.5">
              <MapPin className="w-4 h-4" />
              <span>Register New Pickleball Court Venue</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Court / Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={newVenueName}
                  onChange={e => setNewVenueName(e.target.value)}
                  placeholder="e.g. Centennial Pickleball Club or Smash Arena"
                  className="w-full bg-[#111c30] border border-slate-700 focus:border-[#fbbf24] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Number of Courts
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  required
                  value={newVenueCourts}
                  onChange={e => setNewVenueCourts(Number(e.target.value))}
                  className="w-full bg-[#111c30] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Default Mode
                </label>
                <select
                  value={newVenueMode}
                  onChange={e => setNewVenueMode(e.target.value as GameMode)}
                  className="w-full bg-[#111c30] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
                >
                  <option value="doubles">Doubles (4 Players / Court)</option>
                  <option value="singles">Singles (2 Players / Court)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-sm uppercase italic font-bold tracking-tight shadow-md transition cursor-pointer"
            >
              Save Venue & Continue to Setup
            </button>
          </form>
        )}

        {/* SAVED VENUES LIST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {venues.length === 0 ? (
            <div className="sm:col-span-2 py-10 text-center text-slate-500 font-mono text-xs italic bg-[#0b1220] rounded-2xl border border-slate-800">
              No saved venues found. Click <strong className="text-white">+ New Court Venue</strong> or the button below to start.
            </div>
          ) : (
            venues.map(v => {
              const isSelected = currentVenue?.id === v.id;
              const venuePlayers = players.filter(p => p.venue_id === v.id || !p.venue_id);

              return (
                <div
                  key={v.id}
                  onClick={() => selectVenue(v.id)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-[#0c2e1b] border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                      : 'bg-[#0b1220] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs text-[#fbbf24] font-mono font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Court Venue</span>
                      </div>
                      <h3 className="font-scoreboard text-xl font-bold text-white uppercase italic mt-1 leading-tight">
                        {v.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete venue "${v.name}" and its saved session data?`)) {
                          deleteVenue(v.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Venue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-2 border-t border-slate-800/80">
                    <div>{v.default_courts || 4} Courts</div>
                    <div className="text-right text-[#2dd4bf] font-bold">
                      {venuePlayers.length} Stored Players
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectVenue(v.id);
                    }}
                    className={`w-full py-2 rounded-xl font-scoreboard text-xs uppercase italic font-bold tracking-tight flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#fbbf24] text-slate-950'
                        : 'bg-[#111c30] text-slate-200 hover:bg-slate-800 border border-slate-700'
                    }`}
                  >
                    <span>{isSelected ? 'Selected ✓' : 'Select Venue →'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* PRIMARY CTA: START TODAY'S SESSION (NEVER BLOCKED) */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          {isSessionActive ? (
            <button
              type="button"
              onClick={continueExistingSession}
              className="w-full py-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-lg uppercase italic font-bold tracking-tight shadow-xl flex items-center justify-center space-x-2 transition active:scale-[0.99] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Continue Active Session ({session.name})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => advanceStep('court_setup')}
              className="w-full py-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-scoreboard text-lg uppercase italic font-bold tracking-tight shadow-xl flex items-center justify-center space-x-2 transition active:scale-[0.99] cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Create New Session Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
