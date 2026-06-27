import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  boulesBloquees: number;
  topBoule?: { numero: number; count: number };
}

export function AlertBanner({ boulesBloquees, topBoule }: AlertBannerProps) {
  const alerts: string[] = [];
  if (boulesBloquees > 0) alerts.push(`${boulesBloquees} boule${boulesBloquees > 1 ? "s" : ""} bloquée${boulesBloquees > 1 ? "s" : ""}`);
  if (topBoule && topBoule.count >= 5) alerts.push(`Boule ${String(topBoule.numero).padStart(2, "0")} très demandée (${topBoule.count}x)`);

  if (alerts.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-card-foreground">
          {alerts.join(" · ")}
        </p>
      </div>
      <Link href="/boules">
        <Button size="sm" variant="outline" className="shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          Voir Boules
        </Button>
      </Link>
    </div>
  );
}
