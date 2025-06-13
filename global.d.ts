import { Core } from 'cytoscape';

export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      THEMES_CONFIG_HOST?: string;

      NEXTAUTH_URL?: string;
      NEXTAUTH_SECRET?: string;
      AUTH_KEYCLOAK_CLIENT_ID?: string;
      AUTH_KEYCLOAK_HOST?: string;
      AUTH_KEYCLOAK_NAME?: string;
      AUTH_KEYCLOAK_SECRET?: string;
      AUTH_KEYCLOAK_SCOPE?: string;

      MINDMAP_BACKEND_URL?: string;
      DIAL_API_KEY?: string;

      DIAL_API_HOST: string;
      ALLOW_API_KEY_AUTH: boolean;

      RECAPTCHA_SITE_KEY?: string;
      RECAPTCHA_SECRET_KEY?: string;
      ANONYM_SESSION_SECRET_KEY?: string;
    }
  }

  interface Window {
    cy: Core;
  }

  interface NavigatorUAData {
    platform: string;
    architecture?: string;
    bitness?: string;
    mobile?: boolean;
    brands?: Array<{ brand: string; version: string }>;
  }

  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}
