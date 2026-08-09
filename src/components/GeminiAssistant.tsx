import React, { useEffect, useState } from "react";
import { Sparkles, Shirt, Compass, HeartPulse, AlertCircle, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CurrentWeather, DailyForecast, GeminiAnalysis } from "../types";

interface GeminiAssistantProps {
  locationName: string;
  current: CurrentWeather;
  dailyForecasts: DailyForecast[];
  isDark: boolean;
}

export default function GeminiAssistant({ locationName, current, dailyForecasts, isDark }: GeminiAssistantProps) {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger analysis update whenever city/current weather changes
  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    // Create a dense summary representation of the 16-day forecast to fit tokens perfectly
    const forecastOverview = dailyForecasts
      .slice(0, 5)
      .map((d) => `${d.date}: Máx ${Math.round(d.temp_max)}°C, Mín ${Math.round(d.temp_min)}°C, Vento ${Math.round(d.wind_avg)} km/h, Chuva ${d.rain_mm}mm (${d.main_desc})`)
      .join("; ");

    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: locationName,
          current: {
            temp: current.temp,
            humidity: current.humidity,
            windSpeed: current.windSpeed,
            windDir: current.windDir,
            pressure: current.pressure,
            description: current.description,
          },
          forecastOverview,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao comunicar com o servidor de IA.");
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error("Gemini API Client Error:", err);
      setError("Não foi possível gerar a análise inteligente neste momento. Tente atualizar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationName && current) {
      fetchAnalysis();
    }
  }, [locationName, current.temp, current.weatherCode]);

  return (
    <div
      id="gemini-assistant-card"
      className={`rounded-[32px] p-6 border transition-all duration-300 shadow-sm ${
        isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
      }`}
    >
      {/* Header and refresh toggler */}
      <div className="flex items-center justify-between gap-4 mb-5 border-b border-[#E7E1D1]/30 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-[#E2725B]/10 text-[#E2725B] dark:text-[#E2725B]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#1F1B16] dark:text-white">
              Assistente de Clima Gemini AI
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Análise inteligente de vestuário, atividades externas e recomendações de saúde em português
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={loading}
          className={`p-2 rounded-full transition-colors flex items-center justify-center border shadow-sm ${
            loading
              ? "animate-spin opacity-50"
              : isDark
              ? "bg-[#1E1E1E] border-[#333] hover:bg-[#2A2A2A] text-white"
              : "bg-[#FDFCFB] border-[#E7E1D1] hover:bg-[#F4F0E6] text-[#1F1B16]"
          }`}
          title="Atualizar Análise"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-[#F4F0E6] dark:bg-[#1C1C1C] rounded-lg w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-[#F4F0E6] dark:bg-[#1C1C1C] rounded-xl" />
            <div className="h-32 bg-[#F4F0E6] dark:bg-[#1C1C1C] rounded-xl" />
            <div className="h-32 bg-[#F4F0E6] dark:bg-[#1C1C1C] rounded-xl" />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Structured Results Display */}
      {analysis && !loading && (
        <div className="space-y-6">
          {/* Poetic Atmospheric Summary */}
          <div className={`rounded-2xl p-4 border ${isDark ? "bg-[#1A1813] border-[#3F330C]" : "bg-[#FDFBF7] border-[#E7E1D1]/60"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Resumo Atmosférico
              </p>
              {analysis._fallback && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Heurística Local Ativa
                </span>
              )}
            </div>
            <p className="text-sm font-semibold italic text-[#1F1B16] dark:text-gray-100 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
              "{analysis.summary}"
            </p>
          </div>

          {/* Core Insights Grid - Stacks on mobile, splits into 3 columns on tablet/landscape, and stacks vertically inside the sidebar on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {/* Clothing Recommendations */}
            <div
              className={`rounded-2xl p-4 border flex flex-col justify-between ${
                isDark ? "bg-[#161616] border-zinc-800" : "bg-[#FDFCFB] border-[#E7E1D1]/40"
              }`}
            >
              <div>
                <p className="text-xs text-[#E2725B] font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shirt className="w-4 h-4" />
                  Como se Vestir
                </p>
                <div className="text-xs leading-relaxed text-[#1F1B16] dark:text-zinc-300 font-medium text-justify" style={{ textAlign: "justify" }}>
                  <ReactMarkdown>{analysis.clothing}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Activities Suggestions */}
            <div
              className={`rounded-2xl p-4 border flex flex-col justify-between ${
                isDark ? "bg-[#161616] border-zinc-800" : "bg-[#FDFCFB] border-[#E7E1D1]/40"
              }`}
            >
              <div>
                <p className="text-xs text-[#6E5D0E] dark:text-[#EAB308] font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Atividades Recomendadas
                </p>
                <div className="text-xs leading-relaxed text-[#1F1B16] dark:text-zinc-300 font-medium text-justify" style={{ textAlign: "justify" }}>
                  <ReactMarkdown>{analysis.activities}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Health & Safety Alerts */}
            <div
              className={`rounded-2xl p-4 border flex flex-col justify-between ${
                isDark ? "bg-[#161616] border-zinc-800" : "bg-[#FDFCFB] border-[#E7E1D1]/40"
              }`}
            >
              <div>
                <p className="text-xs text-red-600 dark:text-red-400 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4" />
                  Alertas de Saúde & Bem-estar
                </p>
                <div className="text-xs leading-relaxed text-[#1F1B16] dark:text-zinc-300 font-medium text-justify" style={{ textAlign: "justify" }}>
                  <ReactMarkdown>{analysis.safetyAlerts}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
