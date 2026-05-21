import type { ReactNode } from "react";

export function SectionHeader({
  title,
  badge,
  badgeVariant = "ai",
  action,
  description,
  icon,
}: {
  title: string;
  badge?: string;
  badgeVariant?: "ai" | "data" | "neutral";
  action?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <div className="flex items-center flex-wrap gap-2">
          {icon && <span className="text-ink-600 shrink-0">{icon}</span>}
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
          {badge && (
            <span
              className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md font-bold ${
                badgeVariant === "ai"
                  ? "bg-flame-500/10 text-flame-600 border border-flame-500/30"
                  : badgeVariant === "data"
                    ? "bg-ink-600/10 text-ink-700 border border-ink-600/20"
                    : "bg-slate-100 text-slate-muted border border-slate-line"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-slate-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
