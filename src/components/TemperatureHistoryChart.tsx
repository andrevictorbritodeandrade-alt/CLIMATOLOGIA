import React from "react";
import { DailyForecast } from "../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { History, Thermometer } from "lucide-react";

interface TemperatureHistoryChartProps {
  historicalData: DailyForecast[];
  isDark: boolean;
}

export default function TemperatureHistoryChart({
  historicalData,
  isDark,
}: TemperatureHistoryChartProps) {
  if (!historicalData || historicalData.length === 0) return null;

  const data = historicalData.map((day) => ({
    date: new Date(day.date).toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
    }),
    max: Math.round(day.temp_max),
    min: Math.round(day.temp_min),
  }));

  return (
    <div className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md rounded-3xl p-5 md:p-7 shadow-lg border border-black/5 dark:border-white/5 transition-all">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
          Histórico de Temperatura (Últimos 7 dias)
        </h3>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? "#333" : "#e5e7eb"}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11, fontWeight: "bold" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11, fontWeight: "bold" }}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(value) => `${value}°`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#27272a" : "#fff",
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                color: isDark ? "#fff" : "#000",
                fontWeight: "bold",
              }}
              itemStyle={{ fontWeight: "bold" }}
              labelStyle={{ color: isDark ? "#9ca3af" : "#6b7280", marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="max"
              name="Máxima"
              stroke="#EF4444"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorMax)"
            />
            <Area
              type="monotone"
              dataKey="min"
              name="Mínima"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorMin)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Máxima</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Mínima</span>
        </div>
      </div>
    </div>
  );
}
