export const ENV = {
  API_BASE_URL: process.env.BACKEND_BASE_URL || "http://localhost:4000",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE || "token",
  API_TIMEOUT: 30000,
  TOKEN_KEY: "auth_token",
  REFRESH_TOKEN_KEY: "refresh_token",
} as const;
