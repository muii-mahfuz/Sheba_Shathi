import { TONE_CLASSES } from "@/lib/status";
import type { StatusTone } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * One badge for every domain status in the app, coloured through the tone map
 * in lib/status.ts. A live status gets a pulsing dot — the only ambient motion
 * in the interface, reserved for the one state that is genuinely changing.
 */
export function StatusBadge({
  tone,
  label,
  className,
}: {
  tone: StatusTone;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {tone === "live" && (
        <span className="pulse-dot relative inline-block size-1.5 rounded-full bg-current" />
      )}
      {label}
    </span>
  );
}
