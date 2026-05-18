"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";

const KEY = "jobaggregator.saved";
const MIGRATED_KEY = "jobaggregator.saved.migrated";
const CHANGE_EVENT = "jobaggregator:saved-changed";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function clearLocal() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function notifyChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * Hook hybride :
 *   - Connecté → favoris persistés sur le compte via /api/saved
 *   - Visiteur → fallback localStorage
 *   - Au premier login, les favoris locaux sont migrés automatiquement.
 *
 * L'interface reste la même (`ids`, `isSaved`, `toggle`, `remove`) pour
 * que tous les composants existants fonctionnent sans modif.
 */
export function useSavedOffers() {
  const { user, token } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const migrationRanRef = useRef(false);

  const isAuthed = Boolean(user && token);

  // Charge l'état initial selon l'auth
  const loadRemote = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const offers = await api.getSavedOffers(token);
      const remoteIds = offers.map((o) => o.id);
      setIds(remoteIds);
    } catch {
      // En cas d'échec réseau, on retombe sur localStorage pour ne pas bloquer
      setIds(readLocal());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthed) {
      // Migration unique des favoris locaux vers le compte au premier login
      (async () => {
        if (!migrationRanRef.current && token) {
          migrationRanRef.current = true;
          const local = readLocal();
          const alreadyMigrated =
            typeof window !== "undefined" &&
            window.localStorage.getItem(MIGRATED_KEY) === user?.id;
          if (local.length > 0 && !alreadyMigrated) {
            try {
              await api.migrateSavedOffers(token, local);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(MIGRATED_KEY, user?.id ?? "1");
              }
              clearLocal();
            } catch {
              // Si la migration échoue, on garde le localStorage pour réessayer
            }
          }
        }
        await loadRemote();
      })();
    } else {
      // Mode visiteur : localStorage
      migrationRanRef.current = false;
      setIds(readLocal());
    }

    const onChange = () => {
      if (isAuthed) {
        loadRemote();
      } else {
        setIds(readLocal());
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(CHANGE_EVENT, onChange);
      window.addEventListener("storage", onChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onChange);
      }
    };
  }, [isAuthed, loadRemote, token, user?.id]);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      const willBeSaved = !ids.includes(id);

      if (isAuthed && token) {
        // Optimistic UI
        setIds((prev) =>
          willBeSaved ? [...prev, id] : prev.filter((x) => x !== id),
        );
        const call = willBeSaved
          ? api.saveOffer(token, id)
          : api.unsaveOffer(token, id);
        call
          .then(() => notifyChanged())
          .catch(() => {
            // Rollback en cas d'erreur
            setIds((prev) =>
              willBeSaved ? prev.filter((x) => x !== id) : [...prev, id],
            );
          });
      } else {
        const current = readLocal();
        const next = willBeSaved
          ? [...current, id]
          : current.filter((x) => x !== id);
        writeLocal(next);
        setIds(next);
      }
      return willBeSaved;
    },
    [ids, isAuthed, token],
  );

  const remove = useCallback(
    (id: string) => {
      if (isAuthed && token) {
        setIds((prev) => prev.filter((x) => x !== id));
        api
          .unsaveOffer(token, id)
          .then(() => notifyChanged())
          .catch(() => setIds((prev) => [...prev, id]));
      } else {
        const next = readLocal().filter((x) => x !== id);
        writeLocal(next);
        setIds(next);
      }
    },
    [isAuthed, token],
  );

  return { ids, isSaved, toggle, remove, loading, isAuthed };
}
