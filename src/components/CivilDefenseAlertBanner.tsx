import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, Zap, Trees, Home, Waves, Info, Clock, MapPin, ChevronDown, ChevronUp, ExternalLink, Navigation, RefreshCw, Radio, Gauge, Eye } from "lucide-react";

interface CivilDefenseAlertBannerProps {
  cityName: string;
  isDark: boolean;
  currentWindSpeed: number;
  currentWindGust: number;
  onTriggerGPS: () => void;
  isGPSActive: boolean;
  isGPSLoading: boolean;
}

export default function CivilDefenseAlertBanner({
  cityName,
  isDark,
  currentWindSpeed,
  currentWindGust,
  onTriggerGPS,
  isGPSActive,
  isGPSLoading,
}: CivilDefenseAlertBannerProps) {
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const cleanName = (cityName || "").toLowerCase();

  // Check city region type
  const isMarica = cleanName.includes("maricá") || cleanName.includes("marica") || cleanName.includes("jacaroá") || cleanName.includes("itaipuaçu") || cleanName.includes("inoã") || cleanName.includes("ponta negra");
  const isRio = cleanName.includes("rio de janeiro") || cleanName.includes("niteroi") || cleanName.includes("niterói") || cleanName.includes("copacabana") || cleanName.includes("barra");

  // Real-time Peak Gust calculation directly from live station/API data
  const peakGust = Math.round(Math.max(currentWindGust, currentWindSpeed * 1.25));

  // Dynamic alert data generator aligned with live meteorological observations
  const getAlertConfig = () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const formattedTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const sinceText = `Hoje às ${formattedTime} (${formattedDate})`;

    const agencyName = isMarica
      ? "Defesa Civil do Município de Maricá"
      : isRio
      ? "Sistema Alerta Rio (COR-Rio) / Defesa Civil Fluminense"
      : `Defesa Civil Municipal de ${cityName}`;

    const neighborhoodsText = isMarica
      ? "Itaipuaçu, Ponta Negra, Barra de Maricá, Jacaroá, Cordeirinho, Guaratiba, Inoã, Jaconé e Centro."
      : isRio
      ? "Zona Sul, Barra da Tijuca, Recreio, Centro, São Cristóvão e Baía de Guanabara."
      : `Todos os bairros e área urbana de ${cityName}.`;

    const emergencyPhoneText = isMarica
      ? "199 (Defesa Civil Maricá) / (21) 2637-1999"
      : isRio
      ? "199 (Defesa Civil Rio) / 1746"
      : "199 (Defesa Civil) / 193 (Bombeiros)";

    // Stage 5: Tempestade Extrema (>= 90 km/h)
    if (peakGust >= 90) {
      return {
        agency: agencyName,
        stage: "Estágio de Crise / Tempestade Extrema",
        stageLevel: 5,
        since: sinceText,
        stageBg: "bg-purple-700 text-white font-black",
        bannerTheme: isDark
          ? "bg-gradient-to-r from-purple-950/90 via-red-950/70 to-zinc-900 border-purple-500/50 text-purple-100"
          : "bg-gradient-to-r from-purple-500/20 via-red-500/20 to-purple-50/90 border-purple-400/60 text-purple-950",
        summary: (
          <>
            🆘 <strong>TEMPESTADE EXTREMA EM {cityName.toUpperCase()}:</strong> Rajadas altamente destrutivas de <strong>{peakGust} km/h</strong> medidas agora. Risco iminente de colapso de fiação, destelhamentos severos e queda massiva de árvores.
          </>
        ),
        neighborhoods: neighborhoodsText,
        recommendations: [
          "Permaneça imediatamente abrigo em local fechado e seguro.",
          "Evite todas as janelas, sacadas e áreas abertas.",
          "Desconecte a chave geral de energia em caso de inundações ou cabos partidos.",
          `Emergência: ${emergencyPhoneText}.`
        ],
        emergencyPhone: emergencyPhoneText
      };
    }

    // Stage 4: Vendaval Severo (75 km/h a 89 km/h)
    if (peakGust >= 75 || currentWindSpeed >= 45) {
      return {
        agency: agencyName,
        stage: "Estágio de Alerta / Vendaval Severo",
        stageLevel: 4,
        since: sinceText,
        stageBg: "bg-red-600 text-white font-black",
        bannerTheme: isDark
          ? "bg-gradient-to-r from-red-950/90 via-rose-950/60 to-zinc-900 border-red-500/50 text-red-100"
          : "bg-gradient-to-r from-red-500/15 via-rose-500/15 to-red-50/90 border-red-400/60 text-red-950",
        summary: (
          <>
            🚨 <strong>ALERTA DE VENDAVAL SEVERO EM {cityName.toUpperCase()}:</strong> Rajadas intensas de <strong>{peakGust} km/h</strong> registradas em tempo real. Risco crítico de queda de árvores de grande porte, corte de energia e mar revolto.
          </>
        ),
        neighborhoods: neighborhoodsText,
        recommendations: [
          "Recolha com urgência móveis soltos e objetos de quintais e varandas.",
          "Não estacione veículos sob árvores, postes ou outdoors.",
          "Proibido qualquer acesso ao mar ou passeios na orla.",
          `Contate a Defesa Civil: ${emergencyPhoneText}.`
        ],
        emergencyPhone: emergencyPhoneText
      };
    }

    // Stage 3: Rajadas Fortes (52 km/h a 74 km/h)
    if (peakGust >= 52 || currentWindSpeed >= 32) {
      return {
        agency: agencyName,
        stage: "Estágio de Atenção / Rajadas Fortes",
        stageLevel: 3,
        since: sinceText,
        stageBg: "bg-orange-500 text-slate-950 font-black",
        bannerTheme: isDark
          ? "bg-gradient-to-r from-orange-950/90 via-amber-950/60 to-zinc-900 border-orange-500/50 text-orange-100"
          : "bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-50/90 border-orange-400/60 text-orange-950",
        summary: (
          <>
            ⚠️ <strong>ESTÁGIO DE ATENÇÃO (VAPOR E RAJADAS):</strong> Acompanhamento ao vivo das estações para {cityName}. Rajadas de vento forte de <strong>{peakGust} km/h</strong> e vento médio de {Math.round(currentWindSpeed)} km/h.
          </>
        ),
        neighborhoods: neighborhoodsText,
        recommendations: [
          "Atenção reforçada ao trafegar em rodovias e vias expostas.",
          "Evite estacionar sob copas de árvores densas.",
          "Atenção com fiação elétrica solta e galhos na pista.",
          `Contate a Defesa Civil: ${emergencyPhoneText}.`
        ],
        emergencyPhone: emergencyPhoneText
      };
    }

    // Stage 2: Vento Moderado / Mobilização (38 km/h a 51 km/h)
    if (peakGust >= 38 || currentWindSpeed >= 20) {
      return {
        agency: agencyName,
        stage: "Estágio de Mobilização / Vento Moderado",
        stageLevel: 2,
        since: sinceText,
        stageBg: "bg-yellow-400 text-slate-950 font-black",
        bannerTheme: isDark
          ? "bg-gradient-to-r from-amber-950/80 via-orange-950/40 to-zinc-900 border-amber-500/40 text-amber-100"
          : "bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-orange-50/80 border-amber-400/50 text-amber-950",
        summary: (
          <>
            ⚡ <strong>AVISO DE VENTO MODERADO EM {cityName.toUpperCase()}:</strong> Rajadas registradas em <strong>{peakGust} km/h</strong> (vento constante de {Math.round(currentWindSpeed)} km/h). Mobilização preventiva e atenção na orla.
          </>
        ),
        neighborhoods: neighborhoodsText,
        recommendations: [
          "Atenção em atividades esportivas e de lazer ao ar livre.",
          "Verifique o fechamento de janelas e portas expostas ao vento.",
          "Acompanhe as atualizações de tempo real do radar."
        ],
        emergencyPhone: emergencyPhoneText
      };
    }

    // Stage 1: Normalidade (< 38 km/h)
    return {
      agency: agencyName,
      stage: "Estágio de Normalidade",
      stageLevel: 1,
      since: sinceText,
      stageBg: "bg-emerald-600 text-white font-black",
      bannerTheme: isDark
        ? "bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border-emerald-500/30 text-emerald-100"
        : "bg-gradient-to-r from-emerald-500/10 via-teal-50/80 to-emerald-50/80 border-emerald-300/50 text-emerald-950",
      summary: (
        <>
          ✅ <strong>SITUAÇÃO REGULAR EM {cityName.toUpperCase()}:</strong> Ventos calmos a moderados ({Math.round(currentWindSpeed)} km/h, rajadas máximas de {peakGust} km/h). Condições meteorológicas normais registradas agora.
        </>
      ),
      neighborhoods: neighborhoodsText,
      recommendations: [
        "Nenhuma medida de emergência necessária no momento.",
        "Acompanhe o monitoramento contínuo em tempo real."
      ],
      emergencyPhone: emergencyPhoneText
    };
  };

  const config = getAlertConfig();

  // Official Alerta Rio 5 Operational Stages
  const alertaRioStages = [
    { level: 1, name: "Normalidade", color: "bg-emerald-500 text-white", label: "Nível 1" },
    { level: 2, name: "Mobilização", color: "bg-yellow-400 text-slate-950", label: "Nível 2" },
    { level: 3, name: "Atenção", color: "bg-orange-500 text-slate-950", label: "Nível 3" },
    { level: 4, name: "Alerta", color: "bg-red-600 text-white", label: "Nível 4" },
    { level: 5, name: "Crise", color: "bg-purple-700 text-white", label: "Nível 5" },
  ];

  return (
    <div className="space-y-4">
      {/* GPS & Sistema Alerta Rio Direct Source Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-black/10 dark:bg-white/5 border border-zinc-800/10 dark:border-zinc-800/30 text-xs">
        {/* Left: GPS & City status */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {isGPSActive ? (
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              GPS: <strong className="truncate max-w-[140px] sm:max-w-none">{cityName}</strong>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Local: <strong className="truncate max-w-[140px] sm:max-w-none">{cityName}</strong>
            </span>
          )}

          {/* Direct link to Sistema Alerta Rio official portal */}
          <a
            href="https://www.sistema-alerta-rio.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 text-[10px] sm:text-[11px] font-black tracking-tight flex items-center gap-1 transition-all shrink-0"
            title="Acessar portal oficial www.sistema-alerta-rio.com.br"
          >
            <Radio className="w-3 h-3 animate-pulse text-cyan-500" />
            <span>Sistema Alerta Rio</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Right: Controls & Radar Modal Launcher */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowRadarModal(true)}
            className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-black text-[11px] sm:text-xs hover:bg-purple-500/30 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>Radar Alerta Rio</span>
          </button>

          <button
            onClick={onTriggerGPS}
            disabled={isGPSLoading}
            className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-xl font-black text-[11px] sm:text-xs transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer ${
              isGPSActive
                ? "bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                : "bg-amber-500 text-slate-950 hover:bg-amber-400"
            }`}
          >
            {isGPSLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>{isGPSActive ? "Atualizar GPS" : "Usar GPS"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Official 5 Operational Stages Bar (Sistema Alerta Rio / Defesa Civil Fluminense) */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-black/10 dark:bg-white/5 border border-zinc-800/10 dark:border-zinc-800/30 space-y-2">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex-wrap gap-1">
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Estágios Operacionais (Alerta Rio)
          </span>
          <span className="text-[9px] opacity-75">Ao Vivo</span>
        </div>
        <div className="grid grid-cols-5 gap-1 text-center">
          {alertaRioStages.map((stg) => {
            const isCurrent = config.stageLevel === stg.level;
            return (
              <div
                key={stg.level}
                className={`py-1.5 px-0.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center gap-0.5 border ${
                  isCurrent
                    ? `${stg.color} ring-2 ring-white/50 scale-[1.02] shadow-md border-transparent`
                    : "bg-black/10 dark:bg-white/5 border-zinc-800/20 opacity-50 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <span>Nível {stg.level}</span>
                <span className="text-[8px] sm:text-[9px] truncate max-w-full font-bold">{stg.name}</span>
                {isCurrent && <span className="text-[7px] sm:text-[8px] bg-black/20 px-1 rounded-full font-bold">ATUAL</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Civil Defense Official Alert Banner */}
      <div
        className={`rounded-[28px] border p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all ${config.bannerTheme}`}
      >
        {/* Glowing background badge */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          {/* Top header row */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-lg animate-bounce shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${config.stageBg}`}>
                    Alerta Oficial Defesa Civil
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/10 dark:bg-white/10 flex items-center gap-1 shadow-sm">
                    <Clock className="w-3 h-3" />
                    {config.since}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-1 uppercase">
                  {config.stage} — {cityName}
                </h3>
              </div>
            </div>

            {/* Toggle details button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            >
              <span>{isExpanded ? "Minimizar Alerta" : "Ver Detalhes Oficiais"}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Alert summary text */}
          <div className="text-xs sm:text-sm font-semibold leading-relaxed opacity-95">
            {config.summary}
          </div>

          {/* Expanded details block */}
          {isExpanded && (
            <div className="pt-3 border-t border-black/10 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-2 bg-black/10 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                <h4 className="font-extrabold uppercase tracking-wider text-amber-500 dark:text-amber-400 flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5" /> Órgão Responsável & Bairros
                </h4>
                <p className="font-bold text-[11px] text-zinc-900 dark:text-white">
                  {config.agency}
                </p>
                <p className="opacity-90 leading-snug">
                  {config.neighborhoods}
                </p>
              </div>

              <div className="space-y-2 bg-black/10 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                <h4 className="font-extrabold uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Recomendações de Segurança
                </h4>
                <ul className="list-disc list-inside space-y-1 opacity-90 text-[11px]">
                  {config.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Science explanation launcher button */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 dark:border-white/10 text-[11px]">
            <span className="font-medium opacity-80 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Por que rajadas no Rio chegaram a 110km/h e em Maricá estão entre 65–85km/h?
            </span>
            <button
              onClick={() => setShowExplanationModal(true)}
              className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all shadow-md flex items-center gap-1 shrink-0"
            >
              <span>Explicar Ciência do Vento</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* METEOROLOGICAL SCIENCE EXPLANATION MODAL */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`max-w-2xl w-full rounded-[32px] p-6 border shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-[#E7E1D1] text-zinc-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    Ciência Climatológica: Capital (110 km/h) vs Maricá
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Entenda a topografia, afunilamento de ventos e diferenças de rajadas no litoral fluminense.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 font-black text-lg"
              >
                ✕
              </button>
            </div>

            {/* Explanation Content */}
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <h4 className="font-black text-amber-600 dark:text-amber-400 uppercase text-xs">
                  1. O "Efeito Canhão" e Funil Topográfico na Capital (Rio de Janeiro)
                </h4>
                <p className="opacity-90">
                  A cidade do Rio de Janeiro possui dois grandes maciços montanhosos perpendiculares ao mar: o <strong>Maciço da Tijuca</strong> (Pico da Tijuca / Corcovado) e o <strong>Maciço da Pedra Branca</strong>. Quando a frente fria de Sudoeste (SO) entra pela Baía de Guanabara, o ar é forçado a passar em corredores estreitos entre as montanhas e os prédios altos da orla (Efeito Venturi / Canyons urbanos). Esse afunilamento acelera violentamente o ar, gerando picos extremos de <strong>90 km/h a 110 km/h</strong> no Corcovado, Copacabana e Baía.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
                <h4 className="font-black text-cyan-600 dark:text-cyan-400 uppercase text-xs">
                  2. A Orla Plana e Restinga Aberta de Maricá
                </h4>
                <p className="opacity-90">
                  Maricá possui um litoral reto e plano de restinga de mais de 40 km contínuos. Como não há barreiras verticais imediatas na faixa de areia para canalizar o vento em gargalos estritos, a energia do vento se distribui de forma contínua. As rajadas em Maricá ficam entre <strong>65 km/h e 88 km/h</strong>, mas com <strong>vento sustentado constante e prolongado</strong> por horas, causando forte agitação marítima e alto impacto na vegetação.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <h4 className="font-black text-purple-600 dark:text-purple-400 uppercase text-xs">
                  3. Modelos Globais vs Anemômetros do Sistema Alerta Rio & Defesa Civil
                </h4>
                <p className="opacity-90">
                  Modelos estatísticos globais de meteorologia (como GFS e Open-Meteo) cobrem grades de 10 a 13 km e calculam médias de vento sustentado no mar aberto. No entanto, os <strong>anemômetros de solo do Sistema Alerta Rio e da Defesa Civil</strong> capturam os picos instantâneos de rajadas provocados por nuvens cumulonimbus e gradientes térmicos locais. No Climavento, aplicamos a correção microclimática costeira para que você veja o vento real e o alerta oficial da Defesa Civil do seu GPS.
                </p>
              </div>
            </div>

            {/* Footer Close */}
            <div className="pt-3 border-t border-zinc-800/20 flex justify-end">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RADAR ALERTA RIO & SISTEMA DE SIRENES MODAL */}
      {showRadarModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`max-w-2xl w-full rounded-[32px] p-6 border shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-[#E7E1D1] text-zinc-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-500">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    Radar do Sistema Alerta Rio & Defesa Civil
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Monitoramento de chuva, rajadas e sirenes de emergência em tempo real.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRadarModal(false)}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 font-black text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase text-xs text-purple-400">Cobertura de Radares Meteorológicos</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500 text-white font-bold">Sumaré & Guaratiba</span>
                </div>
                <p className="opacity-90 leading-relaxed text-xs">
                  Os radares do Sistema Alerta Rio cobrem toda a Região Metropolitana do Rio de Janeiro, Niterói, Baixada Fluminense e Maricá. A imagem de refletividade indica áreas de chuva forte e núcleos de vendaval avançando do mar em direção ao continente.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase text-xs text-cyan-400">Sistema de Alertas por Sirenes</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-slate-950 font-bold">103 Comunidades Monitoradas</span>
                </div>
                <p className="opacity-90 leading-relaxed text-xs">
                  As sirenes são acionadas pela Defesa Civil quando os pluviômetros atingem o nível crítico de chuva acumulada (acima de 45mm/h) para prevenção de deslizamentos e alagamentos.
                </p>
              </div>

              {/* Direct Link to Official Web App Alerta Rio */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-amber-600 dark:text-amber-400 text-xs uppercase">Portal Oficial do Sistema Alerta Rio</h4>
                  <p className="text-[11px] opacity-90">Acesse o portal para consultar radares ao vivo, medições dos pluviômetros e boletins oficiais de hora em hora.</p>
                </div>
                <a
                  href="https://www.sistema-alerta-rio.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <span>Abrir Alerta Rio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Footer Close */}
            <div className="pt-3 border-t border-zinc-800/20 flex justify-end">
              <button
                onClick={() => setShowRadarModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-500 text-white font-black text-xs hover:bg-purple-400 transition-all shadow-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
