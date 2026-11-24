"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardPlus,
  FileText,
  MessagesSquare,
  TriangleAlert,
} from "lucide-react";
import { ConsultationRow } from "@/components/consultation-row";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/link-button";
import { useConsultations, usePatientProfile, usePrescriptions } from "@/hooks/queries";
import { fill, formatDate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { User } from "@/lib/types";

export function PatientDashboard({ user }: { user: User }) {
  const t = useT();
  const { locale } = useLocale();
  const { data: profile } = usePatientProfile();
  const { data: consultations } = useConsultations();
  const { data: prescriptions } = usePrescriptions();

  const all = consultations?.items ?? [];
  const live = all.find((c) => c.status === "active" || c.status === "accepted");
  const recent = all.filter((c) => c.id !== live?.id).slice(0, 3);
  const latestPrescription = prescriptions?.items?.[0];

  const recordIsEmpty =
    profile &&
    profile.allergies.length === 0 &&
    profile.chronicConditions.length === 0 &&
    profile.currentMedications.length === 0;

  return (
    <div className="space-y-6">
      {/* The one thing this screen is for. Everything else is history. */}
      <section className="ecg-paper overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-5 px-6 py-7 sm:px-8 sm:py-9 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {fill(t.dashboard.patientGreeting, { name: user.name.split(" ")[0] })}
            </h1>
            <p className="max-w-md text-muted-foreground">{t.dashboard.patientSubtitle}</p>
          </div>
          <LinkButton size="lg" className="shrink-0 gap-2" href="/triage">
            <ClipboardPlus className="size-4" />
            {t.dashboard.startTriage}
          </LinkButton>
        </div>
      </section>

      {live && (
        <section className="rounded-xl border border-live/35 bg-live-soft px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="pulse-dot relative mt-0.5 inline-block size-2 rounded-full bg-live" />
              <div>
                <p className="font-medium text-live">{t.dashboard.activeConsultation}</p>
                <p className="text-sm text-muted-foreground">
                  {fill(t.dashboard.activeConsultationHint, {
                    doctor: `Dr. ${live.doctor.name}`,
                  })}
                </p>
              </div>
            </div>
            <LinkButton size="sm" className="gap-1.5" href={`/consultations/${live.id}`}>
              {t.dashboard.rejoin}
              <ArrowRight className="size-4" />
            </LinkButton>
          </div>
        </section>
      )}

      {recordIsEmpty && (
        <section className="flex flex-col gap-3 rounded-xl border border-dashed border-moderate/40 bg-moderate-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-moderate" />
            <div>
              <p className="font-medium text-moderate">{t.dashboard.completeProfile}</p>
              <p className="text-sm text-muted-foreground">{t.dashboard.completeProfileHint}</p>
            </div>
          </div>
          <LinkButton variant="outline" size="sm" href="/profile">
            {t.common.edit}
          </LinkButton>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">
              {t.dashboard.recentConsultations}
            </h2>
            {recent.length > 0 && (
              <LinkButton variant="ghost" size="sm" href="/consultations">
                {t.common.viewAll}
              </LinkButton>
            )}
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title={t.dashboard.noConsultations}
              action={
                <LinkButton size="sm" href="/triage">
                  {t.dashboard.startTriage}
                </LinkButton>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {recent.map((consultation) => (
                <ConsultationRow
                  key={consultation.id}
                  consultation={consultation}
                  viewerRole="patient"
                />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">
              {t.dashboard.latestPrescription}
            </h2>
            {latestPrescription ? (
              <Link
                href={`/prescriptions/${latestPrescription.id}`}
                className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="tabular text-xs text-muted-foreground">
                    {latestPrescription.serial}
                  </span>
                </div>
                <p className="pt-2 font-medium leading-snug">{latestPrescription.diagnosis}</p>
                <p className="pt-1 text-sm text-muted-foreground">
                  Dr. {latestPrescription.doctorName} · {formatDate(latestPrescription.issuedAt, locale)}
                </p>
              </Link>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
                {t.dashboard.noPrescriptions}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">{t.dashboard.yourRecord}</h2>
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <RecordLine label={t.dashboard.allergies} items={profile?.allergies ?? []} emphasis />
              <RecordLine label={t.dashboard.conditions} items={profile?.chronicConditions ?? []} />
              <RecordLine
                label={t.dashboard.medications}
                items={profile?.currentMedications ?? []}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Allergies get emphasis: it is the one line on this card whose absence can
 * cause harm, so it reads in the critical tone rather than as another grey list.
 */
function RecordLine({
  label,
  items,
  emphasis,
}: {
  label: string;
  items: string[];
  emphasis?: boolean;
}) {
  const t = useT();

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/70">{t.profile.noneRecorded}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className={
                emphasis
                  ? "rounded-md bg-critical-soft px-2 py-0.5 text-xs font-medium text-critical"
                  : "rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              }
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
