"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SeverityMeter } from "@/components/severity-spine";
import { StatusBadge } from "@/components/status-badge";
import { fill, formatRelative } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import { consultationTone } from "@/lib/status";
import type { ConsultationView, Role } from "@/lib/types";
import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

/**
 * One consultation in a list. The counterpart is whoever the reader is *not* —
 * a patient sees the doctor's name, a doctor sees the patient's — so the same
 * row works on both sides of the product.
 */
export function ConsultationRow({
  consultation,
  viewerRole,
  className,
}: {
  consultation: ConsultationView;
  viewerRole: Role;
  className?: string;
}) {
  const t = useT();
  const { locale } = useLocale();

  const counterpart =
    viewerRole === "doctor"
      ? consultation.patient.name
      : `Dr. ${consultation.doctor.name}`;
  const unread =
    viewerRole === "doctor" ? consultation.unreadForDoctor : consultation.unreadForPatient;

  return (
    <Link
      href={`/consultations/${consultation.id}`}
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/35 hover:bg-accent/40",
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
        {initialsOf(counterpart.replace(/^Dr\.\s*/, ""))}
      </span>

      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{counterpart}</span>
          {viewerRole === "doctor" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground">
              {t.patientTag[consultation.patientTag]}
            </span>
          )}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {consultation.chiefComplaint}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
          <SeverityMeter severity={consultation.severity} />
          <span className="text-xs text-muted-foreground">
            {fill(t.consultations.requestedAt, {
              time: formatRelative(consultation.requestedAt, locale, t.common.justNow),
            })}
          </span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {unread > 0 && (
          <span className="tabular flex size-5 items-center justify-center rounded-full bg-marigold text-[0.65rem] font-bold text-marigold-foreground">
            {unread}
          </span>
        )}
        <StatusBadge
          tone={consultationTone(consultation.status)}
          label={t.consultationStatus[consultation.status]}
        />
        <ChevronRight className="size-4 text-muted-foreground" />
      </span>
    </Link>
  );
}
