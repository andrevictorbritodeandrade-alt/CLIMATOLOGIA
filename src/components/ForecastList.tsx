import React, { useRef } from "react";
import { DailyForecast } from "../types";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  CloudLightning,
  Wind,
  ChevronLeft,
  ChevronRight,
  Droplet,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface ForecastListProps {
  days: DailyForecast[];
  activeDayIndex: number;
  setActiveDayIndex: (idx: number) => void;
  isDark: boolean;
}

export default function ForecastList({ days, activeDayIndex, setActiveDayIndex, isDark }: ForecastListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: "smooth" });
    }
  };

  // Compass directions helper
  const getWindDirectionText = (deg: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
    return directions[Math.round(deg / 22.5) % 16];
  };

  // Weather card style & background theme tailored strictly to forecast conditions
  const getCardStyleAndIcon = (day: DailyForecast, isDarkTheme: boolean) => {
    const code = day.weatherCode;
    const isWindy = day.wind_avg > 25;

    // 1. Heavy Thunderstorm / Tempestade (code >= 90)
    if (code >= 90) {
      return {
        bgClass: isDarkTheme
          ? "bg-gradient-to-b from-[#2E1065] via-[#1C0A3F] to-[#121212] border-purple-500/50 text-purple-100"
          : "bg-gradient-to-b from-[#F3E8FF] via-[#E9D5FF] to-[#C084FC] border-purple-400 text-purple-950",
        pillBg: isDarkTheme ? "bg-purple-900/40 text-purple-200 border border-purple-700/40" : "bg-purple-200/80 text-purple-900",
        icon: <CloudLightning className="w-5 h-5 text-amber-300 animate-bounce shrink-0" />,
        badgeText: "Tempestade",
      };
    }

    // 2. Rain / Garoa / Pancadas (code between 50 and 89)
    if (code >= 50 && code < 90) {
      return {
        bgClass: isDarkTheme
          ? "bg-gradient-to-b from-[#0F2D4A] via-[#091C30] to-[#121212] border-cyan-500/50 text-cyan-100"
          : "bg-gradient-to-b from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC] border-cyan-400 text-cyan-950",
        pillBg: isDarkTheme ? "bg-cyan-900/40 text-cyan-200 border border-cyan-700/40" : "bg-cyan-200/80 text-cyan-950",
        icon: <CloudRain className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />,
        badgeText: "Chuvoso",
      };
    }

    // 3. Sunny / Clear Sky (code <= 1)
    if (code <= 1) {
      return {
        bgClass: isDarkTheme
          ? "bg-gradient-to-b from-[#332200] via-[#221700] to-[#121212] border-amber-500/50 text-amber-100"
          : "bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-amber-300 text-amber-950",
        pillBg: isDarkTheme ? "bg-amber-950/60 text-amber-200 border border-amber-700/40" : "bg-amber-200/80 text-amber-950",
        icon: <Sun className="w-5 h-5 text-amber-400 animate-spin-slow shrink-0" />,
        badgeText: "Ensolarado",
      };
    }

    // 4. Partially Cloudy / Sol com Nuvens (code === 2)
    if (code === 2) {
      return {
        bgClass: isDarkTheme
          ? "bg-gradient-to-b from-[#1C2C3E] via-[#0F1B2A] to-[#121212] border-sky-500/40 text-sky-100"
          : "bg-gradient-to-b from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD] border-sky-300 text-sky-950",
        pillBg: isDarkTheme ? "bg-sky-950/60 text-sky-200 border border-sky-700/40" : "bg-sky-200/80 text-sky-950",
        icon: <CloudSun className="w-5 h-5 text-amber-400 shrink-0" />,
        badgeText: "Parc. Nublado",
      };
    }

    // 5. Windy day condition override
    if (isWindy) {
      return {
        bgClass: isDarkTheme
          ? "bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#121212] border-emerald-500/50 text-emerald-100"
          : "bg-gradient-to-b from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0] border-emerald-400 text-emerald-950",
        pillBg: isDarkTheme ? "bg-emerald-950/60 text-emerald-200 border border-emerald-700/40" : "bg-emerald-200/80 text-emerald-950",
        icon: <Wind className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />,
        badgeText: "Ventania",
      };
    }

    // 6. Overcast / Cloudy / Fog (code 3, 45, 48)
    return {
      bgClass: isDarkTheme
        ? "bg-gradient-to-b from-[#2A2D32] via-[#1A1C20] to-[#121212] border-slate-500/40 text-slate-100"
        : "bg-gradient-to-b from-[#F4F4F5] via-[#E4E4E7] to-[#CBD5E1] border-slate-300 text-slate-900",
      pillBg: isDarkTheme ? "bg-zinc-800/80 text-zinc-200 border border-zinc-700/40" : "bg-zinc-200/80 text-zinc-900",
      icon: <Cloud className="w-5 h-5 text-slate-300 dark:text-slate-200 shrink-0" />,
      badgeText: "Nublado",
    };
  };

  return (
    <div
      id="daily-forecast-section"
      className={`rounded-[28px] p-4 sm:p-6 border transition-all duration-300 shadow-sm ${
        isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#E2725B]/10 text-[#E2725B]">
            <Sun className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[#1F1B16] dark:text-white">
                Previsão Diária (16 Dias)
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E2725B]/15 text-[#E2725B] border border-[#E2725B]/20 shrink-0">
                {days.length} Dias
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cores temáticas por clima, máximas/mínimas destacadas e alertas de chuva
            </p>
          </div>
        </div>

        {/* Scroll Control Arrows */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            Dia {activeDayIndex + 1} de {days.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={scrollLeft}
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
              }`}
              title="Anterior (Rolar Dias)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
              }`}
              title="Próximo (Rolar Dias)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scrolling container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-7 pt-6 px-6 scroll-px-6 snap-x scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent scroll-smooth"
      >
        {days.map((day, i) => {
          const { bgClass, pillBg, icon, badgeText } = getCardStyleAndIcon(day, isDark);
          const isActive = i === activeDayIndex;
          const hasRain = day.pop > 0 || day.rain_mm > 0;

          return (
            <div
              key={day.date}
              onClick={() => setActiveDayIndex(i)}
              className={`min-w-[155px] sm:min-w-[165px] snap-start rounded-2xl p-3.5 cursor-pointer transition-all duration-300 transform select-none flex flex-col justify-between border shadow-lg relative shrink-0 ${bgClass} ${
                isActive
                  ? "ring-[6px] ring-amber-400 scale-[1.06] -translate-y-2.5 z-10 shadow-2xl border-amber-400/40"
                  : "hover:-translate-y-1 hover:scale-[1.01] opacity-90 hover:opacity-100"
              }`}
            >
              {/* Active Marker Badge */}
              {isActive && (
                <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 border-2 border-white dark:border-zinc-900" />
                </span>
              )}

              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase opacity-80 leading-none">
                    {new Date(day.date + "T12:00").toLocaleDateString("pt-BR", {
                      weekday: "short",
                    })}
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 opacity-90">
                    {badgeText}
                  </span>
                </div>
                <p className="text-sm font-black tracking-tight leading-tight mt-0.5">
                  {new Date(day.date + "T12:00").toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>

              {/* Icon & Description */}
              <div className="my-2 flex items-center justify-between gap-1.5 bg-black/10 dark:bg-white/5 p-2 rounded-xl">
                {icon}
                <span className="text-[9px] font-black tracking-wider uppercase opacity-90 leading-tight text-right line-clamp-2">
                  {day.main_desc}
                </span>
              </div>

              {/* Distinct Colors for Max and Min Temperatures */}
              <div className="space-y-1.5 font-sans my-1">
                <div className="grid grid-cols-2 gap-1 text-center">
                  {/* MÁXIMA (Warm Red/Rose) */}
                  <div className="bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/30 rounded-lg p-1 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-0.5 text-[9px] font-black uppercase text-rose-600 dark:text-rose-400">
                      <ArrowUp className="w-2.5 h-2.5" /> Máx
                    </div>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-300">
                      {Math.round(day.temp_max)}°
                    </span>
                  </div>

                  {/* MÍNIMA (Cool Blue/Cyan) */}
                  <div className="bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/30 rounded-lg p-1 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-0.5 text-[9px] font-black uppercase text-sky-600 dark:text-sky-400">
                      <ArrowDown className="w-2.5 h-2.5" /> Mín
                    </div>
                    <span className="text-sm font-black text-sky-600 dark:text-sky-300">
                      {Math.round(day.temp_min)}°
                    </span>
                  </div>
                </div>

                {/* Rain Signal & Accumulation */}
                <div
                  className={`rounded-lg p-1.5 text-xs font-bold transition-all ${
                    hasRain
                      ? "bg-cyan-500/20 dark:bg-cyan-500/25 border border-cyan-500/40 text-cyan-900 dark:text-cyan-200"
                      : "bg-black/5 dark:bg-white/5 border border-transparent opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] leading-tight">
                    <span className="flex items-center gap-1 font-extrabold">
                      <Droplet className={`w-3 h-3 ${hasRain ? "text-cyan-500 fill-cyan-400 animate-bounce" : "opacity-50"}`} />
                      Chuva:
                    </span>
                    <span className="font-black text-cyan-600 dark:text-cyan-300">{day.pop}%</span>
                  </div>

                  {day.rain_mm > 0 && (
                    <div className="flex items-center justify-between text-[9px] leading-tight mt-1 pt-1 border-t border-cyan-500/20">
                      <span className="opacity-80">Acumulado:</span>
                      <span className="font-black text-cyan-600 dark:text-cyan-300">{day.rain_mm.toFixed(1)} mm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Wind Tag */}
              <div className={`mt-1 rounded-xl p-1.5 text-center leading-none ${pillBg}`}>
                <p className="text-[8px] uppercase font-black tracking-wider opacity-90">Vento Diário</p>
                <p className="text-[11px] font-black mt-0.5">
                  {Math.round(day.wind_avg)} km/h{" "}
                  <span className="font-black text-[9px] px-1 bg-black/10 dark:bg-white/10 rounded">
                    {getWindDirectionText(day.wind_deg_common)}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

