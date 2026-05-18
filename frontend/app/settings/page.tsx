"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useSavedOffers } from "@/lib/saved-store";
import { SettingsIcon, ArrowRightIcon } from "@/components/Icons";

export default function SettingsPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const { user } = useAuth();
  const { ids } = useSavedOffers();

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
          {"// paramètres"}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Paramètres
        </h1>
        <p className="mt-1 text-slate-muted">
          {user
            ? "Aperçu de votre compte et de votre activité."
            : "Vous consultez la page en mode visiteur."}
        </p>
      </header>

      {!user && (
        <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-ink-200 bg-ink-50">
          <div>
            <h2 className="font-display font-bold text-lg">
              Pas encore de compte ?
            </h2>
            <p className="text-sm text-slate-muted mt-1">
              Créez-en un pour synchroniser vos favoris, postuler aux offres et
              créer des annonces.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/login" className="btn btn-secondary">
              Se connecter
            </Link>
            <Link href="/register" className="btn btn-primary">
              Créer un compte
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="h-5 w-5 text-ink-700" />
          <h2 className="font-display font-bold text-lg">Compte</h2>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Prénom"
            value={user?.firstName || (user ? "—" : "Visiteur")}
          />
          <Field label="Nom" value={user?.lastName || (user ? "—" : "—")} />
          <Field label="Email" value={user?.email || "—"} />
          <Field
            label="Favoris"
            value={`${ids.length} offre${ids.length > 1 ? "s" : ""}`}
          />
        </dl>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-line p-4">
      <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-semibold ${mono ? "font-mono text-xs break-all" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
