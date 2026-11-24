"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useIsHydrated } from "@/store/session";

/** Entry point: straight to the dashboard if signed in, otherwise to sign-in. */
export default function RootPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const hydrated = useIsHydrated();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
