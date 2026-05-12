"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "jobaggregator.saved";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("jobaggregator:saved-changed"));
}

export function useSavedOffers() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const onChange = () => setIds(read());
    window.addEventListener("jobaggregator:saved-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("jobaggregator:saved-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    write(next);
    setIds(next);
    return next.includes(id);
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((x) => x !== id);
    write(next);
    setIds(next);
  }, []);

  return { ids, isSaved, toggle, remove };
}
