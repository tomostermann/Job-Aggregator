"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { SectionHeader } from "@/components/SectionHeader";
import { OfferRow } from "@/components/OfferCard";
import { SkeletonCard, SkeletonStat } from "@/components/SkeletonCard";
import {
  BriefcaseIcon,
  SparklesIcon,
  HeartIcon,
  ArrowRightIcon,
} from "@/components/Icons";
import { api } from "@/lib/api";
import type { Offer } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useSavedOffers } from "@/lib/saved-store";
import { displayUserName } from "@/lib/format";

const PREVIEW_COUNT = 4;

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { user, token } = useAuth();
  const { ids: savedIds, isAuthed } = useSavedOffers();
  const [total, setTotal] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(true);
  const [savedOffers, setSavedOffers] = useState<Offer[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingTotal(true);
    api
      .listOffers({ size: 1 })
      .then((res) => {
        if (cancelled) return;
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoadingTotal(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingSaved(true);

    if (isAuthed && token) {
      api
        .getSavedOffers(token)
        .then((data) => {
          if (!cancelled) setSavedOffers(data);
        })
        .catch(() => {
          if (!cancelled) setSavedOffers([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingSaved(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (savedIds.length === 0) {
      setSavedOffers([]);
      setLoadingSaved(false);
      return;
    }
    Promise.allSettled(savedIds.map((id) => api.getOffer(id))).then((res) => {
      if (cancelled) return;
      const ok: Offer[] = [];
      for (const r of res) {
        if (r.status === "fulfilled") ok.push(r.value);
      }
      setSavedOffers(ok);
      setLoadingSaved(false);
    });
    return () => {
      cancelled = true;
    };
  }, [savedIds, isAuthed, token]);

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
                ? "Retrouvez vos offres sauvegardées et l'activité du marché."
                : "Aperçu public du marché tech. Connectez-vous pour postuler ou créer une annonce."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/offers" className="btn btn-secondary shrink-0">
              Voir toutes les offres
            </Link>
            {user ? (
              <Link href="/offers/new" className="btn btn-primary shrink-0">
                <SparklesIcon className="h-4 w-4" />
                Créer une annonce
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary shrink-0">
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loadingTotal ? (
          <>
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
          title="Mes favoris"
          icon={<HeartIcon className="h-5 w-5" />}
          action={
            savedOffers.length > PREVIEW_COUNT ? (
              <Link
                href="/saved"
                className="text-xs text-ink-700 font-semibold hover:underline"
              >
                Voir tout →
              </Link>
            ) : null
          }
        />
        {loadingSaved ? (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : savedOffers.length === 0 ? (
          <EmptyFavorites authed={!!user} />
        ) : (
          <div className="space-y-1">
            {savedOffers.slice(0, PREVIEW_COUNT).map((offer) => (
              <OfferRow key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyFavorites({ authed }: { authed: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-line p-8 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-ink-50 flex items-center justify-center text-ink-700 mb-3">
        <HeartIcon className="h-5 w-5" />
      </div>
      <div className="font-display font-bold text-lg">
        Aucune offre sauvegardée
      </div>
      <p className="mt-2 text-sm text-slate-muted max-w-sm mx-auto">
        {authed
          ? "Parcourez les offres et cliquez sur le cœur pour les ajouter à vos favoris."
          : "Connectez-vous pour synchroniser vos favoris sur votre compte."}
      </p>
      <Link href="/offers" className="btn btn-secondary mt-4 inline-flex">
        Parcourir les offres
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
