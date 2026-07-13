"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { SessionUser } from "@/lib/types";

type Area = "staff" | "manager";

export function useSession(area?: Area) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    // Sessions saved before the roles migration lack user_role — force re-login.
    if (!session || !session.user_role) {
      clearSession();
      router.replace("/");
      return;
    }
    const home = session.user_role === "staff" ? "/staff" : "/manager";
    if (area === "staff" && session.user_role !== "staff") {
      router.replace(home);
      return;
    }
    if (area === "manager" && session.user_role === "staff") {
      router.replace(home);
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
