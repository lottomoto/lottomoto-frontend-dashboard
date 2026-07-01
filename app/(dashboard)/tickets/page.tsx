"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, Ticket, Trash2, Loader2, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { type TicketData, getTickets, deleteTicket, payTicket } from "@/lib/tickets";

const STATUS_FILTERS = [
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "gagne", label: "Gagné" },
  { id: "paye", label: "Payé" },
  { id: "perdu", label: "Perdu" },
];

const HTZ = "America/Port-au-Prince";

const formatDate = (iso: string) => {
  try {
    // Plain date strings (YYYY-MM-DD) are parsed as UTC midnight by JS,
    // causing a -1 day shift in UTC-4. Appending T12:00:00 treats it as local noon.
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + "T12:00:00" : iso;
    return new Date(normalized).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric", timeZone: HTZ,
    });
  } catch { return iso; }
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: true, timeZone: HTZ,
    });
  } catch { return iso; }
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [detailTicket, setDetailTicket] = useState<TicketData | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTickets();
      setTickets(data);
    } catch {
      toast.error("Impossible de charger les tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTicket(id);
      toast.success("Ticket supprimé");
      setConfirmDeleteId(null);
      setDetailTicket(null);
      fetchTickets();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handlePay = async (id: string) => {
    try {
      await payTicket(id);
      toast.success("Ticket marqué comme payé");
      setDetailTicket(null);
      fetchTickets();
    } catch {
      toast.error("Erreur lors du paiement");
    }
  };

  const filtered = tickets.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.ref.toLowerCase().includes(q) && !(t.vendeur || "").toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "tous" && t.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    total: tickets.length,
    en_attente: tickets.filter((t) => t.status === "en_attente").length,
    gagne: tickets.filter((t) => t.status === "gagne").length,
    paye: tickets.filter((t) => t.status === "paye").length,
    perdu: tickets.filter((t) => t.status === "perdu").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tickets</h1>
        <p className="text-sm text-muted-foreground">
          {counts.total} fiches au total · {counts.en_attente} en attente
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{counts.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#D4AF37" }}>{counts.en_attente}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{counts.gagne}</p>
            <p className="text-xs text-muted-foreground">Gagné</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{counts.paye}</p>
            <p className="text-xs text-muted-foreground">Payé</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#DC2626" }}>{counts.perdu}</p>
            <p className="text-xs text-muted-foreground">Perdu</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par réf. ou vendeur..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === f.id ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

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
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Réf.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendeur</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tirage</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lignes</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Montant</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><span className="text-sm font-mono font-semibold">{t.ref}</span></td>
                    <td className="px-4 py-3 text-sm">{t.vendeur || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted rounded px-2 py-0.5">{t.tirage} · {t.borlette}</span>
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums">{t.lignes.length}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                      {Number(t.total).toLocaleString()} <span className="text-[9px] text-muted-foreground">HTG</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: t.status === "paye" ? "#3B82F6" : t.status === "gagne" ? "#16A34A" : t.status === "perdu" ? "#DC2626" : "#D4AF37" }}
                      >
                        {t.status === "paye" ? "Payé" : t.status === "gagne" ? "Gagné" : t.status === "perdu" ? "Perdu" : "En attente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailTicket(t)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        {t.status === "gagne" && (
                          <button onClick={() => handlePay(t.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-blue-500/20 transition-colors text-blue-500">
                            <Banknote className="h-4 w-4" />
                          </button>
                        )}
                        {t.status === "en_attente" && (
                          <button onClick={() => setConfirmDeleteId(t.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-destructive/20 transition-colors text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune fiche trouvée</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Detail */}
      <Dialog open={!!detailTicket} onOpenChange={(open) => !open && setDetailTicket(null)}>
        {detailTicket && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Fiche {detailTicket.ref}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Vendeur</p>
                  <p className="text-sm font-medium">{detailTicket.vendeur || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Tirage</p>
                  <p className="text-sm font-medium">{detailTicket.tirage} · {detailTicket.borlette}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Date &amp; Heure</p>
                  <p className="text-sm font-medium leading-snug">{formatDateTime(detailTicket.createdAt)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Montant</p>
                  <p className="text-sm font-bold">{Number(detailTicket.total).toLocaleString()} HTG</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Détail des lignes ({detailTicket.lignes.length})
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase text-left">Numéro</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase text-left">Type</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase text-left">Boules</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase text-right">Prix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailTicket.lignes.map((l) => (
                        <tr key={l.id} className="border-t border-border/50">
                          <td className="px-3 py-2 text-sm font-mono font-bold tracking-widest">{l.numero}</td>
                          <td className="px-3 py-2 text-sm">{l.type === "lotto5" ? "L5" : "L4"}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {l.prefix !== null && <span className="text-primary mr-1">{l.prefix}-</span>}
                            {String(l.boule1).padStart(2, "0")} + {String(l.boule2).padStart(2, "0")}
                          </td>
                          <td className="px-3 py-2 text-sm text-right tabular-nums">{Number(l.prix).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <DialogFooter>
              {detailTicket.status === "en_attente" && (
                <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { setDetailTicket(null); setConfirmDeleteId(detailTicket.id); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                </Button>
              )}
              {detailTicket.status === "gagne" && (
                <Button style={{ backgroundColor: "#3B82F6", color: "white" }} onClick={() => handlePay(detailTicket.id)}>
                  <Banknote className="h-4 w-4 mr-2" /> Payer
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetailTicket(null)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Annuler</Button>
            <Button style={{ backgroundColor: "#DC2626", color: "white" }} onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
