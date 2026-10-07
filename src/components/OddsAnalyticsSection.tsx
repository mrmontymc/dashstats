import React, { useState, useMemo } from 'react';
import {
  Coins,
  TrendingUp,
  Percent,
  Flag,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  Calculator,
  ChevronRight,
  BarChart2,
  Sliders,
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Network,
  Scale,
  Activity,
  Layers,
  HelpCircle,
  Binary,
  Compass,
} from 'lucide-react';
import { Match, AnalysisConfig } from '../types/football';
import {
  computeOddsBrackets,
  computeCornerMarketStats,
  findProfitableMarketPatterns,
  computeOddsSourceSummary,
  findValueBets,
  computeStatisticalCorrelations,
  computeMarketConditionalProbabilities,
  calculateNoVigMethods,
  computePredictiveValidationMetrics,
  computeMarketBiases,
} from '../utils/oddsAnalyticsEngine';
import { computePredictiveProfiles, computeTeamStats } from '../utils/predictiveEngine';

interface OddsAnalyticsSectionProps {
  matches: Match[];
  teams: string[];
  onSelectTeam: (team: string) => void;
  config?: AnalysisConfig;
  onOpenConfig?: () => void;
  isFiltered?: boolean;
}

export const OddsAnalyticsSection: React.FC<OddsAnalyticsSectionProps> = ({
  matches,
  teams,
  onSelectTeam,
  config,
  onOpenConfig,
  isFiltered,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profitable' | 'valuebets' | 'correlations' | 'validation' | 'brackets' | 'corners' | 'provenance' | 'calculator'
  >('profitable');
  const [selectedMarketForBrackets, setSelectedMarketForBrackets] = useState<'1' | 'X' | '2' | 'Over25' | 'Under25' | 'BTTS_Yes' | 'CornerOver95'>('1');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Input per calcolatore No-Vig interattivo
  const [noVigHomeOdd, setNoVigHomeOdd] = useState<number>(2.10);
  const [noVigDrawOdd, setNoVigDrawOdd] = useState<number>(3.35);
  const [noVigAwayOdd, setNoVigAwayOdd] = useState<number>(3.70);

  // Provenienza e overround delle quote
  const oddsSummary = useMemo(() => {
    return computeOddsSourceSummary(matches);
  }, [matches]);

  // Profili per calcolo Value Bets
  const predictiveProfiles = useMemo(() => {
    const st = computeTeamStats(matches, config);
    return computePredictiveProfiles(matches, st, config);
  }, [matches, config]);

  const profilesMap = useMemo(() => {
    const map = new Map();
    predictiveProfiles.forEach((p) => map.set(p.team, p));
    return map;
  }, [predictiveProfiles]);

  // Scansione Value Bets
  const valueBets = useMemo(() => {
    return findValueBets(matches, profilesMap, config);
  }, [matches, profilesMap, config]);

  // Calcolo statistiche con useMemo
  const profitablePatterns = useMemo(() => {
    return findProfitableMarketPatterns(matches, teams, config);
  }, [matches, teams, config]);

  const cornerStats = useMemo(() => {
    return computeCornerMarketStats(matches, teams);
  }, [matches, teams]);

  const bracketsAnalysis = useMemo(() => {
    return computeOddsBrackets(matches, selectedMarketForBrackets, config?.flatStake ?? 100);
  }, [matches, selectedMarketForBrackets, config]);

  // Abbinamenti statistici e correlazioni empiriche da documento tecnico
  const statisticalCorrelations = useMemo(() => {
    return computeStatisticalCorrelations(matches);
  }, [matches]);

  // Probabilità condizionate tra mercati
  const conditionalProbabilities = useMemo(() => {
    return computeMarketConditionalProbabilities(matches);
  }, [matches]);

  // Validazione modelli, Brier score, RPS, overdispersion
  const validationMetrics = useMemo(() => {
    return computePredictiveValidationMetrics(matches);
  }, [matches]);

  // Bias di mercato
  const marketBiases = useMemo(() => {
    return computeMarketBiases(matches);
  }, [matches]);

  // Risultati No-Vig calcolati
  const noVigResults = useMemo(() => {
    return calculateNoVigMethods(noVigHomeOdd || 2.0, noVigDrawOdd || 3.0, noVigAwayOdd || 3.0);
  }, [noVigHomeOdd, noVigDrawOdd, noVigAwayOdd]);

  // Calcolo filtri per la tabella mercati profittevoli
  const filteredPatterns = profitablePatterns.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  // State per calcolatore Valore Atteso (+EV)
  const [calcOdds, setCalcOdds] = useState<number>(2.10);
  const [calcEstimatedProb, setCalcEstimatedProb] = useState<number>(54);

  const calcImpliedProb = Number(((1 / (calcOdds || 1)) * 100).toFixed(1));
  const calcEdgePct = Number((calcEstimatedProb - calcImpliedProb).toFixed(1));
  const calcEvFlat100 = Number(((calcEstimatedProb / 100) * (calcOdds * 100 - 100) - ((100 - calcEstimatedProb) / 100) * 100).toFixed(2));
  // Criterio di Kelly frazionario: (b*p - q) / b
  const b = calcOdds - 1;
  const p = calcEstimatedProb / 100;
  const q = 1 - p;
  const kellyPct = b > 0 ? Math.max(0, Number((((b * p - q) / b) * 100).toFixed(1))) : 0;

  return (
    <div className="space-y-6">
      {/* Section Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Coins className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Analisi Quote Bookmaker, Range & Mercati Profittevoli
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Analisi quantitativa dei mercati di scommessa calcistica: verifica la convergenza tra probabilità implicita 
              delle quote e frequenza effettiva di realizzazione per identificare range sistematicamente a valore (+EV), 
              approfondimenti sui calci d'angolo e pattern con ROI positivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenConfig && (
              <button
                onClick={onOpenConfig}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm"
                title="Personalizza parametri scommesse, ROI minimo e stake"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Personalizza Analisi</span>
              </button>
            )}
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Feed Quote & Aggio</div>
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <span>{oddsSummary.primarySource.split('(')[0]}</span>
                <span className="text-slate-400 text-[11px]">({oddsSummary.avgOverround}%)</span>
              </div>
            </div>
          </div>
        </div>

        {isFiltered && (
          <div className="mt-4 p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-md text-[11px] text-emerald-400 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>⚡ Analisi quote, fasce e mercati filtrati in tempo reale ({matches.length} gare corrispondenti)</span>
            <span className="text-slate-400">Ricalcolato con stake €{config?.flatStake ?? 100}</span>
          </div>
        )}

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 font-mono text-xs">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md">
            <div className="text-[11px] text-slate-400 font-sans">Gare con Quote</div>
            <div className="text-lg font-bold text-white mt-0.5 tabular-nums">
              {matches.filter((m) => !!m.homeOdds).length}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold truncate">{oddsSummary.primarySource}</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md">
            <div className="text-[11px] text-slate-400 font-sans">Miglior ROI Pattern</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">
              +{profitablePatterns[0]?.roiPct || 0}%
            </div>
            <div className="text-[10px] text-slate-500 truncate">{profitablePatterns[0]?.title || '-'}</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md">
            <div className="text-[11px] text-slate-400 font-sans">Media Calci d'Angolo</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5 tabular-nums">
              {cornerStats.avgCornersPerMatch}
            </div>
            <div className="text-[10px] text-slate-500">Over 9.5: {cornerStats.over95Pct}%</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md">
            <div className="text-[11px] text-slate-400 font-sans">Value Bets Rilevate</div>
            <div className="text-lg font-bold text-purple-400 mt-0.5 tabular-nums">
              {valueBets.length}
            </div>
            <div className="text-[10px] text-slate-500">
              Win Rate: {valueBets.length > 0 ? ((valueBets.filter(v => v.actualWon).length / valueBets.length) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setActiveTab('profitable')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profitable'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Serie Mercati Profittevoli</span>
          </button>
          <button
            onClick={() => setActiveTab('valuebets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'valuebets'
                ? 'bg-slate-800 text-purple-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Value Bets (+EV) Scanner ({valueBets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'correlations'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Abbinamenti & Correlazioni Statistiche ({statisticalCorrelations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'validation'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Efficienza Mercato & No-Vig</span>
          </button>
          <button
            onClick={() => setActiveTab('brackets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'brackets'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Range di Quota</span>
          </button>
          <button
            onClick={() => setActiveTab('corners')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'corners'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-amber-400" />
            <span>Calci d'Angolo</span>
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'provenance'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Lavagna & Aggio</span>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Calcolatore +EV</span>
          </button>
        </div>

        {/* Filter for Profitable Patterns */}
        {activeTab === 'profitable' && (
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tutte le categorie ({profitablePatterns.length})</option>
              <option value="1X2">Esiti 1X2</option>
              <option value="Gol / Under-Over">Gol / Under-Over</option>
              <option value="Goal-NoGoal">Goal / No Goal</option>
              <option value="Calci d'Angolo">Calci d'Angolo</option>
              <option value="Squadra Specifica">Squadre Specifiche</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Serie di Mercati Profittevoli (+EV Opportunities) */}
      {activeTab === 'profitable' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span className="font-semibold text-slate-200">
                  Riepilogo delle Tendenze con Rendimento Positivo (Flat Stake 100€)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pattern con almeno 8-10 scommesse simulate dove la frequenza reale supera la probabilità prezzata dai bookmaker.
                </p>
              </div>
              <span className="font-mono text-slate-500">{filteredPatterns.length} strategie rilevate</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Mercato / Pattern</th>
                    <th className="py-2.5 px-2.5">Categoria</th>
                    <th className="py-2.5 px-2.5 text-center">Vinte / Giocate</th>
                    <th className="py-2.5 px-2.5 text-right">Win Rate %</th>
                    <th className="py-2.5 px-2.5 text-right">Quota Media</th>
                    <th className="py-2.5 px-3 text-right">Profitto Netto (100€)</th>
                    <th className="py-2.5 px-3 text-right">ROI %</th>
                    <th className="py-2.5 px-3 text-center">Affidabilità</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredPatterns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                        Nessun mercato profittevole riscontrato per la categoria selezionata con i parametri attuali.
                      </td>
                    </tr>
                  ) : (
                    filteredPatterns.map((p) => {
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <span>{p.title}</span>
                              {p.teamScope && (
                                <button
                                  onClick={() => onSelectTeam(p.teamScope!)}
                                  className="text-emerald-400 hover:underline text-[11px]"
                                >
                                  [Scheda]
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                              {p.description}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 font-sans text-[11px] text-slate-400">
                            {p.category}
                          </td>
                          <td className="py-2.5 px-2.5 text-center tabular-nums text-slate-300">
                            <span className="text-emerald-400 font-semibold">{p.wonBets}</span>
                            <span className="text-slate-500"> / {p.totalBets}</span>
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-semibold text-slate-200 tabular-nums">
                            {p.winRatePct}%
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-slate-300 tabular-nums">
                            {p.avgOdds.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400 tabular-nums">
                            +{p.totalProfitFlat} €
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400 tabular-nums text-sm">
                            +{p.roiPct}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[11px] font-sans font-medium ${
                                p.confidenceScore === 'Molto Alto'
                                  ? 'text-emerald-400'
                                  : p.confidenceScore === 'Alto'
                                  ? 'text-teal-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {p.confidenceScore}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Matrice Abbinamenti Statistiche & Correlazioni Quote */}
      {activeTab === 'correlations' && (
        <div className="space-y-6">
          {/* Header Banner for Correlations */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Network className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Matrice di Abbinamento tra Statistiche di Campo e Mercati Quote
                  </h3>
                </div>
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  Confronto empirico e accoppiamento logico tra metriche oggettive di prestazione (xG, tiri nello specchio, corner, falli, possesso) 
                  e comportamento delle quote. I coefficienti di correlazione lineare (Pearson r) e di rango (Spearman ρ) misurano la forza statistica del legame nel dataset attivo.
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 shrink-0">
                <span className="text-slate-500 text-[10px] block">Campione Analizzato</span>
                <span className="text-cyan-400 font-bold">{matches.length} partite</span>
              </div>
            </div>
          </div>

          {/* Correlations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {statisticalCorrelations.map((pair) => {
              const isStrong = Math.abs(pair.pearsonR) >= 0.55;
              const isPositive = pair.pearsonR >= 0;
              return (
                <div
                  key={pair.id}
                  className="p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono border bg-slate-900 border-slate-700 text-slate-300">
                        {pair.targetMarket}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          pair.strength === 'Forte'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        }`}
                      >
                        {pair.strength} Correlazione
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mb-1">
                      {pair.featureA} ↔ {pair.featureB}
                    </h4>

                    {/* Numerical Coefficients */}
                    <div className="grid grid-cols-2 gap-2 my-2.5 p-2 bg-slate-900/60 rounded border border-slate-800/80 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Pearson (r)</span>
                        <span className={`text-sm font-bold ${isStrong ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {isPositive ? `+${pair.pearsonR}` : pair.pearsonR}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Spearman (ρ)</span>
                        <span className="text-sm font-bold text-cyan-400">
                          {pair.spearmanRho > 0 ? `+${pair.spearmanRho}` : pair.spearmanRho}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                      {pair.interpretation}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 text-[11px]">
                    <span className="text-emerald-400 font-semibold block mb-0.5 flex items-center gap-1 font-mono text-[10px]">
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      STRATEGIA SULLE QUOTE:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {pair.bettingImplication}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conditional Probabilities between Markets Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Binary className="w-4 h-4 text-emerald-400" />
                  <span>Probabilità Condizionate tra Mercati Incrociati</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Frequenza empirica reale vs modello teorico di correlazione: scopri come il verificarsi di un esito (es. Segno 1) influenza la probabilità di Over o BTTS.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">{conditionalProbabilities.length} combinazioni chiave</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
              {conditionalProbabilities.map((cond) => {
                const isOverperforming = cond.deltaPct > 0;
                return (
                  <div key={cond.id} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-emerald-400 font-bold text-sm">{cond.formulaSymbol}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{cond.sampleMatches} gare campione</span>
                      </div>
                      <div className="text-[11px] font-sans text-slate-300 font-medium mb-1">
                        {cond.condition}
                      </div>
                      <div className="text-[10px] font-sans text-slate-400 mb-2.5">
                        Evento target: <strong className="text-slate-200">{cond.targetEvent}</strong>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-900 rounded border border-slate-800 text-center text-xs mb-2.5">
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Empirica</span>
                          <span className="font-bold text-white tabular-nums">{cond.empiricalPct}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Modello</span>
                          <span className="font-bold text-slate-400 tabular-nums">{cond.modelPct}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Delta</span>
                          <span className={`font-bold tabular-nums ${isOverperforming ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isOverperforming ? `+${cond.deltaPct}%` : `${cond.deltaPct}%`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[10px] font-sans text-slate-400">
                      <span className="text-slate-300 font-medium block">Segnale operativo:</span>
                      <p className="mt-0.5 text-slate-400 leading-snug">{cond.marketSignal}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference Table of Fundamental Soccer Statistical Pairings */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Guida Operativa Completa agli Abbinamenti Statistiche & Quote</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Tavola sinottica dei 12 abbinamenti metodologici per la costruzione di quote euristiche e individuazione di Value Bet:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Statistica A</th>
                    <th className="py-2.5 px-3">Statistica B</th>
                    <th className="py-2.5 px-3">Mercato Connesso</th>
                    <th className="py-2.5 px-3">Logica Tattica & Analitica</th>
                    <th className="py-2.5 px-3 text-right">Applicazione Quota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-emerald-400 font-semibold font-sans">xG (Expected Goals)</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">xGA (Concessi)</td>
                    <td className="py-2 px-3 text-slate-300">1X2, Over/Under, BTTS</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Misura la forza intrinseca offensiva e difensiva al netto del caso</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-semibold">Value Bet su favorito falso</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-emerald-400 font-semibold font-sans">Tiri nello Specchio</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Gol Effettivi</td>
                    <td className="py-2 px-3 text-slate-300">Over/Under, BTTS</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Indice di efficienza realizzativa e cinismo in area di rigore</td>
                    <td className="py-2 px-3 text-right text-cyan-400 font-semibold">Regressione verso la media</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-emerald-400 font-semibold font-sans">Possesso Palla (%)</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">PPDA / Pressione</td>
                    <td className="py-2 px-3 text-slate-300">Corner, Cartellini, Ritmo</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Squadra dominante vs pressing alto, controllo delle transizioni</td>
                    <td className="py-2 px-3 text-right text-amber-400 font-semibold">Ritmo di gara e total goal</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-emerald-400 font-semibold font-sans">Cross dal Fondo / Ali</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Calci d'Angolo</td>
                    <td className="py-2 px-3 text-slate-300">Corner Over 8.5/9.5</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Stile di gioco orientato alle corsie esterne e deviazioni sul fondo</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-semibold">Over Corner sistematico</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-emerald-400 font-semibold font-sans">Falli Commessi</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Media Arbitro Cartellini</td>
                    <td className="py-2 px-3 text-slate-300">Over Cartellini, Rossi</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Propensione disciplinare incrociata con la severità della terna</td>
                    <td className="py-2 px-3 text-right text-rose-400 font-semibold">Linee sanzioni disciplinari</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-emerald-400 font-semibold font-sans">Forma Recente (EWMA)</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Difficoltà Calendario</td>
                    <td className="py-2 px-3 text-slate-300">1X2, Doppia Chance</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Punti recenti ponderati per il livello reale degli avversari affrontati</td>
                    <td className="py-2 px-3 text-right text-cyan-400 font-semibold">Stima Elo dinamica</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-emerald-400 font-semibold font-sans">Quote Bookmaker</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Stima Dixon-Coles</td>
                    <td className="py-2 px-3 text-slate-300">Tutti i Mercati</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Divergenza tra prezzo quotato e probabilità calcolata con no-vig</td>
                    <td className="py-2 px-3 text-right text-purple-400 font-semibold">+EV & Staking di Kelly</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-emerald-400 font-semibold font-sans">Movimento Opening/Closing</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Volume di Mercato</td>
                    <td className="py-2 px-3 text-slate-300">Closing Line Value (CLV)</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Rilevamento flussi di denaro informato (Steam Move & Reverse Line)</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-semibold">Beat The Closing Line</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Efficienza Mercato, No-Vig & Validazione Predittiva */}
      {activeTab === 'validation' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Scale className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Efficienza del Mercato, Validazione Predittiva & Modelli No-Vig
                  </h3>
                </div>
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  Confronto avanzato dei metodi di rimozione del margine (Proporzionale vs Shin vs Power), 
                  metriche di accuratezza probabilistica (Brier Score, RPS, Log Loss), test di overdispersion sui gol totali 
                  e verifica dei bias di mercato (Favorite-Longshot, Draw bias, Home bias).
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 shrink-0">
                <span className="text-slate-500 text-[10px] block">Test di Overdispersion</span>
                <span className={validationMetrics.isOverdispersed ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  Ratio {validationMetrics.overdispersionRatio} ({validationMetrics.isOverdispersed ? 'NegBinomial' : 'Poisson'})
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Interactive No-Vig Calculator comparing Proportional, Shin & Power */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Calcolatore No-Vig Comparativo: Proporzionale vs Modello Shin vs Power</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Digita le quote 1-X-2 per confrontare l'aggio reale e le quote eque (Fair Odds) stimate con ciascun modello matematico.
                </p>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-950 px-3 py-1 rounded border border-slate-800 shrink-0">
                Aggio Banco Rilevato: <strong className="text-emerald-400 font-bold">{noVigResults.rawOverroundPct}%</strong>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">QUOTA SEGNO 1 (CASA)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-slate-500 font-mono text-xs">@</span>
                  <input
                    type="number"
                    step="0.05"
                    min="1.01"
                    max="50"
                    value={noVigHomeOdd}
                    onChange={(e) => setNoVigHomeOdd(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-slate-900 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">QUOTA SEGNO X (PAREGGIO)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-slate-500 font-mono text-xs">@</span>
                  <input
                    type="number"
                    step="0.05"
                    min="1.01"
                    max="50"
                    value={noVigDrawOdd}
                    onChange={(e) => setNoVigDrawOdd(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-slate-900 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">QUOTA SEGNO 2 (TRASFERTA)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-slate-500 font-mono text-xs">@</span>
                  <input
                    type="number"
                    step="0.05"
                    min="1.01"
                    max="50"
                    value={noVigAwayOdd}
                    onChange={(e) => setNoVigAwayOdd(parseFloat(e.target.value) || 1.01)}
                    className="w-full bg-slate-900 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Methods Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Method 1: Proportional */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                    <span className="font-bold text-white font-sans">1. Metodo Proporzionale</span>
                    <span className="text-[10px] text-slate-500">Standard</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-400 mb-3 leading-relaxed">
                    Distribuisce il margine in modo uniformemente proporzionale alla probabilità implicita di ciascun esito.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito 1:</span>
                      <span>
                        <strong className="text-emerald-400">{noVigResults.proportional.homeProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.proportional.fairHome.toFixed(2)})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito X:</span>
                      <span>
                        <strong className="text-slate-200">{noVigResults.proportional.drawProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.proportional.fairDraw.toFixed(2)})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito 2:</span>
                      <span>
                        <strong className="text-cyan-400">{noVigResults.proportional.awayProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.proportional.fairAway.toFixed(2)})</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Method 2: Shin Method */}
              <div className="p-4 bg-slate-950 rounded-lg border border-emerald-900/60 bg-emerald-950/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-900/40">
                    <span className="font-bold text-emerald-400 font-sans">2. Modello di Shin (1993)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">z={noVigResults.shin.zParameter}%</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-300 mb-3 leading-relaxed">
                    Stima la presenza di scommettitori con informazioni privilegiate (z). Corregge il celebre <strong>Longshot Bias</strong> scaricando l'aggio dai favoriti.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito 1:</span>
                      <span>
                        <strong className="text-emerald-400">{noVigResults.shin.homeProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.shin.fairHome.toFixed(2)})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito X:</span>
                      <span>
                        <strong className="text-slate-200">{noVigResults.shin.drawProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.shin.fairDraw.toFixed(2)})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito 2:</span>
                      <span>
                        <strong className="text-cyan-400">{noVigResults.shin.awayProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.shin.fairAway.toFixed(2)})</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Method 3: Power Method */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                    <span className="font-bold text-cyan-400 font-sans">3. Metodo Power</span>
                    <span className="text-[10px] text-cyan-400 font-mono">k={noVigResults.power.kExponent}</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-400 mb-3 leading-relaxed">
                    Eleva le probabilità inverse alla potenza esponenziale k fino a pareggiare la somma al 100%. Ideale per mercati calcistici liquidi.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito 1:</span>
                      <span>
                        <strong className="text-emerald-400">{noVigResults.power.homeProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.power.fairHome.toFixed(2)})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito X:</span>
                      <span>
                        <strong className="text-slate-200">{noVigResults.power.drawProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.power.fairDraw.toFixed(2)})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                      <span className="text-slate-400">Esito 2:</span>
                      <span>
                        <strong className="text-cyan-400">{noVigResults.power.awayProb}%</strong>{' '}
                        <span className="text-slate-500">(Fair @{noVigResults.power.fairAway.toFixed(2)})</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Predictive Validation Metrics (Brier, RPS, Log Loss, Overdispersion) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Validation Metrics Card */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Metriche di Accuratezza Probabilistica</span>
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Punteggi statistici di calibrazione e dispersione calcolati su tutte le gare con quote registrate:
              </p>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">Brier Score 1X2</span>
                  <span className="text-lg font-bold text-emerald-400 tabular-nums">
                    {validationMetrics.brierScore1X2}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Benchmark ottimale &lt; 0.22</span>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">Ranked Probability (RPS)</span>
                  <span className="text-lg font-bold text-cyan-400 tabular-nums">
                    {validationMetrics.rankedProbabilityScore}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Penalizza errori ordinali</span>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">Log Loss (Cross-Entropy)</span>
                  <span className="text-lg font-bold text-white tabular-nums">
                    {validationMetrics.logLoss1X2}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Distanza informativa</span>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">Brier Over 2.5 / BTTS</span>
                  <span className="text-lg font-bold text-amber-400 tabular-nums">
                    {validationMetrics.brierScoreOver25} / {validationMetrics.brierScoreBtts}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Calibrazione mercati gol</span>
                </div>
              </div>

              {/* Overdispersion test panel */}
              <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 font-sans font-semibold">Test Overdispersion Reti Totali:</span>
                  <span className={validationMetrics.isOverdispersed ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    Var/Media = {validationMetrics.overdispersionRatio}
                  </span>
                </div>
                <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
                  Media gol: <strong className="text-slate-200">{validationMetrics.meanGoals}</strong> · Varianza gol: <strong className="text-slate-200">{validationMetrics.varianceGoals}</strong>. 
                  {validationMetrics.isOverdispersed
                    ? ' Poiché la varianza supera sensibilmente la media (>1.15), il modello adotta correzioni Dixon-Coles e Binomiale Negativa per catturare i pareggi a basso punteggio.'
                    : ' La distribuzione dei gol è perfettamente conforme a Poisson semplice (Var ≈ Media).'}
                </p>
              </div>
            </div>

            {/* Calibration Plot / Buckets */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>Curva di Calibrazione delle Quote (Fasce Probabilità)</span>
                </h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Confronto tra probabilità attesa stimata dal banco e percentuale reale di vittorie osservata:
                </p>

                <div className="space-y-2.5 font-mono text-xs">
                  {validationMetrics.calibrationBuckets.map((bucket, i) => {
                    const isOver = bucket.calibrationGapPct > 0;
                    return (
                      <div key={i} className="p-2.5 bg-slate-950 rounded border border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-300 font-sans font-medium">Fascia {bucket.bucketLabel}</span>
                          <span className="text-slate-400 text-[11px]">
                            {bucket.sampleSize} partite analizzate
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Attesa: <strong className="text-white">{bucket.expectedProbPct}%</strong></span>
                          <span>Reale: <strong className="text-emerald-400">{bucket.observedFreqPct}%</strong></span>
                          <span>
                            Gap: <strong className={isOver ? 'text-emerald-400' : 'text-rose-400'}>
                              {isOver ? `+${bucket.calibrationGapPct}%` : `${bucket.calibrationGapPct}%`}
                            </strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-sans text-slate-500">
                Un gap vicino a 0 indica che il mercato prezza le probabilità con elevata efficienza quantitativa.
              </div>
            </div>
          </div>

          {/* Section 3: Market Biases Analysis (Favorite-Longshot, Draw, Home) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Diagnosi Empirica dei Bias di Mercato nel Dataset</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Verifica delle anomalie comportamentali storiche documentate nella letteratura del betting calcistico:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Bias 1: Favorite-Longshot */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 font-sans block mb-1">
                    Favorite-Longshot Bias
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 my-2 pb-2 border-b border-slate-800">
                    <span>ROI Favoriti (&le;1.60):</span>
                    <strong className={marketBiases.favoriteLongshotBias.shortOddsRoiPct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {marketBiases.favoriteLongshotBias.shortOddsRoiPct}%
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 my-2 pb-2 border-b border-slate-800">
                    <span>ROI Longshot (&ge;4.50):</span>
                    <strong className={marketBiases.favoriteLongshotBias.longOddsRoiPct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {marketBiases.favoriteLongshotBias.longOddsRoiPct}%
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-2 leading-relaxed">
                  {marketBiases.favoriteLongshotBias.verdict}
                </p>
              </div>

              {/* Bias 2: Draw Bias */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-cyan-400 font-sans block mb-1">
                    Draw Bias (Pareggi)
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 my-2 pb-2 border-b border-slate-800">
                    <span>Pareggi Reali (%):</span>
                    <strong className="text-white">{marketBiases.drawBias.drawActualPct}%</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 my-2 pb-2 border-b border-slate-800">
                    <span>Probabilità Implicita:</span>
                    <strong className="text-slate-300">{marketBiases.drawBias.drawImpliedPct}%</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 my-2 pb-2 border-b border-slate-800">
                    <span>ROI Scommessa Segno X:</span>
                    <strong className={marketBiases.drawBias.drawRoiPct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {marketBiases.drawBias.drawRoiPct > 0 ? `+${marketBiases.drawBias.drawRoiPct}%` : `${marketBiases.drawBias.drawRoiPct}%`}
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-2 leading-relaxed">
                  {marketBiases.drawBias.verdict}
                </p>
              </div>

              {/* Bias 3: Home Advantage Bias */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-400 font-sans block mb-1">
                    Home Advantage Bias
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 my-2 pb-2 border-b border-slate-800">
                    <span>Vittorie Casa Effettive:</span>
                    <strong className="text-emerald-400">{marketBiases.homeAdvantageBias.homeWinActualPct}%</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 my-2 pb-2 border-b border-slate-800">
                    <span>Probabilità Implicita:</span>
                    <strong className="text-slate-300">{marketBiases.homeAdvantageBias.homeWinImpliedPct}%</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 my-2 pb-2 border-b border-slate-800">
                    <span>ROI Scommessa Segno 1:</span>
                    <strong className={marketBiases.homeAdvantageBias.homeRoiPct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {marketBiases.homeAdvantageBias.homeRoiPct > 0 ? `+${marketBiases.homeAdvantageBias.homeRoiPct}%` : `${marketBiases.homeAdvantageBias.homeRoiPct}%`}
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-2 leading-relaxed">
                  {marketBiases.homeAdvantageBias.verdict}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Analisi Range di Quota (Bracket Distribution) */}
      {activeTab === 'brackets' && (
        <div className="space-y-6">
          {/* Market Selector for Brackets */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Seleziona Mercato per l'Analisi delle Fasce di Quota
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confronta la percentuale di successo reale rispetto alla probabilità teorica stimata dalla quota del bookmaker.
                </p>
              </div>

              <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-0.5 overflow-x-auto">
                <button
                  onClick={() => setSelectedMarketForBrackets('1')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedMarketForBrackets === '1'
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Esito 1 (Casa)
                </button>
                <button
                  onClick={() => setSelectedMarketForBrackets('X')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedMarketForBrackets === 'X'
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Esito X (Pareggio)
                </button>
                <button
                  onClick={() => setSelectedMarketForBrackets('2')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedMarketForBrackets === '2'
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Esito 2 (Trasferta)
                </button>
                <button
                  onClick={() => setSelectedMarketForBrackets('Over25')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedMarketForBrackets === 'Over25'
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Over 2.5
                </button>
                <button
                  onClick={() => setSelectedMarketForBrackets('Under25')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedMarketForBrackets === 'Under25'
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Under 2.5
                </button>
                <button
                  onClick={() => setSelectedMarketForBrackets('BTTS_Yes')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedMarketForBrackets === 'BTTS_Yes'
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Goal (GG)
                </button>
                <button
                  onClick={() => setSelectedMarketForBrackets('CornerOver95')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedMarketForBrackets === 'CornerOver95'
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Over 9.5 Angoli
                </button>
              </div>
            </div>

            {/* Brackets Visual Bars Comparison */}
            <div className="space-y-4 mb-6 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Confronto: Frequenza Reale (Verde) vs Probabilità Implicita della Quota (Grigio)</span>
                <span>Valore Positivo (+EV) quando il verde supera il grigio</span>
              </div>

              <div className="space-y-3">
                {bracketsAnalysis.map((b) => {
                  return (
                    <div key={b.bracketLabel} className="p-3 bg-slate-950 rounded border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                        <div className="font-sans font-semibold text-slate-200 flex items-center gap-2">
                          <span>{b.bracketLabel}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({b.wonBets} su {b.totalBets} gare)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">
                            Quota media: <strong className="text-slate-200">{b.avgOdds || '-'}</strong>
                          </span>
                          <span
                            className={`font-bold tabular-nums ${
                              b.roiPct > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ROI {b.roiPct > 0 ? `+${b.roiPct}` : b.roiPct}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {/* Frequenza Reale Bar */}
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="w-24 text-slate-400 text-right">Reale:</span>
                          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, b.actualHitRatePct)}%` }}
                            ></div>
                          </div>
                          <span className="w-12 text-right font-semibold text-emerald-400">
                            {b.actualHitRatePct}%
                          </span>
                        </div>

                        {/* Probabilità Implicita Bar */}
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="w-24 text-slate-500 text-right">Implicita:</span>
                          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-500 rounded-full"
                              style={{ width: `${Math.min(100, b.impliedProbPct)}%` }}
                            ></div>
                          </div>
                          <span className="w-12 text-right text-slate-400">{b.impliedProbPct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Brackets Data Table */}
            <div className="overflow-x-auto border-t border-slate-800 pt-4">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Fascia di Quota</th>
                    <th className="py-2 px-2 text-right">Partite</th>
                    <th className="py-2 px-2 text-right">Vinte</th>
                    <th className="py-2 px-2.5 text-right">Freq. Reale %</th>
                    <th className="py-2 px-2.5 text-right">Prob. Implicita %</th>
                    <th className="py-2 px-2.5 text-right">Delta EV %</th>
                    <th className="py-2 px-2.5 text-right">Quota Media</th>
                    <th className="py-2 px-3 text-right">Profitto (100€)</th>
                    <th className="py-2 px-3 text-right">ROI %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {bracketsAnalysis.map((b) => (
                    <tr key={b.bracketLabel} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-sans font-medium text-slate-200">
                        {b.bracketLabel}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-400 tabular-nums">
                        {b.totalBets}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300 tabular-nums">
                        {b.wonBets}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-200 tabular-nums">
                        {b.actualHitRatePct}%
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-400 tabular-nums">
                        {b.impliedProbPct}%
                      </td>
                      <td className="py-2 px-2.5 text-right tabular-nums">
                        <span
                          className={
                            b.probDeltaPct > 0
                              ? 'text-emerald-400 font-semibold'
                              : b.probDeltaPct < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {b.probDeltaPct > 0 ? `+${b.probDeltaPct}` : b.probDeltaPct}%
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-300 tabular-nums">
                        {b.avgOdds || '-'}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        <span className={b.totalProfitFlat > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {b.totalProfitFlat > 0 ? `+${b.totalProfitFlat}` : b.totalProfitFlat} €
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold tabular-nums">
                        <span className={b.roiPct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {b.roiPct > 0 ? `+${b.roiPct}` : b.roiPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mercato Calci d'Angolo */}
      {activeTab === 'corners' && (
        <div className="space-y-6">
          {/* Corner Thresholds Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block text-[11px] font-sans">Over 8.5 Calci d'Angolo</span>
              <span className="text-xl font-bold text-white mt-1 block">{cornerStats.over85Pct}%</span>
              <span className="text-[10px] text-slate-500">Under 8.5: {(100 - cornerStats.over85Pct).toFixed(1)}%</span>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block text-[11px] font-sans">Over 9.5 Calci d'Angolo</span>
              <span className="text-xl font-bold text-cyan-400 mt-1 block">{cornerStats.over95Pct}%</span>
              <span className="text-[10px] text-slate-500">Soglia standard bookmaker</span>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block text-[11px] font-sans">Over 10.5 Calci d'Angolo</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{cornerStats.over105Pct}%</span>
              <span className="text-[10px] text-slate-500">Alto volume angoli</span>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block text-[11px] font-sans">1X2 Calci d'Angolo</span>
              <div className="text-base font-bold text-white mt-1">
                {cornerStats.homeMostCornersPct}% <span className="text-xs font-normal text-slate-400">Casa</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Ospiti: {cornerStats.awayMostCornersPct}% · Pari: {cornerStats.equalCornersPct}%
              </span>
            </div>
          </div>

          {/* Team Corner Rankings */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                Classifica Squadre per Volume Totale di Corner a Partita
              </span>
              <span className="font-mono text-slate-500">Calciati + Concessi</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Squadra</th>
                    <th className="py-2.5 px-2.5 text-right">Media Totale Gara</th>
                    <th className="py-2.5 px-2.5 text-right">Corner Calciati (Avg)</th>
                    <th className="py-2.5 px-2.5 text-right">Corner Concessi (Avg)</th>
                    <th className="py-2.5 px-2.5 text-right">In Casa (Calciati)</th>
                    <th className="py-2.5 px-2.5 text-right">In Trasferta (Calciati)</th>
                    <th className="py-2.5 px-3 text-right">Over 9.5 % Gara</th>
                    <th className="py-2.5 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {cornerStats.teamCornerRankings.map((t) => (
                    <tr
                      key={t.team}
                      onClick={() => onSelectTeam(t.team)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                        {t.team}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-cyan-400 tabular-nums">
                        {t.avgTotalMatchCorners}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-slate-200 tabular-nums">
                        {t.avgCornersTaken}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-slate-400 tabular-nums">
                        {t.avgCornersConceded}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-slate-300 tabular-nums">
                        {t.homeCornersTakenAvg}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-slate-300 tabular-nums">
                        {t.awayCornersTakenAvg}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-400 tabular-nums">
                        {t.over95Pct}%
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Scanner Value Bets (+EV) */}
      {activeTab === 'valuebets' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Scanner Value Bets (+EV) Rilevate nel Dataset ({valueBets.length})</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Opportunità in cui la probabilità calcolata dal modello supera la quota implicita del bookmaker (+Edge &gt; 2.5%).
                </p>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-400">Puntata simulata: <strong className="text-white">€{config?.flatStake ?? 100}</strong></span>
                <span className="text-emerald-400 font-semibold">
                  Profitto: +{valueBets.reduce((acc, v) => acc + v.profitFlat, 0).toFixed(0)} €
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Match</th>
                    <th className="py-2.5 px-2.5">Mercato / Selezione</th>
                    <th className="py-2.5 px-2.5 text-right">Quota Banco</th>
                    <th className="py-2.5 px-2.5 text-right">Prob. Implicita</th>
                    <th className="py-2.5 px-2.5 text-right">Prob. Modello</th>
                    <th className="py-2.5 px-2.5 text-right">Edge %</th>
                    <th className="py-2.5 px-2.5 text-right">EV %</th>
                    <th className="py-2.5 px-2.5 text-center">Stake Kelly</th>
                    <th className="py-2.5 px-2.5 text-center">Esito Reale</th>
                    <th className="py-2.5 px-3 text-right">P&L (Stake Flat)</th>
                    <th className="py-2.5 px-3 text-left">Feed Quota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {valueBets.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-500 font-sans text-xs">
                        Nessuna Value Bet riscontrata con i parametri attuali (+Edge &gt; 2.5%).
                      </td>
                    </tr>
                  ) : (
                    valueBets.slice(0, 40).map((vb) => (
                      <tr key={vb.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 tabular-nums">{vb.date}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                          {vb.homeTeam} vs {vb.awayTeam}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-semibold text-xs border border-purple-800/40">
                            {vb.marketLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-bold text-white tabular-nums">
                          {vb.bookmakerOdd.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-slate-400 tabular-nums">
                          {vb.impliedProbPct}%
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-semibold text-purple-400 tabular-nums">
                          {vb.modelProbPct}%
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-emerald-400 font-bold tabular-nums">
                          +{vb.edgePct}%
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-bold text-emerald-400 tabular-nums">
                          +{vb.evPct}%
                        </td>
                        <td className="py-2.5 px-2.5 text-center text-cyan-400 tabular-nums">
                          {vb.kellyStakePct}%
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-sans">
                          {vb.actualWon ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[11px] border border-emerald-500/40">
                              VINTA
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold text-[11px] border border-rose-500/40">
                              PERSA
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                          <span className={vb.profitFlat > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {vb.profitFlat > 0 ? `+${vb.profitFlat} €` : `${vb.profitFlat} €`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400 truncate max-w-[140px]">
                          {vb.oddsSource}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Provenienza Quote & Analisi Lavagna Banco (Overround) */}
      {activeTab === 'provenance' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Trasparenza & Provenienza delle Quote dei Bookmaker</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Tracciamento dell'origine dei flussi di quota presenti nel dataset (rilevati automaticamente dai tag di colonna CSV 
                  come Bet365 <code className="text-emerald-400 font-mono">B365</code>, Pinnacle <code className="text-emerald-400 font-mono">PS</code>, 
                  William Hill <code className="text-emerald-400 font-mono">WH</code> o calcolo fair di sintesi) e stima dell'aggio del banco.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-400 font-semibold">
                  Lavagna Media: {oddsSummary.avgOverround}%
                </span>
              </div>
            </div>

            {/* Provider Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-slate-500 uppercase">Provider Principale</span>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{oddsSummary.primarySource}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Feed prioritario utilizzato per la determinazione delle probabilità implicite e del calcolo del ROI.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-slate-500 uppercase">Margine Banco (Overround)</span>
                <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                  {oddsSummary.avgOverround}%
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {oddsSummary.avgOverround <= 3.5 ? (
                    <span className="text-emerald-400 font-semibold">Margine ultra-basso (closing line professionale, ottima estrazione valore).</span>
                  ) : oddsSummary.avgOverround <= 6.0 ? (
                    <span className="text-slate-300 font-semibold">Margine standard di mercato commerciale (~5%-6%).</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">Margine elevato (&gt;6%), richiede maggiore edge per essere battuto.</span>
                  )}
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-slate-500 uppercase">Copertura Quote</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {oddsSummary.totalWithOdds} <span className="text-xs text-slate-500 font-normal">/ {matches.length} gare</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Percentuale di completamento quote 1X2, Gol ed Under/Over registrate nel database.
                </p>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 font-mono uppercase tracking-wider">
                Distribuzione Sorgenti nel Dataset Attivo
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap font-mono">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Sorgente Quote</th>
                      <th className="py-2 px-3 text-right">Partite Coperte</th>
                      <th className="py-2 px-3 text-right">Quota % Archivio</th>
                      <th className="py-2 px-3 text-right">Overround Medio (Margine)</th>
                      <th className="py-2 px-3 text-center">Tipo Linea</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {oddsSummary.sourceBreakdown.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                          {s.source}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                          {s.count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-400 tabular-nums">
                          {s.pct}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-cyan-400 tabular-nums">
                          {s.avgOverround}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans text-[11px] text-slate-400">
                          {s.source.includes('Pinnacle') ? 'Closing Sharp' : s.source.includes('Bet365') ? 'Opening/Closing Retail' : 'Consenso'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'calculator' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold text-white mb-1">
              Calcolatore Valore Atteso (+EV) & Criterio di Kelly
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Inserisci la quota offerta dal bookmaker e la probabilità reale stimata dai modelli statistici 
              per quantificare il margine di valore atteso e il dimensionamento ottimale della puntata.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  QUOTA BOOKMAKER (DECIMALE)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1.01"
                  max="50"
                  value={calcOdds}
                  onChange={(e) => setCalcOdds(parseFloat(e.target.value) || 1.01)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 px-3 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  PROBABILITÀ STIMATA (% REALE)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  value={calcEstimatedProb}
                  onChange={(e) => setCalcEstimatedProb(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 px-3 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-4 font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Prob. Implicita</span>
                  <span className="text-base font-bold text-slate-200">{calcImpliedProb}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Margine / Edge</span>
                  <span
                    className={`text-base font-bold ${
                      calcEdgePct > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {calcEdgePct > 0 ? `+${calcEdgePct}` : calcEdgePct}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">EV su 100€ Flat</span>
                  <span
                    className={`text-base font-bold ${
                      calcEvFlat100 > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {calcEvFlat100 > 0 ? `+${calcEvFlat100}` : calcEvFlat100} €
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Stake Kelly (Ottimale)</span>
                  <span className="text-base font-bold text-cyan-400">{kellyPct}% bankroll</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] font-sans text-slate-400">
                {calcEdgePct > 0 ? (
                  <span className="text-emerald-400 font-semibold">
                    ✓ Scommessa con Valore Atteso Positivo (+EV). La quota {calcOdds.toFixed(2)} sovrastima il rendimento rispetto alla probabilità del {calcEstimatedProb}%.
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold">
                    ✗ Valore Atteso Negativo (-EV). La quota offerta incorpora il margine del bookmaker a svantaggio dello scommettitore.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
