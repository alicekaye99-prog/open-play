import { Player, Court, Session } from '../types/pickleball';

export const SESSION_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 Hours in milliseconds

export function isSessionValid(session: Session | null): boolean {
  if (!session || !session.created_at) return false;
  const elapsed = Date.now() - new Date(session.created_at).getTime();
  return elapsed < SESSION_EXPIRY_MS && session.is_active;
}

export function getSessionRemainingTime(session: Session | null): string {
  if (!session || !session.created_at) return '0h 0m';
  const elapsed = Date.now() - new Date(session.created_at).getTime();
  const remaining = Math.max(0, SESSION_EXPIRY_MS - elapsed);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
}

export function getInitialCourts(courtCount: number = 4): Court[] {
  return Array.from({ length: courtCount }, (_, i) => ({
    court_number: i + 1,
    status: 'idle',
    current_match: null,
    next_up_match: null
  }));
}
