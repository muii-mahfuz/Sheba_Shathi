"use client";

import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { SEVERITY_ORDER, type Severity } from "@/lib/types";

/**
 * The triage spine — this product's signature element.
 *
 * Severity is the thing every path in the app branches on, and it is *ordinal*:
 * "severe" is not another colour of "moderate", it is further along the same
 * scale. A badge would flatten that. So the scale is drawn as a ladder, read
 * bottom-up like a thermometer, with the rung you landed on filled solid, the
 * rungs beneath it filled faintly to show how far up you are, and the rungs
 * above left as outlines to show what the scale still holds.
 *
 * Bar width also grows with severity, so the shape alone carries the ranking
 * for anyone who can't separate the four hues.
 */

const RUNG_WIDTH: Record<Severity, string> = {
  mild: "w-[40%]",
  moderate: "w-[60%]",
  severe: "w-[80%]",
  critical: "w-full",
};

const RUNG_FILL: Record<Severity, string> = {
  mild: "bg-mild",
  moderate: "bg-moderate",
  severe: "bg-severe",
  critical: "bg-critical",
};

const RUNG_TEXT: Record<Severity, string> = {
  mild: "text-mild",
  moderate: "text-moderate",
  severe: "text-severe",
  critical: "text-critical",
};

const RUNG_BORDER: Record<Severity, string> = {
  mild: "border-mild/35",
  moderate: "border-moderate/35",
  severe: "border-severe/35",
  critical: "border-critical/35",
};

function rank(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

export function SeveritySpine({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const t = useT();
  const active = rank(severity);

  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      role="img"
      aria-label={`${t.triage.spineLabel}: ${t.severity[severity]} — ${t.severityAction[severity]}`}
    >
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {t.triage.spineLabel}
      </p>

      {/* Rendered mild-first but laid out in reverse, so the ladder climbs
          upward on screen the way a scale should. */}
      <div className="flex flex-col-reverse gap-1.5" aria-hidden>
        {SEVERITY_ORDER.map((step) => {
          const position = rank(step);
          const isActive = position === active;
          const isBelow = position < active;

          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 items-center rounded-md px-3 transition-[width] duration-500",
                  RUNG_WIDTH[step],
                  isActive && cn(RUNG_FILL[step], "text-white shadow-sm"),
                  isBelow && cn(RUNG_FILL[step], "opacity-25"),
                  !isActive && !isBelow && cn("border border-dashed bg-transparent", RUNG_BORDER[step]),
                )}
              >
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isActive && "text-white",
                    isBelow && "sr-only",
                    !isActive && !isBelow && cn(RUNG_TEXT[step], "opacity-55"),
                  )}
                >
                  {t.severity[step]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className={cn("pt-1 text-sm font-semibold", RUNG_TEXT[severity])}>
        {t.severityAction[severity]}
      </p>
    </div>
  );
}

/**
 * The same scale at list size — four bars of increasing height, filled up to
 * where this case sits. Legible in a queue row where a full ladder would not fit.
 */
export function SeverityMeter({
  severity,
  showLabel = true,
  className,
}: {
  severity: Severity;
  showLabel?: boolean;
  className?: string;
}) {
  const t = useT();
  const active = rank(severity);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="flex h-4 items-end gap-[3px]"
        role="img"
        aria-label={`${t.triage.spineLabel}: ${t.severity[severity]}`}
      >
        {SEVERITY_ORDER.map((step, index) => (
          <span
            key={step}
            aria-hidden
            className={cn(
              "w-[3px] rounded-full",
              index <= active ? RUNG_FILL[severity] : "bg-current opacity-20",
              index === 0 && "h-1.5",
              index === 1 && "h-2.5",
              index === 2 && "h-3.5",
              index === 3 && "h-4",
            )}
          />
        ))}
      </span>
      {showLabel && (
        <span className={cn("text-xs font-semibold", RUNG_TEXT[severity])}>
          {t.severity[severity]}
        </span>
      )}
    </span>
  );
}
