'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Player, Session, SessionCheckin, Court, Match, GameMode, Gender } from '../types/pickleball';
import { db } from '../lib/db';
import { isSessionValid, getInitialCourts } from '../lib/storage';
import { calculateCPAdjustment, applyMatchToPlayer, getRankInfo } from '../lib/progression';
import { generateNextMatch } from '../lib/matchmaker';

// PURE HELPER: Fill courts synchronously
function computeFillAllCourts(
  currentCourts: Court[],
  currentCheckins: SessionCheckin[],
  playersMap: Map<string, Player>,
  currentMatches: Match[],
  mode: GameMode
): Court[] {
  let updated = currentCourts.map(c => ({ ...c }));
  const busy = new Set<string>();

  updated.forEach(c => {
    c.current_match?.team_a_ids.forEach(id => busy.add(id));
    c.current_match?.team_b_ids.forEach(id => busy.add(id));
    c.next_up_match?.team_a_ids.forEach(id => busy.add(id));
    c.next_up_match?.team_b_ids.forEach(id => busy.add(id));
  });

  // PASS 1: Fill ALL Open Live Courts FIRST
  for (let i = 0; i < updated.length; i++) {
    if (!updated[i].current_match) {
      const avail = currentCheckins.filter(c => !busy.has(c.player_id));
      const match = generateNextMatch({
        mode,
        availableCheckins: avail,
        playersMap,
        recentMatches: currentMatches,
        courtNumber: updated[i].court_number
      });
      if (match) {
        match.status = 'in-progress';
        updated[i] = { ...updated[i], status: 'live', current_match: match };
        match.team_a_ids.forEach(id => busy.add(id));
        match.team_b_ids.forEach(id => busy.add(id));
      }
    }
  }

  // PASS 2: Stage "Next Up" on-deck slips ONLY after all courts are live
  for (let i = 0; i < updated.length; i++) {
    if (updated[i].current_match && !updated[i].next_up_match) {
      const avail = currentCheckins.filter(c => !busy.has(c.player_id));
      const nextMatch = generateNextMatch({
        mode,
        availableCheckins: avail,
        playersMap,
        recentMatches: currentMatches,
        courtNumber: updated[i].court_number
      });
      if (nextMatch) {
        updated[i] = { ...updated[i], next_up_match: nextMatch };
        nextMatch.team_a_ids.forEach(id => busy.add(id));
        nextMatch.team_b_ids.forEach(id => busy.add(id));
      }
    }
  }

  return updated;
}

interface OpenPlayContextType {
  players: Player[];
  playersMap: Map<string, Player>;
  session: Session;
  checkins: SessionCheckin[];
  courts: Court[];
  matches: Match[];
  isLoaded: boolean;
  hasExistingSession: boolean;
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  continueExistingSession: () => void;
  startNewSession: (name: string, courtCount: number, mode: GameMode, queuePlayersPerCourt: number) => void;
  setupSession: (name: string, courtCount: number, mode: GameMode, queuePlayersPerCourt: number) => void;
  setCourtCount: (count: number) => Promise<void>;
  recruitPlayerToSession: (playerId: string) => void;
  removePlayerFromSession: (playerId: string) => void;
  createPlayer: (name: string, age?: number, gender?: Gender) => Player;
  createAndRecruitPlayer: (name: string, age?: number, gender?: Gender) => Player;
  groupQueuePair: (playerAId: string, playerBId: string) => void;
  dissolveQueuePair: (playerId: string) => void;
  updatePlayerRank: (playerId: string, newRankValue: number, stars: number) => void;
  advanceStep: (step: Session['onboarding_step']) => void;
  toggleCheckIn: (playerId: string) => void;
  checkInAll: () => void;
  clearAllCheckins: () => void;
  startMatchForAvailableCourts: () => void;
  autoFillCourts: () => void;
  recordMatchResult: (matchId: string, winner: 'teamA' | 'teamB') => void;
  voidMatch: (courtNumber: number) => void;
  clearAllData: () => void;
}

