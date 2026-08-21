import { GameMode, Player, SessionCheckin, Match } from '../types/pickleball';

// =========================================================================
// PADDLE STACKING & OPPONENT LOOKBACK MATRIX
// =========================================================================

interface PairHistory {
  timesAsOpponents: number;
  timesAsTeammates: number;
  wasSameMatchLastTime: boolean;
}

function getPairHistory(pAId: string, pBId: string, recentMatches: Match[]): PairHistory {
  let timesAsOpponents = 0;
  let timesAsTeammates = 0;
  let wasSameMatchLastTime = false;

  for (let i = 0; i < recentMatches.length; i++) {
    const m = recentMatches[i];
    const inA_pA = m.team_a_ids.includes(pAId);
    const inB_pA = m.team_b_ids.includes(pAId);
    const inA_pB = m.team_a_ids.includes(pBId);
    const inB_pB = m.team_b_ids.includes(pBId);

    const onSameCourt = (inA_pA || inB_pA) && (inA_pB || inB_pB);

    if (onSameCourt) {
      if (i === 0) wasSameMatchLastTime = true;

      if ((inA_pA && inB_pB) || (inB_pA && inA_pB)) {
        timesAsOpponents++;
      } else if ((inA_pA && inA_pB) || (inB_pA && inB_pB)) {
        timesAsTeammates++;
      }
    }
  }

  return { timesAsOpponents, timesAsTeammates, wasSameMatchLastTime };
}

function evaluateGroupCohesion(group: Player[], recentMatches: Match[]): number {
  let penalty = 0;
  let sameLastMatchCount = 0;

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const history = getPairHistory(group[i].id, group[j].id, recentMatches);

      if (history.wasSameMatchLastTime) {
        sameLastMatchCount++;
        penalty += 1200;
      }

      penalty += history.timesAsOpponents * 200;
      penalty += history.timesAsTeammates * 150;
    }
  }

  if (sameLastMatchCount >= 5) {
    penalty += 6000;
  }

  const males = group.filter(p => p.gender === 'Male').length;
  const females = group.filter(p => p.gender === 'Female').length;
  if (males === 2 && females === 2) {
    penalty -= 800; // Bonus for mixed doubles candidate pool
  }

  return penalty;
}

function evaluateSplitScore(
  teamA: Player[],
  teamB: Player[],
  recentMatches: Match[]
): number {
  let score = 0;

  // 1. Gender Balancing
  const teamAMales = teamA.filter(p => p.gender === 'Male').length;
  const teamAFemales = teamA.filter(p => p.gender === 'Female').length;
  const teamBMales = teamB.filter(p => p.gender === 'Male').length;
  const teamBFemales = teamB.filter(p => p.gender === 'Female').length;

  // Forbid Men/Men vs Women/Women (2M vs 2F) if mixed combinations are possible
  if (
    (teamAMales === 2 && teamBFemales === 2) ||
    (teamAFemales === 2 && teamBMales === 2)
  ) {
    score += 8000;
  }

  // Reward True Mixed Doubles: (1M + 1F) vs (1M + 1F)
  if (
    teamAMales === 1 && teamAFemales === 1 &&
    teamBMales === 1 && teamBFemales === 1
  ) {
    score -= 1000;
  }

  // 2. Partner Repetition Penalty
  const teamAPartnerHistory = getPairHistory(teamA[0].id, teamA[1].id, recentMatches);
  const teamBPartnerHistory = getPairHistory(teamB[0].id, teamB[1].id, recentMatches);

  if (teamAPartnerHistory.wasSameMatchLastTime && teamAPartnerHistory.timesAsTeammates > 0) score += 2500;
  if (teamBPartnerHistory.wasSameMatchLastTime && teamBPartnerHistory.timesAsTeammates > 0) score += 2500;
  score += teamAPartnerHistory.timesAsTeammates * 400;
  score += teamBPartnerHistory.timesAsTeammates * 400;

  // 3. Opponent Repetition Penalty
  const oppPairs = [
    getPairHistory(teamA[0].id, teamB[0].id, recentMatches),
    getPairHistory(teamA[0].id, teamB[1].id, recentMatches),
    getPairHistory(teamA[1].id, teamB[0].id, recentMatches),
    getPairHistory(teamA[1].id, teamB[1].id, recentMatches),
  ];

  for (const h of oppPairs) {
    if (h.wasSameMatchLastTime && h.timesAsOpponents > 0) {
      score += 2000;
    }
    score += h.timesAsOpponents * 300;
  }

  // 4. Split-Winners-Split-Losers Bonus
  const lastMatch = recentMatches[0];
  if (lastMatch) {
    const winners = lastMatch.status === 'teamA_win' ? lastMatch.team_a_ids : lastMatch.team_b_ids;
    const teamAWinnerCount = teamA.filter(p => winners.includes(p.id)).length;
    const teamBWinnerCount = teamB.filter(p => winners.includes(p.id)).length;

    if (teamAWinnerCount === 1 && teamBWinnerCount === 1) {
      score -= 600;
    }
  }

  return score;
}

