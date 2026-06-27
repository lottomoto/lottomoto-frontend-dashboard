"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Users, Ticket, CircleOff, Loader2, Building2, Banknote, AlertTriangle } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { BetTypesChart } from "@/components/dashboard/bet-types-chart";
import { SalesByBranch } from "@/components/dashboard/sales-by-branch";
import { TopBoules } from "@/components/dashboard/top-boules";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

interface DashboardStats {
  recettes: number;
  paiements: number;
  benefice: number;
  ticketCount: number;
  vendeursActifs: number;
  boulesBloquees: number;
  tirageActif: string | null;
  lotto4: number;
  lotto5: number;
  topBoules: { numero: number; count: number }[];
  topVendeurs: { nom: string; ventes: number; tickets: number }[];
  parBorlette: { nom: string; recettes: number; paiements: number; benefice: number }[];
  revenueByTirage: { [tirage: string]: string | number; date: string }[];
  tirageNames: string[];
  recentTickets: { ref: string; vendeur: string; total: number; tirage: string; createdAt: string }[];
}

interface SuccursaleData {
  id: string;
  nom: string;
  isActive: boolean;
  vendeur: string | null;
  ventes: number;
  tickets: number;
  cashCollecte: number;
  dette: number;
  notes: string;
}

interface SuperviseurDashboard {
  succursales: SuccursaleData[];
  totaux: { ventes: number; cashEnMain: number; dette: number };
}

const fmt = (n: number | undefined | null) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toLocaleString();
};

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<DashboardStats>("/tickets/admin/stats?periode=auj");
      setStats(data);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading && !stats) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!stats) return null;

  return (
    <>
      <AlertBanner boulesBloquees={stats.boulesBloquees} topBoule={stats.topBoules[0]} />
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Ventes aujourd'hui" value={`${fmt(stats.recettes)} HTG`} subtitle={`${stats.ticketCount} tickets`} icon={DollarSign} iconBg="bg-orange-500" />
        <StatCard title="Vendeurs actifs" value={String(stats.vendeursActifs)} subtitle="aujourd'hui" icon={Users} iconBg="bg-blue-500" />
        <StatCard title="Tickets vendus" value={stats.ticketCount.toLocaleString()} subtitle={`${stats.lotto4} L4 · ${stats.lotto5} L5`} subtitleColor="text-primary" icon={Ticket} iconBg="bg-purple-500" />
        <StatCard title="Boules bloquées" value={String(stats.boulesBloquees)} subtitle="sur 100 disponibles" subtitleColor="text-destructive" icon={CircleOff} iconBg="bg-destructive" />
      </div>
      <div className="flex gap-4">
        <RevenueChart data={stats.revenueByTirage || []} tirages={stats.tirageNames || []} />
        <BetTypesChart lotto4={stats.lotto4} lotto5={stats.lotto5} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SalesByBranch data={stats.parBorlette} />
        <TopBoules data={stats.topBoules} />
        <RecentActivity data={stats.recentTickets} />
      </div>
    </>
  );
}

function SuperviseurDashboardView() {
  const [data, setData] = useState<SuperviseurDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDash = useCallback(async () => {
    try {
      setLoading(true);
      const { data: d } = await api.get<SuperviseurDashboard>("/succursales/me/dashboard");
      setData(d);
    } catch {
      setData({ succursales: [], totaux: { ventes: 0, cashEnMain: 0, dette: 0 } } as SuperviseurDashboard);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDash(); }, [fetchDash]);

  if (loading && !data) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!data) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Ventes aujourd'hui" value={`${fmt(data.totaux.ventes)} HTG`} subtitle={`${data.succursales.length} succursale${data.succursales.length > 1 ? "s" : ""}`} icon={DollarSign} iconBg="bg-orange-500" />
        <StatCard title="Cash en main" value={`${fmt(data.totaux.cashEnMain)} HTG`} subtitle="collecté aujourd'hui" icon={Banknote} iconBg="bg-emerald-500" />
        <StatCard title="Dette totale" value={`${fmt(data.totaux.dette)} HTG`} subtitle={data.totaux.dette > 0 ? "à recouvrer" : "aucune dette"} subtitleColor={data.totaux.dette > 0 ? "text-destructive" : undefined} icon={AlertTriangle} iconBg={data.totaux.dette > 0 ? "bg-destructive" : "bg-blue-500"} />
      </div>

      {data.succursales.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucune succursale liée à votre compte.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">Gérez vos succursales, collectez le cash et consultez les rapports dans la page <a href="/succursales" className="text-primary font-medium hover:underline">Succursales</a>.</p>
            <div className="space-y-2">
              {data.succursales.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-destructive"}`} />
                    <span className="text-sm font-medium">{s.nom}</span>
                    <span className="text-xs text-muted-foreground">{s.vendeur || "—"}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs tabular-nums">
                    <span>{(s as any).ventes?.toLocaleString() || 0} <span className="text-muted-foreground">HTG</span></span>
                    {(s as any).cashACollecter > 0 && <span style={{ color: "#F59E0B" }}>À collecter: {(s as any).cashACollecter?.toLocaleString()}</span>}
                    {(s as any).dette > 0 && <span style={{ color: "#DC2626" }}>Dette: {(s as any).dette?.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default function DashboardPage() {
  const user = getStoredUser();
  const isSuperviseur = user?.role === "superviseur";

  return (
    <div>
      <Header />
      <div className="space-y-6 p-6">
        {isSuperviseur ? <SuperviseurDashboardView /> : <AdminDashboard />}
      </div>
    </div>
  );
}
