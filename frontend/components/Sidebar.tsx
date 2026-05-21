"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import {
  HomeIcon,
  SearchIcon,
  HeartIcon,
  ChartIcon,
  SettingsIcon,
  ShieldIcon,
  BriefcaseIcon,
  UsersIcon,
  DatabaseIcon,
  LogoutIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "./Icons";
import type { ReactNode } from "react";
import { initialsOf, displayUserName } from "@/lib/format";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string; // label abrégé pour la bottom bar mobile
  icon: ReactNode;
  exact?: boolean;
}

const userNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <HomeIcon className="h-4 w-4" />,
    exact: true,
  },
  {
    href: "/offers",
    label: "Rechercher",
    icon: <SearchIcon className="h-4 w-4" />,
    exact: true,
  },
  {
    href: "/offers/new",
    label: "Créer une annonce",
    shortLabel: "Créer",
    icon: <SparklesIcon className="h-4 w-4" />,
    exact: true,
  },
  { href: "/saved", label: "Favoris", icon: <HeartIcon className="h-4 w-4" /> },
  {
    href: "/settings",
    label: "Paramètres",
    icon: <SettingsIcon className="h-4 w-4" />,
  },
];

const adminNav: NavItem[] = [
  {
    href: "/admin",
    label: "Vue d'ensemble",
    shortLabel: "Accueil",
    icon: <HomeIcon className="h-4 w-4" />,
    exact: true,
  },
  {
    href: "/admin/offers",
    label: "Offres",
    icon: <BriefcaseIcon className="h-4 w-4" />,
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    icon: <UsersIcon className="h-4 w-4" />,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: <ChartIcon className="h-4 w-4" />,
  },
  {
    href: "/admin/ingest",
    label: "Ingestion data",
    icon: <DatabaseIcon className="h-4 w-4" />,
  },
  {
    href: "/settings",
    label: "Paramètres",
    icon: <SettingsIcon className="h-4 w-4" />,
  },
];

