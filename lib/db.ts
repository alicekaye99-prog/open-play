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
    super('OpenPlayDB_v4');
    
    this.version(1).stores({
      venues: 'id, name, created_at',
      players: 'id, venue_id, name, rank_value, tier, sub_tier, rank_name, stars, current_cp, locked_partner_id, created_at',
      sessions: 'id, venue_id, name, created_at, is_active, onboarding_step',
      checkins: 'id, session_id, player_id, games_played_today, checked_in_at',
      courts: 'court_number, status',
      matches: 'id, session_id, court_number, status, time_str, created_at, *team_a_ids, *team_b_ids'
    });
  }
}

export const db = new OpenPlayDatabase();
