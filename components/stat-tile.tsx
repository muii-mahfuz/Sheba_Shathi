import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Optional accent for the number — used to make a queue length feel urgent. */
  tone?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card px-4 py-3.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <p className={cn("tabular pt-1 text-2xl font-semibold", tone)}>{value}</p>
    </div>
  );
}
