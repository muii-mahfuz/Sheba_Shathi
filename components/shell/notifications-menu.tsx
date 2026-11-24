"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/queries";
import { fill, formatRelative } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Where a notification takes you when you act on it. */
function hrefFor(notification: AppNotification): string {
  if (notification.prescriptionId) return `/prescriptions/${notification.prescriptionId}`;
  if (notification.consultationId) return `/consultations/${notification.consultationId}`;
  return "/dashboard";
}

export function NotificationsMenu() {
  const t = useT();
  const { locale } = useLocale();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="relative px-2" aria-label={t.common.notifications} />
        }
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="tabular absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-marigold text-[0.6rem] font-bold text-marigold-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-sm font-semibold">{t.common.notifications}</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-1.5 py-1 text-xs"
              onClick={() => markAll.mutate()}
            >
              {t.common.markAllRead}
            </Button>
          )}
        </div>

        <div className="max-h-88 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t.common.noNotifications}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={hrefFor(notification)}
                    onClick={() => {
                      if (!notification.read) markRead.mutate(notification.id);
                    }}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-accent/60",
                      !notification.read && "bg-accent/35",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        notification.read ? "bg-transparent" : "bg-marigold",
                      )}
                    />
                    <span className="space-y-0.5">
                      <span className="block text-sm leading-snug">
                        {fill(t.notification[notification.kind], notification.params)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatRelative(notification.createdAt, locale, t.common.justNow)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
