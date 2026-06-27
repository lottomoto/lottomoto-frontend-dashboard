"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, MoreHorizontal, Phone, CheckCircle, XCircle, Pencil, Power, Eye, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  type Vendeur,
  getVendeurs,
  createVendeur,
  updateVendeur,
  toggleVendeurActive,
} from "@/lib/vendeurs";

export default function VendeursPage() {
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailVendeur, setDetailVendeur] = useState<Vendeur | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const [formNom, setFormNom] = useState("");
  const [formPrenom, setFormPrenom] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPin, setFormPin] = useState("");
  const [formCommission, setFormCommission] = useState("");
  const [formAdresse, setFormAdresse] = useState("");

  const fetchVendeurs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVendeurs();
      setVendeurs(data);
    } catch {
      setError("Impossible de charger les vendeurs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendeurs();
  }, [fetchVendeurs]);

  const filtered = vendeurs.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${v.firstname} ${v.lastname}`.toLowerCase();
    return (
      fullName.includes(q) ||
      v.username.includes(q) ||
      v.phone?.includes(q) ||
      v.id.toLowerCase().includes(q)
    );
  });

  const counts = {
    total: vendeurs.length,
    actifs: vendeurs.filter((v) => v.isActive).length,
    inactifs: vendeurs.filter((v) => !v.isActive).length,
  };

  const resetForm = () => {
    setFormNom("");
    setFormPrenom("");
    setFormPhone("");
    setFormUsername("");
    setFormPin("");
    setFormCommission("");
    setFormAdresse("");
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setSaving(true);
    try {
      await createVendeur({
        firstname: formPrenom,
        lastname: formNom,
        phone: formPhone,
        username: formUsername,
        pin: formPin,
        adresse: formAdresse || undefined,
        commission: formCommission ? parseFloat(formCommission) : undefined,
      });
      resetForm();
      setDialogOpen(false);
      fetchVendeurs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (v: Vendeur) => {
    setFormPrenom(v.firstname);
    setFormNom(v.lastname);
    setFormPhone(v.phone || "");
    setFormUsername(v.username);
    setFormPin("");
    setFormCommission(v.commission ? String(v.commission) : "");
    setFormAdresse(v.adresse || "");
    setEditingId(v.id);
    setDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!formNom || !formPrenom || !formPhone || !editingId) return;
    setSaving(true);
    try {
      await updateVendeur(editingId, {
        firstname: formPrenom,
        lastname: formNom,
        phone: formPhone,
        username: formUsername,
        ...(formPin.length === 4 ? { pin: formPin } : {}),
        adresse: formAdresse || undefined,
        commission: formCommission ? parseFloat(formCommission) : undefined,
      });
      resetForm();
      setEditingId(null);
      setDialogOpen(false);
      fetchVendeurs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleVendeurActive(id);
      fetchVendeurs();
    } catch {
      setError("Erreur lors du changement de statut");
    }
  };

  const isFormValid = formNom && formPrenom && formPhone && formUsername && (editingId || formPin.length === 4);

  const getInitials = (v: Vendeur) => `${v.firstname[0]}${v.lastname[0]}`.toUpperCase();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendeurs</h1>
          <p className="text-sm text-muted-foreground">
            {counts.total} vendeurs · {counts.actifs} actifs
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground gap-2"
          onClick={() => { resetForm(); setEditingId(null); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Ajouter un vendeur
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>Fermer</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{counts.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{counts.actifs}</p>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#DC2626" }}>{counts.inactifs}</p>
            <p className="text-xs text-muted-foreground">Inactifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par nom, username, téléphone..."
          className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendeur</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commission</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Créé le</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {getInitials(v)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{v.firstname} {v.lastname}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {v.phone || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-muted-foreground">@{v.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      {v.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: "#16A34A" }}>
                          <CheckCircle className="h-3 w-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-medium text-destructive">
                          <XCircle className="h-3 w-3" /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-primary font-semibold">
                      {v.commission ? `${v.commission}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                          <DropdownMenuItem onClick={() => setDetailVendeur(v)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(v)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Éditer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleActive(v.id)}>
                            <Power className="h-4 w-4 mr-2" />
                            {v.isActive ? "Désactiver" : "Activer"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Aucun vendeur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Dialog formulaire */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier vendeur" : "Nouveau vendeur"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifiez les informations du vendeur" : "Remplissez les informations du vendeur"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input placeholder="Ex: Marie" value={formPrenom} onChange={(e) => setFormPrenom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input placeholder="Ex: Joseph" value={formNom} onChange={(e) => setFormNom(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input placeholder="+509 XXXX-XXXX" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Nom d&apos;utilisateur</Label>
              <Input
                placeholder="Ex: marie.joseph"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              />
              <p className="text-xs text-muted-foreground">Pour la connexion du vendeur</p>
            </div>

            <div className="space-y-1.5">
              <Label>PIN (4 chiffres){editingId ? " — laisser vide pour ne pas changer" : ""}</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="····"
                className="text-center tracking-[0.5em] text-lg"
                value={formPin}
                onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Commission <span className="text-muted-foreground">(optionnel)</span></Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 15"
                  value={formCommission}
                  onChange={(e) => setFormCommission(e.target.value.replace(/\D/g, ""))}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground font-semibold">%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Adresse <span className="text-muted-foreground">(optionnel)</span></Label>
              <Input
                placeholder="Ex: Pétion-Ville"
                value={formAdresse}
                onChange={(e) => setFormAdresse(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-primary text-primary-foreground gap-2"
              onClick={editingId ? handleEdit : handleSubmit}
              disabled={!isFormValid || saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Enregistrer" : "Créer le vendeur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailVendeur} onOpenChange={(open) => !open && setDetailVendeur(null)}>
        {detailVendeur && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Détails vendeur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                    {getInitials(detailVendeur)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold">{detailVendeur.firstname} {detailVendeur.lastname}</p>
                  <p className="text-xs text-muted-foreground font-mono">@{detailVendeur.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="text-sm font-medium font-mono">{detailVendeur.username}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium">{detailVendeur.phone || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="text-sm font-medium">{detailVendeur.adresse || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="text-sm font-bold text-primary">{detailVendeur.commission ? `${detailVendeur.commission}%` : "Par défaut"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Créé le</p>
                  <p className="text-sm font-medium">{new Date(detailVendeur.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white mt-1"
                    style={{ backgroundColor: detailVendeur.isActive ? "#16A34A" : "#DC2626" }}
                  >
                    {detailVendeur.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailVendeur(null)}>
                Fermer
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                onClick={() => { openEdit(detailVendeur); setDetailVendeur(null); }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Éditer
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
