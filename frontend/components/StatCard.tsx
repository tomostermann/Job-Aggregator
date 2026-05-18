import type { ReactNode } from "react";

type StatTone = "ink" | "mint" | "flame" | "amber";

const toneClass: Record<StatTone, string> = {
  ink: "text-ink-600",
  mint: "text-mint-600",
  flame: "text-flame-600",
  amber: "text-amber-500",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className="card p-5 flex flex-col gap-2 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-mono tracking-[0.18em] text-slate-muted uppercase">
          {label}
        </div>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 ${toneClass[tone]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`font-display text-3xl md:text-4xl font-bold leading-none ${toneClass[tone]}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-slate-muted">{hint}</div>}
    </div>
  );
}
