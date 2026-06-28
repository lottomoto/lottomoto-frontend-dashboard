"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ClipboardList, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  createdAt: string;
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-500",
  UPDATE: "bg-blue-500/10 text-blue-500",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-purple-500/10 text-purple-500",
  PAY: "bg-orange-500/10 text-orange-500",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  LOGIN: "Connexion",
  PAY: "Paiement",
};

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: LogEntry[]; total: number }>("/logs?limit=100");
      setLogs(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Historique des actions</h1>
            <p className="text-sm text-muted-foreground">
              Consultez les dernières actions effectuées sur le système
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Rafraîchir
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entité</th>
                  <th className="px-6 py-4">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Chargement des logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-muted-foreground">
                      Aucun log trouvé
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(log.createdAt))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                              {log.user.firstname[0]}{log.user.lastname[0]}
                            </div>
                            <div>
                              <p className="font-medium text-xs">{log.user.firstname} {log.user.lastname}</p>
                              <p className="text-[10px] text-muted-foreground">{log.user.role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Système</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || "bg-muted text-muted-foreground"}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-xs">
                        {log.entityType}
                        {log.entityId && (
                          <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                            {log.entityId.substring(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {log.details ? (
                          <pre className="text-[10px] bg-muted/50 p-2 rounded max-w-xs overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
