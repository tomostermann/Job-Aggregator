"use client";

import { useState } from "react";
import { FilterIcon, XIcon } from "./Icons";

export interface Filters {
  contractTypes: string[];
  location: string;
  remoteOnly: boolean;
  stageMin: string;
  stageMax: string;
}

const CONTRACT_OPTIONS = ["CDI", "CDD", "Stage", "Alternance", "Freelance"];

const STAGE_DURATION_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function FilterPanel({
  filters,
  onChange,
  onReset,
  total,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
  total: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-ink-700" />
          <h2 className="font-display font-bold text-lg">Filtres</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-muted hover:text-flame-600"
        >
          Réinitialiser
        </button>
      </div>

      <div>
        <div className="label">Type de contrat</div>
        <div className="space-y-1.5">
          {CONTRACT_OPTIONS.map((c) => {
            const checked = filters.contractTypes.includes(c);
            return (
              <label
                key={c}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer text-sm transition ${
                  checked
                    ? "bg-ink-50 border border-ink-200/60 text-ink-700 font-semibold"
                    : "border border-transparent hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-ink-600"
                  checked={checked}
                  onChange={() => {
                    const nextContracts = checked
                      ? filters.contractTypes.filter((x) => x !== c)
                      : [...filters.contractTypes, c];
                    onChange({
                      ...filters,
                      contractTypes: nextContracts,
                      ...(c === "Stage" && checked
                        ? { stageMin: "", stageMax: "" }
                        : {}),
                    });
                  }}
                />
                <span>{c}</span>
              </label>
            );
          })}
        </div>
        {filters.contractTypes.includes("Stage") && (
          <div className="mt-3">
            <label htmlFor="filter-stage-min" className="label">
              Durée du stage
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                id="filter-stage-min"
                className="input !w-16 !py-1 !px-2 !text-sm"
                value={filters.stageMin}
                onChange={(e) =>
                  onChange({ ...filters, stageMin: e.target.value })
                }
              >
                <option value="">—</option>
                {STAGE_DURATION_MONTHS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-muted">à</span>
              <select
                aria-label="Durée maximum"
                className="input !w-16 !py-1 !px-2 !text-sm"
                value={filters.stageMax}
                onChange={(e) =>
                  onChange({ ...filters, stageMax: e.target.value })
                }
              >
                <option value="">—</option>
                {STAGE_DURATION_MONTHS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-sm font-semibold text-slate-muted">
                mois
              </span>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="filter-location" className="label">Lieu</label>
        <input
          id="filter-location"
          type="text"
          className="input"
          placeholder="Paris, Lyon, remote…"
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-ink-600"
          checked={filters.remoteOnly}
          onChange={(e) => onChange({ ...filters, remoteOnly: e.target.checked })}
        />
        Télétravail possible
      </label>

      <div className="rounded-xl border border-slate-line p-3 bg-slate-50/60">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-muted">
          Résultats
        </div>
        <div className="mt-1 font-display text-2xl font-bold text-ink-700">
          {total.toLocaleString("fr-FR")}
          <span className="ml-1 text-xs text-slate-muted font-medium">
            offres
          </span>
        </div>
      </div>
    </div>
  );
}

export function FilterPanelMobile({
  filters,
  onChange,
  onReset,
  total,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const activeCount =
    filters.contractTypes.length +
    (filters.location ? 1 : 0) +
    (filters.remoteOnly ? 1 : 0) +
    (filters.stageMin || filters.stageMax ? 1 : 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary lg:hidden w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4" />
          Filtres
          {activeCount > 0 && (
            <span className="pill pill-flame !px-2 !py-0 !text-[10px]">
              {activeCount}
            </span>
          )}
        </span>
        <span className="text-xs text-slate-muted">{total} offres</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
          />
          <div className="relative w-full bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">Filtres</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-slate-100"
                aria-label="Fermer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={onChange}
              onReset={onReset}
              total={total}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-primary w-full mt-6"
            >
              Appliquer ({total})
            </button>
          </div>
        </div>
      )}
    </>
  );
}
