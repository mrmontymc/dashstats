import React, { useState, useMemo, useEffect } from 'react';
import {
  Match,
  TeamStats,
  TeamPredictiveProfile,
  AnalysisConfig,
  BettingAdviceTip,
  MatchCustomOdds,
  StatisticalCorrelationPair,
  MarketConditionalProbability,
  NoVigComparisonResult,
  OddsBracketAnalysis,
  CornerMarketStats,
  ProfitableMarketPattern,
} from '../types/football';
import {
  computePredictiveProfiles,
  computeLeagueMetrics,
  simulateMatch,
} from '../utils/predictiveEngine';
import {
  analyzeHistoricalMatchesWithOdds,
  calculateNoVigMethods,
  computeOddsBrackets,
  findProfitableMarketPatterns,
  computeMarketConditionalProbabilities,
  computeStatisticalCorrelations,
  computeCornerMarketStats,
} from '../utils/oddsAnalyticsEngine';
import {
  Swords,
  Dices,
  ArrowRightLeft,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Flag,
  Goal,
  AlertCircle,
  Filter,
  Calculator,
  Coins,
  History,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Percent,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Info,
  Scale,
  Zap,
} from 'lucide-react';

interface MatchSimulatorViewProps {
  matches: Match[];
  standings: TeamStats[];
  config?: AnalysisConfig;
}

