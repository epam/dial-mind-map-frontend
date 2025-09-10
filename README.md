# Mind Map Studio Frontend

## Overview

The project is a frontend part of the DIAL Mind Map Studio. Check the demo:

[![Check the demo](https://img.youtube.com/vi/XYZfWeGdFcE/0.jpg)](https://www.youtube.com/watch?v=XYZfWeGdFcE)

## Run locally

Execute `npm run dev` to run a frontend server in dev mode.

## Environment Variables

The **Mind Map Studio** application uses environment variables to configure authentication, API connections, and theming settings. Below is a list of environment variables used in this project.

| Variable                    | Required | Description                                                                                                                                                                                                             |
| --------------------------- | :------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXTAUTH_SECRET`           | **Yes**  | Secret key for NextAuth.js authentication. Possible to generate with `openssl rand -base64 32`.                                                                                                                         |
| `NEXTAUTH_URL`              | **Yes**  | Base URL of the application used for authentication callbacks.                                                                                                                                                          |
| `AUTH_KEYCLOAK_CLIENT_ID`   | **Yes**  | Client ID for Keycloak authentication.                                                                                                                                                                                  |
| `AUTH_KEYCLOAK_SECRET`      | **Yes**  | Secret key for Keycloak authentication.                                                                                                                                                                                 |
| `AUTH_KEYCLOAK_HOST`        | **Yes**  | Keycloak server URL.                                                                                                                                                                                                    |
| `AUTH_KEYCLOAK_REALM`       | **Yes**  | Keycloak realm name used for authentication.                                                                                                                                                                            |
| `THEMES_CONFIG_HOST`        |  **No**  | The host URL for custom themes configuration.                                                                                                                                                                           |
| `THEMES_CONFIG`             |  **No**  | JSON string pointing to the theme configuration for chat customization. [Example](https://gitlab.deltixhub.com/Deltix/openai-apps/mindmap/-/blob/development/.env.local.example?ref_type=heads#L21).                    |
| `MINDMAP_BACKEND_URL`       | **Yes**  | Backend API URL for mindmap operations.                                                                                                                                                                                 |
| `DIAL_API_KEY`              |  **No**  | API key used to authenticate requests to the AI DIAL API.                                                                                                                                                               |
| `DIAL_API_HOST`             | **Yes**  | The API host for AI DIAL integration.                                                                                                                                                                                   |
| `DIAL_CHAT_HOST`            | **Yes**  | The host URL for AI DIAL chat integration.                                                                                                                                                                              |
| `MINDMAP_IFRAME_TITLE`      | **Yes**  | Custom title to display in the iframe when embedding the mindmap application. Must match `dial:applicationTypeDisplayName` in DIAL schema.                                                                              |
| `ALLOW_API_KEY_AUTH`        |  **No**  | If set to `true`, allows authentication via API key without requiring user login. Acceptable values: `true`, `false`. Default: `false`.                                                                                 |
| `CHAT_DISCLAIMER`           |  **No**  | A text string which, if set, will be displayed below the chat input.                                                                                                                                                    |
| `RECAPTCHA_SITE_KEY`        |  **No**  | Site key for Google reCAPTCHA.                                                                                                                                                                                          |
| `RECAPTCHA_SECRET_KEY`      |  **No**  | Secret key for Google reCAPTCHA.                                                                                                                                                                                        |
| `RECAPTCHA_REQUEST_QUOTA`   |  **No**  | The number of requests a user can make before triggering the reCAPTCHA challenge.                                                                                                                                       |
| `ANONYM_SESSION_SECRET_KEY` |  **No**  | The secret key used for anonym session cookies when ALLOW_API_KEY_AUTH is set to true. Generate it using `openssl rand -base64 32`.                                                                                     |
| `GOOGLE_FONTS_API_KEY`      |  **No**  | A unique API key required to authenticate and enable access to the Google Fonts API. Without it, font family validation cannot be performed.                                                                            |
| `AUTH_UI_MODE`              |  **No**  | Controls the authentication UI mode: set to `popup` to use a popup window, `tab` to open a new browser tab, or `sameWindow` to authorize in the same window where the mindmap is embedded. Defaults to `popup` if unset |

**Note:** make sure to define all required variables in your `.env` file or provide them through your deployment configuration.

## Authors

- [Valery Dluski](https://github.com/valerydluski)
- Mikhail Hahalushka
