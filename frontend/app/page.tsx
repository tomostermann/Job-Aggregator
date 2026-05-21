import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeader } from "@/components/SectionHeader";
import {
  ArrowRightIcon,
  SparklesIcon,
  ShieldIcon,
  ChartIcon,
  RefreshIcon,
  SearchIcon,
  BriefcaseIcon,
  EuroIcon,
} from "@/components/Icons";

const FEATURES = [
  {
    title: "Score IA de pertinence",
    description:
      "Chaque offre est analysée et notée /100 en fonction du marché, de la fraîcheur et de la pertinence par rapport au profil.",
    icon: <SparklesIcon className="h-5 w-5" />,
    tone: "ai" as const,
  },
  {
    title: "Volume du marché par mois",
    description:
      "Visualisez l'activité de recrutement en temps réel. Savoir si c'est le bon moment pour postuler ou attendre.",
    icon: <ChartIcon className="h-5 w-5" />,
    tone: "data" as const,
  },
  {
    title: "Données fraîches",
    description:
      "Ingestion normalisée à la demande, déduplication des doublons et détection des Ghost Jobs.",
    icon: <RefreshIcon className="h-5 w-5" />,
  },
  {
    title: "Sécurité et rôles",
    description:
      "JWT + bcrypt, rôles user/admin, autorisations server-side, secrets hors du code.",
    icon: <ShieldIcon className="h-5 w-5" />,
  },
];

const STATS = [
  { value: "1 200+", label: "offres ingérées" },
  { value: "Score IA", label: "de pertinence personnalisée" },
  { value: "Filtres", label: "et alertes" },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <Navbar />

      <main className="flex-1">
        <section
          id="hero"
          className="relative overflow-hidden border-b border-slate-line"
        >
          <div className="container-page relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 py-16 md:py-24">
            <div className="lg:col-span-7">
              <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                Trouvez le job
                <br />
                qui vous <span className="underline-mark">correspond</span>
                <span className="text-flame-500">_</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-slate-muted max-w-2xl leading-relaxed">
                Job Aggregator collecte, normalise et score les meilleures
                offres tech. Stages, alternances, CDI.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="btn btn-primary !py-4 !px-6 !text-base"
                >
                  Créer mon compte
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/offers"
                  className="btn btn-secondary !py-4 !px-6 !text-base"
                >
                  <SearchIcon className="h-4 w-4" />
                  Explorer les offres
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HeroPreview />
            </div>
          </div>

          <div className="container-page relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-10">
              {STATS.map((s) => (
                <div key={s.label} className="card p-4">
                  <div className="font-display text-2xl md:text-3xl font-bold text-ink-700">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="container-page py-20 md:py-28">
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-mono uppercase tracking-widest text-flame-500">
              {"// fonctionnalités"}
            </div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight">
              Un produit complet.
            </h2>
            <p className="mt-4 text-slate-muted text-lg">
              Frontend, backend, cybersécurité, data et IA alignés autour
              d&apos;un objectif : aider les développeurs à prendre de
              meilleures décisions de carrière.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card p-6 group hover:shadow-pop hover:-translate-y-0.5 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 text-ink-700">
                    {f.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg font-bold tracking-tight">
                        {f.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-muted leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="product"
          className="border-y border-slate-line bg-white/50"
        >
          <div className="container-page py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-flame-500">
                {"// utilisateur"}
              </div>
              <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight">
                Un dashboard taillé pour la décision.
              </h2>
              <p className="mt-4 text-slate-muted text-lg">
                Stats, recommandations IA, volume du marché et offres récentes.
                Tout ce qu&apos;il vous faut pour postuler intelligemment.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  {
                    label:
                      "Filtres avancés (contrat, durée, télétravail, lieu)",
                    icon: SearchIcon,
                  },
                  {
                    label: "Détection des Ghost Jobs (offres non rafraîchies)",
                    icon: BriefcaseIcon,
                  },
                  {
                    label: "Volume mensuel d'offres pour suivre le marché",
                    icon: EuroIcon,
                  },
                  {
                    label: "Recommandations IA basées sur votre profil",
                    icon: SparklesIcon,
                  },
                ].map(({ label, icon: Icon }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-700 shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-slate-ink leading-relaxed pt-1">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link href="/dashboard" className="btn btn-primary">
                  Voir un exemple
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <DashboardMockup />
            </div>
          </div>
        </section>

        <section id="partners" className="container-page py-20 md:py-28">
          <div className="flex flex-col lg:flex-row justify-center gap-6 lg:gap-10">
            <div className="card p-8 flex flex-col justify-between gap-6 bg-gradient-to-br from-ink-700 to-ink-900 text-white border-0">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink-200">
                  {"// votre prochain job est ici"}
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold">
                  Prêt à explorer ?
                </h3>
                <p className="mt-2 text-sm text-ink-100/80">
                  Créez un compte et accédez à toutes les offres ingérées +
                  dashboard personnalisé.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/register"
                  className="btn !bg-white !text-ink-700 hover:!bg-ink-50"
                >
                  Créer un compte
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="btn btn-ghost !text-white hover:!bg-white/10"
                >
                  J&apos;ai déjà un compte
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="card p-5 shadow-pop relative">
        <div className="flex items-center justify-between"></div>
        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold font-display"
            style={{ background: "linear-gradient(135deg, #0A2EFF, #3D5AFE)" }}
          >
            O
          </div>
          <div className="min-w-0">
            <div className="font-bold leading-tight">
              Stage Ingénieur DevOps
            </div>
            <div className="text-xs text-slate-muted">
              OVHcloud · Roubaix · Stage · 6 mois
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-muted">
              Pertinence
            </div>
            <div className="font-display text-xl font-bold text-mint-600">
              89<span className="text-xs text-slate-muted"> /100</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Docker", "CI/CD", "Linux", "Python"].map((t) => (
            <span key={t} className="pill">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-muted">
          <span>1 200 € / mois</span>
          <span className="font-mono">il y a 5 jours</span>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-ink-600/15 to-transparent blur-2xl" />
      <div className="card p-5 shadow-pop space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-bold text-xl md:text-2xl">
              Tableau de bord
            </div>
            <div className="text-xs md:text-sm text-slate-muted">
              Bonjour Jean 👋
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { l: "OFFRES ACTIVES", v: "1 284", t: "ink" as const },
            { l: "SCORE IA MOYEN", v: "89%", t: "mint" as const },
            { l: "FAVORIS", v: "12", t: "amber" as const },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-slate-line p-3">
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-muted">
                {s.l}
              </div>
              <div
                className={`mt-1 font-display font-bold text-xl ${
                  s.t === "mint"
                    ? "text-mint-600"
                    : s.t === "amber"
                      ? "text-amber-500"
                      : "text-ink-700"
                }`}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-line p-3">
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
          <div className="space-y-2">
            {[
              { t: "Développeur Full-Stack", c: "Dataiku", s: 97 },
              { t: "Stage DevOps", c: "OVHcloud", s: 89 },
              { t: "Alternance Cyber", c: "Thales", s: 82 },
            ].map((r) => (
              <div key={r.t} className="flex items-center gap-2 text-xs">
                <div className="h-7 w-7 rounded-md bg-ink-50 flex items-center justify-center font-bold text-ink-700">
                  {r.c[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{r.t}</div>
                  <div className="text-[10px] text-slate-muted">{r.c}</div>
                </div>
                <span className="pill pill-mint text-[10px] font-mono">
                  Score: {r.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
