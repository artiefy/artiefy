"use client"; // ✅ Es necesario porque usa React Hooks

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import usePageTimeTracker from "~/hooks/usePageTimeTracker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      console.log(`✅ Usuario autenticado en Dashboard: ${user.id}`);
    }
  }, [user]);

  // 🔥 Activa el rastreo de tiempo dentro del Dashboard
  usePageTimeTracker(user?.id ?? null, null);

  return <section className="p-4">Luis es una bitch {children}</section>;
}
