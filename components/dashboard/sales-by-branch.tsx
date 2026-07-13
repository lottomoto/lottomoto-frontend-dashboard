import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface SalesByBranchProps {
  data: { nom: string; recettes: number }[];
}

export function SalesByBranch({ data }: SalesByBranchProps) {
  const max = data?.[0]?.recettes || 1;
  const fmt = (n: number) => n.toLocaleString();

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Ventes par session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length > 0 ? data.map((b) => (
          <div key={b.nom}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-card-foreground">{b.nom}</span>
              <span className="font-medium text-card-foreground">{fmt(b.recettes)} HTG</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(b.recettes / max) * 100}%` }} />
            </div>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
        )}
      </CardContent>
    </Card>
  );
}
