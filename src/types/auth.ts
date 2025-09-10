import { TokenSet } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export interface Token extends JWT {
  providerId?: string;
  userId: string;
  refreshToken: string | TokenSet;
}

export enum AuthUiMode {
  Tab = 'tab',
  Popup = 'popup',
  SameWindow = 'sameWindow',
}
