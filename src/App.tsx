import React, { useEffect, useState } from "react";
import {
  MapPin,
  Search,
  Navigation,
  Star,
  StarOff,
  Sun,
  Moon,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Zap,
  CloudRain,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Smartphone,
  Download,
  X,
  Share2,
  Clock,
  Calendar,
  Waves,
  Bot,
  BookOpen,
} from "lucide-react";
import { FavoriteCity, WeatherData } from "./types";
import { 
  addFavoriteToCloud, 
  removeFavoriteFromCloud, 
  addSmsRegistrationToCloud, 
  removeSmsRegistrationFromCloud,
  subscribeFavoritesFromCloud,
  subscribeSmsRegistrationsFromCloud,
  subscribeSettingsFromCloud,
  saveSettingsToCloud,
  testCloudConnection,
  subscribeWeatherNotesFromCloud,
  addWeatherNoteToCloud,
  deleteWeatherNoteFromCloud,
  WeatherNote
} from "./firebase";
import WeatherMap from "./components/WeatherMap";
import BeaufortScale from "./components/BeaufortScale";
import WindChart from "./components/WindChart";
import ForecastTimeline from "./components/ForecastTimeline";
import ForecastList from "./components/ForecastList";
import GeminiAssistant from "./components/GeminiAssistant";
import BeachSeaCard from "./components/BeachSeaCard";
import CivilDefenseAlertBanner from "./components/CivilDefenseAlertBanner";
import CityImpactPanel from "./components/CityImpactPanel";
import DynamicWeatherBackground from "./components/DynamicWeatherBackground";

