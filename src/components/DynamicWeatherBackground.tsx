import React, { useEffect, useRef } from "react";
import { WeatherData, HourlyForecast } from "../types";
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudFog, Snowflake, Zap } from "lucide-react";

interface DynamicWeatherBackgroundProps {
  weather: WeatherData | null;
  cityName: string;
  isDark: boolean;
  selectedHourlyData?: HourlyForecast | null;
  activeHourIndex?: number;
  activeDayIndex?: number;
}

export default function DynamicWeatherBackground({
  weather,
  cityName,
  isDark,
  selectedHourlyData,
  activeHourIndex,
  activeDayIndex,
}: DynamicWeatherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine current active hour and date either from timeline simulation or live clock
  const currentHourlyData = selectedHourlyData || (
    weather?.hourly && activeHourIndex !== undefined
      ? weather.hourly[(activeDayIndex || 0) * 24 + activeHourIndex]
      : null
  );

  const effectiveTime = currentHourlyData?.time
    ? new Date(currentHourlyData.time)
    : new Date();

  const currentHour = effectiveTime.getHours();
  const currentMinutes = effectiveTime.getMinutes();
  const floatHour = currentHour + currentMinutes / 60;

  // Determine Period of the Day (Precise solar position mapping)
  let periodKey: "madrugada" | "amanhecer" | "dia" | "por_do_sol" | "noite" = "dia";
  let periodName = "Dia (Ensolarado / Claro)";
  let isNightTime = false;

  if (floatHour >= 0 && floatHour < 5.25) {
    periodKey = "madrugada";
    periodName = "Madrugada (Céu Noturno Estrelado)";
    isNightTime = true;
  } else if (floatHour >= 5.25 && floatHour < 7.75) {
    periodKey = "amanhecer";
    periodName = "Amanhecer / Aurora Crepuscular";
    isNightTime = false;
  } else if (floatHour >= 7.75 && floatHour < 16.5) {
    periodKey = "dia";
    periodName = "Dia (Luz Solar)";
    isNightTime = false;
  } else if (floatHour >= 16.5 && floatHour < 18.75) {
    periodKey = "por_do_sol";
    periodName = "Pôr do Sol / Crepúsculo Alaranjado";
    isNightTime = false;
  } else {
    periodKey = "noite";
    periodName = "Noite Estrelada";
    isNightTime = true;
  }

  // Weather Code & Rain Intensity logic
  const weatherCode = currentHourlyData?.weatherCode ?? weather?.current.weatherCode ?? 0;
  const rainAmount = currentHourlyData?.precip ?? weather?.current.rain1h ?? 0;

  // Categorize condition
  let conditionKey: "clear" | "partly" | "overcast" | "drizzle" | "rain" | "storm" | "hail" | "fog" = "clear";
  let conditionLabel = "Céu Limpo";
  let conditionIcon = "☀️";

  if (weatherCode === 0 || weatherCode === 1) {
    conditionKey = weatherCode === 0 ? "clear" : "partly";
    conditionLabel = weatherCode === 0
      ? (isNightTime ? "Noite Límpida e Estrelada" : "Ensolarado / Céu Límpido")
      : "Sol com Poucas Nuvens";
    conditionIcon = isNightTime ? "🌙" : "☀️";
  } else if (weatherCode === 2) {
    conditionKey = "partly";
    conditionLabel = "Parcialmente Nublado";
    conditionIcon = "⛅";
  } else if (weatherCode === 3) {
    conditionKey = "overcast";
    conditionLabel = "Tempo Totalmente Fechado / Encoberto";
    conditionIcon = "☁️";
  } else if (weatherCode === 45 || weatherCode === 48) {
    conditionKey = "fog";
    conditionLabel = "Neblina / Nevoeiro / Cerração";
    conditionIcon = "🌫️";
  } else if (
    (weatherCode >= 51 && weatherCode <= 57) ||
    (rainAmount > 0 && rainAmount < 2.5)
  ) {
    conditionKey = "drizzle";
    conditionLabel = "Garoa Fina / Chuvisco";
    conditionIcon = "🌦️";
  } else if (
    (weatherCode >= 61 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    rainAmount >= 2.5
  ) {
    conditionKey = "rain";
    conditionLabel = "Chuva Moderada a Torrencial";
    conditionIcon = "🌧️";
  } else if (weatherCode >= 89 && weatherCode <= 99) {
    conditionKey = "storm";
    conditionLabel = "Tempestade Severa com Raios";
    conditionIcon = "⛈️";
  } else if (weatherCode === 77 || weatherCode === 85 || weatherCode === 86) {
    conditionKey = "hail";
    conditionLabel = "Chuva de Granizo (Pedras de Gelo)";
    conditionIcon = "🌨️";
  }

  // Dark sky indicator for thick cloud layer / rain
  const isSkyDarkened = conditionKey === "overcast" || conditionKey === "rain" || conditionKey === "storm" || conditionKey === "hail";

  // Dynamic Background Gradient selection
  const getGradientClasses = () => {
    if (isSkyDarkened) {
      if (isNightTime || periodKey === "madrugada") {
        return "from-[#02040a] via-[#080d18] to-[#010204]";
      }
      return "from-[#111827] via-[#1f2937] to-[#0f172a]";
    }

    switch (periodKey) {
      case "madrugada":
        return "from-[#020617] via-[#090e22] to-[#01030a]";
      case "amanhecer":
        return isDark
          ? "from-[#3b0764]/80 via-[#581c87]/50 to-[#020617]"
          : "from-[#fde68a] via-[#fca5a5] to-[#bae6fd]";
      case "por_do_sol":
        return isDark
          ? "from-[#7c2d12]/90 via-[#701a75]/60 to-[#020617]"
          : "from-[#fdba74] via-[#f472b6] to-[#c084fc]";
      case "noite":
        return isDark
          ? "from-[#020617] via-[#0b1329] to-[#020617]"
          : "from-[#0f172a] via-[#1e1b4b] to-[#020617]";
      case "dia":
      default:
        return isDark
          ? "from-[#0369a1]/25 via-[#0284c7]/15 to-[#020617]"
          : "from-[#7dd3fc] via-[#e0f2fe] to-[#fff7ed]";
    }
  };

  // Canvas Effect Loop for Rain, Drizzle, Hail, Lightning, Stars, Fog
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle Array
    const particles: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      radius: number;
      vx: number;
      vy: number;
    }> = [];

    const particleCount =
      conditionKey === "drizzle"
        ? 150
        : conditionKey === "rain"
        ? 320
        : conditionKey === "storm"
        ? 450
        : conditionKey === "hail"
        ? 180
        : isNightTime && (conditionKey === "clear" || conditionKey === "partly")
        ? 120 // Stars
        : 0;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 22 + 10,
        speed: Math.random() * 14 + 8,
        opacity: Math.random() * 0.7 + 0.3,
        radius: Math.random() * 3.5 + 2, // For hail or stars
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 6 + 4,
      });
    }

    let flashCounter = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- STARS IN NIGHT OR MADRUGADA ---
      if (isNightTime && (conditionKey === "clear" || conditionKey === "partly")) {
        ctx.fillStyle = "#ffffff";
        particles.forEach((p) => {
          ctx.globalAlpha = p.opacity * (Math.sin(Date.now() * 0.003 + p.x) * 0.35 + 0.65);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.random() > 0.85 ? 1.8 : 1, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // --- RAIN / DRIZZLE / STORM PARTICLES ---
      if (conditionKey === "drizzle" || conditionKey === "rain" || conditionKey === "storm") {
        ctx.strokeStyle = conditionKey === "drizzle" ? "rgba(186, 230, 253, 0.55)" : "rgba(224, 242, 254, 0.85)";
        ctx.lineWidth = conditionKey === "drizzle" ? 1.2 : conditionKey === "storm" ? 2.8 : 2;

        particles.forEach((p) => {
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 4, p.y + p.length);
          ctx.stroke();

          // Movement
          p.y += p.speed * (conditionKey === "storm" ? 1.7 : 1.1);
          p.x -= 2;

          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        });
      }

      // --- HAIL (GRANIZO - PEDRAS DE GELO) ---
      if (conditionKey === "hail") {
        ctx.fillStyle = "#ffffff";
        particles.forEach((p) => {
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speed * 2.1;
          p.x += Math.sin(p.y * 0.08) * 1.5;

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        });
      }

      // --- LIGHTNING FLASHES IN STORM ---
      if (conditionKey === "storm") {
        flashCounter++;
        if (flashCounter % 180 === 0 || Math.random() < 0.012) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.fillRect(0, 0, width, height);
        }
      }

      // --- FOG / NEBLINA WAVES ---
      if (conditionKey === "fog") {
        const time = Date.now() * 0.0004;
        ctx.fillStyle = "rgba(226, 232, 240, 0.12)";
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(
            width * 0.5 + Math.sin(time + i) * 220,
            height * 0.5 + i * 90,
            width * 0.65,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [conditionKey, isNightTime]);

  return (
    <div className="relative w-full overflow-hidden transition-all duration-700">
      {/* Background Gradient Base Layer */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 bg-gradient-to-b transition-all duration-1000 ${getGradientClasses()}`}
      />

      {/* Floating Canvas for Real-time Weather Particles */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-85"
      />

      {/* Dynamic Animated Cloud & Celestial Decorators */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-45">
        {/* Sun / Moon Graphic in Top Corner */}
        <div
          className={`absolute top-12 right-12 transition-all duration-1000 ${
            isNightTime
              ? "text-amber-100/40 drop-shadow-[0_0_30px_rgba(255,255,255,0.45)]"
              : "text-amber-400/60 drop-shadow-[0_0_40px_rgba(251,191,36,0.7)]"
          }`}
        >
          {isNightTime ? (
            <Moon className="w-28 h-28 animate-pulse" />
          ) : (
            <Sun className="w-32 h-32 animate-[spin_60s_linear_infinite]" />
          )}
        </div>

        {/* Floating Clouds Layer 1 */}
        {(conditionKey === "partly" || conditionKey === "overcast" || conditionKey === "rain" || conditionKey === "storm") && (
          <div className="absolute top-16 left-0 w-[200%] flex justify-between animate-[drift_45s_linear_infinite] opacity-75">
            <Cloud className={`w-48 h-48 ${isSkyDarkened ? "text-slate-800" : "text-white"}`} />
            <Cloud className={`w-64 h-64 ${isSkyDarkened ? "text-zinc-800" : "text-white"}`} />
            <Cloud className={`w-56 h-56 ${isSkyDarkened ? "text-slate-900" : "text-white"}`} />
          </div>
        )}

        {/* Floating Clouds Layer 2 (Slower drift) */}
        {isSkyDarkened && (
          <div className="absolute top-32 left-[-20%] w-[200%] flex justify-around animate-[drift_70s_linear_infinite_reverse] opacity-85">
            <Cloud className="w-80 h-80 text-zinc-900" />
            <Cloud className="w-72 h-72 text-slate-900" />
          </div>
        )}
      </div>

      {/* Custom Keyframe animation for drifting clouds */}
      <style>{`
        @keyframes drift {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
