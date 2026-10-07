import React from 'react';
import { Activity, Upload, Database, Download, Sparkles, Coins, Sliders, Swords, Table } from 'lucide-react';

interface HeaderProps {
  activeTab: 'standings' | 'predictions' | 'odds' | 'simulator' | 'matches';
  setActiveTab: (tab: 'standings' | 'predictions' | 'odds' | 'simulator' | 'matches') => void;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  onLoadMultiLeague?: () => void;
  onExport: () => void;
  onOpenConfig?: () => void;
  matchCount: number;
  teamsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onLoadSample,
  onLoadMultiLeague,
  onExport,
  onOpenConfig,
  matchCount,
  teamsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Header Bar: Centered & Balanced Across Screen Sizes */}
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2 sm:gap-4">
          {/* Brand Left */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">
                  Calcio<span className="text-emerald-400 font-semibold">Metrics</span>
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5 hidden xs:block tabular-nums">
                {matchCount} gare · {teamsCount} squadre
              </div>
            </div>
          </div>

          {/* Centered Navigation for Desktop / Laptop (>= md) */}
          <nav className="hidden md:flex items-center justify-center gap-1.5 lg:gap-2 flex-1 mx-2 max-w-2xl">
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-3 lg:px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'standings'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Classifica & Rendimento
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`px-3 lg:px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'predictions'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analisi Predittiva</span>
            </button>
            <button
              onClick={() => setActiveTab('odds')}
              className={`px-3 lg:px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'odds'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quote & Mercati</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 lg:px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulatore Match</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 lg:px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'matches'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Archivio Gare
            </button>
          </nav>

          {/* Action Tools Right */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onLoadSample && (
              <button
                onClick={onLoadSample}
                title="Carica dataset demo Serie A"
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Serie A</span>
              </button>
            )}

            {onLoadMultiLeague && (
              <button
                onClick={onLoadMultiLeague}
                title="Carica dataset Serie A + Premier (760 gare)"
                className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Lega</span>
              </button>
            )}

            {onOpenConfig && (
              <button
                onClick={onOpenConfig}
                title="Personalizza parametri statistici, modelli e stake"
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Parametri</span>
              </button>
            )}

            <button
              onClick={onExport}
              title="Esporta partite filtrate in formato CSV"
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Esporta</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Importa file CSV con statistiche o quote"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Carica CSV</span>
            </button>
          </div>
        </div>

        {/* Proportional, Non-Scrolling Centered Navigation Bar for Mobile / Smaller Screens (< md) */}
        <div className="md:hidden py-1.5 border-t border-slate-800/80">
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[11px] w-full">
            <button
              onClick={() => setActiveTab('standings')}
              className={`py-1.5 px-0.5 rounded transition-colors truncate ${
                activeTab === 'standings'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Classifica
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`py-1.5 px-0.5 rounded transition-colors truncate ${
                activeTab === 'predictions'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Predittiva
            </button>
            <button
              onClick={() => setActiveTab('odds')}
              className={`py-1.5 px-0.5 rounded transition-colors truncate ${
                activeTab === 'odds'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Quote
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`py-1.5 px-0.5 rounded transition-colors truncate ${
                activeTab === 'simulator'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Simulatore
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-1.5 px-0.5 rounded transition-colors truncate ${
                activeTab === 'matches'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Gare
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
