import React from 'react';
import { Activity, Upload, Database, Download, Sparkles, Coins, Sliders } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'standings' | 'predictions' | 'odds' | 'simulator' | 'matches';
  setActiveTab: (tab: 'dashboard' | 'standings' | 'predictions' | 'odds' | 'simulator' | 'matches') => void;
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
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark with football analytics glyph */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Calcio<span className="text-emerald-400 font-semibold">Metrics</span>
              </span>
              <span className="hidden sm:inline-block text-xs font-mono text-slate-500 tabular-nums">
                {matchCount} gare · {teamsCount} squadre
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'standings'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Classifica & Squadre
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'predictions'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analisi Predittiva</span>
            </button>
            <button
              onClick={() => setActiveTab('odds')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'odds'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quote & Mercati</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Simulatore Match
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'matches'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Archivio Gare
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLoadSample}
              title="Carica dataset dimostrativo Serie A"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Serie A</span>
            </button>

            {onLoadMultiLeague && (
              <button
                onClick={onLoadMultiLeague}
                title="Carica dataset unificato Serie A + Premier League (760 gare)"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Lega (760 gare)</span>
              </button>
            )}

            {onOpenConfig && (
              <button
                onClick={onOpenConfig}
                title="Personalizza parametri di calcolo e modelli"
                className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Personalizza</span>
              </button>
            )}

            <button
              onClick={onExport}
              title="Esporta dati correnti in CSV"
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Esporta</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Carica CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-900 gap-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'standings' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Classifica
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'predictions' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Analisi Predittiva
          </button>
          <button
            onClick={() => setActiveTab('odds')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'odds' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Quote & Mercati
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'simulator' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Simulatore
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'matches' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Gare
          </button>
        </div>
      </div>
    </header>
  );
};
