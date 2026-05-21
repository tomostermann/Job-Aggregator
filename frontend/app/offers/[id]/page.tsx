"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MapPinIcon,
  BriefcaseIcon,
  EuroIcon,
  CalendarIcon,
  HeartIcon,
  HeartFillIcon,
  AlertIcon,
} from "@/components/Icons";
import { api } from "@/lib/api";
import type { Offer } from "@/lib/types";
import { formatDate, formatRelativeDate, formatSalary } from "@/lib/format";
import {
  extractTags,
  isGhostJob,
  summarizeOffer,
} from "@/lib/score";
import { useSavedOffers } from "@/lib/saved-store";
import { useToast } from "@/lib/toast-context";
import { useAuthGate } from "@/lib/auth-gate";
import { useAuth } from "@/lib/auth-context";
import { ApplyModal } from "@/components/ApplyModal";

export default function OfferDetailPage() {
  return (
    <AppShell>
      <DetailInner />
    </AppShell>
  );
}

function DetailInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isSaved, toggle } = useSavedOffers();
  const { push } = useToast();
  const { requireLogin } = useAuthGate();
  const { user, token } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    setLoading(true);
    api
      .getOffer(params.id)
      .then((data) => !cancelled && setOffer(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="card p-8 text-center">
        <h1 className="font-display text-xl font-bold">Offre introuvable</h1>
        <p className="mt-2 text-sm text-slate-muted">
          {error ?? "Cette offre n'existe pas ou plus."}
        </p>
        <button
          onClick={() => router.push("/offers")}
          className="btn btn-primary mt-4"
        >
          Retour aux offres
        </button>
      </div>
    );
  }

  const score = typeof offer.ai_score === "number" ? offer.ai_score : null;
  const ghost = isGhostJob(offer);
  const tags = extractTags(offer);
  const saved = isSaved(offer.id);
  const summary = summarizeOffer(offer);
  void summary;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-slate-muted hover:text-slate-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <header className="card p-6">
            <div className="flex items-start gap-4">
              <CompanyAvatar name={offer.company} size="xl" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {offer.contract_type && (
                    <span className="pill pill-mint">
                      {offer.contract_type}
                    </span>
                  )}
                  {offer.salary && (
                    <span className="pill pill-flame">
                      <EuroIcon className="h-3 w-3" />
                      {formatSalary(offer.salary)}
                    </span>
                  )}
                  {ghost && (
                    <span className="pill pill-flame">
                      <AlertIcon className="h-3 w-3" /> Ghost Job
                    </span>
                  )}
                </div>
                <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                  {offer.title}
                </h1>
                <div className="mt-2 text-slate-muted text-sm flex flex-wrap gap-x-3 gap-y-1">
                  {offer.company && (
                    <span className="font-semibold text-slate-ink">
                      {offer.company}
                    </span>
                  )}
                  {offer.location && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="h-3.5 w-3.5" /> {offer.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {formatRelativeDate(offer.published_at)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {tags.length > 0 && (
            <section className="card p-6">
              <h2 className="font-display font-bold text-lg mb-3">
                Compétences requises
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="pill !text-sm !px-3 !py-1.5 font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="card p-6">
            <h2 className="font-display font-bold text-lg mb-3">
              Description du poste
            </h2>
            {offer.description ? (
              <div className="prose prose-slate max-w-none text-sm text-slate-ink whitespace-pre-line leading-relaxed">
                {offer.description}
              </div>
            ) : (
              <p className="text-sm text-slate-muted">
                Aucune description disponible.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {score !== null && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-muted">
                  Score de pertinence IA
                </span>
                <span className={`font-display font-bold ${scoreColor(score)}`}>
                  {score} / 100
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBg(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-muted">
                Score calculé par le modèle IA
              </div>
            </div>
          )}

          <div className="card p-5 space-y-3 text-sm">
            <DetailItem
              label="Localisation"
              value={offer.location ?? "—"}
              icon={<MapPinIcon className="h-4 w-4" />}
            />
            <DetailItem
              label="Contrat"
              value={offer.contract_type ?? "—"}
              icon={<BriefcaseIcon className="h-4 w-4" />}
            />
            <DetailItem
              label="Rémunération"
              value={
                offer.salary ? formatSalary(offer.salary) : "Non communiqué"
              }
              icon={<EuroIcon className="h-4 w-4" />}
            />
            <DetailItem
              label="Publication"
              value={offer.published_at ? formatDate(offer.published_at) : "—"}
              icon={<CalendarIcon className="h-4 w-4" />}
            />
          </div>

          <div className="card p-5 space-y-2">
            <button
              type="button"
              onClick={() => {
                if (!requireLogin("postuler à une offre")) return;
                if (!offer.recruiter_email) {
                  push(
                    "Cette offre n'a pas de contact recruteur joignable.",
                    "error",
                  );
                  return;
                }
                setApplyOpen(true);
              }}
              className="btn btn-primary w-full"
            >
              Postuler à cette offre
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!requireLogin("sauvegarder une offre")) return;
                const next = toggle(offer.id);
                push(
                  next ? "Ajoutée à vos favoris" : "Retirée des favoris",
                  "success",
                );
              }}
              className="btn btn-secondary w-full"
              aria-pressed={saved}
            >
              {saved ? (
                <HeartFillIcon className="h-4 w-4 text-flame-600" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
              {saved ? "Retirer des favoris" : "Sauvegarder l'offre"}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  await navigator.clipboard.writeText(window.location.href);
                  push("Lien copié dans le presse-papier", "success");
                }
              }}
              className="btn btn-ghost w-full"
            >
              Partager le lien
            </button>
          </div>

          <Link
            href="/offers"
            className="text-xs text-center block text-slate-muted hover:text-ink-700"
          >
            ← Retour aux résultats
          </Link>
        </aside>
      </div>

      {applyOpen && user && token && (
        <ApplyModal
          offer={offer}
          user={user}
          token={token}
          onClose={() => setApplyOpen(false)}
        />
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-700 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-muted">
          {label}
        </div>
        <div className="font-medium text-sm break-words">{value}</div>
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-mint-600";
  if (score >= 60) return "text-ink-700";
  if (score >= 45) return "text-amber-500";
  return "text-flame-600";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-mint-500";
  if (score >= 60) return "bg-ink-600";
  if (score >= 45) return "bg-amber-400";
  return "bg-flame-500";
}
