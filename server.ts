import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Weather Caching Proxy to bypass browser iframe CORS restrictions & shared IP rate-limiting
const weatherCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1 * 60 * 1000; // 1 minute cache for real-time accuracy

app.get("/api/weather", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const { latitude, longitude, refresh, force } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Parâmetros latitude e longitude são obrigatórios." });
  }

  const lat = parseFloat(latitude as string);
  const lon = parseFloat(longitude as string);
  
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: "Latitude e longitude devem ser números válidos." });
  }

  const isForceRefresh = refresh === "true" || force === "true";
  const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);

  if (!isForceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache Hit] Serving fresh weather for ${cacheKey}`);
    return res.json(cached.data);
  }

  const base = "https://api.open-meteo.com/v1/forecast";
  const params = `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,precipitation,rain,showers` +
    `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,precipitation_probability,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max` +
    `&timezone=auto&forecast_days=16&past_days=7`;

  const targetUrl = base + params;

  try {
    console.log(`[Proxy Fetch] Requesting fresh weather from Open-Meteo for ${cacheKey} (force=${isForceRefresh})`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo API returned status ${response.status}`);
    }

    const data = await response.json();
    weatherCache.set(cacheKey, { data, timestamp: Date.now() });
    return res.json(data);
  } catch (err: any) {
    console.error(`[Proxy Error] Failed to fetch weather for ${cacheKey}:`, err.message || err);
    
    // Serve stale cache if available, even if TTL expired
    if (cached) {
      console.log(`[Cache Fallback] Serving stale cache for ${cacheKey}`);
      return res.json(cached.data);
    }
    
    return res.status(502).json({
      error: "Não foi possível obter dados de meteorologia em tempo real.",
      details: err.message || "Erro de conexão com a API Open-Meteo"
    });
  }
});

