import { JWT } from 'next-auth/jwt';

export interface AuthParams {
  token: JWT | null;
  apiKey?: string;
}
