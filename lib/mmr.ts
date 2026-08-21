import { RankTier } from '../types/pickleball';
import { getRankInfo } from './progression';

export const UNIFORM_STARTING_MMR = 800;
export const K_FACTOR = 32;
export const DEMOTION_BUFFER = 20;
export const SKILL_GAP_THRESHOLD = 4;

export function getTierFromMMR(rankValueOrCP: number): RankTier {
  return getRankInfo(rankValueOrCP).displayName;
}

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}
