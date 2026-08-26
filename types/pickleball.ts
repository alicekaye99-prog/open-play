export type GameMode = 'singles' | 'doubles';
export type Gender = 'Male' | 'Female' | 'Co-ed / Other' | 'Prefer not to say';
export type MatchSource = 'session' | 'pvp_invite';
export type MatchStatus = 'pending' | 'in-progress' | 'confirmed' | 'disputed' | 'voided' | 'teamA_win' | 'teamB_win';
export type UserRole = 'player' | 'venue_owner';
export type PlacementStatus = 'provisional' | 'placed';

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

export type HostTier = 'Novice Host' | 'Bronze Host' | 'Silver Host' | 'Gold Host' | 'Platinum Host' | 'Diamond Host';

export interface PromotionSeries {
  targetRankValue: number;
  targetRankName: RankTier;
  wins: number;
  losses: number;
  isComplete: boolean;
  isSuccess: boolean;
}

export interface SessionChampionTrophy {
  id: string;
  venue_id?: string;
  venue_name: string;
  session_name: string;
  session_date: string;
  mode: GameMode;
  placement: 1 | 2 | 3;
  win_rate: number;
  total_wins: number;
  awarded_at: string;
}

export interface MatchHistoryEntry {
  matchId: string;
  matchSource: MatchSource;
  opponentIds: string[];
  partnerId?: string | null;
  timestamp: string;
  durationSeconds?: number;
}

export interface PlacementOpponentRecord {
  opponent_id: string;
  count: number;
}

export interface Player {
  id: string;
  user_id?: string;
  email?: string;
  password?: string;
  venue_id?: string;
  name: string;
  avatar_url?: string;
  age?: number;
  gender?: Gender;
  locked_partner_id?: string | null;
  
  // Placement System
  placement_status: PlacementStatus;
  placement_matches_played: number;
  hidden_rating: number;
  hidden_rd: number;
  placement_opponents: PlacementOpponentRecord[];

  // Progression & Rank Fields
  rank_value: number;
  tier: Tier;
  sub_tier: SubTier;
  rank_name: RankTier;
  highest_rank_value?: number;
  highest_rank_name?: RankTier;
  stars: number;
  current_cp: number;
  demotion_grace_matches: number;
  active_promotion_series: PromotionSeries | null;
  trophies: SessionChampionTrophy[];
  dispute_count: number;

  // Career Statistics
  wins_singles: number;
  losses_singles: number;
  wins_doubles: number;
  losses_doubles: number;
  created_at: string;
  last_played_at?: string;
}

export interface VenueSettings {
  default_courts: number;
  default_mode: GameMode;
  queue_capacity_per_court: number;
  enable_gender_balance: boolean;
  enable_sitout_fairness: boolean;
  min_pvp_duration_singles_sec: number;
  min_pvp_duration_doubles_sec: number;
}

export interface VenueAnalytics {
  total_sessions_hosted: number;
  total_players_served: number;
  total_matches_logged: number;
  average_sitout_variance: number;
  repeat_matchup_rate: number;
  gender_balance_adherence: number;
  dispute_rate: number;
}

export interface Venue {
  id: string;
  name: string;
  owner_id?: string;
  settings: VenueSettings;
  analytics: VenueAnalytics;
  host_tier: HostTier;
  created_at: string;
}

export type OnboardingStep = 
  | 'gate_select'
  | 'player_home'
  | 'player_profile_create'
  | 'session_gate' 
  | 'venue_select' 
  | 'court_setup' 
  | 'player_setup' 
  | 'checkin_ready' 
  | 'active_hub';

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
  onboarding_step: OnboardingStep;
  is_active: boolean;
}

export interface SessionCheckin {
  id: string;
  session_id?: string;
  player_id: string;
  games_played_today: number;
  checked_in_at: string;
}

export interface ScoreSubmission {
  player_id: string;
  team_a_score: number;
  team_b_score: number;
  submitted_at: string;
}

export interface Match {
  id: string;
  session_id?: string;
  venue_id?: string;
  court_number?: number;
  match_source: MatchSource;
  mode: GameMode;
  team_a_ids: string[];
  team_b_ids: string[];
  team_a_names: string[];
  team_b_names: string[];
  status: MatchStatus;
  
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  score_submissions?: Record<string, ScoreSubmission>;
  is_flagged_duration?: boolean;
  is_daily_pair_capped?: boolean;

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
