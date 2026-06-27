"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface BetTypesChartProps {
  lotto4: number;
  lotto5: number;
}

const COLORS = ["#0D1B3E", "#D4AF37"];

export function BetTypesChart({ lotto4, lotto5 }: BetTypesChartProps) {
  const total = lotto4 + lotto5;
  const data = [
    { name: "Lotto 4", value: lotto4, color: COLORS[0] },
    { name: "Lotto 5", value: lotto5, color: COLORS[1] },
  ];

  return (
    <Card className="border-border bg-card w-[320px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-card-foreground">Types de paris</CardTitle>
        <p className="text-xs text-muted-foreground">Répartition du jour</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {data.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          </div>
        )}
        <div className="mt-2 w-full space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-card-foreground">{item.name}</span>
              </div>
              <span className="font-semibold" style={{ color: item.color === "#0D1B3E" ? "#F1F5F9" : item.color }}>
                {total > 0 ? `${Math.round((item.value / total) * 100)}%` : "0%"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
