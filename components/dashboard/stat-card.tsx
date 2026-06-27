import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconBg: string;
  trend?: { value: string; positive: boolean };
  subtitleColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  trend,
  subtitleColor,
}: StatCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                trend.positive
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              <span>{trend.positive ? "↗" : "↘"}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <p className="mt-3 text-2xl font-bold text-card-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={cn("mt-1 text-xs", subtitleColor || "text-muted-foreground")}>
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}
