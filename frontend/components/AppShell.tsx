"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar, MobileNav, MobileHeader } from "./Sidebar";

export function AppShell({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: "admin";
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (requireRole !== "admin") return;
    if (!user) {
      const next = typeof window !== "undefined" ? window.location.pathname : "/admin";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, requireRole, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-slate-muted">
          <span className="h-3 w-3 animate-pulse rounded-full bg-ink-600" />
          <span className="text-sm">Chargement…</span>
        </div>
      </div>
    );
  }

  if (requireRole === "admin" && (!user || user.role !== "admin")) {
    return null;
  }

  const variant: "user" | "admin" =
    user?.role === "admin" ? "admin" : "user";

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar variant={variant} />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader variant={variant} />
        <main className="container-page py-6 pb-24 md:py-10 md:pb-10">{children}</main>
      </div>
      <MobileNav variant={variant} />
    </div>
  );
}
