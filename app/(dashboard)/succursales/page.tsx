"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, MapPin, Users, MoreHorizontal, Pencil, Power, Loader2, Banknote, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  type Succursale,
  getSuccursales,
  createSuccursale,
  updateSuccursale,
  toggleSuccursaleActive,
} from "@/lib/succursales";
import { getVendeurs } from "@/lib/vendeurs";
import { getStoredUser } from "@/lib/auth";
import api from "@/lib/api";

interface UserOption {
  id: string;
  nom: string;
}

export default function SuccursalesPage() {
  const user = getStoredUser();
  const isSuperviseur = user?.role === "superviseur";

  const [succursales, setSuccursales] = useState<Succursale[]>([]);
  const [superviseurs, setSuperviseurs] = useState<UserOption[]>([]);
  const [vendeursList, setVendeursList] = useState<{ id: string; nom: string; pris: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const [succursaleStats, setSuccursaleStats] = useState<Record<string, { ventes: number; tickets: number; cashACollecter: number; totalCollecte: number; dette: number }>>({});
  const [cashEnMain, setCashEnMain] = useState(0);
  const [collectId, setCollectId] = useState<string | null>(null);
  const [collectCashRecu, setCollectCashRecu] = useState("");
  const [collectNotes, setCollectNotes] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [viewRapportsId, setViewRapportsId] = useState<string | null>(null);
  const [viewRapportsNom, setViewRapportsNom] = useState("");
  const [rapportsList, setRapportsList] = useState<{ id: string; date: string; cashCollecte: number; dette: number; notes: string; createdAt: string }[]>([]);
  const [loadingRapports, setLoadingRapports] = useState(false);

  const [statsDialogId, setStatsDialogId] = useState<string | null>(null);
  const [statsDialogNom, setStatsDialogNom] = useState("");
  const [statsVendeurId, setStatsVendeurId] = useState<string | null>(null);
  const [statsPeriode, setStatsPeriode] = useState("auj");
  const [branchStatsData, setBranchStatsData] = useState<any>(null);
  const [loadingBranchStats, setLoadingBranchStats] = useState(false);

  const [formNom, setFormNom] = useState("");
  const [formAdresse, setFormAdresse] = useState("");
  const [formMateriel, setFormMateriel] = useState("");
  const [formSuperviseur, setFormSuperviseur] = useState("");
  const [formVendeur, setFormVendeur] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (isSuperviseur) {
        const [succRes, dashRes] = await Promise.all([
          api.get<Succursale[]>("/succursales/me"),
          api.get<any>("/succursales/me/dashboard"),
        ]);
        setSuccursales(succRes.data);
        if (dashRes.data?.succursales) {
          const statsMap: Record<string, any> = {};
          for (const s of dashRes.data.succursales) {
            statsMap[s.id] = { ventes: s.ventes, tickets: s.tickets, cashACollecter: s.cashACollecter, totalCollecte: s.totalCollecte, dette: s.dette };
          }
          setSuccursaleStats(statsMap);
        }
        setCashEnMain(dashRes.data?.totaux?.cashEnMain || 0);
      } else {
        const [succData, vendData, usersRes] = await Promise.all([
          getSuccursales(),
          getVendeurs(),
          api.get<any[]>("/users"),
        ]);
        setSuccursales(succData);
        const vendeursAfectes = succData.filter((s) => s.vendeur).map((s) => s.vendeur!.id);
        setVendeursList(vendData.map((v) => ({ id: v.id, nom: `${v.firstname} ${v.lastname}`, pris: vendeursAfectes.includes(v.id) })));
        const supOnly = usersRes.data.filter((u: any) => u.role === "superviseur");
        setSuperviseurs(supOnly.map((u: any) => ({ id: u.id, nom: `${u.firstname} ${u.lastname}` })));
      }
    } catch {
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  }, [isSuperviseur]);

  const fetchBranchStats = useCallback(async (vendeurId: string, periode: string) => {
    if (!vendeurId) {
      setBranchStatsData(null);
      return;
    }
    setLoadingBranchStats(true);
    try {
      const res = await api.get(`/tickets/admin/stats?periode=${periode}&vendeurId=${vendeurId}`);
      setBranchStatsData(res.data);
    } catch {
      setBranchStatsData(null);
    } finally {
      setLoadingBranchStats(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (statsDialogId && statsVendeurId) {
      fetchBranchStats(statsVendeurId, statsPeriode);
    }
  }, [statsDialogId, statsVendeurId, statsPeriode, fetchBranchStats]);

  const filtered = succursales.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.nom.toLowerCase().includes(q) || (s.adresse?.toLowerCase().includes(q) ?? false) || s.materielId.toLowerCase().includes(q);
  });

  const counts = {
    total: succursales.length,
    actives: succursales.filter((s) => s.isActive).length,
  };

  const resetForm = () => {
    setFormNom("");
    setFormAdresse("");
    setFormMateriel("");
    setFormSuperviseur("");
    setFormVendeur("");
  };

  const handleSubmit = async () => {
    if (!formNom || !formMateriel) return;
    setSaving(true);
    try {
      await createSuccursale({
        nom: formNom,
        adresse: formAdresse || undefined,
        materielId: formMateriel,
        superviseurId: formSuperviseur || undefined,
        vendeurId: formVendeur || undefined,
      });
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s: Succursale) => {
    setFormNom(s.nom);
    setFormAdresse(s.adresse || "");
    setFormMateriel(s.materielId);
    setFormSuperviseur(s.superviseur?.id || "");
    setFormVendeur(s.vendeur?.id || "");
    setEditingId(s.id);
    setDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!formNom || !editingId) return;
    setSaving(true);
    try {
      await updateSuccursale(editingId, {
        nom: formNom,
        adresse: formAdresse || undefined,
        materielId: formMateriel || undefined,
        superviseurId: formSuperviseur || undefined,
        vendeurId: formVendeur || undefined,
      });
      resetForm();
      setEditingId(null);
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const openRapports = async (id: string, nom: string) => {
    setViewRapportsId(id);
    setViewRapportsNom(nom);
    setLoadingRapports(true);
    try {
      const { data } = await api.get<any[]>(`/succursales/${id}/rapports`);
      setRapportsList(data);
    } catch {
      setRapportsList([]);
    } finally {
      setLoadingRapports(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleSuccursaleActive(id);
      fetchData();
    } catch {
      setError("Erreur lors du changement de statut");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Succursales</h1>
          <p className="text-sm text-muted-foreground">
            {counts.total} machines · {counts.actives} actives
          </p>
        </div>
        {!isSuperviseur && (
          <Button
            className="bg-primary text-primary-foreground gap-2"
            onClick={() => { resetForm(); setEditingId(null); setDialogOpen(true); }}
          >
            <Plus className="h-4 w-4" />
            Ajouter une succursale
          </Button>
        )}
      </div>

      {isSuperviseur && cashEnMain > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <Banknote className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Cash en main (collecté aujourd&apos;hui)</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "#16A34A" }}>{cashEnMain.toLocaleString()} <span className="text-xs">HTG</span></p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>Fermer</button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par nom, adresse, ID matériel..."
          className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{s.nom}</h3>
                      <p className="text-xs text-muted-foreground">{s.adresse || "—"}</p>
                      {s.superviseur && (
                        <p className="text-[10px] text-primary mt-0.5">👤 {s.superviseur.nom}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: s.isActive ? "#16A34A" : "#DC2626" }}
                    >
                      {s.isActive ? "Actif" : "Inactif"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom">
                        {!isSuperviseur && (
                          <>
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleToggle(s.id)}>
                          <Power className="h-4 w-4 mr-2" />
                          {s.isActive ? "Désactiver" : "Activer"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Vendeur */}
                <div className="rounded-md bg-muted/50 p-2.5 mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs">
                    {s.vendeur ? (
                      <span className="font-medium">{s.vendeur.nom} <span className="text-muted-foreground font-mono">@{s.vendeur.username}</span></span>
                    ) : (
                      <span className="text-muted-foreground italic">Aucun vendeur</span>
                    )}
                  </p>
                </div>

                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Machine</p>
                  <p className="text-xs font-bold text-card-foreground font-mono">{s.materielId}</p>
                </div>

                {isSuperviseur ? (
                  <>
                    {(() => {
                      const st = succursaleStats[s.id];
                      const cash = st?.cashACollecter ?? 0;
                      const dette = st?.dette ?? 0;
                      return (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="rounded-md bg-muted/30 p-2.5">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Ventes</p>
                            <p className="text-sm font-bold tabular-nums">{(st?.ventes ?? 0).toLocaleString()} <span className="text-[8px] text-muted-foreground">HTG</span></p>
                          </div>
                          <div className="rounded-md bg-muted/30 p-2.5">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">À collecter</p>
                            <p className="text-sm font-bold tabular-nums" style={{ color: cash > 0 ? "#F59E0B" : "#16A34A" }}>{cash.toLocaleString()} <span className="text-[8px]">HTG</span></p>
                          </div>
                          <div className="rounded-md bg-muted/30 p-2.5">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Dette</p>
                            <p className="text-sm font-bold tabular-nums" style={{ color: dette > 0 ? "#DC2626" : undefined }}>{dette.toLocaleString()} <span className="text-[8px]">HTG</span></p>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openRapports(s.id, s.nom)}
                      >
                        Historique
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-2 bg-primary text-primary-foreground"
                        disabled={(succursaleStats[s.id]?.cashACollecter ?? 0) === 0 && (succursaleStats[s.id]?.ventes ?? 0) === 0}
                        onClick={() => {
                          setCollectId(s.id);
                          setCollectCashRecu("");
                          setCollectNotes("");
                        }}
                      >
                        <Banknote className="h-4 w-4" />
                        Collecter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        disabled={!s.vendeur?.userId}
                        onClick={() => {
                          setStatsDialogId(s.id);
                          setStatsDialogNom(s.nom);
                          setStatsVendeurId(s.vendeur?.userId || null);
                          setStatsPeriode("auj");
                          setBranchStatsData(null);
                        }}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Rapport
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      disabled={!s.vendeur?.userId}
                      onClick={() => {
                        setStatsDialogId(s.id);
                        setStatsDialogNom(s.nom);
                        setStatsVendeurId(s.vendeur?.userId || null);
                        setStatsPeriode("auj");
                        setBranchStatsData(null);
                      }}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Voir le rapport
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground col-span-3 text-center py-8">Aucune succursale trouvée</p>
          )}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier succursale" : "Nouvelle succursale"}</DialogTitle>
            <DialogDescription>Informations de la succursale</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input placeholder="Ex: Pétion-Ville" value={formNom} onChange={(e) => setFormNom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input placeholder="Ex: Rue Faubert" value={formAdresse} onChange={(e) => setFormAdresse(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ID Matériel</Label>
              <Input placeholder="Ex: MAC-001" value={formMateriel} onChange={(e) => setFormMateriel(e.target.value)} />
              <p className="text-xs text-muted-foreground">Identifiant de la machine</p>
            </div>
            <div className="space-y-1.5">
              <Label>Superviseur <span className="text-muted-foreground">(optionnel)</span></Label>
              <SearchableSelect
                options={superviseurs.map((s) => ({ value: s.id, label: s.nom }))}
                value={formSuperviseur}
                onChange={setFormSuperviseur}
                placeholder="Rechercher un superviseur..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vendeur <span className="text-muted-foreground">(optionnel)</span></Label>
              <SearchableSelect
                options={vendeursList
                  .filter((v) => !v.pris || v.id === formVendeur)
                  .map((v) => ({ value: v.id, label: v.nom }))}
                value={formVendeur}
                onChange={setFormVendeur}
                placeholder="Rechercher un vendeur..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              className="bg-primary text-primary-foreground gap-2"
              onClick={editingId ? handleEdit : handleSubmit}
              disabled={!formNom || !formMateriel || saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collecter Dialog */}
      <Dialog open={!!collectId} onOpenChange={(open) => !open && setCollectId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Collecter le cash</DialogTitle>
            <DialogDescription>
              Cash à collecter: <span className="font-bold text-foreground">{(succursaleStats[collectId || ""]?.cashACollecter || 0).toLocaleString()} HTG</span>
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const aCollecter = succursaleStats[collectId || ""]?.cashACollecter || 0;
            const cashRecu = Number(collectCashRecu) || 0;
            const dette = Math.max(aCollecter - cashRecu, 0);
            return (
              <>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Cash reçu du vendeur (HTG) <span className="text-muted-foreground">— max {aCollecter.toLocaleString()}</span></Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={aCollecter.toLocaleString()}
                      value={collectCashRecu}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d.]/g, "");
                        if (Number(val) > aCollecter) setCollectCashRecu(String(aCollecter));
                        else setCollectCashRecu(val);
                      }}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes <span className="text-muted-foreground">(optionnel)</span></Label>
                    <textarea
                      value={collectNotes}
                      onChange={(e) => setCollectNotes(e.target.value)}
                      placeholder="Notes..."
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Cash à collecter</span><span className="tabular-nums">{aCollecter.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Cash reçu</span><span className="tabular-nums" style={{ color: "#16A34A" }}>{cashRecu.toLocaleString()}</span></div>
                    {dette > 0 && (
                      <div className="flex justify-between border-t border-border mt-2 pt-2 font-bold"><span className="text-destructive">Dette</span><span className="tabular-nums text-destructive">{dette.toLocaleString()} HTG</span></div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCollectId(null)}>Annuler</Button>
                  <Button
                    className="gap-2"
                    style={{ backgroundColor: "#16A34A", color: "white" }}
                    disabled={collecting || cashRecu <= 0}
                    onClick={async () => {
                      if (!collectId) return;
                      setCollecting(true);
                      try {
                        await api.post(`/succursales/${collectId}/collecter`, {
                          cashRecu,
                          dette,
                          notes: collectNotes || undefined,
                        });
                        setCollectId(null);
                        fetchData();
                      } catch { /* */ } finally {
                        setCollecting(false);
                      }
                    }}
                  >
                    {collecting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Banknote className="h-4 w-4" />
                    Collecter
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      {/* Rapports History Dialog */}
      <Dialog open={!!viewRapportsId} onOpenChange={(open) => !open && setViewRapportsId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rapports · {viewRapportsNom}</DialogTitle>
            <DialogDescription>Historique des rapports de cette succursale</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {loadingRapports ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : rapportsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun rapport</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cash</th>
                    <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dette</th>
                    <th className="pb-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rapportsList.map((r) => (
                    <tr key={r.id} className="border-b border-border/30">
                      <td className="py-2.5 text-sm">{new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="py-2.5 text-sm text-right tabular-nums font-semibold" style={{ color: "#16A34A" }}>{Number(r.cashCollecte).toLocaleString()}</td>
                      <td className="py-2.5 text-sm text-right tabular-nums font-semibold" style={{ color: Number(r.dette) > 0 ? "#DC2626" : undefined }}>{Number(r.dette).toLocaleString()}</td>
                      <td className="py-2.5 text-xs text-muted-foreground pl-3 max-w-[150px] truncate">{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRapportsId(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats/Rapport Dialog */}
      <Dialog open={!!statsDialogId} onOpenChange={(open) => !open && setStatsDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rapport · {statsDialogNom}</DialogTitle>
            <DialogDescription>Statistiques des ventes de cette succursale</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex justify-end">
              <select
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none cursor-pointer"
                value={statsPeriode}
                onChange={(e) => setStatsPeriode(e.target.value)}
              >
                <option value="auj">Aujourd'hui</option>
                <option value="hier">Hier</option>
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois</option>
              </select>
            </div>

            {loadingBranchStats ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !branchStatsData || !statsVendeurId ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Recettes</p>
                    <p className="text-lg font-bold tabular-nums">{(branchStatsData.recettes || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Paiements</p>
                    <p className="text-lg font-bold tabular-nums text-destructive">{(branchStatsData.paiements || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">À Payer</p>
                    <p className="text-lg font-bold tabular-nums text-orange-500">{(branchStatsData.aPayer || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Bénéfice</p>
                    <p className="text-lg font-bold tabular-nums" style={{ color: "#16A34A" }}>{(branchStatsData.benefice || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Par session</h4>
                  {branchStatsData.parTirage?.length > 0 ? (
                    <div className="rounded-md border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left font-medium p-2 text-muted-foreground text-xs uppercase tracking-wider">Session</th>
                            <th className="text-right font-medium p-2 text-muted-foreground text-xs uppercase tracking-wider">Ventes</th>
                            <th className="text-right font-medium p-2 text-muted-foreground text-xs uppercase tracking-wider">À Payer</th>
                            <th className="text-right font-medium p-2 text-muted-foreground text-xs uppercase tracking-wider">Bénéfice</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branchStatsData.parTirage.map((t: any) => (
                            <tr key={t.nom} className="border-t border-border/50">
                              <td className="p-2.5 font-medium">{t.nom}</td>
                              <td className="p-2.5 text-right tabular-nums">{t.recettes.toLocaleString()}</td>
                              <td className="p-2.5 text-right tabular-nums text-orange-500">{t.aPayer.toLocaleString()}</td>
                              <td className="p-2.5 text-right tabular-nums" style={{ color: "#16A34A" }}>{t.benefice.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune vente pour cette période</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsDialogId(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
