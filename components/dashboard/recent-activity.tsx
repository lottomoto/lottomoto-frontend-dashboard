import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";

interface Activity {
  vendeur: string;
  total: number;
  ref: string;
  tirage: string;
  createdAt: string;
}

interface RecentActivityProps {
  data: Activity[];
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.floor(diff / 60);
  return `il y a ${h}h`;
}

export function RecentActivity({ data }: RecentActivityProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length > 0 ? data.map((a) => (
          <div key={a.ref} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-[10px] font-bold text-white bg-success">V</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{a.vendeur || "Vendeur"}</p>
              <p className="text-xs text-muted-foreground">Vente · {Number(a.total).toLocaleString()} HTG · {a.tirage}</p>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{timeAgo(a.createdAt)}</span>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune activité</p>
        )}
      </CardContent>
    </Card>
  );
}
