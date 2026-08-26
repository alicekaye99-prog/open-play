import Dexie, { type Table } from 'dexie';
import { Venue, Player, Session, SessionCheckin, Court, Match } from '../types/pickleball';

export class OpenPlayDatabase extends Dexie {
  venues!: Table<Venue, string>;
  players!: Table<Player, string>;
  sessions!: Table<Session, string>;
  checkins!: Table<SessionCheckin, string>;
  courts!: Table<Court, number>;
  matches!: Table<Match, string>;

  constructor() {
    super('PikolLegendsDB_v1');
    
    this.version(1).stores({
      venues: 'id, name, host_tier, created_at',
      players: 'id, user_id, email, venue_id, name, rank_value, tier, sub_tier, rank_name, stars, current_cp, locked_partner_id, dispute_count, created_at',
      sessions: 'id, venue_id, name, created_at, is_active, onboarding_step',
      checkins: 'id, session_id, player_id, games_played_today, checked_in_at',
      courts: 'court_number, status',
      matches: 'id, session_id, venue_id, match_source, status, time_str, created_at, *team_a_ids, *team_b_ids'
    });
  }
}

export const db = new OpenPlayDatabase();
