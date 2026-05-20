import Link from "next/link";

export function AuthLayout({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "login" | "register";
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12">
      <aside className="lg:col-span-5 xl:col-span-4 relative bg-ink-700 text-white p-8 md:p-12 flex flex-col overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]" />
        <div className="absolute top-0 right-0 h-32 w-32 bg-ink-500 rounded-bl-3xl opacity-50" />
        <div className="absolute top-32 right-16 h-20 w-20 bg-ink-400 rounded-2xl opacity-40" />

        <div className="relative p-10 lg:mt-60">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Trouvez le job
            <br />
            qui vous <span className="text-flame-400">correspond.</span>
          </h1>
          <p className="mt-4 text-ink-100/85 text-base md:text-lg max-w-md">
            Plus de 1 200 offres tech agrégées pour vous.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              "- Score IA de pertinence personnalisé",
              "- Alertes et filtres avancés",
            ].map((s) => (
              <li key={s} className="flex items-center gap-3 text-ink-100">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="lg:col-span-7 xl:col-span-8 flex flex-col">
        <div className="text-right p-6 md:p-8">
          <Link
            href="/"
            className="text-sm text-slate-muted hover:text-slate-ink"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="inline-flex items-center bg-slate-100 rounded-full p-1 mb-8">
              <Link
                href="/login"
                aria-current={active === "login" ? "page" : undefined}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  active === "login"
                    ? "bg-ink-600 text-white shadow-pop"
                    : "text-slate-muted"
                }`}
              >
                Connexion
              </Link>
              <Link
                href="/register"
                aria-current={active === "register" ? "page" : undefined}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  active === "register"
                    ? "bg-ink-600 text-white shadow-pop"
                    : "text-slate-muted"
                }`}
              >
                Inscription
              </Link>
            </div>

            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
