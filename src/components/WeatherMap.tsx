import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plus, Minus, Crosshair, Play, Pause, Maximize2, Minimize2, Wind, CloudRain, Cloud, Compass, BookOpen, Layers, X, ChevronUp, ChevronDown } from "lucide-react";
import { CurrentWeather, HourlyForecast, DailyForecast } from "../types";
// @ts-ignore
import oceanMapUrl from "../assets/images/ocean_temperature_currents_map_1786040772059.jpg";

// Setup default marker icon issue in Leaflet + Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface WeatherMapProps {
  lat: number;
  lon: number;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  isDark: boolean;
  cityName: string;
  daily?: DailyForecast[];
  activeDayIndex?: number;
  setActiveDayIndex?: (index: number) => void;
}

export default function WeatherMap({
  lat,
  lon,
  current,
  hourly,
  isDark,
  cityName,
  daily = [],
  activeDayIndex = 0,
  setActiveDayIndex,
}: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isobarsLayerRef = useRef<L.LayerGroup | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  // States
  const [mapMode, setMapMode] = useState<"wind" | "radar" | "clouds" | "isobars">("wind");
  const [mapStyle, setMapStyle] = useState<"physical" | "imagery" | "vector" | "ocean">("imagery");
  const [showGlossary, setShowGlossary] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeStep30, setActiveStep30] = useState<number>(24); // Default 12:00 PM (step 24)
  const [isPlaying30, setIsPlaying30] = useState<boolean>(false);
  const [showWindDetails, setShowWindDetails] = useState(false);
  const [showRadarDetails, setShowRadarDetails] = useState(false);
  const [showCloudsDetails, setShowCloudsDetails] = useState(false);
  const [showIsobarsDetails, setShowIsobarsDetails] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(false);

  // Wind particle systems parameters
  const particlesRef = useRef<any[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  // Active step hour and minute
  const activeHour = Math.floor(activeStep30 / 2);

  // Find exact hourly record from `hourly` array (384 items = 16 days * 24 hours)
  const targetHourlyIndex = activeDayIndex * 24 + activeHour;
  const currentStepHourly = hourly && hourly[targetHourlyIndex] ? hourly[targetHourlyIndex] : null;
  const nextStepHourly = hourly && hourly[targetHourlyIndex + 1] ? hourly[targetHourlyIndex + 1] : currentStepHourly;

  // Active wind speed & direction for the selected 30-min step
  let activeWindSpeed = current.windSpeed;
  let activeWindDeg = current.windDeg;

  if (currentStepHourly) {
    if (activeStep30 % 2 === 1 && nextStepHourly && nextStepHourly !== currentStepHourly) {
      // Interpolate 30-minute mark between current hour and next hour
      activeWindSpeed = Number(((currentStepHourly.wind_speed + nextStepHourly.wind_speed) / 2).toFixed(1));
      
      // Angle interpolation taking shortest arc
      const diff = ((nextStepHourly.wind_deg - currentStepHourly.wind_deg + 540) % 360) - 180;
      activeWindDeg = Math.round((currentStepHourly.wind_deg + diff * 0.5 + 360) % 360);
    } else {
      activeWindSpeed = Number(currentStepHourly.wind_speed.toFixed(1));
      activeWindDeg = currentStepHourly.wind_deg;
    }
  } else if (daily && daily[activeDayIndex]) {
    activeWindSpeed = daily[activeDayIndex].wind_avg;
    activeWindDeg = daily[activeDayIndex].wind_deg_common;
  }

  // Check if viewing Maricá / RJ coastal zone
  const isCoastalArea = cityName.toLowerCase().includes("maricá") || cityName.toLowerCase().includes("marica") || cityName.toLowerCase().includes("rio de janeiro") || cityName.toLowerCase().includes("niteroi");

  // Remove artificial inflation of wind speed to ensure particle colors accurately match the real data
  const displayWindSpeed = activeWindSpeed;

  // Beaufort color matching function aligned with Civil Defense stages
  const getBeaufortColor = (speedKmh: number) => {
    if (speedKmh < 19) return isDark ? "#10B981" : "#059669"; // G0-G3 Brisa Leve (Verde)
    if (speedKmh < 39) return isDark ? "#EAB308" : "#D97706"; // G4-G5 Brisa Moderada / Observação (Amarelo)
    if (speedKmh < 62) return isDark ? "#F97316" : "#EA580C"; // G6-G7 Vento Forte / Estágio de Atenção (Laranja)
    if (speedKmh < 89) return isDark ? "#EF4444" : "#DC2626"; // G8-G9 Ventania / Estágio de Alerta (Vermelho)
    return isDark ? "#A855F7" : "#7E22CE"; // G10-G12 Vendaval Extremo / Crise (Roxo)
  };

  // Setup/Update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Determine map tile server style
    // "physical" is the Esri World Physical map featuring vibrant blue oceans and moss-green contours representing land elevations/forests.
    // "imagery" is Esri World Satellite Imagery showing realistic green vegetation, forests, and deep blue water.
    let tileUrl = "";
    if (mapStyle === "imagery") {
      tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    } else if (mapStyle === "physical") {
      tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}";
    } else {
      tileUrl = isDark
        ? "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      center: [lat, lon],
      zoom: 11,
      minZoom: 2,
      maxZoom: 18,
    });

    mapRef.current = map;

    // Add base tile layer
    L.tileLayer(tileUrl, {
      maxZoom: 18,
    }).addTo(map);

    // If ocean style, add our custom high-resolution satellite temperature image overlay of the entire world
    if (mapStyle === "ocean") {
      const bounds = L.latLngBounds([[-90, -180], [90, 180]]);
      L.imageOverlay(oceanMapUrl, bounds, {
        opacity: 0.95,
        interactive: false,
        zIndex: 10,
      }).addTo(map);
    }

    // Create a high-contrast pulsing beacon custom divIcon that remains visible even on high zoom levels
    const customIcon = L.divIcon({
      className: "custom-pulsing-beacon-icon",
      html: `
        <div class="relative flex items-center justify-center w-[36px] h-[36px]">
          <div class="absolute w-[32px] h-[32px] bg-red-500 rounded-full animate-ping opacity-70"></div>
          <div class="absolute w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Add custom marker
    const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
    
    // Bind permanent tooltip that is visible at any zoom level
    marker.bindTooltip(
      `<div class="px-2.5 py-1 bg-[#1F1B16] text-white border border-[#E2725B] rounded-xl shadow-2xl font-black text-[10px] tracking-wide whitespace-nowrap uppercase flex items-center gap-1.5 select-none">
        <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        📍 ${cityName || "Sua Localização"}
      </div>`,
      {
        permanent: true,
        direction: "top",
        offset: [0, -12],
        className: "custom-leaflet-tooltip font-sans shadow-none border-none bg-transparent"
      }
    );
    markerRef.current = marker;

    // Add a circular vicinity ring of 60km representing the localized monitoring zone
    const vicinityRing = L.circle([lat, lon], {
      radius: 60000, // 60 km
      color: "#E2725B",
      fillColor: "#E2725B",
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: "4, 6"
    }).addTo(map);

    // Create Isobars/Overlays layer group
    isobarsLayerRef.current = L.layerGroup().addTo(map);

    // Handle map movement to redraw simulated overlays
    map.on("move", () => {
      drawSimulatedOverlays();
    });

    // Initial draw
    setTimeout(() => {
      drawSimulatedOverlays();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, isDark, mapStyle]);

  // Handle map resizing
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  // 30-min simulation animation loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying30) {
      interval = setInterval(() => {
        setActiveStep30((prev) => (prev + 1) % 48);
      }, 800);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying30]);

  // Helper to draw simulated overlays in physical Leaflet layers
  const drawSimulatedOverlays = () => {
    if (!mapRef.current || !isobarsLayerRef.current) return;
    isobarsLayerRef.current.clearLayers();

    if (mapMode !== "radar" && mapMode !== "clouds" && mapMode !== "isobars") return;

    const activeDay = daily && daily[activeDayIndex] ? daily[activeDayIndex] : null;
    const rainMm = activeDay ? activeDay.rain_mm : (current.rain1h * 12 || 0);
    const windSpeed = activeDay ? activeDay.wind_avg : current.windSpeed;
    const windDeg = activeDay ? activeDay.wind_deg_common : current.windDeg;
    
    // Base pressure calculation (lower pressure for heavier rainfall)
    const isRainy = rainMm > 1.5;
    const basePressure = activeDay 
      ? (isRainy ? 1008 - Math.min(rainMm * 0.2, 10) : 1018 - Math.min(activeDayIndex * 0.1, 2))
      : current.pressure;

    const windRad = ((windDeg + 180) % 360) * (Math.PI / 180);
    const speedFactor = Math.min(windSpeed, 50) * 0.0004; // scaling factor for map coordinates
    
    // Time offset relative to noon (step 24 of 48)
    const timeOffset = activeStep30 - 24;
    const latShift = Math.cos(windRad) * timeOffset * speedFactor;
    const lonShift = Math.sin(windRad) * timeOffset * speedFactor;

    if (mapMode === "radar") {
      if (rainMm <= 0.2) return; // No radar return for clear sky

      // Generate 3 precipitation cells moving in wind direction
      const cellOffsets = [
        { dLat: 0.03, dLon: -0.04, mult: 1.0 },
        { dLat: -0.05, dLon: 0.05, mult: 0.8 },
        { dLat: 0.01, dLon: 0.02, mult: 1.2 },
      ];

      cellOffsets.forEach((offset) => {
        const cellLat = lat + offset.dLat + latShift;
        const cellLon = lon + offset.dLon + lonShift;
        const cellRainFactor = rainMm * offset.mult;

        const baseRadius = 16000 + (cellRainFactor * 1600);

        // dBZ 15-30: Light rain (Green)
        L.circle([cellLat, cellLon], {
          radius: baseRadius,
          color: "#22C55E",
          weight: 1,
          fillColor: "#22C55E",
          fillOpacity: 0.12,
        }).addTo(isobarsLayerRef.current!);

        // dBZ 30-40: Moderate rain (Yellow)
        if (cellRainFactor > 1.5) {
          L.circle([cellLat, cellLon], {
            radius: baseRadius * 0.65,
            color: "#EAB308",
            weight: 1,
            fillColor: "#EAB308",
            fillOpacity: 0.22,
          }).addTo(isobarsLayerRef.current!);
        }

        // dBZ 40-50: Heavy rain (Red)
        if (cellRainFactor > 6.0) {
          L.circle([cellLat, cellLon], {
            radius: baseRadius * 0.35,
            color: "#EF4444",
            weight: 1,
            fillColor: "#EF4444",
            fillOpacity: 0.35,
          }).addTo(isobarsLayerRef.current!);
        }

        // dBZ >50: Severe Storm / Hail (Purple)
        if (cellRainFactor > 15.0) {
          L.circle([cellLat, cellLon], {
            radius: baseRadius * 0.15,
            color: "#A855F7",
            weight: 1,
            fillColor: "#A855F7",
            fillOpacity: 0.55,
          }).addTo(isobarsLayerRef.current!);
        }
      });
    }

    else if (mapMode === "clouds") {
      // Draw 3 soft overlapping cloud masses drifting with the wind
      const cloudOffsets = [
        { dLat: 0.06, dLon: -0.06, mult: 1.1 },
        { dLat: -0.08, dLon: 0.08, mult: 0.9 },
        { dLat: 0, dLon: 0, mult: 1.0 },
      ];

      const baseOpacity = isRainy ? 0.28 : 0.08;
      const baseRadius = 55000 + (rainMm * 1200);

      cloudOffsets.forEach((offset) => {
        const cloudLat = lat + offset.dLat + latShift;
        const cloudLon = lon + offset.dLon + lonShift;
        
        L.circle([cloudLat, cloudLon], {
          radius: baseRadius * offset.mult,
          color: isDark ? "#E4E4E7" : "#CBD5E1",
          weight: 0.5,
          fillColor: isDark ? "#FFFFFF" : "#E2E8F0",
          fillOpacity: baseOpacity * offset.mult,
        }).addTo(isobarsLayerRef.current!);
      });
    }

    else if (mapMode === "isobars") {
      // Draw concentric isobar rings centered around the city coordinates
      for (let i = 1; i <= 4; i++) {
        const radius = i * 40000;
        const delta = basePressure > 1013 ? (i - 1) * 2 : -(i - 1) * 2;
        const ringPressure = Math.round(basePressure + delta);

        const color = basePressure > 1013 ? "#3B82F6" : "#EF4444";
        
        const circle = L.circle([lat, lon], {
          radius,
          color,
          weight: 1.5,
          fill: false,
          opacity: 0.45,
          dashArray: "5, 10",
        });

        circle.bindTooltip(`${ringPressure} hPa`, {
          permanent: true,
          direction: "center",
          className: "bg-transparent text-[10px] text-center border-none shadow-none text-zinc-400 dark:text-zinc-300 font-extrabold px-1 py-0",
        });

        circle.addTo(isobarsLayerRef.current!);
      }
    }
  };

  // Trigger draw when states change
  useEffect(() => {
    drawSimulatedOverlays();
  }, [mapMode, activeDayIndex, activeStep30, lat, lon, isDark, daily, current]);

  // Particle wind animation system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas scaling for high-definition displays
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();

    // Create particles array with a position history for trail tracing
    const maxParticles = 120;
    const particles: any[] = [];
    for (let i = 0; i < maxParticles; i++) {
      const px = Math.random() * canvas.width;
      const py = Math.random() * canvas.height;
      particles.push({
        x: px,
        y: py,
        history: [{ x: px, y: py }],
        life: Math.random() * 80 + 30,
        age: 0,
        speedMultiplier: Math.random() * 0.5 + 0.5,
      });
    }
    particlesRef.current = particles;

    // Translate wind degrees (coming from) to flow direction (heading to) in radians
    const windRad = ((activeWindDeg + 180) % 360) * (Math.PI / 180);
    const windSpeedKmh = displayWindSpeed;

    // Animate loop
    const animate = () => {
      // If we are not in wind mode, clear the canvas and keep loop quiet
      if (mapMode !== "wind") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }

      // CRITICAL: Always clear the canvas completely to keep the Leaflet map underneath fully visible
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const color = getBeaufortColor(windSpeedKmh);

      // Draw particles using their history for beautiful transparent trails
      particlesRef.current.forEach((p) => {
        // Spatial variation to create local wind fronts, gusts, and speed zones
        const wave = Math.sin(p.x * 0.006 + p.y * 0.004) * 0.35 + Math.cos(p.x * 0.003 - p.y * 0.005) * 0.25;
        // Local speed around activeWindSpeed with gusts
        const localSpeedKmh = Math.max(3, windSpeedKmh * (1.0 + wave) * p.speedMultiplier);
        const particleColor = getBeaufortColor(localSpeedKmh);

        // Calculate velocity based on local wind speed
        const velocity = (localSpeedKmh * 0.08 + 1.0);
        
        // Compute delta movement
        const dx = Math.cos(windRad) * velocity;
        const dy = Math.sin(windRad) * velocity;

        // Advance positions
        p.x += dx;
        p.y += dy;
        p.age++;

        // Append current position to trail history
        p.history.push({ x: p.x, y: p.y });
        
        // Keep trail length proportional to local wind intensity
        const maxHistory = localSpeedKmh > 62 ? 14 : localSpeedKmh > 39 ? 10 : localSpeedKmh > 19 ? 7 : 4;
        if (p.history.length > maxHistory) {
          p.history.shift();
        }

        // Render beautiful tapered flow line segments with fading opacity
        if (p.history.length > 1) {
          for (let h = 1; h < p.history.length; h++) {
            const p1 = p.history[h - 1];
            const p2 = p.history[h];
            const ratio = h / p.history.length;
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            ctx.strokeStyle = particleColor;
            ctx.globalAlpha = ratio * (isDark ? 0.75 : 0.65); // smooth alpha fade
            ctx.lineWidth = (localSpeedKmh > 39 ? 2.2 : 1.3) * ratio; // tapered width
            ctx.stroke();
          }
          // Reset globalAlpha to avoid affecting other renderings
          ctx.globalAlpha = 1.0;
        }

        // Draw a bright glowing particle point for active fronts in high-contrast locations
        if (localSpeedKmh > 39 && p.age % 12 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, localSpeedKmh > 62 ? 2.5 : 1.5, 0, 2 * Math.PI);
          ctx.fillStyle = isDark ? "#22D3EE" : "#0891B2"; // Cyan tip accent
          ctx.fill();
        }

        // Wrap around borders or resurrect old particles
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height || p.age >= p.life) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.history = [{ x: p.x, y: p.y }];
          p.age = 0;
          p.life = Math.random() * 80 + 30;
        }
      });

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    // Watch resize
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(canvas);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [mapMode, current, isDark, daily, activeDayIndex, activeWindSpeed, activeWindDeg]);

  // Leaflet map controllers
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 11, { animate: true });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getWindHeadingDirectionText = (deg: number) => {
    // Rotation mapping for text
    const comingFromText = getCompassDirection(deg);
    const headingToText = getCompassDirection((deg + 180) % 360);
    return `Vindo de ${comingFromText} (${deg}°) ➔ em direção a ${headingToText}`;
  };

  const getCompassDirection = (deg: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  };

  const getOriginInfo = (deg: number) => {
    if (deg >= 135 && deg <= 225) {
      return {
        title: "Vem do SUL do País / Frente Fria Oceânica",
        emoji: "❄️🌊",
        badgeBg: "bg-blue-500/15 text-blue-500 border-blue-500/30",
        source: "Sul (RS/SC/PR e Atlântico Sul)",
        desc: "Massa de ar e chuva vinda do Sul do continente e oceano, associada a frentes frias."
      };
    } else if (deg > 45 && deg < 135) {
      return {
        title: "Vem do OCEANO ATLÂNTICO / Mar Aberto",
        emoji: "🌊💨",
        badgeBg: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
        source: "Oceano Atlântico (Leste/Sudeste)",
        desc: "Umidade marítima soprada diretamente do oceano em direção à costa."
      };
    } else if (deg >= 225 && deg <= 315) {
      return {
        title: "Vem do INTERIOR / Charcos e Lagunas",
        emoji: "🌾🏞️",
        badgeBg: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
        source: "Interior Continental / Charcos e Baixadas",
        desc: "Instabilidade vinda dos charcos, serras e baixadas do interior continental."
      };
    } else {
      return {
        title: "Vem do NORTE / Serras Interiores",
        emoji: "⛰️☀️",
        badgeBg: "bg-amber-500/15 text-amber-500 border-amber-500/30",
        source: "Quadrante Norte / Região Serrana",
        desc: "Ventos do Norte transportando ar aquecido e umidade das serras."
      };
    }
  };

  return (
    <div
      className={`relative w-full rounded-[32px] p-6 border transition-all duration-300 shadow-sm ${
        isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
      } ${
        isFullscreen
          ? "fixed inset-0 z-[2000] rounded-none border-none h-screen w-screen p-0 bg-black"
          : ""
      }`}
    >
      {/* CARD HEADER (Visible when not in full screen mode) */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#E2725B]/15 text-[#E2725B] border border-[#E2725B]/30 shadow-sm">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-[#1F1B16] dark:text-white uppercase">
                  RADAR METEOROLÓGICO
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-500 font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Detecção de chuvas em tempo real, trajetória, origem do vento e intensidade por mm/min e dBZ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-extrabold text-xs transition-all shadow-sm border ${
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

            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-full border shadow-sm transition-colors ${
                isDark
                  ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  : "bg-stone-100 border-stone-300 text-[#1F1B16] hover:bg-stone-200"
              }`}
              title="Modo Tela Cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAP FRAME CONTAINER */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border ${
          isDark ? "border-zinc-800 bg-[#0A0A0A]" : "border-[#E7E1D1] bg-[#FDFCFB]"
        } transition-all duration-300 ${
          isFullscreen ? "h-screen rounded-none border-none" : "h-[380px] sm:h-[420px]"
        }`}
      >
        {/* Dynamic Map Layers */}
        <div ref={mapContainerRef} className="w-full h-full relative z-0" />

        {/* Canvas Overlay for Wind Flow Particles */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none z-[400] transition-opacity duration-300 ${
            mapMode === "wind" ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Layer selector floating headers - centered and responsive to fit screen */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none w-[95%] sm:w-auto flex justify-center">
          {/* Layers switcher - Glassmorphic pills */}
          <div
            className={`flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-full backdrop-blur-md border shadow-lg pointer-events-auto overflow-x-auto max-w-full ${
              isDark ? "bg-[#161616]/85 border-zinc-800 text-white" : "bg-white/85 border-[#E7E1D1] text-[#1F1B16]"
            }`}
          >
            <button
              onClick={() => setMapMode("wind")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                mapMode === "wind"
                  ? isDark
                    ? "bg-[#6E5D0E] text-white border border-[#8C7714]"
                    : "bg-[#6E5D0E] text-white shadow-sm"
                  : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
              }`}
            >
              <Wind className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Vento</span>
            </button>
            <button
              onClick={() => setMapMode("radar")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                mapMode === "radar"
                  ? isDark
                    ? "bg-[#E2725B] text-white border border-[#E98C79]"
                    : "bg-[#E2725B] text-white shadow-sm"
                  : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
              }`}
            >
              <CloudRain className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>
                <span className="inline sm:hidden">Radar Met.</span>
                <span className="hidden sm:inline">Radar Meteorológico</span>
              </span>
            </button>
            <button
              onClick={() => setMapMode("clouds")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                mapMode === "clouds"
                  ? isDark
                    ? "bg-[#7E7667] text-white border border-[#968E80]"
                    : "bg-[#7E7667] text-white shadow-sm"
                  : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
              }`}
            >
              <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Nuvens</span>
            </button>
            <button
              onClick={() => setMapMode("isobars")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                mapMode === "isobars"
                  ? isDark
                    ? "bg-[#1E3A8A] text-white border border-[#2B4C9B]"
                    : "bg-blue-600 text-white shadow-sm"
                  : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
              }`}
            >
              <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Isobaras</span>
            </button>
          </div>
        </div>

        {/* Floating Fullscreen button on top-right in map frame */}
        <div className="absolute top-3 right-3 z-[500] pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className={`p-2.5 rounded-full border shadow-lg backdrop-blur-md transition-colors ${
              isDark
                ? "bg-[#1E1E1E]/90 border-zinc-800 text-white hover:bg-[#2A2A2A]"
                : "bg-white/90 border-[#E7E1D1] text-[#1F1B16] hover:bg-[#F4F0E6]"
            }`}
            title="Modo Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      {/* Floating vertical controllers in center-right */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[500] flex flex-col gap-3">
        {/* Zoom Controls */}
        <div
          className={`flex flex-col rounded-full border shadow-lg overflow-hidden backdrop-blur-md ${
            isDark ? "bg-[#1E1E1E]/90 border-zinc-800 text-white" : "bg-white/90 border-[#E7E1D1] text-[#1F1B16]"
          }`}
        >
          <button
            onClick={handleZoomIn}
            className={`p-2.5 transition-colors border-b ${
              isDark ? "hover:bg-[#2A2A2A] border-zinc-800" : "hover:bg-[#F4F0E6] border-[#E7E1D1]"
            }`}
            title="Aproximar"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className={`p-2.5 transition-colors ${isDark ? "hover:bg-[#2A2A2A]" : "hover:bg-[#F4F0E6]"}`}
            title="Afastar"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Re-center marker */}
        <button
          onClick={handleRecenter}
          className={`p-2.5 rounded-full border shadow-lg backdrop-blur-md transition-colors ${
            isDark
              ? "bg-[#1E1E1E]/90 border-zinc-800 text-[#EAB308] hover:bg-[#2A2A2A]"
              : "bg-white/90 border-[#E7E1D1] text-[#6E5D0E] hover:bg-[#F4F0E6]"
          }`}
          title="Minha Localização"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Custom formatting helper for 16-day labels */}
      {(() => {
        // Quick definition of steps
        const radarSteps = Array.from({ length: 48 }, (_, i) => {
          const h = Math.floor(i / 2);
          const m = i % 2 === 0 ? "00" : "30";
          return `${String(h).padStart(2, "0")}:${m}`;
        });

        const formatDayLabel = (dateStr: string) => {
          try {
            const d = new Date(dateStr + "T12:00:00");
            const dayName = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
            const dayMonth = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
            return { dayName, dayMonth };
          } catch {
            return { dayName: "---", dayMonth: "---" };
          }
        };

        return (
          <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-3 pointer-events-none z-[500] max-h-[50%] overflow-y-auto no-scrollbar md:max-h-full">
            {/* Row 1: Floating Legends (Top-Level) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-between items-end">
              {/* Left: Active Mode indicator & Legends */}
              <div className="pointer-events-auto flex flex-col gap-2 max-w-sm w-full">
                {mapMode === "wind" && (
                  <div
                    className={`rounded-2xl border shadow-xl backdrop-blur-md flex flex-col overflow-hidden transition-all duration-300 ${
                      isDark ? "bg-[#111111]/95 border-zinc-800 text-white" : "bg-[#FDFCFB]/95 border-[#E7E1D1] text-[#1F1B16]"
                    }`}
                  >
                    <button
                      onClick={() => setShowWindDetails(!showWindDetails)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 font-black text-xs text-[#6E5D0E] dark:text-[#EAB308] uppercase tracking-wider">
                        <Wind className="w-4 h-4 text-[#6E5D0E] dark:text-[#EAB308]" />
                        <span>Fluxo de Vento: {activeWindSpeed} km/h</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
                        {showWindDetails ? "Ocultar ✕" : "Detalhes ➔"}
                      </span>
                    </button>
                    {showWindDetails && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-800/10 dark:border-zinc-800/25 flex flex-col gap-2.5">
                        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                          <span className="font-bold text-[#E2725B]">Fluxo de Partículas Dinâmico:</span> Cada partícula no mapa se move de acordo com a velocidade do vento local (inclusive rajadas estimadas). As cores mudam em tempo real de acordo com a Escala Internacional de Beaufort:
                        </div>

                        {/* Beaufort scale legend items */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                            🚩 Escala de Velocidade dos Ventos
                          </span>
                          <div className="flex flex-col gap-1 text-[9px] font-bold">
                            {/* Verde / Brisa Leve */}
                            <div className="flex items-center justify-between p-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0" />
                                <span className="text-emerald-700 dark:text-emerald-400">Brisa Leve a Moderada</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">&lt; 19 km/h</span>
                            </div>

                            {/* Amarelo / Observação */}
                            <div className="flex items-center justify-between p-1 rounded bg-amber-500/10 border border-amber-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#EAB308] shrink-0" />
                                <span className="text-amber-700 dark:text-amber-400">Vento Moderado (Observação)</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">19 - 38 km/h</span>
                            </div>

                            {/* Laranja / Atenção */}
                            <div className="flex items-center justify-between p-1 rounded bg-orange-500/10 border border-orange-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#F97316] shrink-0" />
                                <span className="text-orange-700 dark:text-orange-400">Vento Forte (Atenção)</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">39 - 61 km/h</span>
                            </div>

                            {/* Vermelho / Alerta */}
                            <div className="flex items-center justify-between p-1 rounded bg-red-500/10 border border-red-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#EF4444] shrink-0" />
                                <span className="text-red-700 dark:text-red-400">Ventania Forte (Alerta Civil)</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">62 - 88 km/h</span>
                            </div>

                            {/* Roxo / Crise */}
                            <div className="flex items-center justify-between p-1 rounded bg-purple-500/10 border border-purple-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#A855F7] shrink-0" />
                                <span className="text-purple-700 dark:text-purple-400">Vendaval Extremo / Crise</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">&ge; 89 km/h</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[9px] font-extrabold bg-[#E2725B]/10 border border-[#E2725B]/20 p-2 rounded-lg text-[#E2725B] flex flex-col gap-0.5 mt-0.5">
                          <span>🧭 <strong>Sentido:</strong> Soprando de <strong>{getCompassDirection(activeWindDeg)}</strong> para <strong>{getCompassDirection((activeWindDeg + 180) % 360)}</strong></span>
                          <span>🚩 <strong>Média Atual:</strong> {activeWindSpeed} km/h (Variação Dinâmica Ativa)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mapMode === "radar" && (
                  <div
                    className={`rounded-2xl border shadow-xl backdrop-blur-md flex flex-col overflow-hidden transition-all duration-300 ${
                      isDark ? "bg-[#111111]/95 border-zinc-800 text-white" : "bg-[#FDFCFB]/95 border-[#E7E1D1] text-[#1F1B16]"
                    }`}
                  >
                    <button
                      onClick={() => setShowRadarDetails(!showRadarDetails)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 font-black text-xs text-[#E2725B] uppercase tracking-wider">
                        <CloudRain className="w-4 h-4" />
                        <span>Radar de Chuva (dBZ, mm/h e Origem)</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
                        {showRadarDetails ? "Ocultar ✕" : "Legenda & Origem ➔"}
                      </span>
                    </button>
                    {showRadarDetails && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-800/10 dark:border-zinc-800/25 flex flex-col gap-2.5">
                        
                        {/* 1. ORIGIN & TRAJECTORY ANALYSIS */}
                        {(() => {
                          const origin = getOriginInfo(activeWindDeg);
                          const destDir = getCompassDirection((activeWindDeg + 180) % 360);
                          const activeRainMm = daily[activeDayIndex]?.rain_mm || current.rain1h || 0;
                          const rainPerMin = (activeRainMm / 60).toFixed(3);

                          return (
                            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-800/10 dark:border-zinc-800/20 space-y-2">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#E2725B] flex items-center gap-1">
                                  🧭 Trajetória & Origem das Massas
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-md font-black text-[8px] uppercase ${origin.badgeBg}`}>
                                  {origin.emoji} {origin.source}
                                </span>
                              </div>

                              <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 leading-tight">
                                <strong className="text-amber-500 dark:text-amber-400">Origem:</strong> {origin.title}
                              </p>

                              <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 leading-snug">
                                {origin.desc}
                              </p>

                              <div className="text-[9px] font-extrabold bg-[#E2725B]/10 border border-[#E2725B]/20 p-1.5 rounded-lg text-[#E2725B] flex flex-col gap-0.5">
                                <span>📍 <strong>Deslocamento:</strong> Vindo de <strong>{getCompassDirection(activeWindDeg)}</strong> ({activeWindDeg}°) ➔ indo para <strong>{destDir}</strong> a <strong>{activeWindSpeed} km/h</strong></span>
                                <span>🌧️ <strong>Taxa Estimada:</strong> {activeRainMm.toFixed(1)} mm/h (~{rainPerMin} mm/min)</span>
                                <span>📊 <strong>Acumulado Hoje:</strong> {daily[0]?.rain_mm.toFixed(1) || 0} mm</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 2. LEGENDA DE CORES DO RADAR DE CHUVA */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                            🎨 Legenda de Intensidade de Chuva & Cores (dBZ)
                          </span>
                          <div className="flex flex-col gap-1 text-[9px] font-bold">
                            {/* Ciano / Garoa */}
                            <div className="flex items-center justify-between p-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#06B6D4] shrink-0" />
                                <span className="text-cyan-700 dark:text-cyan-300">Garoa / Chuva Muito Leve</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">0.1-1.0 mm/h | &lt;0.02 mm/min | dBZ 10-20</span>
                            </div>

                            {/* Verde / Chuva Leve */}
                            <div className="flex items-center justify-between p-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#22C55E] shrink-0" />
                                <span className="text-emerald-700 dark:text-emerald-300">Chuva Leve</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">1.0-5.0 mm/h | 0.02-0.08 mm/min | dBZ 20-30</span>
                            </div>

                            {/* Amarelo / Chuva Moderada */}
                            <div className="flex items-center justify-between p-1 rounded bg-amber-500/10 border border-amber-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#EAB308] shrink-0" />
                                <span className="text-amber-700 dark:text-amber-300">Chuva Moderada</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">5.0-15.0 mm/h | 0.08-0.25 mm/min | dBZ 30-40</span>
                            </div>

                            {/* Vermelho / Chuva Forte */}
                            <div className="flex items-center justify-between p-1 rounded bg-red-500/10 border border-red-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#EF4444] shrink-0" />
                                <span className="text-red-700 dark:text-red-300">Chuva Forte</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">15.0-30.0 mm/h | 0.25-0.50 mm/min | dBZ 40-50</span>
                            </div>

                            {/* Roxo / Tempestade */}
                            <div className="flex items-center justify-between p-1 rounded bg-purple-500/10 border border-purple-500/20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#A855F7] shrink-0" />
                                <span className="text-purple-700 dark:text-purple-300">Tempestade Severa / Granizo</span>
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400">&gt;30.0 mm/h | &gt;0.50 mm/min | dBZ &gt;50</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {mapMode === "clouds" && (
                  <div
                    className={`rounded-2xl border shadow-xl backdrop-blur-md flex flex-col overflow-hidden transition-all duration-300 ${
                      isDark ? "bg-[#111111]/95 border-zinc-800 text-white" : "bg-[#FDFCFB]/95 border-[#E7E1D1] text-[#1F1B16]"
                    }`}
                  >
                    <button
                      onClick={() => setShowCloudsDetails(!showCloudsDetails)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 font-black text-xs text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                        <Cloud className="w-4 h-4" />
                        <span>Cobertura de Nuvens</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
                        {showCloudsDetails ? "Ocultar ✕" : "Explicação ➔"}
                      </span>
                    </button>
                    {showCloudsDetails && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-800/10 dark:border-zinc-800/25 flex flex-col gap-2">
                        {/* Cloud Density Scale */}
                        <div className="flex items-center gap-2 text-[9px] font-extrabold w-full justify-between bg-black/5 dark:bg-white/5 p-1.5 rounded-lg border border-zinc-800/5 dark:border-zinc-800/15">
                          <span className="opacity-50">Céu Limpo</span>
                          <div className="flex-1 mx-2 h-1.5 rounded bg-gradient-to-r from-zinc-400/10 to-zinc-400/80" />
                          <span>Nublado/Instável</span>
                        </div>
                        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 space-y-1 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                          <p>☁️ <strong className="text-zinc-700 dark:text-zinc-200">Nuvens Finas</strong>: Nuvens altas ou névoa passageira.</p>
                          <p>⛈️ <strong className="text-zinc-700 dark:text-zinc-200">Massas Densas</strong>: Cobertura total, risco de chuva.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mapMode === "isobars" && (
                  <div
                    className={`rounded-2xl border shadow-xl backdrop-blur-md flex flex-col overflow-hidden transition-all duration-300 ${
                      isDark ? "bg-[#111111]/95 border-zinc-800 text-white" : "bg-[#FDFCFB]/95 border-[#E7E1D1] text-[#1F1B16]"
                    }`}
                  >
                    <button
                      onClick={() => setShowIsobarsDetails(!showIsobarsDetails)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 font-black text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        <Compass className="w-4 h-4" />
                        <span>Isóbaras de Pressão</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
                        {showIsobarsDetails ? "Ocultar ✕" : "Explicação ➔"}
                      </span>
                    </button>
                    {showIsobarsDetails && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-800/10 dark:border-zinc-800/25 flex flex-col gap-2">
                        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 space-y-1 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                          <p>🌀 <strong className="text-blue-600 dark:text-blue-400">Alta Pressão (&gt;1013)</strong>: Tempo seco, ensolarado e estável.</p>
                          <p>⛈️ <strong className="text-red-500">Baixa Pressão (&lt;1013)</strong>: Instabilidade, chuva e vento forte.</p>
                          <p>📏 <strong className="text-zinc-700 dark:text-zinc-300">Proximidade das Linhas</strong>: Quanto mais perto, ventos mais intensos!</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Row 2: Controls Dashboard (Collapsible / Minimized by default for full map view) */}
            {!isControlsExpanded ? (
              <div className="pointer-events-auto flex items-center justify-between gap-2 p-2 px-3.5 rounded-full border shadow-2xl backdrop-blur-md w-full sm:w-auto bg-[#111111]/90 border-zinc-800 text-white transition-all">
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                  <button
                    onClick={() => setIsPlaying30(!isPlaying30)}
                    className={`p-1.5 rounded-full text-white transition-all flex items-center justify-center shrink-0 ${
                      isPlaying30 ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                    title={isPlaying30 ? "Pausar Simulação" : "Iniciar Simulação Contínua"}
                  >
                    {isPlaying30 ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 shrink-0">
                    ⏱️ {radarSteps[activeStep30]}
                  </span>
                  <span className="text-[10px] font-extrabold text-zinc-300 truncate">
                    • 🌡️ {currentStepHourly ? `${Math.round(currentStepHourly.temp)}°C (Sensação ${Math.round(currentStepHourly.feels)}°C)` : `${Math.round(current.temp)}°C`} • 💨 {activeWindSpeed} km/h • {daily[activeDayIndex]?.rain_mm > 0 ? `🌧️ ${daily[activeDayIndex]?.rain_mm}mm` : "☀️ Sem Chuva"}
                  </span>
                </div>
                <button
                  onClick={() => setIsControlsExpanded(true)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-full shrink-0 shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <span>Expandir Controles</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                className={`pointer-events-auto p-4 rounded-[24px] border shadow-2xl backdrop-blur-md flex flex-col gap-3 w-full transition-all ${
                  isDark ? "bg-[#111111]/95 border-zinc-800 text-white" : "bg-[#FDFCFB]/95 border-[#E7E1D1] text-[#1F1B16]"
                }`}
              >
                {/* Header section with active step details and Minimize button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800/10 dark:border-zinc-800/20 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-xl bg-[#E2725B]/10 text-[#E2725B] font-bold text-xs uppercase flex items-center gap-1">
                      ⏱️ {radarSteps[activeStep30]}
                    </span>
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wide leading-none">
                        Linha do Tempo Meteorológica (30 em 30 min)
                      </h4>
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {activeStep30 < 12
                          ? "🌌 Madrugada"
                          : activeStep30 < 24
                          ? "🌅 Manhã"
                          : activeStep30 < 36
                          ? "☀️ Tarde"
                          : "🌙 Noite"}{" "}
                        — Simulação Dinâmica de Fluxos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Step label description */}
                    <div className="text-[10px] font-extrabold text-zinc-600 dark:text-zinc-300 bg-black/5 dark:bg-white/5 py-1 px-2.5 rounded-lg border border-zinc-800/5 dark:border-zinc-800/15">
                      {currentStepHourly ? `🌡️ ${Math.round(currentStepHourly.temp)}°C (Sensação: ${Math.round(currentStepHourly.feels)}°C) • ` : ""}Previsão de {daily[activeDayIndex]?.rain_mm > 0 ? `🌧️ ${daily[activeDayIndex]?.rain_mm} mm` : "☀️ Sem Chuva"} • 💨 {activeWindSpeed} km/h ({getCompassDirection(activeWindDeg)})
                    </div>

                    {/* Minimize button */}
                    <button
                      onClick={() => setIsControlsExpanded(false)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md shrink-0"
                      title="Minimizar painel para ver mapa completo"
                    >
                      <span>Minimizar</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Time progress bar slider */}
                <div className="flex items-center gap-3">
                  {/* Play / Pause Toggle button */}
                  <button
                    onClick={() => setIsPlaying30(!isPlaying30)}
                    className={`p-2.5 rounded-full text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg ${
                      isPlaying30 ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                    title={isPlaying30 ? "Pausar Simulação" : "Iniciar Animação Contínua"}
                  >
                    {isPlaying30 ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  {/* Timeline Slider */}
                  <div className="flex-1 flex flex-col gap-1">
                    <input
                      type="range"
                      min="0"
                      max="47"
                      value={activeStep30}
                      onChange={(e) => {
                        setActiveStep30(parseInt(e.target.value));
                        setIsPlaying30(false); // Pause on manual scrub
                      }}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#E2725B] bg-zinc-300 dark:bg-zinc-800 focus:outline-none"
                    />
                    {/* Micro marks under timeline */}
                    <div className="flex justify-between text-[8px] font-bold text-zinc-500 dark:text-zinc-400 select-none px-1">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>23:59</span>
                    </div>
                  </div>
                </div>

                {/* 16-Day Forecast Horizon Track */}
                {daily && daily.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1 border-t border-zinc-800/10 dark:border-zinc-800/20 pt-2.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Selecione o Dia da Previsão (Horizonte de 16 Dias)
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none select-none w-full pointer-events-auto">
                      {daily.map((day, idx) => {
                        const { dayName, dayMonth } = formatDayLabel(day.date);
                        const isActive = idx === activeDayIndex;
                        const emoji = day.rain_mm > 5 ? "🌧️" : day.rain_mm > 0 ? "🌦️" : "☀️";
                        return (
                          <button
                            key={day.date}
                            onClick={() => setActiveDayIndex && setActiveDayIndex(idx)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center py-1 px-2.5 rounded-xl border text-center transition-all min-w-[55px] ${
                              isActive
                                ? "bg-[#6E5D0E] border-[#6E5D0E] text-white shadow-md scale-105"
                                : isDark
                                ? "bg-zinc-900/90 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                                : "bg-stone-50 border-stone-200 hover:bg-stone-100 text-[#1F1B16]"
                            }`}
                          >
                            <span className="text-[8px] font-black uppercase tracking-wider opacity-75">{dayName}</span>
                            <span className="text-[10px] font-black my-0.5">{dayMonth}</span>
                            <span className="text-xs mt-0.5">{emoji}</span>
                            <span className="text-[8px] font-bold opacity-85 mt-0.5">
                              {Math.round(day.temp_max)}°
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* GLOSSARY OVERLAY DIALOG - Atmospheric Systems Guide */}
      {showGlossary && (
        <div className="absolute inset-0 z-[1000] bg-black/75 backdrop-blur-sm p-4 flex flex-col justify-end sm:justify-center transition-all duration-300 pointer-events-auto">
          <div
            className={`w-full max-w-2xl mx-auto rounded-[24px] border shadow-2xl flex flex-col max-h-[90%] overflow-hidden ${
              isDark ? "bg-[#121212] border-zinc-800 text-white" : "bg-[#FDFCFB] border-[#E7E1D1] text-[#1F1B16]"
            }`}
          >
            {/* Glossary Header */}
            <div className="p-4 border-b border-zinc-800/40 dark:border-zinc-800/80 flex justify-between items-center bg-black/5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">Guia de Sistemas Atmosféricos</h3>
                  <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase leading-none mt-0.5">
                    Termos essenciais para previsão e wind-fluxos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGlossary(false)}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                title="Fechar Guia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Glossary Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-4 max-h-[400px] scrollbar-thin text-justify" style={{ textAlign: "justify" }}>
              
              {/* Term 1 */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider mb-2">
                  Cavado (Trough)
                </span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <strong className="text-[#1F1B16] dark:text-white">O que é:</strong> Região alongada de baixa pressão atmosférica relativa.
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  <strong className="text-zinc-700 dark:text-zinc-300">Como funciona:</strong> Funciona como um "vale" entre duas cristas de alta pressão. No cavado, o ar converge na superfície e sobe rápido, resfriando-se, condensando a umidade e formando nuvens carregadas com trovoadas, vento e instabilidade constante.
                </p>
              </div>

              {/* Term 2 */}
              <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider mb-2">
                  Zona de Convergência do Atlântico Sul (ZCAS)
                </span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <strong className="text-[#1F1B16] dark:text-white">O que é:</strong> Um dos principais sistemas climáticos do Brasil durante a primavera e verão.
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  <strong className="text-zinc-700 dark:text-zinc-300">Como funciona:</strong> É uma faixa persistente de nebulosidade e chuva que conecta o sul da Amazônia, passa pelo Sudeste e Centro-Oeste, e avança até o Oceano Atlântico Sul. Exige pelo menos 4 dias seguidos para ser classificada, gerando chuvas torrenciais volumosas e perigos de alagamento.
                </p>
              </div>

              {/* Term 3 */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-wider mb-2">
                  Zona de Convergência Intertropical (ZCIT)
                </span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <strong className="text-[#1F1B16] dark:text-white">O que é:</strong> Sistema global que dita o clima equatorial (Corredor Intertropical).
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  <strong className="text-zinc-700 dark:text-zinc-300">Como funciona:</strong> É a região onde os ventos alísios do norte (nordeste) encontram os ventos alísios do sul (sudeste). Essa convergência maciça empurra ar muito quente e úmido para cima, criando um colar contínuo de tempestades severas ao redor da Linha do Equador. Rege a estação chuvosa do Norte/Nordeste brasileiro de março a maio.
                </p>
              </div>

              {/* Term 4 */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-2">
                  Corredor de Umidade / "Corredor da Amazônia" (Rios Voadores)
                </span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <strong className="text-[#1F1B16] dark:text-white">O que é:</strong> Verdadeiros rios aéreos de vapor que cruzam o continente.
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  <strong className="text-zinc-700 dark:text-zinc-300">Como funciona:</strong> Correntes atmosféricas de jatos de baixos níveis transportam o vapor de água colossal liberado pela Floresta Amazônica em direção ao Centro-Sul do Brasil, desviando-se pela Cordilheira dos Andes. Esses rios voadores colidem com frentes frias, provocando chuvas torrenciais intensas.
                </p>
              </div>

              {/* Term 5 */}
              <div className="p-3.5 rounded-2xl bg-zinc-500/5 border border-zinc-500/20 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-2">
                  Crista (Ridge)
                </span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <strong className="text-[#1F1B16] dark:text-white">O que é:</strong> Região alongada de alta pressão atmosférica (oposto do cavado).
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  <strong className="text-zinc-700 dark:text-zinc-300">Como funciona:</strong> O ar das camadas superiores afunda em direção ao solo (subsidência), comprimindo-se e aquecendo-se, o que dissolve nuvens e inibe sua formação. O resultado é tempo firme, ensolarado, céu azul sem nuvens e estabilidade, muitas vezes associada a secas e ondas de calor.
                </p>
              </div>

              {/* Term 6 */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-2">
                  Frente Fria
                </span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <strong className="text-[#1F1B16] dark:text-white">O que é:</strong> Zona limite de choque entre ar gelado e ar quente.
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  <strong className="text-zinc-700 dark:text-zinc-300">Como funciona:</strong> Uma massa de ar frio e seco, por ser mais densa e pesada, empurra e eleva o ar quente e úmido local rapidamente de forma vertical. Essa colisão violenta de massas gera linhas de instabilidade severas com chuvas fortes, trovoadas, declínio térmico brusco e ventos intensos.
                </p>
              </div>

              {/* Term 7 */}
              <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider mb-2">
                  Vórtice Ciclônico de Altos Níveis (VCAN)
                </span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <strong className="text-[#1F1B16] dark:text-white">O que é:</strong> Redemoinho fechado de vento localizado na alta atmosfera (10 a 12 km de altitude).
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  <strong className="text-zinc-700 dark:text-zinc-300">Como funciona:</strong> No centro do vórtice, o ar desce (tempo muito seco e céu limpo). Nas bordas circulares externas (periferia), o ar sobe de forma violenta, provocando frentes de fortes tempestades. É muito comum no Nordeste do Brasil durante o verão.
                </p>
              </div>

              {/* Term 8 */}
              <div className="p-3.5 rounded-2xl bg-red-500/5 border border-red-500/20 leading-relaxed text-justify" style={{ textAlign: "justify" }}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider mb-2">
                  Baixa Pressão / Depressão / Ciclone
                </span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <strong className="text-[#1F1B16] dark:text-white">O que é:</strong> Centro de pressão reduzida que suga o ar circundante.
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  <strong className="text-zinc-700 dark:text-zinc-300">Como funciona:</strong> O ar aquecido sobe rápido criando um vácuo que atrai as massas vizinhas. Por conta do giro terrestre (Efeito Coriolis), esses fluxos giram em espiral (sentido horário no H. Sul), gerando ventos fortíssimos, chuvas intensas e prolongadas.
                </p>
              </div>

            </div>

            {/* Glossary Footer */}
            <div className="p-3 border-t border-zinc-800/40 dark:border-zinc-800/80 bg-black/5 flex justify-end">
              <button
                onClick={() => setShowGlossary(false)}
                className="px-5 py-2 rounded-xl bg-[#E2725B] hover:bg-[#D15C44] text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Entendi, voltar ao mapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