export const MatchSimulatorView: React.FC<MatchSimulatorViewProps> = ({
  matches,
  standings,
  config,
}) => {
  const teams = standings.map((s) => s.team);
  const [homeTeam, setHomeTeam] = useState<string>(teams[0] || '');
  const [awayTeam, setAwayTeam] = useState<string>(teams[1] || teams[0] || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Input quote offerte dal bookmaker per questo specifico match
  const [customOdds, setCustomOdds] = useState<MatchCustomOdds>({
    homeOdds: undefined,
    drawOdds: undefined,
    awayOdds: undefined,
    over25Odds: undefined,
    under25Odds: undefined,
    bttsYesOdds: undefined,
    bttsNoOdds: undefined,
    sourceName: 'Bookmaker',
  });

  // Modalità di tolleranza per ricerca storico quote
  const [toleranceMode, setToleranceMode] = useState<'tight' | 'standard' | 'wide' | 'bracket'>('standard');
  const [showHistoricalList, setShowHistoricalList] = useState<boolean>(false);
  const [paramsSubTab, setParamsSubTab] = useState<'all' | 'novig' | 'brackets' | 'conditionals' | 'patterns' | 'correlations'>('all');
  const [showCornerLab, setShowCornerLab] = useState<boolean>(true);

  const league = computeLeagueMetrics(matches);
  const profiles = useMemo(
    () => computePredictiveProfiles(matches, standings, config),
    [matches, standings, config]
  );
  const profilesMap = useMemo(() => {
    const map = new Map<string, TeamPredictiveProfile>();
    profiles.forEach((p) => map.set(p.team, p));
    return map;
  }, [profiles]);

  // Seleziona automaticamente squadre se cambiano o non valide
  useEffect(() => {
    if (teams.length >= 2) {
      if (!teams.includes(homeTeam)) setHomeTeam(teams[0]);
      if (!teams.includes(awayTeam) || awayTeam === teams[0]) setAwayTeam(teams[1]);
    }
  }, [teams]);

  const simulation = useMemo(() => {
    if (!homeTeam || !awayTeam || homeTeam === awayTeam) return null;
    return simulateMatch(
      homeTeam,
      awayTeam,
      profilesMap,
      league.avgHomeGoals,
      league.avgAwayGoals,
      config
    );
  }, [homeTeam, awayTeam, profilesMap, league, config]);

  // Storico scontri diretti presenti nel dataset
  const headToHeadMatches = useMemo(() => {
    return matches.filter(
      (m) =>
        (m.homeTeam === homeTeam && m.awayTeam === awayTeam) ||
        (m.homeTeam === awayTeam && m.awayTeam === homeTeam)
    );
  }, [matches, homeTeam, awayTeam]);

  // Ultimo scontro diretto con quote reali registrate (se presente)
  const lastH2HWithOdds = useMemo(() => {
    return headToHeadMatches.find((m) => m.homeOdds && m.drawOdds && m.awayOdds);
  }, [headToHeadMatches]);

  // Selezione casuale tra le squadre (garantisce MAI due squadre uguali)
  const handleRandomMatch = () => {
    if (teams.length < 2) return;
    const randomHomeIdx = Math.floor(Math.random() * teams.length);
    const chosenHome = teams[randomHomeIdx];
    const remainingTeams = teams.filter((t) => t !== chosenHome);
    const randomAwayIdx = Math.floor(Math.random() * remainingTeams.length);
    const chosenAway = remainingTeams[randomAwayIdx];
    setHomeTeam(chosenHome);
    setAwayTeam(chosenAway);
  };

  const swapTeams = () => {
    const temp = homeTeam;
    setHomeTeam(awayTeam);
    setAwayTeam(temp);
  };

  // Autocompila quote offerte calcolando un margine del bookmaker realistico (~5.5%) sulle quote eque
  const handleAutoFillFairOddsWithMargin = () => {
    if (!simulation) return;
    const marginFactor = 0.945; // ~5.5% Overround
    const h = Number(((100 / simulation.homeWinProb) * marginFactor).toFixed(2));
    const d = Number(((100 / simulation.drawProb) * marginFactor).toFixed(2));
    const a = Number(((100 / simulation.awayWinProb) * marginFactor).toFixed(2));
    const o15 = Number(((100 / simulation.over15Prob) * marginFactor).toFixed(2));
    const u15 = Number(((100 / simulation.under15Prob) * marginFactor).toFixed(2));
    const o25 = Number(((100 / simulation.over25Prob) * marginFactor).toFixed(2));
    const u25 = Number(((100 / (100 - simulation.over25Prob)) * marginFactor).toFixed(2));
    const o35 = Number(((100 / simulation.over35Prob) * marginFactor).toFixed(2));
    const u35 = Number(((100 / simulation.under35Prob) * marginFactor).toFixed(2));
    const btts = Number(((100 / simulation.bothTeamsScoreProb) * marginFactor).toFixed(2));
    const bttsNo = Number(((100 / (100 - simulation.bothTeamsScoreProb)) * marginFactor).toFixed(2));
    const dc1X = Number(((100 / simulation.doubleChance1XProb) * marginFactor).toFixed(2));
    const dcX2 = Number(((100 / simulation.doubleChanceX2Prob) * marginFactor).toFixed(2));
    const c85 = Number(((100 / simulation.cornerOver85Prob) * marginFactor).toFixed(2));
    const c95 = Number(((100 / simulation.cornerOver95Prob) * marginFactor).toFixed(2));
    const c105 = Number(((100 / simulation.cornerOver105Prob) * marginFactor).toFixed(2));
    const c115 = Number(((100 / simulation.cornerOver115Prob) * marginFactor).toFixed(2));
    const cHome = Number(((100 / simulation.cornerHomeMostProb) * marginFactor).toFixed(2));
    const cAway = Number(((100 / simulation.cornerAwayMostProb) * marginFactor).toFixed(2));

    setCustomOdds({
      homeOdds: h,
      drawOdds: d,
      awayOdds: a,
      over15Odds: o15,
      under15Odds: u15,
      over25Odds: o25,
      under25Odds: u25,
      over35Odds: o35,
      under35Odds: u35,
      bttsYesOdds: btts,
      bttsNoOdds: bttsNo,
      doubleChance1XOdds: dc1X,
      doubleChanceX2Odds: dcX2,
      cornerOver85Odds: c85,
      cornerOver95Odds: c95,
      cornerOver105Odds: c105,
      cornerOver115Odds: c115,
      cornerHomeOdds: cHome,
      cornerAwayOdds: cAway,
      sourceName: 'Stima Mercato (5.5% Aggio)',
    });
  };

  // Carica le quote reali dall'ultimo scontro diretto presente in archivio
  const handleLoadLastH2HOdds = () => {
    if (!lastH2HWithOdds) return;
    setCustomOdds({
      homeOdds: lastH2HWithOdds.homeOdds,
      drawOdds: lastH2HWithOdds.drawOdds,
      awayOdds: lastH2HWithOdds.awayOdds,
      over25Odds: lastH2HWithOdds.over25Odds,
      under25Odds: lastH2HWithOdds.under25Odds,
      bttsYesOdds: lastH2HWithOdds.bttsYesOdds,
      bttsNoOdds: lastH2HWithOdds.bttsNoOdds,
      sourceName: lastH2HWithOdds.oddsSource || `H2H Diretto (${lastH2HWithOdds.date})`,
    });
  };

  const handleResetCustomOdds = () => {
    setCustomOdds({
      homeOdds: undefined,
      drawOdds: undefined,
      awayOdds: undefined,
      over15Odds: undefined,
      under15Odds: undefined,
      over25Odds: undefined,
      under25Odds: undefined,
      over35Odds: undefined,
      under35Odds: undefined,
      bttsYesOdds: undefined,
      bttsNoOdds: undefined,
      doubleChance1XOdds: undefined,
      doubleChanceX2Odds: undefined,
      cornerOver85Odds: undefined,
      cornerOver95Odds: undefined,
      cornerOver105Odds: undefined,
      cornerOver115Odds: undefined,
      cornerHomeOdds: undefined,
      cornerAwayOdds: undefined,
      sourceName: 'Bookmaker',
    });
  };

  // Switch visualizzazione input estesi quote
  const [showExtendedOddsInputs, setShowExtendedOddsInputs] = useState<boolean>(false);

  // Calcolo dell'aggio e margine del banco per le quote 1X2 inserite
  const userOverround = useMemo(() => {
    const h = customOdds.homeOdds;
    const d = customOdds.drawOdds;
    const a = customOdds.awayOdds;
    if (h && d && a && h > 1 && d > 1 && a > 1) {
      const sum = 1 / h + 1 / d + 1 / a;
      const overround = Number(((sum - 1) * 100).toFixed(1));
      const payout = Number(((1 / sum) * 100).toFixed(1));
      return { overround, payout, valid: true };
    }
    return { overround: 0, payout: 100, valid: false };
  }, [customOdds.homeOdds, customOdds.drawOdds, customOdds.awayOdds]);

  // Rilevazione live di Value Bets (+EV) confrontando TUTTE le quote inserite con il modello
  const userValueBets = useMemo(() => {
    if (!simulation) return [];
    const list: Array<{
      market: string;
      userOdd: number;
      fairOdd: number;
      edgePct: number;
      evPct: number;
      isPositiveEv: boolean;
      tipPhrase: string;
    }> = [];

    const checkBet = (market: string, userOdd: number | undefined, prob: number) => {
      if (!userOdd || userOdd <= 1 || prob <= 0) return;
      const fair = Number((100 / prob).toFixed(2));
      const edge = Number(((userOdd / fair - 1) * 100).toFixed(1));
      const ev = Number((((prob / 100) * userOdd - 1) * 100).toFixed(1));
      list.push({
        market,
        userOdd,
        fairOdd: fair,
        edgePct: edge,
        evPct: ev,
        isPositiveEv: ev > 0,
        tipPhrase: `Punta ${market} @${userOdd.toFixed(2)} (Fair @${fair.toFixed(2)} · ${ev > 0 ? `+${ev}% EV` : `${ev}% EV`})`,
      });
    };

    checkBet(`1 (${homeTeam})`, customOdds.homeOdds, simulation.homeWinProb);
    checkBet('X (Pareggio)', customOdds.drawOdds, simulation.drawProb);
    checkBet(`2 (${awayTeam})`, customOdds.awayOdds, simulation.awayWinProb);
    checkBet('Over 1.5 Gol', customOdds.over15Odds, simulation.over15Prob);
    checkBet('Under 1.5 Gol', customOdds.under15Odds, simulation.under15Prob);
    checkBet('Over 2.5 Gol', customOdds.over25Odds, simulation.over25Prob);
    checkBet('Under 2.5 Gol', customOdds.under25Odds, simulation.under25Prob);
    checkBet('Over 3.5 Gol', customOdds.over35Odds, simulation.over35Prob);
    checkBet('Under 3.5 Gol', customOdds.under35Odds, simulation.under35Prob);
    checkBet('Goal (BTTS Sì)', customOdds.bttsYesOdds, simulation.bothTeamsScoreProb);
    checkBet('No Goal (BTTS No)', customOdds.bttsNoOdds, simulation.bttsNoProb);
    checkBet('Doppia Chance 1X', customOdds.doubleChance1XOdds, simulation.doubleChance1XProb);
    checkBet('Doppia Chance X2', customOdds.doubleChanceX2Odds, simulation.doubleChanceX2Prob);
    checkBet('Corner Over 8.5', customOdds.cornerOver85Odds, simulation.cornerOver85Prob);
    checkBet('Corner Over 9.5', customOdds.cornerOver95Odds, simulation.cornerOver95Prob);
    checkBet('Corner Over 10.5', customOdds.cornerOver105Odds, simulation.cornerOver105Prob);
    checkBet('Corner Over 11.5', customOdds.cornerOver115Odds, simulation.cornerOver115Prob);
    checkBet(`Maggior Corner Casa (${homeTeam})`, customOdds.cornerHomeOdds, simulation.cornerHomeMostProb);
    checkBet(`Maggior Corner Ospite (${awayTeam})`, customOdds.cornerAwayOdds, simulation.cornerAwayMostProb);

    return list;
  }, [customOdds, simulation, homeTeam, awayTeam]);

  // Integrazione parametri registrati in Quote & Mercati:
  // 1. De-biasing No-Vig multi-metodo (Shin, Power, Proporzionale)
  const noVigResults = useMemo(() => {
    const h = customOdds.homeOdds || (simulation ? Number(((100 / simulation.homeWinProb) * 0.945).toFixed(2)) : undefined);
    const d = customOdds.drawOdds || (simulation ? Number(((100 / simulation.drawProb) * 0.945).toFixed(2)) : undefined);
    const a = customOdds.awayOdds || (simulation ? Number(((100 / simulation.awayWinProb) * 0.945).toFixed(2)) : undefined);
    if (h && d && a && h > 1 && d > 1 && a > 1) {
      return calculateNoVigMethods(h, d, a);
    }
    return null;
  }, [customOdds.homeOdds, customOdds.drawOdds, customOdds.awayOdds, simulation]);

  // 2. Analisi Fascia di Quota (Odds Bracket Analysis)
  const bracketData = useMemo(() => {
    const brackets: OddsBracketAnalysis[] = computeOddsBrackets(matches, '1', config?.flatStake ?? 100);
    const effectiveHomeOdd = customOdds.homeOdds || (simulation ? Number(((100 / simulation.homeWinProb) * 0.945).toFixed(2)) : 2.0);
    return brackets.find((b: OddsBracketAnalysis) => effectiveHomeOdd >= b.minOdds && effectiveHomeOdd <= b.maxOdds) || brackets[0];
  }, [matches, customOdds.homeOdds, simulation, config]);

  // 3. Probabilità Condizionate registrate per mercati correlati
  const conditionalProbs = useMemo(() => {
    return computeMarketConditionalProbabilities(matches);
  }, [matches]);

  // 4. Correlazioni empiriche tra statistiche e quote
  const statisticalCorrelations = useMemo(() => {
    return computeStatisticalCorrelations(matches);
  }, [matches]);

  // 5. Statistiche campionarie corner della lega
  const cornerMarketStats = useMemo(() => {
    return computeCornerMarketStats(matches, teams);
  }, [matches, teams]);

  // 6. Pattern Profittevoli registrati nel database applicabili a questo match
  const applicablePatterns = useMemo(() => {
    const patterns = findProfitableMarketPatterns(matches, teams, config);
    return patterns.filter((p: ProfitableMarketPattern) => {
      if (p.teamScope && p.teamScope !== homeTeam && p.teamScope !== awayTeam) return false;
      return true;
    }).slice(0, 4);
  }, [matches, teams, config, homeTeam, awayTeam]);

  // Calcolo della verifica storico risultati nel dataset in base alle quote inserite
  const historicalOddsStats = useMemo(() => {
    const effectiveOdds: MatchCustomOdds = {
      homeOdds:
        customOdds.homeOdds ||
        (simulation ? Number(((100 / simulation.homeWinProb) * 0.95).toFixed(2)) : 2.0),
      drawOdds:
        customOdds.drawOdds ||
        (simulation ? Number(((100 / simulation.drawProb) * 0.95).toFixed(2)) : 3.4),
      awayOdds:
        customOdds.awayOdds ||
        (simulation ? Number(((100 / simulation.awayWinProb) * 0.95).toFixed(2)) : 3.6),
      over25Odds:
        customOdds.over25Odds ||
        (simulation ? Number(((100 / simulation.over25Prob) * 0.95).toFixed(2)) : 1.9),
      under25Odds:
        customOdds.under25Odds ||
        (simulation ? Number(((100 / (100 - simulation.over25Prob)) * 0.95).toFixed(2)) : 1.9),
      bttsYesOdds:
        customOdds.bttsYesOdds ||
        (simulation ? Number(((100 / simulation.bothTeamsScoreProb) * 0.95).toFixed(2)) : 1.85),
    };
    return analyzeHistoricalMatchesWithOdds(
      matches,
      effectiveOdds,
      toleranceMode,
      config?.flatStake ?? 100
    );
  }, [matches, customOdds, simulation, toleranceMode, config]);

  const filteredAdviceList = useMemo(() => {
    if (!simulation) return [];
    if (categoryFilter === 'all') return simulation.bettingAdviceList;
    return simulation.bettingAdviceList.filter((t) => t.category === categoryFilter);
  }, [simulation, categoryFilter]);

  if (teams.length < 2) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <Swords className="w-8 h-8 text-slate-500 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">
          Numero insufficiente di squadre per la simulazione
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          I filtri attivi hanno ristretto il campione a meno di due squadre. Azzera o allarga i filtri per simulare un match testa a testa tra due squadre.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card with Team Selectors & Random Picker */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Simulatore Match, Quote Bookmaker & Analisi Storica Esiti
              </h2>
              <p className="text-xs text-slate-400">
                Calcola la distribuzione di Poisson, inserisci le quote del bookmaker e verifica lo storico dei risultati con quote analoghe.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-md border border-slate-800 self-start sm:self-auto shrink-0">
            {teams.length} squadre · {matches.length} gare in archivio
          </div>
        </div>

        {/* Team Selectors Bar & Random Match Button */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end mt-5 pt-4 border-t border-slate-800/80">
          {/* Home Team Selector */}
          <div className="md:col-span-5">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              SQUADRA DI CASA (FATTORE CAMPO)
            </label>
            <select
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
            >
              {teams.map((t) => (
                <option key={t} value={t} disabled={t === awayTeam}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Random Selection Action (Never 2 equal teams) */}
          <div className="md:col-span-1 flex flex-col items-center justify-center gap-1">
            <button
              type="button"
              onClick={handleRandomMatch}
              className="h-10 w-full px-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 group shadow-sm"
              title="Estrai casualmente due squadre distinte (mai uguali)"
            >
              <Dices className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                Casuale
              </span>
            </button>
            <button
              type="button"
              onClick={swapTeams}
              className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 font-mono transition-colors"
              title="Inverti Casa/Trasferta"
            >
              <ArrowRightLeft className="w-2.5 h-2.5" />
              <span>Inverti</span>
            </button>
          </div>

          {/* Away Team Selector */}
          <div className="md:col-span-5">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              SQUADRA IN TRASFERTA
            </label>
            <select
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
            >
              {teams.map((t) => (
                <option key={t} value={t} disabled={t === homeTeam}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* User Custom Odds Input Panel */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Quote Offerte dal Bookmaker per {homeTeam} vs {awayTeam}
              </h3>
              <p className="text-xs text-slate-400">
                Digita le quote reali per calcolare aggio del banco, rilevare Value Bets (+EV) e verificare lo storico delle frequenze.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoFillFairOddsWithMargin}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-md text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Calcola e inserisce automaticamente le quote con aggio medio del 5.5%"
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autocompila con Aggio Book (~5.5%)</span>
            </button>

            {lastH2HWithOdds && (
              <button
                type="button"
                onClick={handleLoadLastH2HOdds}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-md text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                title="Carica le quote dell'ultimo scontro diretto reale"
              >
                <History className="w-3.5 h-3.5 text-emerald-400" />
                <span>Carica da Ultimo H2H</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetCustomOdds}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
              title="Azzera campi quote"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Odds Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {/* Quota 1 */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300 truncate">1 ({homeTeam})</span>
              <span className="text-[10px] text-slate-500 shrink-0">Fair @{(100 / (simulation?.homeWinProb || 40)).toFixed(2)}</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-slate-500 font-mono text-xs font-semibold">@</span>
              <input
                type="number"
                step="0.01"
                min="1.01"
                placeholder="1.85"
                value={customOdds.homeOdds ?? ''}
                onChange={(e) =>
                  setCustomOdds({
                    ...customOdds,
                    homeOdds: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full h-8 bg-slate-900 border border-slate-700 rounded pl-7 pr-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Quota X */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">X (Pareggio)</span>
              <span className="text-[10px] text-slate-500 shrink-0">Fair @{(100 / (simulation?.drawProb || 28)).toFixed(2)}</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-slate-500 font-mono text-xs font-semibold">@</span>
              <input
                type="number"
                step="0.01"
                min="1.01"
                placeholder="3.40"
                value={customOdds.drawOdds ?? ''}
                onChange={(e) =>
                  setCustomOdds({
                    ...customOdds,
                    drawOdds: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full h-8 bg-slate-900 border border-slate-700 rounded pl-7 pr-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Quota 2 */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300 truncate">2 ({awayTeam})</span>
              <span className="text-[10px] text-slate-500 shrink-0">Fair @{(100 / (simulation?.awayWinProb || 32)).toFixed(2)}</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-slate-500 font-mono text-xs font-semibold">@</span>
              <input
                type="number"
                step="0.01"
                min="1.01"
                placeholder="4.20"
                value={customOdds.awayOdds ?? ''}
                onChange={(e) =>
                  setCustomOdds({
                    ...customOdds,
                    awayOdds: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full h-8 bg-slate-900 border border-slate-700 rounded pl-7 pr-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Quota Over 2.5 */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">Over 2.5 Gol</span>
              <span className="text-[10px] text-slate-500 shrink-0">Fair @{(100 / (simulation?.over25Prob || 50)).toFixed(2)}</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-slate-500 font-mono text-xs font-semibold">@</span>
              <input
                type="number"
                step="0.01"
                min="1.01"
                placeholder="1.90"
                value={customOdds.over25Odds ?? ''}
                onChange={(e) =>
                  setCustomOdds({
                    ...customOdds,
                    over25Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full h-8 bg-slate-900 border border-slate-700 rounded pl-7 pr-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Quota Under 2.5 */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">Under 2.5 Gol</span>
              <span className="text-[10px] text-slate-500 shrink-0">Fair @{(100 / ((100 - (simulation?.over25Prob || 50)) || 50)).toFixed(2)}</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-slate-500 font-mono text-xs font-semibold">@</span>
              <input
                type="number"
                step="0.01"
                min="1.01"
                placeholder="1.90"
                value={customOdds.under25Odds ?? ''}
                onChange={(e) =>
                  setCustomOdds({
                    ...customOdds,
                    under25Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full h-8 bg-slate-900 border border-slate-700 rounded pl-7 pr-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Quota Goal (BTTS) */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">Goal (BTTS Sì)</span>
              <span className="text-[10px] text-slate-500 shrink-0">Fair @{(100 / (simulation?.bothTeamsScoreProb || 52)).toFixed(2)}</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-slate-500 font-mono text-xs font-semibold">@</span>
              <input
                type="number"
                step="0.01"
                min="1.01"
                placeholder="1.80"
                value={customOdds.bttsYesOdds ?? ''}
                onChange={(e) =>
                  setCustomOdds({
                    ...customOdds,
                    bttsYesOdds: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full h-8 bg-slate-900 border border-slate-700 rounded pl-7 pr-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Toggle per Mercati Quote Estesi (Corner, U/O 1.5-3.5, Doppia Chance) */}
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExtendedOddsInputs(!showExtendedOddsInputs)}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            {showExtendedOddsInputs ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Nascondi mercati secondari (U/O 1.5-3.5, Corner, Doppia Chance)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Espandi quote secondarie (Over/Under 1.5-3.5, Calci d'Angolo, Doppia Chance)</span>
              </>
            )}
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            {showExtendedOddsInputs ? 'Compila le quote per verificare il Valore Atteso (+EV)' : 'Quote opzionali'}
          </span>
        </div>

        {/* Extended Odds Input Grid */}
        {showExtendedOddsInputs && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Over 1.5 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-cyan-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Over 1.5</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.over15Prob || 75)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.28"
                  value={customOdds.over15Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      over15Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            {/* Under 1.5 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-cyan-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Under 1.5</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.under15Prob || 25)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="3.50"
                  value={customOdds.under15Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      under15Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            {/* Over 3.5 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-cyan-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Over 3.5</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.over35Prob || 30)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="3.10"
                  value={customOdds.over35Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      over35Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            {/* Under 3.5 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-cyan-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Under 3.5</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.under35Prob || 70)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.35"
                  value={customOdds.under35Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      under35Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            {/* Doppia Chance 1X */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-cyan-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>1X (Casa/Pari)</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.doubleChance1XProb || 65)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.22"
                  value={customOdds.doubleChance1XOdds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      doubleChance1XOdds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            {/* Doppia Chance X2 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-cyan-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>X2 (Pari/Ospite)</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.doubleChanceX2Prob || 60)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.65"
                  value={customOdds.doubleChanceX2Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      doubleChanceX2Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            {/* Corner Over 8.5 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-amber-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Corner Over 8.5</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.cornerOver85Prob || 65)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.45"
                  value={customOdds.cornerOver85Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      cornerOver85Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>
            </div>

            {/* Corner Over 9.5 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-amber-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Corner Over 9.5</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.cornerOver95Prob || 52)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.75"
                  value={customOdds.cornerOver95Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      cornerOver95Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>
            </div>

            {/* Corner Over 10.5 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-amber-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Corner Over 10.5</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.cornerOver105Prob || 38)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="2.15"
                  value={customOdds.cornerOver105Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      cornerOver105Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>
            </div>

            {/* Corner Over 11.5 */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-amber-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Corner Over 11.5</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.cornerOver115Prob || 25)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="2.90"
                  value={customOdds.cornerOver115Odds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      cornerOver115Odds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>
            </div>

            {/* Corner 1 (Casa più corner) */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-amber-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 truncate">
                <span>Corner 1 ({homeTeam})</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.cornerHomeMostProb || 50)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.60"
                  value={customOdds.cornerHomeOdds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      cornerHomeOdds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>
            </div>

            {/* Corner 2 (Ospite più corner) */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 focus-within:border-amber-500 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 truncate">
                <span>Corner 2 ({awayTeam})</span>
                <span className="text-slate-500">Fair @{(100 / (simulation?.cornerAwayMostProb || 35)).toFixed(2)}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="2.50"
                  value={customOdds.cornerAwayOdds ?? ''}
                  onChange={(e) =>
                    setCustomOdds({
                      ...customOdds,
                      cornerAwayOdds: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-7 bg-slate-900 border border-slate-700 rounded pl-6 pr-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Analysis Banner for User Entered Odds */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            {userOverround.valid ? (
              <span className="text-slate-300">
                Margine Banco (Aggio 1X2):{' '}
                <strong className={userOverround.overround > 7 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {userOverround.overround}%
                </strong>{' '}
                (Payout Teorico: {userOverround.payout}%)
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Inserisci quote 1-X-2 per calcolare aggio e margine banco</span>
              </span>
            )}
          </div>

          {/* Real-time Value Bet Alert Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {userValueBets
              .filter((v) => v.isPositiveEv)
              .map((v, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/80 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Value Bet: {v.market} @{v.userOdd.toFixed(2)} (+{v.evPct}% EV)</span>
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Historical Verification of Outcomes with These Specific Odds */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Verifica Storico Risultati nel Dataset con Quote Simili
              </h3>
              <p className="text-xs text-slate-400">
                Analisi empirica di tutte le partite storiche giocate con quote analoghe: confronto tra frequenza reale di uscita, probabilità implicita e rendimento (ROI).
              </p>
            </div>
          </div>

          {/* Tolerance selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-slate-500" /> Tolleranza:
            </span>
            <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setToleranceMode('tight')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  toleranceMode === 'tight'
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tolleranza stretta: scarto max ±0.10"
              >
                Stretta (±0.10)
              </button>
              <button
                type="button"
                onClick={() => setToleranceMode('standard')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  toleranceMode === 'standard'
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tolleranza standard: scarto max ±0.20"
              >
                Standard (±0.20)
              </button>
              <button
                type="button"
                onClick={() => setToleranceMode('wide')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  toleranceMode === 'wide'
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tolleranza ampia: scarto max ±0.35"
              >
                Ampia (±0.35)
              </button>
              <button
                type="button"
                onClick={() => setToleranceMode('bracket')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  toleranceMode === 'bracket'
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Fascia di mercato per favorita"
              >
                Fascia Mercato
              </button>
            </div>
          </div>
        </div>

        {/* Sample Statistics Summary */}
        <div className="mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 text-xs font-mono">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Campione storico individuato: <strong>{historicalOddsStats.totalMatches} partite</strong>{' '}
                ({historicalOddsStats.toleranceLabel})
              </span>
            </span>

            <span className="text-slate-400">
              Media Reti Campione: <strong className="text-white">{historicalOddsStats.avgTotalGoals} gol/gara</strong> (Casa {historicalOddsStats.avgHomeGoals} · Ospite {historicalOddsStats.avgAwayGoals})
            </span>
          </div>

          {/* Outcome Frequency & ROI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            {/* Esito 1 */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Esito 1 (Casa)</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {historicalOddsStats.homeWinPct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {historicalOddsStats.homeWinCount} su {historicalOddsStats.totalMatches}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500 block text-[9px] font-sans">ROI Puntata 1</span>
                <span
                  className={`font-bold tabular-nums ${
                    historicalOddsStats.roiHomePct > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {historicalOddsStats.roiHomePct > 0 ? `+${historicalOddsStats.roiHomePct}%` : `${historicalOddsStats.roiHomePct}%`}
                </span>
              </div>
            </div>

            {/* Esito X */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Esito X (Pareggio)</div>
                <div className="text-xl font-bold text-slate-200 tabular-nums">
                  {historicalOddsStats.drawPct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {historicalOddsStats.drawCount} su {historicalOddsStats.totalMatches}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500 block text-[9px] font-sans">ROI Puntata X</span>
                <span
                  className={`font-bold tabular-nums ${
                    historicalOddsStats.roiDrawPct > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {historicalOddsStats.roiDrawPct > 0 ? `+${historicalOddsStats.roiDrawPct}%` : `${historicalOddsStats.roiDrawPct}%`}
                </span>
              </div>
            </div>

            {/* Esito 2 */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Esito 2 (Ospite)</div>
                <div className="text-xl font-bold text-cyan-400 tabular-nums">
                  {historicalOddsStats.awayWinPct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {historicalOddsStats.awayWinCount} su {historicalOddsStats.totalMatches}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500 block text-[9px] font-sans">ROI Puntata 2</span>
                <span
                  className={`font-bold tabular-nums ${
                    historicalOddsStats.roiAwayPct > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {historicalOddsStats.roiAwayPct > 0 ? `+${historicalOddsStats.roiAwayPct}%` : `${historicalOddsStats.roiAwayPct}%`}
                </span>
              </div>
            </div>

            {/* Over 2.5 */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Over 2.5 Gol</div>
                <div className="text-xl font-bold text-amber-400 tabular-nums">
                  {historicalOddsStats.over25Pct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {historicalOddsStats.over25Count} su {historicalOddsStats.totalMatches}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500 block text-[9px] font-sans">ROI Over 2.5</span>
                <span
                  className={`font-bold tabular-nums ${
                    (historicalOddsStats.roiOver25Pct ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {(historicalOddsStats.roiOver25Pct ?? 0) > 0
                    ? `+${historicalOddsStats.roiOver25Pct}%`
                    : `${historicalOddsStats.roiOver25Pct ?? 0}%`}
                </span>
              </div>
            </div>

            {/* Under 2.5 */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Under 2.5 Gol</div>
                <div className="text-xl font-bold text-slate-300 tabular-nums">
                  {historicalOddsStats.under25Pct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {historicalOddsStats.under25Count} su {historicalOddsStats.totalMatches}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500 block text-[9px] font-sans">ROI Under 2.5</span>
                <span
                  className={`font-bold tabular-nums ${
                    (historicalOddsStats.roiUnder25Pct ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {(historicalOddsStats.roiUnder25Pct ?? 0) > 0
                    ? `+${historicalOddsStats.roiUnder25Pct}%`
                    : `${historicalOddsStats.roiUnder25Pct ?? 0}%`}
                </span>
              </div>
            </div>

            {/* Goal (BTTS Sì) */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Goal (BTTS Sì)</div>
                <div className="text-xl font-bold text-purple-400 tabular-nums">
                  {historicalOddsStats.bttsYesPct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {historicalOddsStats.bttsYesCount} su {historicalOddsStats.totalMatches}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500 block text-[9px] font-sans">ROI Goal</span>
                <span
                  className={`font-bold tabular-nums ${
                    (historicalOddsStats.roiBttsYesPct ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {(historicalOddsStats.roiBttsYesPct ?? 0) > 0
                    ? `+${historicalOddsStats.roiBttsYesPct}%`
                    : `${historicalOddsStats.roiBttsYesPct ?? 0}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Verdict & Profit Banner */}
          <div className="mt-4 p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs border border-emerald-500/30 shrink-0">
                ★ TOP ROI
              </span>
              <div>
                <span className="text-slate-200 font-semibold font-sans">
                  Miglior Esito Storico con questo Profilo di Quota:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {historicalOddsStats.bestOutcome.market}
                  </strong>
                </span>
                <span className="text-slate-400 text-[11px] block mt-0.5 font-mono">
                  Frequenza reale {historicalOddsStats.bestOutcome.hitRatePct}% · Rendimento Netto:{' '}
                  <strong
                    className={
                      historicalOddsStats.bestOutcome.roiPct > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {historicalOddsStats.bestOutcome.roiPct > 0
                      ? `+${historicalOddsStats.bestOutcome.roiPct}%`
                      : `${historicalOddsStats.bestOutcome.roiPct}%`}
                  </strong>{' '}
                  (Puntata fissa €{config?.flatStake ?? 100}: €{historicalOddsStats.bestOutcome.profitFlat > 0 ? `+${historicalOddsStats.bestOutcome.profitFlat}` : historicalOddsStats.bestOutcome.profitFlat})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHistoricalList(!showHistoricalList)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-sm"
            >
              <span>{showHistoricalList ? 'Nascondi Partite' : 'Vedi Elenco Partite'} ({historicalOddsStats.matchedMatches.length})</span>
              {showHistoricalList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expandable Table of Historical Matches with These Odds */}
          {showHistoricalList && (
            <div className="mt-4 overflow-x-auto border border-slate-800 rounded-lg max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs whitespace-nowrap font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-2 text-center">G</th>
                    <th className="py-2 px-3 text-right">Casa</th>
                    <th className="py-2 px-3 text-center">Risultato</th>
                    <th className="py-2 px-3 text-left">Trasferta</th>
                    <th className="py-2 px-2 text-center">Quote 1-X-2</th>
                    <th className="py-2 px-2 text-center">Over/Under</th>
                    <th className="py-2 px-2 text-center">Feed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {historicalOddsStats.matchedMatches.map((m) => {
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-3 text-slate-400 text-[11px]">{m.date}</td>
                        <td className="py-1.5 px-2 text-center text-slate-500">{m.matchday || '-'}</td>
                        <td
                          className={`py-1.5 px-3 text-right font-sans font-medium ${
                            m.homeGoals > m.awayGoals ? 'text-emerald-400 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {m.homeTeam}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded font-mono font-bold bg-slate-900 border border-slate-800 text-slate-200">
                            {m.homeGoals} - {m.awayGoals}
                          </span>
                        </td>
                        <td
                          className={`py-1.5 px-3 text-left font-sans font-medium ${
                            m.awayGoals > m.homeGoals ? 'text-emerald-400 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {m.awayTeam}
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-300 text-[11px]">
                          {m.homeOdds ? (
                            <span className="flex items-center justify-center gap-1">
                              <span className={m.homeGoals > m.awayGoals ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                {m.homeOdds.toFixed(2)}
                              </span>
                              <span className="text-slate-600">/</span>
                              <span className={m.homeGoals === m.awayGoals ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                {m.drawOdds?.toFixed(2) || '-'}
                              </span>
                              <span className="text-slate-600">/</span>
                              <span className={m.awayGoals > m.homeGoals ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                {m.awayOdds?.toFixed(2) || '-'}
                              </span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center text-[11px]">
                          {m.homeGoals + m.awayGoals > 2.5 ? (
                            <span className="text-amber-400 font-semibold">Over 2.5</span>
                          ) : (
                            <span className="text-slate-400">Under 2.5</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-500 text-[10px]">
                          {m.oddsSource ? m.oddsSource.split('(')[0].trim() : 'Fair'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {simulation && (
        <div className="space-y-6">
          {/* Sezione Parametri Registrati in Quote & Mercati per il Match */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Parametri Registrati in Quote & Mercati per il Match</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono">
                      Analisi Integrata
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modelli di de-biasing No-Vig, rendimento storico nella fascia di quota, probabilità condizionate e correlazioni empiriche applicate al match.
                  </p>
                </div>
              </div>

              {/* Sub-tabs selector */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setParamsSubTab('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    paramsSubTab === 'all'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tutti
                </button>
                <button
                  type="button"
                  onClick={() => setParamsSubTab('novig')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    paramsSubTab === 'novig'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  No-Vig De-Biasing
                </button>
                <button
                  type="button"
                  onClick={() => setParamsSubTab('brackets')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    paramsSubTab === 'brackets'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fascia Quota
                </button>
                <button
                  type="button"
                  onClick={() => setParamsSubTab('conditionals')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    paramsSubTab === 'conditionals'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Prob. Condizionate
                </button>
                <button
                  type="button"
                  onClick={() => setParamsSubTab('patterns')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    paramsSubTab === 'patterns'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pattern ({applicablePatterns.length})
                </button>
                <button
                  type="button"
                  onClick={() => setParamsSubTab('correlations')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    paramsSubTab === 'correlations'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Correlazioni
                </button>
              </div>
            </div>

            {/* Content for No-Vig De-biasing */}
            {(paramsSubTab === 'all' || paramsSubTab === 'novig') && noVigResults && (
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/90 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5 font-sans">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>Confronto Metodi No-Vig (Rimozione Aggio del Bookmaker)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Aggio Raw: <strong className="text-amber-400">{noVigResults.rawOverroundPct}%</strong> · Quote Base: @{noVigResults.homeOdds.toFixed(2)} / @{noVigResults.drawOdds.toFixed(2)} / @{noVigResults.awayOdds.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  {/* Proporzionale */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-sans mb-1">Metodo Proporzionale</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>1: {noVigResults.proportional.homeProb}%</span>
                        <span className="text-emerald-400 font-bold">@{noVigResults.proportional.fairHome}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>X: {noVigResults.proportional.drawProb}%</span>
                        <span className="text-slate-400 font-bold">@{noVigResults.proportional.fairDraw}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>2: {noVigResults.proportional.awayProb}%</span>
                        <span className="text-cyan-400 font-bold">@{noVigResults.proportional.fairAway}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shin */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-sans mb-1 flex justify-between">
                      <span>Modello di Shin</span>
                      <span className="text-emerald-400">z={noVigResults.shin.zParameter}%</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>1: {noVigResults.shin.homeProb}%</span>
                        <span className="text-emerald-400 font-bold">@{noVigResults.shin.fairHome}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>X: {noVigResults.shin.drawProb}%</span>
                        <span className="text-slate-400 font-bold">@{noVigResults.shin.fairDraw}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>2: {noVigResults.shin.awayProb}%</span>
                        <span className="text-cyan-400 font-bold">@{noVigResults.shin.fairAway}</span>
                      </div>
                    </div>
                  </div>

                  {/* Power */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-sans mb-1 flex justify-between">
                      <span>Metodo Power</span>
                      <span className="text-cyan-400">k={noVigResults.power.kExponent}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>1: {noVigResults.power.homeProb}%</span>
                        <span className="text-emerald-400 font-bold">@{noVigResults.power.fairHome}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>X: {noVigResults.power.drawProb}%</span>
                        <span className="text-slate-400 font-bold">@{noVigResults.power.fairDraw}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>2: {noVigResults.power.awayProb}%</span>
                        <span className="text-cyan-400 font-bold">@{noVigResults.power.fairAway}</span>
                      </div>
                    </div>
                  </div>

                  {/* Modello Simulatore Poisson */}
                  <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-800/40">
                    <div className="text-[10px] text-emerald-400 uppercase font-sans mb-1 font-bold">
                      Nostro Modello (Dixon-Coles)
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-200">
                        <span>1: {simulation.homeWinProb}%</span>
                        <span className="text-emerald-400 font-bold">@{(100 / simulation.homeWinProb).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-200">
                        <span>X: {simulation.drawProb}%</span>
                        <span className="text-slate-300 font-bold">@{(100 / simulation.drawProb).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-200">
                        <span>2: {simulation.awayWinProb}%</span>
                        <span className="text-cyan-400 font-bold">@{(100 / simulation.awayWinProb).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content for Odds Brackets */}
            {(paramsSubTab === 'all' || paramsSubTab === 'brackets') && bracketData && (
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/90 font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="font-semibold text-white flex items-center gap-2 font-sans">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Fascia di Quota: <strong>{bracketData.bracketLabel}</strong> (@{bracketData.minOdds.toFixed(2)} - @{bracketData.maxOdds.toFixed(2)})</span>
                  </div>
                  <span className="text-slate-400">
                    Campione in Archivio: <strong className="text-slate-200">{bracketData.totalBets} gare</strong> (Quota media: @{bracketData.avgOdds.toFixed(2)})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Frequenza Reale</span>
                    <span className="text-base font-bold text-emerald-400">{bracketData.actualHitRatePct}%</span>
                    <span className="text-[10px] text-slate-500 block">{bracketData.wonBets} su {bracketData.totalBets}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Probabilità Implicita</span>
                    <span className="text-base font-bold text-slate-200">{bracketData.impliedProbPct}%</span>
                    <span className="text-[10px] text-slate-500 block">Dalla quota media</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Edge di Mercato</span>
                    <span className={`text-base font-bold ${bracketData.probDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {bracketData.probDeltaPct >= 0 ? `+${bracketData.probDeltaPct}%` : `${bracketData.probDeltaPct}%`}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Frequenza vs Banco</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-emerald-800/40">
                    <span className="text-[10px] text-emerald-400 block font-sans font-semibold">Resa Economica (ROI)</span>
                    <span className={`text-base font-bold ${bracketData.roiPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {bracketData.roiPct >= 0 ? `+${bracketData.roiPct}%` : `${bracketData.roiPct}%`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      €{bracketData.totalProfitFlat >= 0 ? `+${bracketData.totalProfitFlat}` : bracketData.totalProfitFlat}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Content for Market Conditional Probabilities */}
            {(paramsSubTab === 'all' || paramsSubTab === 'conditionals') && conditionalProbs.length > 0 && (
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/90 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 font-sans">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Probabilità Condizionate & Correlazioni tra Mercati</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Frequenza empirica vs baseline modello
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {conditionalProbs.slice(0, 4).map((cp) => (
                    <div key={cp.id} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-emerald-400 font-bold">{cp.formulaSymbol}</span>
                        <span className="text-slate-300 font-bold text-xs">{cp.empiricalPct}% empirica</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mb-1.5 leading-snug">
                        {cp.condition} → <strong>{cp.targetEvent}</strong>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80 text-[10px] text-cyan-300 font-sans">
                        ⚡ {cp.marketSignal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content for Profitable Market Patterns */}
            {(paramsSubTab === 'all' || paramsSubTab === 'patterns') && applicablePatterns.length > 0 && (
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/90 font-mono text-xs">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 font-sans mb-2.5">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Pattern Profittevoli Registrati Applicabili al Match</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                    Strategie con ROI positivo in archivio
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {applicablePatterns.map((pat: ProfitableMarketPattern) => (
                    <div key={pat.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-bold font-sans text-xs">{pat.marketType}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
                            +{pat.roiPct}% ROI
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans mb-2 leading-relaxed">
                          {pat.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800 text-slate-400">
                        <span>Win Rate: <strong className="text-slate-200">{pat.winRatePct}%</strong> ({pat.wonBets}/{pat.totalBets})</span>
                        <span>Quota media: <strong className="text-cyan-400">@{pat.avgOdds.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content for Statistical Correlations */}
            {(paramsSubTab === 'all' || paramsSubTab === 'correlations') && statisticalCorrelations.length > 0 && (
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/90 font-mono text-xs">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 font-sans mb-2.5">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Abbinamenti e Correlazioni Statistiche Chiave</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pearson (r) & Spearman (ρ)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {statisticalCorrelations.slice(0, 3).map((sc) => (
                    <div key={sc.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-emerald-400 font-bold text-[11px]">{sc.targetMarket}</span>
                          <span className="text-slate-300 font-bold">r = {sc.pearsonR}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-sans font-medium mb-1">
                          {sc.featureA} ↔ {sc.featureB}
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-tight mb-2">
                          {sc.interpretation}
                        </p>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-emerald-300 font-sans">
                        💡 {sc.bettingImplication}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Main Simulation Probability Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Col 1 & 2: Main Odds and Probability Breakdown */}
            <div className="lg:col-span-2 space-y-4">
              {/* Expected Goals & Primary Outcomes Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">
                  Aspettativa Reti (Expected Goals Model)
                </div>

                {/* Big Scoreline Expected Bar */}
                <div className="flex items-center justify-between py-4 px-6 bg-slate-950 rounded-xl border border-slate-800 mb-6">
                  <div className="text-left">
                    <div className="text-lg font-bold text-slate-100">{homeTeam}</div>
                    <div className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
                      {simulation.expectedHomeGoals} <span className="text-xs font-sans text-slate-400 font-normal">xG attesi</span>
                    </div>
                  </div>

                  <div className="text-center font-mono text-slate-500 text-sm font-semibold px-4">
                    VS
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-100">{awayTeam}</div>
                    <div className="text-2xl font-extrabold font-mono text-cyan-400 tabular-nums">
                      {simulation.expectedAwayGoals} <span className="text-xs font-sans text-slate-400 font-normal">xG attesi</span>
                    </div>
                  </div>
                </div>

                {/* 1X2 Probabilities Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                    <span>Esito 1X2 Normalizzato</span>
                    <span>1: {simulation.homeWinProb}% · X: {simulation.drawProb}% · 2: {simulation.awayWinProb}%</span>
                  </div>
                  <div className="h-4 rounded-md overflow-hidden flex bg-slate-950 border border-slate-800">
                    <div
                      style={{ width: `${simulation.homeWinProb}%` }}
                      className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-950"
                      title={`Vittoria ${homeTeam}: ${simulation.homeWinProb}%`}
                    >
                      {simulation.homeWinProb > 15 ? '1' : ''}
                    </div>
                    <div
                      style={{ width: `${simulation.drawProb}%` }}
                      className="bg-slate-400 flex items-center justify-center text-[10px] font-bold text-slate-950"
                      title={`Pareggio: ${simulation.drawProb}%`}
                    >
                      {simulation.drawProb > 15 ? 'X' : ''}
                    </div>
                    <div
                      style={{ width: `${simulation.awayWinProb}%` }}
                      className="bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-slate-950"
                      title={`Vittoria ${awayTeam}: ${simulation.awayWinProb}%`}
                    >
                      {simulation.awayWinProb > 15 ? '2' : ''}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center mt-3 font-mono text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px] font-sans">1 ({homeTeam})</span>
                      <span className="text-emerald-400 font-bold text-sm">{simulation.homeWinProb}%</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Fair @{(100 / (simulation.homeWinProb || 1)).toFixed(2)}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px] font-sans">X (Pareggio)</span>
                      <span className="text-slate-200 font-bold text-sm">{simulation.drawProb}%</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Fair @{(100 / (simulation.drawProb || 1)).toFixed(2)}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px] font-sans">2 ({awayTeam})</span>
                      <span className="text-cyan-400 font-bold text-sm">{simulation.awayWinProb}%</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Fair @{(100 / (simulation.awayWinProb || 1)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Goal & Corner Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 font-mono text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-sans">Over 1.5 Gol</div>
                    <div className="text-base font-bold text-white mt-0.5">{simulation.over15Prob}%</div>
                    <div className="text-[10px] text-slate-500">Under: {simulation.under15Prob}%</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-sans">Over 2.5 Gol</div>
                    <div className="text-base font-bold text-amber-400 mt-0.5">{simulation.over25Prob}%</div>
                    <div className="text-[10px] text-slate-500">Under: {simulation.under25Prob}%</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-sans">Goal / No Goal</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">{simulation.bothTeamsScoreProb}%</div>
                    <div className="text-[10px] text-slate-500">No Goal: {simulation.bttsNoProb}%</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-sans">Calci d'Angolo</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">{simulation.expectedTotalCorners} avg</div>
                    <div className="text-[10px] text-slate-500">Over 8.5: {simulation.cornerOver85Prob}%</div>
                  </div>
                </div>
              </div>

              {/* Historical Head-to-Head in Dataset */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center justify-between">
                  <span>Precedenti Diretti nel Dataset ({headToHeadMatches.length})</span>
                  <span className="text-[11px] font-mono text-slate-500">Dati storici reali</span>
                </h3>

                {headToHeadMatches.length === 0 ? (
                  <div className="text-xs text-slate-500 py-3 text-center">
                    Nessun precedente diretto registrato tra queste due squadre nel file CSV corrente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {headToHeadMatches.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono"
                      >
                        <span className="text-slate-400 text-[11px]">{m.date}</span>
                        <div className="flex items-center gap-3 font-sans font-medium">
                          <span className={m.homeTeam === homeTeam ? 'text-white font-bold' : 'text-slate-300'}>
                            {m.homeTeam}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-900 rounded font-mono font-bold text-emerald-400 border border-slate-800">
                            {m.homeGoals} - {m.awayGoals}
                          </span>
                          <span className={m.awayTeam === awayTeam ? 'text-white font-bold' : 'text-slate-300'}>
                            {m.awayTeam}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px]">
                          xG {m.homeXg ?? '-'} : {m.awayXg ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Col 3: Top Most Likely Scores & Tactical Diagnosis */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                    Risultati Esatti Più Probabili
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                    Dixon-Coles (τ)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Distribuzione multivariata con correzione Dixon-Coles (1997) per punteggi bassi (0-0, 1-0, 0-1, 1-1).
                </p>

                <div className="space-y-2.5 font-mono">
                  {simulation.mostLikelyScores.map((s, idx) => {
                    const maxProb = simulation.mostLikelyScores[0]?.probability || 1;
                    const barWidth = Math.min(100, (s.probability / maxProb) * 100);
                    const fairOdd = (100 / (s.probability || 1)).toFixed(2);
                    const refOdd = (Number(fairOdd) * 1.15).toFixed(2);

                    return (
                      <div key={s.score} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[10px]">#{idx + 1}</span>
                            <span className="text-sm font-bold text-white">{s.score}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-400 tabular-nums mr-2">
                              {s.probability}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              (Consigliata: <strong className="text-cyan-300">@{refOdd}</strong>)
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/80 rounded-full"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tactical Advice summary */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
                <span className="text-slate-200 font-semibold block mb-1">Diagnosi Modello</span>
                <p className="leading-relaxed text-[11px]">
                  {simulation.expectedHomeGoals > simulation.expectedAwayGoals + 0.6
                    ? `${homeTeam} gode di un chiaro vantaggio statistico legato a una produzione offensiva superiore e all'impatto casalingo.`
                    : simulation.expectedAwayGoals > simulation.expectedHomeGoals + 0.3
                    ? `${awayTeam} presenta parametri di efficienza esterna tali da compensare il fattore campo di ${homeTeam}.`
                    : `Sfida contrassegnata da elevato equilibrio tattico con alta incidenza statistica di pareggio o scarto minimo.`}
                </p>
              </div>
            </div>
          </div>

          {/* Laboratorio Calci d'Angolo ad Ampio Range (6.5 - 14.5) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Laboratorio Calci d'Angolo ad Ampio Range (6.5 - 14.5) & Quote Eque</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[10px] font-mono">
                      Poisson Multivariato
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modellazione avanzata dei corner: range completo Over/Under da 6.5 a 14.5, confronto 1X2 corner, linee individuali e quote minime di valore (+EV).
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-md border border-slate-800 self-start md:self-auto">
                Media Match Attesa: <strong className="text-amber-400">{simulation.expectedTotalCorners}</strong> corner
              </div>
            </div>

            {/* KPI Corner Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-sans">Attesi Casa ({homeTeam})</span>
                <span className="text-lg font-bold text-emerald-400">{simulation.expectedHomeCorners}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Over 4.5: {simulation.cornerHomeOver45Prob}%</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-sans">Attesi Ospite ({awayTeam})</span>
                <span className="text-lg font-bold text-cyan-400">{simulation.expectedAwayCorners}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Over 3.5: {simulation.cornerAwayOver35Prob}%</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-sans">Favorita 1X2 Corner</span>
                <span className="text-xs font-bold text-white block mt-1 truncate">
                  {simulation.cornerHomeMostProb > simulation.cornerAwayMostProb
                    ? `${homeTeam} (${simulation.cornerHomeMostProb}%)`
                    : `${awayTeam} (${simulation.cornerAwayMostProb}%)`}
                </span>
                <span className="text-[10px] text-slate-500 block">Pari: {simulation.cornerEqualProb}%</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-sans">Fascia Mediana</span>
                <span className="text-base font-bold text-amber-400">9-11 Corner</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Prob: {simulation.cornerRangeProbs.range9to11}%</span>
              </div>
            </div>

            {/* Tabella Matrice Range Completo Corner (Over/Under 6.5 a 14.5) */}
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Soglia Corner</th>
                    <th className="py-2.5 px-3 text-center">Prob. Over %</th>
                    <th className="py-2.5 px-3 text-center">Quota Equa Over</th>
                    <th className="py-2.5 px-3 text-center">Min Quota (+EV)</th>
                    <th className="py-2.5 px-3 text-center">Prob. Under %</th>
                    <th className="py-2.5 px-3 text-center">Quota Equa Under</th>
                    <th className="py-2.5 px-3 text-center">Valutazione Modello</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {[
                    { line: '6.5', over: simulation.cornerOver65Prob, under: simulation.cornerUnder65Prob, label: 'Ultra Prudente' },
                    { line: '7.5', over: simulation.cornerOver75Prob, under: simulation.cornerUnder75Prob, label: 'Base Difensiva' },
                    { line: '8.5', over: simulation.cornerOver85Prob, under: simulation.cornerUnder85Prob, label: 'Standard Basso' },
                    { line: '9.5', over: simulation.cornerOver95Prob, under: simulation.cornerUnder95Prob, label: 'Soglia Mediana' },
                    { line: '10.5', over: simulation.cornerOver105Prob, under: simulation.cornerUnder105Prob, label: 'Standard Alto' },
                    { line: '11.5', over: simulation.cornerOver115Prob, under: simulation.cornerUnder115Prob, label: 'Offensivo Alto' },
                    { line: '12.5', over: simulation.cornerOver125Prob, under: simulation.cornerUnder125Prob, label: 'Volume Intenso' },
                    { line: '13.5', over: simulation.cornerOver135Prob, under: simulation.cornerUnder135Prob, label: 'Range Estremo' },
                    { line: '14.5', over: simulation.cornerOver145Prob, under: simulation.cornerUnder145Prob, label: 'Picco Massimo' },
                  ].map((row) => {
                    const fairOver = Number((100 / Math.max(1, row.over)).toFixed(2));
                    const refMinOver = Number((fairOver * 1.08).toFixed(2));
                    const fairUnder = Number((100 / Math.max(1, row.under)).toFixed(2));
                    return (
                      <tr key={row.line} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          <span>Over / Under {row.line}</span>
                        </td>
                        <td className="py-2 px-3 text-center text-amber-400 font-bold tabular-nums">
                          {row.over}%
                        </td>
                        <td className="py-2 px-3 text-center text-slate-300 tabular-nums">
                          @{fairOver.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-400 font-bold tabular-nums">
                          @{refMinOver.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400 tabular-nums">
                          {row.under}%
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400 tabular-nums">
                          @{fairUnder.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-sans">
                            {row.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Corner per Squadra & Fasce Aggregate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Corner per Singola Squadra */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                <div className="text-[11px] font-sans font-bold text-slate-200 flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span>Linee Corner per Squadra</span>
                  <span className="text-slate-500 text-[10px]">Stime Poisson</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{homeTeam} Over 3.5: <strong className="text-emerald-400">{simulation.cornerHomeOver35Prob}%</strong></span>
                    <span className="text-[11px] text-slate-400 font-mono">Fair @{(100 / Math.max(1, simulation.cornerHomeOver35Prob)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{homeTeam} Over 4.5: <strong className="text-emerald-400">{simulation.cornerHomeOver45Prob}%</strong></span>
                    <span className="text-[11px] text-slate-400 font-mono">Fair @{(100 / Math.max(1, simulation.cornerHomeOver45Prob)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{homeTeam} Over 5.5: <strong className="text-emerald-400">{simulation.cornerHomeOver55Prob}%</strong></span>
                    <span className="text-[11px] text-slate-400 font-mono">Fair @{(100 / Math.max(1, simulation.cornerHomeOver55Prob)).toFixed(2)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-slate-300">
                    <span>{awayTeam} Over 2.5: <strong className="text-cyan-400">{simulation.cornerAwayOver25Prob}%</strong></span>
                    <span className="text-[11px] text-slate-400 font-mono">Fair @{(100 / Math.max(1, simulation.cornerAwayOver25Prob)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{awayTeam} Over 3.5: <strong className="text-cyan-400">{simulation.cornerAwayOver35Prob}%</strong></span>
                    <span className="text-[11px] text-slate-400 font-mono">Fair @{(100 / Math.max(1, simulation.cornerAwayOver35Prob)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{awayTeam} Over 4.5: <strong className="text-cyan-400">{simulation.cornerAwayOver45Prob}%</strong></span>
                    <span className="text-[11px] text-slate-400 font-mono">Fair @{(100 / Math.max(1, simulation.cornerAwayOver45Prob)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Fasce Aggregate e Benchmark Lega */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                <div className="text-[11px] font-sans font-bold text-slate-200 flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span>Fasce Corner Match & Benchmark Lega</span>
                  <span className="text-amber-400 text-[10px]">Media Lega: {cornerMarketStats.avgCornersPerMatch}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Fascia 0-8 Corner:</span>
                    <span className="text-white font-bold">{simulation.cornerRangeProbs.range0to8}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Fascia 9-11 Corner (Mediana):</span>
                    <span className="text-amber-400 font-bold">{simulation.cornerRangeProbs.range9to11}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Fascia 12-14 Corner:</span>
                    <span className="text-emerald-400 font-bold">{simulation.cornerRangeProbs.range12to14}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Fascia 15+ Corner:</span>
                    <span className="text-purple-400 font-bold">{simulation.cornerRangeProbs.range15plus}%</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Frequenza Reale Over 9.5 Lega:</span>
                    <span className="text-slate-200 font-bold">{cornerMarketStats.over95Pct}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Frequenza Reale Over 10.5 Lega:</span>
                    <span className="text-slate-200 font-bold">{cornerMarketStats.over105Pct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Betting Predictions Offer with Explicit Reference Odds */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Offerta Completa Pronostici & Indicazione Quota Minima di Riferimento (+EV)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Per ciascun mercato, il modello calcola la probabilità intrinseca, la quota equa e stabilisce la <strong>quota minima di riferimento</strong> necessaria per avere un Valore Atteso (+EV) positivo sul bookmaker.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tutti ({simulation.bettingAdviceList.length})
                </button>
                <button
                  onClick={() => setCategoryFilter('1X2 & Doppia Chance')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === '1X2 & Doppia Chance'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1X2 & Doppia Chance
                </button>
                <button
                  onClick={() => setCategoryFilter('Under / Over')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === 'Under / Over'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Under / Over
                </button>
                <button
                  onClick={() => setCategoryFilter('Goal / No Goal')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === 'Goal / No Goal'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Goal / No Goal
                </button>
                <button
                  onClick={() => setCategoryFilter('Corner')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === 'Corner'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Corner
                </button>
                <button
                  onClick={() => setCategoryFilter('Combo & Multigol')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === 'Combo & Multigol'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Combo & Multigol
                </button>
                <button
                  onClick={() => setCategoryFilter('Risultato Esatto')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === 'Risultato Esatto'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Risultato Esatto
                </button>
              </div>
            </div>

            {/* Grid of Actionable Betting Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
              {filteredAdviceList.map((tip, idx) => {
                let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                if (tip.confidence === 'Alta') {
                  badgeColor = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
                } else if (tip.confidence === 'Media') {
                  badgeColor = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
                } else if (tip.confidence === 'Speculativa') {
                  badgeColor = 'bg-purple-950/60 text-purple-400 border-purple-800/60';
                }

                return (
                  <div
                    key={`${tip.market}_${tip.selection}_${idx}`}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Meta Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                          {tip.market}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${badgeColor}`}>
                          {tip.confidence} Confidenza
                        </span>
                      </div>

                      {/* Market Name */}
                      <h4 className="text-sm font-bold text-white mb-2.5">
                        {tip.selection}
                      </h4>

                      {/* Main Actionable Instruction Box */}
                      <div className="p-2.5 bg-emerald-950/25 border border-emerald-800/40 rounded-lg mb-3 text-xs">
                        <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{tip.actionPhrase}</span>
                        </div>
                      </div>

                      {/* Explanatory Rationale */}
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {tip.rationale}
                      </p>
                    </div>

                    {/* Numerical Stats Footer */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-slate-800/80 font-mono text-center">
                      <div className="p-1 bg-slate-900/80 rounded-md">
                        <span className="text-[9px] text-slate-500 block font-sans">Stima</span>
                        <span className="text-xs font-bold text-slate-200 tabular-nums">{tip.probability}%</span>
                      </div>
                      <div className="p-1 bg-slate-900/80 rounded-md">
                        <span className="text-[9px] text-slate-500 block font-sans">Fair</span>
                        <span className="text-xs font-bold text-slate-300 tabular-nums">@{tip.fairOdds.toFixed(2)}</span>
                      </div>
                      <div className="p-1 bg-emerald-950/50 rounded-md border border-emerald-800/40">
                        <span className="text-[9px] text-emerald-400 block font-sans">Min. Quota</span>
                        <span className="text-xs font-bold text-emerald-400 tabular-nums">@{tip.referenceMinOdds.toFixed(2)}</span>
                      </div>
                      <div className="p-1 bg-cyan-950/50 rounded-md border border-cyan-800/40">
                        <span className="text-[9px] text-cyan-400 block font-sans">+EV</span>
                        <span className="text-xs font-bold text-cyan-400 tabular-nums">+{tip.expectedValuePct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
