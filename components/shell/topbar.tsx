"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, RotateCcw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResetDemo } from "@/hooks/queries";
import { useT } from "@/lib/i18n/provider";
import type { User } from "@/lib/types";
import { useSessionStore } from "@/store/session";
import { LanguageToggle } from "./language-toggle";
import { NotificationsMenu } from "./notifications-menu";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ user, onOpenNav }: { user: User; onOpenNav: () => void }) {
  const t = useT();
  const router = useRouter();
  const signOut = useSessionStore((s) => s.signOut);
  const resetDemo = useResetDemo();

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="sm"
        className="px-2 lg:hidden"
        onClick={onOpenNav}
        aria-label={t.common.viewAll}
      >
        <Menu className="size-4" />
      </Button>

      <div className="flex-1" />

      <LanguageToggle />
      <ThemeToggle />
      <NotificationsMenu />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="gap-2 px-1.5 sm:px-2" />}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
          <span className="hidden max-w-32 truncate text-sm sm:block">
            {user.role === "doctor" ? `Dr. ${user.name}` : user.name}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem render={<Link href="/profile" />}>
            <UserRound className="size-4" />
            {t.common.profile}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              resetDemo.mutate(undefined, { onSuccess: () => toast.success(t.demo.resetDone) })
            }
          >
            <RotateCcw className="size-4" />
            {t.demo.reset}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
          >
            <LogOut className="size-4" />
            {t.common.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
