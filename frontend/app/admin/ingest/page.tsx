"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { DatabaseIcon, RefreshIcon, CheckIcon } from "@/components/Icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import type { IngestResult } from "@/lib/types";

export default function AdminIngestPage() {
  return (
    <AppShell requireRole="admin">
      <Inner />
    </AppShell>
  );
}

interface LogEntry {
  ts: string;
  type: "info" | "success" | "error";
  message: string;
}

function Inner() {
  const { token } = useAuth();
  const { push } = useToast();
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      ts: new Date().toISOString(),
      type: "info",
      message: "Console d'ingestion prête. Source : WeLoveDevs (1 req/s).",
    },
  ]);
  const [last, setLast] = useState<IngestResult | null>(null);

  const log = (type: LogEntry["type"], message: string) =>
    setLogs((prev) => [
      ...prev,
      { ts: new Date().toISOString(), type, message },
    ]);

  const run = async () => {
    if (!token) return;
    setRunning(true);
    log("info", "Lancement de l'ingestion WeLoveDevs…");
    try {
      const res = await api.triggerIngest(token);
      setLast(res);
      log(
        "success",
        `Terminée — total: ${res.total ?? 0}, insérées: ${res.inserted ?? 0}, doublons: ${res.skipped ?? 0}`,
      );
      push("Ingestion réussie", "success");
    } catch (err) {
      log("error", err instanceof Error ? err.message : "Échec");
      push("Échec de l'ingestion", "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
          {"// ingestion data"}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Pipeline d&apos;ingestion
        </h1>
        <p className="mt-1 text-slate-muted">
          Déclencheur manuel pour récupérer les offres WeLoveDevs, les
          normaliser et les déduper.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-1">
          <SectionHeader
            title="WeLoveDevs"
            icon={<DatabaseIcon className="h-5 w-5" />}
          />
          <div className="space-y-3 text-sm">
            <Row label="Source" value="epi-api.welovedevs.com" mono />
            <Row label="Rate limit" value="1 req/s/student" mono />
            <Row label="Auth" value="API Key (header)" />
            <Row
              label="Dernière exécution"
              value={
                last
                  ? `${last.inserted ?? 0} insérée(s), ${last.skipped ?? 0} doublon(s)`
                  : "—"
              }
            />
          </div>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="btn btn-primary w-full mt-6"
          >
            <RefreshIcon
              className={`h-4 w-4 ${running ? "animate-spin" : ""}`}
            />
            {running ? "Synchronisation…" : "Lancer la synchro"}
          </button>
        </div>

        <div className="card p-6 lg:col-span-2 flex flex-col">
          <SectionHeader
            title="Logs"
            icon={<DatabaseIcon className="h-5 w-5" />}
          />
          <div className="flex-1 rounded-xl bg-slate-ink text-slate-50 p-4 font-mono text-xs overflow-auto max-h-96 space-y-1">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-muted/60">
                  {new Date(l.ts).toLocaleTimeString("fr-FR")}
                </span>
                <span
                  className={
                    l.type === "success"
                      ? "text-mint-500"
                      : l.type === "error"
                        ? "text-flame-400"
                        : "text-ink-200"
                  }
                >
                  {l.type === "success" ? "✓" : l.type === "error" ? "✗" : "›"}
                </span>
                <span className="flex-1 break-words">{l.message}</span>
              </div>
            ))}
            {running && (
              <div className="flex gap-2">
                <span className="text-slate-muted/60">
                  {new Date().toLocaleTimeString("fr-FR")}
                </span>
                <span className="animate-pulse text-amber-300">…</span>
                <span>fetch + normalize + insert</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="card p-5">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2">
          <CheckIcon className="h-4 w-4 text-mint-600" /> Pipeline
        </h3>
        <ol className="space-y-2 text-sm text-slate-muted">
          <li className="flex gap-2">
            <span className="text-ink-700 font-mono">01</span> fetchAllOffers()
            — pagination 100 par 100, respect du rate limit
          </li>
          <li className="flex gap-2">
            <span className="text-ink-700 font-mono">02</span> normalizeOffer()
            — strip HTML, salaire structuré, contrats joints
          </li>
          <li className="flex gap-2">
            <span className="text-ink-700 font-mono">03</span> upsert PG — ON
            CONFLICT (source_id) DO NOTHING
          </li>
          <li className="flex gap-2">
            <span className="text-ink-700 font-mono">04</span> persist — survit
            aux redémarrages container
          </li>
        </ol>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-line pb-2 last:border-0 last:pb-0">
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-muted">
        {label}
      </span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
