"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Loader2, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Email envoyé avec succès");
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

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

        {sent ? (
          <div className="space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto" style={{ backgroundColor: "#D4AF3720" }}>
              <Mail className="h-8 w-8" style={{ color: "#D4AF37" }} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{ color: "#0D1B3E" }}>Vérifiez votre email</h1>
              <p className="text-sm mt-2" style={{ color: "#64748B" }}>
                Si un compte existe pour <strong style={{ color: "#0D1B3E" }}>{email}</strong>, vous recevrez un lien de réinitialisation.
              </p>
            </div>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-medium transition-colors"
              style={{ backgroundColor: "#0D1B3E", color: "#FFFFFF" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#0D1B3E" }}>Mot de passe oublié ?</h1>
              <p className="text-sm mt-1" style={{ color: "#64748B" }}>
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#334155" }}>Email</label>
                <input
                  type="email"
                  placeholder="admin@ladifference.ht"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", color: "#0D1B3E" }}
                  onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
                  onBlur={(e) => e.target.style.borderColor = "#CBD5E1"}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg py-3.5 text-sm font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "#D4AF37", color: "#0D1B3E" }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium"
                style={{ color: "#64748B" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
