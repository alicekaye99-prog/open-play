'use client';

import React, { useState } from 'react';
import { useOpenPlay } from '../context/OpenPlayContext';
import { PlayerOnboardingModal } from './PlayerOnboardingModal';
import { User, Building2, ChevronRight, LogOut, ArrowLeftRight } from 'lucide-react';

export function TwoGateLanding() {
  const { 
    setActiveRole, 
    players = [], 
    currentPlayer, 
    setCurrentPlayer,
    advanceStep,
    logout 
  } = useOpenPlay();

  const [isRegisteringPlayer, setIsRegisteringPlayer] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);

  const handleSelectPlayerGate = () => {
    setActiveRole('player');
    if (currentPlayer) {
      advanceStep('player_home');
    } else if (players.length > 0) {
      setShowPlayerPicker(true);
    } else {
      setIsRegisteringPlayer(true);
    }
  };

  const handleSelectOwnerGate = () => {
    setActiveRole('venue_owner');
    advanceStep('session_gate');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 min-h-[90vh] flex flex-col justify-center relative">
      
      {/* TOP BAR WITH LOG OUT BUTTON */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="text-xs font-mono text-slate-400">
          {currentPlayer ? (
            <span>Logged in as: <strong className="text-[#fbbf24]">{currentPlayer.name}</strong></span>
          ) : (
            <span>Welcome to Pikol Legends</span>
          )}
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-3.5 py-1.5 rounded-xl bg-[#111c30] hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700 text-xs font-mono text-slate-300 hover:text-rose-300 flex items-center space-x-1.5 transition cursor-pointer shadow-md active:scale-95"
          title="Log Out and return to Landing Page"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Log Out to Landing Page</span>
        </button>
      </div>

      {/* BRAND & INTRO */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-[#fbbf24] flex items-center justify-center p-3 shadow-[0_0_35px_rgba(251,191,36,0.4)] mx-auto">
          <svg viewBox="0 0 24 24" fill="#0b1220" className="w-full h-full">
            <circle cx="12" cy="12" r="10" stroke="#0b1220" strokeWidth="1.5" fill="none" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="16" cy="8" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="8" cy="16" r="1.5" />
            <circle cx="16" cy="16" r="1.5" />
          </svg>
        </div>

        <h1 className="font-scoreboard text-4xl sm:text-6xl font-black tracking-tight text-white uppercase italic leading-none">
          PIKOL LEGENDS
        </h1>
        <p className="text-xs sm:text-base text-slate-400 font-mono max-w-lg mx-auto">
          Ranked Pickleball Progression Engine • Wood III to Master Ladder
        </p>
      </div>

      {/* TWO-GATE ENTRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GATE 1: CONTINUE AS PLAYER */}
        <div 
          onClick={handleSelectPlayerGate}
          className="p-8 rounded-3xl bg-[#0c2e1b] border-2 border-[#1b4d2e] hover:border-[#fbbf24] hover:shadow-[0_0_35px_rgba(251,191,36,0.25)] transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 group"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#fbbf24] flex items-center justify-center text-slate-950 shadow-md">
              <User className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#2dd4bf] font-bold">
                Competitive Player Portal
              </div>
              <h2 className="font-scoreboard text-3xl font-black text-white uppercase italic mt-1 group-hover:text-[#fbbf24] transition">
                Continue as Player
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-sans">
                Grind Court Points (CP), earn sub-tier stars, climb from Wood III to Master, play standalone 1v1 / 2v2 PvP matches, or check in to live club sessions.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between font-scoreboard text-sm font-bold uppercase italic text-[#fbbf24]">
            <span>{currentPlayer ? `Welcome Back, ${currentPlayer.name}` : 'Enter Player Profile'}</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* GATE 2: CONTINUE AS COURT OWNER */}
        <div 
          onClick={handleSelectOwnerGate}
          className="p-8 rounded-3xl bg-[#111c30] border-2 border-slate-800 hover:border-[#2dd4bf] hover:shadow-[0_0_35px_rgba(45,212,191,0.2)] transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 group"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-[#2dd4bf] flex items-center justify-center text-slate-950 shadow-md">
              <Building2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#fbbf24] font-bold">
                Venue Director & Host
              </div>
              <h2 className="font-scoreboard text-3xl font-black text-white uppercase italic mt-1 group-hover:text-[#2dd4bf] transition">
                Continue as Court Owner
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-sans">
                Run live open-play tournament sessions, manage court stacking, track Host Tiers (Bronze to Diamond Host), and generate podium social cards.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between font-scoreboard text-sm font-bold uppercase italic text-[#2dd4bf]">
            <span>Open Venue Management</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-center pt-2">
        <button
          type="button"
          onClick={logout}
          className="text-xs font-mono text-slate-400 hover:text-rose-300 flex items-center space-x-1.5 transition underline underline-offset-4 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Switch Account or Log In with another User</span>
        </button>
      </div>

      {/* PLAYER PICKER POPUP */}
      {showPlayerPicker && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111c30] border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-scoreboard text-xl font-bold text-white uppercase italic">
              Select Your Player Profile
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {players.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setCurrentPlayer(p);
                    setShowPlayerPicker(false);
                    advanceStep('player_home');
                  }}
                  className="p-3.5 bg-[#0b1220] border border-slate-800 hover:border-[#fbbf24] rounded-2xl flex items-center justify-between cursor-pointer transition"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{p.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{p.id} • {p.rank_name}</div>
                  </div>
                  <span className="font-mono text-xs text-[#fbbf24] font-bold">{p.current_cp || 0} CP</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowPlayerPicker(false);
                setIsRegisteringPlayer(true);
              }}
              className="w-full py-2.5 rounded-xl bg-[#0b1220] hover:bg-slate-800 text-[#fbbf24] border border-[#fbbf24]/40 font-mono text-xs font-bold transition"
            >
              + Create New Player Profile
            </button>
          </div>
        </div>
      )}

      {/* PLAYER ONBOARDING MODAL */}
      {isRegisteringPlayer && (
        <PlayerOnboardingModal
          onClose={() => setIsRegisteringPlayer(false)}
          onComplete={(newPlayer) => {
            setCurrentPlayer(newPlayer);
            setIsRegisteringPlayer(false);
            advanceStep('player_home');
          }}
        />
      )}
    </div>
  );
}
