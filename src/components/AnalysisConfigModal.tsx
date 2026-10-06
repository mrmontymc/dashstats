import React from 'react';
import { Sliders, X, RotateCcw, Check, Sparkles, Coins, Info } from 'lucide-react';
import { AnalysisConfig } from '../types/football';

interface AnalysisConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AnalysisConfig;
  onSaveConfig: (newConfig: AnalysisConfig) => void;
  onResetDefault: () => void;
}

export const AnalysisConfigModal: React.FC<AnalysisConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetDefault,
}) => {
  const [localConfig, setLocalConfig] = React.useState<AnalysisConfig>(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Personalizza Modelli & Parametri di Calcolo
              </h2>
              <p className="text-xs text-slate-400">
                Calibra pesi previsionali, fattori campo e parametri di scommessa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Sezione 1: Modello Predittivo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Parametri Modello Predittivo</span>
            </div>

            {/* Slider Peso Forma Recente */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-medium">Peso Forma Recente (EWMA):</span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">
                  {Math.round(localConfig.recentFormWeight * 100)}% Recente · {Math.round((1 - localConfig.recentFormWeight) * 100)}% Storico
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.85"
                step="0.05"
                value={localConfig.recentFormWeight}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, recentFormWeight: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Pesi maggiori accentuano lo stato di forma delle ultime 5 gare; pesi minori privilegiano la media complessiva della stagione.
              </p>
            </div>

            {/* Selettore Fattore Campo */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <span className="text-slate-200 font-medium text-xs block">
                Incidenza Fattore Campo (Home Advantage):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Disattivato (1.0x)', val: 1.0 },
                  { label: 'Standard (1.12x)', val: 1.12 },
                  { label: 'Marcato (1.25x)', val: 1.25 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setLocalConfig({ ...localConfig, homeAdvantageFactor: opt.val })}
                    className={`p-2 text-xs font-mono rounded border transition-colors ${
                      localConfig.homeAdvantageFactor === opt.val
                        ? 'bg-slate-800 text-emerald-400 border-emerald-500/60 font-semibold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrica di Base: Gol vs xG */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <span className="text-slate-200 font-medium text-xs block">
                Metrica Primaria per Indici di Forza:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocalConfig({ ...localConfig, metricBasis: 'goals' })}
                  className={`p-2 text-xs font-mono rounded border transition-colors ${
                    localConfig.metricBasis === 'goals'
                      ? 'bg-slate-800 text-emerald-400 border-emerald-500/60 font-semibold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Gol Effettivi (Reali)
                </button>
                <button
                  type="button"
                  onClick={() => setLocalConfig({ ...localConfig, metricBasis: 'xg' })}
                  className={`p-2 text-xs font-mono rounded border transition-colors ${
                    localConfig.metricBasis === 'xg'
                      ? 'bg-slate-800 text-cyan-400 border-cyan-500/60 font-semibold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Expected Goals (xG)
                </button>
              </div>
            </div>
          </div>

          {/* Sezione 2: Parametri Quote & Mercati */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5" />
              <span>Parametri Quote & Mercati (+EV)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              {/* Flat Stake */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <label className="text-slate-400 block text-[11px] mb-1 font-sans">
                  Puntata Fissa (Stake €)
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  step="10"
                  value={localConfig.flatStake}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, flatStake: parseInt(e.target.value) || 100 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Soglia Minima ROI */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <label className="text-slate-400 block text-[11px] mb-1 font-sans">
                  Soglia Min. ROI (+EV %)
                </label>
                <input
                  type="number"
                  min="1.0"
                  max="25.0"
                  step="0.5"
                  value={localConfig.minEvThreshold}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, minEvThreshold: parseFloat(e.target.value) || 4.0 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Minimo Partite Campione */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <label className="text-slate-400 block text-[11px] mb-1 font-sans">
                  Minimo Partite Campione
                </label>
                <input
                  type="number"
                  min="4"
                  max="50"
                  step="1"
                  value={localConfig.minSampleBets}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, minSampleBets: parseInt(e.target.value) || 8 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Iterazioni Monte Carlo & Preferenza Quote */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <span className="text-slate-200 font-medium text-xs block">
                  Iterazioni Simulazioni Monte Carlo:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1000, 2000, 4000].map((runs) => (
                    <button
                      key={runs}
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, simulationsCount: runs })}
                      className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors ${
                        (localConfig.simulationsCount ?? 2000) === runs
                          ? 'bg-slate-800 text-emerald-400 border-emerald-500/60 font-semibold'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {runs.toLocaleString()} run
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <span className="text-slate-200 font-medium text-xs block">
                  Filtro Feed Quote Preferito:
                </span>
                <select
                  value={localConfig.preferredOddsSource || 'all'}
                  onChange={(e) => setLocalConfig({ ...localConfig, preferredOddsSource: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Tutti i Bookmaker Rilevati</option>
                  <option value="Bet365">Priorità Bet365</option>
                  <option value="Pinnacle">Priorità Pinnacle (Closing Line)</option>
                  <option value="Media">Media di Mercato Consenso</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ripristina Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Applica e Ricalcola</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
