"use client";

import { Inbox } from "lucide-react";
import { ConsultationRow } from "@/components/consultation-row";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useConsultations } from "@/hooks/queries";
import { useT } from "@/lib/i18n/provider";

export default function RequestsPage() { const t = useT(); const { data, isLoading } = useConsultations("requested"); const requests = data?.items ?? []; return <div className="space-y-6"><PageHeader title={t.consultations.requestsTitle} description={t.consultations.requestsSubtitle} />{isLoading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : requests.length === 0 ? <EmptyState icon={Inbox} title={t.consultations.emptyRequests} /> : <div className="space-y-3">{requests.map((item) => <ConsultationRow key={item.id} consultation={item} viewerRole="doctor" />)}</div>}</div>; }
