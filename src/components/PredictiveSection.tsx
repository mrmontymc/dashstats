import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Target,
  Shield,
  HelpCircle,
  ChevronRight,
  Filter,
  Sliders,
  Award
} from 'lucide-react';
import { Match, TeamStats, TeamPredictiveProfile, AnalysisConfig } from '../types/football';
import { computePredictiveProfiles } from '../utils/predictiveEngine';

interface PredictiveSectionProps {
  matches: Match[];
  standings: TeamStats[];
  onSelectTeam: (team: string) => void;
  selectedTeam?: string;
  config?: AnalysisConfig;
  onOpenConfig?: () => void;
  isFiltered?: boolean;
}

export const PredictiveSection: React.FC<PredictiveSectionProps> = ({
  matches,
  standings,
  onSelectTeam,
  selectedTeam,
  config,
  onOpenConfig,
  isFiltered,
}) => {
  const [filterArchetype, setFilterArchetype] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'momentum' | 'projections' | 'regression' | 'archetypes' | 'elo'>('momentum');

  // Calcola profili predittivi iterando su tutti i dati
  const profiles = React.useMemo(() => {
    return computePredictiveProfiles(matches, standings, config);
  }, [matches, standings, config]);

  const profilesMap = React.useMemo(() => {
    const map = new Map<string, TeamPredictiveProfile>();
    profiles.forEach((p) => map.set(p.team, p));
    return map;
  }, [profiles]);

  const filteredProfiles = profiles.filter((p) => {
    if (filterArchetype === 'all') return true;
    return p.archetype === filterArchetype;
  });

  // Trova le squadre top momentum e peggior momentum
  const sortedByMomentum = [...profiles].sort((a, b) => b.momentumScore - a.momentumScore);
  const hotStreakTeams = sortedByMomentum.slice(0, 3);
  const coldStreakTeams = sortedByMomentum.slice(-3).reverse();

  // Trova le squadre con maggiore over/underperformance xG
  const sortedByXgDelta = [...profiles].sort((a, b) => b.xgDelta - a.xgDelta);
  const overperformingXg = sortedByXgDelta.slice(0, 3);
  const underperformingXg = sortedByXgDelta.slice(-3).reverse();

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Laboratorio di Analisi Predittiva & Trend Prestazionali
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Il motore iterativo elabora la totalità dei dati storici delle partite ({matches.length} gare), 
              calcolando indici di efficienza attacco/difesa ponderati, momentum statistico (EWMA), 
              simulazioni Monte Carlo e modelli Poisson per anticipare la traiettoria di ogni singola squadra.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenConfig && (
              <button
                onClick={onOpenConfig}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm"
                title="Personalizza parametri del modello predittivo"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Personalizza Modello</span>
              </button>
            )}
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Modello Predittivo</div>
              <div className="text-xs text-emerald-400 font-semibold">
                {config?.metricBasis === 'xg' ? 'xG Driven' : 'Gol Reali'} · EWMA {Math.round((config?.recentFormWeight ?? 0.4) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {isFiltered && (
          <div className="mt-4 p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-md text-[11px] text-emerald-400 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>⚡ Analisi Predittiva applicata sul subset filtrato ({matches.length} gare · {standings.length} squadre)</span>
            <span className="text-slate-400">Ponderazione calibrata sui dati selezionati</span>
          </div>
        )}

        {/* Highlight Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          {/* Card 1: Top Momentum */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-md p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Miglior Trend (Momentum)
              </span>
              <span className="font-mono text-[11px] text-slate-500">Ultime 5</span>
            </div>
            <div className="text-sm font-bold text-slate-100 mt-1">
              {hotStreakTeams[0]?.team || '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              +{hotStreakTeams[0]?.ppgDelta > 0 ? `+${hotStreakTeams[0]?.ppgDelta}` : hotStreakTeams[0]?.ppgDelta} PPG vs media stagione
            </div>
          </div>

          {/* Card 2: Flessione Recente */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-md p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-rose-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Flessione Recente
              </span>
              <span className="font-mono text-[11px] text-slate-500">Allerta calo</span>
            </div>
            <div className="text-sm font-bold text-slate-100 mt-1">
              {coldStreakTeams[0]?.team || '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {coldStreakTeams[0]?.ppgDelta} PPG vs media stagione
            </div>
          </div>

          {/* Card 3: Rischio Regressione xG */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-md p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Overperforming xG
              </span>
              <span className="font-mono text-[11px] text-slate-500">Cinismo elevato</span>
            </div>
            <div className="text-sm font-bold text-slate-100 mt-1">
              {overperformingXg[0]?.team || '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              +{overperformingXg[0]?.xgDelta} gol rispetto agli xG attesi
            </div>
          </div>

          {/* Card 4: Potenziale Rimbalzo Positivo */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-md p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-sky-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Rimbalzo Atteso
              </span>
              <span className="font-mono text-[11px] text-slate-500">Underperforming</span>
            </div>
            <div className="text-sm font-bold text-slate-100 mt-1">
              {underperformingXg[0]?.team || '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {underperformingXg[0]?.xgDelta} gol rispetto a mole xG
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('momentum')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'momentum'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tabella Momentum & Forma
          </button>
          <button
            onClick={() => setActiveTab('projections')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'projections'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Proiezioni Monte Carlo Punti
          </button>
          <button
            onClick={() => setActiveTab('regression')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'regression'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Analisi Regressione xG
          </button>
          <button
            onClick={() => setActiveTab('archetypes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'archetypes'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Archetipi Tattici
          </button>
          <button
            onClick={() => setActiveTab('elo')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'elo'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Power Ranking Elo</span>
          </button>
        </div>

        {/* Archetype filter dropdown */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterArchetype}
            onChange={(e) => setFilterArchetype(e.target.value)}
            aria-label="Filtra per profilo tattico"
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">Tutti gli archetipi</option>
            <option value="Dominante ad Alto Volume">Dominante ad Alto Volume</option>
            <option value="Cinica in Transizione">Cinica in Transizione</option>
            <option value="Fortezza Difensiva">Fortezza Difensiva</option>
            <option value="Fragile / A Visto Aperto">Fragile / A Visto Aperto</option>
            <option value="In Crisi Realizzativa">In Crisi Realizzativa</option>
            <option value="Equilibrata / Controllo">Equilibrata / Controllo</option>
          </select>
        </div>
      </div>

      {/* View 1: Momentum & Form Ranking */}
      {activeTab === 'momentum' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Classifica dinamica del momentum e dell'accelerazione prestazionale</span>
            <span className="font-mono text-slate-500">Delta PPG = PPG recenti (5 gare) - PPG stagione</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Squadra</th>
                  <th className="py-2.5 px-3">Stato Momentum</th>
                  <th className="py-2.5 px-2.5 text-right">Indice [-100/+100]</th>
                  <th className="py-2.5 px-2.5 text-right">PPG Recente</th>
                  <th className="py-2.5 px-2.5 text-right">PPG Stagione</th>
                  <th className="py-2.5 px-2.5 text-right">Delta PPG</th>
                  <th className="py-2.5 px-3 text-right">Consistenza Realizzativa</th>
                  <th className="py-2.5 px-3">Archetipo Rilevato</th>
                  <th className="py-2.5 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedByMomentum
                  .filter((p) => filterArchetype === 'all' || p.archetype === filterArchetype)
                  .map((p) => {
                    const isSelected = selectedTeam === p.team;
                    let statusColor = 'text-slate-400';
                    let barColor = 'bg-slate-600';
                    if (p.momentumStatus === 'In ascesa forte') {
                      statusColor = 'text-emerald-400 font-semibold';
                      barColor = 'bg-emerald-500';
                    } else if (p.momentumStatus === 'Positivo') {
                      statusColor = 'text-teal-400';
                      barColor = 'bg-teal-500';
                    } else if (p.momentumStatus === 'In flessione') {
                      statusColor = 'text-amber-400';
                      barColor = 'bg-amber-500';
                    } else if (p.momentumStatus === 'Critico') {
                      statusColor = 'text-rose-400 font-semibold';
                      barColor = 'bg-rose-500';
                    }

                    return (
                      <tr
                        key={p.team}
                        onClick={() => onSelectTeam(p.team)}
                        className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-800/80' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                          {p.team}
                        </td>
                        <td className={`py-2.5 px-3 ${statusColor} font-sans text-xs`}>
                          {p.momentumStatus}
                        </td>
                        <td className="py-2.5 px-2.5 text-right tabular-nums">
                          <span
                            className={
                              p.momentumScore > 0
                                ? 'text-emerald-400'
                                : p.momentumScore < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {p.momentumScore > 0 ? `+${p.momentumScore}` : p.momentumScore}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right tabular-nums text-slate-200">
                          {p.recentPpg.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right tabular-nums text-slate-400">
                          {p.seasonPpg.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right tabular-nums">
                          <span
                            className={
                              p.ppgDelta > 0
                                ? 'text-emerald-400 font-medium'
                                : p.ppgDelta < 0
                                ? 'text-rose-400 font-medium'
                                : 'text-slate-400'
                            }
                          >
                            {p.ppgDelta > 0 ? `+${p.ppgDelta}` : p.ppgDelta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">
                          <div className="flex items-center justify-end gap-2">
                            <span>{p.scoringConsistency}%</span>
                            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-400 rounded-full"
                                style={{ width: `${p.scoringConsistency}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-xs text-slate-400">
                          {p.archetype}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Monte Carlo Projections */}
      {activeTab === 'projections' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Stima probabilistica punti finali (Intervallo di confidenza 10°-90° percentile)</span>
            <span className="font-mono text-slate-500">Simulazione basata su calendario a 38 giornate</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Squadra</th>
                  <th className="py-2.5 px-2.5 text-right">Punti Attuali</th>
                  <th className="py-2.5 px-3 text-right">Punti Proiettati (Mediana)</th>
                  <th className="py-2.5 px-3 text-center min-w-[160px]">Range Previsto [P10 - P90]</th>
                  <th className="py-2.5 px-3 text-right">Prob. Scudetto</th>
                  <th className="py-2.5 px-3 text-right">Prob. Top 4 (UCL)</th>
                  <th className="py-2.5 px-3 text-right">Rischio Retrocessione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {[...profiles]
                  .sort((a, b) => b.projectedPointsMedian - a.projectedPointsMedian)
                  .map((p) => {
                    const ts = standings.find((s) => s.team === p.team);
                    const currentPts = ts ? ts.points : 0;
                    const isSelected = selectedTeam === p.team;

                    return (
                      <tr
                        key={p.team}
                        onClick={() => onSelectTeam(p.team)}
                        className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-800/80' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                          {p.team}
                        </td>
                        <td className="py-2.5 px-2.5 text-right tabular-nums text-slate-400">
                          {currentPts}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400 tabular-nums text-sm">
                          {p.projectedPointsMedian} pt
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs tabular-nums">
                            <span>{p.projectedPointsRange[0]}</span>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full relative">
                              <div
                                className="absolute top-0 bottom-0 bg-emerald-500/70 rounded-full"
                                style={{
                                  left: `${Math.min(100, (p.projectedPointsRange[0] / 100) * 100)}%`,
                                  right: `${Math.max(0, 100 - (p.projectedPointsRange[1] / 100) * 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span>{p.projectedPointsRange[1]}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {p.titleProbability > 0 ? (
                            <span className="text-amber-400 font-semibold">{p.titleProbability}%</span>
                          ) : (
                            <span className="text-slate-600">&lt;1%</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {p.top4Probability > 0 ? (
                            <span className="text-emerald-400 font-medium">{p.top4Probability}%</span>
                          ) : (
                            <span className="text-slate-600">&lt;1%</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {p.relegationProbability > 0 ? (
                            <span className="text-rose-400 font-semibold">{p.relegationProbability}%</span>
                          ) : (
                            <span className="text-slate-600">&lt;1%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: xG Regression Analysis */}
      {activeTab === 'regression' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-4 leading-relaxed">
            L'indicatore <strong className="text-slate-200">xG Delta (Gol segnati - xG prodotti)</strong> identifica le discrepanze tra qualità delle conclusioni e risultato effettivo. Nel medio periodo, i modelli statistici evidenziano una forte tendenza alla regressione verso la media: squadre iper-efficienti rischiano flessioni realizzative, mentre formazioni con xG Delta ampiamente negativo tendono a risalire la china.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Squadre in Overperformance */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Rischio Flessione (Overperformance Realizzativa)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Hanno segnato significativamente più gol rispetto a quanto prodotto. Alta probabilità di calo realizzativo.
              </p>
              <div className="space-y-2">
                {overperformingXg.map((p) => {
                  const ts = standings.find((s) => s.team === p.team);
                  return (
                    <div
                      key={p.team}
                      onClick={() => onSelectTeam(p.team)}
                      className="p-2 bg-slate-900/50 hover:bg-slate-900 rounded border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{p.team}</span>
                        <span className="font-mono text-amber-400 font-semibold tabular-nums">
                          +{p.xgDelta} gol vs xG
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                        <span>Gol: {ts?.goalsFor} · xG: {ts?.totalXg}</span>
                        <span>Conv: {ts?.shotConversionRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Squadre in Underperformance */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Potenziale Rimbalzo (Underperformance / Spreco)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Generano occasioni nitide ma hanno raccolto meno del dovuto. Alta probabilità di incremento reti nel prossimo ciclo.
              </p>
              <div className="space-y-2">
                {underperformingXg.map((p) => {
                  const ts = standings.find((s) => s.team === p.team);
                  return (
                    <div
                      key={p.team}
                      onClick={() => onSelectTeam(p.team)}
                      className="p-2 bg-slate-900/50 hover:bg-slate-900 rounded border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{p.team}</span>
                        <span className="font-mono text-sky-400 font-semibold tabular-nums">
                          {p.xgDelta} gol vs xG
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                        <span>Gol: {ts?.goalsFor} · xG: {ts?.totalXg}</span>
                        <span>Conv: {ts?.shotConversionRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 4: Archetipi Tattici */}
      {activeTab === 'archetypes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProfiles.map((p) => {
            const ts = standings.find((s) => s.team === p.team);
            const isSelected = selectedTeam === p.team;

            let badgeColor = 'text-slate-300';
            if (p.archetype === 'Dominante ad Alto Volume') badgeColor = 'text-emerald-400';
            else if (p.archetype === 'Fortezza Difensiva') badgeColor = 'text-sky-400';
            else if (p.archetype === 'Cinica in Transizione') badgeColor = 'text-cyan-400';
            else if (p.archetype === 'Fragile / A Visto Aperto') badgeColor = 'text-amber-400';
            else if (p.archetype === 'In Crisi Realizzativa') badgeColor = 'text-rose-400';

            return (
              <div
                key={p.team}
                onClick={() => onSelectTeam(p.team)}
                className={`bg-slate-900/60 border rounded-lg p-4 cursor-pointer transition-colors ${
                  isSelected ? 'border-emerald-500 bg-slate-900/90' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-sm font-bold text-slate-100">{p.team}</h3>
                  <span className={`text-xs font-semibold ${badgeColor}`}>
                    {p.archetype}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {p.archetypeDescription}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block">Rating Att.</span>
                    <span className="text-slate-200 font-semibold">{p.attackRating}x</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Rating Dif.</span>
                    <span className="text-slate-200 font-semibold">{p.defenseRating}x</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Possesso</span>
                    <span className="text-slate-200 font-semibold">{ts?.avgPossession}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 5: Power Ranking Elo & Metriche Sintetiche */}
      {activeTab === 'elo' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Power Ranking Dinamico Elo (Rating Indipendente dal Calendario)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Algoritmo matematico a somma zero che pondera ogni gara in base alla forza reale dell'avversario, 
                  allo scarto reti e al fattore campo ({config?.homeAdvantageFactor ?? 1.12}x).
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/40 shrink-0">
                K-Factor: 24 · Base: 1500
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Elo Rank</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Squadra</th>
                    <th className="py-2.5 px-3 text-right">Rating Elo</th>
                    <th className="py-2.5 px-3 text-center">Rank Classifica</th>
                    <th className="py-2.5 px-3 text-center">Delta Efficienza</th>
                    <th className="py-2.5 px-3 text-right">Punti Casa %</th>
                    <th className="py-2.5 px-3 text-right">Diff. Angoli</th>
                    <th className="py-2.5 px-3 text-center">Rimonte 1T</th>
                    <th className="py-2.5 px-3 text-center">Forma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {[...standings]
                    .sort((a, b) => (b.eloRating ?? 1500) - (a.eloRating ?? 1500))
                    .map((teamStat, index) => {
                      const actualRank = standings.findIndex((s) => s.team === teamStat.team) + 1;
                      const eloRank = index + 1;
                      const rankDelta = actualRank - eloRank; // + = rank Elo migliore della classifica

                      return (
                        <tr
                          key={teamStat.team}
                          onClick={() => onSelectTeam(teamStat.team)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                eloRank <= 4
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : eloRank <= 8
                                  ? 'bg-slate-800 text-slate-200'
                                  : 'text-slate-500'
                              }`}
                            >
                              #{eloRank}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans font-semibold text-slate-100">
                            {teamStat.team}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-400 tabular-nums text-sm">
                            {teamStat.eloRating ?? 1500}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400 tabular-nums">
                            #{actualRank} ({teamStat.points} pt)
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {rankDelta > 0 ? (
                              <span className="text-emerald-400 font-semibold text-xs">
                                +{rankDelta} pos. (Sottostimata)
                              </span>
                            ) : rankDelta < 0 ? (
                              <span className="text-rose-400 font-semibold text-xs">
                                {rankDelta} pos. (Sovrastimata)
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">In linea</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                            {teamStat.homeDominanceRatio ?? 50}%
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            <span
                              className={
                                (teamStat.cornerDifferential ?? 0) > 0
                                  ? 'text-cyan-400 font-semibold'
                                  : 'text-slate-500'
                              }
                            >
                              {(teamStat.cornerDifferential ?? 0) > 0
                                ? `+${teamStat.cornerDifferential}`
                                : teamStat.cornerDifferential ?? 0}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center tabular-nums text-emerald-400 font-semibold">
                            {teamStat.comebacksCount ?? 0}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              {teamStat.form.slice(-3).map((f, i) => (
                                <span
                                  key={i}
                                  className={`w-3.5 h-3.5 rounded text-[9px] font-bold flex items-center justify-center ${
                                    f === 'H' ? 'bg-emerald-500/20 text-emerald-400' : f === 'A' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {f === 'H' ? 'V' : f === 'A' ? 'P' : 'N'}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
