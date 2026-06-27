"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartPoint {
  date: string;
  recettes: number;
  paiements: number;
  benefice: number;
}

export function RapportsChart({ data = [] }: { data?: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94A3B8", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94A3B8", fontSize: 11 }}
          tickFormatter={(v) => `${v / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#132044",
            border: "1px solid #1E3A5F",
            borderRadius: "8px",
            color: "#F1F5F9",
            fontSize: "12px",
          }}
          formatter={(value, name) => [
            `${Number(value).toLocaleString()} G`,
            String(name).charAt(0).toUpperCase() + String(name).slice(1),
          ]}
        />
        <Legend
          iconSize={10}
          wrapperStyle={{ fontSize: "12px", color: "#94A3B8" }}
        />
        <Bar dataKey="recettes" fill="#0D1B3E" radius={[4, 4, 0, 0]} />
        <Bar dataKey="paiements" fill="#D4AF37" radius={[4, 4, 0, 0]} />
        <Bar dataKey="benefice" fill="#16A34A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
