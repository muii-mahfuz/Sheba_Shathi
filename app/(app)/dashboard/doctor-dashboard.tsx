"use client";

import { CheckCheck, Inbox, Star, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { ConsultationRow } from "@/components/consultation-row";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/link-button";
import { StatTile } from "@/components/stat-tile";
import { Switch } from "@/components/ui/switch";
import { useConsultations, useDoctorProfile, useUpdateDoctorProfile } from "@/hooks/queries";
import { fill, formatNumber } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import { SEVERITY_ORDER, type ConsultationView, type User } from "@/lib/types";

/** Most urgent first — the only sort order that makes sense for a clinical queue. */
function bySeverityThenAge(a: ConsultationView, b: ConsultationView): number {
  const diff = SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity);
  return diff !== 0 ? diff : a.requestedAt.localeCompare(b.requestedAt);
}

export function DoctorDashboard({ user }: { user: User }) {
  const t = useT();
  const { locale } = useLocale();
  const { data: profile } = useDoctorProfile();
  const { data: consultations } = useConsultations();
  const updateProfile = useUpdateDoctorProfile();

  const all = consultations?.items ?? [];
  const requests = all.filter((c) => c.status === "requested").sort(bySeverityThenAge);
  const live = all.filter((c) => c.status === "active" || c.status === "accepted");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const completedToday = all.filter(
    (c) => c.status === "completed" && c.endedAt && new Date(c.endedAt) >= startOfToday,
  ).length;

  const available = profile?.isAvailable ?? false;

  return (
    <div className="space-y-6">
      <section className="ecg-paper overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-5 px-6 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {fill(t.dashboard.doctorGreeting, { name: user.name })}
            </h1>
            <p className="text-muted-foreground">{t.dashboard.doctorSubtitle}</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-3">
            <Switch
              id="availability"
              checked={available}
              onCheckedChange={(checked) =>
                updateProfile.mutate(
                  { isAvailable: checked },
                  {
                    onSuccess: () =>
                      toast.success(checked ? t.dashboard.availableOn : t.dashboard.availableOff),
                  },
                )
              }
            />
            <label htmlFor="availability" className="cursor-pointer text-sm font-medium">
              {t.dashboard.availableToggle}
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t.dashboard.pendingRequests}
          value={formatNumber(requests.length, locale)}
          icon={Inbox}
          tone={requests.length > 0 ? "text-marigold" : undefined}
        />
        <StatTile
          label={t.dashboard.liveConsultations}
          value={formatNumber(live.length, locale)}
          icon={CheckCheck}
          tone={live.length > 0 ? "text-live" : undefined}
        />
        <StatTile
          label={t.dashboard.completedToday}
          value={formatNumber(completedToday, locale)}
          icon={CheckCheck}
        />
        <StatTile
          label={t.dashboard.avgRating}
          value={profile ? profile.rating.toFixed(1) : "—"}
          icon={Star}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">{t.dashboard.pendingRequests}</h2>
            <p className="text-xs text-muted-foreground">{t.dashboard.queueBySeverity}</p>
          </div>

          {requests.length === 0 ? (
            <EmptyState icon={Inbox} title={t.dashboard.noPendingRequests} />
          ) : (
            <div className="space-y-2.5">
              {requests.map((consultation) => (
                <ConsultationRow
                  key={consultation.id}
                  consultation={consultation}
                  viewerRole="doctor"
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{t.dashboard.liveConsultations}</h2>
          {live.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
              {t.consultations.empty}
            </p>
          ) : (
            <div className="space-y-2.5">
              {live.map((consultation) => (
                <ConsultationRow
                  key={consultation.id}
                  consultation={consultation}
                  viewerRole="doctor"
                />
              ))}
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t.dashboard.totalPatients}
            </p>
            <p className="tabular flex items-center gap-2 pt-1 text-2xl font-semibold">
              <UsersRound className="size-5 text-muted-foreground" />
              {profile ? formatNumber(profile.consultationCount, locale) : "—"}
            </p>
            <LinkButton variant="ghost" size="sm" className="mt-2 px-0" href="/patients">
              {t.common.viewAll}
            </LinkButton>
          </div>
        </section>
      </div>
    </div>
  );
}
