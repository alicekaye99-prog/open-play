'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Player, 
  Session, 
  SessionCheckin, 
  Court, 
  Match, 
  GameMode, 
  Gender, 
  Venue, 
  SessionChampionTrophy, 
  MatchSource,
  UserRole,
  OnboardingStep 
} from '../types/pickleball';
import { db } from '../lib/db';
import { supabase, isCloudConfigured } from '../lib/supabase';
import { isSessionValid, getInitialCourts } from '../lib/storage';
import { calculateCPAdjustment, applyMatchToPlayer, getRankInfo, evaluateCrossSourceHistory, calculateHostTier } from '../lib/progression';
import { R0, RD0 } from '../lib/placement';
import { generateNextMatch } from '../lib/matchmaker';
import { createPvPInvite, acceptPvPInvite, evaluateScoreSubmissions } from '../lib/pvp';

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

export interface OpenPlayContextType {
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole | null) => void;
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player | null) => void;
  venues: Venue[];
  currentVenue: Venue | null;
  players: Player[];
  playersMap: Map<string, Player>;
  session: Session;
  checkins: SessionCheckin[];
  courts: Court[];
  matches: Match[];
  isLoaded: boolean;
  hasExistingSession: boolean;
  selectedPlayerId: string | null;
  isCloudReady: boolean;
  setSelectedPlayerId: (id: string | null) => void;
  selectVenue: (venueId: string) => Promise<void>;
  createVenue: (name: string, defaultCourts: number, mode: GameMode, queueCapacity: number) => Promise<Venue>;
  deleteVenue: (venueId: string) => Promise<void>;
  leaveVenue: () => void;
  continueExistingSession: () => void;
  startNewSession: (name: string, courtCount: number, mode: GameMode, queuePlayersPerCourt: number) => void;
  setupSession: (name: string, courtCount: number, mode: GameMode, queuePlayersPerCourt: number) => void;
  setCourtCount: (count: number) => Promise<void>;
  recruitPlayerToSession: (playerId: string) => void;
  removePlayerFromSession: (playerId: string) => void;
  createPlayer: (name: string, age?: number, gender?: Gender) => Player;
  createAndRecruitPlayer: (name: string, age?: number, gender?: Gender) => Player;
  updatePlayerAvatar: (playerId: string, avatarUrl: string) => Promise<void>;
  groupQueuePair: (playerAId: string, playerBId: string) => void;
  dissolveQueuePair: (playerId: string) => void;
  updatePlayerRank: (playerId: string, newRankValue: number, stars: number) => void;
  advanceStep: (step: OnboardingStep) => void;
  toggleCheckIn: (playerId: string) => void;
  checkInAll: () => void;
  clearAllCheckins: () => void;
  startMatchForAvailableCourts: () => void;
  autoFillCourts: () => void;
  recordMatchResult: (matchId: string, winner: 'teamA' | 'teamB') => void;
  voidMatch: (courtNumber: number) => void;
  clearAllData: () => void;
  
  createPvPMatch: (creatorId: string, partnerId?: string | null, mode?: GameMode) => Promise<Match>;
  joinPvPMatch: (matchId: string, opponentId: string, opponentPartnerId?: string | null) => Promise<Match | null>;
  submitPvPScore: (matchId: string, playerId: string, teamAScore: number, teamBScore: number) => Promise<void>;
  finalizeSessionPodium: (firstPlaceId: string, secondPlaceId?: string, thirdPlaceId?: string) => Promise<void>;
  
  // Auth Operations
  login: (emailOrUsername: string, password: string, role: UserRole) => Promise<void>;
  signup: (params: { email: string; password: string; role: UserRole; displayName: string; age?: number; gender?: Gender }) => Promise<void>;
  logout: () => Promise<void>;
}

const OpenPlayContext = createContext<OpenPlayContextType | undefined>(undefined);

