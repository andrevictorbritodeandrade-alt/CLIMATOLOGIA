import React, { useState, useRef } from "react";
import { Wind, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

interface BeaufortScaleProps {
  currentWindSpeedKmh: number;
  isDark: boolean;
}

interface BeaufortItem {
  grade: number;
  name: string;
  speed: string;
  speedMin: number;
  speedMax: number;
  effect: string;
  color: string;
  bgClass: string;
}

export default function BeaufortScale({ currentWindSpeedKmh, isDark }: BeaufortScaleProps) {
  // Beaufort grades catalog
  const beaufortList: BeaufortItem[] = [
    {
      grade: 0,
      name: "Calmaria",
      speed: "< 2 km/h",
      speedMin: 0,
      speedMax: 1.9,
      effect: "Fumaça sobe verticalmente. Mar espelhado.",
      color: "#10B981",
      bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    },
    {
      grade: 1,
      name: "Bafo de Vento",
      speed: "2 - 5 km/h",
      speedMin: 2,
      speedMax: 5.9,
      effect: "Direção do vento indicada pelo desvio da fumaça.",
      color: "#10B981",
      bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    },
    {
      grade: 2,
      name: "Brisa Leve",
      speed: "6 - 11 km/h",
      speedMin: 6,
      speedMax: 11.9,
      effect: "Sente-se o vento no rosto; as folhas sussurram.",
      color: "#10B981",
      bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    },
    {
      grade: 3,
      name: "Brisa Fraca",
      speed: "12 - 19 km/h",
      speedMin: 12,
      speedMax: 19.9,
      effect: "Folhas e galhos finos agitam-se continuamente.",
      color: "#84CC16",
      bgClass: "bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-400 border-lime-500/30",
    },
    {
      grade: 4,
      name: "Brisa Moderada",
      speed: "20 - 28 km/h",
      speedMin: 20,
      speedMax: 28.9,
      effect: "Poeira e papéis soltos são levantados; galhos movem-se.",
      color: "#EAB308",
      bgClass: "bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    },
    {
      grade: 5,
      name: "Brisa Forte",
      speed: "29 - 38 km/h",
      speedMin: 29,
      speedMax: 38.9,
      effect: "Pequenas árvores com folhas começam a balançar.",
      color: "#EAB308",
      bgClass: "bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    },
    {
      grade: 6,
      name: "Vento Fresco",
      speed: "39 - 49 km/h",
      speedMin: 39,
      speedMax: 49.9,
      effect: "Grandes galhos movem-se; dificuldade de usar guarda-chuva.",
      color: "#F97316",
      bgClass: "bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30",
    },
    {
      grade: 7,
      name: "Vento Forte",
      speed: "50 - 61 km/h",
      speedMin: 50,
      speedMax: 61.9,
      effect: "Árvores grandes balançam; dificuldade ao andar contra o vento.",
      color: "#EF4444",
      bgClass: "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",
    },
    {
      grade: 8,
      name: "Ventania",
      speed: "62 - 74 km/h",
      speedMin: 62,
      speedMax: 74.9,
      effect: "Quebram-se galhos pequenos de árvores; caminhar é muito difícil.",
      color: "#EF4444",
      bgClass: "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",
    },
    {
      grade: 9,
      name: "Ventania Forte",
      speed: "75 - 88 km/h",
      speedMin: 75,
      speedMax: 88.9,
      effect: "Ocorrem pequenos danos em coberturas e chaminés.",
      color: "#EF4444",
      bgClass: "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",
    },
    {
      grade: 10,
      name: "Tempestade",
      speed: "89 - 102 km/h",
      speedMin: 89,
      speedMax: 102.9,
      effect: "Árvores são arrancadas; danos estruturais consideráveis.",
      color: "#A855F7",
      bgClass: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30",
    },
    {
      grade: 11,
      name: "Tempestade Violenta",
      speed: "103 - 117 km/h",
      speedMin: 103,
      speedMax: 117.9,
      effect: "Estragos generalizados em construções e árvores.",
      color: "#A855F7",
      bgClass: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30",
    },
    {
      grade: 12,
      name: "Furacão",
      speed: "≥ 118 km/h",
      speedMin: 118,
      speedMax: 999,
      effect: "Destruição generalizada e violenta. Alerta máximo de catástrofe.",
      color: "#7E22CE",
      bgClass: "bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-500/30",
    },
  ];

  // Selected item state (defaults to active calculated wind item)
  const activeCalculatedItem = beaufortList.find(
    (item) => currentWindSpeedKmh >= item.speedMin && currentWindSpeedKmh <= item.speedMax
  ) || beaufortList[0];

  const [selectedGrade, setSelectedGrade] = React.useState<number>(activeCalculatedItem.grade);
  const [isExpanded, setIsExpanded] = useState(false);
  const beaufortScrollRef = useRef<HTMLDivElement>(null);

  const scrollBeaufortLeft = () => {
    if (beaufortScrollRef.current) {
      beaufortScrollRef.current.scrollBy({ left: -220, behavior: "smooth" });
    }
  };

  const scrollBeaufortRight = () => {
    if (beaufortScrollRef.current) {
      beaufortScrollRef.current.scrollBy({ left: 220, behavior: "smooth" });
    }
  };

  React.useEffect(() => {
    setSelectedGrade(activeCalculatedItem.grade);
  }, [activeCalculatedItem.grade]);

  const activeItem = beaufortList.find((item) => item.grade === selectedGrade) || activeCalculatedItem;

  return (
    <div
      id="beaufort-scale-card"
      className={`rounded-[28px] p-4 sm:p-5 border transition-all duration-300 shadow-sm ${
        isDark ? "bg-[#111111] border-zinc-800" : "bg-white border-[#E7E1D1]"
      }`}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#6E5D0E]/10 text-[#6E5D0E] dark:text-[#EAB308]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-[#1F1B16] dark:text-white uppercase">
              Escala Beaufort de Ventos
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
              Classificação universal de 0 a 12
            </p>
          </div>
        </div>
        <div className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          Atual: {currentWindSpeedKmh.toFixed(1)} km/h
        </div>
      </div>

      {/* Ultra-compact Active Grade Banner */}
      <div
        className={`rounded-xl p-3 border transition-all ${activeItem.bgClass} flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 shrink-0 bg-black/10 dark:bg-white/10"
            style={{ borderColor: activeItem.color }}
          >
            G{activeItem.grade}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs uppercase tracking-tight truncate">
                {activeItem.name}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/15 shrink-0">
                {activeItem.speed}
              </span>
            </div>
            <p className="text-[10px] font-medium opacity-90 truncate mt-0.5">{activeItem.effect}</p>
          </div>
        </div>
        <div className="text-[9px] font-black px-2 py-1 rounded-lg bg-black/15 dark:bg-white/10 uppercase tracking-wider text-center shrink-0">
          {activeItem.grade === activeCalculatedItem.grade ? "⭐ Nível Atual" : `Grau ${activeItem.grade}`}
        </div>
      </div>

      {/* Toggle Button to Expand/Collapse All 13 Scales */}
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${
            isDark
              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
          }`}
        >
          <span>{isExpanded ? "Ocultar Escalas" : "Expandir / Ver Todas as 13 Escalas"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Horizontal Scroll Snap Compact Strip for all 13 Beaufort levels (Shown when expanded) */}
      {isExpanded && (
        <div className="relative mt-3 pt-3 border-t border-zinc-800/10 dark:border-zinc-800/30">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400">
              Escala Selecionada: Grau {selectedGrade} ({activeItem.name})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={scrollBeaufortLeft}
                className={`p-1 rounded-lg border transition-all ${
                  isDark
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                }`}
                title="Anterior (Rolar Escalas)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={scrollBeaufortRight}
                className={`p-1 rounded-lg border transition-all ${
                  isDark
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                }`}
                title="Próximo (Rolar Escalas)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative group">
            {/* Side Arrow Buttons for quick navigation */}
            <button
              type="button"
              onClick={scrollBeaufortLeft}
              className={`absolute -left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full shadow-xl border backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/90 text-emerald-400 border-zinc-700 hover:bg-zinc-800"
                  : "bg-white/90 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              }`}
              title="Voltar Escalas"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={scrollBeaufortRight}
              className={`absolute -right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full shadow-xl border backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/90 text-emerald-400 border-zinc-700 hover:bg-zinc-800"
                  : "bg-white/90 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              }`}
              title="Avançar Escalas"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div
              ref={beaufortScrollRef}
              className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 px-4 snap-x scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800 scroll-smooth"
            >
              {beaufortList.map((item) => {
                const isSelected = item.grade === selectedGrade;
                const isCurrentMatch = item.grade === activeCalculatedItem.grade;

                return (
                  <button
                    key={item.grade}
                    type="button"
                    onClick={() => setSelectedGrade(item.grade)}
                    style={{ borderColor: isSelected ? item.color : "transparent" }}
                    className={`min-w-[72px] sm:min-w-[80px] snap-center rounded-xl p-1.5 border text-center transition-all flex flex-col justify-between shrink-0 select-none ${
                      isSelected
                        ? isDark
                          ? "bg-zinc-800 ring-2 ring-emerald-500/50 shadow-md"
                          : "bg-[#F4F0E6] ring-2 ring-emerald-600/40 shadow-md"
                        : isDark
                        ? "bg-[#161616] border-zinc-800/40 hover:bg-zinc-800/50"
                        : "bg-[#FDFCFB] border-[#E7E1D1]/50 hover:bg-[#F4F0E6]/50"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span
                        style={{ backgroundColor: item.color }}
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-white font-black"
                      >
                        {item.grade}
                      </span>
                      {isCurrentMatch && (
                        <span className="text-[8px] font-black text-emerald-500 uppercase">★</span>
                      )}
                    </div>
                    <div className="text-[9px] font-extrabold text-zinc-700 dark:text-zinc-300 truncate w-full mt-0.5">
                      {item.name}
                    </div>
                    <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 truncate w-full">
                      {item.speed}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
