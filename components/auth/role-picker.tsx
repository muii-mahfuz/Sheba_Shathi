"use client";

import { Stethoscope, UserRound } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Patient or doctor. A two-option segmented control rather than a select: the
 * choice changes which half of the product you land in, so it should be visible
 * rather than folded into a dropdown.
 */
export function RolePicker({
  value,
  onChange,
  className,
}: {
  value: Role;
  onChange: (role: Role) => void;
  className?: string;
}) {
  const t = useT();

  const options: { role: Role; label: string; icon: typeof UserRound }[] = [
    { role: "patient", label: t.auth.patient, icon: UserRound },
    { role: "doctor", label: t.auth.doctor, icon: Stethoscope },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t.auth.iAmA}
      className={cn("grid grid-cols-2 gap-2 rounded-lg bg-muted p-1", className)}
    >
      {options.map(({ role, label, icon: Icon }) => {
        const selected = value === role;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(role)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
