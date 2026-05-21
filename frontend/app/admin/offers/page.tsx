"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { Pagination } from "@/components/Pagination";
import {
  TrashIcon,
  CheckIcon,
  AlertIcon,
  SearchIcon,
  RefreshIcon,
} from "@/components/Icons";
import { api } from "@/lib/api";
import type { Offer } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { computeOfferScore, isGhostJob } from "@/lib/score";
import { formatRelativeDate } from "@/lib/format";

const PAGE_SIZE = 25;

export default function AdminOffersPage() {
  return (
    <AppShell requireRole="admin">
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const { token } = useAuth();
  const { push } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ghost" | "fresh">("all");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // Debounce de la recherche serveur
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(filter.trim()), 300);
    return () => clearTimeout(t);
  }, [filter]);

  // Reset à la page 0 quand un filtre serveur change
  useEffect(() => {
    setPage(0);
  }, [debouncedFilter, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listOffers({
        size: PAGE_SIZE,
        page,
        q: debouncedFilter || undefined,
        status:
          statusFilter === "ghost"
            ? "ghost"
            : statusFilter === "fresh"
              ? "fresh"
              : undefined,
      });
      setOffers(res.data);
      setTotal(res.total);
    } catch (err) {
      push(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedFilter, statusFilter, push]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (id: string) => {
    if (!token) return;
    setPendingDelete(id);
    try {
      await api.adminDeleteOffer(token, id);
      setOffers((prev) => prev.filter((o) => o.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      push("Offre supprimée", "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setPendingDelete(null);
    }
  };

  // Le filtre ghost/fresh est appliqué côté serveur via `status` — on garde
  // juste l'alias `displayed` pour ne pas casser le rendu existant.
  const displayed = offers;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
            {"// modération offres"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Offres à modérer
          </h1>
          <p className="mt-1 text-slate-muted">
            {total.toLocaleString("fr-FR")} offre{total > 1 ? "s" : ""} au total —
            supprimez les doublons et les ghost jobs.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn btn-secondary">
          <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Recharger
        </button>
      </header>

      <div className="card p-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2 text-slate-muted shrink-0">
            <SearchIcon className="h-5 w-5" />
          </span>
          <input
            className="flex-1 bg-transparent outline-none py-1.5 text-sm min-w-0"
            placeholder="Rechercher par titre ou description…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 px-1 pb-0.5">
          {(["all", "ghost", "fresh"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === s
                  ? "bg-ink-600 text-white"
                  : "text-slate-muted hover:bg-slate-100"
              }`}
            >
              {s === "all" ? "Toutes" : s === "ghost" ? "Ghost jobs" : "Récentes"}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_140px_120px_100px_120px_140px] gap-3 px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-muted border-b border-slate-line bg-slate-50">
          <div>Titre</div>
          <div>Entreprise</div>
          <div>Type</div>
          <div>Score IA</div>
          <div>Publié</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-line">
          {loading ? (
            <div className="p-8 text-center text-slate-muted text-sm">Chargement…</div>
          ) : displayed.length === 0 ? (
            <div className="p-8 text-center text-slate-muted text-sm">
              {statusFilter === "ghost"
                ? "Aucune offre ghost (plus de 60 jours)."
                : statusFilter === "fresh"
                  ? "Aucune offre récente (moins de 7 jours)."
                  : "Aucune offre."}
            </div>
          ) : (
            displayed.map((o) => {
              const score = computeOfferScore(o);
              const ghost = isGhostJob(o);
              return (
                <div
                  key={o.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px_100px_120px_140px] gap-3 px-5 py-3 items-center text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyAvatar name={o.company} size="sm" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{o.title}</div>
                      <div className="md:hidden text-xs text-slate-muted truncate">
                        {o.company ?? "—"} · {o.contract_type ?? "—"}
                      </div>
                    </div>
                    {ghost && (
                      <span className="pill pill-flame !py-0.5 !text-[10px]">
                        <AlertIcon className="h-3 w-3" /> Ghost
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block truncate text-slate-muted">
                    {o.company ?? "—"}
                  </div>
                  <div className="hidden md:block">
                    <span className="pill pill-slate !text-[11px]">
                      {o.contract_type?.split(",")[0]?.trim() || "—"}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <span
                      className={`text-sm font-bold font-display ${
                        score >= 80
                          ? "text-mint-600"
                          : score >= 60
                            ? "text-ink-700"
                            : score >= 45
                              ? "text-amber-500"
                              : "text-flame-600"
                      }`}
                    >
                      {score}
                    </span>
                  </div>
                  <div className="hidden md:block text-xs text-slate-muted">
                    {formatRelativeDate(o.published_at)}
                  </div>
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/offers/${o.id}`}
                      className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                    >
                      Voir
                    </a>
                    <button
                      onClick={() => onDelete(o.id)}
                      disabled={pendingDelete === o.id}
                      className="btn !py-1.5 !px-3 !text-xs bg-flame-500/10 text-flame-600 border border-flame-500/30 hover:bg-flame-500 hover:text-white"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      {pendingDelete === o.id ? "…" : "Supprimer"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onChange={(p) => {
          setPage(p);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />

      <div className="text-[11px] font-mono text-slate-muted flex items-center gap-2">
        <CheckIcon className="h-3 w-3" />
        Suppression server-side via DELETE /api/admin/offers/:id (rôle admin requis)
      </div>
    </div>
  );
}
