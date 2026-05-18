"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { SectionHeader } from "@/components/SectionHeader";
import { OfferRow } from "@/components/OfferCard";
import { SkeletonCard, SkeletonStat } from "@/components/SkeletonCard";
import { BriefcaseIcon, SparklesIcon, HeartIcon } from "@/components/Icons";
import { api } from "@/lib/api";
import type { Offer } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useSavedOffers } from "@/lib/saved-store";
import { displayUserName } from "@/lib/format";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

// Requête générique utilisée pour les recommandations du dashboard
const DEFAULT_QUERY = "développeur web fullstack stage CDI";

function DashboardContent() {
  const { user } = useAuth();
  const { ids: savedIds } = useSavedOffers();
  const [total, setTotal] = useState(0);
  const [recommendations, setRecommendations] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Chargement en parallèle : total des offres + recommandations IA
    Promise.all([
      api.listOffers({ size: 1 }),
      api.recommendations(DEFAULT_QUERY, 4),
    ])
      .then(([list, iaResults]) => {
        if (cancelled) return;
        setTotal(list.total);
        setRecommendations(
          iaResults.map((r) => ({
            id: r.id,
            title: r.title,
            company: r.company,
            location: r.location,
            contract_type: r.contract_type,
            salary: r.salary,
            published_at: null,
            ai_score: r.ai_score,
          })),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const avgScore = recommendations.length
    ? Math.round(
        recommendations.reduce((sum, r) => sum + (r.ai_score ?? 0), 0) /
          recommendations.length,
      )
    : 0;

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
          {"// dashboard"}
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              {user
                ? `Bonjour ${displayUserName(user)} 👋`
                : "Tableau de bord 👋"}
            </h1>
            <p className="mt-1 text-slate-muted">
              {user
                ? "Voici vos recommandations du jour basées sur l'ensemble des offres ingérées."
                : "Aperçu public du marché tech. Connectez-vous pour postuler ou créer une annonce."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/offers" className="btn btn-secondary">
              Voir toutes les offres
            </Link>
            {user ? (
              <Link href="/offers/new" className="btn btn-primary">
                <SparklesIcon className="h-4 w-4" />
                Créer une annonce
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="card p-4 border-flame-500/30 bg-flame-500/5 text-flame-600 text-sm"
        >
          ⚠️ Impossible de charger les offres : {error}. Le backend tourne-t-il
          sur <code className="font-mono">{api.base}</code> ?
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <StatCard
              label="Offres actives"
              value={total.toLocaleString("fr-FR")}
              hint={`+ ${Math.max(0, Math.floor(total / 30))} ces 7 derniers jours`}
              icon={<BriefcaseIcon className="h-4 w-4" />}
              tone="ink"
            />
            <StatCard
              label="Score IA moyen"
              value={`${avgScore}%`}
              hint="sur vos recommandations"
              icon={<SparklesIcon className="h-4 w-4" />}
              tone="mint"
            />
            <StatCard
              label="Favoris"
              value={savedIds.length}
              hint="offres sauvegardées"
              icon={<HeartIcon className="h-4 w-4" />}
              tone="amber"
            />
          </>
        )}
      </section>

      <section className="card p-6">
        <SectionHeader
          title="Recommandations"
          icon={<SparklesIcon className="h-5 w-5" />}
          action={
            <Link
              href="/offers"
              className="text-xs text-ink-700 font-semibold hover:underline"
            >
              Voir tout →
            </Link>
          }
        />
        {loading ? (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recommendations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1">
            {recommendations.map((offer) => (
              <OfferRow key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-line p-8 text-center">
      <div className="font-display font-bold text-lg">
        Aucune offre pour l&apos;instant
      </div>
      <p className="mt-2 text-sm text-slate-muted">
        Lancez une ingestion depuis la console admin pour récupérer les offres
        WeLoveDevs.
      </p>
    </div>
  );
}
