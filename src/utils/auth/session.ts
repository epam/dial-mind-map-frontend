import { Session } from 'next-auth';

export function isClientSessionValid(session: Session | null) {
  return session && session?.error !== 'RefreshAccessTokenError' && session?.error !== 'NoClientForProvider';
}

export function isServerSessionValid(session: Session | null) {
  return !!session && session.error !== 'RefreshAccessTokenError' && session.error !== 'NoClientForProvider';
}

export function validateServerSession(session: Session | null) {
  if (!isServerSessionValid(session)) {
    return false;
  }

  return true;
}
