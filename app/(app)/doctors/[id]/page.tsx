"use client";

import { ArrowLeft, Clock3, Languages, MapPin, Star } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateConsultation, useDoctor } from "@/hooks/queries";
import { fill, formatMoney } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";

export default function DoctorDetailPage() {
  const t = useT(); const { locale } = useLocale(); const router = useRouter(); const params = useParams<{ id: string }>(); const search = useSearchParams();
  const { data: doctor, isLoading } = useDoctor(params.id); const create = useCreateConsultation(); const triageId = search.get("triage") ?? undefined; const [complaint, setComplaint] = useState("");
  if (isLoading) return <div className="h-72 animate-pulse rounded-xl bg-muted" />;
  if (!doctor) return <div className="space-y-4"><h1 className="font-heading text-2xl font-semibold">{t.errors.notFound}</h1><LinkButton href="/doctors">{t.common.back}</LinkButton></div>;
  const submit = () => { if (!complaint.trim()) return; create.mutate({ doctorId: doctor.id, triageId, chiefComplaint: complaint.trim() }, { onSuccess: (consultation) => { toast.success(fill(t.doctors.requestSent, { doctor: `Dr. ${doctor.name}` })); router.push(`/consultations/${consultation.id}`); } }); };
  return <div className="space-y-6"><LinkButton href="/doctors" variant="ghost" size="sm" className="-ml-2"><ArrowLeft className="size-4" />{t.common.back}</LinkButton><PageHeader title={`Dr. ${doctor.name}`} description={doctor.hospital} /><div className="grid gap-6 lg:grid-cols-[1fr_340px]"><main className="space-y-5"><section className="rounded-xl border border-border bg-card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm"><Star className="size-4 fill-marigold text-marigold" />{doctor.rating.toFixed(1)} <span className="text-muted-foreground">({doctor.ratingCount})</span></div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${doctor.isAvailable ? "bg-live-soft text-live" : "bg-muted text-muted-foreground"}`}>{doctor.isAvailable ? t.doctors.available : t.doctors.unavailable}</span></div><div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3"><Info icon={Clock3} label={t.doctors.respondsIn.replace("{minutes}", String(doctor.respondsInMinutes))} /><Info icon={MapPin} label={doctor.district} /><Info icon={Languages} label={doctor.languages.map((language) => language === "bn" ? "বাংলা" : "English").join(" · ")} /></div></section><section className="rounded-xl border border-border bg-card p-6"><h2 className="font-heading text-lg font-semibold">{t.doctors.qualifications}</h2><div className="mt-3 flex flex-wrap gap-2">{doctor.qualifications.map((item) => <span key={item} className="rounded-lg bg-muted px-3 py-2 text-sm">{item}</span>)}</div><p className="mt-4 text-sm text-muted-foreground">{t.doctors.registration}: <span className="font-mono text-foreground">{doctor.licenseNumber}</span></p></section></main><aside className="h-fit rounded-xl border border-primary/25 bg-card p-5"><h2 className="font-heading text-lg font-semibold">{t.doctors.requestTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{fill(t.doctors.requestBody, { doctor: `Dr. ${doctor.name}` })}</p><label htmlFor="complaint" className="mt-5 block text-sm font-medium">{t.doctors.chiefComplaintLabel}</label><Textarea id="complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder={t.doctors.chiefComplaintPlaceholder} rows={4} className="mt-2" /><p className="mt-4 text-sm text-muted-foreground">{t.doctors.fee}: <strong className="text-foreground">{formatMoney(doctor.consultationFee, locale)}</strong></p><Button className="mt-4 w-full" disabled={!complaint.trim() || create.isPending} onClick={submit}>{create.isPending ? t.doctors.requesting : t.doctors.sendRequest}</Button></aside></div></div>;
}

function Info({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) { return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4 text-primary" />{label}</div>; }
