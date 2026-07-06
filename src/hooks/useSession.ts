"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { Role, SessionUser } from "@/lib/types";

export function useSession(requiredRole?: Role) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    if (requiredRole && session.role !== requiredRole) {
      router.replace(session.role === "manager" ? "/manager" : "/staff");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(session);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    clearSession();
    router.replace("/");
  }

  return { user, ready, logout };
}
