import { Tier, SubTier, RankTier, Player, Match, MatchSource, HostTier, VenueAnalytics } from '../types/pickleball';
import { 
  checkPlacementDiversity, 
  calculatePlacementMatchUpdate 
} from './placement';

export const UNIFORM_STARTING_MMR = 800;
export const BASE_CP_WIN = 20;
export const BASE_CP_LOSS = 20;
export const PARTNER_GAP_THRESHOLD = 4;
export const PVP_HIGH_RANK_GAP_THRESHOLD = 6;
export const ROLLING_WINDOW_MATCHES = 5;
export const DAILY_PAIR_PVP_LIMIT = 3;

export interface RankInfo {
  rankValue: number;
  tier: Tier;
  subTier: SubTier;
  displayName: RankTier;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

export const RANK_LADDER: RankInfo[] = [
  { rankValue: 1, tier: 'wood', subTier: 'III', displayName: 'Wood III', badgeBg: 'bg-amber-950/70', textColor: 'text-amber-400', borderColor: 'border-amber-800' },
  { rankValue: 2, tier: 'wood', subTier: 'II', displayName: 'Wood II', badgeBg: 'bg-amber-950/70', textColor: 'text-amber-400', borderColor: 'border-amber-800' },
  { rankValue: 3, tier: 'wood', subTier: 'I', displayName: 'Wood I', badgeBg: 'bg-amber-950/70', textColor: 'text-amber-400', borderColor: 'border-amber-800' },
  { rankValue: 4, tier: 'bronze', subTier: 'III', displayName: 'Bronze III', badgeBg: 'bg-amber-900/50', textColor: 'text-amber-300', borderColor: 'border-amber-600' },
  { rankValue: 5, tier: 'bronze', subTier: 'II', displayName: 'Bronze II', badgeBg: 'bg-amber-900/50', textColor: 'text-amber-300', borderColor: 'border-amber-600' },
  { rankValue: 6, tier: 'bronze', subTier: 'I', displayName: 'Bronze I', badgeBg: 'bg-amber-900/50', textColor: 'text-amber-300', borderColor: 'border-amber-600' },
  { rankValue: 7, tier: 'silver', subTier: 'III', displayName: 'Silver III', badgeBg: 'bg-slate-800', textColor: 'text-slate-200', borderColor: 'border-slate-500' },
  { rankValue: 8, tier: 'silver', subTier: 'II', displayName: 'Silver II', badgeBg: 'bg-slate-800', textColor: 'text-slate-200', borderColor: 'border-slate-500' },
  { rankValue: 9, tier: 'silver', subTier: 'I', displayName: 'Silver I', badgeBg: 'bg-slate-800', textColor: 'text-slate-200', borderColor: 'border-slate-500' },
  { rankValue: 10, tier: 'gold', subTier: 'III', displayName: 'Gold III', badgeBg: 'bg-yellow-500/20', textColor: 'text-yellow-300', borderColor: 'border-yellow-500' },
  { rankValue: 11, tier: 'gold', subTier: 'II', displayName: 'Gold II', badgeBg: 'bg-yellow-500/20', textColor: 'text-yellow-300', borderColor: 'border-yellow-500' },
  { rankValue: 12, tier: 'gold', subTier: 'I', displayName: 'Gold I', badgeBg: 'bg-yellow-500/20', textColor: 'text-yellow-300', borderColor: 'border-yellow-500' },
  { rankValue: 13, tier: 'platinum', subTier: 'III', displayName: 'Platinum III', badgeBg: 'bg-teal-500/20', textColor: 'text-teal-300', borderColor: 'border-teal-400' },
  { rankValue: 14, tier: 'platinum', subTier: 'II', displayName: 'Platinum II', badgeBg: 'bg-teal-500/20', textColor: 'text-teal-300', borderColor: 'border-teal-400' },
  { rankValue: 15, tier: 'platinum', subTier: 'I', displayName: 'Platinum I', badgeBg: 'bg-teal-500/20', textColor: 'text-teal-300', borderColor: 'border-teal-400' },
  { rankValue: 16, tier: 'diamond', subTier: 'III', displayName: 'Diamond III', badgeBg: 'bg-purple-500/20', textColor: 'text-purple-300', borderColor: 'border-purple-400' },
  { rankValue: 17, tier: 'diamond', subTier: 'II', displayName: 'Diamond II', badgeBg: 'bg-purple-500/20', textColor: 'text-purple-300', borderColor: 'border-purple-400' },
  { rankValue: 18, tier: 'diamond', subTier: 'I', displayName: 'Diamond I', badgeBg: 'bg-purple-500/20', textColor: 'text-purple-300', borderColor: 'border-purple-400' },
  { rankValue: 19, tier: 'master', subTier: 'none', displayName: 'Master', badgeBg: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30', textColor: 'text-yellow-200 font-extrabold', borderColor: 'border-yellow-300' },
];

export function getRankInfo(rankValue: number): RankInfo {
  const clamped = Math.max(1, Math.min(19, rankValue || 1));
  return RANK_LADDER.find(r => r.rankValue === clamped) || RANK_LADDER[0];
}

export function getTierFromMMR(rankValueOrCP: number): RankTier {
  return getRankInfo(rankValueOrCP).displayName;
}

export function evaluateCrossSourceHistory(params: {
  playerId: string;
  opponentIds: string[];
  partnerId?: string | null;
  allHistoricalMatches: Match[];
  matchSource: MatchSource;
}): {
  repeatOccurrencesInWindow: number;
  dailyPairMatchCount: number;
} {
  const { playerId, opponentIds, partnerId, allHistoricalMatches } = params;
  
  const playerMatches = (allHistoricalMatches || [])
    .filter(m => (m.status === 'teamA_win' || m.status === 'teamB_win' || m.status === 'confirmed'))
    .filter(m => (m.team_a_ids || []).includes(playerId) || (m.team_b_ids || []).includes(playerId))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const rollingWindow = playerMatches.slice(0, ROLLING_WINDOW_MATCHES);
  let repeatOccurrencesInWindow = 0;

  for (const m of rollingWindow) {
    const oppsInMatch = m.team_a_ids.includes(playerId) ? m.team_b_ids : m.team_a_ids;
    const partnerInMatch = (m.team_a_ids.includes(playerId) ? m.team_a_ids : m.team_b_ids).find(id => id !== playerId);

    if (partnerId && partnerInMatch === partnerId) {
      repeatOccurrencesInWindow++;
    }
    for (const opp of opponentIds) {
      if (oppsInMatch.includes(opp)) {
        repeatOccurrencesInWindow++;
      }
    }
  }

  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const pvpMatchesLast24h = playerMatches.filter(m => 
    m.match_source === 'pvp_invite' && 
    new Date(m.created_at).getTime() >= oneDayAgo
  );

  let dailyPairMatchCount = 0;
  for (const m of pvpMatchesLast24h) {
    const oppsInMatch = m.team_a_ids.includes(playerId) ? m.team_b_ids : m.team_a_ids;
    const sharesOpponent = opponentIds.some(id => oppsInMatch.includes(id));
    if (sharesOpponent) {
      dailyPairMatchCount++;
    }
  }

  return { repeatOccurrencesInWindow, dailyPairMatchCount };
}

export interface CPAdjustment {
  cpDelta: number;
  starDelta: number;
  decayApplied: number;
  isCappedByDailyLimit: boolean;
  isZeroedByDurationFloor: boolean;
}

export function calculateCPAdjustment(params: {
  isWinner: boolean;
  playerRankValue: number;
  opponentAvgRankValue: number;
  partnerRankValue?: number | null;
  repeatOccurrencesInWindow: number;
  matchSource: MatchSource;
  durationSeconds?: number;
  isSingles: boolean;
  dailyPairMatchCount?: number;
}): CPAdjustment {
  const {
    isWinner,
    playerRankValue,
    opponentAvgRankValue,
    partnerRankValue,
    repeatOccurrencesInWindow,
    matchSource,
    durationSeconds = 300,
    isSingles,
    dailyPairMatchCount = 0
  } = params;

  const minDuration = isSingles ? 180 : 240;
  const isZeroedByDurationFloor = durationSeconds < minDuration;
  if (isZeroedByDurationFloor) {
    return {
      cpDelta: 0,
      starDelta: 0,
      decayApplied: 0,
      isCappedByDailyLimit: false,
      isZeroedByDurationFloor: true
    };
  }

  const isCappedByDailyLimit = matchSource === 'pvp_invite' && dailyPairMatchCount >= DAILY_PAIR_PVP_LIMIT;
  if (isCappedByDailyLimit) {
    return {
      cpDelta: 0,
      starDelta: 0,
      decayApplied: 0,
      isCappedByDailyLimit: true,
      isZeroedByDurationFloor: false
    };
  }

  const rankGap = playerRankValue - opponentAvgRankValue;
  let baseCP = 20;

  if (isWinner) {
    if (rankGap > 0) {
      baseCP = Math.max(5, BASE_CP_WIN - (rankGap * 2));
    } else {
      baseCP = Math.min(50, BASE_CP_WIN + (Math.abs(rankGap) * 3));
    }
  } else {
    if (rankGap > 0) {
      baseCP = Math.min(50, BASE_CP_LOSS + (rankGap * 3));
    } else {
      baseCP = Math.max(5, BASE_CP_LOSS - (Math.abs(rankGap) * 2));
    }
  }

  let multiplier = 1.0;

  if (isWinner && partnerRankValue) {
    const partnerGap = playerRankValue - partnerRankValue;
    if (partnerGap >= PARTNER_GAP_THRESHOLD) {
      multiplier *= 0.50;
    }
  }

  if (matchSource === 'pvp_invite' && Math.abs(rankGap) >= PVP_HIGH_RANK_GAP_THRESHOLD) {
    multiplier *= 0.50;
  }

  if (repeatOccurrencesInWindow > 0) {
    const decay = Math.max(0.25, 1.0 - (repeatOccurrencesInWindow * 0.20));
    multiplier *= decay;
  }

  const finalCPDelta = Math.max(1, Math.round(baseCP * multiplier));
  const baseRef = isWinner ? BASE_CP_WIN : BASE_CP_LOSS;
  const starDelta = Math.max(1, Math.round(finalCPDelta / baseRef));

  return {
    cpDelta: isWinner ? finalCPDelta : -finalCPDelta,
    starDelta: isWinner ? starDelta : -starDelta,
    decayApplied: multiplier,
    isCappedByDailyLimit: false,
    isZeroedByDurationFloor: false
  };
}

export function applyMatchToPlayer(
  player: Player,
  adjustment: CPAdjustment,
  isWinner: boolean,
  matchContext?: {
    partner?: Player | null;
    opponents: Player[];
    isSingles: boolean;
  }
): Player {
  // 1. PROVISIONAL PLAYER PLACEMENT FLOW
  if (player.placement_status === 'provisional') {
    const partner = matchContext?.partner || null;
    const opponents = matchContext?.opponents || [];

    const isDurationFloorViolated = adjustment.isZeroedByDurationFloor;
    const diversityResult = checkPlacementDiversity(player, opponents.map(o => o.id));
    const isEligible = !isDurationFloorViolated && diversityResult.isEligibleForPlacementCount;

    const placementUpdate = calculatePlacementMatchUpdate({
      player,
      partner,
      opponents,
      isWinner,
      isEligibleForPlacementCount: isEligible
    });

    if (placementUpdate.isNowPlaced && placementUpdate.placedRankValue !== undefined) {
      const placedRankInfo = getRankInfo(placementUpdate.placedRankValue);
      const initialStars = placementUpdate.placedStars ?? 0;

      let series = null;
      if (initialStars >= 5 && placedRankInfo.rankValue < 19) {
        const nextRank = getRankInfo(placedRankInfo.rankValue + 1);
        series = {
          targetRankValue: nextRank.rankValue,
          targetRankName: nextRank.displayName,
          wins: 0,
          losses: 0,
          isComplete: false,
          isSuccess: false,
        };
      }

      return {
        ...player,
        placement_status: 'placed',
        placement_matches_played: 5,
        hidden_rating: placementUpdate.updatedRating,
        hidden_rd: placementUpdate.updatedRD,
        placement_opponents: diversityResult.updatedOpponents,
        rank_value: placedRankInfo.rankValue,
        tier: placedRankInfo.tier,
        sub_tier: placedRankInfo.subTier,
        rank_name: placedRankInfo.displayName,
        highest_rank_value: placedRankInfo.rankValue,
        highest_rank_name: placedRankInfo.displayName,
        stars: initialStars,
        current_cp: 0,
        demotion_grace_matches: 3,
        active_promotion_series: series,
        last_played_at: new Date().toISOString(),
      };
    }

    return {
      ...player,
      placement_status: 'provisional',
      placement_matches_played: placementUpdate.matchesPlayed,
      hidden_rating: placementUpdate.updatedRating,
      hidden_rd: placementUpdate.updatedRD,
      placement_opponents: diversityResult.updatedOpponents,
      last_played_at: new Date().toISOString(),
    };
  }

  // 2. PLACED PLAYER STANDARD CP/STAR FLOW
  let newStars = player.stars ?? 0;
  let newRankValue = player.rank_value || 1;
  let graceRemaining = player.demotion_grace_matches ?? 0;
  let activeSeries = player.active_promotion_series || null;

  const currentCP = Math.max(0, (player.current_cp ?? 0) + adjustment.cpDelta);

  if (graceRemaining > 0) {
    graceRemaining -= 1;
  }

  if (activeSeries && !activeSeries.isComplete) {
    const wins = activeSeries.wins + (isWinner ? 1 : 0);
    const losses = activeSeries.losses + (isWinner ? 0 : 1);
    const isComplete = wins >= 2 || losses >= 2;
    const isSuccess = wins >= 2;

    if (isComplete) {
      if (isSuccess) {
        newRankValue = activeSeries.targetRankValue;
        newStars = 0;
        graceRemaining = 3;
        activeSeries = null;
      } else {
        newStars = 3;
        activeSeries = null;
      }
    } else {
      activeSeries = { ...activeSeries, wins, losses, isComplete: false, isSuccess: false };
    }
  } else {
    if (isWinner) {
      newStars = Math.min(5, (player.stars ?? 0) + adjustment.starDelta);

      if (newStars >= 5 && newRankValue < 19) {
        const nextRank = getRankInfo(newRankValue + 1);
        activeSeries = {
          targetRankValue: nextRank.rankValue,
          targetRankName: nextRank.displayName,
          wins: 0,
          losses: 0,
          isComplete: false,
          isSuccess: false,
        };
      }
    } else {
      if (newStars > 0) {
        newStars = Math.max(0, newStars + adjustment.starDelta);
      } else {
        const softFloor = newRankValue === 19 ? 18 : 1;
        const canDemote = newRankValue > softFloor && graceRemaining <= 0;

        if (canDemote) {
          newRankValue = newRankValue - 1;
          newStars = 2;
        } else {
          newStars = 0;
        }
      }
    }
  }

  const rankInfo = getRankInfo(newRankValue);
  const highestRankValue = Math.max(player.highest_rank_value || player.rank_value || 1, newRankValue);
  const highestRankInfo = getRankInfo(highestRankValue);

  return {
    ...player,
    rank_value: rankInfo.rankValue,
    tier: rankInfo.tier,
    sub_tier: rankInfo.subTier,
    rank_name: rankInfo.displayName,
    highest_rank_value: highestRankValue,
    highest_rank_name: highestRankInfo.displayName,
    stars: newStars,
    current_cp: currentCP,
    demotion_grace_matches: graceRemaining,
    active_promotion_series: activeSeries,
    last_played_at: new Date().toISOString(),
  };
}

export function calculateHostTier(analytics: VenueAnalytics): HostTier {
  const { total_sessions_hosted: s, total_players_served: p, dispute_rate: d, average_sitout_variance: v } = analytics;

  if (s >= 75 && p >= 750 && d <= 0.01 && v <= 1.0) return 'Diamond Host';
  if (s >= 35 && p >= 300 && d <= 0.02 && v <= 1.5) return 'Platinum Host';
  if (s >= 15 && p >= 120 && d <= 0.03 && v <= 2.0) return 'Gold Host';
  if (s >= 5 && p >= 40 && d <= 0.05 && v <= 2.5) return 'Silver Host';
  if (s >= 1 && p >= 8) return 'Bronze Host';
  return 'Novice Host';
}
