"use client";

import Link from "next/link";
import type { Offer } from "@/lib/types";
import { CompanyAvatar } from "./CompanyAvatar";
import { isGhostJob, extractTags } from "@/lib/score";
import { formatRelativeDate, formatSalary } from "@/lib/format";
import {
  ArrowRightIcon,
  AlertIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  EuroIcon,
} from "./Icons";
import { useSavedOffers } from "@/lib/saved-store";
import { useAuthGate } from "@/lib/auth-gate";
import { HeartIcon, HeartFillIcon } from "./Icons";

export function OfferCard({
  offer,
  compact = false,
}: {
  offer: Offer;
  compact?: boolean;
}) {
  const score = typeof offer.ai_score === "number" ? offer.ai_score : null;
  const ghost = isGhostJob(offer);
  const tags = extractTags(offer);
  const { isSaved, toggle } = useSavedOffers();
  const { requireLogin } = useAuthGate();
  const saved = isSaved(offer.id);

  return (
    <article className="card group p-5 hover:shadow-pop transition relative overflow-hidden">
      <div className="flex gap-4">
        <CompanyAvatar name={offer.company} size={compact ? "md" : "lg"} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/offers/${offer.id}`}
                  className="font-display text-base md:text-lg font-bold tracking-tight text-slate-ink hover:text-ink-700 leading-snug"
                >
                  {offer.title}
                </Link>
                {ghost && (
                  <span className="pill pill-flame">
                    <AlertIcon className="h-3 w-3" />
                    Ghost Job
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-sm text-slate-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                {offer.company && (
                  <span className="font-medium text-slate-ink">
                    {offer.company}
                  </span>
                )}
                {offer.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {offer.location}
                  </span>
                )}
                {offer.contract_type && (
                  <span className="flex items-center gap-1">
                    <BriefcaseIcon className="h-3.5 w-3.5" />
                    {offer.contract_type}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {formatRelativeDate(offer.published_at)}
                </span>
              </div>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="pill">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {offer.salary && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-mint-600">
                  <EuroIcon className="h-4 w-4" />
                  {formatSalary(offer.salary)}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!requireLogin("sauvegarder une offre")) return;
                  toggle(offer.id);
                }}
                aria-pressed={saved}
                aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
                className={`rounded-full p-2 border transition ${
                  saved
                    ? "bg-flame-500/10 text-flame-600 border-flame-500/30"
                    : "border-slate-line text-slate-muted hover:text-flame-600 hover:border-flame-500/30"
                }`}
              >
                {saved ? (
                  <HeartFillIcon className="h-4 w-4" />
                ) : (
                  <HeartIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {ghost && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              <AlertIcon className="h-3.5 w-3.5 shrink-0" />
              Non mise à jour depuis plus de 60 jours — vérifiez si le poste est
              encore ouvert.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 ml-4 flex items-center justify-between gap-2">
        {score !== null ? (
          <div className="text-right">
            <div className="text-[10px] font-mono tracking-widest uppercase text-slate-muted">
              Score IA
            </div>
            <div
              className={`font-display text-xl font-bold ${scoreColor(score)}`}
            >
              {score}
              <span className="text-xs text-slate-muted font-medium"> /100</span>
            </div>
          </div>
        ) : (
          <div />
        )}
        <Link
          href={`/offers/${offer.id}`}
          className="btn btn-primary !py-2 !px-4 !text-sm"
        >
          Voir l&apos;offre
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-mint-600";
  if (score >= 60) return "text-ink-700";
  if (score >= 45) return "text-amber-500";
  return "text-flame-600";
}

export function OfferRow({ offer }: { offer: Offer }) {
  const score = typeof offer.ai_score === "number" ? offer.ai_score : null;
  return (
    <Link
      href={`/offers/${offer.id}`}
      className="flex items-center gap-3 rounded-xl border border-transparent hover:border-slate-line hover:bg-slate-50 px-2 py-2 transition"
    >
      <CompanyAvatar name={offer.company} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{offer.title}</div>
        <div className="text-xs text-slate-muted truncate">
          {offer.company ?? "—"}
          {offer.location ? ` · ${offer.location}` : ""}
        </div>
      </div>
      <span className="pill pill-slate text-[11px] font-mono">
        {offer.contract_type?.split(",")[0]?.trim() || "Job"}
      </span>
      {score !== null && (
        <div
          className={`text-sm font-bold ${scoreColor(score)} font-display tabular-nums`}
        >
          IA {score}
        </div>
      )}
    </Link>
  );
}
