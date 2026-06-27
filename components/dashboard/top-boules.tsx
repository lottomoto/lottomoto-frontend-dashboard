import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle } from "lucide-react";
import Link from "next/link";

interface TopBoulesProps {
  data: { numero: number; count: number }[];
}

export function TopBoules({ data }: TopBoulesProps) {
  const max = data[0]?.count || 1;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
          <Circle className="h-4 w-4 text-muted-foreground" />
          Boules les + jouées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length > 0 ? data.map((b, i) => (
          <div key={b.numero} className="flex items-center gap-3">
            <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
              {String(b.numero).padStart(2, "0")}
            </div>
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-success" style={{ width: `${(b.count / max) * 100}%` }} />
              </div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{b.count}x</span>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune vente</p>
        )}
        <Link href="/boules" className="block w-full mt-2 text-center text-sm text-primary hover:underline">
          Gérer les boules →
        </Link>
      </CardContent>
    </Card>
  );
}
