"use client";

import Link from "next/link";
import { Search, UserRound, UsersRound } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { useMyPatients } from "@/hooks/queries";
import { fill, formatRelative } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";

export default function PatientsPage() { const t = useT(); const { locale } = useLocale(); const [search, setSearch] = useState(""); const { data, isLoading } = useMyPatients(search); return <div className="space-y-6"><PageHeader title={t.patients.title} description={t.patients.subtitle} /><div className="relative max-w-md"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.patients.searchPlaceholder} className="pl-9" /></div>{isLoading ? <div className="h-36 animate-pulse rounded-xl bg-muted" /> : !data?.items.length ? <EmptyState icon={UsersRound} title={t.patients.empty} /> : <div className="grid gap-3 md:grid-cols-2">{data.items.map((patient) => <Link key={patient.id} href={`/patients/${patient.id}`} className="rounded-xl border border-border bg-card p-5 hover:border-primary/35"><div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-secondary"><UserRound className="size-5 text-secondary-foreground" /></div><div className="min-w-0"><h2 className="font-heading font-semibold">{patient.name}</h2><p className="text-sm text-muted-foreground">{patient.age} · {patient.gender} · {patient.district}</p></div></div><div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>{fill(t.patients.consultationCount, { count: patient.consultationCount })}</span><span>{patient.lastVisitAt ? fill(t.patients.lastSeen, { time: formatRelative(patient.lastVisitAt, locale, t.common.justNow) }) : ""}</span></div>{patient.allergies.length > 0 && <p className="mt-3 rounded-md bg-critical-soft px-2 py-1 text-xs font-medium text-critical">{t.profile.allergiesLabel}: {patient.allergies.join(", ")}</p>}</Link>)}</div>}</div>; }
