"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  ArrowRightIcon,
  SparklesIcon,
  BriefcaseIcon,
  MapPinIcon,
  EuroIcon,
  ShieldIcon,
} from "@/components/Icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatSalary } from "@/lib/format";

const CONTRACT_TYPES = ["CDI", "CDD", "Stage", "Alternance", "Freelance"];

const STAGE_DURATION_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const formatStageDuration = (min: string, max: string) => {
  if (!min) return "";
  if (!max || max === min) return `${min} mois`;
  return `${min} à ${max} mois`;
};

export default function NewOfferPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const { user, token, isLoading } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [contract, setContract] = useState("CDI");
  const [stageMin, setStageMin] = useState("");
  const [stageMax, setStageMax] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?next=" + encodeURIComponent("/offers/new"));
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-muted">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-ink-50 flex items-center justify-center text-ink-700">
          <ShieldIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">
          Connexion requise
        </h2>
        <p className="mt-2 text-sm text-slate-muted">
          Vous devez être connecté pour publier une annonce.
        </p>
        <Link href="/login?next=/offers/new" className="btn btn-primary mt-5">
          Se connecter
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    if (contract === "Stage" && !stageMin) {
      setError("Merci de sélectionner la durée du stage.");
      return;
    }
    if (
      contract === "Stage" &&
      stageMax &&
      Number(stageMax) < Number(stageMin)
    ) {
      setError("La durée maximum doit être supérieure ou égale au minimum.");
      return;
    }
    setSubmitting(true);
    const prefix =
      contract === "Stage"
        ? `Stage : ${formatStageDuration(stageMin, stageMax)}`
        : "";
    const fullDescription = prefix
      ? description
        ? `${prefix}\n\n${description}`
        : prefix
      : description;
    try {
      const offer = await api.createOffer(token, {
        title,
        company: company || undefined,
        location: location || undefined,
        contract_type: contract,
        salary: salary || undefined,
        description: fullDescription || undefined,
      });
      push("Annonce publiée", "success");
      router.push(`/offers/${offer.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la publication",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
            {"// nouvelle annonce"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Publier une offre <span aria-hidden>✨</span>
          </h1>
          <p className="mt-1 text-slate-muted">
            Remplissez le formulaire ci-dessous !
          </p>
        </div>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
      >
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-ink-700" />
              Informations principales
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="label">
                  Titre du poste *
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  minLength={4}
                  className="input"
                  placeholder="Développeur Full-Stack"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="label">
                    Entreprise *
                  </label>
                  <input
                    id="company"
                    type="text"
                    required
                    className="input"
                    placeholder="Acme Tech"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="location" className="label">
                    Localisation *
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-muted" />
                    <input
                      id="location"
                      type="text"
                      required
                      className="input !pl-9"
                      placeholder="Paris, Lyon, Remote…"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="label">Type de contrat</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTRACT_TYPES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setContract(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          contract === c
                            ? "bg-ink-600 text-white border-ink-600 shadow-pop"
                            : "bg-white border-slate-line text-slate-muted hover:text-slate-ink"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="salary" className="label">
                    Rémunération
                  </label>
                  <div className="relative">
                    <EuroIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-muted" />
                    <input
                      id="salary"
                      type="text"
                      className="input !pl-9"
                      placeholder="45 - 60 k€/an"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {contract === "Stage" && (
                <div>
                  <label htmlFor="stage-min" className="label">
                    Durée du stage *
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-0.5">
                      <select
                        id="stage-min"
                        required
                        className="input !w-16 !py-1 !px-2 !text-sm"
                        value={stageMin}
                        onChange={(e) => setStageMin(e.target.value)}
                      >
                        <option value="" disabled>
                          —
                        </option>
                        {STAGE_DURATION_MONTHS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden
                        className="text-sm font-semibold text-slate-muted leading-none"
                      >
                        *
                      </span>
                    </div>
                    <span className="text-sm text-slate-muted">à</span>
                    <select
                      aria-label="Durée maximum (facultatif)"
                      className="input !w-16 !py-1 !px-2 !text-sm"
                      value={stageMax}
                      onChange={(e) => setStageMax(e.target.value)}
                    >
                      <option value="">—</option>
                      {STAGE_DURATION_MONTHS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm font-semibold text-slate-muted">
                      mois
                    </span>
                  </div>
                </div>
              )}
              <span className="text-xs text-slate-muted">
                * : Champs obligatoires
              </span>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-ink-700" />
              Description
            </h2>
            <p className="text-xs text-slate-muted mb-3">
              Présentez le poste, les missions, le stack et le profil recherché.
            </p>
            <textarea
              className="input min-h-[200px] !rounded-xl"
              placeholder={`Missions principales :\n· …\n\nStack technique : …\n\nProfil recherché : …`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
            <div className="mt-1.5 text-xs text-slate-muted text-right">
              {description.length} / 5000
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

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={
                submitting ||
                title.length < 4 ||
                (contract === "Stage" && !stageMin)
              }
              className="btn btn-primary"
            >
              {submitting ? "Publication…" : "Publier l'annonce"}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <Link href="/offers" className="btn btn-ghost">
              Annuler
            </Link>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-muted mb-2">
              Aperçu
            </div>
            <div className="rounded-xl border border-slate-line p-4">
              <div className="font-display font-bold text-lg leading-tight">
                {title || "Titre du poste"}
              </div>
              <div className="mt-1 text-sm text-slate-muted">
                {company || "Entreprise"}
                {location ? ` · ${location}` : ""}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="pill pill-mint">
                  {contract === "Stage" && stageMin
                    ? `Stage : ${formatStageDuration(stageMin, stageMax)}`
                    : contract}
                </span>
                {salary && (
                  <span className="pill pill-flame">
                    <EuroIcon className="h-3 w-3" />
                    {formatSalary(salary)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5 text-xs text-slate-muted space-y-2">
            <div className="flex items-center gap-2 text-ink-700 font-semibold">
              <ShieldIcon className="h-4 w-4" />
              Modération admin
            </div>
            <p>
              Les administrateurs peuvent supprimer toute offre depuis la
              console (notamment celles jugées inappropriées ou en doublon).
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
