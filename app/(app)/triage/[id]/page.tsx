"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Phone, RotateCcw } from "lucide-react";
import { useParams } from "next/navigation";
import { AiBadge } from "@/components/ai-badge";
import { LinkButton } from "@/components/link-button";
import { SeveritySpine } from "@/components/severity-spine";
import { StatusBadge } from "@/components/status-badge";
import { useTriage } from "@/hooks/queries";
import { fill } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import { severityTone } from "@/lib/status";
import { cn } from "@/lib/utils";

export default function TriageResultPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const { data: assessment, isLoading, isError } = useTriage(params.id);

  if (isLoading) return <ResultSkeleton />;
  if (isError || !assessment) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <h1 className="font-heading text-2xl font-semibold">{t.errors.notFound}</h1>
        <p className="text-sm text-muted-foreground">{t.errors.notFoundBody}</p>
        <LinkButton href="/triage">{t.triage.checkAgain}</LinkButton>
      </div>
    );
  }

  const isEmergency = assessment.severity === "critical";
  const homeCare = assessment.homeCare;
  const isHomeCare = assessment.severity === "mild" && Boolean(homeCare);
  const specialty = assessment.recommendedSpecialties[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t.triage.resultTitle}</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.severity[assessment.severity]}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <AiBadge source={assessment.source} model={assessment.model} />
          <StatusBadge tone={severityTone(assessment.severity)} label={t.urgency[assessment.urgency]} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-5">
          <section className={cn("rounded-2xl border p-6", isEmergency ? "border-critical/40 bg-critical-soft/40" : "border-border bg-card")}>
            <div className="flex gap-4">
              {isEmergency ? <AlertTriangle className="mt-1 size-6 shrink-0 text-critical" /> : <CheckCircle2 className="mt-1 size-6 shrink-0 text-primary" />}
              <div className="space-y-2">
                <h2 className="font-heading text-xl font-semibold">
                  {isEmergency ? t.triage.emergencyTitle : isHomeCare ? t.triage.homeCareTitle : t.triage.seeDoctorTitle}
                </h2>
                <p className="leading-relaxed text-muted-foreground">{assessment.summary}</p>
              </div>
            </div>
            {isEmergency ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="tel:999" className="inline-flex h-9 items-center gap-2 rounded-lg bg-critical px-3 text-sm font-medium text-white hover:bg-critical/85">
                  <Phone className="size-4" /> {t.triage.emergencyCall}
                </a>
                <LinkButton href="/triage" variant="outline" size="sm"><RotateCcw className="size-4" />{t.triage.checkAgain}</LinkButton>
              </div>
            ) : !isHomeCare ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton href={`/doctors${specialty ? `?specialty=${specialty}&triage=${assessment.id}` : `?triage=${assessment.id}`}`}>
                  {t.triage.findDoctor} <ArrowRight className="size-4" />
                </LinkButton>
                <LinkButton href="/triage" variant="outline"><RotateCcw className="size-4" />{t.triage.checkAgain}</LinkButton>
              </div>
            ) : null}
          </section>

          {assessment.redFlags.length > 0 && (
            <section className="rounded-xl border border-severe/30 bg-severe-soft/40 p-5">
              <h2 className="font-heading text-lg font-semibold">{t.triage.redFlagsTitle}</h2>
              <ul className="mt-3 space-y-2">
                {assessment.redFlags.map((flag) => <li key={flag} className="flex gap-2 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-severe" />{t.redFlag[flag as keyof typeof t.redFlag] ?? flag}</li>)}
              </ul>
            </section>
          )}

          {isHomeCare && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">{t.triage.homeCareTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.triage.homeCareIntro}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {homeCare?.steps.map((step) => <li key={step} className="rounded-lg bg-muted px-3 py-2 text-sm">{t.homeCareStep[step as keyof typeof t.homeCareStep] ?? step}</li>)}
              </ul>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm font-medium">{t.triage.watchForTitle}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{homeCare?.watchFor.map((item) => <li key={item}>• {t.watchFor[item as keyof typeof t.watchFor] ?? item}</li>)}</ul>
                <p className="mt-3 text-xs text-muted-foreground">{fill(t.triage.reviewAfter, { hours: homeCare?.reviewAfterHours ?? 48 })}</p>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">{t.triage.whatWeUnderstood}</h2>
            <p className="mt-3 text-sm leading-relaxed">{assessment.intake.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">{assessment.intake.symptoms.map((symptom) => <span key={symptom} className="rounded-full bg-muted px-2.5 py-1 text-xs">{t.symptom[symptom as keyof typeof t.symptom] ?? symptom}</span>)}</div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5"><SeveritySpine severity={assessment.severity} /></section>
          {assessment.recommendedSpecialties.length > 0 && <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-heading font-semibold">{t.triage.recommendedSpecialties}</h2><div className="mt-3 space-y-2">{assessment.recommendedSpecialties.map((item) => <Link key={item} href={`/doctors?specialty=${item}&triage=${assessment.id}`} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm hover:bg-accent">{t.specialty[item]}<ArrowRight className="size-4 text-muted-foreground" /></Link>)}</div></section>}
          {assessment.suggestedTests.length > 0 && <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-heading font-semibold">{t.triage.suggestedTests}</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{assessment.suggestedTests.map((item) => <li key={item}>• {item}</li>)}</ul></section>}
          <p className="text-xs leading-relaxed text-muted-foreground">{t.ai.triageDisclaimer}</p>
        </aside>
      </div>
    </div>
  );
}

function ResultSkeleton() { return <div className="space-y-5"><div className="h-10 w-64 animate-pulse rounded-lg bg-muted" /><div className="grid gap-5 lg:grid-cols-[1fr_260px]"><div className="h-64 animate-pulse rounded-2xl bg-muted" /><div className="h-72 animate-pulse rounded-xl bg-muted" /></div></div>; }
