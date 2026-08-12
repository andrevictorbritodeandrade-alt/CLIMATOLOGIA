import React from "react";
import { WeatherData, HourlyForecast } from "../types";

interface DynamicWeatherBackgroundProps {
  weather: WeatherData | null;
  cityName: string;
  isDark: boolean;
  selectedHourlyData?: HourlyForecast | null;
  activeHourIndex?: number;
  activeDayIndex?: number;
}

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
      ? "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2000&q=80" // Dark starry clear night
      : "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80"; // Vibrant bright sunny blue sky
  }

  // Weather Code 1: Mainly Clear / Partly Cloudy / Parcialmente Nublado
  if (code === 1) {
    return isNight
      ? "https://images.unsplash.com/photo-1532978379173-523e16f371f2?auto=format&fit=crop&w=2000&q=80" // Moon & clouds starry night
      : "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=2000&q=80"; // Daytime partly cloudy with blue sky
  }

  // Weather Code 2 & 3: Cloudy / Overcast / Nublado / Encoberto
  if (code === 2 || code === 3) {
    return isNight
      ? "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=2000&q=80" // Night dark heavy clouds
      : "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=2000&q=80"; // Daytime clouds with soft daylight
  }

  // Weather Code 45 & 48: Fog / Nevoeiro
  if (code === 45 || code === 48) {
    return isNight
      ? "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=2000&q=80" // Dark moody night fog
      : "https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=2000&q=80"; // Daytime misty fog
  }

  // Weather Codes 51-65 & 80-82: Drizzle / Rain / Showers / Chuva
  if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) {
    return isNight
      ? "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=2000&q=80" // Dark rainy night
      : "https://images.unsplash.com/photo-1519692938311-b8ae53248370?auto=format&fit=crop&w=2000&q=80"; // Daytime rain drops
  }

  // Weather Codes 71-75: Snow / Neve
  if (code >= 71 && code <= 75) {
    return isNight
      ? "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=2000&q=80" // Night snow
      : "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=2000&q=80"; // Day snow
  }

  // Weather Codes 95-99: Thunderstorms / Trovoadas
  if (code >= 95) {
    return isNight
      ? "https://images.unsplash.com/photo-1472120489100-d03f7e0477b9?auto=format&fit=crop&w=2000&q=80" // Night lightning storm
      : "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=2000&q=80"; // Day storm sky
  }

  return isNight
    ? "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2000&q=80"
    : "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80";
};

export default function DynamicWeatherBackground({
  weather,
  cityName,
  isDark,
  selectedHourlyData,
  activeHourIndex,
  activeDayIndex,
}: DynamicWeatherBackgroundProps) {
  // Determine current active hour and date either from timeline simulation or live clock
  const currentHourlyData = selectedHourlyData || (
    weather?.hourly && activeHourIndex !== undefined
      ? weather.hourly[(activeDayIndex || 0) * 24 + activeHourIndex]
      : null
  );

  const effectiveTime = currentHourlyData?.time
    ? new Date(currentHourlyData.time)
    : new Date();

  // Weather Code logic
  const weatherCode = currentHourlyData?.weatherCode ?? weather?.current?.weatherCode ?? 0;
  
  const bgUrl = getWeatherBgImage(weatherCode, effectiveTime);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden transition-all duration-1000 z-0 bg-[#000000]">
      {/* Base background image with a smooth crossfade effect if it changes */}
      <img
        key={bgUrl} // Forces re-render and fade in when the URL changes
        src={bgUrl}
        alt={`Clima em ${cityName}`}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-[1500ms] animate-in fade-in zoom-in-95"
        referrerPolicy="no-referrer"
      />
      {/* Advanced Overlay Scrims for Readability and Mood */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${isDark ? 'bg-zinc-950/70' : 'bg-slate-900/40'}`} />
      {/* Secondary gradient to make the bottom dark for footer UI elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
    </div>
  );
}