const OpenPlayContext = createContext<OpenPlayContextType | undefined>(undefined);

export function OpenPlayProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hasExistingSession, setHasExistingSession] = useState(false);

  const [session, setSession] = useState<Session>({
    id: 'session-init',
    name: 'Friday Night Open',
    court_count: 4,
    mode: 'doubles',
    active_players_per_court: 4,
    queue_players_per_court: 12,
    total_session_capacity: 48,
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    onboarding_step: 'session_gate',
    is_active: false,
  });
  const [checkins, setCheckins] = useState<SessionCheckin[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    async function initDatabase() {
      try {
        const allPlayers = await db.players.toArray();
        setPlayers(allPlayers);

        const latestSession = await db.sessions.orderBy('created_at').last();
        if (latestSession && isSessionValid(latestSession)) {
          setSession(latestSession);
          setHasExistingSession(true);
          const allCheckins = await db.checkins.toArray();
          const allCourts = await db.courts.orderBy('court_number').toArray();
          const allMatches = await db.matches.orderBy('created_at').reverse().toArray();

          setCheckins(allCheckins);
          setCourts(allCourts.length > 0 ? allCourts : getInitialCourts(latestSession.court_count || 4));
          setMatches(allMatches);
        } else {
          setHasExistingSession(false);
          setCourts(getInitialCourts(4));
          setSession(prev => ({ ...prev, onboarding_step: 'session_gate', is_active: false }));
        }
      } catch (err) {
        console.error('Dexie init error:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    initDatabase();
  }, []);

  const playersMap = useMemo(() => {
    const m = new Map<string, Player>();
    (players || []).forEach(p => {
      if (p && p.id) m.set(p.id, p);
    });
    return m;
  }, [players]);

  const continueExistingSession = useCallback(async () => {
    const updated: Session = {
      ...session,
      last_active_at: new Date().toISOString(),
      onboarding_step: 'active_hub',
      is_active: true
    };
    setSession(updated);
    await db.sessions.put(updated);
  }, [session]);

  const setupSession = useCallback(async (name: string, courtCount: number, mode: GameMode, queuePlayersPerCourt: number) => {
    const perCourtActive = mode === 'singles' ? 2 : 4;
    const count = Number(courtCount) || 4;
    const perQueue = Number(queuePlayersPerCourt) || 12;
    const totalCapacity = count * perQueue;
    const now = new Date().toISOString();

    const newSess: Session = {
      id: `sess-${Date.now()}`,
      name: (name || 'Open Play Session').trim(),
      court_count: count,
      mode: mode || 'doubles',
      active_players_per_court: perCourtActive,
      queue_players_per_court: perQueue,
      total_session_capacity: totalCapacity,
      created_at: now,
      last_active_at: now,
      onboarding_step: 'player_setup',
      is_active: false
    };

    const initialCourts = getInitialCourts(count);

    setSession(newSess);
    setCourts(initialCourts);
    setCheckins([]);
    setMatches([]);
    setHasExistingSession(false);

    await db.transaction('rw', db.sessions, db.courts, db.checkins, db.matches, async () => {
      await db.sessions.put(newSess);
      await db.courts.clear();
      await db.courts.bulkPut(initialCourts);
      await db.checkins.clear();
      await db.matches.clear();
    });
  }, []);

  const startNewSession = setupSession;

  const setCourtCount = useCallback(async (newCount: number) => {
    const targetCount = Math.max(1, Math.min(16, Number(newCount)));
    if (targetCount === courts.length) return;

    let updatedCourts: Court[] = [];

    if (targetCount < courts.length) {
      updatedCourts = courts.slice(0, targetCount);
      for (let num = targetCount + 1; num <= courts.length; num++) {
        await db.courts.where('court_number').equals(num).delete();
      }
    } else {
      updatedCourts = [...courts];
      for (let num = courts.length + 1; num <= targetCount; num++) {
        updatedCourts.push({
          court_number: num,
          status: 'idle',
          current_match: null,
          next_up_match: null
        });
      }
    }

    const updatedSess: Session = {
      ...session,
      court_count: targetCount,
      total_session_capacity: targetCount * (session.queue_players_per_court || 12)
    };

    setSession(updatedSess);
    setCourts(updatedCourts);

    await db.transaction('rw', db.sessions, db.courts, async () => {
      await db.sessions.put(updatedSess);
      await db.courts.bulkPut(updatedCourts);
    });
  }, [courts, session]);

  const recruitPlayerToSession = useCallback(async (playerId: string) => {
    const newCheckin: SessionCheckin = {
      id: `chk-${playerId}`,
      player_id: playerId,
      games_played_today: 0,
      checked_in_at: new Date().toISOString()
    };

    setCheckins(prev => {
      if ((prev || []).some(c => c?.player_id === playerId)) return prev;
      return [...prev, newCheckin];
    });

    await db.checkins.put(newCheckin);
  }, []);

  const removePlayerFromSession = useCallback(async (playerId: string) => {
    setCheckins(prev => (prev || []).filter(c => c?.player_id !== playerId));
    await db.checkins.where('player_id').equals(playerId).delete();
  }, []);

  // STARTING PLAYER INITIALIZED AT WOOD III (Rank 1) WITH 0 STARS & 0 CP
  const createPlayer = useCallback((name: string, age?: number, gender?: Gender): Player => {
    const autoId = `PL-${100 + (players?.length || 0) + 1}`;
    const rank = getRankInfo(1); // Wood III

    const newPlayer: Player = {
      id: autoId,
      name: (name || '').trim(),
      age: age ? Number(age) : undefined,
      gender: gender || 'Co-ed / Other',
      locked_partner_id: null,
      rank_value: 1,
      tier: 'wood',
      sub_tier: 'III',
      rank_name: 'Wood III',
      stars: 0,
      current_cp: 0,
      demotion_grace_matches: 0,
      active_promotion_series: null,
      wins_singles: 0,
      losses_singles: 0,
      wins_doubles: 0,
      losses_doubles: 0,
      created_at: new Date().toISOString()
    };

    setPlayers(prev => [newPlayer, ...prev]);
    db.players.put(newPlayer).catch(console.error);

    return newPlayer;
  }, [players]);

  const createAndRecruitPlayer = useCallback((name: string, age?: number, gender?: Gender): Player => {
    const newPlayer = createPlayer(name, age, gender);
    recruitPlayerToSession(newPlayer.id);
    return newPlayer;
  }, [createPlayer, recruitPlayerToSession]);

  const groupQueuePair = useCallback(async (playerAId: string, playerBId: string) => {
    if (playerAId === playerBId) return;

    let updatedP: Player[] = [];
    setPlayers(prev => {
      updatedP = (prev || []).map(p => {
        if (p.id === playerAId) return { ...p, locked_partner_id: playerBId };
        if (p.id === playerBId) return { ...p, locked_partner_id: playerAId };
        if (p.locked_partner_id === playerAId || p.locked_partner_id === playerBId) {
          return { ...p, locked_partner_id: null };
        }
        return p;
      });
      return updatedP;
    });

    await db.players.bulkPut(updatedP);
  }, []);

  const dissolveQueuePair = useCallback(async (playerId: string) => {
    const target = players.find(p => p.id === playerId);
    const partnerId = target?.locked_partner_id;

    let updatedP: Player[] = [];
    setPlayers(prev => {
      updatedP = (prev || []).map(p => {
        if (p.id === playerId || (partnerId && p.id === partnerId)) {
          return { ...p, locked_partner_id: null };
        }
        return p;
      });
      return updatedP;
    });

    await db.players.bulkPut(updatedP);
  }, [players]);

  const updatePlayerRank = useCallback(async (playerId: string, newRankValue: number, stars: number) => {
    const rank = getRankInfo(newRankValue);
    let updatedTarget: Player | undefined;

    setPlayers(prev => (prev || []).map(p => {
      if (p.id !== playerId) return p;
      const updated: Player = {
        ...p,
        rank_value: rank.rankValue,
        tier: rank.tier,
        sub_tier: rank.subTier,
        rank_name: rank.displayName,
        stars: Math.max(0, Math.min(5, stars))
      };
      updatedTarget = updated;
      return updated;
    }));

    if (updatedTarget) {
      await db.players.put(updatedTarget);
    }
  }, []);

  const advanceStep = useCallback(async (step: Session['onboarding_step']) => {
    const updatedSess: Session = {
      ...session,
      onboarding_step: step,
      is_active: step === 'active_hub'
    };
    setSession(updatedSess);
    await db.sessions.put(updatedSess);
  }, [session]);

  const toggleCheckIn = useCallback(async (playerId: string) => {
    const exists = (checkins || []).some(c => c.player_id === playerId);
    if (exists) {
      setCheckins(prev => prev.filter(c => c.player_id !== playerId));
      await db.checkins.where('player_id').equals(playerId).delete();
    } else {
      const newC: SessionCheckin = {
        id: `chk-${playerId}`,
        player_id: playerId,
        games_played_today: 0,
        checked_in_at: new Date().toISOString()
      };
      setCheckins(prev => [...prev, newC]);
      await db.checkins.put(newC);
    }
  }, [checkins]);

  const checkInAll = useCallback(async () => {
    const existing = new Set((checkins || []).map(c => c.player_id));
    const toAdd = (players || []).filter(p => !existing.has(p.id)).map(p => ({
      id: `chk-${p.id}`,
      player_id: p.id,
      games_played_today: 0,
      checked_in_at: new Date().toISOString()
    }));
    setCheckins(prev => [...prev, ...toAdd]);
    if (toAdd.length > 0) await db.checkins.bulkPut(toAdd);
  }, [checkins, players]);

  const clearAllCheckins = useCallback(async () => {
    setCheckins([]);
    await db.checkins.clear();
  }, []);

  const startMatchForAvailableCourts = useCallback(async () => {
    const needed = session.mode === 'singles' ? 2 : 4;
    
    const busy = new Set<string>();
    courts.forEach(c => {
      c.current_match?.team_a_ids.forEach(id => busy.add(id));
      c.current_match?.team_b_ids.forEach(id => busy.add(id));
      c.next_up_match?.team_a_ids.forEach(id => busy.add(id));
      c.next_up_match?.team_b_ids.forEach(id => busy.add(id));
    });

    const idleCourtIndex = courts.findIndex(c => !c.current_match);
    if (idleCourtIndex === -1) return;

    const avail = checkins.filter(c => !busy.has(c.player_id));
    if (avail.length < needed) return;

    const match = generateNextMatch({
      mode: session.mode,
      availableCheckins: avail,
      playersMap,
      recentMatches: matches,
      courtNumber: courts[idleCourtIndex].court_number
    });

    if (match) {
      match.status = 'in-progress';
      const updatedCourts = [...courts];
      updatedCourts[idleCourtIndex] = {
        ...updatedCourts[idleCourtIndex],
        status: 'live',
        current_match: match
      };
      setCourts(updatedCourts);
      await db.courts.bulkPut(updatedCourts);
    }
  }, [session, courts, checkins, playersMap, matches]);

  const autoFillCourts = useCallback(async () => {
    const updated = computeFillAllCourts(courts, checkins, playersMap, matches, session.mode);
    setCourts(updated);
    await db.courts.bulkPut(updated);
  }, [courts, checkins, playersMap, matches, session.mode]);

  // =========================================================================
  // MATCH RESULT RECORDING: COURT POINTS (CP) & STARS ENGINE INTEGRATION
  // =========================================================================
  const recordMatchResult = useCallback(async (matchId: string, winner: 'teamA' | 'teamB') => {
    let targetMatch: Match | undefined;
    let targetCourtNumber = -1;

    courts.forEach(c => {
      if (c.current_match?.id === matchId) {
        targetMatch = c.current_match;
        targetCourtNumber = c.court_number;
      }
    });

    if (!targetMatch) {
      const foundCourt = courts.find(c => c.current_match && c.current_match.id === matchId);
      if (foundCourt && foundCourt.current_match) {
        targetMatch = foundCourt.current_match;
        targetCourtNumber = foundCourt.court_number;
      }
    }

    if (!targetMatch) return;

    // Get average rank values of Team A and Team B
    const teamARankValues = targetMatch.team_a_ids.map(id => playersMap.get(id)?.rank_value || 1);
    const teamBRankValues = targetMatch.team_b_ids.map(id => playersMap.get(id)?.rank_value || 1);

    const avgRankA = teamARankValues.reduce((a, b) => a + b, 0) / teamARankValues.length;
    const avgRankB = teamBRankValues.reduce((a, b) => a + b, 0) / teamBRankValues.length;

    const aKey = [...targetMatch.team_a_ids].sort().join(':');
    const bKey = [...targetMatch.team_b_ids].sort().join(':');
    const repeatCount = (matches || []).filter(m => {
      const ma = [...(m.team_a_ids || [])].sort().join(':');
      const mb = [...(m.team_b_ids || [])].sort().join(':');
      return (ma === aKey && mb === bKey) || (ma === bKey && mb === aKey);
    }).length + 1;

    const playerCPDeltas: Record<string, number> = {};
    const playerStarDeltas: Record<string, number> = {};

    // 1. Calculate CP and Stars using Court Points Engine
    const updatedPlayers = (players || []).map(p => {
      if (!p) return p;
      const inTeamA = targetMatch!.team_a_ids.includes(p.id);
      const inTeamB = targetMatch!.team_b_ids.includes(p.id);

      if (inTeamA || inTeamB) {
        const isWin = (winner === 'teamA' && inTeamA) || (winner === 'teamB' && inTeamB);
        const opponentAvg = inTeamA ? avgRankB : avgRankA;
        
        let partnerRank: number | null = null;
        if (session.mode === 'doubles') {
          const teammateIds = inTeamA ? targetMatch!.team_a_ids : targetMatch!.team_b_ids;
          const partnerId = teammateIds.find(x => x !== p.id);
          partnerRank = partnerId ? (playersMap.get(partnerId)?.rank_value || 1) : null;
        }

        const adjustment = calculateCPAdjustment({
          isWinner: isWin,
          playerRankValue: p.rank_value || 1,
          opponentAvgRankValue: opponentAvg,
          partnerRankValue: partnerRank,
          repeatOccurrencesInWindow: Math.max(0, repeatCount - 1)
        });

        playerCPDeltas[p.id] = adjustment.cpDelta;
        playerStarDeltas[p.id] = adjustment.starDelta;

        const updatedP = applyMatchToPlayer(p, adjustment, isWin);

        if (session.mode === 'singles') {
          return {
            ...updatedP,
            wins_singles: (p.wins_singles || 0) + (isWin ? 1 : 0),
            losses_singles: (p.losses_singles || 0) + (isWin ? 0 : 1),
          };
        } else {
          return {
            ...updatedP,
            wins_doubles: (p.wins_doubles || 0) + (isWin ? 1 : 0),
            losses_doubles: (p.losses_doubles || 0) + (isWin ? 0 : 1),
          };
        }
      }
      return p;
    });

    // 2. Sit-out fairness counter
    const involved = [...targetMatch.team_a_ids, ...targetMatch.team_b_ids];
    const updatedCheckins = (checkins || []).map(c => involved.includes(c.player_id)
      ? { ...c, games_played_today: (c.games_played_today || 0) + 1 }
      : c
    );

    // 3. Match history record with CP & Star deltas
    const completed: Match = {
      ...targetMatch,
      status: winner === 'teamA' ? 'teamA_win' : 'teamB_win',
      player_cp_deltas: playerCPDeltas,
      player_star_deltas: playerStarDeltas,
      repeat_count: repeatCount,
      time_str: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 4. Update Courts
    let updatedCourts: Court[] = [];
    setCourts(prevCourts => {
      updatedCourts = prevCourts.map(c => {
        if (c.court_number === targetCourtNumber) {
          const next = c.next_up_match;
          return {
            ...c,
            status: next ? ('live' as const) : ('idle' as const),
            current_match: next ? { ...next, status: 'in-progress' as const } : null,
            next_up_match: null
          };
        }
        return c;
      });
      return updatedCourts;
    });

    setPlayers(updatedPlayers);
    setCheckins(updatedCheckins);
    setMatches(prev => [completed, ...(prev || [])]);

    try {
      await db.transaction('rw', db.players, db.checkins, db.matches, db.courts, async () => {
        await db.players.bulkPut(updatedPlayers);
        await db.checkins.bulkPut(updatedCheckins);
        await db.matches.put(completed);
        await db.courts.bulkPut(updatedCourts);
      });
    } catch (dbErr) {
      console.error('Dexie match error:', dbErr);
    }
  }, [courts, session.mode, playersMap, matches, players, checkins]);

  const voidMatch = useCallback(async (courtNumber: number) => {
    let updatedCourts: Court[] = [];

    setCourts(prevCourts => {
      updatedCourts = prevCourts.map(c => {
        if (c.court_number === courtNumber) {
          const next = c.next_up_match;
          return {
            ...c,
            status: next ? ('live' as const) : ('idle' as const),
            current_match: next ? { ...next, status: 'in-progress' as const } : null,
            next_up_match: null
          };
        }
        return c;
      });
      return updatedCourts;
    });

    try {
      await db.courts.bulkPut(updatedCourts);
    } catch (e) {
      console.error('Failed to void match in DB:', e);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    const initialCourts = getInitialCourts(4);
    const resetSess: Session = {
      id: 'session-init',
      name: 'Friday Night Open',
      court_count: 4,
      mode: 'doubles',
      active_players_per_court: 4,
      queue_players_per_court: 12,
      total_session_capacity: 48,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      onboarding_step: 'session_gate',
      is_active: false
    };

    setCheckins([]);
    setMatches([]);
    setCourts(initialCourts);
    setHasExistingSession(false);
    setSession(resetSess);

    await db.transaction('rw', db.sessions, db.checkins, db.courts, db.matches, async () => {
      await db.sessions.clear();
      await db.checkins.clear();
      await db.matches.clear();
      await db.courts.clear();
      await db.courts.bulkPut(initialCourts);
      await db.sessions.put(resetSess);
    });
  }, []);

  return (
    <OpenPlayContext.Provider value={{
      players,
      playersMap,
      session,
      checkins,
      courts,
      matches,
      isLoaded,
      hasExistingSession,
      selectedPlayerId,
      setSelectedPlayerId,
      continueExistingSession,
      startNewSession,
      setupSession,
      setCourtCount,
      recruitPlayerToSession,
      removePlayerFromSession,
      createPlayer,
      createAndRecruitPlayer,
      groupQueuePair,
      dissolveQueuePair,
      updatePlayerRank,
      advanceStep,
      toggleCheckIn,
      checkInAll,
      clearAllCheckins,
      startMatchForAvailableCourts,
      autoFillCourts,
      recordMatchResult,
      voidMatch,
      clearAllData
    }}>
      {children}
    </OpenPlayContext.Provider>
  );
}

export function useOpenPlay() {
  const ctx = useContext(OpenPlayContext);
  if (!ctx) throw new Error('useOpenPlay error');
  return ctx;
}
