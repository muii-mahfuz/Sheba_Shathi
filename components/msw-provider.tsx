"use client";

import { useEffect, useState } from "react";
import { API_MOCKING } from "@/lib/api-client";

/**
 * Boots the MSW worker before rendering the app, so no query ever races ahead
 * of the mock. When mocking is disabled, renders instantly.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!API_MOCKING);

  useEffect(() => {
    if (!API_MOCKING) return;
    let active = true;
    import("@/lib/mocks/browser").then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: "bypass", quiet: true });
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm">Opening the chamber…</p>
      </div>
    );
  }

  return <>{children}</>;
}
