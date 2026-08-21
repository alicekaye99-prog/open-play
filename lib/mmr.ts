import { GameMode, RankTier } from '../types/pickleball';

export const UNIFORM_STARTING_MMR = 800; // Uniform starting baseline for all new players
export const K_FACTOR = 32;
export const DEMOTION_BUFFER = 20;
export const SKILL_GAP_THRESHOLD = 250;

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function getTierFromMMR(mmr: number): RankTier {
  if (mmr >= 1800) return 'S';
  if (mmr >= 1734) return 'A3';
  if (mmr >= 1667) return 'A2';
  if (mmr >= 1600) return 'A1';
  if (mmr >= 1534) return 'B3';
  if (mmr >= 1467) return 'B2';
  if (mmr >= 1400) return 'B1';
  if (mmr >= 1334) return 'C3';
  if (mmr >= 1267) return 'C2';
  if (mmr >= 1200) return 'C1';
  if (mmr >= 1134) return 'D3';
  if (mmr >= 1067) return 'D2';
  if (mmr >= 1000) return 'D1';
  if (mmr >= 934) return 'E3';
  if (mmr >= 867) return 'E2';
  return 'E1';
}

export function getRepeatMatchupDecay(meetingCountInSession: number): number {
  if (meetingCountInSession <= 1) return 1.0;
  if (meetingCountInSession === 2) return 0.50; // 50% delta reduction on 2nd match
  return 0.25; // 75% delta reduction on 3rd+ match
}

export function calculateMatchDeltas(input: {
  mode: GameMode;
  teamA: { id: string; mmr: number }[];
  teamB: { id: string; mmr: number }[];
  winner: 'teamA' | 'teamB';
  repeatCount: number;
}) {
  const { mode, teamA, teamB, winner, repeatCount } = input;
  const decayFactor = getRepeatMatchupDecay(repeatCount);

  const avgA = teamA.reduce((s, p) => s + p.mmr, 0) / teamA.length;
  const avgB = teamB.reduce((s, p) => s + p.mmr, 0) / teamB.length;

  const expectedA = calculateExpectedScore(avgA, avgB);
  const actualA = winner === 'teamA' ? 1 : 0;

  const rawDeltaA = K_FACTOR * (actualA - expectedA);
  const rawDeltaB = -rawDeltaA;

  const playerDeltas: Record<string, number> = {};
  const newMMRs: Record<string, number> = {};

  if (mode === 'singles') {
    const deltaA = Math.round(rawDeltaA * decayFactor);
    const deltaB = Math.round(rawDeltaB * decayFactor);
    playerDeltas[teamA[0].id] = deltaA;
    playerDeltas[teamB[0].id] = deltaB;
    newMMRs[teamA[0].id] = Math.max(100, teamA[0].mmr + deltaA);
    newMMRs[teamB[0].id] = Math.max(100, teamB[0].mmr + deltaB);

    return { teamADelta: deltaA, teamBDelta: deltaB, playerDeltas, newMMRs, decayFactor };
  }

  // Doubles: Partner-Gap scaling (Anti-boosting penalty)
  const applyDoublesScaling = (team: { id: string; mmr: number }[], avg: number, baseDelta: number) => {
    team.forEach(p => {
      const diff = p.mmr - avg;
      let scaling = 1.0;
      if (diff < 0) {
        scaling = Math.max(0.40, 1.0 - Math.abs(diff) / 350);
      } else {
        scaling = Math.min(1.20, 1.0 + diff / 700);
      }
      const finalDelta = Math.round(baseDelta * scaling * decayFactor);
      playerDeltas[p.id] = finalDelta;
      newMMRs[p.id] = Math.max(100, p.mmr + finalDelta);
    });
  };

  applyDoublesScaling(teamA, avgA, rawDeltaA);
  applyDoublesScaling(teamB, avgB, rawDeltaB);

  return {
    teamADelta: Math.round(rawDeltaA * decayFactor),
    teamBDelta: Math.round(rawDeltaB * decayFactor),
    playerDeltas,
    newMMRs,
    decayFactor
  };
}
