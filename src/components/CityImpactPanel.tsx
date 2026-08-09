import React from "react";
import { Zap, Trees, Home, Waves, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Building2 } from "lucide-react";

interface CityImpactPanelProps {
  windSpeed: number;
  windGust: number;
  rainSum: number;
  cityName: string;
  isDark: boolean;
}

export default function CityImpactPanel({
  windSpeed,
  windGust,
  rainSum,
  cityName,
  isDark,
}: CityImpactPanelProps) {
  // Check coastal town status and determine effective peak gust from live observations
  const cleanCity = cityName.toLowerCase();
  const isCoastal = cleanCity.includes("maricá") || cleanCity.includes("marica") || cleanCity.includes("rio de janeiro") || cleanCity.includes("niteroi") || cleanCity.includes("copacabana") || cleanCity.includes("barra");
  const effectiveGust = Math.round(Math.max(windGust, windSpeed * 1.25));

  // 1. Power Outage Risk (Rede Elétrica Enel)
  const calculatePowerOutageRisk = () => {
    if (effectiveGust >= 75) return { level: "Crítico", percentage: 90, color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", text: "Probabilidade altíssima de oscilação ou interrupção no fornecimento elétrico devido a galhos na fiação e desligamentos preventivos." };
    if (effectiveGust >= 55) return { level: "Alto", percentage: 75, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30", text: "Risco elevado de pique de energia e quedas de luz pontuais em bairros com rede aérea aberta (ex: Itaipuaçu, Inoã, Ponta Negra)." };
    if (effectiveGust >= 38) return { level: "Moderado", percentage: 45, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30", text: "Pequena probabilidade de piscadas de luz e estalos em transformadores." };
    return { level: "Baixo", percentage: 15, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", text: "Rede elétrica operando dentro da normalidade." };
  };

  // 2. Tree Fall Risk (Queda de Árvores e Grandes Galhos)
  const calculateTreeFallRisk = () => {
    const soilSaturated = rainSum > 5;
    if (effectiveGust >= 70) return { level: "Crítico", percentage: 92, color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", text: "Alto risco de tombamento de árvores de grande porte (eucaliptos, amendoeiras, coqueiros) e quebra de grandes galhos no solo." };
    if (effectiveGust >= 50) return { level: "Alto", percentage: 78, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30", text: "Queda frequente de galhos secos, folhas e pequenos troncos sobre vias públicas e carros." };
    if (effectiveGust >= 35) return { level: "Moderado", percentage: 40, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30", text: "Movimentação intensa de copas de árvores com queda esporádica de frutos e galhos finos." };
    return { level: "Baixo", percentage: 10, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", text: "Vegetação estável e sem riscos de queda." };
  };

  // 3. Roof & Structural Damage Risk (Destelhamento e Estruturas)
  const calculateRoofDamageRisk = () => {
    if (effectiveGust >= 75) return { level: "Alto", percentage: 68, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30", text: "Risco de descolamento de telhas de fibrocimento, lonas de obras, placas publicitárias e toldos expostos." };
    if (effectiveGust >= 55) return { level: "Moderado", percentage: 48, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30", text: "Possíveis barulhos em telhados e deslocamento de objetos leves soltos em quintais e varandas." };
    return { level: "Baixo", percentage: 12, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", text: "Estruturas residenciais e comerciais sem riscos de avarias." };
  };

  // 4. Maritime & Beach Risk (Mar, Ressaca e Banho de Mar)
  const calculateMaritimeRisk = () => {
    if (isCoastal && effectiveGust >= 55) return { level: "Extremo (Bandeira Vermelha)", percentage: 95, color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", text: "Ondas violentas com forte corrente de retorno. Banho de mar e navegação recreativa estritamente proibidos!" };
    if (isCoastal && effectiveGust >= 35) return { level: "Alto (Bandeira Amarela)", percentage: 65, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30", text: "Mar agitado com repuxo reforçado pelo vento. Recomenda-se cautela na orla." };
    if (isCoastal) return { level: "Normal (Bandeira Verde)", percentage: 20, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", text: "Condições marítimas normais e estáveis para a orla." };
    return { level: "Inaplicável", percentage: 0, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/30", text: "Município sem orla marítima direta." };
  };

  const powerRisk = calculatePowerOutageRisk();
  const treeRisk = calculateTreeFallRisk();
  const roofRisk = calculateRoofDamageRisk();
  const seaRisk = calculateMaritimeRisk();

  return (
    <div
      id="city-impact-prediction-card"
      className={`rounded-[28px] p-5 border shadow-sm transition-all ${
        isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-zinc-800/10 dark:border-zinc-800/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#E2725B]/15 text-[#E2725B]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1F1B16] dark:text-white flex items-center gap-1.5">
              <span>Previsão de Impactos na Cidade</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-red-500 text-white font-extrabold uppercase animate-pulse">
                AO VIVO
              </span>
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Estimativa de risco para infraestrutura urbana baseada nas rajadas ({effectiveGust} km/h)
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. POWER OUTAGE RISK */}
        <div className={`p-3.5 rounded-2xl border transition-all ${powerRisk.bg} space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${powerRisk.color}`} />
              <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                Queda de Energia Elétrica
              </span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 uppercase ${powerRisk.color}`}>
              {powerRisk.level} ({powerRisk.percentage}%)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${powerRisk.percentage > 70 ? "bg-red-500" : powerRisk.percentage > 40 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${powerRisk.percentage}%` }} />
          </div>
          <p className="text-[11px] font-medium opacity-90 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {powerRisk.text}
          </p>
        </div>

        {/* 2. TREE FALL RISK */}
        <div className={`p-3.5 rounded-2xl border transition-all ${treeRisk.bg} space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trees className={`w-4 h-4 ${treeRisk.color}`} />
              <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                Queda de Árvores / Galhos
              </span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 uppercase ${treeRisk.color}`}>
              {treeRisk.level} ({treeRisk.percentage}%)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${treeRisk.percentage > 70 ? "bg-red-500" : treeRisk.percentage > 40 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${treeRisk.percentage}%` }} />
          </div>
          <p className="text-[11px] font-medium opacity-90 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {treeRisk.text}
          </p>
        </div>

        {/* 3. ROOF & STRUCTURE DAMAGE */}
        <div className={`p-3.5 rounded-2xl border transition-all ${roofRisk.bg} space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className={`w-4 h-4 ${roofRisk.color}`} />
              <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                Destelhamento & Telhados
              </span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 uppercase ${roofRisk.color}`}>
              {roofRisk.level} ({roofRisk.percentage}%)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${roofRisk.percentage > 70 ? "bg-red-500" : roofRisk.percentage > 40 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${roofRisk.percentage}%` }} />
          </div>
          <p className="text-[11px] font-medium opacity-90 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {roofRisk.text}
          </p>
        </div>

        {/* 4. MARITIME & RESsACA */}
        <div className={`p-3.5 rounded-2xl border transition-all ${seaRisk.bg} space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className={`w-4 h-4 ${seaRisk.color}`} />
              <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                Ressaca & Orla Marítima
              </span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 uppercase ${seaRisk.color}`}>
              {seaRisk.level}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${seaRisk.percentage > 70 ? "bg-red-500" : seaRisk.percentage > 40 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${seaRisk.percentage}%` }} />
          </div>
          <p className="text-[11px] font-medium opacity-90 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {seaRisk.text}
          </p>
        </div>
      </div>
    </div>
  );
}