export function Sidebar({ variant }: { variant: "user" | "admin" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const items = variant === "admin" ? adminNav : userNav;

  const onLogout = () => {
    logout();
    router.push("/");
  };

  const isActive = (it: NavItem) =>
    it.exact
      ? pathname === it.href
      : pathname === it.href || pathname.startsWith(it.href + "/");

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 border-r border-slate-line bg-white sticky top-0 h-screen flex-col">
      <div className="px-5 pt-5 pb-5">
        <Logo />
      </div>

      {variant === "admin" && (
        <div className="mx-5 mb-5 rounded-xl border border-flame-500/40 bg-flame-500/10 px-3 py-2 text-xs font-semibold text-flame-600 flex items-center gap-2">
          <ShieldIcon className="h-4 w-4" />
          Mode Administrateur
        </div>
      )}

      {variant === "user" && !user && (
        <div className="mx-5 mb-5 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-700 flex items-center gap-2">
          Connectez-vous pour postuler !
        </div>
      )}

      <nav
        className="flex-1 px-3 space-y-2 overflow-y-auto"
        aria-label="Navigation"
      >
        {items.map((it) => {
          const active = isActive(it);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? variant === "admin"
                    ? "bg-flame-500 text-white shadow-pop"
                    : "bg-ink-600 text-white shadow-pop"
                  : "text-slate-muted hover:text-slate-ink hover:bg-slate-100/60"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  active ? "bg-white/15" : "bg-slate-100/60"
                }`}
              >
                {it.icon}
              </span>
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-line p-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{
                background:
                  variant === "admin"
                    ? "linear-gradient(135deg, #FF5733, #E63E1A)"
                    : "linear-gradient(135deg, #0A2EFF, #3D5AFE)",
              }}
              aria-hidden
            >
              {initialsOf(
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email || user.id || "??",
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-mono text-slate-muted uppercase tracking-wider">
                {user.role === "admin" ? "ADMIN" : "USER"}
              </div>
              <div className="text-sm font-medium truncate">
                {displayUserName(user)}
              </div>
              {user.firstName && (
                <div className="text-[11px] text-slate-muted truncate">
                  {user.email}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg p-2 text-slate-muted hover:text-flame-600 hover:bg-flame-500/10 transition"
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="btn btn-primary w-full !text-sm !py-2.5"
            >
              Se connecter
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="text-center block text-xs text-slate-muted hover:text-ink-700"
            >
              Pas de compte ? Créer un compte →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

// Bottom nav: 4 items max — Settings & Ingestion exclus (accessibles via menu top-right)
const MOBILE_EXCLUDED = ["/settings", "/admin/ingest"];
const userMobileNav: NavItem[] = userNav
  .filter((it) => !MOBILE_EXCLUDED.includes(it.href))
  .slice(0, 4);
const adminMobileNav: NavItem[] = adminNav
  .filter((it) => !MOBILE_EXCLUDED.includes(it.href))
  .slice(0, 4);

export function MobileNav({ variant }: { variant: "user" | "admin" }) {
  const pathname = usePathname();
  const items = variant === "admin" ? adminMobileNav : userMobileNav;

  const isActive = (it: NavItem) =>
    it.exact
      ? pathname === it.href
      : pathname === it.href || pathname.startsWith(it.href + "/");

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-line bg-white/95 backdrop-blur"
      aria-label="Navigation mobile"
    >
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const active = isActive(it);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active
                  ? variant === "admin"
                    ? "text-flame-600"
                    : "text-ink-700"
                  : "text-slate-muted"
              }`}
            >
              <span
                className={`h-1 w-6 rounded-full ${
                  active
                    ? variant === "admin"
                      ? "bg-flame-500"
                      : "bg-ink-600"
                    : "bg-transparent"
                }`}
              />
              {it.icon}
              {it.shortLabel ?? it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader({ variant }: { variant: "user" | "admin" }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onLogout = () => {
    logout();
    router.push("/");
    setOpen(false);
  };

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-line bg-white/95 px-4 backdrop-blur h-14">
      <Logo />

      {variant === "admin" && (
        <div className="flex items-center gap-1 rounded-full border border-flame-500/40 bg-flame-500/10 px-2.5 py-1 text-[10px] font-semibold text-flame-600">
          <ShieldIcon className="h-3 w-3" />
          Admin
        </div>
      )}

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu utilisateur"
          aria-expanded={open}
          className="flex items-center"
        >
          {user ? (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ring-2 ring-white"
              style={{
                background:
                  variant === "admin"
                    ? "linear-gradient(135deg, #FF5733, #E63E1A)"
                    : "linear-gradient(135deg, #0A2EFF, #3D5AFE)",
              }}
            >
              {initialsOf(
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email || user.id || "??",
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-ink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
              Se connecter
              <ArrowRightIcon className="h-3 w-3" />
            </span>
          )}
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            {/* Dropdown */}
            <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-slate-line bg-white p-1.5 shadow-xl">
              {user ? (
                <>
                  <div className="border-b border-slate-line px-3 py-2.5 mb-1">
                    <div className="text-sm font-semibold text-slate-ink truncate">
                      {displayUserName(user)}
                    </div>
                    <div className="text-[11px] text-slate-muted truncate mt-0.5">
                      {user.email}
                    </div>
                  </div>
                  {variant === "admin" && (
                    <Link
                      href="/admin/ingest"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-ink hover:bg-flame-500/10 transition"
                    >
                      <DatabaseIcon className="h-4 w-4 text-flame-500" />
                      Ingestion data
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-ink hover:bg-ink-50 transition"
                  >
                    <SettingsIcon className="h-4 w-4 text-slate-muted" />
                    Paramètres
                  </Link>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-flame-600 hover:bg-flame-500/10 transition"
                  >
                    <LogoutIcon className="h-4 w-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 transition"
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-muted hover:bg-slate-100/60 transition"
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
