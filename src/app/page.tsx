"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PinPad from "@/components/PinPad";
import { supabase } from "@/lib/supabase";
import { saveSession, getSession } from "@/lib/auth";
import { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session && session.user_role) {
      router.replace(session.user_role === "staff" ? "/staff" : "/manager");
    }
  }, [router]);

  useEffect(() => {
    if (pin.length !== 4 || checking) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(true);

    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("pin", pin)
        .maybeSingle<User>();

      if (cancelled) return;

      if (error || !data) {
        setShake(true);
        setTimeout(() => {
          if (cancelled) return;
          setPin("");
          setShake(false);
          setChecking(false);
        }, 400);
        return;
      }

      saveSession({
        id: data.id,
        name: data.name,
        role: data.role,
        user_role: data.user_role,
        accessible_categories: data.accessible_categories ?? [],
      });
      router.replace(data.user_role === "staff" ? "/staff" : "/manager");
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-screen flex-1 flex-col items-center justify-center gap-16 bg-brown px-6"
    >
      <div className="flex flex-col items-center gap-2">
        <h1
          className="text-[32px] tracking-wide text-cream lowercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          wee café
        </h1>
        <p className="text-sm uppercase text-pink" style={{ letterSpacing: "0.15em" }}>
          operations
        </p>
      </div>

      <PinPad
        pin={pin}
        onDigit={(d) => {
          if (checking) return;
          setPin((prev) => (prev.length < 4 ? prev + d : prev));
        }}
        onBackspace={() => {
          if (checking) return;
          setPin((prev) => prev.slice(0, -1));
        }}
        shake={shake}
        disabled={checking}
      />
    </motion.div>
  );
}
