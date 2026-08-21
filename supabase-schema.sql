-- =========================================================================
-- OPEN PLAY: MULTI-VENUE CLOUD POSTGRESQL DATABASE SCHEMA FOR SUPABASE
-- Run this in your Supabase SQL Editor (supabase.com -> SQL Editor -> New Query)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. VENUES / COURT LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  default_courts INTEGER NOT NULL DEFAULT 4,
  default_mode TEXT NOT NULL DEFAULT 'doubles',
  queue_capacity_per_court INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PLAYERS TABLE (PERMANENT ACROSS DAYS PER VENUE)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY, -- e.g. "PL-101"
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT DEFAULT 'Co-ed / Other',
  locked_partner_id TEXT,
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
  wins_singles INTEGER NOT NULL DEFAULT 0,
  losses_singles INTEGER NOT NULL DEFAULT 0,
  wins_doubles INTEGER NOT NULL DEFAULT 0,
  losses_doubles INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SESSIONS TABLE (12-HOUR OPEN PLAY EVENTS)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
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

-- 4. SESSION CHECKINS (QUEUE WAITING POOL)
CREATE TABLE IF NOT EXISTS session_checkins (
  id TEXT PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  games_played_today INTEGER NOT NULL DEFAULT 0,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- 5. LIVE COURTS TABLE
CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  court_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  current_match JSONB DEFAULT NULL,
  next_up_match JSONB DEFAULT NULL,
  UNIQUE(session_id, court_number)
);

-- 6. MATCHES TABLE (HISTORY AUDIT LOG)
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  court_number INTEGER NOT NULL,
  mode TEXT NOT NULL,
  team_a_ids TEXT[] NOT NULL,
  team_b_ids TEXT[] NOT NULL,
  team_a_names TEXT[] NOT NULL,
  team_b_names TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  player_cp_deltas JSONB DEFAULT '{}',
  player_star_deltas JSONB DEFAULT '{}',
  repeat_count INTEGER DEFAULT 1,
  time_str TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ENABLE REALTIME REPLICATION FOR LIVE COURTS AND LEADERBOARD
ALTER PUBLICATION supabase_realtime ADD TABLE venues;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE courts;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- PUBLIC ACCESS POLICIES (OPEN PLAY ORGANIZER ACCESS)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write Venues" ON venues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Checkins" ON session_checkins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Courts" ON courts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Matches" ON matches FOR ALL USING (true) WITH CHECK (true);