export function OpenPlayProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [currentVenue, setCurrentVenue] = useState<Venue | null>(null);
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
    onboarding_step: 'gate_select',
    is_active: false,
  });
  const [checkins, setCheckins] = useState<SessionCheckin[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        let loadedVenues: Venue[] = [];
        let loadedPlayers: Player[] = [];

        if (isCloudConfigured && supabase) {
          const { data: vData } = await supabase.from('venues').select('*').order('created_at', { ascending: false });
          if (vData) loadedVenues = vData;

          const { data: pData } = await supabase.from('players').select('*');
          if (pData) loadedPlayers = pData;
        } else {
          loadedVenues = await db.venues.orderBy('created_at').reverse().toArray();
          loadedPlayers = await db.players.toArray();

          if (loadedVenues.length === 0) {
            const defaultV: Venue = {
              id: 'venue-default',
              name: 'Centennial Pickleball Arena',
              settings: {
                default_courts: 4,
                default_mode: 'doubles',
                queue_capacity_per_court: 12,
                enable_gender_balance: true,
                enable_sitout_fairness: true,
                min_pvp_duration_singles_sec: 180,
                min_pvp_duration_doubles_sec: 240,
              },
              analytics: {
                total_sessions_hosted: 0,
                total_players_served: 0,
                total_matches_logged: 0,
                average_sitout_variance: 0.0,
                repeat_matchup_rate: 0.0,
                gender_balance_adherence: 100.0,
                dispute_rate: 0.0,
              },
              host_tier: 'Novice Host',
              created_at: new Date().toISOString()
            };
            await db.venues.put(defaultV);
            loadedVenues = [defaultV];
          }
        }

        const normalizedPlayers: Player[] = (loadedPlayers || []).map(p => ({
          ...p,
          placement_status: p.placement_status || (p.rank_value > 1 || p.stars > 0 || (p.current_cp || 0) > 0 ? 'placed' : 'provisional'),
          placement_matches_played: p.placement_matches_played ?? (p.placement_status === 'placed' ? 5 : 0),
          hidden_rating: p.hidden_rating ?? R0,
          hidden_rd: p.hidden_rd ?? RD0,
          placement_opponents: p.placement_opponents ?? [],
        }));

        if (!isMounted) return;
        setVenues(loadedVenues);
        setPlayers(normalizedPlayers);

        // REAL SESSION VALIDATION
        if (isCloudConfigured && supabase) {
          const { data: { session: authSession }, error: sessionErr } = await supabase.auth.getSession();

          if (authSession?.user && !sessionErr) {
            const userId = authSession.user.id;
            const savedRole = (localStorage.getItem('pikol_active_role') as UserRole) || (authSession.user.user_metadata?.role as UserRole) || 'player';
            
            let matchedPlayer: Player | null = null;
            if (savedRole === 'player') {
              matchedPlayer = normalizedPlayers.find(p => p.user_id === userId || p.email?.toLowerCase() === authSession.user.email?.toLowerCase()) || null;
              if (!matchedPlayer) {
                const { data: dbP } = await supabase.from('players').select('*').eq('user_id', userId).maybeSingle();
                matchedPlayer = dbP;
              }
            }

            setActiveRole(savedRole);
            setCurrentPlayer(matchedPlayer);
            setSession(prev => ({
              ...prev,
              onboarding_step: savedRole === 'player' ? 'player_home' : 'session_gate'
            }));
          } else {
            localStorage.removeItem('pikol_active_role');
            localStorage.removeItem('pikol_current_player_id');
            setActiveRole(null);
            setCurrentPlayer(null);
            setSession(prev => ({
              ...prev,
              onboarding_step: 'gate_select',
              is_active: false
            }));
          }
        } else {
          const savedRole = localStorage.getItem('pikol_active_role') as UserRole | null;
          const savedPlayerId = localStorage.getItem('pikol_current_player_id');
          const hasLocalSession = localStorage.getItem('pikol_local_session_active') === 'true';

          if (hasLocalSession && savedRole && savedPlayerId) {
            const matched = normalizedPlayers.find(p => p.id === savedPlayerId);
            if (matched) {
              setActiveRole(savedRole);
              setCurrentPlayer(matched);
              setSession(prev => ({
                ...prev,
                onboarding_step: savedRole === 'player' ? 'player_home' : 'session_gate'
              }));
            }
          } else {
            localStorage.removeItem('pikol_active_role');
            localStorage.removeItem('pikol_current_player_id');
            localStorage.removeItem('pikol_local_session_active');
            setActiveRole(null);
            setCurrentPlayer(null);
            setSession(prev => ({
              ...prev,
              onboarding_step: 'gate_select',
              is_active: false
            }));
          }
        }

        if (loadedVenues.length > 0) {
          const firstVenue = loadedVenues[0];
          setCurrentVenue(firstVenue);

          const activeSess = await db.sessions.where('venue_id').equals(firstVenue.id).last();
          if (activeSess && isSessionValid(activeSess)) {
            const allCheckins = await db.checkins.toArray();
            const allCourts = await db.courts.orderBy('court_number').toArray();
            const allMatches = await db.matches.orderBy('created_at').reverse().toArray();

            setCheckins(allCheckins);
            setCourts(allCourts.length > 0 ? allCourts : getInitialCourts(activeSess.court_count || 4));
            setMatches(allMatches);
          } else {
            setCourts(getInitialCourts(firstVenue.settings?.default_courts || 4));
          }
        }
      } catch (err) {
        console.error('Pikol Legends Init Error:', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }

    init();

    if (isCloudConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
        if (event === 'SIGNED_OUT' || !authSession) {
          localStorage.removeItem('pikol_active_role');
          localStorage.removeItem('pikol_current_player_id');
          setActiveRole(null);
          setCurrentPlayer(null);
          setSession(prev => ({ ...prev, onboarding_step: 'gate_select', is_active: false }));
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSetActiveRole = useCallback((role: UserRole | null) => {
    setActiveRole(role);
    if (role) {
      localStorage.setItem('pikol_active_role', role);
    } else {
      localStorage.removeItem('pikol_active_role');
    }
  }, []);

  const handleSetCurrentPlayer = useCallback((player: Player | null) => {
    setCurrentPlayer(player);
    if (player) {
      localStorage.setItem('pikol_current_player_id', player.id);
    } else {
      localStorage.removeItem('pikol_current_player_id');
    }
  }, []);

  const playersMap = useMemo(() => {
    const m = new Map<string, Player>();
    (players || []).forEach(p => {
      if (p && p.id) m.set(p.id, p);
    });
    return m;
  }, [players]);

  const selectVenue = useCallback(async (venueId: string) => {
    const target = venues.find(v => v.id === venueId);
    if (!target) return;
    setCurrentVenue(target);

    const activeSess = await db.sessions.where('venue_id').equals(venueId).last();
    if (activeSess && isSessionValid(activeSess)) {
      setSession(activeSess);
      setHasExistingSession(true);
      const allCheckins = await db.checkins.toArray();
      const allCourts = await db.courts.orderBy('court_number').toArray();
      const allMatches = await db.matches.orderBy('created_at').reverse().toArray();

      setCheckins(allCheckins);
      setCourts(allCourts.length > 0 ? allCourts : getInitialCourts(activeSess.court_count || 4));
      setMatches(allMatches);
    } else {
      setHasExistingSession(false);
      setCheckins([]);
      setMatches([]);
      setCourts(getInitialCourts(target.settings?.default_courts || 4));
      setSession({
        id: `sess-${Date.now()}`,
        venue_id: target.id,
        name: `${target.name} Session`,
        court_count: target.settings?.default_courts || 4,
        mode: target.settings?.default_mode || 'doubles',
        active_players_per_court: target.settings?.default_mode === 'singles' ? 2 : 4,
        queue_players_per_court: target.settings?.queue_capacity_per_court || 12,
        total_session_capacity: (target.settings?.default_courts || 4) * (target.settings?.queue_capacity_per_court || 12),
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        onboarding_step: 'session_gate',
        is_active: false
      });
    }
  }, [venues]);

  const createVenue = useCallback(async (name: string, defaultCourts: number, mode: GameMode, queueCapacity: number): Promise<Venue> => {
    const newVenue: Venue = {
      id: `venue-${Date.now()}`,
      name: name.trim(),
      settings: {
        default_courts: Number(defaultCourts) || 4,
        default_mode: mode || 'doubles',
        queue_capacity_per_court: Number(queueCapacity) || 12,
        enable_gender_balance: true,
        enable_sitout_fairness: true,
        min_pvp_duration_singles_sec: 180,
        min_pvp_duration_doubles_sec: 240,
      },
      analytics: {
        total_sessions_hosted: 0,
        total_players_served: 0,
        total_matches_logged: 0,
        average_sitout_variance: 0.0,
        repeat_matchup_rate: 0.0,
        gender_balance_adherence: 100.0,
        dispute_rate: 0.0,
      },
      host_tier: 'Novice Host',
      created_at: new Date().toISOString()
    };

    setVenues(prev => [newVenue, ...prev]);
    setCurrentVenue(newVenue);

    if (isCloudConfigured && supabase) {
      await supabase.from('venues').insert(newVenue);
    }
    await db.venues.put(newVenue);

    return newVenue;
  }, []);

  const deleteVenue = useCallback(async (venueId: string) => {
    setVenues(prev => prev.filter(v => v.id !== venueId));
    if (currentVenue?.id === venueId) {
      setCurrentVenue(venues.find(v => v.id !== venueId) || null);
    }

    if (isCloudConfigured && supabase) {
      await supabase.from('venues').delete().eq('id', venueId);
    }
    await db.venues.delete(venueId);
  }, [currentVenue, venues]);

  const leaveVenue = useCallback(() => {
    setSession(prev => ({ ...prev, onboarding_step: 'session_gate' }));
  }, []);

  const continueExistingSession = useCallback(async () => {
    const updated: Session = {
      ...session,
      last_active_at: new Date().toISOString(),
      onboarding_step: 'active_hub',
      is_active: true
    };
    setSession(updated);
    await db.sessions.put(updated);
    if (isCloudConfigured && supabase) {
      await supabase.from('sessions').upsert(updated);
    }
  }, [session]);

  const setupSession = useCallback(async (name: string, courtCount: number, mode: GameMode, queuePlayersPerCourt: number) => {
    const perCourtActive = mode === 'singles' ? 2 : 4;
    const count = Number(courtCount) || 4;
    const perQueue = Number(queuePlayersPerCourt) || 12;
    const totalCapacity = count * perQueue;
    const now = new Date().toISOString();

    let venue = currentVenue;
    if (!venue) {
      venue = {
        id: `venue-${Date.now()}`,
        name: (name || 'Pickleball Arena').trim(),
        settings: {
          default_courts: count,
          default_mode: mode || 'doubles',
          queue_capacity_per_court: perQueue,
          enable_gender_balance: true,
          enable_sitout_fairness: true,
          min_pvp_duration_singles_sec: 180,
          min_pvp_duration_doubles_sec: 240
        },
        analytics: {
          total_sessions_hosted: 0,
          total_players_served: 0,
          total_matches_logged: 0,
          average_sitout_variance: 0.0,
          repeat_matchup_rate: 0.0,
          gender_balance_adherence: 100.0,
          dispute_rate: 0.0
        },
        host_tier: 'Novice Host',
        created_at: now
      };
      setCurrentVenue(venue);
      setVenues(prev => [venue!, ...prev.filter(v => v.id !== venue!.id)]);
      if (isCloudConfigured && supabase) {
        supabase.from('venues').insert(venue).then();
      }
      await db.venues.put(venue);
    }

    const newSess: Session = {
      id: `sess-${Date.now()}`,
      venue_id: venue.id,
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

    if (isCloudConfigured && supabase) {
      await supabase.from('sessions').insert(newSess);
    }
  }, [currentVenue]);

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

    const filled = computeFillAllCourts(updatedCourts, checkins, playersMap, matches, session.mode);

    setSession(updatedSess);
    setCourts(filled);

    await db.transaction('rw', db.sessions, db.courts, async () => {
      await db.sessions.put(updatedSess);
      await db.courts.bulkPut(filled);
    });
  }, [courts, session, checkins, playersMap, matches]);

  const recruitPlayerToSession = useCallback(async (playerId: string) => {
    const newCheckin: SessionCheckin = {
      id: `chk-${playerId}`,
      session_id: session.id,
      player_id: playerId,
      games_played_today: 0,
      checked_in_at: new Date().toISOString()
    };

    setCheckins(prev => {
      if ((prev || []).some(c => c?.player_id === playerId)) return prev;
      return [...prev, newCheckin];
    });

    await db.checkins.put(newCheckin);
  }, [session]);

  const removePlayerFromSession = useCallback(async (playerId: string) => {
    setCheckins(prev => (prev || []).filter(c => c?.player_id !== playerId));
    await db.checkins.where('player_id').equals(playerId).delete();
  }, []);

  const createPlayer = useCallback((name: string, age?: number, gender?: Gender): Player => {
    const autoId = `PL-${100 + (players?.length || 0) + 1}`;
    const baseRank = getRankInfo(1);

    const newPlayer: Player = {
      id: autoId,
      venue_id: currentVenue?.id,
      name: (name || '').trim(),
      age: age ? Number(age) : undefined,
      gender: gender || 'Co-ed / Other',
      locked_partner_id: null,

      // Placement fields: starts Provisional
      placement_status: 'provisional',
      placement_matches_played: 0,
      hidden_rating: R0,
      hidden_rd: RD0,
      placement_opponents: [],

      rank_value: baseRank.rankValue,
      tier: baseRank.tier,
      sub_tier: baseRank.subTier,
      rank_name: baseRank.displayName,
      highest_rank_value: baseRank.rankValue,
      highest_rank_name: baseRank.displayName,
      stars: 0,
      current_cp: 0,
      demotion_grace_matches: 3,
      active_promotion_series: null,
      trophies: [],
      dispute_count: 0,
      wins_singles: 0,
      losses_singles: 0,
      wins_doubles: 0,
      losses_doubles: 0,
      created_at: new Date().toISOString()
    };

    setPlayers(prev => [newPlayer, ...prev]);
    db.players.put(newPlayer).catch(console.error);

    if (isCloudConfigured && supabase) {
      supabase.from('players').insert(newPlayer).then();
    }

    return newPlayer;
  }, [players, currentVenue]);

  const createAndRecruitPlayer = useCallback((name: string, age?: number, gender?: Gender): Player => {
    const newPlayer = createPlayer(name, age, gender);
    recruitPlayerToSession(newPlayer.id);
    return newPlayer;
  }, [createPlayer, recruitPlayerToSession]);

  const updatePlayerAvatar = useCallback(async (playerId: string, avatarUrl: string) => {
    let updatedTarget: Player | undefined;
    setPlayers(prev => (prev || []).map(p => {
      if (p.id !== playerId) return p;
      const updated: Player = { ...p, avatar_url: avatarUrl };
      updatedTarget = updated;
      return updated;
    }));

    if (currentPlayer && currentPlayer.id === playerId) {
      setCurrentPlayer(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
    }

    if (updatedTarget) {
      await db.players.put(updatedTarget);
      if (isCloudConfigured && supabase) {
        await supabase.from('players').update({ avatar_url: avatarUrl }).eq('id', playerId);
      }
    }
  }, [currentPlayer]);

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

  const advanceStep = useCallback(async (step: OnboardingStep) => {
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
        session_id: session.id,
        player_id: playerId,
        games_played_today: 0,
        checked_in_at: new Date().toISOString()
      };
      setCheckins(prev => [...prev, newC]);
      await db.checkins.put(newC);
    }
  }, [checkins, session]);

  const checkInAll = useCallback(async () => {
    const existing = new Set((checkins || []).map(c => c.player_id));
    const toAdd = (players || []).filter(p => !existing.has(p.id)).map(p => ({
      id: `chk-${p.id}`,
      session_id: session.id,
      player_id: p.id,
      games_played_today: 0,
      checked_in_at: new Date().toISOString()
    }));
    setCheckins(prev => [...prev, ...toAdd]);
    if (toAdd.length > 0) await db.checkins.bulkPut(toAdd);
  }, [checkins, players, session]);

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

  const applyCompletedMatchState = useCallback(async (
    targetMatch: Match,
    winner: 'teamA' | 'teamB',
    durationSeconds: number = 300
  ) => {
    const isSingles = targetMatch.mode === 'singles';
    const matchSource: MatchSource = targetMatch.match_source || 'session';

    const teamAPlayers = targetMatch.team_a_ids.map(id => {
      const p = playersMap.get(id) || players.find(x => x.id === id);
      const rawRank = p ? p.rank_value : 1;
      return { id, rank_value: rawRank, player: p };
    });

    const teamBPlayers = targetMatch.team_b_ids.map(id => {
      const p = playersMap.get(id) || players.find(x => x.id === id);
      const rawRank = p ? p.rank_value : 1;
      return { id, rank_value: rawRank, player: p };
    });

    const avgRankA = teamAPlayers.reduce((a, b) => a + b.rank_value, 0) / teamAPlayers.length;
    const avgRankB = teamBPlayers.reduce((a, b) => a + b.rank_value, 0) / teamBPlayers.length;

    const playerCPDeltas: Record<string, number> = {};
    const playerStarDeltas: Record<string, number> = {};

    const updatedPlayers = (players || []).map(p => {
      if (!p) return p;
      const inTeamA = targetMatch.team_a_ids.includes(p.id);
      const inTeamB = targetMatch.team_b_ids.includes(p.id);

      if (inTeamA || inTeamB) {
        const isWin = (winner === 'teamA' && inTeamA) || (winner === 'teamB' && inTeamB);
        const opponentAvg = inTeamA ? avgRankB : avgRankA;
        const opponentIds = inTeamA ? targetMatch.team_b_ids : targetMatch.team_a_ids;
        const opponentPlayers = opponentIds.map(oid => playersMap.get(oid) || players.find(x => x.id === oid)!).filter(Boolean);

        let partnerRank: number | null = null;
        let partnerId: string | null = null;
        let partnerPlayer: Player | null = null;
        if (!isSingles) {
          const teammateIds = inTeamA ? targetMatch.team_a_ids : targetMatch.team_b_ids;
          const foundPartnerId = teammateIds.find(x => x !== p.id);
          partnerId = foundPartnerId || null;
          partnerPlayer = foundPartnerId ? (playersMap.get(foundPartnerId) || players.find(x => x.id === foundPartnerId) || null) : null;
          partnerRank = partnerPlayer ? (partnerPlayer.rank_value || 1) : null;
        }

        const { repeatOccurrencesInWindow, dailyPairMatchCount } = evaluateCrossSourceHistory({
          playerId: p.id,
          opponentIds,
          partnerId,
          allHistoricalMatches: matches,
          matchSource
        });

        const adjustment = calculateCPAdjustment({
          isWinner: isWin,
          playerRankValue: p.rank_value || 1,
          opponentAvgRankValue: opponentAvg,
          partnerRankValue: partnerRank,
          repeatOccurrencesInWindow,
          matchSource,
          durationSeconds,
          isSingles,
          dailyPairMatchCount
        });

        if (p.placement_status === 'placed') {
          playerCPDeltas[p.id] = adjustment.cpDelta;
          playerStarDeltas[p.id] = adjustment.starDelta;
        } else {
          playerCPDeltas[p.id] = 0;
          playerStarDeltas[p.id] = 0;
        }

        const updatedP = applyMatchToPlayer(p, adjustment, isWin, {
          partner: partnerPlayer,
          opponents: opponentPlayers,
          isSingles,
        });

        if (isSingles) {
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

    const completed: Match = {
      ...targetMatch,
      status: winner === 'teamA' ? 'teamA_win' : 'teamB_win',
      player_cp_deltas: playerCPDeltas,
      player_star_deltas: playerStarDeltas,
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      time_str: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setPlayers(updatedPlayers);
    setMatches(prev => [completed, ...(prev || [])]);

    if (currentPlayer) {
      const matchedUpdated = updatedPlayers.find(p => p.id === currentPlayer.id);
      if (matchedUpdated) {
        setCurrentPlayer(matchedUpdated);
      }
    }

    await db.transaction('rw', db.players, db.matches, async () => {
      await db.players.bulkPut(updatedPlayers);
      await db.matches.put(completed);
    });

    if (isCloudConfigured && supabase) {
      await supabase.from('players').upsert(updatedPlayers);
      await supabase.from('matches').upsert(completed);
    }
  }, [players, playersMap, matches, currentPlayer]);

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

    await applyCompletedMatchState(targetMatch, winner, 300);

    const involved = [...targetMatch.team_a_ids, ...targetMatch.team_b_ids];
    const updatedCheckins = (checkins || []).map(c => involved.includes(c.player_id)
      ? { ...c, games_played_today: (c.games_played_today || 0) + 1 }
      : c
    );

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

    setCheckins(updatedCheckins);
    await db.courts.bulkPut(updatedCourts);
    await db.checkins.bulkPut(updatedCheckins);
  }, [courts, checkins, applyCompletedMatchState]);

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

  const createPvPMatch = useCallback(async (creatorId: string, partnerId?: string | null, mode: GameMode = 'doubles'): Promise<Match> => {
    const creator = playersMap.get(creatorId);
    if (!creator) throw new Error('Player not found');
    const partner = partnerId ? playersMap.get(partnerId) : null;

    const newMatch = createPvPInvite({ creator, partner, mode });
    setMatches(prev => [newMatch, ...prev]);
    await db.matches.put(newMatch);

    if (isCloudConfigured && supabase) {
      await supabase.from('matches').insert(newMatch);
    }

    return newMatch;
  }, [playersMap]);

  const joinPvPMatch = useCallback(async (matchId: string, opponentId: string, opponentPartnerId?: string | null): Promise<Match | null> => {
    const match = matches.find(m => m.id === matchId) || (await db.matches.get(matchId));
    if (!match || match.status !== 'pending') return null;

    const opponent = playersMap.get(opponentId);
    if (!opponent) return null;
    const oppPartner = opponentPartnerId ? playersMap.get(opponentPartnerId) : null;

    const updatedMatch = acceptPvPInvite(match, opponent, oppPartner);
    setMatches(prev => prev.map(m => m.id === matchId ? updatedMatch : m));
    await db.matches.put(updatedMatch);

    if (isCloudConfigured && supabase) {
      await supabase.from('matches').upsert(updatedMatch);
    }

    return updatedMatch;
  }, [matches, playersMap]);

  const submitPvPScore = useCallback(async (
    matchId: string,
    playerId: string,
    teamAScore: number,
    teamBScore: number
  ) => {
    const match = matches.find(m => m.id === matchId) || (await db.matches.get(matchId));
    if (!match) return;

    const submissions = {
      ...(match.score_submissions || {}),
      [playerId]: {
        player_id: playerId,
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        submitted_at: new Date().toISOString()
      }
    };

    const updatedMatch: Match = {
      ...match,
      score_submissions: submissions
    };

    const resolution = evaluateScoreSubmissions(updatedMatch);

    if (resolution.isDisputed) {
      updatedMatch.status = 'disputed';
      setMatches(prev => prev.map(m => m.id === matchId ? updatedMatch : m));
      await db.matches.put(updatedMatch);

      const allInvolved = [...match.team_a_ids, ...match.team_b_ids];
      const updatedPlayers = players.map(p => 
        allInvolved.includes(p.id) ? { ...p, dispute_count: (p.dispute_count || 0) + 1 } : p
      );
      setPlayers(updatedPlayers);
      await db.players.bulkPut(updatedPlayers);

      if (isCloudConfigured && supabase) {
        await supabase.from('matches').upsert(updatedMatch);
        await supabase.from('players').upsert(updatedPlayers);
      }
    } else if (resolution.isResolved && resolution.winner) {
      const started = match.started_at ? new Date(match.started_at).getTime() : Date.now() - 300000;
      const durationSec = Math.max(1, Math.round((Date.now() - started) / 1000));
      
      await applyCompletedMatchState(updatedMatch, resolution.winner, durationSec);
    } else {
      setMatches(prev => prev.map(m => m.id === matchId ? updatedMatch : m));
      await db.matches.put(updatedMatch);
    }
  }, [matches, players, applyCompletedMatchState]);

  const finalizeSessionPodium = useCallback(async (
    firstPlaceId: string,
    _secondPlaceId?: string,
    _thirdPlaceId?: string
  ) => {
    const now = new Date().toISOString();
    const venueName = currentVenue?.name || session.name || 'Open Play';

    const updatedPlayers = players.map(p => {
      if (p.id === firstPlaceId) {
        const newStars = Math.min(5, (p.stars || 0) + 1);
        const trophy: SessionChampionTrophy = {
          id: `trophy-${Date.now()}`,
          venue_id: currentVenue?.id,
          venue_name: venueName,
          session_name: session.name,
          session_date: session.created_at,
          mode: session.mode,
          placement: 1,
          win_rate: 100,
          total_wins: (p.wins_doubles || 0) + (p.wins_singles || 0),
          awarded_at: now
        };

        return {
          ...p,
          stars: newStars,
          trophies: [trophy, ...(p.trophies || [])]
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    await db.players.bulkPut(updatedPlayers);

    if (currentVenue) {
      const totalSessions = (currentVenue.analytics?.total_sessions_hosted || 0) + 1;
      const totalPlayers = (currentVenue.analytics?.total_players_served || 0) + checkins.length;
      const totalMatches = (currentVenue.analytics?.total_matches_logged || 0) + matches.length;

      const newAnalytics = {
        total_sessions_hosted: totalSessions,
        total_players_served: totalPlayers,
        total_matches_logged: totalMatches,
        average_sitout_variance: 0.8,
        repeat_matchup_rate: 4.2,
        gender_balance_adherence: 96.5,
        dispute_rate: 0.0
      };

      const updatedVenue: Venue = {
        ...currentVenue,
        analytics: newAnalytics,
        host_tier: calculateHostTier(newAnalytics)
      };

      setCurrentVenue(updatedVenue);
      setVenues(prev => prev.map(v => v.id === updatedVenue.id ? updatedVenue : v));
      await db.venues.put(updatedVenue);

      if (isCloudConfigured && supabase) {
        await supabase.from('venues').upsert(updatedVenue);
      }
    }

    if (isCloudConfigured && supabase) {
      await supabase.from('players').upsert(updatedPlayers);
    }
  }, [players, currentVenue, session, checkins, matches]);

  const clearAllData = useCallback(async () => {
    const initialCourts = getInitialCourts(currentVenue?.settings?.default_courts || 4);
    const resetSess: Session = {
      id: `sess-${Date.now()}`,
      venue_id: currentVenue?.id,
      name: currentVenue ? `${currentVenue.name} Session` : 'Friday Night Open',
      court_count: currentVenue?.settings?.default_courts || 4,
      mode: currentVenue?.settings?.default_mode || 'doubles',
      active_players_per_court: (currentVenue?.settings?.default_mode || 'doubles') === 'singles' ? 2 : 4,
      queue_players_per_court: currentVenue?.settings?.queue_capacity_per_court || 12,
      total_session_capacity: (currentVenue?.settings?.default_courts || 4) * (currentVenue?.settings?.queue_capacity_per_court || 12),
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      onboarding_step: 'gate_select',
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
  }, [currentVenue]);

  // STRICT AUTH: LOGIN HANDLER (Blocks unregistered accounts & rejects wrong passwords)
  const login = useCallback(async (emailOrUsername: string, password: string, role: UserRole) => {
    const identifier = emailOrUsername.trim();
    if (!identifier) {
      throw new Error('Please enter your email or username.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    if (isCloudConfigured && supabase) {
      const email = identifier.includes('@') 
        ? identifier 
        : `${identifier.toLowerCase().replace(/\s+/g, '')}@pikol.app`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid grant') || error.message.toLowerCase().includes('user not found')) {
          throw new Error('Invalid email/username or password. Please check your credentials or click "CREATE NEW ACCOUNT".');
        }
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Authentication failed. No user found.');
      }

      const userId = data.user.id;
      if (role === 'player') {
        let p = players.find(x => x.user_id === userId || x.email?.toLowerCase() === email.toLowerCase());
        if (!p) {
          const { data: dbP } = await supabase.from('players').select('*').eq('user_id', userId).maybeSingle();
          p = dbP;
        }
        if (!p) {
          const displayName = data.user?.user_metadata?.displayName || identifier.split('@')[0];
          p = createPlayer(displayName);
          p.user_id = userId;
          p.email = email;
          await supabase.from('players').upsert(p);
        }
        handleSetCurrentPlayer(p);
      } else {
        let { data: oData } = await supabase.from('venue_owners').select('*').eq('user_id', userId).maybeSingle();
        if (!oData) {
          const newOwner = {
            id: `owner-${Date.now()}`,
            user_id: userId,
            email: email,
            name: data.user?.user_metadata?.displayName || 'Venue Director',
            created_at: new Date().toISOString()
          };
          await supabase.from('venue_owners').insert(newOwner);
        }
      }
    } else {
      // STRICT LOCAL / OFFLINE AUTH
      if (role === 'player') {
        const matched = players.find(p => 
          (p.email && p.email.toLowerCase() === identifier.toLowerCase()) ||
          (p.name && p.name.toLowerCase() === identifier.toLowerCase()) ||
          (p.id && p.id.toLowerCase() === identifier.toLowerCase())
        );

        if (!matched) {
          throw new Error(`Account "${identifier}" not found. Please click "CREATE NEW ACCOUNT" below to register.`);
        }

        if (!matched.password) {
          throw new Error('Account has no registered password. Please click "CREATE NEW ACCOUNT" to register your profile.');
        }

        if (matched.password !== password) {
          throw new Error('Incorrect password. Please try again.');
        }

        localStorage.setItem('pikol_local_session_active', 'true');
        handleSetCurrentPlayer(matched);
      } else {
        const savedOwnerPass = localStorage.getItem('pikol_local_owner_password');
        const savedOwnerEmail = localStorage.getItem('pikol_local_owner_email') || 'owner@pikol.app';

        if (!savedOwnerPass) {
          throw new Error('No Court Owner account registered locally. Please click "CREATE NEW ACCOUNT" first.');
        }

        if (savedOwnerPass !== password || identifier.toLowerCase() !== savedOwnerEmail.toLowerCase()) {
          throw new Error('Invalid Court Owner credentials. Please check your email and password.');
        }

        localStorage.setItem('pikol_local_session_active', 'true');
      }
    }

    handleSetActiveRole(role);
    setSession(prev => ({
      ...prev,
      onboarding_step: role === 'player' ? 'player_home' : 'session_gate'
    }));
  }, [players, createPlayer, handleSetActiveRole, handleSetCurrentPlayer]);

  // STRICT AUTH: SIGNUP HANDLER (Creates genuine account in Supabase / Local DB)
  const signup = useCallback(async (params: {
    email: string;
    password: string;
    role: UserRole;
    displayName: string;
    age?: number;
    gender?: Gender;
  }) => {
    const { email, password, role, displayName, age, gender } = params;
    const cleanEmail = email.trim();
    const cleanName = displayName.trim();

    if (!cleanName) throw new Error('Please enter a display name.');
    if (!cleanEmail) throw new Error('Please enter an email address.');
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const formattedEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail.toLowerCase().replace(/\s+/g, '')}@pikol.app`;

    if (isCloudConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: formattedEmail,
        password,
        options: {
          data: { displayName: cleanName, role }
        }
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          throw new Error('An account with this email already exists. Please log in instead.');
        }
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Sign up failed. Please try again.');
      }

      if (role === 'player') {
        const newP = createPlayer(cleanName, age, gender);
        newP.user_id = data.user.id;
        newP.email = formattedEmail;
        newP.password = password;
        handleSetCurrentPlayer(newP);
        await supabase.from('players').upsert(newP);
      } else {
        const newOwner = {
          id: `owner-${Date.now()}`,
          user_id: data.user.id,
          email: formattedEmail,
          name: cleanName,
          created_at: new Date().toISOString()
        };
        await supabase.from('venue_owners').insert(newOwner);
      }
    } else {
      // STRICT LOCAL SIGNUP
      if (role === 'player') {
        const exists = players.some(p => 
          (p.email && p.email.toLowerCase() === formattedEmail.toLowerCase()) ||
          (p.name && p.name.toLowerCase() === cleanName.toLowerCase())
        );

        if (exists) {
          throw new Error(`An account named "${cleanName}" or with this email already exists. Please log in.`);
        }

        const newP = createPlayer(cleanName, age, gender);
        newP.email = formattedEmail;
        newP.password = password;
        
        setPlayers(prev => [newP, ...prev.filter(x => x.id !== newP.id)]);
        await db.players.put(newP);
        localStorage.setItem('pikol_local_session_active', 'true');
        handleSetCurrentPlayer(newP);
      } else {
        localStorage.setItem('pikol_local_owner_email', formattedEmail);
        localStorage.setItem('pikol_local_owner_password', password);
        localStorage.setItem('pikol_local_session_active', 'true');
      }
    }

    handleSetActiveRole(role);
    setSession(prev => ({
      ...prev,
      onboarding_step: role === 'player' ? 'player_home' : 'session_gate'
    }));
  }, [players, createPlayer, handleSetActiveRole, handleSetCurrentPlayer]);

  // AUTH: LOGOUT HANDLER (Thoroughly clears all session tokens)
  const logout = useCallback(async () => {
    if (isCloudConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    localStorage.removeItem('pikol_active_role');
    localStorage.removeItem('pikol_current_player_id');
    localStorage.removeItem('pikol_local_session_active');
    handleSetActiveRole(null);
    handleSetCurrentPlayer(null);
    setSession(prev => ({
      ...prev,
      onboarding_step: 'gate_select',
      is_active: false
    }));
  }, [handleSetActiveRole, handleSetCurrentPlayer]);

  return (
    <OpenPlayContext.Provider value={{
      activeRole,
      setActiveRole: handleSetActiveRole,
      currentPlayer,
      setCurrentPlayer: handleSetCurrentPlayer,
      venues,
      currentVenue,
      players,
      playersMap,
      session,
      checkins,
      courts,
      matches,
      isLoaded,
      hasExistingSession,
      selectedPlayerId,
      isCloudReady: isCloudConfigured,
      setSelectedPlayerId,
      selectVenue,
      createVenue,
      deleteVenue,
      leaveVenue,
      continueExistingSession,
      startNewSession,
      setupSession,
      setCourtCount,
      recruitPlayerToSession,
      removePlayerFromSession,
      createPlayer,
      createAndRecruitPlayer,
      updatePlayerAvatar,
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
      clearAllData,
      createPvPMatch,
      joinPvPMatch,
      submitPvPScore,
      finalizeSessionPodium,
      login,
      signup,
      logout
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
