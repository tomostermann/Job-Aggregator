"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { OffersPerMonth, ContractDistribution } from "@/components/Charts";
import { TrendingUpIcon, BriefcaseIcon } from "@/components/Icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const MONTHS_BACK = 12;

export default function AnalyticsPage() {
  return (
    <AppShell requireRole="admin">
      <AnalyticsInner />
    </AppShell>
  );
}

function AnalyticsInner() {
  const { token } = useAuth();
  const [stats, setStats] = useState<{
    offersPerMonth: { key: string; count: number }[];
    contractDistribution: { type: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .adminStats(token, MONTHS_BACK)
      .then((res) => {
        if (cancelled) return;
        setStats({
          offersPerMonth: res.offersPerMonth,
          contractDistribution: res.contractDistribution,
        });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
          {"// analytics"}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Analyse du marché
        </h1>
        <p className="mt-1 text-slate-muted">
          Visualisations sur l&apos;ensemble des offres ingérées.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5">
        <div className="card p-6">
          <SectionHeader
            title="Offres par mois"
            badge="DATA FEATURE"
            badgeVariant="data"
            icon={<TrendingUpIcon className="h-5 w-5" />}
            description={`Volume publié mensuellement sur les ${MONTHS_BACK} derniers mois.`}
          />
          {loading ? (
            <div className="skeleton h-44" />
          ) : (
            <OffersPerMonth
              data={stats?.offersPerMonth ?? []}
              monthsBack={MONTHS_BACK}
            />
          )}
        </div>
        <div className="card p-6">
          <SectionHeader
            title="Répartition des types de contrat"
            icon={<BriefcaseIcon className="h-5 w-5" />}
          />
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-4" />
              <div className="skeleton h-4" />
              <div className="skeleton h-4" />
            </div>
          ) : (
            <ContractDistribution
              data={stats?.contractDistribution ?? []}
            />
          )}
        </div>
      </section>
    </div>
  );
}
