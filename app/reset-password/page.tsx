"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trophy, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isValid = password.length >= 6 && password === confirm && !!token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      toast.success("Mot de passe réinitialisé");
    } catch {
      toast.error("Lien invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "#0D1B3E" }}>Lien invalide</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>Ce lien de réinitialisation est invalide ou a expiré.</p>
        <Link href="/login" className="text-sm font-medium" style={{ color: "#D4AF37" }}>Retour à la connexion</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto" style={{ backgroundColor: "#16A34A20" }}>
          <CheckCircle className="h-8 w-8" style={{ color: "#16A34A" }} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "#0D1B3E" }}>Mot de passe réinitialisé</h1>
          <p className="text-sm mt-2" style={{ color: "#64748B" }}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        </div>
        <Link
          href="/login"
          className="flex items-center justify-center w-full rounded-lg py-3 text-sm font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#D4AF37", color: "#0D1B3E" }}
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0D1B3E" }}>Nouveau mot de passe</h1>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>Choisissez un nouveau mot de passe sécurisé</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "#334155" }}>Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-4 py-3 pr-11 text-sm outline-none transition-colors"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", color: "#0D1B3E" }}
              onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
              onBlur={(e) => e.target.style.borderColor = "#CBD5E1"}
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "#334155" }}>Confirmer le mot de passe</label>
          <input
            type="password"
            placeholder="Répétez le mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${confirm && confirm !== password ? "#DC2626" : "#CBD5E1"}`, color: "#0D1B3E" }}
            onFocus={(e) => e.target.style.borderColor = confirm && confirm !== password ? "#DC2626" : "#D4AF37"}
            onBlur={(e) => e.target.style.borderColor = confirm && confirm !== password ? "#DC2626" : "#CBD5E1"}
            required
          />
          {confirm && confirm !== password && (
            <p className="text-xs" style={{ color: "#DC2626" }}>Les mots de passe ne correspondent pas</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full rounded-lg py-3.5 text-sm font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#D4AF37", color: "#0D1B3E" }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8" style={{ backgroundColor: "#F1F5F9" }}>
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "#D4AF37" }}>
            <Trophy className="h-6 w-6" style={{ color: "#0D1B3E" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#0D1B3E" }}>La Différence</p>
            <p className="text-[10px]" style={{ color: "#D4AF37" }}>Moto / Lotto</p>
          </div>
        </div>
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#94A3B8" }} /></div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
