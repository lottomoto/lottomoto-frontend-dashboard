"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface RevenueChartProps {
  data: { date: string; [tirage: string]: number | string }[];
  tirages: string[];
}

const TIRAGE_COLORS: Record<string, { stroke: string; id: string }> = {
  "Midi": { stroke: "#D4AF37", id: "midiGrad" },
  "Soir": { stroke: "#16A34A", id: "soirGrad" },
};
const FALLBACK_COLORS = ["#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];

export function RevenueChart({ data, tirages }: RevenueChartProps) {
  return (
    <Card className="border-border bg-card flex-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-card-foreground">Revenus par tirage</CardTitle>
            <p className="text-xs text-muted-foreground">7 derniers jours</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {tirages.map((t, i) => {
              const color = TIRAGE_COLORS[t]?.stroke || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
              return (
                <div key={t} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-muted-foreground">{t}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <defs>
                {tirages.map((t, i) => {
                  const color = TIRAGE_COLORS[t]?.stroke || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                  return (
                    <linearGradient key={t} id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#132044", border: "1px solid #1E3A5F", borderRadius: "8px", color: "#F1F5F9", fontSize: "12px" }}
                formatter={(value, name) => [`${Number(value).toLocaleString()} HTG`, String(name)]}
              />
              {tirages.map((t, i) => {
                const color = TIRAGE_COLORS[t]?.stroke || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                return <Area key={t} type="monotone" dataKey={t} stroke={color} fill={`url(#grad-${t})`} strokeWidth={2} />;
              })}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-16">Aucune donnée</p>
        )}
      </CardContent>
    </Card>
  );
}
