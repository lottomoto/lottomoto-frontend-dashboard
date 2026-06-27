"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Trophy, TrendingUp, Users, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { RapportsChart } from "@/components/dashboard/rapports-chart";
import api from "@/lib/api";

const PERIODES = [
  { id: "auj", label: "Aujourd'hui" },
  { id: "semaine", label: "Cette Semaine" },
  { id: "mois", label: "Ce Mois" },
];

const TIRAGE_COLORS: Record<string, string> = {
  "Midi": "#F59E0B",
  "Soir": "#8B5CF6",
};

interface AdminStats {
  recettes: number;
  paiements: number;
  benefice: number;
  ticketCount: number;
  vendeursActifs: number;
  topVendeurs: { nom: string; ventes: number; tickets: number }[];
  tiragesJour: { nom: string; tickets: number; montant: number }[];
  parBorlette: { nom: string; recettes: number; paiements: number; benefice: number }[];
  chartData: { date: string; recettes: number; paiements: number; benefice: number }[];
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
};

export default function RapportsPage() {
  const [periode, setPeriode] = useState("auj");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (p: string) => {
    try {
      setLoading(true);
      const { data } = await api.get<AdminStats>(`/tickets/admin/stats?periode=${p}`);
      setStats(data);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(periode); }, [periode, fetchStats]);

  const recettes = stats?.recettes || 0;
  const paiements = stats?.paiements || 0;
  const benefice = stats?.benefice || 0;
  const ticketCount = stats?.ticketCount || 0;
  const vendeursActifs = stats?.vendeursActifs || 0;
  const paiementsTaux = recettes > 0 ? ((paiements / recettes) * 100).toFixed(1) : "0";

  const totalJour = (stats?.tiragesJour || []).reduce((s, t) => s + t.montant, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {PERIODES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriode(p.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  periode === p.id
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              title="Recettes totales"
              value={`${fmt(recettes)} HTG`}
              subtitle={`${ticketCount} tickets vendus`}
              icon={DollarSign}
              iconBg="bg-blue-500"
            />
            <StatCard
              title="Paiements gagnants"
              value={`${fmt(paiements)} HTG`}
              subtitle={`Taux: ${paiementsTaux}% des recettes`}
              subtitleColor="text-destructive"
              icon={Trophy}
              iconBg="bg-orange-500"
            />
            <StatCard
              title="Bénéfice net"
              value={`${fmt(benefice)} HTG`}
              subtitle={`Recettes - Paiements`}
              icon={TrendingUp}
              iconBg="bg-emerald-500"
            />
            <StatCard
              title="Tickets vendus"
              value={ticketCount.toLocaleString()}
              subtitle={`${vendeursActifs} vendeur${vendeursActifs > 1 ? "s" : ""} actif${vendeursActifs > 1 ? "s" : ""}`}
              subtitleColor="text-primary"
              icon={Users}
              iconBg="bg-purple-500"
            />
          </div>

          {/* Chart + Tirages du jour */}
          <div className="flex gap-4">
            <Card className="border-border bg-card flex-1">
              <CardContent className="p-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold">Recettes vs Paiements</h3>
                  <p className="text-xs text-muted-foreground">
                    {periode === "auj" ? "Aujourd'hui" : periode === "semaine" ? "Cette semaine" : "Ce mois"}
                  </p>
                </div>
                {(stats?.chartData?.length || 0) > 0 ? (
                  <RapportsChart data={stats!.chartData} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">Aucune donnée pour cette période</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card w-80">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold mb-4">Tirages du jour</h3>
                <div className="space-y-4">
                  {(stats?.tiragesJour || []).length > 0 ? (
                    (stats?.tiragesJour || []).map((t) => {
                      const color = TIRAGE_COLORS[t.nom] || "#6B7280";
                      return (
                        <div key={t.nom}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                                style={{ backgroundColor: color }}
                              >
                                {t.nom}
                              </span>
                              <span className="text-xs text-muted-foreground">{t.tickets} tickets</span>
                            </div>
                            <span className="text-sm font-bold tabular-nums">{t.montant.toLocaleString()} <span className="text-[9px] text-muted-foreground">HTG</span></span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: totalJour > 0 ? `${(t.montant / totalJour) * 100}%` : "0%", backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucun tirage aujourd&apos;hui</p>
                  )}

                  <div className="mt-2 rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total jour ({(stats?.tiragesJour || []).length} tirage{(stats?.tiragesJour || []).length > 1 ? "s" : ""})</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{totalJour.toLocaleString()} <span className="text-xs text-muted-foreground">HTG</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Par borlette + Top vendeurs */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold mb-4">Par borlette</h3>
                {(stats?.parBorlette || []).length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Borlette</th>
                        <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recettes</th>
                        <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paiements</th>
                        <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bénéfice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats?.parBorlette || []).map((b) => (
                        <tr key={b.nom} className="border-b border-border/30">
                          <td className="py-2.5 text-sm font-medium">{b.nom}</td>
                          <td className="py-2.5 text-sm text-right tabular-nums">{b.recettes.toLocaleString()}</td>
                          <td className="py-2.5 text-sm text-right tabular-nums text-destructive">{b.paiements.toLocaleString()}</td>
                          <td className="py-2.5 text-sm text-right tabular-nums font-semibold" style={{ color: "#16A34A" }}>{b.benefice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold mb-4">Top vendeurs</h3>
                <div className="space-y-3">
                  {(stats?.topVendeurs || []).length > 0 ? (
                    (stats?.topVendeurs || []).map((v, i) => (
                      <div key={v.nom} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-4 font-bold">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{v.nom}</p>
                          <p className="text-xs text-muted-foreground">{v.tickets} tickets</p>
                        </div>
                        <p className="text-sm font-bold text-primary tabular-nums">{v.ventes.toLocaleString()} <span className="text-[9px]">HTG</span></p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune vente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
