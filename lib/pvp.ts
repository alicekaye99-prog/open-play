import { Match, ScoreSubmission, Player, GameMode } from '../types/pickleball';

export function createPvPInvite(params: {
  creator: Player;
  partner?: Player | null;
  mode: GameMode;
}): Match {
  const { creator, partner, mode } = params;
  const now = new Date();

  const teamAIds = partner ? [creator.id, partner.id] : [creator.id];
  const teamANames = partner ? [creator.name, partner.name] : [creator.name];

  return {
    id: `pvp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    match_source: 'pvp_invite',
    mode,
    team_a_ids: teamAIds,
    team_b_ids: [],
    team_a_names: teamANames,
    team_b_names: [],
    status: 'pending',
    started_at: undefined,
    score_submissions: {},
    time_str: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at: now.toISOString()
  };
}

export function acceptPvPInvite(match: Match, opponent: Player, opponentPartner?: Player | null): Match {
  const teamBIds = opponentPartner ? [opponent.id, opponentPartner.id] : [opponent.id];
  const teamBNames = opponentPartner ? [opponent.name, opponentPartner.name] : [opponent.name];

  return {
    ...match,
    team_b_ids: teamBIds,
    team_b_names: teamBNames,
    status: 'in-progress',
    started_at: new Date().toISOString()
  };
}

export interface ScoreResolutionResult {
  isResolved: boolean;
  isDisputed: boolean;
  winner?: 'teamA' | 'teamB';
  teamAScore?: number;
  teamBScore?: number;
}

export function evaluateScoreSubmissions(match: Match): ScoreResolutionResult {
  const submissions = Object.values(match.score_submissions || {});
  
  if (submissions.length < 2) {
    return { isResolved: false, isDisputed: false };
  }

  const subA = submissions[0];
  const subB = submissions[1];

  if (subA.team_a_score === subB.team_a_score && subA.team_b_score === subB.team_b_score) {
    const winner = subA.team_a_score > subA.team_b_score ? 'teamA' : 'teamB';
    return {
      isResolved: true,
      isDisputed: false,
      winner,
      teamAScore: subA.team_a_score,
      teamBScore: subA.team_b_score
    };
  }

  return {
    isResolved: false,
    isDisputed: true
  };
}
