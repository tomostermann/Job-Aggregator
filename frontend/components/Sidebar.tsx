"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import {
  HomeIcon,
  SearchIcon,
  HeartIcon,
  SettingsIcon,
  ShieldIcon,
  LogoutIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "./Icons";
import type { ReactNode } from "react";
import { initialsOf, displayUserName } from "@/lib/format";

interface NavItem {
  href: string;
  label: string;
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

const adminNav: NavItem[] = [];

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

export function MobileNav({ variant }: { variant: "user" | "admin" }) {
  const pathname = usePathname();
  const items =
    variant === "admin" ? adminNav.slice(0, 4) : userNav.slice(0, 4);

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
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
