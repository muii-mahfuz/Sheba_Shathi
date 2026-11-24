"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { usePrescriptions } from "@/hooks/queries";
import { formatDate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";

export default function PrescriptionsPage() { const t = useT(); const { locale } = useLocale(); const { data, isLoading } = usePrescriptions(); return <div className="space-y-6"><PageHeader title={t.prescription.title} description={t.prescription.subtitle} />{isLoading ? <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div> : !data?.items.length ? <EmptyState icon={FileText} title={t.prescription.empty} /> : <div className="grid gap-3 md:grid-cols-2">{data.items.map((prescription) => <Link key={prescription.id} href={`/prescriptions/${prescription.id}`} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/35 hover:bg-accent/40"><div className="flex items-start justify-between gap-3"><FileText className="size-5 text-primary" /><span className="font-mono text-xs text-muted-foreground">{prescription.serial}</span></div><h2 className="mt-4 font-heading font-semibold">{prescription.diagnosis}</h2><p className="mt-1 text-sm text-muted-foreground">Dr. {prescription.doctorName}</p><p className="mt-3 text-xs text-muted-foreground">{formatDate(prescription.issuedAt, locale)} · {prescription.medicines.length} {t.prescription.medicines.toLowerCase()}</p></Link>)}</div>}</div>; }
