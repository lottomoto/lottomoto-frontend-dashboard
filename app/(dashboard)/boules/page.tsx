"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle, Lock, Loader2, Plus, Trash2, Globe, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  type Boule,
  type LimitationData,
  getBoules,
  toggleBoule,
  getLimitations,
  getLimitationsByBoule,
  createLimitation,
  createLimitationAll,
  removeLimitation,
} from "@/lib/boules";
import api from "@/lib/api";
import { SearchableSelect } from "@/components/ui/searchable-select";

const DECADE_COLORS: Record<string, string> = {
  "0": "#6366F1", "1": "#DC2626", "2": "#F59E0B", "3": "#16A34A", "4": "#3B82F6",
  "5": "#8B5CF6", "6": "#EC4899", "7": "#14B8A6", "8": "#F97316", "9": "#6B7280",
};

interface BorletteData {
  id: string;
  nom: string;
  code: string;
  tirages: { id: string; nom: string; fermeture: string }[];
}

const FILTERS = [
  { id: "toutes", label: "Toutes" },
  { id: "disponibles", label: "Disponibles" },
  { id: "limitees", label: "Limitées" },
  { id: "bloquees", label: "Bloquées" },
];

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  const mois = ["Janv", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  return `${parseInt(d)} ${mois[parseInt(m) - 1]} ${y}`;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function BoulesPage() {
  const [boules, setBoules] = useState<Boule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("toutes");
  const [search, setSearch] = useState("");
  const [selectedBoule, setSelectedBoule] = useState<Boule | null>(null);
  const [limitations, setLimitations] = useState<LimitationData[]>([]);
  const [allLimitations, setAllLimitations] = useState<LimitationData[]>([]);
  const [limitDialog, setLimitDialog] = useState(false);
  const [borlettesList, setBorlettesList] = useState<BorletteData[]>([]);
  const [limitMode, setLimitMode] = useState<"specific" | "all">("specific");
  const [limitBorlette, setLimitBorlette] = useState("");
  const [limitTirage, setLimitTirage] = useState("");
  const [limitMontant, setLimitMontant] = useState("");
  const [limitDate, setLimitDate] = useState(today());

  const [playCounts, setPlayCounts] = useState<Record<number, number>>({});

  const fetchBoules = useCallback(async () => {
    try {
      setLoading(true);
      const [boulesData, limData, borlRes, statsRes] = await Promise.all([
        getBoules(),
        getLimitations(),
        api.get<BorletteData[]>("/borlettes"),
        api.get<{ numero: number; count: number }[]>("/tickets/boules/stats"),
      ]);
      setBoules(boulesData);
      setAllLimitations(limData);
      setBorlettesList(borlRes.data.filter((b) => b.tirages.length > 0));
      const counts: Record<number, number> = {};
      for (const s of statsRes.data) counts[s.numero] = s.count;
      setPlayCounts(counts);
      if (borlRes.data.length > 0 && !limitBorlette) {
        setLimitBorlette(borlRes.data[0].nom);
        if (borlRes.data[0].tirages.length > 0) {
          setLimitTirage(borlRes.data[0].tirages[0].nom);
        }
      }
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoules(); }, [fetchBoules]);

  const fetchLimitations = useCallback(async (numero: number) => {
    try {
      const data = await getLimitationsByBoule(numero);
      setLimitations(data);
    } catch {
      setLimitations([]);
    }
  }, []);

  useEffect(() => {
    if (selectedBoule) fetchLimitations(selectedBoule.numero);
    else setLimitations([]);
  }, [selectedBoule, fetchLimitations]);

  const bouleHasLimits = (num: number) => allLimitations.some((l) => l.bouleNumero === num);

  const counts = {
    disponibles: boules.filter((b) => b.status === "disponible" && !bouleHasLimits(b.numero)).length,
    limitees: boules.filter((b) => b.status !== "bloquee" && bouleHasLimits(b.numero)).length,
    bloquees: boules.filter((b) => b.status === "bloquee").length,
  };

  const filtered = boules.filter((b) => {
    if (search && !String(b.numero).padStart(2, "0").includes(search)) return false;
    if (filter === "disponibles") return b.status === "disponible" && !bouleHasLimits(b.numero);
    if (filter === "limitees") return b.status !== "bloquee" && bouleHasLimits(b.numero);
    if (filter === "bloquees") return b.status === "bloquee";
    return true;
  });

  const getColor = (num: number) => DECADE_COLORS[String(Math.floor(num / 10))] || "#6B7280";

  const handleToggle = async (numero: number) => {
    try {
      const updated = await toggleBoule(numero);
      setBoules((prev) => prev.map((b) => b.numero === numero ? updated : b));
      if (selectedBoule?.numero === numero) setSelectedBoule(updated);
    } catch { /* */ }
  };

  const openLimitDialog = () => {
    setLimitMode("specific");
    if (borlettesList.length > 0) {
      setLimitBorlette(borlettesList[0].nom);
      if (borlettesList[0].tirages.length > 0) {
        setLimitTirage(borlettesList[0].tirages[0].nom);
      }
    }
    setLimitMontant("");
    setLimitDate(today());
    setLimitDialog(true);
  };

  const currentBorlettetirages = borlettesList.find((b) => b.nom === limitBorlette)?.tirages || [];

  const handleAddLimitation = async () => {
    if (!selectedBoule || !limitMontant || !limitDate) return;
    try {
      if (limitMode === "all") {
        const allBorlettes = borlettesList.map((b) => b.nom);
        const allTirages = borlettesList.flatMap((b) => b.tirages.map((t) => t.nom));
        const uniqueTirages = [...new Set(allTirages)];
        await createLimitationAll({
          bouleNumero: selectedBoule.numero,
          montant: parseInt(limitMontant),
          date: limitDate,
          borlettes: allBorlettes,
          tirages: uniqueTirages,
        });
      } else {
        await createLimitation({
          bouleNumero: selectedBoule.numero,
          borlette: limitBorlette,
          tirage: limitTirage,
          montant: parseInt(limitMontant),
          date: limitDate,
        });
      }
      setLimitDialog(false);
      fetchLimitations(selectedBoule.numero);
      fetchBoules();
    } catch { /* */ }
  };

  const handleRemoveLimitation = async (id: string) => {
    try {
      await removeLimitation(id);
      if (selectedBoule) fetchLimitations(selectedBoule.numero);
      fetchBoules();
    } catch { /* */ }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "#16A34A20" }}>
              <CheckCircle className="h-5 w-5" style={{ color: "#16A34A" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{counts.disponibles}</p>
              <p className="text-xs text-muted-foreground">Disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "#F59E0B20" }}>
              <AlertTriangle className="h-5 w-5" style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{counts.limitees}</p>
              <p className="text-xs text-muted-foreground">Limitées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "#DC262620" }}>
              <Lock className="h-5 w-5" style={{ color: "#DC2626" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#DC2626" }}>{counts.bloquees}</p>
              <p className="text-xs text-muted-foreground">Bloquées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-6">
        {/* Left: grid */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 w-36">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="N° boule"
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value.replace(/\D/g, ""))}
                maxLength={2}
              />
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === f.id ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 ml-auto flex-wrap">
              {Object.entries(DECADE_COLORS).map(([d, color]) => (
                <div key={d} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-muted-foreground">{d}0-{d}9</span>
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-10 gap-2">
              {filtered.map((b) => {
                const color = getColor(b.numero);
                const isBlocked = b.status === "bloquee";
                return (
                  <button
                    key={b.numero}
                    onClick={() => setSelectedBoule(b)}
                    className="flex flex-col items-center rounded-lg p-2 transition-all hover:scale-105 cursor-pointer border"
                    style={{
                      backgroundColor: isBlocked ? "#FEE2E2" : color + "15",
                      borderColor: isBlocked ? "#DC2626" : color + "30",
                    }}
                  >
                    {isBlocked ? (
                      <>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "#DC262630" }}>
                          <Lock className="h-4 w-4" style={{ color: "#DC2626" }} />
                        </div>
                        <span className="text-[9px] font-bold mt-1" style={{ color: "#DC2626" }}>BLOQUÉ</span>
                      </>
                    ) : (
                      <>
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {String(b.numero).padStart(2, "0")}
                        </div>
                        {playCounts[b.numero] ? (
                          <span className="text-[9px] font-bold mt-1 tabular-nums" style={{ color }}>{playCounts[b.numero]}x</span>
                        ) : null}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="w-72 space-y-4">
          {selectedBoule ? (
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold shrink-0"
                    style={{ backgroundColor: getColor(selectedBoule.numero) }}
                  >
                    {String(selectedBoule.numero).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="font-bold">Boule {String(selectedBoule.numero).padStart(2, "0")}</p>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: selectedBoule.status === "bloquee" ? "#DC2626" : "#16A34A" }}
                    >
                      {selectedBoule.status === "bloquee" ? <><Lock className="h-3 w-3" /> BLOQUÉE</> : <><CheckCircle className="h-3 w-3" /> DISPONIBLE</>}
                    </span>
                  </div>
                </div>

                {/* Limitations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Limitations</p>
                    <button onClick={openLimitDialog} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                      <Plus className="h-3 w-3" /> Ajouter
                    </button>
                  </div>
                  {limitations.length > 0 ? (
                    <div className="space-y-1.5">
                      {limitations.map((l) => (
                        <div key={l.id} className="rounded bg-muted/30 px-2.5 py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{l.borlette} · {l.tirage}</span>
                            </div>
                            <button onClick={() => handleRemoveLimitation(l.id)} className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-5">
                            <span className="text-[10px] text-muted-foreground">{formatDate(l.date)}</span>
                            <span className="text-[10px] font-bold text-primary">{Number(l.montant).toLocaleString()} HTG</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucune limitation</p>
                  )}
                </div>

                {/* Block/Unblock */}
                <Button
                  className="w-full gap-2"
                  onClick={() => handleToggle(selectedBoule.numero)}
                  style={{
                    backgroundColor: selectedBoule.status === "bloquee" ? "#16A34A" : "#DC2626",
                    color: "white",
                  }}
                >
                  <Lock className="h-4 w-4" />
                  {selectedBoule.status === "bloquee" ? "Débloquer complètement" : "Bloquer complètement"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  Cliquez sur une boule pour voir ses détails et gérer ses limitations.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Top 5 */}
          {boules.length > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Top 5 jouées aujourd&apos;hui</p>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const topBoules = Object.entries(playCounts)
                      .map(([num, count]) => ({ numero: Number(num), count }))
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5);

                    if (topBoules.length === 0) {
                      return <p className="text-xs text-muted-foreground text-center">Aucune vente aujourd&apos;hui</p>;
                    }

                    const maxCount = topBoules[0]?.count || 1;
                    return topBoules.map((b, i) => (
                      <div key={b.numero} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: getColor(b.numero) }}
                        >
                          {String(b.numero).padStart(2, "0")}
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(b.count / maxCount) * 100}%`, backgroundColor: getColor(b.numero) }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums w-6 text-right">{b.count}x</span>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Limitation Dialog */}
      <Dialog open={limitDialog} onOpenChange={setLimitDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Limiter boule {selectedBoule ? String(selectedBoule.numero).padStart(2, "0") : ""}</DialogTitle>
            <DialogDescription>Choisissez la borlette, le tirage et le montant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setLimitMode("specific")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${limitMode === "specific" ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
              >Spécifique</button>
              <button
                onClick={() => setLimitMode("all")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${limitMode === "all" ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
              >Toutes</button>
            </div>

            {limitMode === "specific" && (
              <>
                <div className="space-y-1.5">
                  <Label>Borlette</Label>
                  <SearchableSelect
                    options={borlettesList.map((b) => ({ value: b.nom, label: b.nom }))}
                    value={limitBorlette}
                    onChange={(val) => {
                      setLimitBorlette(val);
                      const bor = borlettesList.find((b) => b.nom === val);
                      if (bor && bor.tirages.length > 0) setLimitTirage(bor.tirages[0].nom);
                    }}
                    placeholder="Rechercher une borlette..."
                    emptyLabel="Sélectionner..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tirage</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {currentBorlettetirages.map((t) => (
                      <button key={t.id} onClick={() => setLimitTirage(t.nom)} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${limitTirage === t.nom ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}>{t.nom}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {limitMode === "all" && (
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                La boule sera limitée pour <span className="font-semibold text-foreground">toutes les borlettes</span> et <span className="font-semibold text-foreground">tous les tirages</span>.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Montant maximum (HTG)</Label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 50000"
                  value={limitMontant}
                  onChange={(e) => setLimitMontant(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <input type="date" value={limitDate} onChange={(e) => setLimitDate(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLimitDialog(false)}>Annuler</Button>
            <Button
              className="gap-2"
              style={{ backgroundColor: "#DC2626", color: "white" }}
              onClick={handleAddLimitation}
              disabled={!limitMontant || !limitDate}
            >
              <Lock className="h-4 w-4" /> Limiter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
