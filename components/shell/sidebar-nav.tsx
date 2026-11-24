"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { useT } from "@/lib/i18n/provider";
import { isActive, navFor } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The chamber-ink rail. Nav is derived from the signed-in role rather than
 * rendered-then-hidden, so a patient's markup never contains a doctor's routes.
 */
export function SidebarNav({
  role,
  unreadByHref,
  onNavigate,
}: {
  role: Role;
  unreadByHref?: Record<string, number>;
  onNavigate?: () => void;
}) {
  const t = useT();
  const pathname = usePathname();
  const sections = navFor(role, t);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="ecg-paper ecg-paper-light border-b border-sidebar-border px-5 py-5">
        <Link href="/dashboard" onClick={onNavigate} className="inline-flex items-center gap-2.5">
          <BrandMark className="bg-sidebar-primary text-sidebar-primary-foreground" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold tracking-tight text-sidebar-accent-foreground">
              {t.brand.name}
            </span>
            <span className="text-[0.7rem] text-sidebar-foreground/70">{t.brand.tagline}</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isActive(pathname, item);
              const unread = unreadByHref?.[item.href] ?? 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  {/* The active marker is a marigold bar on the leading edge —
                      the one warm note on an otherwise cold rail. */}
                  <span
                    className={cn(
                      "h-5 w-[3px] shrink-0 rounded-full transition-colors",
                      active ? "bg-sidebar-primary" : "bg-transparent",
                    )}
                  />
                  <item.icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {unread > 0 && (
                    <span className="tabular rounded-full bg-sidebar-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-sidebar-primary-foreground">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
