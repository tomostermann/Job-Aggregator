"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

function LoginForm() {
  const { login } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const u = await login(email.trim(), password);
      push("Connexion réussie", "success");
      const target = next || (u.role === "admin" ? "/admin" : "/dashboard");
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-3xl font-bold tracking-tight">
        Bon retour !
      </h2>
      <p className="mt-2 text-sm text-slate-muted">
        Connectez-vous pour accéder à votre dashboard et vos offres
        sauvegardées.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="adresse@epitech.eu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
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
          {loading ? "Connexion…" : "Se connecter"}
        </button>

        <p className="text-center text-sm text-slate-muted">
          Pas de compte ?{" "}
          <Link
            href="/register"
            className="text-ink-700 font-semibold hover:underline"
          >
            Créer un compte →
          </Link>
        </p>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout active="login">
      <Suspense
        fallback={<div className="text-sm text-slate-muted">Chargement…</div>}
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
