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
      <div className="flex h-40 sm:h-48 items-center justify-center text-center text-sm text-[#9CA3AF]">
        Nenhum dado disponível para o gráfico
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[320px] h-[240px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barGap={6}
            margin={{
              top: 10,
              right: 8,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5EDE0"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{
                fill: "#9CA3AF",
                fontSize: 11,
                fontFamily: "Nunito",
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              width={30}
              tick={{
                fill: "#9CA3AF",
                fontSize: 11,
                fontFamily: "Nunito",
              }}
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
              labelStyle={{
                fontWeight: 700,
                color: "#1A1F16",
              }}
              cursor={{
                fill: "#F4F7F2",
              }}
            />

            <Bar
              dataKey="score"
              name="Pontos"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0
                      ? "#64C832"
                      : index === 1
                      ? "#52A828"
                      : index === 2
                      ? "#146E37"
                      : "#A8E07A"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}