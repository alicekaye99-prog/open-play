export type GameMode = 'singles' | 'doubles';
export type Gender = 'Male' | 'Female' | 'Co-ed / Other' | 'Prefer not to say';

export type Tier =
  | 'wood'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master';

export type SubTier = 'III' | 'II' | 'I' | 'none';

export type RankTier =
  | 'Wood III' | 'Wood II' | 'Wood I'
  | 'Bronze III' | 'Bronze II' | 'Bronze I'
  | 'Silver III' | 'Silver II' | 'Silver I'
  | 'Gold III' | 'Gold II' | 'Gold I'
  | 'Platinum III' | 'Platinum II' | 'Platinum I'
  | 'Diamond III' | 'Diamond II' | 'Diamond I'
  | 'Master';

export interface Venue {
  id: string;
  name: string; // e.g. "BGC Pickleball Club"
  default_courts: number;
  default_mode: GameMode;
  queue_capacity_per_court: number;
  created_at: string;
}

export interface PromotionSeries {
  targetRankValue: number;
  targetRankName: RankTier;
  wins: number;
  losses: number;
  isComplete: boolean;
  isSuccess: boolean;
}

export interface Player {
  id: string; // e.g. "PL-101"
  venue_id?: string;
  name: string;
  age?: number;
  gender?: Gender;
  locked_partner_id?: string | null;
  
  // Progression & Rank Fields (Wood III to Master)
  rank_value: number; // 1 (Wood III) to 19 (Master)
  tier: Tier;
  sub_tier: SubTier;
  rank_name: RankTier;
  highest_rank_value?: number;
  highest_rank_name?: RankTier;
  stars: number; // 0 to 5
  current_cp: number; // Career Court Points
  demotion_grace_matches: number;
  active_promotion_series: PromotionSeries | null;

  // Career Statistics
  wins_singles: number;
  losses_singles: number;
  wins_doubles: number;
  losses_doubles: number;
  created_at: string;
  last_played_at?: string;
}

export interface Session {
  id: string;
  venue_id?: string;
  name: string;
  court_count: number;
  mode: GameMode;
  active_players_per_court: number;
  queue_players_per_court: number;
  total_session_capacity: number;
  created_at: string;
  last_active_at: string;
  onboarding_step: 'venue_select' | 'court_setup' | 'player_setup' | 'checkin_ready' | 'active_hub';
  is_active: boolean;
}

export interface SessionCheckin {
  id: string;
  session_id?: string;
  player_id: string;
  games_played_today: number;
  checked_in_at: string;
}

export interface Match {
  id: string;
  session_id?: string;
  court_number: number;
  mode: GameMode;
  team_a_ids: string[];
  team_b_ids: string[];
  team_a_names: string[];
  team_b_names: string[];
  status: 'pending' | 'in-progress' | 'teamA_win' | 'teamB_win';
  team_a_cp_delta?: number;
  team_b_cp_delta?: number;
  player_cp_deltas?: Record<string, number>;
  player_star_deltas?: Record<string, number>;
  repeat_count?: number;
  decay_applied?: number;
  time_str: string;
  created_at: string;
}

export interface Court {
  court_number: number;
  status: 'idle' | 'live';
  current_match?: Match | null;
  next_up_match?: Match | null;
}
