CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. VENUE OWNERS TABLE (Court Owner Accounts)
CREATE TABLE IF NOT EXISTS venue_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. VENUES TABLE (Court Owner Management)
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id TEXT,
  settings JSONB NOT NULL DEFAULT '{
    "default_courts": 4,
    "default_mode": "doubles",
    "queue_capacity_per_court": 12,
    "enable_gender_balance": true,
    "enable_sitout_fairness": true,
    "min_pvp_duration_singles_sec": 180,
    "min_pvp_duration_doubles_sec": 240
  }'::jsonb,
  analytics JSONB NOT NULL DEFAULT '{
    "total_sessions_hosted": 0,
    "total_players_served": 0,
    "total_matches_logged": 0,
    "average_sitout_variance": 0.0,
    "repeat_matchup_rate": 0.0,
    "gender_balance_adherence": 100.0,
    "dispute_rate": 0.0
  }'::jsonb,
  host_tier TEXT NOT NULL DEFAULT 'Novice Host',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PLAYERS TABLE (Permanent Profile, Placement, Rank, Trophies)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  user_id UUID,
  email TEXT,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  age INTEGER,
  gender TEXT DEFAULT 'Co-ed / Other',
  locked_partner_id TEXT,
  
  -- Placement Tracking (Glicko Hidden Placement Rating)
  placement_status TEXT NOT NULL DEFAULT 'provisional',
  placement_matches_played INTEGER NOT NULL DEFAULT 0,
  hidden_rating DOUBLE PRECISION NOT NULL DEFAULT 1500.0,
  hidden_rd DOUBLE PRECISION NOT NULL DEFAULT 350.0,
  placement_opponents JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Visible Ladder Rank Fields
  rank_value INTEGER NOT NULL DEFAULT 1,
  tier TEXT NOT NULL DEFAULT 'wood',
  sub_tier TEXT NOT NULL DEFAULT 'III',
  rank_name TEXT NOT NULL DEFAULT 'Wood III',
  highest_rank_value INTEGER NOT NULL DEFAULT 1,
  highest_rank_name TEXT NOT NULL DEFAULT 'Wood III',
  stars INTEGER NOT NULL DEFAULT 0,
  current_cp INTEGER NOT NULL DEFAULT 0,
  demotion_grace_matches INTEGER NOT NULL DEFAULT 0,
  active_promotion_series JSONB DEFAULT NULL,
  trophies JSONB NOT NULL DEFAULT '[]'::jsonb,
  dispute_count INTEGER NOT NULL DEFAULT 0,
  wins_singles INTEGER NOT NULL DEFAULT 0,
  losses_singles INTEGER NOT NULL DEFAULT 0,
  wins_doubles INTEGER NOT NULL DEFAULT 0,
  losses_doubles INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SESSIONS TABLE (12-Hour Events)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  court_count INTEGER NOT NULL DEFAULT 4,
  mode TEXT NOT NULL DEFAULT 'doubles',
  active_players_per_court INTEGER NOT NULL DEFAULT 4,
  queue_players_per_court INTEGER NOT NULL DEFAULT 12,
  total_session_capacity INTEGER NOT NULL DEFAULT 48,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 5. SESSION CHECKINS
CREATE TABLE IF NOT EXISTS session_checkins (
  id TEXT PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  games_played_today INTEGER NOT NULL DEFAULT 0,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- 6. COURTS TABLE
CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  court_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  current_match JSONB DEFAULT NULL,
  next_up_match JSONB DEFAULT NULL,
  UNIQUE(session_id, court_number)
);

-- 7. MATCHES TABLE (Unified Session & Standalone PvP)
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  court_number INTEGER,
  match_source TEXT NOT NULL DEFAULT 'session',
  mode TEXT NOT NULL DEFAULT 'doubles',
  team_a_ids TEXT[] NOT NULL,
  team_b_ids TEXT[] NOT NULL,
  team_a_names TEXT[] NOT NULL,
  team_b_names TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  score_submissions JSONB DEFAULT '{}'::jsonb,
  is_flagged_duration BOOLEAN DEFAULT false,
  is_daily_pair_capped BOOLEAN DEFAULT false,
  player_cp_deltas JSONB DEFAULT '{}'::jsonb,
  player_star_deltas JSONB DEFAULT '{}'::jsonb,
  repeat_count INTEGER DEFAULT 1,
  time_str TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GIN Indexes for Cross-Source Lookups
CREATE INDEX IF NOT EXISTS idx_matches_team_a ON matches USING GIN (team_a_ids);
CREATE INDEX IF NOT EXISTS idx_matches_team_b ON matches USING GIN (team_b_ids);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_source ON matches (match_source);

ALTER PUBLICATION supabase_realtime ADD TABLE venue_owners;
ALTER PUBLICATION supabase_realtime ADD TABLE venues;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE courts;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

ALTER TABLE venue_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write Venue Owners" ON venue_owners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Venues" ON venues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Checkins" ON session_checkins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Courts" ON courts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Matches" ON matches FOR ALL USING (true) WITH CHECK (true);
