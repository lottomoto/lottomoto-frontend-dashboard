"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Check, Pencil, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { type ResultatData, getResultats, createResultat, updateResultat } from "@/lib/resultats";
import api from "@/lib/api";

interface BorletteOption {
  id: string;
  nom: string;
  tirages: { id: string; nom: string }[];
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  const mois = ["Janv", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  return `${parseInt(d)} ${mois[parseInt(m) - 1]} ${y}`;
};

export default function ResultatsPage() {
  const [resultats, setResultats] = useState<ResultatData[]>([]);
  const [borlettesList, setBorlettesList] = useState<BorletteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [date, setDate] = useState(today());
  const [tirage, setTirage] = useState("");
  const [borletteId, setBorletteId] = useState("");
  const [lot1, setLot1] = useState("");
  const [lot2, setLot2] = useState("");
  const [lot3, setLot3] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resData, borlRes] = await Promise.all([
        getResultats(),
        api.get<BorletteOption[]>("/borlettes"),
      ]);
      setResultats(resData);
      setBorlettesList(borlRes.data);
      if (borlRes.data.length > 0 && !borletteId) {
        setBorletteId(borlRes.data[0].id);
        if (borlRes.data[0].tirages.length > 0) setTirage(borlRes.data[0].tirages[0].nom);
      }
    } catch {
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentBorlette = borlettesList.find((b) => b.id === borletteId);
  const currentTirages = currentBorlette?.tirages || [];
  const borletteLabel = currentBorlette?.nom || "";

  const isValid = lot1.length === 3 && lot2.length === 2 && lot3.length === 2 && borletteId && tirage;

  const isDuplicate = !editingId && resultats.some(
    (r) => r.date === date && r.tirage === tirage && r.borletteId === borletteId
  );

  const resetForm = () => {
    setDate(today());
    if (borlettesList.length > 0) {
      setBorletteId(borlettesList[0].id);
      if (borlettesList[0].tirages.length > 0) setTirage(borlettesList[0].tirages[0].nom);
    }
    setLot1("");
    setLot2("");
    setLot3("");
    setEditingId(null);
  };

  const handlePublish = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateResultat(editingId, { lot1, lot2, lot3 });
      } else {
        await createResultat({ date, tirage, borletteId, lot1, lot2, lot3 });
      }
      resetForm();
      setShowConfirm(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (r: ResultatData) => {
    setEditingId(r.id);
    setDate(r.date);
    setTirage(r.tirage);
    setBorletteId(r.borletteId);
    setLot1(r.lot1);
    setLot2(r.lot2);
    setLot3(r.lot3);
  };

  const onlyDigits = (val: string, max: number) => val.replace(/\D/g, "").slice(0, max);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{editingId ? "Modifier un résultat" : "Publier les résultats"}</h1>
        <p className="text-sm text-muted-foreground">
          {editingId ? "Modifiez les numéros gagnants" : "Saisissez les numéros gagnants pour chaque lot"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>Fermer</button>
        </div>
      )}

      {/* Formulaire */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <input
                type="date"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value)}
                disabled={!!editingId}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Borlette</Label>
              <SearchableSelect
                options={borlettesList.map((b) => ({ value: b.id, label: b.nom }))}
                value={borletteId}
                onChange={(val) => {
                  setBorletteId(val);
                  const bor = borlettesList.find((b) => b.id === val);
                  if (bor && bor.tirages.length > 0) setTirage(bor.tirages[0].nom);
                }}
                placeholder="Rechercher..."
                emptyLabel="Sélectionner..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tirage</Label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {currentTirages.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTirage(t.nom)}
                    disabled={!!editingId}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                      tirage === t.nom ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t.nom}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isDuplicate && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">
                Un résultat existe déjà pour <span className="font-bold">{formatDate(date)} · {tirage} · {borletteLabel}</span>. Modifiez-le depuis l&apos;historique.
              </p>
            </div>
          )}

          {/* 3 Lots */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Lot 1 <span className="text-muted-foreground">(3 chiffres)</span></Label>
              <input type="text" inputMode="numeric" maxLength={3} value={lot1} onChange={(e) => setLot1(onlyDigits(e.target.value, 3))} placeholder="000" className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] outline-none focus:border-primary tabular-nums placeholder:text-muted-foreground/30" />
              <p className="text-center text-xs text-muted-foreground">{lot1.length}/3</p>
            </div>
            <div className="space-y-1.5">
              <Label>Lot 2 <span className="text-muted-foreground">(2 chiffres)</span></Label>
              <input type="text" inputMode="numeric" maxLength={2} value={lot2} onChange={(e) => setLot2(onlyDigits(e.target.value, 2))} placeholder="00" className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] outline-none focus:border-primary tabular-nums placeholder:text-muted-foreground/30" />
              <p className="text-center text-xs text-muted-foreground">{lot2.length}/2</p>
            </div>
            <div className="space-y-1.5">
              <Label>Lot 3 <span className="text-muted-foreground">(2 chiffres)</span></Label>
              <input type="text" inputMode="numeric" maxLength={2} value={lot3} onChange={(e) => setLot3(onlyDigits(e.target.value, 2))} placeholder="00" className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] outline-none focus:border-primary tabular-nums placeholder:text-muted-foreground/30" />
              <p className="text-center text-xs text-muted-foreground">{lot3.length}/2</p>
            </div>
          </div>

          {isValid && !isDuplicate && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Aperçu</p>
              <div className="flex items-center gap-4">
                <span className="text-xs bg-muted rounded px-2 py-0.5">{formatDate(date)} · {tirage} · {borletteLabel}</span>
                <div className="flex items-center gap-3">
                  <div className="text-center"><p className="text-[10px] text-muted-foreground">Lot 1</p><p className="text-xl font-bold text-primary tracking-widest">{lot1}</p></div>
                  <span className="text-muted-foreground">·</span>
                  <div className="text-center"><p className="text-[10px] text-muted-foreground">Lot 2</p><p className="text-xl font-bold text-primary tracking-widest">{lot2}</p></div>
                  <span className="text-muted-foreground">·</span>
                  <div className="text-center"><p className="text-[10px] text-muted-foreground">Lot 3</p><p className="text-xl font-bold text-primary tracking-widest">{lot3}</p></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {editingId && (
              <Button variant="outline" className="flex-1" onClick={resetForm}>Annuler la modification</Button>
            )}
            <Button
              className="flex-1 bg-primary text-primary-foreground gap-2 py-5 text-base"
              disabled={!isValid || isDuplicate || saving}
              onClick={() => setShowConfirm(true)}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Megaphone className="h-5 w-5" />
              {editingId ? "Enregistrer" : "Publier les résultats"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold mb-4">Résultats publiés</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tirage</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Borlette</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Lot 1</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Lot 2</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Lot 3</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((r) => (
                  <tr key={r.id} className={`border-b border-border/30 ${editingId === r.id ? "bg-primary/5" : ""}`}>
                    <td className="py-3 text-sm text-muted-foreground">{formatDate(r.date)}</td>
                    <td className="py-3"><span className="text-xs bg-muted rounded px-2 py-0.5">{r.tirage}</span></td>
                    <td className="py-3 text-sm">{r.borlette}</td>
                    <td className="py-3 text-center"><span className="text-lg font-bold tracking-widest tabular-nums">{r.lot1}</span></td>
                    <td className="py-3 text-center"><span className="text-lg font-bold tracking-widest tabular-nums text-primary">{r.lot2}</span></td>
                    <td className="py-3 text-center"><span className="text-lg font-bold tracking-widest tabular-nums text-primary">{r.lot3}</span></td>
                    <td className="py-3">
                      <button onClick={() => openEdit(r)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {resultats.length === 0 && !loading && (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Aucun résultat publié</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Confirmer la modification" : "Confirmer la publication"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {editingId ? "Vous allez modifier ce résultat :" : "Vous allez publier les résultats suivants :"}
            </p>
            <div className="rounded-lg bg-muted/50 p-4 text-center space-y-2">
              <span className="text-xs bg-muted rounded px-2 py-0.5">{formatDate(date)} · {tirage} · {borletteLabel}</span>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div><p className="text-[10px] text-muted-foreground">Lot 1</p><p className="text-2xl font-bold tracking-widest">{lot1}</p></div>
                <span className="text-muted-foreground text-xl">·</span>
                <div><p className="text-[10px] text-muted-foreground">Lot 2</p><p className="text-2xl font-bold tracking-widest text-primary">{lot2}</p></div>
                <span className="text-muted-foreground text-xl">·</span>
                <div><p className="text-[10px] text-muted-foreground">Lot 3</p><p className="text-2xl font-bold tracking-widest text-primary">{lot3}</p></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={handlePublish} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Check className="h-4 w-4" />
              {editingId ? "Enregistrer" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
