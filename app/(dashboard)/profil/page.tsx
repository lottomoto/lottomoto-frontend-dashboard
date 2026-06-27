"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/auth";
import api from "@/lib/api";

export default function ProfilPage() {
  const currentUser = getStoredUser();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/users/${currentUser.id}`);
      setFirstname(data.firstname);
      setLastname(data.lastname);
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setRole(data.role);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveInfo = async () => {
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      await api.patch(`/users/${currentUser.id}`, { firstname, lastname, email, phone });
      const stored = getStoredUser();
      if (stored) {
        localStorage.setItem("user", JSON.stringify({ ...stored, firstname, lastname, email }));
      }
      setEditingInfo(false);
      toast.success("Profil mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return toast.error("Le mot de passe doit contenir au moins 6 caractères");
    if (newPassword !== confirmPassword) return toast.error("Les mots de passe ne correspondent pas");

    setSavingPassword(true);
    try {
      await api.patch(`/users/${currentUser?.id}`, { password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Mot de passe modifié");
    } catch {
      toast.error("Erreur lors du changement de mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar + nom */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-xl font-bold">
                {firstname[0]}{lastname[0]}
              </div>
              <div>
                <p className="text-lg font-bold">{firstname} {lastname}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white mt-1 capitalize" style={{ backgroundColor: "#16A34A" }}>
                  {role}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Informations</h3>
              {!editingInfo && (
                <Button variant="outline" size="sm" onClick={() => setEditingInfo(true)}>Modifier</Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input value={firstname} onChange={(e) => setFirstname(e.target.value)} disabled={!editingInfo} />
              </div>
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={lastname} onChange={(e) => setLastname(e.target.value)} disabled={!editingInfo} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editingInfo} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editingInfo} />
              </div>
            </div>
            {editingInfo && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => { setEditingInfo(false); fetchProfile(); }}>Annuler</Button>
                <Button className="bg-primary text-primary-foreground gap-2" onClick={handleSaveInfo} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Changer mot de passe */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-5">Changer le mot de passe</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 6 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                )}
              </div>
              <Button
                className="bg-primary text-primary-foreground gap-2"
                onClick={handleChangePassword}
                disabled={!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword || savingPassword}
              >
                {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                Changer le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
