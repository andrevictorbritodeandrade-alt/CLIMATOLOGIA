import React, { useEffect, useRef, useState } from "react";
import { Compass, BarChart4, ChevronUp, ChevronDown, Play, Pause, Clock } from "lucide-react";
import { DailyForecast, HourlyForecast } from "../types";

interface WindChartProps {
  forecastDays: DailyForecast[];
  hourly?: HourlyForecast[];
  isDark: boolean;
}

export default function WindChart({ forecastDays, hourly = [], isDark }: WindChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [activeHour, setActiveHour] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play animation loop for hours
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveHour((prev) => (prev + 1) % 24);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Compass directions helper
  const getWindDirectionText = (deg: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
    return directions[Math.round(deg / 22.5) % 16];
  };

  // Beaufort colors
  const getBeaufortColor = (speedKmh: number) => {
    if (speedKmh < 2) return "#10B981"; // G0
    if (speedKmh < 19) return "#84CC16"; // G1-G3
    if (speedKmh < 50) return "#EAB308"; // G4-G6
    if (speedKmh < 88) return "#EF4444"; // G7-G9
    return "#A855F7"; // G10-G12
  };

  // Trigger growing animation on load/data update
  useEffect(() => {
    setProgress(0);
    let start: number | null = null;
    const duration = 800; // ms

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const currentProgress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuad)
      const easedProgress = currentProgress * (2 - currentProgress);
      setProgress(easedProgress);

      if (currentProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [forecastDays]);

  // Handle Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !forecastDays.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas sizes and device scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 280 * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = 280;

    // Clear and background fill
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = isDark ? "#111111" : "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
    ctx.lineWidth = 1;
    const gridRows = 4;
    for (let r = 0; r <= gridRows; r++) {
      const y = 50 + (r * (h - 100)) / gridRows;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();

      // Labels on Y-axis
      ctx.fillStyle = isDark ? "#888888" : "#666666";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      const maxSpeed = Math.max(...forecastDays.map((d) => d.wind_avg), 1);
      const labelVal = Math.round(maxSpeed - (r * maxSpeed) / gridRows);
      ctx.fillText(`${labelVal} km/h`, 30, 50 + (r * (h - 100)) / gridRows + 3);
    }

    // Graph drawing dimensions
    const maxWind = Math.max(...forecastDays.map((d) => d.wind_avg), 1);
    const chartW = w - 60;
    const barSpacing = chartW / forecastDays.length;
    const barWidth = barSpacing * 0.55;
    const startX = 45;
    const baseY = h - 50;

    // Loop to draw daily columns and circular compass needle overlays
    forecastDays.forEach((day, i) => {
      const x = startX + i * barSpacing + barSpacing * 0.22;
      const barHeight = ((day.wind_avg / maxWind) * (h - 110)) * progress;
      const y = baseY - barHeight;

      // Beaufort-coded gradient color
      const color = getBeaufortColor(day.wind_avg);
      const isHovered = hoverIndex === i;

      // Draw Bar Column
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = isHovered ? 1.0 : 0.8;
      
      // Rounded bar top
      const radius = Math.min(barWidth / 2, 6);
      ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Label values on columns
      if (day.wind_avg > 0 && progress > 0.4) {
        ctx.fillStyle = isDark ? "#ffffff" : "#1F1B16";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(day.wind_avg)}`, x + barWidth / 2, y - 5);
      }

      // Draw Date Labels on bottom
      ctx.fillStyle = isDark ? "#888888" : "#7E7667";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      const dateLabel = new Date(day.date + "T12:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      ctx.fillText(dateLabel, x + barWidth / 2, baseY + 15);

      // Draw wind direction mini-compass indicator at the base/top
      const compassY = baseY + 32;
      const compassX = x + barWidth / 2;
      const compassRadius = 10;

      // Compass circle outer outline
      ctx.beginPath();
      ctx.arc(compassX, compassY, compassRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isDark ? "#1E1E1E" : "#F4F0E6";
      ctx.fill();
      ctx.strokeStyle = isDark ? "#444444" : "#E7E1D1";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Needle points to where the wind is going (rotated 180 deg)
      const angleRad = ((day.wind_deg_common + 180) % 360) * (Math.PI / 180);
      const lineLength = 7;
      
      ctx.beginPath();
      ctx.moveTo(compassX, compassY);
      ctx.lineTo(compassX + Math.cos(angleRad) * lineLength, compassY + Math.sin(angleRad) * lineLength);
      ctx.strokeStyle = "#E2725B"; // Terracotta pointer
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrow head for needle
      ctx.beginPath();
      ctx.arc(compassX + Math.cos(angleRad) * lineLength, compassY + Math.sin(angleRad) * lineLength, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#E2725B";
      ctx.fill();

      // Compass Text code below circle
      ctx.fillStyle = isDark ? "#bbbbbb" : "#1F1B16";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText(getWindDirectionText(day.wind_deg_common), compassX, compassY + 16);
    });
  }, [forecastDays, progress, hoverIndex, isDark]);

  // Handle pointer hover interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !forecastDays.length) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Reverse-calculate index
    const chartW = rect.width - 60;
    const barSpacing = chartW / forecastDays.length;
    const startX = 45;

    const index = Math.floor((x - startX) / barSpacing);
    if (index >= 0 && index < forecastDays.length) {
      setHoverIndex(index);
    } else {
      setHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredDay = hoverIndex !== null ? forecastDays[hoverIndex] : null;

  return (
    <div
      ref={containerRef}
      className={`rounded-[32px] p-6 border transition-all duration-300 shadow-sm ${
        isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-[#E2725B]/10 text-[#E2725B]">
            <BarChart4 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#1F1B16] dark:text-white">
              Gráfico Interativo de Ventos
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Previsão de 16 dias com velocidades em km/h e agulhas indicadoras de direção
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsControlsExpanded(!isControlsExpanded)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-extrabold text-xs transition-all shadow-sm border self-start sm:self-auto ${
            isControlsExpanded
              ? "bg-amber-500 text-slate-950 border-amber-400"
              : isDark
              ? "bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700"
              : "bg-stone-100 text-[#1F1B16] border-stone-300 hover:bg-stone-200"
          }`}
        >
          <span>{isControlsExpanded ? "Ocultar Controles" : "Expandir Controles (Por Hora)"}</span>
          {isControlsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="relative w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-[280px] cursor-crosshair block"
        />

        {/* Floating tooltip overlay for hovered day */}
        {hoveredDay && (
          <div
            className={`absolute top-12 left-1/2 -translate-x-1/2 rounded-xl p-3 border shadow-md flex flex-col gap-1 z-10 text-xs pointer-events-none transition-all ${
              isDark ? "bg-[#1E1E1E]/95 border-[#333] text-white" : "bg-white/95 border-[#E7E1D1] text-[#1F1B16]"
            }`}
          >
            <p className="font-extrabold text-[#6E5D0E] dark:text-[#EAB308]">
              {new Date(hoveredDay.date + "T12:00").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <p className="font-semibold">
              💨 Velocidade Média: <span className="font-extrabold">{hoveredDay.wind_avg.toFixed(1)} km/h</span>
            </p>
            <p className="font-semibold">
              ⚡ Rajada Máxima: <span className="font-extrabold">{hoveredDay.wind_gust_max.toFixed(1)} km/h</span>
            </p>
            <p className="font-semibold">
              🧭 Direção Predominante:{" "}
              <span className="font-extrabold text-[#E2725B]">
                {getWindDirectionText(hoveredDay.wind_deg_common)} ({hoveredDay.wind_deg_common}°)
              </span>
            </p>
            <p className="font-semibold leading-tight text-[10px] text-gray-500 mt-1 italic max-w-[200px]">
              {hoveredDay.main_desc}
            </p>
          </div>
        )}
      </div>

      {/* EXPANDED HOURLY SIMULATION CONTROLS */}
      {isControlsExpanded && (
        <div
          className={`mt-4 p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
            isDark ? "bg-[#181818] border-zinc-800 text-white" : "bg-[#FDFCFB] border-[#E7E1D1] text-[#1F1B16]"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800/10 dark:border-zinc-800/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 font-bold text-xs uppercase flex items-center gap-1">
                ⏱️ {String(activeHour).padStart(2, "0")}:00 h
              </span>
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wide">
                  Simulador de Vento Hora a Hora
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Arraste o slider para analisar a variação contínua de rajadas
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                isPlaying
                  ? "bg-amber-500 text-slate-950"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Pausar Loop" : "Reproduzir Animação"}</span>
            </button>
          </div>

          {/* Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[8px] font-bold text-zinc-500 dark:text-zinc-400 px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={activeHour}
              onChange={(e) => {
                setActiveHour(parseInt(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#E2725B] bg-zinc-200 dark:bg-zinc-800 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
