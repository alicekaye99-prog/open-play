import { Player, PlacementOpponentRecord } from '../types/pickleball';

export const PLACEMENT_MATCHES_REQUIRED = 5;
export const MAX_MATCHES_VS_SAME_OPPONENT = 2;

export const R0 = 1500;
export const RD0 = 350;
export const RD_MIN = 100;
export const ESTABLISHED_RD = 100;

export const RATING_FLOOR = 600; // maps to bottom of Wood III
export const BAND_WIDTH = 100; // rating points per tier
export const STAR_WIDTH = 20; // 20 rating points per star

const Q = Math.log(10) / 400; // ≈ 0.00575646

export function g(rd: number): number {
  return 1 / Math.sqrt(1 + (3 * Math.pow(Q, 2) * Math.pow(rd, 2)) / Math.pow(Math.PI, 2));
}

export function expectedScore(r: number, rOpp: number, rdOpp: number): number {
  return 1 / (1 + Math.pow(10, (-g(rdOpp) * (r - rOpp)) / 400));
}

export function getPlayerEffectiveRatingAndRD(player: Player): { r: number; rd: number } {
  if (player.placement_status === 'provisional') {
    return {
      r: player.hidden_rating ?? R0,
      rd: player.hidden_rd ?? RD0,
    };
  }

  // Established placed player: map tier midpoint + stars
  const tierLow = RATING_FLOOR + ((player.rank_value || 1) - 1) * BAND_WIDTH;
  const stars = Math.min(5, Math.max(0, player.stars || 0));
  const r = tierLow + (stars * STAR_WIDTH) + (STAR_WIDTH / 2);
  return {
    r,
    rd: ESTABLISHED_RD,
  };
}

export function singleGlickoUpdate(
  r: number,
  rd: number,
  rOpp: number,
  rdOpp: number,
  score: 0 | 1
): { r: number; rd: number } {
  const gOpp = g(rdOpp);
  const e = expectedScore(r, rOpp, rdOpp);
  const dSquared = 1 / (Math.pow(Q, 2) * Math.pow(gOpp, 2) * e * (1 - e));
  const newR = r + (Q / (1 / Math.pow(rd, 2) + 1 / dSquared)) * gOpp * (score - e);
  const newRd = Math.max(RD_MIN, Math.sqrt(1 / (1 / Math.pow(rd, 2) + 1 / dSquared)));
  return { r: newR, rd: newRd };
}

export function ratingToPlacementLadder(r: number): { rankValue: number; stars: number } {
  const clampedTier = Math.max(1, Math.min(19, Math.floor((r - RATING_FLOOR) / BAND_WIDTH) + 1));
  const tierLow = RATING_FLOOR + (clampedTier - 1) * BAND_WIDTH;
  const clampedStars = Math.max(0, Math.min(5, Math.floor((r - tierLow) / STAR_WIDTH)));
  return { rankValue: clampedTier, stars: clampedStars };
}

export function checkPlacementDiversity(
  player: Player,
  opponentIds: string[]
): {
  isEligibleForPlacementCount: boolean;
  updatedOpponents: PlacementOpponentRecord[];
} {
  const currentOpponents = [...(player.placement_opponents || [])];
  let exceedsDiversityLimit = false;

  for (const oppId of opponentIds) {
    const record = currentOpponents.find(o => o.opponent_id === oppId);
    if (record && record.count >= MAX_MATCHES_VS_SAME_OPPONENT) {
      exceedsDiversityLimit = true;
      break;
    }
  }

  const updatedOpponents = currentOpponents.map(o => ({ ...o }));
  if (!exceedsDiversityLimit) {
    for (const oppId of opponentIds) {
      const idx = updatedOpponents.findIndex(o => o.opponent_id === oppId);
      if (idx >= 0) {
        updatedOpponents[idx].count += 1;
      } else {
        updatedOpponents.push({ opponent_id: oppId, count: 1 });
      }
    }
  }

  return {
    isEligibleForPlacementCount: !exceedsDiversityLimit,
    updatedOpponents,
  };
}

export function calculatePlacementMatchUpdate(params: {
  player: Player;
  partner?: Player | null;
  opponents: Player[];
  isWinner: boolean;
  isEligibleForPlacementCount: boolean;
}): {
  updatedRating: number;
  updatedRD: number;
  matchesPlayed: number;
  placedRankValue?: number;
  placedStars?: number;
  isNowPlaced: boolean;
} {
  const { player, partner, opponents, isWinner, isEligibleForPlacementCount } = params;
  const score: 0 | 1 = isWinner ? 1 : 0;

  const currentR = player.hidden_rating ?? R0;
  const currentRD = player.hidden_rd ?? RD0;

  if (!isEligibleForPlacementCount) {
    return {
      updatedRating: currentR,
      updatedRD: currentRD,
      matchesPlayed: player.placement_matches_played || 0,
      isNowPlaced: false,
    };
  }

  let finalR = currentR;
  let finalRD = currentRD;

  if (opponents.length === 1 && !partner) {
    // 1v1 Singles Placement
    const oppStats = getPlayerEffectiveRatingAndRD(opponents[0]);
    const updated = singleGlickoUpdate(currentR, currentRD, oppStats.r, oppStats.rd, score);
    finalR = updated.r;
    finalRD = updated.rd;
  } else {
    // Doubles Adaptation
    const p1Stats = { r: currentR, rd: currentRD };
    const p2Stats = partner ? getPlayerEffectiveRatingAndRD(partner) : { r: R0, rd: RD0 };

    const rTeam = (p1Stats.r + p2Stats.r) / 2;
    const rdTeam = Math.sqrt((Math.pow(p1Stats.rd, 2) + Math.pow(p2Stats.rd, 2)) / 2);

    const oppStatsList = opponents.map(o => getPlayerEffectiveRatingAndRD(o));
    const rOppTeam = oppStatsList.reduce((acc, o) => acc + o.r, 0) / Math.max(1, oppStatsList.length);
    const rdOppTeam = Math.sqrt(
      oppStatsList.reduce((acc, o) => acc + Math.pow(o.rd, 2), 0) / Math.max(1, oppStatsList.length)
    );

    const teamUpdated = singleGlickoUpdate(rTeam, rdTeam, rOppTeam, rdOppTeam, score);
    const deltaRTeam = teamUpdated.r - rTeam;

    const rdP1Sq = Math.pow(p1Stats.rd, 2);
    const rdP2Sq = Math.pow(p2Stats.rd, 2);
    const sumRdSq = Math.max(1, rdP1Sq + rdP2Sq);

    const deltaRP1 = deltaRTeam * (rdP1Sq / sumRdSq);
    finalR = currentR + deltaRP1;

    const singleUpdateForRD = singleGlickoUpdate(currentR, currentRD, rOppTeam, rdOppTeam, score);
    finalRD = singleUpdateForRD.rd;
  }

  const nextMatchesPlayed = (player.placement_matches_played || 0) + 1;
  const isNowPlaced = nextMatchesPlayed >= PLACEMENT_MATCHES_REQUIRED;

  let placedRankValue: number | undefined;
  let placedStars: number | undefined;

  if (isNowPlaced) {
    const placementResult = ratingToPlacementLadder(finalR);
    placedRankValue = placementResult.rankValue;
    placedStars = placementResult.stars;
  }

  return {
    updatedRating: finalR,
    updatedRD: finalRD,
    matchesPlayed: nextMatchesPlayed,
    placedRankValue,
    placedStars,
    isNowPlaced,
  };
}
