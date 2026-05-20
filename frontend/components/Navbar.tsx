"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { MenuIcon, XIcon } from "./Icons";

const marketingLinks = [
  { href: "/#product", label: "Produit" },
  { href: "/#features", label: "Fonctionnalités" },
];

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-line bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navigation principale"
        >
          {marketingLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-full text-sm font-medium transition ${
                  active
                    ? "text-ink-700 bg-ink-50"
                    : "text-slate-muted hover:text-slate-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link
              href={user.role === "admin" ? "/admin" : "/dashboard"}
              className="btn btn-primary"
            >
              Ouvrir l&apos;app
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Se connecter
              </Link>
              <Link href="/register" className="btn btn-primary">
                Créer un compte
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="md:hidden btn btn-secondary !p-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <XIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-line bg-white">
          <div className="container-page py-3 flex flex-col gap-1">
            {marketingLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-ink-50"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-line flex gap-2">
              {user ? (
                <Link
                  href={user.role === "admin" ? "/admin" : "/dashboard"}
                  className="btn btn-primary flex-1"
                  onClick={() => setOpen(false)}
                >
                  Ouvrir l&apos;app
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn btn-secondary flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="btn btn-primary flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
