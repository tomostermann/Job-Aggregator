"use client";

import { useMemo } from "react";
import type { Offer } from "@/lib/types";

const MONTH_LABELS_FR = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
];

interface MonthBucket {
  key: string;
  label: string;
  fullLabel: string;
  count: number;
}

export function OffersPerMonth({
  offers,
  data,
  monthsBack = 6,
}: {
  offers?: Offer[];
  data?: { key: string; count: number }[];
  monthsBack?: number;
}) {
  const buckets = useMemo<MonthBucket[]>(() => {
    const now = new Date();
    const list: MonthBucket[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      list.push({
        key,
        label: MONTH_LABELS_FR[d.getMonth()],
        fullLabel: `${MONTH_LABELS_FR[d.getMonth()]} ${d.getFullYear()}`,
        count: 0,
      });
    }
    if (data) {
      const m = new Map(data.map((d) => [d.key, d.count]));
      for (const b of list) b.count = m.get(b.key) ?? 0;
    } else if (offers) {
      for (const o of offers) {
        if (!o.published_at) continue;
        const t = new Date(o.published_at);
        if (Number.isNaN(t.getTime())) continue;
        const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
        const bucket = list.find((b) => b.key === key);
        if (bucket) bucket.count++;
      }
    }
    return list;
  }, [offers, data, monthsBack]);

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((a, b) => a + b.count, 0);
  const lastCount = buckets[buckets.length - 1]?.count ?? 0;
  const prevCount = buckets[buckets.length - 2]?.count ?? 0;
  const delta = prevCount === 0 ? 0 : ((lastCount - prevCount) / prevCount) * 100;

  const CHART_HEIGHT_PX = 176;
  const LABEL_HEIGHT_PX = 22;
  const BAR_AREA_PX = CHART_HEIGHT_PX - LABEL_HEIGHT_PX;

  return (
    <div className="space-y-3">
      {/* Scrollable horizontalement sur mobile quand beaucoup de mois */}
      <div className="overflow-x-auto -mx-1 pb-1">
        <div
          className="flex items-end gap-2 px-1"
          style={{
            height: CHART_HEIGHT_PX,
            minWidth: `${buckets.length * 40}px`,
          }}
        >
          {buckets.map((b) => {
            const h = (b.count / max) * BAR_AREA_PX;
            return (
              <div
                key={b.key}
                className="flex-1 min-w-[32px] flex flex-col justify-end items-center gap-2 group h-full"
              >
                <div className="text-xs font-mono text-slate-ink opacity-0 group-hover:opacity-100 transition tabular-nums">
                  {b.count}
                </div>
                <div
                  className="w-full rounded-t-lg transition-all bg-gradient-to-t from-ink-600 to-ink-400"
                  style={{ height: `${Math.max(4, h)}px` }}
                  aria-label={`${b.fullLabel} : ${b.count} offres`}
                  role="img"
                  title={`${b.fullLabel} — ${b.count} offres`}
                />
                <div className="text-[10px] font-mono text-slate-muted whitespace-nowrap">
                  {b.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-muted">
        <span>
          {total === 0
            ? "Aucune offre datée sur la période"
            : `${total} offres sur les ${monthsBack} derniers mois`}
        </span>
        {prevCount > 0 && (
          <span
            className={`font-mono tabular-nums font-semibold ${
              delta >= 0 ? "text-mint-600" : "text-flame-600"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(0)}% vs mois précédent
          </span>
        )}
      </div>
    </div>
  );
}

export function ContractDistribution({
  offers,
  data: providedData,
}: {
  offers?: Offer[];
  data?: { type: string; count: number }[];
}) {
  const data = useMemo<[string, number][]>(() => {
    if (providedData) {
      return providedData
        .slice()
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((d) => [d.type, d.count] as [string, number]);
    }
    const counts = new Map<string, number>();
    for (const o of offers ?? []) {
      const list = (o.contract_type ?? "—")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const c of list.length ? list : ["—"]) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [offers, providedData]);
  const total = data.reduce((a, [, n]) => a + n, 0) || 1;

  return (
    <div className="space-y-2">
      {data.map(([label, count]) => {
        const pct = (count / total) * 100;
        return (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{label}</span>
              <span className="text-slate-muted font-mono">
                {count} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ink-600 to-ink-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {data.length === 0 && <div className="text-sm text-slate-muted">Aucune donnée</div>}
    </div>
  );
}
