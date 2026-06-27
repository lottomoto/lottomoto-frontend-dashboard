"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context";
import { cn } from "@/lib/utils";
import { isAuthenticated, getStoredUser } from "@/lib/auth";

const SUPERVISEUR_PAGES = ["/dashboard", "/succursales", "/rapports", "/profil"];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-17" : "ml-55")}>
      {children}
    </main>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const user = getStoredUser();
    if (user?.role === "superviseur" && !SUPERVISEUR_PAGES.some(p => pathname.startsWith(p))) {
      router.replace("/dashboard");
      return;
    }
    setChecked(true);
  }, [router, pathname]);

  if (!checked) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  );
}
