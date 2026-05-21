"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "./Icons";

interface PaginationProps {
  page: number; // 0-based
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

/**
 * Génère la liste des pages à afficher avec ellipses.
 * Exemple sur 16 pages, currentPage=5 :
 *   [0, "...", 4, 5, 6, "...", 15]
 */
function buildPageList(current: number, last: number): Array<number | "ellipsis"> {
  if (last <= 6) {
    return Array.from({ length: last + 1 }, (_, i) => i);
  }
  const pages: Array<number | "ellipsis"> = [0];
  const start = Math.max(1, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 1) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < last - 1) pages.push("ellipsis");
  pages.push(last);
  return pages;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  if (lastPage === 0) return null;

  const pages = buildPageList(page, lastPage);
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <nav
      className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2"
      aria-label="Pagination"
    >
      <p className="text-xs text-slate-muted font-mono tabular-nums">
        {from.toLocaleString("fr-FR")}–{to.toLocaleString("fr-FR")} sur{" "}
        {total.toLocaleString("fr-FR")}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          aria-label="Page précédente"
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-line bg-white text-slate-muted hover:text-slate-ink hover:border-ink-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`e-${i}`}
              className="px-2 text-slate-muted text-sm select-none"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p + 1}`}
              className={`h-9 min-w-9 px-3 rounded-lg text-sm font-semibold transition ${
                p === page
                  ? "bg-ink-600 text-white shadow-pop"
                  : "border border-slate-line bg-white text-slate-ink hover:border-ink-300"
              }`}
            >
              {p + 1}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onChange(Math.min(lastPage, page + 1))}
          disabled={page >= lastPage}
          aria-label="Page suivante"
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-line bg-white text-slate-muted hover:text-slate-ink hover:border-ink-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
