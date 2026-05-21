"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { OfferCard } from "@/components/OfferCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import {
  FilterPanel,
  FilterPanelMobile,
  type Filters,
} from "@/components/FilterPanel";
import {
  SearchIcon,
  SparklesIcon,
  RefreshIcon,
  ArrowRightIcon,
} from "@/components/Icons";
import { api } from "@/lib/api";
import type { Offer } from "@/lib/types";
import { computeOfferScore } from "@/lib/score";
import { useAuth } from "@/lib/auth-context";

type SortMode = "ia" | "recent" | "salary";

const PAGE_SIZE = 50;

export default function OffersPage() {
  return (
    <AppShell>
      <OffersInner />
    </AppShell>
  );
}

function OffersInner() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortMode>("ia");
  const [filters, setFilters] = useState<Filters>({
    contractTypes: [],
    location: "",
    remoteOnly: false,
    stageMin: "",
    stageMax: "",
  });

  // Debounce de la recherche
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset à la page 0 quand un filtre serveur change (q, location)
  useEffect(() => {
    setPage(0);
  }, [debounced, filters.location]);

  // Chargement (initial ou load more selon page)
  useEffect(() => {
    let cancelled = false;
    const isInitial = page === 0;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    api
      .listOffers({
        q: debounced || undefined,
        location: filters.location || undefined,
        size: PAGE_SIZE,
        page,
      })
      .then((res) => {
        if (cancelled) return;
        setTotal(res.total);
        setOffers((prev) => (isInitial ? res.data : [...prev, ...res.data]));
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, filters.location, page]);

  const filtered = useMemo(() => {
    const fMin = filters.stageMin ? Number(filters.stageMin) : null;
    const fMax = filters.stageMax ? Number(filters.stageMax) : null;
    const stageActive = fMin !== null || fMax !== null;
    return offers.filter((o) => {
      if (filters.contractTypes.length) {
        const ct = (o.contract_type ?? "").toLowerCase();
        const ok = filters.contractTypes.some((t) =>
          ct.includes(t.toLowerCase()),
        );
        if (!ok) return false;
      }
      if (filters.remoteOnly) {
        const hay = `${o.location ?? ""} ${o.description ?? ""}`.toLowerCase();
        if (!hay.includes("remote") && !hay.includes("télétravail"))
          return false;
      }
      if (stageActive) {
        const m = (o.description ?? "").match(
          /Stage\s*:\s*(\d+)(?:\s*à\s*(\d+))?\s*mois/i,
        );
        if (!m) return false;
        const oMin = Number(m[1]);
        const oMax = m[2] ? Number(m[2]) : oMin;
        const lo = fMin ?? -Infinity;
        const hi = fMax ?? Infinity;
        if (oMax < lo || oMin > hi) return false;
      }
      return true;
    });
  }, [
    offers,
    filters.contractTypes,
    filters.remoteOnly,
    filters.stageMin,
    filters.stageMax,
  ]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "ia") {
      copy.sort((a, b) => computeOfferScore(b) - computeOfferScore(a));
    } else if (sort === "recent") {
      copy.sort((a, b) => {
        const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
        const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
        return tb - ta;
      });
    } else if (sort === "salary") {
      const value = (s: string | null | undefined) => {
        if (!s) return -1;
        const m = s.match(/\d+/);
        return m ? parseInt(m[0]) : -1;
      };
      copy.sort((a, b) => value(b.salary) - value(a.salary));
    }
    return copy;
  }, [filtered, sort]);

  const reset = () =>
    setFilters({
      contractTypes: [],
      location: "",
      remoteOnly: false,
      stageMin: "",
      stageMax: "",
    });

  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setPage((p) => p + 1);
  }, [loadingMore]);

  const loadedCount = offers.length;
  const hasMore = loadedCount < total;
  const clientFilteringActive =
    filters.contractTypes.length > 0 ||
    filters.remoteOnly ||
    !!filters.stageMin ||
    !!filters.stageMax;
  const stageRangeLabel =
    filters.stageMin || filters.stageMax
      ? filters.stageMin && filters.stageMax && filters.stageMin !== filters.stageMax
        ? `${filters.stageMin}-${filters.stageMax} mois`
        : filters.stageMin && filters.stageMax
          ? `${filters.stageMin} mois`
          : filters.stageMin
            ? `≥ ${filters.stageMin} mois`
            : `≤ ${filters.stageMax} mois`
      : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
      <aside className="lg:sticky lg:top-6 lg:self-start lg:h-fit hidden lg:block card p-5">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onReset={reset}
          total={total}
        />
      </aside>

      <section className="space-y-5">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
              {"// recherche"}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              {total.toLocaleString("fr-FR")} offres
            </h1>
            <p className="mt-1 text-sm text-slate-muted">
              {clientFilteringActive ? (
                <>
                  <span className="font-medium text-slate-ink">
                    {sorted.length}
                  </span>{" "}
                  visibles ·{" "}
                  <span className="font-medium text-slate-ink">
                    {loadedCount}
                  </span>{" "}
                  chargées sur{" "}
                  <span className="font-medium text-slate-ink">{total}</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-slate-ink">
                    {loadedCount}
                  </span>{" "}
                  chargées sur{" "}
                  <span className="font-medium text-slate-ink">{total}</span>
                </>
              )}
              {(filters.contractTypes.length > 0 ||
                filters.location ||
                filters.remoteOnly ||
                stageRangeLabel ||
                debounced) && (
                <>
                  {" · "}
                  <span className="text-slate-muted">filtres :</span>{" "}
                  <span className="font-medium text-slate-ink">
                    {[
                      debounced && `« ${debounced} »`,
                      filters.contractTypes.join(", "),
                      stageRangeLabel,
                      filters.location,
                      filters.remoteOnly && "Remote",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </>
              )}
            </p>
          </div>
        </header>

        <div className="lg:hidden">
          <FilterPanelMobile
            filters={filters}
            onChange={setFilters}
            onReset={reset}
            total={total}
          />
        </div>

        <div className="card p-2 flex items-center gap-2">
          <span className="px-3 text-slate-muted">
            <SearchIcon className="h-5 w-5" />
          </span>
          <input
            type="search"
            placeholder="Rechercher : stage, alternance, développeur…"
            className="flex-1 outline-none text-sm py-2.5 bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher des offres"
          />
          <div className="flex items-center gap-1 mr-1 shrink-0" role="group" aria-label="Tri des offres">
            {(["ia", "recent"] as SortMode[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                  sort === s
                    ? "bg-ink-600 text-white"
                    : "text-slate-muted hover:bg-slate-100"
                }`}
              >
                {s === "ia" ? "✦ IA" : "Récent"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="card p-4 border-flame-500/30 bg-flame-500/5 text-flame-600 text-sm"
          >
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : sorted.length === 0 ? (
            <EmptyOffers />
          ) : (
            sorted.map((o) => <OfferCard key={o.id} offer={o} />)
          )}
        </div>

        {!loading && hasMore && (
          <div className="pt-2 flex flex-col items-center gap-2">
            {clientFilteringActive && sorted.length === 0 && (
              <p className="text-xs text-slate-muted text-center">
                Aucune offre déjà chargée ne matche tes filtres locaux — charge
                la suite pour élargir la recherche.
              </p>
            )}
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="btn btn-secondary !py-3 !px-6"
            >
              {loadingMore ? (
                <>
                  <RefreshIcon className="h-4 w-4 animate-spin" />
                  Chargement…
                </>
              ) : (
                <>
                  Charger {Math.min(PAGE_SIZE, total - loadedCount)} offres de
                  plus
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="text-xs text-slate-muted">
              {loadedCount} / {total} offres chargées
            </p>
          </div>
        )}

        {!loading && !hasMore && loadedCount > 0 && (
          <p className="text-center text-xs text-slate-muted pt-2">
            Vous avez vu les {total.toLocaleString("fr-FR")} offres disponibles.
          </p>
        )}
      </section>
    </div>
  );
}

function EmptyOffers() {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-ink-50 flex items-center justify-center text-ink-700">
        <SparklesIcon className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold">
        Aucune offre ne correspond
      </h2>
      <p className="mt-2 text-sm text-slate-muted max-w-sm mx-auto">
        Essayez d&apos;élargir vos filtres.
      </p>
    </div>
  );
}
