"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

export function ThemeToggle() {
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  // The server can't know the resolved theme, so the icon waits for mount
  // rather than rendering a sun that flips to a moon on hydration.
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const dark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-2"
      aria-label={t.common.theme}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {mounted && dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
