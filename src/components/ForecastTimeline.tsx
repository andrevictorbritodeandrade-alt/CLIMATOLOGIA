import React, { useEffect, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Clock, ShieldAlert } from "lucide-react";
import { HourlyForecast } from "../types";

interface ForecastTimelineProps {
  hourly: HourlyForecast[];
  activeDayIndex: number;
  setActiveDayIndex: (idx: number) => void;
  activeHourIndex: number;
  setActiveHourIndex: (idx: number) => void;
  isDark: boolean;
}

export default function ForecastTimeline({
  hourly,
  activeDayIndex,
  setActiveDayIndex,
  activeHourIndex,
  setActiveHourIndex,
  isDark,
}: ForecastTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Filter hourly data for the selected day (24 hours block)
  const startIndex = activeDayIndex * 24;
  const dayHourlyData = hourly.slice(startIndex, startIndex + 24);

  // Play animation timer (advances hour-by-hour every 1.3s)
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && dayHourlyData.length > 0) {
      interval = setInterval(() => {
        setActiveHourIndex((activeHourIndex + 1) % 24);
        if (activeHourIndex === 23) {
          // Wrap around and advance to next day, or loop back to day 0
          setActiveDayIndex((activeDayIndex + 1) % 16);
        }
      }, 1300);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeHourIndex, activeDayIndex, dayHourlyData]);

  if (dayHourlyData.length === 0) return null;

  const currentHourData = dayHourlyData[activeHourIndex];

  // Helper compass rotation showing where it comes from and where it is going to
  const getWindDirectionText = (deg: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
    const fromIndex = Math.round(deg / 22.5) % 16;
    const toIndex = Math.round(((deg + 180) % 360) / 22.5) % 16;
    const fromName = directions[fromIndex];
    const toName = directions[toIndex];
    return `Vem de ${fromName} ➔ vai para ${toName}`;
  };

  // Weather descriptions mapping
  const weatherCodes: { [key: number]: string } = {
    0: "Céu Limpo",
    1: "Parcialmente Nublado",
    2: "Nublado",
    3: "Encoberto",
    45: "Nevoeiro",
    48: "Nevoeiro Gelado",
    51: "Garoa Leve",
    53: "Garoa Moderada",
    55: "Garoa Densa",
    61: "Chuva Fraca",
    63: "Chuva Moderada",
    65: "Chuva Forte",
    80: "Pancadas de Chuva Fraca",
    81: "Pancadas de Chuva Moderada",
    82: "Pancadas de Chuva Forte",
    95: "Trovoadas",
    96: "Trovoadas com Granizo Fraco",
    99: "Trovoadas com Granizo Forte",
  };

  // Weather background image selector mapping considering time of day (day vs night/dawn)
  const getWeatherBgImage = (code: number, timeVal?: any) => {
    let hour = 12; // default daytime
    if (timeVal !== undefined && timeVal !== null) {
      if (typeof timeVal === "number") {
        hour = timeVal;
      } else if (typeof timeVal === "string") {
        if (timeVal.includes(":")) {
          const parts = timeVal.split(":");
          const parsedH = parseInt(parts[0], 10);
          hour = isNaN(parsedH) ? 12 : parsedH;
        } else {
          const parsed = new Date(timeVal);
          hour = isNaN(parsed.getTime()) ? 12 : parsed.getHours();
        }
      } else if (timeVal instanceof Date) {
        hour = isNaN(timeVal.getTime()) ? 12 : timeVal.getHours();
      }
    }

    const isNight = hour < 6 || hour >= 18;

    // Weather Code 0: Clear Sky / Céu Limpo
    if (code === 0) {
      return isNight
        ? "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80" // Dark starry clear night
        : "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1200&q=80"; // Vibrant bright sunny blue sky
    }

    // Weather Code 1: Mainly Clear / Partly Cloudy / Parcialmente Nublado
    if (code === 1) {
      return isNight
        ? "https://images.unsplash.com/photo-1532978379173-523e16f371f2?auto=format&fit=crop&w=1200&q=80" // Moon & clouds starry night
        : "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80"; // Daytime partly cloudy with blue sky
    }

    // Weather Code 2 & 3: Cloudy / Overcast / Nublado / Encoberto
    if (code === 2 || code === 3) {
      return isNight
        ? "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80" // Night dark heavy clouds
        : "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=1200&q=80"; // Daytime clouds with soft daylight
    }

    // Weather Code 45 & 48: Fog / Nevoeiro
    if (code === 45 || code === 48) {
      return isNight
        ? "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80" // Dark moody night fog
        : "https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1200&q=80"; // Daytime misty fog
    }

    // Weather Codes 51-65 & 80-82: Drizzle / Rain / Showers / Chuva
    if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) {
      return isNight
        ? "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80" // Dark rainy night
        : "https://images.unsplash.com/photo-1519692938311-b8ae53248370?auto=format&fit=crop&w=1200&q=80"; // Daytime rain drops
    }

    // Weather Codes 71-75: Snow / Neve
    if (code >= 71 && code <= 75) {
      return isNight
        ? "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80" // Night snow
        : "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=1200&q=80"; // Day snow
    }

    // Weather Codes 95-99: Thunderstorms / Trovoadas
    if (code >= 95) {
      return isNight
        ? "https://images.unsplash.com/photo-1472120489100-d03f7e0477b9?auto=format&fit=crop&w=1200&q=80" // Night lightning storm
        : "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1200&q=80"; // Day storm sky
    }

    return isNight
      ? "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1200&q=80";
  };

  return (
    <div
      id="forecast-timeline-card"
      className={`relative overflow-hidden rounded-[32px] p-6 border transition-all duration-300 shadow-sm ${
        isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
      }`}
    >
      {/* Dynamic Ultra-realistic Weather Background with blur & fade */}
      {currentHourData && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            key={`${currentHourData.weatherCode}-${currentHourData.time}`}
            src={getWeatherBgImage(currentHourData.weatherCode, currentHourData.time)}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-65 dark:opacity-45 transition-all duration-700 scale-105"
          />
          {/* Frosted glass/blur layer - blends into card for ultra-premium aesthetic */}
          <div className="absolute inset-0 backdrop-blur-[6px] bg-white/10 dark:bg-black/30" />
          
          {/* Advanced Multi-directional fade so image softens seamlessly at the card's boundaries */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent dark:from-[#111111]/90 dark:via-[#111111]/40" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-[#6E5D0E]/10 text-[#6E5D0E] dark:text-[#EAB308] backdrop-blur-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[#1F1B16] dark:text-[#f0f0f0]">
                Linha do Tempo Hora a Hora
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Navegue pelas condições climáticas simuladas ao longo de 24 horas
              </p>
            </div>
          </div>

          {/* Looping automatic controls */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-inner border select-none backdrop-blur-md ${
              isPlaying
                ? "bg-[#E2725B] border-[#E98C79] text-white animate-pulse"
                : isDark
                ? "bg-[#1E1E1E]/80 border-[#333] text-gray-300 hover:bg-[#2A2A2A]"
                : "bg-[#F4F0E6]/80 border-[#E7E1D1] text-[#1F1B16] hover:bg-[#E7E1D1]"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>⏸️ Looping Ativo</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>▶️ Reproduzir Loop (1.3s)</span>
              </>
            )}
          </button>
        </div>

        {/* Grid displaying current hour selected details */}
        {currentHourData && (
          <div
            className={`rounded-2xl p-4 mb-5 border grid grid-cols-2 md:grid-cols-5 gap-4 backdrop-blur-sm transition-all duration-300 ${
              isDark ? "bg-[#161616]/80 border-[#222]" : "bg-[#FDFCFB]/80 border-[#E7E1D1]/60"
            }`}
          >
            <div className="col-span-2 md:col-span-1 border-r border-zinc-200 dark:border-zinc-800 pr-2 flex flex-col justify-center">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase">Hora Simulada</span>
              <span className="text-2xl font-black text-[#6E5D0E] dark:text-[#EAB308]">
                {new Date(currentHourData.time).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 font-bold">
                {new Date(currentHourData.time).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Temperatura</span>
              <span className="text-lg font-extrabold text-[#1F1B16] dark:text-white">
                {Math.round(currentHourData.temp)}°C
              </span>
              <span className="text-[10px] text-zinc-400 font-bold">Sensação {Math.round(currentHourData.feels)}°C</span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Condição</span>
              <span className="text-sm font-extrabold text-[#E2725B] leading-tight">
                {weatherCodes[currentHourData.weatherCode] || "Estável"}
              </span>
              <span className="text-[10px] text-zinc-400 font-bold">Precip: {currentHourData.precip_prob}%</span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Vento</span>
              <span className="text-sm font-extrabold text-[#1F1B16] dark:text-white leading-tight">
                {currentHourData.wind_speed.toFixed(1)} km/h
              </span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase text-emerald-600 dark:text-emerald-400">
                🧭 Dir: {getWindDirectionText(currentHourData.wind_deg)} ({currentHourData.wind_deg}°)
              </span>
            </div>

            <div className="col-span-2 md:col-span-1 flex flex-col justify-center">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Pressão / Umid</span>
              <span className="text-sm font-extrabold text-[#1F1B16] dark:text-white">
                {currentHourData.pressure} hPa
              </span>
              <span className="text-[10px] text-zinc-400 font-bold">Umidade: {currentHourData.humidity}%</span>
            </div>
          </div>
        )}

        {/* Slider Selector */}
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-black px-1">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00 (Meio-Dia)</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>23:59</span>
          </div>

          <div className="relative flex items-center group">
            <input
              type="range"
              min={0}
              max={23}
              value={activeHourIndex}
              onChange={(e) => {
                setActiveHourIndex(parseInt(e.target.value));
                setIsPlaying(false); // Stop playing when adjusted manually
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200/60 dark:bg-[#2A2A2A]/60 accent-[#E2725B] focus:outline-none"
            />
          </div>

          {/* Selected day switcher inside timeline */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                setActiveDayIndex(Math.max(0, activeDayIndex - 1));
                setIsPlaying(false);
              }}
              disabled={activeDayIndex === 0}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <span className="text-xs font-extrabold text-[#6E5D0E] dark:text-[#EAB308] uppercase tracking-wide bg-white/40 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">
              Dia da Previsão:{" "}
              {new Date(dayHourlyData[0]?.time).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </span>
            <button
              onClick={() => {
                setActiveDayIndex(Math.min(15, activeDayIndex + 1));
                setIsPlaying(false);
              }}
              disabled={activeDayIndex === 15}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
