"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { OfferCard } from "@/components/OfferCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { HeartIcon, ShieldIcon } from "@/components/Icons";
import { api } from "@/lib/api";
import type { Offer } from "@/lib/types";
import { useSavedOffers } from "@/lib/saved-store";
import { useAuth } from "@/lib/auth-context";

export default function SavedPage() {
  return (
    <AppShell>
      <SavedInner />
    </AppShell>
  );
}

function SavedInner() {
  const { ids, isAuthed } = useSavedOffers();
  const { token } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Mode connecté : un seul appel /api/saved (JOIN côté DB)
    if (isAuthed && token) {
      api
        .getSavedOffers(token)
        .then((data) => {
          if (!cancelled) setOffers(data);
        })
        .catch(() => {
          if (!cancelled) setOffers([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    // Mode visiteur : on récupère chaque offre depuis localStorage ids
    if (ids.length === 0) {
      setOffers([]);
      setLoading(false);
      return;
    }
    Promise.allSettled(ids.map((id) => api.getOffer(id))).then((res) => {
      if (cancelled) return;
      const ok: Offer[] = [];
      for (const r of res) {
        if (r.status === "fulfilled") ok.push(r.value);
      }
      setOffers(ok);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ids, isAuthed, token]);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
          {"// favoris"}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Offres sauvegardées
        </h1>
        <p className="mt-1 text-slate-muted flex items-center gap-2 flex-wrap">
          <span>
            {ids.length} offre{ids.length > 1 ? "s" : ""} dans vos favoris.
          </span>
        </p>
      </header>

      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : offers.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-flame-500/10 flex items-center justify-center text-flame-500">
              <HeartIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">
              Pas encore de favoris
            </h2>
            <p className="mt-2 text-sm text-slate-muted max-w-sm mx-auto">
              Cliquez sur le cœur depuis n&apos;importe quelle offre pour la
              garder ici.
            </p>
            <Link href="/offers" className="btn btn-primary mt-5">
              Explorer les offres
            </Link>
          </div>
        ) : (
          offers.map((o) => <OfferCard key={o.id} offer={o} />)
        )}
      </div>
    </div>
  );
}