export default function App() {
  // Themes
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("clima-vento-theme");
    return stored ? stored === "dark" : true;
  });

  // Location State (Defaulting to Jacaroá, Maricá, Brazil)
  const [location, setLocation] = useState<FavoriteCity>({
    name: "Jacaroá, Maricá",
    latitude: -22.9194,
    longitude: -42.8186,
    state: "Rio de Janeiro",
    country: "Brasil",
  });

  const [isGPSActive, setIsGPSActive] = useState(false);
  const [isGPSLoading, setIsGPSLoading] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Weather States
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Timeline & active selectors
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeHourIndex, setActiveHourIndex] = useState(() => {
    return new Date().getHours();
  });

  // Favorites States (Prepopulated as requested)
  const [favorites, setFavorites] = useState<FavoriteCity[]>(() => {
    const stored = localStorage.getItem("clima-vento-favorites");
    if (stored) return JSON.parse(stored);
    return [
      { name: "Jacaroá, Maricá", latitude: -22.9194, longitude: -42.8186, state: "Rio de Janeiro", country: "Brasil" },
      { name: "Rio de Janeiro", latitude: -22.9068, longitude: -43.1729, state: "Rio de Janeiro", country: "Brasil" },
      { name: "São Paulo", latitude: -23.5505, longitude: -46.6333, state: "São Paulo", country: "Brasil" },
    ];
  });

  // SMS Zipcode Simulator state
  const [smsZip, setSmsZip] = useState("");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [smsRegistrations, setSmsRegistrations] = useState<{ id?: string; zipcode: string; createdAt?: any }[]>([]);

  // Firebase Cloud Realtime States
  const [cloudConnected, setCloudConnected] = useState<boolean | null>(null);
  const [weatherNotes, setWeatherNotes] = useState<WeatherNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Collapsible Panel States (Default collapsed / recolhidos as requested)
  const [isCivilDefenseExpanded, setIsCivilDefenseExpanded] = useState(false);
  const [isCityImpactsExpanded, setIsCityImpactsExpanded] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [isForecastListExpanded, setIsForecastListExpanded] = useState(false);
  const [isWindChartExpanded, setIsWindChartExpanded] = useState(false);
  const [isBeaufortExpanded, setIsBeaufortExpanded] = useState(false);
  const [isBeachSeaExpanded, setIsBeachSeaExpanded] = useState(false);
  const [isGeminiAssistantExpanded, setIsGeminiAssistantExpanded] = useState(false);
  const [isCivilDefenseChannelsExpanded, setIsCivilDefenseChannelsExpanded] = useState(false);
  const [isWeatherNotesExpanded, setIsWeatherNotesExpanded] = useState(false);

  // PWA Standalone & Install Prompt States
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    // Check if running as native standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) {
      setIsPwaInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", () => {
      setIsPwaInstalled(true);
      setPwaInstallPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Ativar Inscrições em Tempo Real do Firebase Cloud
  useEffect(() => {
    // Testar conexão de nuvem
    testCloudConnection().then((connected) => {
      setCloudConnected(connected);
    });

    // Inscrição em Tempo Real de Favoritos
    const unsubFavs = subscribeFavoritesFromCloud((cloudFavs) => {
      if (cloudFavs && cloudFavs.length > 0) {
        setFavorites(cloudFavs);
      } else {
        // Se a nuvem estiver totalmente vazia no primeiro uso, inicializa os padrões
        const defaultFavs = [
          { name: "Jacaroá, Maricá", latitude: -22.9194, longitude: -42.8186, state: "Rio de Janeiro", country: "Brasil" },
          { name: "Rio de Janeiro", latitude: -22.9068, longitude: -43.1729, state: "Rio de Janeiro", country: "Brasil" },
          { name: "São Paulo", latitude: -23.5505, longitude: -46.6333, state: "São Paulo", country: "Brasil" },
        ];
        defaultFavs.forEach((fav) => addFavoriteToCloud(fav));
      }
    });

    // Inscrição em Tempo Real de Cadastros de SMS
    const unsubSms = subscribeSmsRegistrationsFromCloud((cloudSms) => {
      setSmsRegistrations(cloudSms);
    });

    // Inscrição em Tempo Real de Configurações (Tema + Localização Ativa Sincronizada)
    const unsubSettings = subscribeSettingsFromCloud((cloudSettings) => {
      if (cloudSettings.isDark !== undefined) {
        setIsDark(cloudSettings.isDark);
      }
      if (cloudSettings.activeLocation) {
        const cloudLoc = cloudSettings.activeLocation;
        setLocation((prev) => {
          if (
            prev.latitude.toFixed(4) !== cloudLoc.latitude.toFixed(4) ||
            prev.longitude.toFixed(4) !== cloudLoc.longitude.toFixed(4) ||
            prev.name !== cloudLoc.name
          ) {
            return cloudLoc;
          }
          return prev;
        });
      }
    });

    // Inscrição em Tempo Real de Notas Meteorológicas
    const unsubNotes = subscribeWeatherNotesFromCloud((cloudNotes) => {
      setWeatherNotes(cloudNotes);
    });

    return () => {
      unsubFavs();
      unsubSms();
      unsubSettings();
      unsubNotes();
    };
  }, []);

  // Sync theme changes to LocalStorage
  useEffect(() => {
    localStorage.setItem("clima-vento-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Synchronize favorites state
  useEffect(() => {
    localStorage.setItem("clima-vento-favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Periodic automatic fetch every 2 minutes for real-time tracking
  useEffect(() => {
    fetchWeatherData(location.latitude, location.longitude);

    const interval = setInterval(() => {
      fetchWeatherData(location.latitude, location.longitude);
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [location]);

  // Fallback weather generator when network/API fails
  const generateFallbackWeather = (lat: number, lon: number): WeatherData => {
    const today = new Date();
    const currentTemp = Math.round(26 + Math.sin(lat) * 3);
    
    const current = {
      temp: currentTemp,
      feels_like: currentTemp + 2,
      humidity: 75,
      pressure: 1013,
      temp_max: currentTemp + 4,
      temp_min: currentTemp - 4,
      windSpeed: 18,
      windGust: 28,
      windDir: "E",
      windDeg: 90,
      rain1h: 0,
      visibility: 10000,
      weatherCode: 1,
      description: "Parcialmente Nublado",
    };

    const daily = Array.from({ length: 16 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const max = currentTemp + 3 + (i % 3) - 1;
      const min = currentTemp - 4 + (i % 2);
      const code = i % 4 === 0 ? 61 : i % 3 === 0 ? 2 : 1;
      const mainDesc = code === 61 ? "Chuva Fraca" : code === 2 ? "Nublado" : "Parcialmente Nublado";
      return {
        date: dateStr,
        temp_max: max,
        temp_min: min,
        wind_avg: 16 + (i % 5),
        wind_gust_max: 25 + (i % 8),
        wind_deg_common: (90 + i * 15) % 360,
        rain_mm: code === 61 ? 3.5 : 0,
        pop: code === 61 ? 60 : 15,
        weatherCode: code,
        main_desc: mainDesc,
      };
    });

    const hourly = Array.from({ length: 384 }, (_, i) => {
      const hDate = new Date(today);
      hDate.setHours(today.getHours() + i, 0, 0, 0);
      const hourOfDay = hDate.getHours();
      const tempVariation = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI) * 4;
      return {
        time: hDate,
        temp: Math.round(currentTemp + tempVariation),
        humidity: Math.round(70 - tempVariation * 2),
        feels: Math.round(currentTemp + tempVariation + 1),
        wind_speed: Math.round(15 + Math.sin(i / 6) * 6),
        wind_deg: Math.round((90 + i * 5) % 360),
        wind_gust: Math.round(22 + Math.sin(i / 6) * 8),
        pressure: 1013,
        precip_prob: i % 24 > 12 && i % 24 < 18 ? 40 : 10,
        precip: i % 24 === 15 ? 1.2 : 0,
        weatherCode: 1,
      };
    });

    return { current, daily, hourly };
  };

  // Main Weather Loader
  const fetchWeatherData = async (lat: number, lon: number, isForceRefresh: boolean = false) => {
    setLoadingWeather(true);
    setWeatherError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const url = `/api/weather?latitude=${lat}&longitude=${lon}${isForceRefresh ? "&refresh=true&force=true" : ""}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Servidor de meteorologia respondeu com código ${response.status}`);
      }

      const data = await response.json();

      if (data && data.current && data.daily && data.hourly) {
        // Map hourly items
        const hourlyMapped = data.hourly.time.map((time: string, i: number) => ({
          time: new Date(time),
          temp: data.hourly.temperature_2m[i],
          humidity: data.hourly.relative_humidity_2m[i],
          feels: data.hourly.apparent_temperature[i],
          wind_speed: data.hourly.wind_speed_10m[i],
          wind_deg: data.hourly.wind_direction_10m[i],
          wind_gust: data.hourly.wind_gusts_10m[i],
          pressure: data.hourly.pressure_msl[i],
          precip_prob: data.hourly.precipitation_probability[i] || 0,
          precip: data.hourly.precipitation[i] || 0,
          weatherCode: data.hourly.weather_code[i],
        }));

        // Real-time current attributes directly from Open-Meteo
        const cur = data.current;
        const realTemp = cur.temperature_2m;
        // Real Feel directly from Open-Meteo apparent_temperature
        const realFeelsLike = typeof cur.apparent_temperature === "number" ? cur.apparent_temperature : realTemp;
        const rawCode = typeof cur.weather_code === "number" ? cur.weather_code : (data.hourly.weather_code[0] || 0);
        const rainAmt = cur.precipitation ?? cur.rain ?? cur.showers ?? 0;

        // Daily Max / Min directly from Open-Meteo daily forecast for today
        const tempMax = typeof data.daily.temperature_2m_max[0] === "number" ? data.daily.temperature_2m_max[0] : realTemp;
        const tempMin = typeof data.daily.temperature_2m_min[0] === "number" ? data.daily.temperature_2m_min[0] : realTemp;

        // Map current with high precision directly from live Open-Meteo readings
        const currentMapped = {
          temp: realTemp,
          feels_like: realFeelsLike,
          humidity: cur.relative_humidity_2m ?? 70,
          pressure: cur.pressure_msl ?? 1013,
          temp_max: tempMax,
          temp_min: tempMin,
          windSpeed: cur.wind_speed_10m ?? 0,
          windGust: cur.wind_gusts_10m ?? 0,
          windDir: getWindDirectionCode(cur.wind_direction_10m ?? 0),
          windDeg: cur.wind_direction_10m ?? 0,
          rain1h: rainAmt,
          visibility: cur.visibility || 10000,
          weatherCode: rawCode,
          description: getWeatherDescription(rawCode),
        };

        // Map daily 16 days
        const dailyMapped = data.daily.time.map((time: string, i: number) => ({
          date: time,
          temp_max: data.daily.temperature_2m_max[i],
          temp_min: data.daily.temperature_2m_min[i],
          wind_avg: data.daily.wind_speed_10m_max[i],
          wind_gust_max: data.daily.wind_gusts_10m_max[i],
          wind_deg_common: data.daily.wind_direction_10m_dominant[i],
          rain_mm: data.daily.precipitation_sum[i] || 0,
          pop: data.daily.precipitation_probability_max[i] || 0,
          weatherCode: data.daily.weather_code[i],
          main_desc: getWeatherDescription(data.daily.weather_code[i]),
        }));

        const fetchedWeatherData: WeatherData = {
          current: currentMapped,
          daily: dailyMapped,
          hourly: hourlyMapped,
        };

        setWeather(fetchedWeatherData);

        // Current hour mapping
        const currentHour = new Date().getHours();
        setActiveHourIndex(currentHour);

        const nowStr = new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setLastUpdated(nowStr);

        // Cache successful response
        try {
          localStorage.setItem(
            `clima-vento-weather-${lat.toFixed(2)}-${lon.toFixed(2)}`,
            JSON.stringify({
              weather: fetchedWeatherData,
              time: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.warn("Não foi possível salvar em cache local:", e);
        }
      } else {
        throw new Error("Formato de dados inválido da API");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Failed to load meteorological info:", err);

      // Try loading cached weather from localStorage
      const cacheKey = `clima-vento-weather-${lat.toFixed(2)}-${lon.toFixed(2)}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.weather) {
            parsed.weather.hourly = parsed.weather.hourly.map((h: any) => ({
              ...h,
              time: new Date(h.time),
            }));
            setWeather(parsed.weather);
            setWeatherError("Falha de conexão em tempo real. Exibindo dados salvos em cache.");
            return;
          }
        } catch (e) {
          console.warn("Falha ao carregar do cache:", e);
        }
      }

      // If no cache exists, use fallback weather data
      const fallback = generateFallbackWeather(lat, lon);
      setWeather(fallback);
      setWeatherError("Sem conexão com o servidor de meteorologia. Exibindo previsão estimada offline.");
    } finally {
      setLoadingWeather(false);
    }
  };

  // Wind direction degree code converter
  const getWindDirectionCode = (deg: number) => {
    const codes = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
    return codes[Math.round(deg / 22.5) % 16];
  };

  // Helper compass rotation showing where it comes from and where it is going to
  const getFullWindDirectionText = (deg: number) => {
    const codes = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
    const fromIndex = Math.round(deg / 22.5) % 16;
    const toIndex = Math.round((deg + 180) % 360 / 22.5) % 16;
    const fromName = codes[fromIndex];
    const toName = codes[toIndex];
    return `Vem de ${fromName} ➔ vai para ${toName}`;
  };

  // Weather codes mapping description
  const getWeatherDescription = (code: number) => {
    const weatherCodes: { [key: number]: string } = {
      0: "Céu Limpo",
      1: "Parcialmente Nublado",
      2: "Nublado",
      3: "Encoberto",
      45: "Nevoeiro",
      48: "Nevoeiro Gelado",
      51: "Garoa / Chuva Leve",
      53: "Garoa Moderada",
      55: "Garoa Densa",
      61: "Chuva Leve",
      63: "Chuva Moderada",
      65: "Chuva Forte",
      71: "Neve Fraca",
      73: "Neve Moderada",
      75: "Neve Forte",
      80: "Chuvas Fracas",
      81: "Chuvas Moderadas",
      82: "Chuvas Fortes",
      95: "Trovoadas",
      96: "Trovoadas com Granizo Fraco",
      99: "Trovoadas com Granizo Forte",
    };
    return weatherCodes[code] || "Estável";
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

  // Beaufort wind classification helper
  const getBeaufortClassification = (speed: number) => {
    if (speed < 2) return "Calmaria";
    if (speed < 6) return "Bafo de Vento";
    if (speed < 12) return "Brisa Leve";
    if (speed < 20) return "Brisa Fraca";
    if (speed < 29) return "Brisa Moderada";
    if (speed < 39) return "Brisa Forte";
    if (speed < 50) return "Vento Fresco";
    if (speed < 62) return "Vento Forte";
    if (speed < 75) return "Ventania";
    if (speed < 89) return "Ventania Forte";
    if (speed < 103) return "Tempestade";
    if (speed < 118) return "Tempestade Violenta";
    return "Furacão";
  };

  // Search Cities trigger using Open-Meteo Geocoding
  const triggerCitySearch = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=8&language=pt&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Geocoding search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  // GPS trigger
  const triggerGPSGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não oferece suporte à geolocalização por GPS.");
      return;
    }

    setIsGPSLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // Nominatim reverse search to get custom address names like "Jacaroá, Maricá"
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.municipality || "Minha Localização";
            const suburb = addr.suburb || addr.neighbourhood || "";
            const state = addr.state || "";

            const finalName = suburb ? `${suburb}, ${city}` : city;
            setLocation({
              name: finalName,
              latitude,
              longitude,
              state: state,
              country: addr.country || "Brasil",
            });
            setIsGPSActive(true);
          } else {
            setLocation({
              name: "Localização por GPS",
              latitude,
              longitude,
              country: "Brasil",
            });
            setIsGPSActive(true);
          }
        } catch (reverseErr) {
          console.warn("Reverse geocode failed, using generic marker:", reverseErr);
          setLocation({
            name: "Coordenadas GPS",
            latitude,
            longitude,
          });
          setIsGPSActive(true);
        } finally {
          setIsGPSLoading(false);
        }
      },
      (err) => {
        setIsGPSLoading(false);
        console.warn("GPS lookup denied or timeout:", err.message);
        alert(
          "Não conseguimos obter sua localização automaticamente pelo GPS. Permita o sinal de localização no seu dispositivo ou selecione uma cidade favorita."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Manage Favorites
  const toggleFavorite = async () => {
    const isFav = favorites.some(
      (f) =>
        f.latitude.toFixed(4) === location.latitude.toFixed(4) &&
        f.longitude.toFixed(4) === location.longitude.toFixed(4)
    );

    if (isFav) {
      setFavorites(
        favorites.filter(
          (f) =>
            !(
              f.latitude.toFixed(4) === location.latitude.toFixed(4) &&
              f.longitude.toFixed(4) === location.longitude.toFixed(4)
            )
        )
      );
      await removeFavoriteFromCloud(location);
    } else {
      setFavorites([...favorites, location]);
      await addFavoriteToCloud(location);
    }
  };

  const isFavoriteActive = favorites.some(
    (f) =>
      f.latitude.toFixed(4) === location.latitude.toFixed(4) &&
      f.longitude.toFixed(4) === location.longitude.toFixed(4)
  );

  // SMS Simulator Submission
  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsZip.trim()) return;
    setSmsStatus("sending");
    try {
      await addSmsRegistrationToCloud(smsZip);
      setSmsZip("");
      setSmsStatus("success");
      setTimeout(() => setSmsStatus(null), 4000);
    } catch (err) {
      console.error("Erro ao salvar cadastro de SMS:", err);
      setSmsStatus("success"); // fallback gracefully
    }
  };

  const handleRemoveSms = async (identifier: string) => {
    try {
      await removeSmsRegistrationFromCloud(identifier);
    } catch (err) {
      console.error("Erro ao remover cadastro de SMS:", err);
    }
  };

  // Weather Notes handlers (Real-time Cloud Sync)
  const handleAddWeatherNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setIsSubmittingNote(true);
    try {
      await addWeatherNoteToCloud({
        title: noteTitle,
        content: noteContent,
        locationName: location.name,
      });
      setNoteTitle("");
      setNoteContent("");
    } catch (err) {
      console.error("Erro ao salvar relato de clima na nuvem:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteWeatherNote = async (id?: string) => {
    if (!id) return;
    try {
      await deleteWeatherNoteFromCloud(id);
    } catch (err) {
      console.error("Erro ao excluir relato da nuvem:", err);
    }
  };

  // Dynamic Landmark Banners linking to landmarks
  const getLandmarkBannerInfo = () => {
    const name = location.name.toLowerCase();
    
    if (name.includes("rio de janeiro") || name.includes("copacabana") || name.includes("ipanema")) {
      return {
        url: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80",
        credit: "Rio de Janeiro — Cristo Redentor ao Pôr do Sol",
      };
    }
    if (name.includes("maricá") || name.includes("jacaroá") || name.includes("itapeba")) {
      return {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        credit: "Maricá — Orla Costeira e Lagoa de Jacaroá",
      };
    }
    if (name.includes("são paulo") || name.includes("avenida paulista") || name.includes("masp")) {
      return {
        url: "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=1200&q=80",
        credit: "São Paulo — Avenida Paulista no Crepúsculo",
      };
    }

    // Default neutral beautiful landscape
    return {
      url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      credit: "CLIMATOLOGIA — Monitoramento Meteorológico",
    };
  };

  const banner = getLandmarkBannerInfo();

  // Evaluate alerts to warn the user
  const weatherAlerts = [];
  if (weather) {
    const cur = weather.current;
    if (cur.windSpeed > 30) {
      weatherAlerts.push({
        type: "wind",
        title: "Alerta de Vento Forte",
        msg: `Rajadas elevadas de até ${cur.windGust.toFixed(1)} km/h em andamento. Proteja objetos soltos.`,
      });
    }
    if (cur.rain1h > 8) {
      weatherAlerts.push({
        type: "rain",
        title: "Alerta de Chuva Intensa",
        msg: `Precipitação forte acumulando em ${cur.rain1h} mm/h. Risco de alagamentos localizados.`,
      });
    }
    if (cur.temp > 35) {
      weatherAlerts.push({
        type: "heat",
        title: "Alerta de Calor Extremo",
        msg: `Temperatura de ${cur.temp}°C está muito acima da média. Hidrate-se e evite exposição solar direta.`,
      });
    }
  }

  // Pressure evaluations
  const getPressureLabel = (hpa: number) => {
    if (hpa > 1020) return { text: "Alta Pressão (Estável)", colorClass: "text-blue-600 dark:text-blue-400" };
    if (hpa < 1010) return { text: "Baixa Pressão (Instável)", colorClass: "text-red-600 dark:text-red-400" };
    return { text: "Pressão Normal (Estável)", colorClass: "text-emerald-600 dark:text-emerald-400" };
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 font-sans relative ${
        isDark ? "bg-[#000000] text-zinc-100" : "bg-[#FDFCFB] text-[#1F1B16]"
      }`}
    >
      {/* REAL-TIME ATMOSPHERIC WEATHER & DAYTIME PROJECTION BACKGROUND */}
      <DynamicWeatherBackground
        weather={weather}
        cityName={location.name}
        isDark={isDark}
        activeHourIndex={activeHourIndex}
        activeDayIndex={activeDayIndex}
      />

      {/* Container main wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* UPPER NAVIGATION BAR: Search, Geolocation, Theme selector */}
        <header className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          
          {/* Brand/Heading block mimicking Figure 2 Banner */}
          <div className="flex items-center gap-4">
            {/* Bronze/Copper Metallic Logo Badge */}
            <div className="relative p-[1.5px] rounded-[22px] bg-gradient-to-b from-[#dfae84] via-[#9e6b43] to-[#4c2d13] shadow-lg shrink-0">
              <div className="bg-gradient-to-br from-[#b08159] via-[#754b2a] to-[#40230f] w-[64px] h-[64px] rounded-[20px] flex items-center justify-center border border-[#6b3c18]/80 shadow-inner">
                {/* SVG replicating the Sun with 'C' and Wind curls */}
                <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Sun Ring */}
                  <circle cx="34" cy="50" r="14" stroke="#dcd6cd" strokeWidth="4.5" fill="none" />
                  
                  {/* Sun Rays (Stylized) */}
                  <line x1="34" y1="24" x2="34" y2="17" stroke="#dcd6cd" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="34" y1="76" x2="34" y2="83" stroke="#dcd6cd" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="12" y1="50" x2="5" y2="50" stroke="#dcd6cd" strokeWidth="4.5" strokeLinecap="round" />
                  
                  <line x1="21" y1="37" x2="16" y2="32" stroke="#dcd6cd" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="21" y1="63" x2="16" y2="68" stroke="#dcd6cd" strokeWidth="4.5" strokeLinecap="round" />
                  
                  <line x1="47" y1="37" x2="52" y2="32" stroke="#dcd6cd" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="47" y1="63" x2="52" y2="68" stroke="#dcd6cd" strokeWidth="4.5" strokeLinecap="round" />
                  
                  {/* Letter C in Sun center */}
                  <path d="M40 44 C35 39, 27 41, 27 50 C27 59, 35 61, 40 56" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                  
                  {/* Wind curls (Metallic gold/bronze) blowing to the right */}
                  <path d="M48 45 H74 C79 45, 82 41, 79 38 C76 35, 71 39, 74 42 C76 44, 79 43, 81 41" stroke="#eab308" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <path d="M50 53 H78 C83 53, 86 57, 83 60 C80 63, 76 59, 79 56 C81 53, 84 54, 86 56" stroke="#eab308" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <path d="M46 61 H64 C67 61, 69 63, 67 65 C65 67, 62 65, 64 62" stroke="#eab308" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            </div>
            
            {/* Title & Subtitle block styled after Figure 2 */}
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black tracking-wider uppercase bg-gradient-to-r from-sky-400 via-blue-500 to-sky-300 bg-clip-text text-transparent drop-shadow-sm leading-none">
                CLIMATOLOGIA
              </h1>
              <div className="flex flex-col gap-0.5 mt-1.5">
                <p className="text-[9px] md:text-[10px] font-extrabold tracking-wider text-zinc-400 dark:text-zinc-300 uppercase leading-none">
                  Dados Reais • Gráficos • Ventogiados
                </p>
                <p className="text-[9px] md:text-[10px] font-extrabold tracking-wider text-sky-500 dark:text-sky-400 uppercase leading-none flex items-center gap-1 mt-0.5">
                  <Wind className="w-2.5 h-2.5 inline-block shrink-0 animate-pulse" /> Ventos Animados Windy • Gemini AI
                </p>
              </div>
            </div>
          </div>

          {/* Search bar + Controls combo */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            
            {/* Real city geocoding search input */}
            <div className="relative flex-1 sm:w-80">
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-inner ${
                  isDark ? "bg-[#111111] border-zinc-800 text-white" : "bg-[#F4F0E6] border-[#E7E1D1] text-[#1F1B16]"
                }`}
              >
                <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar município..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length > 2) {
                      triggerCitySearch(e.target.value);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-zinc-500/85"
                />
              </div>

              {/* Geocoding result dropdown list */}
              {searchResults.length > 0 && (
                <div
                  className={`absolute left-0 right-0 mt-2 rounded-2xl border shadow-xl z-[1500] max-h-60 overflow-y-auto ${
                    isDark ? "bg-[#161616] border-zinc-800" : "bg-white border-[#E7E1D1]"
                  }`}
                >
                  {searchResults.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => {
                        const newLoc = {
                          name: `${res.name}${res.admin2 ? `, ${res.admin2}` : ""}`,
                          latitude: res.latitude,
                          longitude: res.longitude,
                          state: res.admin1,
                          country: res.country,
                        };
                        setLocation(newLoc);
                        setIsGPSActive(false);
                        setSearchQuery("");
                        setSearchResults([]);
                        saveSettingsToCloud({ isDark, activeLocation: newLoc });
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold border-b last:border-none flex flex-col gap-0.5 ${
                        isDark
                          ? "border-zinc-800 hover:bg-zinc-900 text-zinc-200"
                          : "border-[#E7E1D1]/40 hover:bg-[#F4F0E6] text-[#1F1B16]"
                      }`}
                    >
                      <span className="font-extrabold text-white">{res.name}</span>
                      <span className="text-[10px] text-zinc-500 truncate">
                        {[res.admin2, res.admin1, res.country].filter(Boolean).join(", ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Controls button block */}
            <div className="flex gap-2 shrink-0">
              {/* PWA Install app button */}
              <button
                onClick={() => {
                  if (pwaInstallPrompt) {
                    pwaInstallPrompt.prompt();
                    pwaInstallPrompt.userChoice.then((choiceResult: any) => {
                      if (choiceResult && choiceResult.outcome === "accepted") {
                        setIsPwaInstalled(true);
                      }
                      setPwaInstallPrompt(null);
                    });
                  } else {
                    setShowPwaModal(true);
                  }
                }}
                className={`px-3 py-2 rounded-full border shadow-sm transition-all flex items-center gap-1.5 text-xs font-black select-none ${
                  isPwaInstalled
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                    : "bg-[#E2725B] border-[#c85a43] text-white hover:bg-[#d0614b] animate-pulse"
                }`}
                title="Adicionar Climavento à Tela Inicial do Celular"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {isPwaInstalled ? "App Instalado" : "Instalar no Celular"}
                </span>
              </button>

              {/* GPS Geolocation dial */}
              <button
                onClick={triggerGPSGeolocation}
                className={`p-3 rounded-full border shadow-sm transition-all flex items-center justify-center ${
                  isDark
                    ? "bg-[#111111] border-zinc-800 text-yellow-500 hover:bg-zinc-900"
                    : "bg-[#F4F0E6] border-[#E7E1D1] text-[#6E5D0E] hover:bg-[#E7E1D1]"
                }`}
                title="Detectar Localização via GPS"
              >
                <Navigation className="w-4 h-4" />
              </button>

              {/* Favorite toggle dial */}
              <button
                onClick={toggleFavorite}
                className={`p-3 rounded-full border shadow-sm transition-all flex items-center justify-center ${
                  isDark
                    ? "bg-[#111111] border-zinc-800 text-amber-500 hover:bg-zinc-900"
                    : "bg-[#F4F0E6] border-[#E7E1D1] text-amber-600 hover:bg-[#E7E1D1]"
                }`}
                title={isFavoriteActive ? "Remover de Favoritos" : "Favoritar Cidade"}
              >
                {isFavoriteActive ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
              </button>

              {/* Theme toggle controller */}
              <button
                onClick={() => {
                  const nextDark = !isDark;
                  setIsDark(nextDark);
                  saveSettingsToCloud({ isDark: nextDark, activeLocation: location });
                }}
                className={`p-3 rounded-full border shadow-sm transition-all flex items-center justify-center ${
                  isDark
                    ? "bg-[#111111] border-zinc-800 text-yellow-400 hover:bg-zinc-900"
                    : "bg-[#F4F0E6] border-[#E7E1D1] text-[#1F1B16] hover:bg-[#E7E1D1]"
                }`}
                title={isDark ? "Modo Claro (Tons Naturais)" : "Modo Escuro (Midnight)"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* CLOUD PRESETS / FAVORITES BAR */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7E7667] dark:text-zinc-400 select-none">
              Favoritos:
            </span>
            <div className="flex gap-2">
              {favorites.map((fav, i) => {
                const isActive =
                  fav.latitude.toFixed(4) === location.latitude.toFixed(4) &&
                  fav.longitude.toFixed(4) === location.longitude.toFixed(4);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setLocation(fav);
                      setIsGPSActive(false);
                      saveSettingsToCloud({ isDark, activeLocation: fav });
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all border shadow-sm select-none shrink-0 ${
                      isActive
                        ? "bg-[#6E5D0E] border-[#8C7714] text-white font-extrabold"
                        : isDark
                        ? "bg-[#111111] border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                        : "bg-[#F4F0E6] border-[#E7E1D1] text-[#1F1B16] hover:bg-[#E7E1D1]"
                    }`}
                  >
                    📍 {fav.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Critical Weather Alerts */}
        {weatherAlerts.length > 0 && (
          <div className="space-y-2">
            {weatherAlerts.map((al, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-4 border flex items-start gap-3 bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200 animate-pulse"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm">{al.title}</h4>
                  <p className="text-xs mt-0.5 leading-snug font-medium opacity-90">{al.msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLIMATE HEADER CONTAINER (Landmark Banner & Quick details) */}
        <section
          className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden min-h-[160px] sm:min-h-[180px] md:min-h-[220px] flex items-end p-4 sm:p-6 md:p-8 shadow-md border"
          style={{ borderColor: isDark ? "#27272a" : "#E7E1D1" }}
        >
          {/* Image backplate with absolute scrim shadow */}
          <img
            src={banner.url}
            referrerPolicy="no-referrer"
            alt="Cidade selecionada"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Banner content */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-3 sm:gap-4 text-white">
            <div className="space-y-1 w-full md:w-auto">
              <span className="text-[10px] uppercase font-black bg-[#E2725B] text-white px-2.5 py-1 rounded-md tracking-widest shadow-sm select-none inline-block">
                Monitoramento Ativo
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-md flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block shrink-0" />
                <span className="truncate">{location.name}</span>
              </h2>
              <p className="text-[11px] sm:text-xs font-semibold opacity-90 leading-tight">
                {location.state ? `${location.state}, ` : ""}
                {location.country || "Brasil"} · GPS: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
              <p className="text-[9px] text-white/60 italic leading-none pt-0.5 truncate">Imagem: {banner.credit}</p>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-3 sm:gap-4 shrink-0 bg-black/40 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/10 shadow-lg w-full md:w-auto justify-between md:justify-start">
              {weather && (
                <div className="text-center pr-3 sm:pr-4 border-r border-white/15 flex-1 md:flex-none">
                  <span className="block text-[9px] sm:text-[10px] text-white/70 font-bold uppercase tracking-wider">Clima Atual</span>
                  <span className="text-xs sm:text-sm font-black text-white flex items-center justify-center gap-1">
                    {Math.round(weather.current.temp)}°C
                  </span>
                  <span className="block text-[8px] sm:text-[9px] font-bold mt-0.5 text-amber-400">
                    Sensação: {weather.current.feels_like.toFixed(1)}°C
                  </span>
                </div>
              )}
              <div className="text-center pr-3 sm:pr-4 border-r border-white/15 flex-1 md:flex-none">
                <span className="block text-[9px] sm:text-[10px] text-white/70 font-bold uppercase tracking-wider">Última Att</span>
                <span className="text-xs sm:text-sm font-black text-[#EAB308]">
                  {lastUpdated ? `🔄 ${lastUpdated}` : "Sincronizando"}
                </span>
                <span className="block text-[8px] sm:text-[9px] text-white/50 leading-none mt-0.5">A cada 30 min</span>
              </div>
              {weather && (
                <div className="text-center flex-1 md:flex-none">
                  <span className="block text-[9px] sm:text-[10px] text-white/70 font-bold uppercase tracking-wider">Pressão Atmosférica</span>
                  <span className="text-xs sm:text-sm font-black text-white">{weather.current.pressure} hPa</span>
                  <span className={`block text-[8px] sm:text-[9px] font-bold mt-0.5 ${getPressureLabel(weather.current.pressure).colorClass}`}>
                    {getPressureLabel(weather.current.pressure).text}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CARD 2: CLIMA ATUAL, LINHA DO TEMPO DIÁRIA E PREVISÃO DIÁRIA */}
        {weather && (
          <div className="space-y-6">
            <div
              className={`relative overflow-hidden rounded-[32px] p-6 border transition-all duration-300 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 ${
                isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
              }`}
            >
              {/* Dynamic Ultra-realistic Weather Background with blur & fade */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <img
                  src={getWeatherBgImage(weather.current.weatherCode, new Date())}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-35 dark:opacity-20 transition-all duration-700 scale-105"
                />
                {/* Frosted glass/blur layer - blends into card for ultra-premium aesthetic */}
                <div className="absolute inset-0 backdrop-blur-[10px] bg-white/10 dark:bg-black/20" />
                
                {/* Advanced Multi-directional fade so image softens seamlessly at the card's boundaries */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/75 to-transparent dark:from-[#111111] dark:via-[#111111]/70" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/40 dark:via-[#111111]/10 dark:to-[#111111]/40" />
              </div>

              {/* Highlight Big Temp & Real Feel */}
              <div className="relative z-10 md:col-span-1 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E7E1D1]/40 dark:border-zinc-800 pb-4 md:pb-0 pr-0 md:pr-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider">
                        Clima Atual
                      </span>
                    </div>
                    {/* Manual Refresh Button */}
                    <button
                      onClick={() => fetchWeatherData(location.latitude, location.longitude, true)}
                      disabled={loadingWeather}
                      className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer disabled:opacity-50"
                      title="Atualizar dados de clima agora"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingWeather ? "animate-spin text-sky-500" : ""}`} />
                      <span>{loadingWeather ? "Atualizando..." : "Atualizar"}</span>
                    </button>
                  </div>

                  <span className="block text-[11px] font-black text-[#E2725B] mt-1.5">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
                  </span>

                  <div className="flex items-start mt-2">
                    <span className="text-6xl md:text-7xl font-black text-[#1F1B16] dark:text-white leading-none">
                      {Math.round(weather.current.temp)}°
                    </span>
                    <span className="text-2xl font-black text-[#E2725B] mt-1">C</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-sm sm:text-base font-black text-[#E2725B] capitalize block leading-tight">
                    {weather.current.description}
                  </span>

                  {/* Real Feel / Sensação Térmica Highlight Box */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-black shadow-xs">
                    <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Sensação Térmica: <strong className="text-sm font-extrabold">{weather.current.feels_like.toFixed(1)}°C</strong></span>
                  </div>

                  {lastUpdated && (
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-semibold pt-0.5">
                      ⏱️ Atualizado em tempo real às {lastUpdated}
                    </span>
                  )}
                </div>
              </div>

              {/* Submetrics Grid */}
              <div className="relative z-10 md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Máx / Mín */}
                <div className="p-3.5 rounded-[20px] bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 dark:border-rose-500/20 leading-tight transition-all hover:scale-[1.02] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-rose-700 dark:text-rose-400">
                    <Thermometer className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="block text-[10px] font-black uppercase tracking-wider">Máx / Mín</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1 font-extrabold">
                    <span className="text-sm font-black text-red-500 flex items-center gap-1">
                      <ArrowUp className="w-4 h-4 text-red-500 shrink-0" /> {Math.round(weather.current.temp_max)}°C
                    </span>
                    <span className="text-sm font-black text-blue-500 flex items-center gap-1">
                      <ArrowDown className="w-4 h-4 text-blue-500 shrink-0" /> {Math.round(weather.current.temp_min)}°C
                    </span>
                  </div>
                </div>

                {/* Umidade */}
                <div className="p-3.5 rounded-[20px] bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/15 dark:border-sky-500/20 leading-tight transition-all hover:scale-[1.02] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-sky-700 dark:text-sky-400">
                    <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className="block text-[10px] font-black uppercase tracking-wider">Umidade</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-sky-600 dark:text-sky-300">
                      {weather.current.humidity}%
                    </span>
                    <span className="block text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-none">
                      Umidade do ar
                    </span>
                  </div>
                </div>

                {/* Visibilidade */}
                <div className="p-3.5 rounded-[20px] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 dark:border-indigo-500/20 leading-tight transition-all hover:scale-[1.02] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-indigo-700 dark:text-indigo-400">
                    <Eye className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="block text-[10px] font-black uppercase tracking-wider">Visibilidade</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-300">
                      {(weather.current.visibility / 1000).toFixed(1)} km
                    </span>
                    <span className="block text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-none">
                      Alcance visual
                    </span>
                  </div>
                </div>

                {/* Vento Médio */}
                <div className="p-3.5 rounded-[20px] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 dark:border-emerald-500/20 leading-tight transition-all hover:scale-[1.02] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-emerald-700 dark:text-emerald-400">
                    <Wind className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="block text-[10px] font-black uppercase tracking-wider">Vento Médio</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {weather.current.windSpeed.toFixed(1)} km/h
                    </span>
                    <span className="block text-[9px] font-bold text-[#7E7667] dark:text-zinc-400 mt-0.5 leading-normal">
                      {getFullWindDirectionText(weather.current.windDeg)} ({weather.current.windDeg}°)
                    </span>
                  </div>
                </div>

                {/* Rajada Máxima */}
                <div className="p-3.5 rounded-[20px] bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 dark:border-amber-500/20 leading-tight transition-all hover:scale-[1.02] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-amber-700 dark:text-amber-400">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="block text-[10px] font-black uppercase tracking-wider">Rajada Máx</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-amber-600 dark:text-amber-300">
                      {weather.current.windGust.toFixed(1)} km/h
                    </span>
                    <span className="block text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded-md mt-1 w-fit leading-none">
                      {getBeaufortClassification(weather.current.windGust)}
                    </span>
                  </div>
                </div>

                {/* Chuva Hoje */}
                <div className="p-3.5 rounded-[20px] bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15 dark:border-blue-500/20 leading-tight transition-all hover:scale-[1.02] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-blue-700 dark:text-blue-400">
                    <CloudRain className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="block text-[10px] font-black uppercase tracking-wider">Chuva Hoje</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-blue-600 dark:text-blue-300">
                      {(weather.daily[0]?.rain_mm || 0).toFixed(1)} mm
                    </span>
                    <span className="block text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-none">
                      Precipitação esperada
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDER HOUR TIMELINE CARD (COLLAPSIBLE) */}
            <div
              className={`rounded-[24px] sm:rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden ${
                isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
              }`}
            >
              <button
                onClick={() => setIsTimelineExpanded((prev) => !prev)}
                className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="font-black text-sm sm:text-base text-[#1F1B16] dark:text-white truncate">
                      Linha do Tempo Diária (Hora em Hora)
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                      Variação horária de temperatura, vento e chuva para o dia selecionado
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md hidden md:inline-block">
                    {isTimelineExpanded ? "Expandido" : "Recolhido"}
                  </span>
                  {isTimelineExpanded ? (
                    <ChevronUp className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
              </button>

              {isTimelineExpanded && (
                <div className="p-5 sm:p-6 pt-0 border-t border-zinc-200/50 dark:border-zinc-800/80 transition-all">
                  <ForecastTimeline
                    hourly={weather.hourly}
                    activeDayIndex={activeDayIndex}
                    setActiveDayIndex={setActiveDayIndex}
                    activeHourIndex={activeHourIndex}
                    setActiveHourIndex={setActiveHourIndex}
                    isDark={isDark}
                  />
                </div>
              )}
            </div>

            {/* 16 DAYS HORIZONTAL LIST (COLLAPSIBLE) */}
            <div
              className={`rounded-[24px] sm:rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden ${
                isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
              }`}
            >
              <button
                onClick={() => setIsForecastListExpanded((prev) => !prev)}
                className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-[#E2725B]/10 text-[#E2725B] border border-[#E2725B]/20 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="font-black text-sm sm:text-base text-[#1F1B16] dark:text-white truncate">
                      Previsão para 16 Dias (Calendário Ampliado)
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                      Tendência de temperatura, probabilidade de chuva e máxima de rajadas de vento
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#E2725B] bg-[#E2725B]/10 px-2.5 py-1 rounded-md hidden md:inline-block">
                    {isForecastListExpanded ? "Expandido" : "Recolhido"}
                  </span>
                  {isForecastListExpanded ? (
                    <ChevronUp className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
              </button>

              {isForecastListExpanded && (
                <div className="p-5 sm:p-6 pt-0 border-t border-zinc-200/50 dark:border-zinc-800/80 transition-all">
                  <ForecastList
                    days={weather.daily}
                    activeDayIndex={activeDayIndex}
                    setActiveDayIndex={setActiveDayIndex}
                    isDark={isDark}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONNECTION / CACHE ALERT BANNER */}
        {weatherError && (
          <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 animate-pulse" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Aviso de Conexão Meteorológica</p>
                <p className="text-xs opacity-90">{weatherError}</p>
              </div>
            </div>
            <button
              onClick={() => fetchWeatherData(location.latitude, location.longitude)}
              disabled={loadingWeather}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 shrink-0 select-none cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? "animate-spin" : ""}`} />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* LOADING WEATHER STATE */}
        {loadingWeather && !weather && (
          <div className="rounded-[32px] p-12 text-center border bg-white/5 border-dashed flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#E2725B] animate-spin" />
            <p className="text-sm font-extrabold text-[#7E7667]">Carregando previsão meteorológica completa...</p>
          </div>
        )}

        {/* CIVIL DEFENSE OFFICIAL EMERGENCY ALERT BANNER (COLLAPSIBLE) */}
        <div
          className={`rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
            isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
          }`}
        >
          <button
            onClick={() => setIsCivilDefenseExpanded((prev) => !prev)}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30 shrink-0">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <h3 className="font-black text-xs sm:text-sm text-[#1F1B16] dark:text-white truncate">
                    Alerta Oficial da Defesa Civil & Estágios Operacionais
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    Estágio 1 · Normalidade
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                  Radar meteorológico Alerta Rio, GPS e mapa de radares
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 hidden md:inline-block">
                {isCivilDefenseExpanded ? "Recolher Painel" : "Ver Alertas (Expandir)"}
              </span>
              {isCivilDefenseExpanded ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </div>
          </button>

          {isCivilDefenseExpanded && (
            <div className="p-3.5 sm:p-4 pt-0 border-t border-zinc-200/50 dark:border-zinc-800/80 transition-all">
              <CivilDefenseAlertBanner
                cityName={location.name}
                isDark={isDark}
                currentWindSpeed={weather ? weather.current.windSpeed : 28}
                currentWindGust={weather ? weather.current.windGust : 72}
                onTriggerGPS={triggerGPSGeolocation}
                isGPSActive={isGPSActive}
                isGPSLoading={isGPSLoading}
              />
            </div>
          )}
        </div>

        {/* CITY IMPACT & RISK PREDICTION PANEL (COLLAPSIBLE) */}
        {weather && (
          <div
            className={`rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
              isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
            }`}
          >
            <button
              onClick={() => setIsCityImpactsExpanded((prev) => !prev)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h3 className="font-black text-xs sm:text-sm text-[#1F1B16] dark:text-white truncate">
                      Previsão de Impactos Urbanos na Cidade
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                      4 Indicadores de Risco
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                    Risco Enel (Energia), Queda de Árvores, Destelhamento e Ressaca
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 hidden md:inline-block">
                  {isCityImpactsExpanded ? "Recolher Painel" : "Ver Impactos (Expandir)"}
                </span>
                {isCityImpactsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </div>
            </button>

            {isCityImpactsExpanded && (
              <div className="p-3.5 sm:p-4 pt-0 border-t border-zinc-200/50 dark:border-zinc-800/80 transition-all">
                <CityImpactPanel
                  windSpeed={weather.current.windSpeed}
                  windGust={weather.current.windGust}
                  rainSum={weather.daily[0]?.rain_mm || 0}
                  cityName={location.name}
                  isDark={isDark}
                />
              </div>
            )}
          </div>
        )}

        {/* MAIN METEOROLOGICAL BLOCKS */}
        {weather && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT/CENTER DOUBLE COLUMN: Map, Beaufort, AI and Timeline */}
            <div className="lg:col-span-2 space-y-6">

              {/* MAP COMPONENT IN MAP GRID */}
              <WeatherMap
                lat={location.latitude}
                lon={location.longitude}
                current={weather.current}
                hourly={weather.hourly}
                isDark={isDark}
                cityName={location.name}
                daily={weather.daily}
                activeDayIndex={activeDayIndex}
                setActiveDayIndex={setActiveDayIndex}
              />

              {/* INTERACTIVE COMPASS WIND CANVAS CHART (COLLAPSIBLE) */}
              <div
                className={`rounded-[24px] sm:rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden ${
                  isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
                }`}
              >
                <button
                  onClick={() => setIsWindChartExpanded((prev) => !prev)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-500 border border-teal-500/20 shrink-0">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-black text-sm sm:text-base text-[#1F1B16] dark:text-white truncate">
                        Rosa dos Ventos e Gráfico Interativo
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                        Bússola de orientação das rajadas e direção dominante
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md hidden md:inline-block">
                      {isWindChartExpanded ? "Expandido" : "Recolhido"}
                    </span>
                    {isWindChartExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isWindChartExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-zinc-200/50 dark:border-zinc-800/80 transition-all">
                    <WindChart forecastDays={weather.daily} hourly={weather.hourly} isDark={isDark} />
                  </div>
                )}
              </div>

              {/* BEAUFORT scale reference (COLLAPSIBLE) */}
              <div
                className={`rounded-[24px] sm:rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden ${
                  isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
                }`}
              >
                <button
                  onClick={() => setIsBeaufortExpanded((prev) => !prev)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-black text-sm sm:text-base text-[#1F1B16] dark:text-white truncate">
                        Escala de Beaufort (Força dos Ventos)
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                        Classificação científica da intensidade do vento e efeitos em terra e mar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md hidden md:inline-block">
                      {isBeaufortExpanded ? "Expandido" : "Recolhido"}
                    </span>
                    {isBeaufortExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isBeaufortExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-zinc-200/50 dark:border-zinc-800/80 transition-all">
                    <BeaufortScale currentWindSpeedKmh={weather.current.windSpeed} isDark={isDark} />
                  </div>
                )}
              </div>

              {/* DEDICATED SEA WATER TEMPERATURE, SAFETY FLAGS & NEARBY BEACHES CARD (COLLAPSIBLE) */}
              <div
                className={`rounded-[24px] sm:rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden ${
                  isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
                }`}
              >
                <button
                  onClick={() => setIsBeachSeaExpanded((prev) => !prev)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                      <Waves className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-black text-sm sm:text-base text-[#1F1B16] dark:text-white truncate">
                        Condições de Balneabilidade & Temperatura do Mar
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                        Temperatura da água, praias próximas e bandeiras de segurança marítima
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md hidden md:inline-block">
                      {isBeachSeaExpanded ? "Expandido" : "Recolhido"}
                    </span>
                    {isBeachSeaExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isBeachSeaExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-zinc-200/50 dark:border-zinc-800/80 transition-all">
                    <BeachSeaCard
                      locationName={location.name}
                      latitude={location.latitude}
                      longitude={location.longitude}
                      current={weather.current}
                      daily={weather.daily}
                      activeDayIndex={activeDayIndex}
                      setActiveDayIndex={setActiveDayIndex}
                      isDark={isDark}
                    />
                  </div>
                )}
              </div>


            </div>

            {/* RIGHT SIDEBAR COLUMN: Gemini AI Climate Assistant & Civil Defense & SMS zipcode tool */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Intelligent AI Assistant Card (COLLAPSIBLE) */}
              <div
                className={`rounded-[24px] sm:rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden ${
                  isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
                }`}
              >
                <button
                  onClick={() => setIsGeminiAssistantExpanded((prev) => !prev)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-black text-sm sm:text-base text-[#1F1B16] dark:text-white truncate">
                        Assistente Climático Gemini AI
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                        Análise de riscos baseada em IA e respostas para dúvidas locais
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md hidden md:inline-block">
                      {isGeminiAssistantExpanded ? "Expandido" : "Recolhido"}
                    </span>
                    {isGeminiAssistantExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isGeminiAssistantExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-zinc-200/50 dark:border-zinc-800/80 transition-all">
                    <GeminiAssistant
                      locationName={location.name}
                      current={weather.current}
                      dailyForecasts={weather.daily}
                      isDark={isDark}
                    />
                  </div>
                )}
              </div>

              {/* OFFICIAL CIVIL DEFENSE CONTACT CHANNELS (COLLAPSIBLE) */}
              <div
                className={`rounded-[24px] sm:rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden ${
                  isDark ? "bg-[#111111] border-zinc-800 text-zinc-100" : "bg-[#F4F9F2] border-[#E0EFE0]"
                }`}
              >
                <button
                  onClick={() => setIsCivilDefenseChannelsExpanded((prev) => !prev)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-emerald-600/10 text-emerald-700 border border-emerald-500/20 shrink-0">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-black text-sm sm:text-base text-emerald-900 dark:text-emerald-100 truncate">
                        Canais Oficiais da Defesa Civil
                      </h3>
                      <p className="text-[11px] sm:text-xs text-emerald-700/80 dark:text-emerald-300/80 font-medium truncate mt-0.5">
                        Contatos diretos para apoio, alertas e cadastro de CEP no 40199
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md hidden md:inline-block">
                      {isCivilDefenseChannelsExpanded ? "Expandido" : "Recolhido"}
                    </span>
                    {isCivilDefenseChannelsExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isCivilDefenseChannelsExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-[#E7E1D1]/30 dark:border-zinc-800/60 space-y-4">
                    <div className="flex flex-col gap-2.5">
                      {/* WhatsApp contact dial */}
                      <a
                        href="https://wa.me/556120344611?text=Oi"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs tracking-wide transition-all shadow-md select-none"
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 fill-current" />
                          📱 WhatsApp Nacional: (61) 2034-4611
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* S2iD Federal System Link */}
                      <a
                        href="https://s2id.mi.gov.br/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wide transition-all shadow-md select-none"
                      >
                        <span>🌐 Portal S2iD Federal (Desastres)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* SMS 40199 Zipcode Alert subscription simulator */}
                    <div className="border-t border-[#E7E1D1]/30 dark:border-zinc-800/60 pt-4 mt-2">
                      <p className="text-[11px] font-extrabold text-[#7E7667] dark:text-zinc-300 uppercase tracking-wider mb-2">
                        💬 SMS Nacional 40199 (Cadastro)
                      </p>
                      <form onSubmit={handleSmsSubmit} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Seu CEP (ex: 24900-000)"
                          value={smsZip}
                          onChange={(e) => setSmsZip(e.target.value)}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                            isDark ? "bg-[#1A1A1A] border-zinc-800 text-white" : "bg-white border-[#E7E1D1]"
                          }`}
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-[#E2725B] hover:bg-[#D15F47] text-white font-black text-xs transition-colors shadow-sm"
                        >
                          Enviar
                        </button>
                      </form>

                      {/* Simulator feedback status */}
                      {smsStatus === "sending" && (
                        <p className="text-[10px] text-gray-500 mt-1 animate-pulse">Submetendo cadastro de CEP ao 40199...</p>
                      )}
                      {smsStatus === "success" && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                          ✅ Simulação Completa! Cadastro de alertas para o CEP {smsZip} enviado ao SMS 40199.
                        </p>
                      )}

                      {/* Cloud registered CEP list */}
                      {smsRegistrations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#E7E1D1]/20 dark:border-zinc-800/40">
                          <p className="text-[9px] font-extrabold text-[#7E7667] dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              CEPs na Nuvem ({smsRegistrations.length}):
                            </span>
                            <span className="text-[8px] opacity-70">Sincronizado via Firebase</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-thin font-bold">
                            {smsRegistrations.map((reg, idx) => (
                              <span
                                key={reg.id || idx}
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide flex items-center gap-1 ${
                                  isDark
                                    ? "bg-zinc-900 border border-zinc-800 text-zinc-300"
                                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700"
                                }`}
                              >
                                <span>{reg.zipcode}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSms(reg.id || reg.zipcode)}
                                  className="text-red-500 hover:text-red-700 ml-0.5 font-bold cursor-pointer"
                                  title="Remover CEP da Nuvem"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[9px] text-[#7E7667] dark:text-zinc-400 mt-2 italic leading-relaxed">
                        * No celular real, basta enviar um SMS gratuito com o seu CEP para o número 40199 para se registrar.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* RELATOS E ANOTAÇÕES DE CAMPO (SINCRONIZADO NA NUVEM) (COLLAPSIBLE) */}
              <div
                className={`rounded-[24px] sm:rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden ${
                  isDark ? "bg-[#111111] border-zinc-800 text-zinc-100" : "bg-[#FAF7F2] border-[#E7E1D1]"
                }`}
              >
                <button
                  onClick={() => setIsWeatherNotesExpanded((prev) => !prev)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-all select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-black text-sm sm:text-base text-[#1F1B16] dark:text-white truncate">
                        Anotações do Usuário (Nuvem em Tempo Real)
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                        Relatos sincronizados instantaneamente entre seus dispositivos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md hidden md:inline-block">
                      {isWeatherNotesExpanded ? "Expandido" : "Recolhido"}
                    </span>
                    {isWeatherNotesExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isWeatherNotesExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-[#E7E1D1]/30 dark:border-zinc-800/60 space-y-4">
                    {/* Form to add note */}
                    <form onSubmit={handleAddWeatherNote} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Título da observação (ex: Vento forte no Pontal)"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                          isDark ? "bg-[#1A1A1A] border-zinc-800 text-white" : "bg-white border-[#E7E1D1]"
                        }`}
                      />
                      <textarea
                        placeholder="Detalhes (ex: Rajadas levantando areia na praia das 14h às 16h...)"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={2}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                          isDark ? "bg-[#1A1A1A] border-zinc-800 text-white" : "bg-white border-[#E7E1D1]"
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingNote}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{isSubmittingNote ? "Salvando na Nuvem..." : "➕ Publicar Relato na Nuvem"}</span>
                      </button>
                    </form>

                    {/* Weather notes list */}
                    {weatherNotes.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pt-2 border-t border-[#E7E1D1]/30 dark:border-zinc-800/60">
                        {weatherNotes.map((note) => (
                          <div
                            key={note.id}
                            className={`p-3 rounded-2xl border text-xs space-y-1 relative group ${
                              isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-[#E7E1D1]"
                            }`}
                          >
                            <div className="flex items-center justify-between pr-5">
                              <h4 className="font-extrabold text-amber-500 dark:text-amber-400">
                                {note.title}
                              </h4>
                              <span className="text-[9px] text-zinc-500">
                                {note.locationName}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-90 leading-relaxed font-medium">
                              {note.content}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleDeleteWeatherNote(note.id)}
                              className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-red-500 font-bold text-xs"
                              title="Deletar da nuvem"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic text-center py-2">
                        Nenhum relato gravado ainda. Crie uma nota acima e ela aparecerá automaticamente em todos os seus dispositivos.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic notification card info explaining Twilio API setups */}
              <div
                className={`rounded-[32px] p-4 border text-[11px] leading-relaxed font-semibold text-[#7E7667] dark:text-zinc-400 ${
                  isDark ? "bg-[#111111] border-zinc-800" : "bg-[#FDF8F5] border-[#F0DED5]"
                }`}
              >
                🔔 As notificações do navegador estão ativas no app. Todas as suas cidades favoritas, tema e relatos estão salvos no Firebase Cloud e sincronizam em tempo real no Android e no Navegador.
              </div>
            </div>

          </div>
        )}

        {/* PWA INSTALLATION GUIDE MODAL */}
        {showPwaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div
              className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
                isDark ? "bg-[#141414] border-zinc-800 text-white" : "bg-white border-[#E7E1D1] text-[#1F1B16]"
              }`}
            >
              <button
                onClick={() => setShowPwaModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-500/10 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#E2725B]/15 text-[#E2725B] border border-[#E2725B]/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base">Instalar Climavento</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Adicione à tela inicial para usar como um app nativo no celular
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs leading-relaxed">
                {/* Android / Chrome instructions */}
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                  <span className="font-black text-sky-600 dark:text-sky-400 block uppercase tracking-wider text-[10px]">
                    📱 No Android (Chrome / Samsung Internet)
                  </span>
                  <ol className="list-decimal list-inside space-y-1 font-semibold text-zinc-700 dark:text-zinc-300">
                    <li>Toque no menu de três pontos <strong>(⋮)</strong> no canto superior direito.</li>
                    <li>Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</li>
                    <li>Confirme e o ícone do Climavento aparecerá junto com seus outros apps!</li>
                  </ol>
                </div>

                {/* iOS / Safari instructions */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="font-black text-amber-600 dark:text-amber-400 block uppercase tracking-wider text-[10px]">
                    🍏 No iPhone / iPad (Safari)
                  </span>
                  <ol className="list-decimal list-inside space-y-1 font-semibold text-zinc-700 dark:text-zinc-300">
                    <li>Toque no botão <strong>Compartilhar <Share2 className="w-3.5 h-3.5 inline ml-0.5" /></strong> na barra inferior.</li>
                    <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                    <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={() => setShowPwaModal(false)}
                className="w-full py-3 rounded-2xl bg-[#E2725B] hover:bg-[#d0614b] text-white font-black text-xs transition-colors shadow-lg cursor-pointer"
              >
                Entendi!
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
