"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Circle,
  BarChart3,
  Settings,
  Trophy,
  PanelLeftClose,
  PanelLeftOpen,
  Ticket,
  Megaphone,
  CalendarClock,
  LogOut,
  ClipboardList,
  Landmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";
import { getStoredUser, logout } from "@/lib/auth";
import api from "@/lib/api";

const ALL_NAV = [
  { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'superviseur', 'comptable'] },
  { label: "Vendeurs", href: "/vendeurs", icon: Users, roles: ['admin'] },
  { label: "Succursales", href: "/succursales", icon: Building2, roles: ['admin', 'superviseur'] },
  { label: "Collectes", href: "/collectes", icon: Landmark, roles: ['comptable'] },
  { label: "Boules", href: "/boules", icon: Circle, roles: ['admin'] },
  { label: "Tickets", href: "/tickets", icon: Ticket, roles: ['admin'] },
  { label: "Rapports", href: "/rapports", icon: BarChart3, roles: ['admin', 'superviseur', 'comptable'] },
];

const ALL_GESTION = [
  { label: "Résultats", href: "/resultats", icon: Megaphone, roles: ['admin'] },
  { label: "Tirages & Borlettes", href: "/tirages", icon: CalendarClock, roles: ['admin'] },
];

const ALL_SYSTEM = [
  { label: "Historique (Logs)", href: "/logs", icon: ClipboardList, roles: ['admin'] },
  { label: "Paramètres", href: "/parametres", icon: Settings, roles: ['admin'] },
];

function useTirages() {
  const [tirages, setTirages] = useState<{ label: string; status: string }[]>([]);
  useEffect(() => {
    api.get<any[]>("/borlettes").then(({ data }) => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hh}:${mm}`;
      const allTirages = data.flatMap((b: any) => b.tirages || []);
      const unique = [...new Map(allTirages.map((t: any) => [t.nom, t])).values()] as any[];
      setTirages(unique.map((t: any) => ({
        label: `${t.nom} ${t.fermeture}`,
        status: currentTime < t.fermeture ? "active" : "done",
      })));
    }).catch(() => {});
  }, []);
  return tirages;
}

type NavItem = { label: string; href: string; icon: React.ElementType; badge?: number };

function NavSection({ label, items, collapsed, pathname }: { label: string; items: NavItem[]; collapsed: boolean; pathname: string }) {
  return (
    <div className={collapsed ? "space-y-0.5" : "space-y-0.5"}>
      {label && !collapsed && (
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      {label && collapsed && (
        <div className="my-1 mx-auto h-px w-6 bg-sidebar-border" />
      )}
      {items.map((item) => {
        const isActive = pathname === item.href;
        const linkContent = (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-lg transition-colors",
              collapsed ? "h-10 w-10 justify-center" : "gap-3 px-3 py-2.5 text-sm",
              isActive
                ? "bg-primary/15 text-primary font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="flex-1">{item.label}</span>}
            {!collapsed && item.badge && (
              <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                {item.badge}
              </Badge>
            )}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger>
                <div className="relative">
                  {linkContent}
                  {item.badge && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return linkContent;
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const user = getStoredUser();
  const role = user?.role || 'admin';
  const tirages = useTirages();
  const navItems = ALL_NAV.filter(i => i.roles.includes(role));
  const gestionItems = ALL_GESTION.filter(i => i.roles.includes(role));
  const systemItems = ALL_SYSTEM.filter(i => i.roles.includes(role));

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[220px]"
        )}
      >
        {/* Logo block */}
        <div className={cn("flex items-center py-4", collapsed ? "flex-col gap-2 px-0" : "justify-between px-5")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-extrabold leading-tight tracking-wide">
                  LA DIFFÉRENCE
                </p>
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">
                  LOTTO / MOTO
                </p>
              </div>
            )}
          </div>
          <button onClick={toggle} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Tirages section */}
        {!collapsed ? (
          <div className="mx-4 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-4 py-3">
            <p className="mb-3 text-[10px] font-bold tracking-[0.15em] text-primary">
              TIRAGES AUJOURD&apos;HUI
            </p>
            <div className="space-y-2.5">
              {tirages.map((t) => (
                <div key={t.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        t.status === "active" ? "bg-muted-foreground/40" : "bg-success"
                      )}
                    />
                    <span className="text-[13px] text-sidebar-foreground/80">{t.label}</span>
                  </div>
                  {t.status === "active" && (
                    <span className="text-[11px] font-semibold text-primary">EN COURS</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex flex-col items-center gap-1.5 px-2 py-2">
            {tirages.map((t) => (
              <Tooltip key={t.label}>
                <TooltipTrigger>
                  <span
                    className={cn(
                      "block h-2.5 w-2.5 rounded-full",
                      t.status === "active" ? "bg-muted-foreground/40" : "bg-success"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t.label}{t.status === "active" ? " — EN COURS" : ""}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Navigation */}
        <nav className={cn("mt-4 flex-1 overflow-y-auto", collapsed ? "flex flex-col items-center px-2 gap-0.5" : "px-3 space-y-4")}>
          <NavSection label="" items={navItems} collapsed={collapsed} pathname={pathname} />
          {gestionItems.length > 0 && <NavSection label="Gestion" items={gestionItems} collapsed={collapsed} pathname={pathname} />}
          {systemItems.length > 0 && <NavSection label="Système" items={systemItems} collapsed={collapsed} pathname={pathname} />}
        </nav>

        {/* Profile + Logout */}
        <div className={cn("border-t border-sidebar-border p-3", collapsed ? "flex flex-col items-center gap-2" : "")}>
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger>
                  <Link href="/profil" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors">
                    {user ? `${user.firstname[0]}${user.lastname[0]}` : "??"}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{user ? `${user.firstname} ${user.lastname}` : "Non connecté"}</p>
                  <p className="text-muted-foreground text-[10px]">{user?.email}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <button
                    onClick={logout}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Déconnexion</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/profil" className="flex items-center gap-3 flex-1 min-w-0 rounded-lg hover:bg-sidebar-accent p-1 -m-1 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                  {user ? `${user.firstname[0]}${user.lastname[0]}` : "??"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user ? `${user.firstname} ${user.lastname}` : "Non connecté"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </Link>
              <button
                onClick={logout}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
