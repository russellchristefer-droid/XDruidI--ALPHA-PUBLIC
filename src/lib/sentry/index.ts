/**
 * OBS-001: send live errors to the Sentry project "xdruidi".
 * Does nothing unless VITE_SENTRY_DSN is set at build time. The SDK is loaded lazily
 * so it does not slow the first paint, and errors raised before it loads are queued.
 */
import { sentryOptions } from "./options.ts";

type Captured = { err: unknown; context: string };
type SentryLike = {
  captureException: (err: unknown, hint?: { tags?: Record<string, string> }) => unknown;
};

let sdk: SentryLike | null = null;
let starting = false;
let queue: Captured[] = [];

export function initSentry(): void {
  if (typeof window === "undefined" || sdk || starting) return;
  const opts = sentryOptions(import.meta.env ?? {});
  if (!opts) return;
  starting = true;
  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init(opts);
      sdk = Sentry;
      for (const q of queue) send(q);
      queue = [];
    })
    .catch(() => {
      /* Sentry unreachable or blocked: the local error log still has everything. */
      queue = [];
    });
}

function send({ err, context }: Captured) {
  sdk?.captureException(err instanceof Error ? err : new Error(String(err)), {
    tags: { context: context.slice(0, 200) },
  });
}

export function captureToSentry(err: unknown, context: string): void {
  if (sdk) send({ err, context });
  else if (starting && queue.length < 20) queue.push({ err, context });
}
