"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "./auth-context";
import { useToast } from "./toast-context";

export function useAuthGate() {
  const { user } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const requireLogin = useCallback(
    (action: string) => {
      if (user) return true;
      push(`Connectez-vous pour ${action}.`, "info");
      const target = pathname || "/";
      router.push(`/login?next=${encodeURIComponent(target)}`);
      return false;
    },
    [user, push, router, pathname],
  );

  return { user, requireLogin };
}
