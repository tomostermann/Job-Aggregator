"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser, Offer } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { ArrowRightIcon, XIcon, TrashIcon } from "./Icons";

interface Props {
  offer: Offer;
  user: AuthUser;
  token: string;
  onClose: () => void;
}

interface Attachment {
  filename: string;
  mimetype: string;
  data: string;
  size: number;
}

const MAX_FILE = 5 * 1024 * 1024;

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

export function ApplyModal({ offer, user, token, onClose }: Props) {
  const { push } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recruiterName =
    [offer.recruiter_first_name, offer.recruiter_last_name]
      .filter(Boolean)
      .join(" ") || null;
  const recruiterEmail = offer.recruiter_email ?? null;
  const defaultSubject = `Candidature — ${offer.title}${
    offer.company ? ` (${offer.company})` : ""
  }`;

  const [subject, setSubject] = useState(defaultSubject);
  const [signature, setSignature] = useState(user.signature ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [includeCv, setIncludeCv] = useState<boolean>(!!user.hasCv);

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

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const next: Attachment[] = [];
    for (const f of files) {
      if (f.size > MAX_FILE) {
        push(`« ${f.name} » dépasse 5 Mo`, "error");
        continue;
      }
      const data = await fileToBase64(f);
      next.push({
        filename: f.name,
        mimetype: f.type || "application/octet-stream",
        data,
        size: f.size,
      });
    }
    setAttachments((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

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
      const res = await api.applyToOffer(token, offer.id, {
        message,
        subject: subject.trim(),
        signature: signature,
        includeCv: includeCv && !!user.hasCv,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          mimetype: a.mimetype,
          data: a.data,
        })),
      });
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
      <div className="relative w-full md:max-w-2xl bg-white md:rounded-2xl rounded-t-3xl shadow-xl max-h-[92vh] flex flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-line">
          <span className="text-xs font-mono uppercase tracking-widest text-flame-500">
            {"// candidature"}
          </span>
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

          <div className="rounded-xl border border-slate-line bg-slate-50/40 divide-y divide-slate-line">
            <MailRow label="De :" value={user.email} />
            <MailRow
              label="À :"
              value={recruiterEmail ?? "— (offre externe)"}
            />
            <EditableRow
              label="Objet :"
              value={subject}
              onChange={setSubject}
              maxLength={200}
            />
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
            <label htmlFor="apply-signature" className="label">
              Signature
            </label>
            <textarea
              id="apply-signature"
              className="input min-h-[120px] !rounded-xl font-mono text-xs"
              placeholder={`Cordialement,\n\nVotre nom\nVotre lien LinkedIn / portfolio…`}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              maxLength={2000}
            />
            <div className="mt-1 text-xs text-slate-muted text-right">
              {signature.length} / 2000
            </div>
          </div>

          <div className="space-y-2">
            <div className="label">Pièces jointes</div>
            {user.hasCv && (
              <label className="flex items-center gap-2 rounded-xl border border-slate-line px-3 py-2 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-ink-600"
                  checked={includeCv}
                  onChange={(e) => setIncludeCv(e.target.checked)}
                />
                <span className="text-sm">
                  Joindre mon CV (
                  <span className="font-mono text-xs">
                    {user.cvFilename || "CV"}
                  </span>
                  )
                </span>
              </label>
            )}
            {attachments.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-slate-line px-3 py-2"
              >
                <span className="text-sm flex-1 break-all">{a.filename}</span>
                <span className="text-xs text-slate-muted shrink-0">
                  {formatBytes(a.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  aria-label={`Retirer ${a.filename}`}
                  className="rounded-full p-1 hover:bg-flame-500/5 text-slate-muted hover:text-flame-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-ink-700 hover:text-ink-900"
            >
              + Ajouter un fichier
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onPickFile}
            />
            <p className="text-[11px] text-slate-muted">
              5 Mo max par fichier.
            </p>
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
            disabled={
              sending ||
              !recruiterEmail ||
              message.trim().length === 0 ||
              subject.trim().length === 0
            }
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

function MailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 px-3 py-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-muted w-16 shrink-0 whitespace-nowrap">
        {label}
      </span>
      <span className="text-sm text-slate-ink break-all">{value}</span>
    </div>
  );
}

function EditableRow({
  label,
  value,
  onChange,
  type = "text",
  invalid,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email";
  invalid?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5">
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-muted w-16 shrink-0 whitespace-nowrap">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        spellCheck={type !== "email"}
        className={`flex-1 min-w-0 bg-white border border-slate-line text-sm text-slate-ink py-1.5 px-2.5 rounded-md outline-none focus:border-ink-500 focus:ring-2 transition ${
          invalid && value.length > 0
            ? "focus:ring-flame-500/40 text-flame-600 border-flame-500/40"
            : "focus:ring-ink-500/20"
        }`}
      />
    </div>
  );
}
