import { Tier, SubTier, RankTier, Player, PromotionSeries } from '../types/pickleball';

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

export const BASE_CP_WIN = 20;
export const BASE_CP_LOSS = 20;
export const PARTNER_GAP_THRESHOLD = 4;

export interface CPAdjustment {
  cpDelta: number;
  starDelta: number;
  decayApplied: number;
}

export function calculateCPAdjustment(params: {
  isWinner: boolean;
  playerRankValue: number;
  opponentAvgRankValue: number;
  partnerRankValue?: number | null;
  repeatOccurrencesInWindow: number;
}): CPAdjustment {
  const { isWinner, playerRankValue, opponentAvgRankValue, partnerRankValue, repeatOccurrencesInWindow } = params;
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
      multiplier *= 0.5;
    }
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
  };
}

export function applyMatchToPlayer(
  player: Player,
  adjustment: CPAdjustment,
  isWinner: boolean
): Player {
  let newStars = player.stars ?? 0;
  let newRankValue = player.rank_value || 1;
  let graceRemaining = player.demotion_grace_matches ?? 0;
  let activeSeries = player.active_promotion_series || null;

  const currentCP = Math.max(0, (player.current_cp ?? 0) + adjustment.cpDelta);

  if (graceRemaining > 0) {
    graceRemaining -= 1;
  }

  // Promotion Bo3 Handling
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
