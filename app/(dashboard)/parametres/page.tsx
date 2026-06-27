"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Shield, Users, Plus, Pencil, Trash2, Save, Upload, FileText, Image as ImageIcon, Search, Eye, Loader2 } from "lucide-react";
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
import { getSettings, updateSettings } from "@/lib/settings";
import { getStoredUser } from "@/lib/auth";
import api from "@/lib/api";

type UserData = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  isActive: boolean;
};

const ROLES = ["admin", "superviseur", "comptable", "support"];

export default function ParametresPage() {
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSection, setSavingSection] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Paramètres système
  const [miseMin, setMiseMin] = useState("");
  const [miseMax, setMiseMax] = useState("");
  const [commission, setCommission] = useState("");
  const [tirageAuto, setTirageAuto] = useState(true);

  // Entreprise
  const [entrepriseNom, setEntrepriseNom] = useState("");
  const [entrepriseAdresse, setEntrepriseAdresse] = useState("");
  const [entrepriseTel, setEntrepriseTel] = useState("");
  const [entrepriseEmail, setEntrepriseEmail] = useState("");

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fiche config
  const [ficheShowLogo, setFicheShowLogo] = useState(true);
  const [ficheShowEntreprise, setFicheShowEntreprise] = useState(true);
  const [ficheShowTel, setFicheShowTel] = useState(true);
  const [ficheMessage, setFicheMessage] = useState("");

  // Jackpot
  const [jackpotEnabled, setJackpotEnabled] = useState(true);
  const [jackpotPrix, setJackpotPrix] = useState("100");

  // Sécurité
  const [auth2fa, setAuth2fa] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const s = await getSettings();
      setMiseMin(s["system.mise_min"] || "1");
      setMiseMax(s["system.mise_max"] || "5000");
      setCommission(s["system.commission"] || "15");
      setTirageAuto(s["system.tirage_auto"] !== "false");
      setEntrepriseNom(s["entreprise.nom"] || "");
      setEntrepriseAdresse(s["entreprise.adresse"] || "");
      setEntrepriseTel(s["entreprise.telephone"] || "");
      setEntrepriseEmail(s["entreprise.email"] || "");
      setLogoPreview(s["entreprise.logo"] || null);
      setFicheShowLogo(s["fiche.show_logo"] !== "false");
      setFicheShowEntreprise(s["fiche.show_entreprise"] !== "false");
      setFicheShowTel(s["fiche.show_tel"] !== "false");
      setFicheMessage(s["fiche.message"] || "");
      setJackpotEnabled(s["jackpot.enabled"] !== "false");
      setJackpotPrix(s["jackpot.prix"] || "100");
      setAuth2fa(s["security.2fa"] !== "false");
    } catch { /* */ } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSection = async (section: string, data: Record<string, string>) => {
    setSavingSection(section);
    try {
      await updateSettings(data);
      setEditingSection(null);
    } catch { /* */ } finally {
      setTimeout(() => setSavingSection(""), 1500);
    }
  };

  const handleSaveSystem = () => saveSection("system", {
    "system.mise_min": miseMin,
    "system.mise_max": miseMax,
    "system.commission": commission,
    "system.tirage_auto": String(tirageAuto),
  });

  const handleSaveEntreprise = () => {
    const data: Record<string, string> = {
      "entreprise.nom": entrepriseNom,
      "entreprise.adresse": entrepriseAdresse,
      "entreprise.telephone": entrepriseTel,
      "entreprise.email": entrepriseEmail,
    };
    if (logoPreview) data["entreprise.logo"] = logoPreview;
    saveSection("entreprise", data);
  };

  const handleSaveFiche = () => saveSection("fiche", {
    "fiche.show_logo": String(ficheShowLogo),
    "fiche.show_entreprise": String(ficheShowEntreprise),
    "fiche.show_tel": String(ficheShowTel),
    "fiche.message": ficheMessage,
  });

  const handleSaveJackpot = () => saveSection("jackpot", {
    "jackpot.enabled": String(jackpotEnabled),
    "jackpot.prix": jackpotPrix,
  });

  const handleSave2fa = () => saveSection("security", {
    "security.2fa": String(auth2fa),
  });

  // Users
  const [users, setUsers] = useState<UserData[]>([]);
  const [userDialog, setUserDialog] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [formFirstname, setFormFirstname] = useState("");
  const [formLastname, setFormLastname] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState(ROLES[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [detailUser, setDetailUser] = useState<UserData | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get<UserData[]>("/users");
      setUsers(data.filter((u) => u.role !== "vendeur"));
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const resetUserForm = () => {
    setFormFirstname("");
    setFormLastname("");
    setFormEmail("");
    setFormPassword("");
    setFormRole(ROLES[0]);
    setEditUserId(null);
  };

  const openNewUser = () => {
    resetUserForm();
    setUserDialog(true);
  };

  const openEditUser = (u: UserData) => {
    setEditUserId(u.id);
    setFormFirstname(u.firstname);
    setFormLastname(u.lastname);
    setFormEmail(u.email);
    setFormPassword("");
    setFormRole(u.role);
    setUserDialog(true);
  };

  const saveUser = async () => {
    if (!formFirstname || !formLastname || !formEmail) return;
    try {
      if (editUserId) {
        await api.patch(`/users/${editUserId}`, {
          firstname: formFirstname,
          lastname: formLastname,
          email: formEmail,
          role: formRole,
        });
      } else {
        await api.post("/auth/register", {
          firstname: formFirstname,
          lastname: formLastname,
          email: formEmail,
          role: formRole,
        });
      }
      setUserDialog(false);
      resetUserForm();
      fetchUsers();
    } catch { /* */ }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      setConfirmDeleteId(null);
      fetchUsers();
    } catch { /* */ }
  };

  const toggleUserStatus = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    try {
      await api.patch(`/users/${id}`, { isActive: !user.isActive } as any);
      fetchUsers();
    } catch { /* */ }
  };


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Configuration du système</p>
      </div>
      <div className="grid grid-cols-2 gap-6 items-start">

        {/* Paramètres système */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Paramètres système</h3>
              {editingSection !== "system" && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingSection("system")}>
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-sm">Mise minimale</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={miseMin}
                    onChange={(e) => setMiseMin(e.target.value.replace(/\D/g, ""))}
                    disabled={editingSection !== "system"}
                    className="w-20 rounded-md border border-border bg-muted/30 px-2 py-1 text-right text-sm font-bold outline-none focus:border-primary tabular-nums disabled:opacity-70 disabled:cursor-default"
                  />
                  <span className="text-xs text-muted-foreground font-semibold">HTG</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-sm">Mise maximale</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={miseMax}
                    onChange={(e) => setMiseMax(e.target.value.replace(/\D/g, ""))}
                    disabled={editingSection !== "system"}
                    className="w-20 rounded-md border border-border bg-muted/30 px-2 py-1 text-right text-sm font-bold outline-none focus:border-primary tabular-nums disabled:opacity-70 disabled:cursor-default"
                  />
                  <span className="text-xs text-muted-foreground font-semibold">HTG</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-sm">Commission vendeur</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value.replace(/\D/g, ""))}
                    disabled={editingSection !== "system"}
                    className="w-16 rounded-md border border-border bg-muted/30 px-2 py-1 text-right text-sm font-bold outline-none focus:border-primary tabular-nums disabled:opacity-70 disabled:cursor-default"
                  />
                  <span className="text-xs text-muted-foreground font-semibold">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm">Tirage automatique</span>
                <button
                  onClick={() => editingSection === "system" && setTirageAuto(!tirageAuto)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tirageAuto ? "bg-primary" : "bg-muted"} ${editingSection !== "system" ? "opacity-70 cursor-default" : ""}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${tirageAuto ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            {editingSection === "system" && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => { setEditingSection(null); fetchSettings(); }}>Annuler</Button>
                <Button className="bg-primary text-primary-foreground gap-2" onClick={handleSaveSystem}>
                  <Save className="h-4 w-4" />
                  {savingSection === "system" ? "Enregistré !" : "Enregistrer"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations entreprise */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Informations entreprise</h3>
              </div>
              {editingSection !== "entreprise" && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingSection("entreprise")}>
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={entrepriseNom} onChange={(e) => setEntrepriseNom(e.target.value)} disabled={editingSection !== "entreprise"} />
              </div>
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input value={entrepriseAdresse} onChange={(e) => setEntrepriseAdresse(e.target.value)} disabled={editingSection !== "entreprise"} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={entrepriseTel} onChange={(e) => setEntrepriseTel(e.target.value)} disabled={editingSection !== "entreprise"} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={entrepriseEmail} onChange={(e) => setEntrepriseEmail(e.target.value)} disabled={editingSection !== "entreprise"} />
              </div>
            </div>
            {/* Logo */}
            <div className="mt-5 space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                      <Upload className="h-3 w-3" />
                      Choisir un fichier
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setLogoPreview(URL.createObjectURL(file));
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          const { data } = await api.post<{ url: string }>("/upload/logo", formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                          });
                          setLogoPreview(data.url);
                        } catch { /* */ }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG. Max 1MB.</p>
                </div>
              </div>
            </div>

            {editingSection === "entreprise" && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => { setEditingSection(null); fetchSettings(); }}>Annuler</Button>
                <Button className="bg-primary text-primary-foreground gap-2" onClick={handleSaveEntreprise}>
                  <Save className="h-4 w-4" />
                  {savingSection === "entreprise" ? "Enregistré !" : "Enregistrer"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration fiche */}
        <Card className="border-border bg-card col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Configuration des fiches</h3>
              </div>
              {editingSection !== "fiche" && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingSection("fiche")}>
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </Button>
              )}
            </div>

            <div className="flex gap-6">
              {/* Options */}
              <div className="flex-1 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Éléments affichés</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">Logo entreprise</span>
                    <button
                      onClick={() => editingSection === "fiche" && setFicheShowLogo(!ficheShowLogo)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ficheShowLogo ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${ficheShowLogo ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">Nom entreprise</span>
                    <button
                      onClick={() => editingSection === "fiche" && setFicheShowEntreprise(!ficheShowEntreprise)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ficheShowEntreprise ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${ficheShowEntreprise ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">Téléphone</span>
                    <button
                      onClick={() => editingSection === "fiche" && setFicheShowTel(!ficheShowTel)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ficheShowTel ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${ficheShowTel ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Message en bas de fiche</Label>
                  <textarea
                    value={ficheMessage}
                    onChange={(e) => setFicheMessage(e.target.value)}
                    disabled={editingSection !== "fiche"}
                    rows={2}
                    className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary resize-none disabled:opacity-70 disabled:cursor-default"
                  />
                </div>

                {editingSection === "fiche" && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setEditingSection(null); fetchSettings(); }}>Annuler</Button>
                    <Button className="bg-primary text-primary-foreground gap-2" onClick={handleSaveFiche}>
                      <Save className="h-4 w-4" />
                      {savingSection === "fiche" ? "Enregistré !" : "Enregistrer"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Aperçu fiche */}
              <div className="w-64">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Aperçu</p>
                <div className="rounded-lg border border-border bg-white p-4 text-[#0D1B3E] text-center space-y-2">
                  {ficheShowLogo && (
                    <div className="flex justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-8 object-contain" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-[#D4AF37] flex items-center justify-center text-white text-[10px] font-bold">LD</div>
                      )}
                    </div>
                  )}
                  {ficheShowEntreprise && (
                    <p className="text-xs font-bold">{entrepriseNom}</p>
                  )}
                  {ficheShowTel && (
                    <p className="text-[9px] text-gray-500">{entrepriseTel}</p>
                  )}
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="text-left space-y-1">
                    <div className="flex justify-between text-[9px]">
                      <span>Réf: T8821</span>
                      <span>24/06/2026 14:32:05</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span>Midi · New York</span>
                      <span>Vendeur: ML</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="text-left space-y-0.5">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span>4523 L4 Opt1</span>
                      <span>250</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono">
                      <span>7891 L4 Opt2</span>
                      <span>250</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>Total</span>
                    <span>500 HTG</span>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 border border-gray-300 rounded grid grid-cols-5 grid-rows-5 gap-px p-1">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`${[0,1,2,4,5,6,10,12,14,18,20,22,23,24].includes(i) ? "bg-[#0D1B3E]" : "bg-white"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[7px] text-gray-400 text-center font-mono mt-1">T8821</p>
                  {ficheMessage && (
                    <>
                      <div className="border-t border-dashed border-gray-300 my-2" />
                      <p className="text-[8px] text-gray-400 italic">{ficheMessage}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jackpot */}
        <Card className="border-border bg-card col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎰</span>
                <h3 className="text-lg font-bold">Jackpot</h3>
              </div>
              {editingSection !== "jackpot" && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingSection("jackpot")}>
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium">Activer le Jackpot</p>
                <p className="text-xs text-muted-foreground">Permet aux vendeurs de vendre des tickets Jackpot</p>
              </div>
              <button
                onClick={() => editingSection === "jackpot" && setJackpotEnabled(!jackpotEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${jackpotEnabled ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${jackpotEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Prix par ligne</p>
                <p className="text-xs text-muted-foreground">Montant fixe pour chaque ligne Jackpot</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={jackpotPrix}
                  onChange={(e) => editingSection === "jackpot" && setJackpotPrix(e.target.value.replace(/\D/g, ""))}
                  className="w-20 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-right outline-none focus:border-primary tabular-nums"
                  disabled={editingSection !== "jackpot"}
                />
                <span className="text-xs text-muted-foreground">HTG</span>
              </div>
            </div>

            {editingSection === "jackpot" && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => { setEditingSection(null); fetchSettings(); }}>Annuler</Button>
                <Button className="bg-primary text-primary-foreground gap-2" onClick={handleSaveJackpot}>
                  <Save className="h-4 w-4" />
                  {savingSection === "jackpot" ? "Enregistré !" : "Enregistrer"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Utilisateurs */}
        <Card className="border-border bg-card col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Utilisateurs</h3>
                <span className="text-xs text-muted-foreground">({users.length})</span>
              </div>
              <Button size="sm" className="bg-primary text-primary-foreground gap-1.5" onClick={openNewUser}>
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou rôle..."
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {users
                .filter((u) => {
                  if (!userSearch) return true;
                  const q = userSearch.toLowerCase();
                  const full = `${u.firstname} ${u.lastname}`.toLowerCase();
                  return full.includes(q) || u.email?.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
                })
                .map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setDetailUser(u)}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {u.firstname[0]}{u.lastname[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{u.firstname} {u.lastname}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-muted rounded px-2 py-0.5 capitalize">{u.role}</span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white cursor-pointer"
                      style={{ backgroundColor: u.isActive ? "#16A34A" : "#DC2626" }}
                      onClick={() => toggleUserStatus(u.id)}
                    >
                      {u.isActive ? "Actif" : "Inactif"}
                    </span>
                    <button onClick={() => setDetailUser(u)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                    {getStoredUser()?.id !== u.id && (
                      <button onClick={() => openEditUser(u)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    )}
                    {getStoredUser()?.id !== u.id && (
                      <button onClick={() => setConfirmDeleteId(u.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-destructive/10 transition-colors text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </div>
              ))}
              {users.filter((u) => {
                if (!userSearch) return true;
                const q = userSearch.toLowerCase();
                const full = `${u.firstname} ${u.lastname}`.toLowerCase();
                return full.includes(q) || u.email?.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
              }).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun utilisateur trouvé</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Dialog */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editUserId ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
            <DialogDescription>Remplissez les informations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input placeholder="Ex: Jean" value={formFirstname} onChange={(e) => setFormFirstname(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input placeholder="Ex: Admin" value={formLastname} onChange={(e) => setFormLastname(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="Ex: jean@ldml.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            {!editUserId && (
              <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                Un mot de passe temporaire sera envoyé par email à l&apos;utilisateur.
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <select
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none capitalize"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground" onClick={saveUser} disabled={!formFirstname || !formLastname || !formEmail}>
              {editUserId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Annuler</Button>
            <Button
              style={{ backgroundColor: "#DC2626", color: "white" }}
              onClick={() => confirmDeleteId && deleteUser(confirmDeleteId)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail User */}
      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        {detailUser && (
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Détails utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
                  {detailUser.firstname[0]}{detailUser.lastname[0]}
                </div>
                <div>
                  <p className="text-lg font-bold">{detailUser.firstname} {detailUser.lastname}</p>
                  <p className="text-sm text-muted-foreground">{detailUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Rôle</p>
                  <p className="text-sm font-medium capitalize">{detailUser.role}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white mt-1"
                    style={{ backgroundColor: detailUser.isActive ? "#16A34A" : "#DC2626" }}
                  >
                    {detailUser.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailUser(null)}>Fermer</Button>
              {getStoredUser()?.id !== detailUser.id && (
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => { openEditUser(detailUser); setDetailUser(null); }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Éditer
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
