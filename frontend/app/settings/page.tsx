"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  SettingsIcon,
  ArrowRightIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/Icons";

export default function SettingsPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

function Inner() {
  const { user, updateProfile, uploadCv, deleteCv } = useAuth();
  const { push } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [signature, setSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingSignature, setEditingSignature] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
      setSignature(user.signature ?? "");
    }
  }, [user]);

  const dirty =
    user !== null &&
    (firstName.trim() !== (user.firstName ?? "") ||
      lastName.trim() !== (user.lastName ?? "") ||
      phone.trim() !== (user.phone ?? ""));

  const signatureDirty = user !== null && signature !== (user.signature ?? "");

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

  const onSaveSignature = async () => {
    if (!user) return;
    setSignatureError(null);
    setSavingSignature(true);
    try {
      await updateProfile({ signature });
      push("Signature mise à jour", "success");
      setEditingSignature(false);
    } catch (err) {
      setSignatureError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingSignature(false);
    }
  };

  const cancelSignature = () => {
    if (user) setSignature(user.signature ?? "");
    setSignatureError(null);
    setEditingSignature(false);
  };

  const onCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      push("Fichier trop volumineux (max 5 Mo)", "error");
      return;
    }
    setUploadingCv(true);
    try {
      const data = await fileToBase64(file);
      await uploadCv({
        filename: file.name,
        mimetype: file.type || "application/octet-stream",
        data,
      });
      push("CV enregistré", "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Erreur d'upload", "error");
    } finally {
      setUploadingCv(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onCvDelete = async () => {
    try {
      await deleteCv();
      push("CV supprimé", "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Erreur", "error");
    }
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
          <div className="flex flex-wrap gap-2">
            <Link href="/login" className="btn btn-secondary shrink-0">
              Se connecter
            </Link>
            <Link href="/register" className="btn btn-primary shrink-0">
              Créer un compte
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {user && (
        <>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="label">
                  Téléphone{" "}
                </label>
                <input
                  id="phone"
                  type="tel"
                  disabled={!editing}
                  className="input disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-muted"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                />
              </div>
              <div>
                <label htmlFor="email" className="label">
                  Email{" "}
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  readOnly
                  className="input bg-slate-50 cursor-not-allowed text-slate-muted"
                  value={user.email}
                />
              </div>
              <span className="text-xs text-slate-muted">
                * : Champs obligatoires
              </span>
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
              <div className="flex items-center gap-2 pt-1">
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

          {user.role !== "admin" && (
            <section className="card p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PencilIcon className="h-5 w-5 text-ink-700" />
                  <h2 className="font-display font-bold text-lg">
                    Signature personnalisée
                  </h2>
                </div>
                {!editingSignature && (
                  <button
                    type="button"
                    onClick={() => setEditingSignature(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-line text-slate-muted hover:text-ink-700 hover:border-ink-300 transition"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-muted">
                Ce texte sera ajouté en bas de chaque candidature envoyée.
                Mettez votre nom, vos coordonnées, un lien portfolio…
              </p>
              <textarea
                id="signature"
                className="input min-h-[140px] !rounded-xl font-mono text-sm disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-muted"
                placeholder={`Cordialement,\n\nPrénom Nom,\nEmail :\nTél :`}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                maxLength={2000}
                disabled={!editingSignature}
              />
              <div className="text-xs text-slate-muted text-right">
                {signature.length} / 2000
              </div>
              {signatureError && (
                <div
                  role="alert"
                  className="rounded-xl border border-flame-500/30 bg-flame-500/5 text-flame-600 text-sm p-3"
                >
                  ⚠️ {signatureError}
                </div>
              )}
              {editingSignature && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSaveSignature}
                    disabled={!signatureDirty || savingSignature}
                    className="btn btn-primary"
                  >
                    {savingSignature ? "Enregistrement…" : "Enregistrer"}
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelSignature}
                    disabled={savingSignature}
                    className="btn btn-ghost"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </section>
          )}

          {user.role !== "admin" && (
            <section className="card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-ink-700" />
                <h2 className="font-display font-bold text-lg">
                  Mon CV{" "}
                  <span className="text-xs text-slate-muted font-normal">
                    ( facultatif )
                  </span>
                </h2>
              </div>
              <p className="text-sm text-slate-muted">
                Stockez votre CV pour l&apos;attacher en un clic à vos
                candidatures.
              </p>
              {user.hasCv ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-line bg-slate-50 px-4 py-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-xs font-mono uppercase tracking-widest text-slate-muted">
                      Fichier enregistré
                    </div>
                    <div className="mt-0.5 font-semibold text-sm break-all">
                      {user.cvFilename || "CV"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingCv}
                      className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Remplacer
                    </button>
                    <button
                      type="button"
                      onClick={onCvDelete}
                      disabled={uploadingCv}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-line text-flame-600 hover:bg-flame-500/5 hover:border-flame-300 transition"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCv}
                  className="btn btn-secondary"
                >
                  {uploadingCv ? "Envoi…" : "Téléverser un CV"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf"
                className="hidden"
                onChange={onCvChange}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
