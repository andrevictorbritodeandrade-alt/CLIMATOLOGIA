import React, { useState, useEffect, useRef } from "react";
import { DailyForecast, CurrentWeather } from "../types";
import {
  Waves,
  ShieldAlert,
  Wind,
  Thermometer,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Navigation,
  Compass,
} from "lucide-react";

interface BeachSeaCardProps {
  locationName: string;
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  daily: DailyForecast[];
  activeDayIndex: number;
  setActiveDayIndex: (index: number) => void;
  isDark: boolean;
}

export interface BeachSpot {
  id: string;
  name: string;
  distanceKm: number;
  type: string; // e.g. "Praia Urbana", "Mar Aberto", "Enseada Calma", "Surf spot"
  baseWaterTemp: number; // base sea temp
}

export default function BeachSeaCard({
  locationName,
  latitude,
  longitude,
  current,
  daily,
  activeDayIndex,
  setActiveDayIndex,
  isDark,
}: BeachSeaCardProps) {
  // Initial fallback beach spot
  const fallbackBeach: BeachSpot = {
    id: "default",
    name: `Praia de ${locationName || "Orla"}`,
    distanceKm: 1.0,
    type: "Praia Urbana",
    baseWaterTemp: 22.5,
  };

  // Generate catalog of nearby beaches based on active location name / coordinates
  const [beaches, setBeaches] = useState<BeachSpot[]>(() =>
    generateNearbyBeaches(locationName || "Orla", latitude || 0, longitude || 0)
  );

  useEffect(() => {
    const catalog = generateNearbyBeaches(locationName, latitude, longitude);
    setBeaches(catalog);
  }, [locationName, latitude, longitude]);

  // Haversine formula to compute GPS distance between 2 coordinates in km
  function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(Math.max(0, Math.min(1, a))), Math.sqrt(Math.max(0, Math.min(1, 1 - a))));
    return R * c;
  }

  // Helper to catalog beaches around Brazilian or global locations and sort by GPS distance
  function generateNearbyBeaches(name: string, lat: number, lon: number): BeachSpot[] {
    const locLower = name.toLowerCase();

    type BeachWithCoords = BeachSpot & { lat: number; lon: number };
    let rawBeaches: BeachWithCoords[] = [];

    // Maricá / Jacaroá / Itaipuaçu / Saquarema region
    if (locLower.includes("maricá") || locLower.includes("jacaroá") || locLower.includes("itaipuaçu") || locLower.includes("saquarema")) {
      rawBeaches = [
        { id: "barra_marica", name: "Praia da Barra de Maricá", distanceKm: 0, type: "Mar Aberto / Tombo", baseWaterTemp: 22.0, lat: -22.961, lon: -42.822 },
        { id: "cordeirinho", name: "Praia de Cordeirinho", distanceKm: 0, type: "Mar Aberto", baseWaterTemp: 22.1, lat: -22.956, lon: -42.756 },
        { id: "ponta_negra_marica", name: "Praia de Ponta Negra (Maricá)", distanceKm: 0, type: "Farol e Surf", baseWaterTemp: 22.2, lat: -22.963, lon: -42.686 },
        { id: "itaipuacu", name: "Praia de Itaipuaçu", distanceKm: 0, type: "Mar de Tombo / Orla", baseWaterTemp: 21.9, lat: -22.972, lon: -42.925 },
        { id: "jacone", name: "Praia de Jaconé", distanceKm: 0, type: "Mar Aberto / Preservada", baseWaterTemp: 22.3, lat: -22.946, lon: -42.622 },
      ];
    }
    // Rio de Janeiro city region / Niterói
    else if (locLower.includes("rio de janeiro") || locLower.includes("niterói")) {
      rawBeaches = [
        { id: "copacabana", name: "Praia de Copacabana", distanceKm: 0, type: "Enseada Calma", baseWaterTemp: 22.5, lat: -22.971, lon: -43.182 },
        { id: "ipanema", name: "Praia de Ipanema (Posto 9)", distanceKm: 0, type: "Mar Aberto / Tombo", baseWaterTemp: 22.0, lat: -22.986, lon: -43.200 },
        { id: "barra", name: "Praia da Barra da Tijuca", distanceKm: 0, type: "Mar Aberto / Ondas", baseWaterTemp: 21.8, lat: -23.012, lon: -43.305 },
        { id: "leblon", name: "Praia do Leblon", distanceKm: 0, type: "Posto 12", baseWaterTemp: 22.2, lat: -22.988, lon: -43.220 },
        { id: "vermelha", name: "Praia Vermelha (Urca)", distanceKm: 0, type: "Águas Raso / Protegida", baseWaterTemp: 23.0, lat: -22.955, lon: -43.164 },
        { id: "arpoador", name: "Praia do Arpoador", distanceKm: 0, type: "Surf / Pôr do Sol", baseWaterTemp: 22.1, lat: -22.989, lon: -43.191 },
      ];
    }
    // Florianópolis / SC
    else if (locLower.includes("florianópolis") || locLower.includes("floripa") || locLower.includes("santa catarina")) {
      rawBeaches = [
        { id: "jurere", name: "Jurerê Internacional", distanceKm: 0, type: "Águas Calmas", baseWaterTemp: 21.5, lat: -27.438, lon: -48.498 },
        { id: "joaquina", name: "Praia da Joaquina", distanceKm: 0, type: "Mar Aberto / Surf", baseWaterTemp: 20.5, lat: -27.629, lon: -48.448 },
        { id: "mole", name: "Praia Mole", distanceKm: 0, type: "Ondas Fortes / Tombo", baseWaterTemp: 20.8, lat: -27.603, lon: -48.433 },
        { id: "canasvieiras", name: "Praia de Canasvieiras", distanceKm: 0, type: "Água Morna e Calma", baseWaterTemp: 22.0, lat: -27.428, lon: -48.464 },
        { id: "campeche", name: "Praia do Campeche", distanceKm: 0, type: "Mar Aberto", baseWaterTemp: 20.2, lat: -27.674, lon: -48.483 },
      ];
    }
    // Salvador / BA
    else if (locLower.includes("salvador") || locLower.includes("bahia") || locLower.includes("lauro de freitas")) {
      rawBeaches = [
        { id: "porto_barra", name: "Porto da Barra", distanceKm: 0, type: "Piscina Natural", baseWaterTemp: 27.2, lat: -13.004, lon: -38.532 },
        { id: "farol_barra", name: "Farol da Barra", distanceKm: 0, type: "Piscina com Corais", baseWaterTemp: 27.0, lat: -13.010, lon: -38.532 },
        { id: "itapua", name: "Praia de Itapuã", distanceKm: 0, type: "Coqueirais / Recifes", baseWaterTemp: 26.8, lat: -12.951, lon: -38.362 },
        { id: "stella", name: "Stella Maris", distanceKm: 0, type: "Piscinas Naturais / Surf", baseWaterTemp: 26.5, lat: -12.943, lon: -38.337 },
        { id: "buracao", name: "Praia do Buracão (Rio Vermelho)", distanceKm: 0, type: "Mar Aberto", baseWaterTemp: 26.9, lat: -13.015, lon: -38.489 },
      ];
    }
    // Recife / PE / Olinda
    else if (locLower.includes("recife") || locLower.includes("olinda") || locLower.includes("jaboatão") || locLower.includes("porto de galinhas")) {
      rawBeaches = [
        { id: "boa_viagem", name: "Praia de Boa Viagem", distanceKm: 0, type: "Protegida por Recifes", baseWaterTemp: 27.5, lat: -8.125, lon: -34.896 },
        { id: "pina", name: "Praia do Pina", distanceKm: 0, type: "Urbana", baseWaterTemp: 27.2, lat: -8.089, lon: -34.882 },
        { id: "porto_galinhas", name: "Porto de Galinhas", distanceKm: 0, type: "Piscinas Naturais", baseWaterTemp: 28.0, lat: -8.508, lon: -35.000 },
        { id: "carneiros", name: "Praia dos Carneiros", distanceKm: 0, type: "Águas Cristalinas", baseWaterTemp: 28.2, lat: -8.706, lon: -35.076 },
      ];
    }
    // São Paulo / Litoral Paulista
    else if (locLower.includes("santos") || locLower.includes("guarujá") || locLower.includes("são sebastião") || locLower.includes("ubatuba") || locLower.includes("praia grande") || locLower.includes("são paulo")) {
      rawBeaches = [
        { id: "gonzaga", name: "Praia do Gonzaga (Santos)", distanceKm: 0, type: "Enseada Urbana", baseWaterTemp: 22.8, lat: -23.968, lon: -46.332 },
        { id: "enseada_guaruja", name: "Praia da Enseada (Guarujá)", distanceKm: 0, type: "Água Rasa / Familiar", baseWaterTemp: 22.5, lat: -23.978, lon: -46.223 },
        { id: "pitangueiras", name: "Praia das Pitangueiras (Guarujá)", distanceKm: 0, type: "Mar Aberto", baseWaterTemp: 22.6, lat: -23.998, lon: -46.257 },
        { id: "maresias", name: "Praia de Maresias (São Sebastião)", distanceKm: 0, type: "Surf / Tombo", baseWaterTemp: 22.0, lat: -23.792, lon: -45.558 },
        { id: "itamambuca", name: "Itamambuca (Ubatuba)", distanceKm: 0, type: "Preservada / Surf", baseWaterTemp: 22.2, lat: -23.398, lon: -45.006 },
      ];
    }
    // Fortaleza / Ceará
    else if (locLower.includes("fortaleza") || locLower.includes("ceará") || locLower.includes("caucaia")) {
      rawBeaches = [
        { id: "futuro", name: "Praia do Futuro", distanceKm: 0, type: "Ondas e Ventos / Barracas", baseWaterTemp: 27.8, lat: -3.738, lon: -38.455 },
        { id: "iracema", name: "Praia de Iracema", distanceKm: 0, type: "Orla Urbana", baseWaterTemp: 27.6, lat: -3.721, lon: -38.513 },
        { id: "meireles", name: "Praia do Meireles", distanceKm: 0, type: "Águas Calmas", baseWaterTemp: 27.7, lat: -3.725, lon: -38.497 },
        { id: "cumbuco", name: "Praia do Cumbuco", distanceKm: 0, type: "Kitesurf / Dunas", baseWaterTemp: 27.5, lat: -3.619, lon: -38.730 },
      ];
    }
    // Vitória / Vila Velha
    else if (locLower.includes("vitória") || locLower.includes("vila velha") || locLower.includes("espírito santo")) {
      rawBeaches = [
        { id: "praia_costa", name: "Praia da Costa (Vila Velha)", distanceKm: 0, type: "Água Limpa / Familiar", baseWaterTemp: 24.2, lat: -20.334, lon: -40.287 },
        { id: "camburi", name: "Praia de Camburi (Vitória)", distanceKm: 0, type: "Orla Urbana / Esportes", baseWaterTemp: 24.0, lat: -20.278, lon: -40.291 },
        { id: "jurema", name: "Curva da Jurema", distanceKm: 0, type: "Águas Calmas / Enseada", baseWaterTemp: 24.5, lat: -20.312, lon: -40.291 },
      ];
    }
    // Natal / RN
    else if (locLower.includes("natal") || locLower.includes("rio grande do norte") || locLower.includes("pipa")) {
      rawBeaches = [
        { id: "ponta_negra", name: "Praia de Ponta Negra", distanceKm: 0, type: "Morro do Careca", baseWaterTemp: 27.2, lat: -5.885, lon: -35.170 },
        { id: "pipa", name: "Praia do Amor (Pipa)", distanceKm: 0, type: "Falésias e Golfinhos", baseWaterTemp: 27.5, lat: -6.228, lon: -35.048 },
        { id: "genipabu", name: "Praia de Genipabu", distanceKm: 0, type: "Dunas e Lagoas", baseWaterTemp: 27.1, lat: -5.700, lon: -35.197 },
      ];
    }
    // Generic fallback for any other location
    else {
      const isTropical = Math.abs(lat) < 23.5;
      const baseTemp = isTropical ? 26.5 - Math.abs(lat) * 0.15 : 21.0 - (Math.abs(lat) - 23.5) * 0.4;
      const roundedTemp = Math.max(16, Math.min(29, Number(baseTemp.toFixed(1))));
      rawBeaches = [
        { id: "p1", name: `Praia de ${name}`, distanceKm: 0, type: "Orla Principal", baseWaterTemp: roundedTemp, lat: lat || -22.9, lon: lon || -43.1 },
        { id: "p2", name: `Enseada das Conchas (${name})`, distanceKm: 0, type: "Águas Calmas", baseWaterTemp: roundedTemp + 0.5, lat: (lat || -22.9) + 0.03, lon: (lon || -43.1) + 0.03 },
        { id: "p3", name: `Praia do Faroeste`, distanceKm: 0, type: "Mar Aberto / Surf", baseWaterTemp: roundedTemp - 0.3, lat: (lat || -22.9) + 0.07, lon: (lon || -43.1) + 0.05 },
      ];
    }

    // Calculate exact GPS Haversine distance and sort ascending so index 0 is ALWAYS the closest beach
    if (lat !== 0 && lon !== 0) {
      return rawBeaches
        .map((b) => {
          const dist = calculateHaversineDistance(lat, lon, b.lat, b.lon);
          return {
            id: b.id,
            name: b.name,
            distanceKm: Number(dist.toFixed(1)),
            type: b.type,
            baseWaterTemp: b.baseWaterTemp,
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return rawBeaches.map(({ lat: _, lon: __, ...rest }, idx) => ({
      ...rest,
      distanceKm: Number((1.5 + idx * 3.5).toFixed(1)),
    }));
  }

  // Always select the first beach (closest to GPS) unless user selects another
  const [selectedBeachId, setSelectedBeachId] = useState<string | null>(null);
  
  useEffect(() => {
    if (beaches.length > 0 && !selectedBeachId) {
      setSelectedBeachId(beaches[0].id);
    }
  }, [beaches]);

  const selectedBeach = beaches.find(b => b.id === selectedBeachId) || beaches[0] || fallbackBeach;

  // Helper to calculate daily sea condition metrics for a specific beach and day index
  function getSeaMetricsForDay(dayIndex: number, beach?: BeachSpot) {
    const activeBeach = beach || selectedBeach || fallbackBeach;

    const dayData = daily[dayIndex] || daily[0] || {
      date: new Date().toISOString().split("T")[0],
      wind_avg: current.windSpeed,
      rain_mm: 0,
      weatherCode: 0,
      temp_max: current.temp_max,
    };

    const windSpeed = dayData.wind_avg;
    const rainMm = dayData.rain_mm;

    // Estimate Water Temperature (°C)
    // Adjust base temp slightly based on ambient air max temp vs typical 25°C
    const tempDelta = (dayData.temp_max - 25) * 0.15;
    const waterTemp = Math.max(15, Math.min(30, Number(((activeBeach.baseWaterTemp ?? 22.5) + tempDelta).toFixed(1))));

    // Estimate Wave Height (m) based on wind speed & beach type
    let baseWave = windSpeed * 0.045; // e.g. 20 km/h -> ~0.9m
    const bType = activeBeach.type || "";
    if (bType.includes("Calma") || bType.includes("Protegida")) {
      baseWave *= 0.55;
    } else if (bType.includes("Surf") || bType.includes("Tombo") || bType.includes("Aberto")) {
      baseWave *= 1.35;
    }
    const waveHeight = Math.max(0.3, Math.min(3.8, Number(baseWave.toFixed(1))));

    // Determine Safety Flag Color & Condition Rating
    // Flag hierarchy:
    // Roxa/Preta: Storm / Heavy rainfall (> 30mm) / Severe waves (> 2.5m) or gale force winds (> 50 km/h)
    // Vermelha: Waves > 1.5m, wind > 30 km/h, rain > 10mm, high rip current danger
    // Amarela: Waves 0.8m - 1.5m, wind 18 - 30 km/h, caution required
    // Verde: Waves < 0.8m, wind < 18 km/h, rain < 2mm, calm sea, ideal bathing
    let flagColor: "green" | "yellow" | "red" | "purple" = "green";
    let flagTitle = "BANDEIRA VERDE";
    let statusText = "EXCELENTE PARA BANHO DE MAR";
    let statusDesc = "Mar calmo, ondas suaves e água límpida. Ideal para famílias e banhistas.";
    let bgGradient = "from-emerald-500/10 to-teal-500/5 border-emerald-500/30 text-emerald-900 dark:text-emerald-100";
    let flagBadgeClass = "bg-emerald-500 text-white shadow-emerald-500/20";

    if (rainMm > 25 || waveHeight >= 2.5 || windSpeed >= 48) {
      flagColor = "purple";
      flagTitle = "BANDEIRA ROXA / PRETA";
      statusText = "RISCO EXTREMO / RESSACA SEVERA";
      statusDesc = "Tempestades, mar extremamente agitado ou risco elétrico. PROIBIDO O BANHO DE MAR.";
      bgGradient = "from-purple-950/20 to-slate-900/20 border-purple-500/40 text-purple-900 dark:text-purple-200";
      flagBadgeClass = "bg-purple-600 text-white shadow-purple-500/20";
    } else if (waveHeight >= 1.5 || windSpeed >= 32 || rainMm >= 10) {
      flagColor = "red";
      flagTitle = "BANDEIRA VERMELHA";
      statusText = "PERIGO / CORRENTEZA E ONDAS FORTES";
      statusDesc = "Ondas altas, valas profundas ou correntezas de retorno. Evite entrar no mar.";
      bgGradient = "from-rose-500/10 to-red-600/5 border-rose-500/30 text-rose-900 dark:text-rose-100";
      flagBadgeClass = "bg-rose-600 text-white shadow-rose-500/20";
    } else if (waveHeight >= 0.8 || windSpeed >= 18 || rainMm >= 3) {
      flagColor = "yellow";
      flagTitle = "BANDEIRA AMARELA";
      statusText = "ATENÇÃO / MAR MODERADO";
      statusDesc = "Mar com ondulação e repuxo moderados. Mantenha os pés no chão e atenção às crianças.";
      bgGradient = "from-amber-500/10 to-yellow-600/5 border-amber-500/30 text-amber-900 dark:text-amber-100";
      flagBadgeClass = "bg-amber-500 text-slate-950 shadow-amber-500/20";
    }

    // Best time for bathing recommendation
    let bestTime = "08:00 - 11:30";
    if (dayIndex % 2 === 1) bestTime = "07:30 - 11:00 e 16:00 - 17:30";

    return {
      waterTemp,
      waveHeight,
      flagColor,
      flagTitle,
      statusText,
      statusDesc,
      bgGradient,
      flagBadgeClass,
      bestTime,
      windSpeed,
      rainMm,
      dateStr: dayData.date,
    };
  }

  const activeMetrics = selectedBeach
    ? getSeaMetricsForDay(activeDayIndex, selectedBeach)
    : getSeaMetricsForDay(0, beaches[0]);

  const [show16Days, setShow16Days] = useState(false);
  const seaScrollRef = useRef<HTMLDivElement>(null);

  const scrollSeaLeft = () => {
    if (seaScrollRef.current) {
      seaScrollRef.current.scrollBy({ left: -250, behavior: "smooth" });
    }
  };

  const scrollSeaRight = () => {
    if (seaScrollRef.current) {
      seaScrollRef.current.scrollBy({ left: 250, behavior: "smooth" });
    }
  };

  return (
    <div
      id="sea-conditions-card"
      className={`rounded-[32px] p-5 sm:p-6 border transition-all duration-300 shadow-xl relative overflow-hidden ${
        isDark ? "border-cyan-900/50 text-white" : "border-cyan-300/60 text-[#1F1B16]"
      }`}
    >
      {/* Beach & Sea Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none scale-105 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80')`,
        }}
      />
      {/* Soft gradient overlay for optimal legibility */}
      <div
        className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
          isDark
            ? "bg-gradient-to-b from-[#0C1520]/95 via-[#0D1B2A]/90 to-[#0A0F1A]/95 backdrop-blur-[1px]"
            : "bg-gradient-to-b from-white/95 via-sky-50/85 to-cyan-50/95 backdrop-blur-[1px]"
        }`}
      />

      <div className="relative z-10">
        {/* Header section with Icon & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-zinc-800/10 dark:border-zinc-800/30 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight uppercase">
                  Temperatura do Mar & Balneabilidade
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  16 Dias
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Exibindo a praia mais próxima à sua localização atual
              </p>
            </div>
          </div>

          {/* Selected Day Indicator */}
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1.5 px-3 rounded-2xl border border-zinc-800/10 dark:border-zinc-800/20 shrink-0">
            <span className="text-[11px] font-extrabold uppercase text-amber-600 dark:text-amber-400">
              📅 {new Date((daily[activeDayIndex]?.date || new Date().toISOString().split("T")[0]) + "T12:00").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>

        {/* Selected Beach Highlight Info (Simplified since it's automatic) */}
        <div className="mb-6 flex items-center justify-between bg-black/10 dark:bg-white/5 p-4 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <Navigation className="w-5 h-5 text-cyan-500 fill-cyan-500/20" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black opacity-60 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> {selectedBeach.type} • {selectedBeach.distanceKm.toFixed(1)} km de distância
              </p>
              <h3 className="text-xl font-black tracking-tight text-cyan-600 dark:text-cyan-300 leading-none mt-0.5">
                {selectedBeach.name}
              </h3>
            </div>
          </div>
          <div className="px-3 py-1 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
            Mais Próxima
          </div>
        </div>

        {/* Main Hero Card for Selected Beach and Active Day */}
        {selectedBeach && (
          <div
            className={`rounded-3xl p-5 border shadow-lg mb-6 transition-all duration-300 bg-gradient-to-br ${activeMetrics.bgGradient}`}
          >
            {/* Top Header: Beach Name & Safety Flag */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-black/10 dark:border-white/10 pb-4">
              <div>
                <h4 className="text-xl sm:text-2xl font-black tracking-tight">
                  Status de Segurança
                </h4>
              </div>

            {/* Safety Flag Banner */}
            <div className="flex items-center gap-2.5">
              <div
                className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg ${activeMetrics.flagBadgeClass}`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{activeMetrics.flagTitle}</span>
              </div>
            </div>
          </div>

          {/* Primary Metrics Grid: Water Temp, Waves, Bathing Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {/* 1. Sea Water Temperature */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-extrabold opacity-80 mb-2">
                <span className="uppercase tracking-wider flex items-center gap-1">
                  <Thermometer className="w-4 h-4 text-cyan-500" /> Temp. da Água
                </span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full font-black">
                  {activeMetrics.waterTemp >= 24 ? "☀️ Agradável" : "🧊 Fresta"}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight text-cyan-600 dark:text-cyan-300">
                  {activeMetrics.waterTemp}°
                </span>
                <span className="text-lg font-black text-cyan-500">C</span>
              </div>
              <p className="text-[10px] opacity-75 mt-1 leading-snug">
                Sensação térmica na água estimada para esta enseada
              </p>
            </div>

            {/* 2. Wave Height & Swell */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-extrabold opacity-80 mb-2">
                <span className="uppercase tracking-wider flex items-center gap-1">
                  <Waves className="w-4 h-4 text-blue-500" /> Altura das Ondas
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-black">
                  {activeMetrics.waveHeight >= 1.5 ? "🌊 Agitado" : "🏊 Calmo"}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight text-blue-600 dark:text-blue-300">
                  {activeMetrics.waveHeight}
                </span>
                <span className="text-lg font-black text-blue-500">metros</span>
              </div>
              <p className="text-[10px] opacity-75 mt-1 leading-snug">
                Período estimado: 8s - 10s • Vento: {Math.round(activeMetrics.windSpeed)} km/h
              </p>
            </div>

            {/* 3. Condition Rating */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-extrabold opacity-80 mb-2">
                <span className="uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Balneabilidade
                </span>
              </div>
              <div>
                <span className="text-sm font-black uppercase tracking-tight block leading-tight">
                  {activeMetrics.statusText}
                </span>
                <p className="text-[11px] opacity-80 mt-1 leading-tight">{activeMetrics.statusDesc}</p>
              </div>
              <div className="mt-2 text-[10px] font-extrabold opacity-75 flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-500" /> Melhor Horário: {activeMetrics.bestTime}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button for 16-Day Forecast */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShow16Days(!show16Days)}
            className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
              isDark
                ? "bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border-zinc-700"
                : "bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200"
            }`}
          >
            <Waves className="w-4 h-4 text-cyan-500" />
            <span>{show16Days ? "Ocultar Previsão do Mar" : "Expandir / Ver Previsão do Mar (16 Dias)"}</span>
            {show16Days ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* RESTORING: Other Nearby Beaches List (The user asked "CADE O RESTANTE") */}
        <div className="border-t border-black/5 dark:border-white/5 pt-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Outras Praias na Região de {locationName || "Maricá"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {beaches.map((b) => {
              const isSelected = b.id === selectedBeach.id;
              const bMetrics = getSeaMetricsForDay(activeDayIndex, b);
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBeachId(b.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20"
                      : isDark
                      ? "bg-black/20 border-zinc-800 hover:border-zinc-700"
                      : "bg-white border-[#E7E1D1] hover:border-cyan-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isSelected ? "bg-cyan-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black leading-tight text-zinc-800 dark:text-zinc-200">{b.name}</p>
                      <p className="text-[9px] font-bold opacity-60 uppercase">{b.type} • {b.distanceKm}km</p>
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    bMetrics.flagColor === 'green' ? 'bg-emerald-500' :
                    bMetrics.flagColor === 'yellow' ? 'bg-amber-500' :
                    bMetrics.flagColor === 'red' ? 'bg-red-500' : 'bg-purple-600'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 16-Day Sea Temperature & Safety Flags Forecast Bar (Shown when expanded) */}
      {show16Days && (
        <div className="mt-4 pt-4 border-t border-zinc-800/10 dark:border-zinc-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-500" />
              Previsão do Mar para os Próximos 16 Dias ({selectedBeach?.name}):
            </h4>

            {/* Navigation arrows & Active Day counter */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                Dia {activeDayIndex + 1} de {daily.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={scrollSeaLeft}
                  className={`p-1.5 rounded-xl border transition-all ${
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
                  onClick={scrollSeaRight}
                  className={`p-1.5 rounded-xl border transition-all ${
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

          <div className="relative group">
            {/* Side Arrow Buttons for quick navigation */}
            <button
              type="button"
              onClick={scrollSeaLeft}
              className={`absolute -left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full shadow-2xl border backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/90 text-cyan-400 border-zinc-700 hover:bg-zinc-800"
                  : "bg-white/90 text-cyan-700 border-cyan-200 hover:bg-cyan-50"
              }`}
              title="Voltar Dias"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={scrollSeaRight}
              className={`absolute -right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full shadow-2xl border backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/90 text-cyan-400 border-zinc-700 hover:bg-zinc-800"
                  : "bg-white/90 text-cyan-700 border-cyan-200 hover:bg-cyan-50"
              }`}
              title="Avançar Dias"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div
              ref={seaScrollRef}
              className="flex gap-2.5 overflow-x-auto pb-6 pt-5 px-6 snap-x scrollbar-thin scrollbar-thumb-zinc-700 scroll-smooth"
            >
              {daily.map((dayData, idx) => {
                const metrics = selectedBeach
                  ? getSeaMetricsForDay(idx, selectedBeach)
                  : getSeaMetricsForDay(idx, beaches[0]);

                const isActive = idx === activeDayIndex;

                return (
                  <button
                    key={dayData.date}
                    type="button"
                    onClick={() => setActiveDayIndex(idx)}
                    className={`min-w-[110px] snap-start rounded-2xl p-3 border text-center transition-all flex flex-col justify-between shrink-0 select-none relative ${
                      isActive
                        ? "bg-cyan-500/20 border-cyan-400 ring-[4px] ring-cyan-400/60 shadow-xl scale-110 -translate-y-1 z-10"
                        : isDark
                        ? "bg-[#161616] border-zinc-800 hover:bg-zinc-800"
                        : "bg-[#FDFCFB] border-[#E7E1D1] hover:bg-zinc-100"
                    }`}
                  >
                    {/* Active marker dot */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                      </span>
                    )}

                    <div>
                      <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 block leading-none">
                        {new Date(dayData.date + "T12:00").toLocaleDateString("pt-BR", { weekday: "short" })}
                      </span>
                      <span className="text-xs font-black block mt-0.5">
                        {new Date(dayData.date + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" })}
                      </span>
                    </div>

                    {/* Water Temp */}
                    <div className="my-2">
                      <div className="text-base font-black text-cyan-600 dark:text-cyan-300">
                        {metrics.waterTemp}°C
                      </div>
                      <div className="text-[9px] font-extrabold text-blue-500 flex items-center justify-center gap-0.5">
                        <Waves className="w-2.5 h-2.5" /> {metrics.waveHeight}m
                      </div>
                    </div>

                    {/* Flag color indicator */}
                    <div
                      className={`text-[9px] font-black uppercase py-1 px-1.5 rounded-xl text-center leading-none ${metrics.flagBadgeClass}`}
                    >
                      {metrics.flagColor === "green"
                        ? "🟢 Verde"
                        : metrics.flagColor === "yellow"
                        ? "🟡 Amarela"
                        : metrics.flagColor === "red"
                        ? "🔴 Vermelha"
                        : "🟣 Roxa"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
