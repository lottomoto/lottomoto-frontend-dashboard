"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Globe, Clock, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  type BorletteData,
  getBorlettes,
  createBorlette,
  updateBorlette,
  toggleBorletteActive,
  deleteBorlette,
} from "@/lib/borlettes";

type FormTirage = { id: string; nom: string; ouverture: string; fermeture: string };

export default function TiragesPage() {
  const [borlettes, setBorlettes] = useState<BorletteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [borletteDialog, setBorletteDialog] = useState(false);
  const [editBorletteId, setEditBorletteId] = useState<string | null>(null);
  const [formNom, setFormNom] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formTirages, setFormTirages] = useState<FormTirage[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const tirageCounter = useRef(100);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBorlettes();
      setBorlettes(data);
    } catch {
      toast.error("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormNom("");
    setFormCode("");
    setFormTirages([]);
    setEditBorletteId(null);
  };

  const openNew = () => {
    resetForm();
    setFormTirages([{ id: String(tirageCounter.current++), nom: "Midi", ouverture: "08:00", fermeture: "12:30" }]);
    setBorletteDialog(true);
  };

  const openEdit = (b: BorletteData) => {
    setEditBorletteId(b.id);
    setFormNom(b.nom);
    setFormCode(b.code);
    setFormTirages(b.tirages.map((t) => ({ id: t.id, nom: t.nom, ouverture: t.ouverture || "", fermeture: t.fermeture })));
    setBorletteDialog(true);
  };

  const handleSave = async () => {
    if (!formNom || !formCode || formTirages.length === 0) return;
    if (!formTirages.every((t) => t.nom && t.fermeture)) return;
    setSaving(true);
    try {
      const tiragesPayload = formTirages.map((t) => ({ nom: t.nom, ouverture: t.ouverture, fermeture: t.fermeture }));
      if (editBorletteId) {
        await updateBorlette(editBorletteId, { nom: formNom, code: formCode, tirages: tiragesPayload });
      } else {
        await createBorlette({ nom: formNom, code: formCode, tirages: tiragesPayload });
      }
      setBorletteDialog(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleBorletteActive(id);
      fetchData();
    } catch { toast.error("Erreur"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBorlette(id);
      setConfirmDelete(null);
      fetchData();
    } catch { toast.error("Erreur"); }
  };

  const addFormTirage = () => {
    setFormTirages((prev) => [...prev, { id: String(tirageCounter.current++), nom: "", ouverture: "", fermeture: "" }]);
  };

  const updateFormTirage = (id: string, field: keyof FormTirage, val: string) => {
    setFormTirages((prev) => prev.map((t) => t.id === id ? { ...t, [field]: val } : t));
  };

  const removeFormTirage = (id: string) => {
    setFormTirages((prev) => prev.filter((t) => t.id !== id));
  };

  const isFormValid = formNom && formCode && formTirages.length > 0 && formTirages.every((t) => t.nom && t.ouverture && t.fermeture);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Borlettes & Tirages</h1>
          <p className="text-sm text-muted-foreground">
            {borlettes.length} borlettes · {borlettes.reduce((s, b) => s + b.tirages.length, 0)} tirages
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Ajouter une borlette
        </Button>
      </div>


      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {borlettes.map((b) => {
            const isOpen = expandedId === b.id;
            return (
              <Card key={b.id} className="border-border bg-card">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : b.id)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        {b.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{b.nom}</p>
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: b.isActive ? "#16A34A" : "#DC2626" }}
                          >
                            {b.isActive ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{b.tirages.length} tirage{b.tirages.length > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground px-2 py-1"
                        onClick={(e) => { e.stopPropagation(); handleToggle(b.id); }}
                      >
                        {b.isActive ? "Désactiver" : "Activer"}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(b); }} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(b.id); }} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-destructive/10 transition-colors text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-border px-4 pb-4 pt-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tirages</p>
                      <div className="space-y-2">
                        {b.tirages.map((t) => (
                          <div key={t.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">{t.nom}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-semibold" style={{ color: "#16A34A" }}>{t.ouverture}</p>
                                <p className="text-[10px] text-muted-foreground">Ouverture</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-destructive">{t.fermeture}</p>
                                <p className="text-[10px] text-muted-foreground">Fermeture</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {borlettes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune borlette configurée</p>
          )}
        </div>
      )}

      {/* Borlette Dialog */}
      <Dialog open={borletteDialog} onOpenChange={setBorletteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBorletteId ? "Modifier la borlette" : "Nouvelle borlette"}</DialogTitle>
            <DialogDescription>Configurez la borlette et ses tirages</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input placeholder="Ex: New York" value={formNom} onChange={(e) => setFormNom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input placeholder="Ex: NY" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase().slice(0, 3))} maxLength={3} className="uppercase" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Tirages</Label>
                <button onClick={addFormTirage} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  <Plus className="h-3 w-3" /> Ajouter un tirage
                </button>
              </div>
              <div className="space-y-3">
                {formTirages.map((t, i) => (
                  <div key={t.id} className="rounded-lg border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Tirage {i + 1}</span>
                      {formTirages.length > 1 && (
                        <button onClick={() => removeFormTirage(t.id)} className="text-destructive hover:underline text-xs">Retirer</button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Nom</p>
                        <Input placeholder="Ex: Midi" value={t.nom} onChange={(e) => updateFormTirage(t.id, "nom", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Ouverture</p>
                        <input
                          type="time"
                          value={t.ouverture}
                          onChange={(e) => updateFormTirage(t.id, "ouverture", e.target.value)}
                          className="w-full rounded-md border border-border bg-card px-2 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Fermeture</p>
                        <input
                          type="time"
                          value={t.fermeture}
                          onChange={(e) => updateFormTirage(t.id, "fermeture", e.target.value)}
                          className="w-full rounded-md border border-border bg-card px-2 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorletteDialog(false)}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={handleSave} disabled={!isFormValid || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editBorletteId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer cette borlette et tous ses tirages ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button style={{ backgroundColor: "#DC2626", color: "white" }} onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
