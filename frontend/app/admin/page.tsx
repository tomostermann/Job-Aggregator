"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { SectionHeader } from "@/components/SectionHeader";
import { OfferRow } from "@/components/OfferCard";
import { SkeletonStat, SkeletonCard } from "@/components/SkeletonCard";
import { ContractDistribution, OffersPerMonth } from "@/components/Charts";
import {
  BriefcaseIcon,
  UsersIcon,
  DatabaseIcon,
  RefreshIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  ChartIcon,
  ShieldIcon,
} from "@/components/Icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Offer } from "@/lib/types";
import { useToast } from "@/lib/toast-context";

export default function AdminPage() {
  return (
    <AppShell requireRole="admin">
      <AdminInner />
    </AppShell>
  );
}

function AdminInner() {
  const { token } = useAuth();
  const { push } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<{
    offersTotal: number;
    companiesTotal: number;
    recentOffersCount: number;
    offersPerMonth: { key: string; count: number }[];
    contractDistribution: { type: string; count: number }[];
  } | null>(null);
  const [usersTotal, setUsersTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [offersRes, statsRes, users] = await Promise.allSettled([
        api.listOffers({ size: 6 }),
        api.adminStats(token, 6),
        api.adminUsers(token),
      ]);
      if (offersRes.status === "fulfilled") {
        setOffers(offersRes.value.data);
      } else {
        push(offersRes.reason?.message ?? "Erreur offres", "error");
      }
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      } else {
        push(statsRes.reason?.message ?? "Erreur stats", "error");
      }
      if (users.status === "fulfilled") {
        setUsersTotal(users.value.length);
      } else {
        setUsersTotal(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const launchIngest = async () => {
    if (!token) return;
    setIngesting(true);
    try {
      const result = await api.triggerIngest(token);
      push(
        `Ingestion ok : ${result.inserted ?? 0} insérée(s), ${result.skipped ?? 0} doublons`,
        "success",
      );
      await loadAll();
    } catch (err) {
      push(
        err instanceof Error ? err.message : "Échec de l'ingestion",
        "error",
      );
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
            {"// console admin"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            Vue d&apos;ensemble
          </h1>
          <p className="mt-1 text-slate-muted">
            Pilotage de la plateforme : modération des offres, gestion des
            utilisateurs, ingestion des sources.
          </p>
        </div>
        <button
          type="button"
          onClick={launchIngest}
          disabled={ingesting}
          className="btn btn-primary"
        >
          <RefreshIcon
            className={`h-4 w-4 ${ingesting ? "animate-spin" : ""}`}
          />
          {ingesting ? "Ingestion en cours…" : "Lancer une ingestion"}
        </button>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <StatCard
              label="Offres totales"
              value={(stats?.offersTotal ?? 0).toLocaleString("fr-FR")}
              hint={`+${stats?.recentOffersCount ?? 0} sur 7 jours`}
              icon={<BriefcaseIcon className="h-4 w-4" />}
              tone="ink"
            />
            <StatCard
              label="Entreprises"
              value={(stats?.companiesTotal ?? 0).toLocaleString("fr-FR")}
              hint="dans la base"
              icon={<DatabaseIcon className="h-4 w-4" />}
              tone="mint"
            />
            <StatCard
              label="Utilisateurs"
              value={
                usersTotal !== null ? usersTotal.toLocaleString("fr-FR") : "—"
              }
              hint="comptes inscrits"
              icon={<UsersIcon className="h-4 w-4" />}
              tone="amber"
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <SectionHeader
            title="Dernières offres ingérées"
            icon={<RefreshIcon className="h-5 w-5" />}
            action={
              <Link
                href="/admin/offers"
                className="text-xs text-ink-700 font-semibold hover:underline"
              >
                Tout modérer →
              </Link>
            }
          />
          {loading ? (
            <div className="space-y-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-line p-8 text-center text-sm text-slate-muted">
              Aucune offre encore. Lancez une ingestion ↑
            </div>
          ) : (
            <div className="space-y-1">
              {offers.slice(0, 6).map((o) => (
                <OfferRow key={o.id} offer={o} />
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <SectionHeader
            title="Répartition contrats"
            icon={<ChartIcon className="h-5 w-5" />}
          />
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-4" />
              <div className="skeleton h-4" />
              <div className="skeleton h-4" />
            </div>
          ) : (
            <ContractDistribution data={stats?.contractDistribution ?? []} />
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <SectionHeader
            title="Offres par mois"
            icon={<TrendingUpIcon className="h-5 w-5" />}
          />
          {loading ? (
            <div className="skeleton h-44" />
          ) : (
            <OffersPerMonth data={stats?.offersPerMonth ?? []} />
          )}
        </div>

        <div className="card p-6 flex flex-col">
          <SectionHeader
            title="Pilotage rapide"
            icon={<ShieldIcon className="h-5 w-5" />}
          />
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/admin/offers"
              className="rounded-xl border border-slate-line hover:border-ink-300 hover:bg-ink-50 p-4 group transition flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-700">
                <BriefcaseIcon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="font-semibold">Modérer les offres</div>
                <div className="text-xs text-slate-muted">
                  Supprimer les ghost jobs et doublons
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-muted group-hover:text-ink-700" />
            </Link>
            <Link
              href="/admin/users"
              className="rounded-xl border border-slate-line hover:border-ink-300 hover:bg-ink-50 p-4 group transition flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-700">
                <UsersIcon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="font-semibold">Gérer les utilisateurs</div>
                <div className="text-xs text-slate-muted">
                  Promouvoir / révoquer / supprimer
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-muted group-hover:text-ink-700" />
            </Link>
            <Link
              href="/admin/ingest"
              className="rounded-xl border border-slate-line hover:border-ink-300 hover:bg-ink-50 p-4 group transition flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-700">
                <DatabaseIcon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="font-semibold">Ingestion data</div>
                <div className="text-xs text-slate-muted">
                  Logs, déclencheurs, statut
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-muted group-hover:text-ink-700" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
