"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  name: string;
  score: number;
  hits: number;
}

interface DashboardChartProps {
  data: ChartData[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[#9CA3AF] text-sm">
        Nenhum dado disponível para o gráfico
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5EDE0" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9CA3AF", fontSize: 12, fontFamily: "Nunito" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9CA3AF", fontSize: 12, fontFamily: "Nunito" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E5EDE0",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontFamily: "Nunito",
            fontSize: "13px",
          }}
          labelStyle={{ fontWeight: 700, color: "#1A1F16" }}
          cursor={{ fill: "#F4F7F2" }}
        />
        <Bar dataKey="score" name="Pontos" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === 0 ? "#64C832" : index === 1 ? "#52A828" : index === 2 ? "#146E37" : "#A8E07A"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
