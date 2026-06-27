"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Loader2, Eye, EyeOff } from "lucide-react";
import { login, isAuthenticated } from "@/lib/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ backgroundColor: "#0D1B3E" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "#D4AF37" }}>
            <Trophy className="h-6 w-6" style={{ color: "#0D1B3E" }} />
          </div>
          <div>
            <p className="text-base font-bold text-white">La Différence</p>
            <p className="text-xs" style={{ color: "#D4AF37" }}>Moto / Lotto</p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Système de gestion de loterie
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
            Gérez vos vendeurs, boules, tirages et rapports<br />
            en un seul endroit — simple, rapide et sécurisé.
          </p>
        </div>

        <div className="w-32 h-1 rounded-full" style={{ backgroundColor: "#D4AF37" }} />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: "#F1F5F9" }}>
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "#D4AF37" }}>
              <Trophy className="h-6 w-6" style={{ color: "#0D1B3E" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#0D1B3E" }}>La Différence</p>
              <p className="text-[10px]" style={{ color: "#D4AF37" }}>Moto / Lotto</p>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0D1B3E" }}>Connexion</h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              Entrez vos informations pour continuer
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "#334155" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="admin@ladifference.ht"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#0D1B3E",
                }}
                onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
                onBlur={(e) => e.target.style.borderColor = "#CBD5E1"}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "#334155" }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 pr-11 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    color: "#0D1B3E",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
                  onBlur={(e) => e.target.style.borderColor = "#CBD5E1"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#94A3B8" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs font-medium" style={{ color: "#D4AF37" }}>
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              suppressHydrationWarning
              className="w-full rounded-lg py-3.5 text-sm font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#D4AF37", color: "#0D1B3E" }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </div>

          <p className="text-center text-xs" style={{ color: "#94A3B8" }}>
            Accès sécurisé • La Différence © 2026
          </p>
        </form>
      </div>
    </div>
  );
}
