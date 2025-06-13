import { decodeJwt } from 'jose';
import get from 'lodash-es/get';
import { Account, AuthOptions, CallbacksOptions, CookiesOptions, Profile, Session } from 'next-auth';
import { TokenSet } from 'openid-client';

import { Token } from '@/types/auth';

import { logger } from '../server/logger';
import { authProviders } from './auth-providers';
import NextClient, { RefreshToken } from './nextauth-client';
import { validateToken } from './validate-token';

const waitRefreshTokenTimeout = 5;

const REFRESH_TOKEN_THRESHOLD = 32 * 60 * 1000; // 32 minutes

const safeDecodeJwt = (accessToken: string) => {
  try {
    return decodeJwt(accessToken);
  } catch (err) {
    console.error("Token couldn't be parsed as JWT", err);
    // TODO: read roles from GCP token format
    return {};
  }
};

const getUser = (accessToken?: string) => {
  const rolesFieldName = process.env.DIAL_ROLES_FIELD ?? 'dial_roles';
  const decodedPayload = accessToken ? safeDecodeJwt(accessToken) : {};
  const adminRoleNames = (process.env.ADMIN_ROLE_NAMES || 'admin').split(',');
  const dialRoles = get(decodedPayload, rolesFieldName, []) as string[];
  const roles = Array.isArray(dialRoles) ? dialRoles : [dialRoles];
  const isAdmin = roles.length > 0 && adminRoleNames.some(role => roles.includes(role));

  return {
    isAdmin,
  };
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: Token) {
  const displayedTokenSub = process.env.SHOW_TOKEN_SUB === 'true' ? token.sub : '******';

  try {
    // Ensure the token contains provider information
    if (!token.providerId) {
      throw new Error(`No provider information exists in token`);
    }

    const client = NextClient.getClient(token.providerId);
    if (!client) {
      logger.error(`No client for provider: ${token.providerId}. Sub: ${displayedTokenSub}`);
      return {
        ...token,
        error: 'NoClientForProvider',
      };
    }

    let msWaiting = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const refresh = NextClient.getRefreshToken(token.userId);
      if (!refresh || !refresh.isRefreshing) {
        const localToken: RefreshToken = refresh || {
          isRefreshing: true,
          token,
        };
        logger.info(
          `Refreshing token: expires - ${new Date(Number(localToken.token?.accessTokenExpires))} now - ${new Date(
            Date.now(),
          )}, expires - threshold: ${new Date(Number(localToken.token?.accessTokenExpires) - REFRESH_TOKEN_THRESHOLD)}`,
        );
        if (
          typeof localToken.token?.accessTokenExpires === 'number' &&
          Date.now() < localToken.token.accessTokenExpires - REFRESH_TOKEN_THRESHOLD
        ) {
          return localToken.token;
        }

        NextClient.setIsRefreshTokenStart(token.userId, localToken);
        break;
      }

      await NextClient.delay();
      msWaiting += 50;

      if (msWaiting >= waitRefreshTokenTimeout * 1000) {
        throw new Error(`Waiting more than ${waitRefreshTokenTimeout} seconds for refreshing token`);
      }
    }

    const refreshedTokens = await client.refresh(token.refreshToken as string | TokenSet);

    if (!refreshedTokens || (!refreshedTokens.expires_in && !refreshedTokens.expires_at)) {
      throw new Error(`Error from auth provider while refreshing token`);
    }

    if (!refreshedTokens.refresh_token) {
      logger.warn(`Auth provider didn't provide new refresh token. Sub: ${displayedTokenSub}`);
    }

    if (!refreshedTokens.refresh_token && !token.refreshToken) {
      throw new Error('No refresh tokens exists');
    }

    const returnToken = {
      ...token,
      user: getUser(refreshedTokens.access_token),
      access_token: refreshedTokens.access_token,
      accessTokenExpires: refreshedTokens.expires_in
        ? Date.now() + refreshedTokens.expires_in * 1000
        : (refreshedTokens.expires_at as number) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };

    NextClient.setIsRefreshTokenStart(token.userId, {
      isRefreshing: false,
      token: returnToken,
    });
    return returnToken;
  } catch (error: unknown) {
    logger.error(error, `Error when refreshing token: ${(error as Error).message}. Sub: ${displayedTokenSub}`);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

// https://github.com/nextauthjs/next-auth/blob/a8dfc8ebb11ccb96fd694db888e52f0d20395e64/packages/core/src/lib/cookie.ts#L53
function defaultCookies(useSecureCookies: boolean, sameSite = 'lax'): CookiesOptions {
  const cookiePrefix = useSecureCookies ? '__Secure-' : '';
  return {
    // default cookie options
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      // Default to __Host- for CSRF token for additional protection if using useSecureCookies
      // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
      name: `${useSecureCookies ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
  };
}

const isSecure = !!process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https:');

export const callbacks: Partial<CallbacksOptions<Profile & { job_title?: string }, Account>> = {
  jwt: async options => {
    if (options.account) {
      return {
        ...options.token,
        user: getUser(options.account?.access_token),
        jobTitle: options.profile?.job_title,
        access_token: options.account.access_token,
        accessTokenExpires:
          typeof options.account.expires_in === 'number'
            ? Date.now() + options.account.expires_in * 1000
            : (options.account.expires_at as number) * 1000,
        refreshToken: options.account.refresh_token,
        providerId: options.account.provider,
        userId: options.user.id,
        idToken: options.account.id_token,
      };
    }

    // Calculate remaining time until the access token expires
    const timeLeft =
      typeof options.token.accessTokenExpires === 'number' && options.token.accessTokenExpires - Date.now();

    if (timeLeft && timeLeft > REFRESH_TOKEN_THRESHOLD) {
      return {
        ...options.token,
        user: getUser(options.token.access_token),
      };
    }
    const typedToken = options.token as Token;
    const refreshedToken = await refreshAccessToken(typedToken);
    return { ...refreshedToken, isNew: true };
  },
  signIn: async options => {
    if (!options.account?.access_token) {
      return false;
    }

    return true;
  },
  session: async options => {
    const isValidToken = await validateToken(options.token);
    if (isValidToken.error) {
      logger.warn('Invalid token:', options.token);
      options.token.error = isValidToken.error;
    }

    // Pass any token errors to the session
    if (options.token?.error) {
      if (options.session) {
        (options.session as Session).error = options.token.error;
      }
    }

    const isAdmin = options?.token?.user?.isAdmin ?? false;

    if (options.session.user) {
      options.session.user.isAdmin = isAdmin;
    }

    return options.session;
  },
};

export const nextauthOptions: AuthOptions = {
  providers: authProviders,
  cookies: defaultCookies(isSecure, isSecure ? 'none' : 'lax'),
  callbacks: callbacks,
  session: {
    strategy: 'jwt',
  },
  // temp
  theme: {
    colorScheme: 'dark',
  },
  pages: {
    signIn: '/signin',
  },
  debug: true,
};
