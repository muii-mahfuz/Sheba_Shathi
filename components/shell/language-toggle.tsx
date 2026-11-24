"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LOCALE_LABELS, LOCALE_SHORT_LABELS } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";

/**
 * Switches between বাংলা and English. A toggle rather than a menu: with exactly
 * two languages, a menu adds a click to reach the only other option.
 */
export function LanguageToggle() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const next = locale === "bn" ? "en" : "bn";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(next)}
            aria-label={`${t.common.language}: ${LOCALE_LABELS[next]}`}
            className="gap-1.5 px-2"
          />
        }
      >
        <Languages className="size-4" />
        <span className="text-xs font-semibold">{LOCALE_SHORT_LABELS[locale]}</span>
      </TooltipTrigger>
      <TooltipContent>{LOCALE_LABELS[next]}</TooltipContent>
    </Tooltip>
  );
}
