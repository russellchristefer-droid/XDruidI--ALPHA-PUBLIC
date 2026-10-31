/** Pure config for the Sentry browser SDK, kept separate so it can be unit-tested. */
export type SentryEnv = {
  VITE_SENTRY_DSN?: string;
  VITE_SENTRY_ENVIRONMENT?: string;
  VITE_SENTRY_RELEASE?: string;
  MODE?: string;
};

export type SentryOptions = {
  dsn: string;
  environment: string;
  release?: string;
  sendDefaultPii: false;
  tracesSampleRate: number;
};

/** Returns null when no DSN is set, so local and preview builds never report. */
export function sentryOptions(env: SentryEnv): SentryOptions | null {
  const dsn = String(env.VITE_SENTRY_DSN ?? "").trim();
  if (!dsn || !/^https:\/\/[^@\s]+@[^/\s]+\/\d+$/.test(dsn)) return null;
  const release = String(env.VITE_SENTRY_RELEASE ?? "").trim();
  return {
    dsn,
    environment: String(env.VITE_SENTRY_ENVIRONMENT ?? "").trim() || env.MODE || "production",
    ...(release ? { release } : {}),
    // No personal data, matching the telemetry promise. Errors only, no tracing.
    sendDefaultPii: false,
    tracesSampleRate: 0,
  };
}