// =========================================================================
// MAIN MATCH GENERATOR (GUARANTEED FALLBACK MATCHING)
// =========================================================================
export function generateNextMatch({
  mode,
  availableCheckins,
  playersMap,
  recentMatches = [],
  courtNumber
}: {
  mode: GameMode;
  availableCheckins: SessionCheckin[];
  playersMap: Map<string, Player>;
  recentMatches?: Match[];
  courtNumber: number;
}): Match | null {
  const needed = mode === 'singles' ? 2 : 4;
  if (!availableCheckins || availableCheckins.length < needed) return null;

  // 1. Sort by sit-out fairness (lowest games played today)
  const sorted = [...availableCheckins].sort((a, b) => (a.games_played_today || 0) - (b.games_played_today || 0));

  // 2. DOUBLES MATCHMAKING
  if (mode === 'doubles') {
    let pList: Player[] = [];

    if (sorted.length === 4) {
      // Exactly 4 players available -> use all 4
      pList = sorted.map(c => playersMap.get(c.player_id)!).filter(Boolean);
    } else {
      // 5+ players available -> evaluate candidate pool for best stacking and rotation
      const minGames = sorted[0].games_played_today || 0;
      const candidatePool = sorted.filter(c => (c.games_played_today || 0) <= minGames + 1);
      const poolPlayers = (candidatePool.length >= 4 ? candidatePool : sorted)
        .map(c => playersMap.get(c.player_id)!)
        .filter(Boolean);

      // Separate locked pairs and solo players
      const lockedPairs: Player[][] = [];
      const soloPlayers: Player[] = [];
      const seenIds = new Set<string>();

      for (const p of poolPlayers) {
        if (seenIds.has(p.id)) continue;
        if (p.locked_partner_id) {
          const partner = poolPlayers.find(x => x.id === p.locked_partner_id);
          if (partner) {
            lockedPairs.push([p, partner]);
            seenIds.add(p.id);
            seenIds.add(partner.id);
            continue;
          }
        }
        soloPlayers.push(p);
        seenIds.add(p.id);
      }

      // Assemble candidate 4-player combinations
      const candidateGroups: Player[][] = [];

      if (lockedPairs.length >= 2) {
        candidateGroups.push([...lockedPairs[0], ...lockedPairs[1]]);
      }
      if (lockedPairs.length >= 1 && soloPlayers.length >= 2) {
        for (let i = 0; i < Math.min(soloPlayers.length - 1, 3); i++) {
          candidateGroups.push([...lockedPairs[0], soloPlayers[i], soloPlayers[i + 1]]);
        }
      }
      if (soloPlayers.length >= 4) {
        for (let i = 0; i < Math.min(soloPlayers.length - 3, 4); i++) {
          for (let j = i + 1; j < Math.min(soloPlayers.length - 2, 5); j++) {
            candidateGroups.push([soloPlayers[i], soloPlayers[j], soloPlayers[j + 1], soloPlayers[j + 2]]);
          }
        }
      }

      let bestGroup: Player[] = [];
      let lowestPenalty = Infinity;

      if (candidateGroups.length > 0) {
        for (const grp of candidateGroups) {
          const penalty = evaluateGroupCohesion(grp, recentMatches);
          if (penalty < lowestPenalty) {
            lowestPenalty = penalty;
            bestGroup = grp;
          }
        }
        pList = bestGroup;
      }

      // AUTOMATIC FALLBACK: If candidate combinations failed, take top 4 directly from queue
      if (pList.length < 4) {
        pList = sorted.slice(0, 4).map(c => playersMap.get(c.player_id)!).filter(Boolean);
      }
    }

    // Final safety check: must have 4 players
    if (pList.length < 4) {
      pList = sorted.slice(0, 4).map(c => playersMap.get(c.player_id)!).filter(Boolean);
      if (pList.length < 4) return null;
    }

    let teamA: Player[] = [];
    let teamB: Player[] = [];

    // Locked pairs are never separated
    if (pList[0].locked_partner_id === pList[1].id) {
      teamA = [pList[0], pList[1]];
      teamB = [pList[2], pList[3]];
    } else if (pList[2].locked_partner_id === pList[3].id) {
      teamA = [pList[0], pList[1]];
      teamB = [pList[2], pList[3]];
    } else if (pList[0].locked_partner_id === pList[2].id) {
      teamA = [pList[0], pList[2]];
      teamB = [pList[1], pList[3]];
    } else if (pList[0].locked_partner_id === pList[3].id) {
      teamA = [pList[0], pList[3]];
      teamB = [pList[1], pList[2]];
    } else {
      // Test all 3 team partitions and pick the best split
      const s1 = { teamA: [pList[0], pList[1]], teamB: [pList[2], pList[3]], score: evaluateSplitScore([pList[0], pList[1]], [pList[2], pList[3]], recentMatches) };
      const s2 = { teamA: [pList[0], pList[2]], teamB: [pList[1], pList[3]], score: evaluateSplitScore([pList[0], pList[2]], [pList[1], pList[3]], recentMatches) };
      const s3 = { teamA: [pList[0], pList[3]], teamB: [pList[1], pList[2]], score: evaluateSplitScore([pList[0], pList[3]], [pList[1], pList[2]], recentMatches) };

      const bestSplit = [s1, s2, s3].sort((a, b) => a.score - b.score)[0];
      teamA = bestSplit.teamA;
      teamB = bestSplit.teamB;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      court_number: courtNumber,
      mode,
      team_a_ids: teamA.map(p => p.id),
      team_b_ids: teamB.map(p => p.id),
      team_a_names: teamA.map(p => p.name),
      team_b_names: teamB.map(p => p.name),
      status: 'pending',
      time_str: timeStr,
      created_at: new Date().toISOString()
    };
  }

  // 3. SINGLES MATCHMAKING
  const p1 = sorted[0];
  let p2 = sorted[1];
  let minRepeat = getPairHistory(p1.player_id, p2.player_id, recentMatches).timesAsOpponents;

  for (let i = 2; i < Math.min(sorted.length, 6); i++) {
    const history = getPairHistory(p1.player_id, sorted[i].player_id, recentMatches);
    if (!history.wasSameMatchLastTime && history.timesAsOpponents < minRepeat) {
      p2 = sorted[i];
      minRepeat = history.timesAsOpponents;
    }
  }

  const pA = playersMap.get(p1.player_id);
  const pB = playersMap.get(p2.player_id);
  if (!pA || !pB) return null;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    court_number: courtNumber,
    mode: 'singles',
    team_a_ids: [pA.id],
    team_b_ids: [pB.id],
    team_a_names: [pA.name],
    team_b_names: [pB.name],
    status: 'pending',
    time_str: timeStr,
    created_at: new Date().toISOString()
  };
}
