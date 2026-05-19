"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useSavedOffers } from "@/lib/saved-store";
import { useToast } from "@/lib/toast-context";
import { SettingsIcon, ArrowRightIcon, PencilIcon } from "@/components/Icons";

export default function SettingsPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const { user, updateProfile } = useAuth();
  const { ids } = useSavedOffers();
  const { push } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const dirty =
    user !== null &&
    (firstName.trim() !== (user.firstName ?? "") ||
      lastName.trim() !== (user.lastName ?? "") ||
      phone.trim() !== (user.phone ?? ""));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      push("Profil mis à jour", "success");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
    }
    setError(null);
    setEditing(false);
  };

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
            ? "Modifiez vos informations personnelles."
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

      {user && (
        <form onSubmit={onSubmit} className="card p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-ink-700" />
              <h2 className="font-display font-bold text-lg">Mon profil</h2>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-line text-slate-muted hover:text-ink-700 hover:border-ink-300 transition"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Modifier
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">
                Prénom *
              </label>
              <input
                id="firstName"
                type="text"
                required
                disabled={!editing}
                className="input disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-muted"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="label">
                Nom *
              </label>
              <input
                id="lastName"
                type="text"
                required
                disabled={!editing}
                className="input disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-muted"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Téléphone{" "}
              <span className="text-xs text-slate-muted font-normal">
                ( facultatif )
              </span>
            </label>
            <input
              id="phone"
              type="tel"
              disabled={!editing}
              className="input md:max-w-xs disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-muted"
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-line">
            <Field label="Email" value={user.email} />
            <Field
              label="Favoris"
              value={`${ids.length} offre${ids.length > 1 ? "s" : ""}`}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-flame-500/30 bg-flame-500/5 text-flame-600 text-sm p-3"
            >
              ⚠️ {error}
            </div>
          )}

          {editing && (
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={
                  !dirty ||
                  saving ||
                  firstName.trim().length === 0 ||
                  lastName.trim().length === 0
                }
                className="btn btn-primary"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="btn btn-ghost"
              >
                Annuler
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-line p-4">
      <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
