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

      DIAL_API_KEY?: string;

      DIAL_API_HOST: string;
      BUILDER_ALLOW_API_KEY_AUTH: string;

      GCP_PROJECT_ID?: string;
      RECAPTCHA_SITE_KEY?: string;
      RECAPTCHA_SCORE_THRESHOLD?: string;
      ANONYM_SESSION_SECRET_KEY?: string;

      GOOGLE_FONTS_API_KEY?: string;
      THEMES_CONFIG?: string;

      LITE_MODE_AVAILABLE?: string;
      LITE_MODE_TOKENS_LIMIT?: string;
      DEFAULT_LITE_MODE_MODEL?: string;
      DEFAULT_LITE_MODE_PROMPT?: string;
      AVAILABLE_LITE_MODE_MODELS?: string;

      DEFAULT_CHAT_MODEL?: string;
      DEFAULT_CHAT_PROMPT?: string;
      AVAILABLE_CHAT_MODELS?: string;
      DEFAULT_CHAT_GUARDRAILS_PROMPT?: string;
      DEFAULT_CHAT_GUARDRAILS_RESPONSE_PROMPT?: string;

      DIAL_CHAT_HOST?: string;
      DIAL_IFRAME_ALLOWED_HOSTS?: string;
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
