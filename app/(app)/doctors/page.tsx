"use client";

import { Search, SlidersHorizontal, Star, Stethoscope } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LinkButton } from "@/components/link-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDoctors } from "@/hooks/queries";
import { fill, formatMoney } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import { SPECIALTIES, type Specialty } from "@/lib/types";

export default function DoctorsPage() {
  const t = useT();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get("specialty") as Specialty | null;
  const triage = searchParams.get("triage");
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState<Specialty | undefined>(initialSpecialty ?? undefined);
  const [availableOnly, setAvailableOnly] = useState(true);
  const { data, isLoading } = useDoctors({ search, specialty, availableOnly, pageSize: 20 });

  return <div className="space-y-6"><PageHeader title={t.doctors.title} description={t.doctors.subtitle} />
    <div className="grid gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-[1fr_190px_auto]
      "><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.doctors.searchPlaceholder} className="pl-9" /></div>
      <Select value={specialty ?? "all"} onValueChange={(value) => setSpecialty(value === "all" ? undefined : value as Specialty)}><SelectTrigger><SelectValue placeholder={t.doctors.specialtyFilter} /></SelectTrigger><SelectContent><SelectItem value="all">{t.common.all}</SelectItem>{SPECIALTIES.map((item) => <SelectItem key={item} value={item}>{t.specialty[item]}</SelectItem>)}</SelectContent></Select>
      <button type="button" aria-pressed={availableOnly} onClick={() => setAvailableOnly((value) => !value)} className={`inline-flex h-8 items-center justify-center gap-2 rounded-lg border px-3 text-sm ${availableOnly ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}><SlidersHorizontal className="size-4" />{t.doctors.availableOnly}</button>
    </div>
    {triage && specialty && <p className="text-sm text-muted-foreground">{fill(t.doctors.matchedFor, { specialty: t.specialty[specialty] })}</p>}
    {isLoading ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />)}</div> : !data?.items.length ? <EmptyState icon={Stethoscope} title={t.doctors.noResults} /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.items.map((doctor) => <article key={doctor.id} className="flex flex-col rounded-xl border border-border bg-card p-5"><div className="flex items-start gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-heading font-semibold text-secondary-foreground">{doctor.name.split(" ").map((part) => part[0]).slice(0,2).join("")}</div><div className="min-w-0"><h2 className="truncate font-heading font-semibold">Dr. {doctor.name}</h2><p className="truncate text-xs text-muted-foreground">{doctor.hospital}</p><div className="mt-1 flex items-center gap-1 text-xs"><Star className="size-3.5 fill-marigold text-marigold" />{doctor.rating.toFixed(1)} <span className="text-muted-foreground">({doctor.ratingCount})</span></div></div></div><div className="mt-4 flex flex-wrap gap-1.5">{doctor.specialties.map((item) => <span key={item} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t.specialty[item]}</span>)}</div><p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{doctor.bio}</p><div className="mt-auto flex items-end justify-between gap-3 pt-5"><div><p className="text-xs text-muted-foreground">{t.doctors.fee}</p><p className="font-semibold">{formatMoney(doctor.consultationFee, locale)}</p><p className="mt-1 text-xs text-live">{doctor.isAvailable ? t.doctors.available : t.doctors.unavailable}</p></div><LinkButton href={`/doctors/${doctor.id}${triage ? `?triage=${triage}` : ""}`} size="sm">{t.common.view}</LinkButton></div></article>)}</div>}
  </div>;
}
