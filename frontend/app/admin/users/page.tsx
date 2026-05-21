"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ShieldIcon, RefreshIcon, TrashIcon } from "@/components/Icons";
import { api, type AdminUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatDate, initialsOf, colorFromString } from "@/lib/format";

const fullName = (u: AdminUser): string => {
  const first = u.first_name?.trim();
  const last = u.last_name?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return "";
};

export default function AdminUsersPage() {
  return (
    <AppShell requireRole="admin">
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const { token, user: me } = useAuth();
  const { push } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await api.adminUsers(token);
      setUsers(list);
    } catch (err) {
      push(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const setRole = async (u: AdminUser, role: "user" | "admin") => {
    if (!token) return;
    setPending(u.id);
    try {
      const updated = await api.adminSetUserRole(token, u.id, role);
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role: updated.role } : x)),
      );
      push(`${u.email} → ${role}`, "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setPending(null);
    }
  };

  const onDelete = async (u: AdminUser) => {
    if (!token) return;
    const name = fullName(u) || u.email;
    if (
      !window.confirm(
        `Supprimer définitivement le compte de ${name} ?\n\nLes favoris seront effacés et ses offres créées resteront mais sans propriétaire.`,
      )
    )
      return;
    setPending(u.id);
    try {
      await api.adminDeleteUser(token, u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      push(`${u.email} supprimé`, "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-flame-500 mb-1">
            {"// gestion utilisateurs"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Utilisateurs
          </h1>
          <p className="mt-1 text-slate-muted">
            {users.length} compte{users.length > 1 ? "s" : ""} · gérez les rôles
            et révoquez les accès.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn btn-secondary">
          <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Recharger
        </button>
      </header>

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_120px_140px_180px] gap-3 px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-muted border-b border-slate-line bg-slate-50">
          <div>Email</div>
          <div>Rôle</div>
          <div>Inscription</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-slate-line">
          {loading ? (
            <div className="p-8 text-center text-slate-muted text-sm">
              Chargement…
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-muted text-sm">
              Aucun utilisateur.
            </div>
          ) : (
            users.map((u) => {
              const isMe = me?.id === u.id;
              return (
                <div
                  key={u.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_180px] gap-3 px-5 py-3 items-center text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      aria-hidden
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${colorFromString(u.email)}, ${colorFromString(u.email)}cc)`,
                      }}
                    >
                      {initialsOf(u.email)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        {fullName(u) || u.email}
                        {isMe && (
                          <span className="pill pill-mint !text-[10px]">
                            vous
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-muted truncate">
                        {u.email}
                        <span className="md:hidden">
                          {" · "}
                          {u.role} · {formatDate(u.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span
                      className={`pill ${u.role === "admin" ? "pill-flame" : "pill-slate"}`}
                    >
                      {u.role === "admin" && <ShieldIcon className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </div>
                  <div className="hidden md:block text-xs text-slate-muted">
                    {formatDate(u.created_at)}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {u.role === "user" ? (
                      <button
                        onClick={() => setRole(u, "admin")}
                        disabled={pending === u.id}
                        className="btn btn-primary !py-1.5 !px-3 !text-xs"
                      >
                        Promouvoir admin
                      </button>
                    ) : (
                      <button
                        onClick={() => setRole(u, "user")}
                        disabled={pending === u.id || isMe}
                        title={
                          isMe
                            ? "Vous ne pouvez pas vous révoquer vous-même"
                            : ""
                        }
                        className="btn btn-secondary !py-1.5 !px-3 !text-xs"
                      >
                        Révoquer admin
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(u)}
                      disabled={pending === u.id || isMe}
                      title={
                        isMe
                          ? "Vous ne pouvez pas supprimer votre propre compte"
                          : "Supprimer ce compte"
                      }
                      className="btn !py-1.5 !px-3 !text-xs bg-flame-500/10 text-flame-600 border border-flame-500/30 hover:bg-flame-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-flame-500/10 disabled:hover:text-flame-600"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      {pending === u.id ? "…" : "Supprimer"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
