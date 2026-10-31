import { test } from "node:test";
import assert from "node:assert/strict";
import { sentryOptions } from "./options.ts";

const DSN = "https://abc123@o1.ingest.us.sentry.io/42";

test("no DSN means Sentry stays off", () => {
  assert.equal(sentryOptions({}), null);
  assert.equal(sentryOptions({ VITE_SENTRY_DSN: "  " }), null);
});

test("a malformed DSN is ignored instead of crashing the SDK", () => {
  assert.equal(sentryOptions({ VITE_SENTRY_DSN: "not-a-dsn" }), null);
});

test("a valid DSN turns it on with no personal data and no tracing", () => {
  const o = sentryOptions({ VITE_SENTRY_DSN: DSN, MODE: "production" });
  assert.ok(o);
  assert.equal(o.dsn, DSN);
  assert.equal(o.environment, "production");
  assert.equal(o.sendDefaultPii, false);
  assert.equal(o.tracesSampleRate, 0);
  assert.equal("release" in o, false);
});

test("environment and release can be set explicitly", () => {
  const o = sentryOptions({ VITE_SENTRY_DSN: DSN, VITE_SENTRY_ENVIRONMENT: "preview", VITE_SENTRY_RELEASE: "b1d1fdd" });
  assert.equal(o?.environment, "preview");
  assert.equal(o?.release, "b1d1fdd");
});
