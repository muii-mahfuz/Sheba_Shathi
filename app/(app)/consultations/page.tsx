"use client";

import { MessagesSquare } from "lucide-react";
import { ConsultationRow } from "@/components/consultation-row";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useConsultations } from "@/hooks/queries";
import { useRole } from "@/store/session";
import { useT } from "@/lib/i18n/provider";

export default function ConsultationsPage() {
  const t = useT(); const role = useRole(); const { data, isLoading } = useConsultations();
  const items = data?.items ?? [];
  return <div className="space-y-6"><PageHeader title={t.consultations.title} description={role === "doctor" ? t.consultations.subtitleD : t.consultations.subtitleP} />{isLoading ? <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div> : items.length === 0 ? <EmptyState icon={MessagesSquare} title={t.consultations.empty} /> : <div className="space-y-3">{items.map((item) => <ConsultationRow key={item.id} consultation={item} viewerRole={role ?? "patient"} />)}</div>}</div>;
}
