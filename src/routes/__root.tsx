import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initSentry } from "@/lib/sentry";
import "@/game/errorLog";
import appCss from "../styles.css?url";

/** Starts Sentry in the browser only (no-op without VITE_SENTRY_DSN). */
function SentryInit() {
  useEffect(() => {
    initSentry();
  }, []);
  return null;
}

const APP_NAME = "XDruid I";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "One fenced yard. Farm, fish, and train magic on the courtyard.",
      },
      { name: "theme-color", content: "#24301c" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})})}",
          }}
        />
      </head>
      <body>
        <SentryInit />
        <PreviewHostBridge />
        <AuthProvider>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