// Weather analysis API utilizing Gemini 3.6-flash
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { location, current, forecastOverview } = req.body;

    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }

    const prompt = `Analise as seguintes condições meteorológicas para a localização "${location}":
- Clima Atual: ${current.temp}°C, Umidade: ${current.humidity}%, Vento: ${current.windSpeed} km/h vindo de ${current.windDir} (${current.windDeg}°), Pressão: ${current.pressure} hPa, Descrição: ${current.description}.
- Visão Geral da Previsão de 16 dias: ${forecastOverview}.

INSTRUÇÃO IMPORTANTE SOBRE TERMOS TÉCNICOS:
Sempre que aplicável ao cenário atual de temperatura, chuva, vento, pressão ou localização geográfica (por exemplo, regiões do Brasil), mencione e explique de forma contextualizada a influência de pelo menos um dos seguintes sistemas meteorológicos na previsão/resumo:
1. Cavado (região alongada de baixa pressão que causa instabilidade e nuvens carregadas)
2. Zona de Convergência do Atlântico Sul (ZCAS) (faixa de nebulosidade e chuva persistente da Amazônia ao Atlântico Sul)
3. Zona de Convergência Intertropical (ZCIT) / Corredor Intertropical (convergência de ventos alísios próxima ao equador)
4. Corredor de Umidade / "Corredor da Amazônia" / Rios Voadores (transporte de vapor d'água da Amazônia)
5. Crista (região alongada de alta pressão que traz tempo firme, céu limpo e estabilidade)
6. Frente Fria (zona de transição que traz chuva, ventos e queda de temperatura)
7. Vórtice Ciclônico de Altos Níveis (VCAN) (circulação fechada de ventos em altos níveis que causa secura no centro e tempestades nas bordas)
8. Baixa Pressão / Depressão / Ciclone (zona de baixa pressão com ventos giratórios e chuvas intensas)

Mencione-os de forma natural e explicativa no "summary" (resumo atmosférico), relacionando-os de maneira educativa ao que o usuário verá no mapa animado de ventos ou radar! Se o clima estiver muito estável com alta pressão, mencione a influência de uma Crista. Se estiver chovendo forte e persistente, mencione a ZCAS ou um Cavado/Frente Fria de acordo com a região. Se houver ventos muito fortes e baixa pressão, mencione a Baixa Pressão/Ciclone.

Com base nessas informações, retorne recomendações de vestuário adequadas, atividades recomendadas, alertas de saúde ou segurança e um resumo atmosférico inteligente e cativante em português do Brasil.`;

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "Você é um assistente meteorológico especialista e poético em português. Forneça respostas amigáveis, práticas e focadas na saúde e bem-estar do usuário.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clothing: {
                type: Type.STRING,
                description: "Recomendações detalhadas de vestuário apropriado para o clima atual."
              },
              activities: {
                type: Type.STRING,
                description: "Sugestões de atividades ao ar livre ou internas que combinam com o clima."
              },
              safetyAlerts: {
                type: Type.STRING,
                description: "Alertas de saúde ou segurança pertinentes (cuidados com sol, hidratação, ventos fortes, chuva)."
              },
              summary: {
                type: Type.STRING,
                description: "Um resumo atmosférico inteligente, conciso e amigável sobre o clima na região."
              }
            },
            required: ["clothing", "activities", "safetyAlerts", "summary"]
          }
        }
      });

      if (response && response.text) {
        const result = JSON.parse(response.text.trim());
        return res.json(result);
      } else {
        throw new Error("Empty response from Gemini API");
      }
    } catch (apiError: any) {
      console.info("Using local premium meteorological heuristics for analysis.");
      
      // Smart local fallback if Gemini is not configured or fails
      const temp = current.temp || 20;
      const hasRain = current.description.toLowerCase().includes("chuva") || current.description.toLowerCase().includes("garoa") || current.description.toLowerCase().includes("tempestade");
      const isWindy = (current.windSpeed || 0) > 20;
      const pressure = current.pressure || 1012;

      let systemUsed = "";
      let systemDesc = "";

      // Smart selection of Brazilian meteorological concepts
      if (hasRain) {
        if (pressure < 1008) {
          systemUsed = "Baixa Pressão / Depressão / Ciclone";
          systemDesc = "Uma área de baixa pressão vigorosa está atuando sobre a região, forçando o ar quente a subir de forma giratória e gerando tempestades intensas.";
        } else if (isWindy && temp < 20) {
          systemUsed = "Frente Fria";
          systemDesc = "Uma frente fria está avançando pela região, servindo como uma cunha de ar frio e denso que empurra o ar quente e úmido para cima, gerando ventos fortes e pancadas de chuva.";
        } else if (current.humidity > 85 && temp >= 20 && temp <= 28) {
          systemUsed = "Zona de Convergência do Atlântico Sul (ZCAS)";
          systemDesc = "A atividade da ZCAS estabelece uma faixa persistente de nebulosidade e chuva que se estende da Amazônia até o Atlântico Sul, mantendo o tempo instável e úmido.";
        } else if (current.humidity > 80 && (location.toLowerCase().includes("norte") || location.toLowerCase().includes("nordeste") || location.toLowerCase().includes("equador") || location.toLowerCase().includes("macapá") || location.toLowerCase().includes("belém") || location.toLowerCase().includes("manaus"))) {
          systemUsed = "Zona de Convergência Intertropical (ZCIT) / Corredor Intertropical";
          systemDesc = "A aproximação do Corredor Intertropical (ZCIT) promove o encontro dos ventos alísios do norte e do sul, forçando o ar úmido a subir e gerando pancadas de chuva torrenciais.";
        } else if (current.humidity > 85 && temp > 25) {
          systemUsed = "Corredor de Umidade / Rios Voadores da Amazônia";
          systemDesc = "O Corredor de Umidade (Rios Voadores) está ativo na baixa atmosfera, transportando massas colossais de vapor de água vindas da Floresta Amazônica e alimentando as instabilidades locais.";
        } else {
          systemUsed = "Cavado (Trough)";
          systemDesc = "Um cavado (uma região alongada de baixa pressão) está posicionado sobre o local, convergindo os ventos na superfície e forçando o ar a subir, o que condensa a umidade em nuvens carregadas.";
        }
      } else {
        // No rain
        if (pressure > 1014) {
          systemUsed = "Crista (Ridge)";
          systemDesc = "Uma crista de alta pressão está atuando sobre a região. O ar descendente (subsidência) impede a formação de nuvens, garantindo estabilidade atmosférica, céu claro e tempo firme.";
        } else if (temp > 28 && current.humidity < 50) {
          systemUsed = "Vórtice Ciclônico de Altos Níveis (VCAN)";
          systemDesc = "O centro de um Vórtice Ciclônico de Altos Níveis (VCAN) está inibindo a nebulosidade local com ar descendente e seco, mantendo o céu limpo e o clima firme na região.";
        } else {
          systemUsed = "Crista de Alta Pressão Relativa";
          systemDesc = "O domínio de uma crista de alta pressão relativa proporciona ventos calmos, céu parcialmente limpo e condições de estabilidade térmica para o dia de hoje.";
        }
      }

      let clothing = "Use roupas leves e confortáveis.";
      let activities = "Excelente dia para atividades ao ar livre, caminhadas leves.";
      let safetyAlerts = "Mantenha-se bem hidratado e use protetor solar.";
      let summary = `Clima ameno de ${temp}°C em ${location}. Atualmente sob a influência de um sistema de ${systemUsed}: ${systemDesc}`;

      if (temp > 30) {
        clothing = "Roupas extremamente leves, boné, óculos de sol e tecidos respiráveis.";
        activities = "Prefira atividades na sombra ou em ambientes fechados com ar-condicionado.";
        safetyAlerts = "Alerta de calor! Beba muita água, evite exposição direta ao sol entre 10h e 16h.";
      } else if (temp < 15) {
        clothing = "Casacos quentes, jaqueta corta-vento, cachecol e calçados fechados.";
        activities = "Atividades internas, cafés aconhedores, cinema ou leitura.";
        safetyAlerts = "Mantenha as extremidades do corpo aquecidas para evitar choque térmico.";
      }

      if (hasRain) {
        clothing += " Não se esqueça de levar um guarda-chuva ou capa de chuva impermeável.";
        activities = "Atividades internas são recomendadas hoje devido à precipitação.";
        safetyAlerts += " Cuidado com pistas escorregadias e possíveis poças de água nas vias públicas.";
      }

      if (isWindy) {
        clothing += " Uma blusa corta-vento é altamente recomendada hoje.";
        safetyAlerts += ` Rajadas de vento de ${current.windSpeed} km/h requerem atenção com objetos soltos e galhos de árvores.`;
      }

      return res.json({
        clothing,
        activities,
        safetyAlerts,
        summary,
        _fallback: true
      });
    }
  } catch (err: any) {
    console.error("Server Route Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// Vite setup and serving
async function start() {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.VERCEL !== "1") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

start();

export default app;
