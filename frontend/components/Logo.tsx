"use client";
import Link from "next/link";

export function Logo({
  className = "",
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-display tracking-tight ${className}`}
      aria-label="Job Aggregator — accueil"
    >
      <span
        aria-hidden
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold ${
          invert ? "bg-white text-ink-700" : "bg-ink-600 text-white"
        }`}
      >
        {"{ }"}
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`text-base font-semibold ${invert ? "text-white" : "text-slate-ink"}`}
        >
          Job Aggregator
        </span>
      </span>
    </Link>
  );
}
