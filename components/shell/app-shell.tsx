"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useConsultations } from "@/hooks/queries";
import { useT } from "@/lib/i18n/provider";
import { useCurrentUser, useIsHydrated } from "@/store/session";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";

/**
 * The authenticated frame: rail, topbar, content well.
 *
 * The guard waits for the session store to rehydrate before redirecting —
 * without that, every refresh of an authenticated page bounces to sign-in for
 * one frame before the persisted session comes back.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const user = useCurrentUser();
  const hydrated = useIsHydrated();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  // Unread counts on the rail come from the queue that's already polling, so
  // the badge and the list can never disagree.
  const { data: consultations } = useConsultations();
  const unreadByHref = useMemo(() => {
    const counts: Record<string, number> = {};
    const items = consultations?.items ?? [];
    if (!user) return counts;

    if (user.role === "doctor") {
      counts["/requests"] = items.filter((c) => c.status === "requested").length;
      counts["/consultations"] = items.reduce((sum, c) => sum + c.unreadForDoctor, 0);
    } else {
      counts["/consultations"] = items.reduce((sum, c) => sum + c.unreadForPatient, 0);
    }
    return counts;
  }, [consultations, user]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        <span className="sr-only">{t.common.loading}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">
          <SidebarNav role={user.role} unreadByHref={unreadByHref} />
        </div>
      </aside>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">{t.brand.name}</SheetTitle>
          <SidebarNav
            role={user.role}
            unreadByHref={unreadByHref}
            onNavigate={() => setNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onOpenNav={() => setNavOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
