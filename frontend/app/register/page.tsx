"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

function strengthOf(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => strengthOf(password), [password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (strength < 3) {
      setError("Mot de passe trop faible : 8+ caractères, majuscule, chiffre.");
      return;
    }
    setLoading(true);
    try {
      const u = await register(email.trim(), password);
      push("Compte créé. Bienvenue !", "success");
      router.push(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création",
      );
    } finally {
      setLoading(false);
    }
  };

  const segments = [
    "bg-flame-500",
    "bg-flame-500",
    "bg-amber-400",
    "bg-mint-500",
    "bg-mint-600",
  ];

  return (
    <AuthLayout active="register">
      <h2 className="font-display text-3xl font-bold tracking-tight">
        Bienvenue !
      </h2>
      <p className="mt-2 text-sm text-slate-muted">
        Créez votre compte avec votre adresse Epitech ou personnelle. Aucun
        spam.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="adresse@epitech.eu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="pw-strength"
          />
          <div className="mt-1 text-[11px] text-slate-muted flex flex-col gap-0.5">
            <span> – 8+ caractères</span>
            <span> – Au moins une majuscule</span>
            <span> – Au moins un chiffre</span>
            <span> – Au moins un symbole</span>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="label">
            Confirmer
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            className="input"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-flame-500/30 bg-flame-500/10 px-3 py-2.5 text-sm text-flame-600"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full !py-3.5"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>

        <p className="text-center text-sm text-slate-muted">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="text-ink-700 font-semibold hover:underline"
          >
            Se connecter →
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
