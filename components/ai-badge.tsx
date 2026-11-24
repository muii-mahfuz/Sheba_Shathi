"use client";

import { Sparkles, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fill } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import type { AiSource } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Marks anything the AI produced, and says which path produced it.
 *
 * The distinction is not decoration. A reader deciding how much weight to put
 * on a suggestion deserves to know whether a model looked at it or a rule table
 * did, and a system that hides its own degradation is worse than one that never
 * degraded gracefully at all.
 */
export function AiBadge({
  source,
  model,
  className,
}: {
  source: AiSource;
  model?: string;
  className?: string;
}) {
  const t = useT();
  const offline = source === "fallback";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.7rem] font-medium",
              offline
                ? "border-border bg-muted text-muted-foreground"
                : "border-primary/25 bg-accent text-accent-foreground",
              className,
            )}
          />
        }
      >
        {offline ? <WifiOff className="size-3" /> : <Sparkles className="size-3" />}
        {t.ai.label}
      </TooltipTrigger>
      <TooltipContent>
        {offline ? t.ai.sourceFallback : fill(t.ai.sourceModel, { model: model ?? "Gemma" })}
      </TooltipContent>
    </Tooltip>
  );
}

/** The standing caveat that sits under any AI output shown to a reader. */
export function AiDisclaimer({ children, className }: { children: string; className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>{children}</p>
  );
}
