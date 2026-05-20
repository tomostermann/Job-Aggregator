"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser, Offer } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { ArrowRightIcon, XIcon } from "./Icons";

interface Props {
  offer: Offer;
  user: AuthUser;
  token: string;
  onClose: () => void;
}

export function ApplyModal({ offer, user, token, onClose }: Props) {
  const { push } = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const candidateName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const recruiterName =
    [offer.recruiter_first_name, offer.recruiter_last_name]
      .filter(Boolean)
      .join(" ") || null;
  const recruiterEmail = offer.recruiter_email ?? null;
  const subject = `Candidature — ${offer.title}${
    offer.company ? ` (${offer.company})` : ""
  }`;

  const signature = [
    candidateName,
    user.email,
    user.phone ? `Tél : ${user.phone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterEmail) {
      setError("Cette offre n'a pas de recruteur joignable.");
      return;
    }
    if (message.trim().length === 0) {
      setError("Le message ne peut pas être vide.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await api.applyToOffer(token, offer.id, message);
      push(
        res.delivered
          ? "Candidature envoyée au recruteur"
          : "Candidature enregistrée (SMTP non configuré côté serveur)",
        "success",
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-ink/40 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        className="relative w-full md:max-w-2xl bg-white md:rounded-2xl rounded-t-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-line">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono uppercase tracking-widest text-flame-500">
              {"// candidature"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 hover:bg-slate-100 text-slate-muted"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          <h2
            id="apply-modal-title"
            className="font-display font-bold text-xl leading-tight"
          >
            Postuler à {offer.title}
            {offer.company ? (
              <span className="text-slate-muted font-normal">
                {" "}
                · {offer.company}
              </span>
            ) : null}
          </h2>

          {!recruiterEmail && (
            <div className="rounded-xl border border-flame-500/30 bg-flame-500/5 text-flame-600 text-sm p-3">
              Cette offre provient d&apos;une source externe et n&apos;a pas de
              contact recruteur. La candidature ne peut pas être envoyée
              automatiquement.
            </div>
          )}

          <div className="rounded-xl border border-slate-line bg-slate-50/40">
            <MailRow label="De" value={user.email} />
            <MailRow
              label="À"
              value={
                recruiterEmail
                  ? `${recruiterName ? recruiterName + " · " : ""}${recruiterEmail}`
                  : "— (offre externe)"
              }
            />
            <MailRow label="Objet" value={subject} last />
          </div>

          <div>
            <label htmlFor="apply-message" className="label">
              Votre message *
            </label>
            <textarea
              id="apply-message"
              required
              className="input min-h-[180px] !rounded-xl"
              placeholder={`Bonjour${recruiterName ? " " + recruiterName : ""},\n\nJe me permets de vous contacter au sujet du poste « ${offer.title} »…\n\n`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              disabled={!recruiterEmail}
            />
            <div className="mt-1 text-xs text-slate-muted text-right">
              {message.length} / 5000
            </div>
          </div>

          <div>
            <div className="label">Signature (ajoutée automatiquement)</div>
            <pre className="rounded-xl border border-slate-line bg-slate-50 px-3 py-2 text-xs text-slate-ink font-mono whitespace-pre-wrap">
              {signature}
            </pre>
            {!user.phone && (
              <p className="mt-1.5 text-xs text-slate-muted">
                💡 Ajoutez votre téléphone dans{" "}
                <a
                  href="/settings"
                  className="text-ink-700 hover:underline font-semibold"
                >
                  Paramètres
                </a>{" "}
                pour qu&apos;il apparaisse dans la signature.
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-flame-500/30 bg-flame-500/5 text-flame-600 text-sm p-3"
            >
              ⚠️ {error}
            </div>
          )}
        </form>

        <footer className="px-5 py-4 border-t border-slate-line flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="btn btn-ghost"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={sending || !recruiterEmail || message.trim().length === 0}
            className="btn btn-primary"
          >
            {sending ? "Envoi…" : "Envoyer la candidature"}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}

function MailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-3 px-3 py-2 ${
        last ? "" : "border-b border-slate-line"
      }`}
    >
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-muted w-12 shrink-0">
        {label}
      </span>
      <span className="text-sm text-slate-ink break-all">{value}</span>
    </div>
  );
}
