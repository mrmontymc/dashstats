import React, { useState, useMemo, useEffect } from 'react';
import {
  Match,
  TeamStats,
  TeamPredictiveProfile,
  AnalysisConfig,
  BettingAdviceTip,
  MatchCustomOdds,
} from '../types/football';
import {
  computePredictiveProfiles,
  computeLeagueMetrics,
  simulateMatch,
} from '../utils/predictiveEngine';
import { analyzeHistoricalMatchesWithOdds } from '../utils/oddsAnalyticsEngine';
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
    const o25 = Number(((100 / simulation.over25Prob) * marginFactor).toFixed(2));
    const u25 = Number(((100 / (100 - simulation.over25Prob)) * marginFactor).toFixed(2));
    const btts = Number(((100 / simulation.bothTeamsScoreProb) * marginFactor).toFixed(2));
    const bttsNo = Number(((100 / (100 - simulation.bothTeamsScoreProb)) * marginFactor).toFixed(2));

    setCustomOdds({
      homeOdds: h,
      drawOdds: d,
      awayOdds: a,
      over25Odds: o25,
      under25Odds: u25,
      bttsYesOdds: btts,
      bttsNoOdds: bttsNo,
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
      over25Odds: undefined,
      under25Odds: undefined,
      bttsYesOdds: undefined,
      bttsNoOdds: undefined,
      sourceName: 'Bookmaker',
    });
  };

  // Calcolo dell'aggio e margine del banco per le quote inserite
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

  // Rilevazione live di Value Bets (+EV) confrontando le quote inserite con il modello poissoniano
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

    if (customOdds.homeOdds && customOdds.homeOdds > 1) {
      const fair = Number((100 / simulation.homeWinProb).toFixed(2));
      const edge = Number(((customOdds.homeOdds / fair - 1) * 100).toFixed(1));
      const ev = Number((((simulation.homeWinProb / 100) * customOdds.homeOdds - 1) * 100).toFixed(1));
      list.push({
        market: `1 (${homeTeam})`,
        userOdd: customOdds.homeOdds,
        fairOdd: fair,
        edgePct: edge,
        evPct: ev,
        isPositiveEv: ev > 0,
        tipPhrase: `Punta il segno 1 (${homeTeam}) @${customOdds.homeOdds.toFixed(2)} (Fair @${fair.toFixed(2)} · ${ev > 0 ? `+${ev}% EV` : `${ev}% EV`})`,
      });
    }

    if (customOdds.drawOdds && customOdds.drawOdds > 1) {
      const fair = Number((100 / simulation.drawProb).toFixed(2));
      const edge = Number(((customOdds.drawOdds / fair - 1) * 100).toFixed(1));
      const ev = Number((((simulation.drawProb / 100) * customOdds.drawOdds - 1) * 100).toFixed(1));
      list.push({
        market: 'X (Pareggio)',
        userOdd: customOdds.drawOdds,
        fairOdd: fair,
        edgePct: edge,
        evPct: ev,
        isPositiveEv: ev > 0,
        tipPhrase: `Punta il segno X @${customOdds.drawOdds.toFixed(2)} (Fair @${fair.toFixed(2)} · ${ev > 0 ? `+${ev}% EV` : `${ev}% EV`})`,
      });
    }

    if (customOdds.awayOdds && customOdds.awayOdds > 1) {
      const fair = Number((100 / simulation.awayWinProb).toFixed(2));
      const edge = Number(((customOdds.awayOdds / fair - 1) * 100).toFixed(1));
      const ev = Number((((simulation.awayWinProb / 100) * customOdds.awayOdds - 1) * 100).toFixed(1));
      list.push({
        market: `2 (${awayTeam})`,
        userOdd: customOdds.awayOdds,
        fairOdd: fair,
        edgePct: edge,
        evPct: ev,
        isPositiveEv: ev > 0,
        tipPhrase: `Punta il segno 2 (${awayTeam}) @${customOdds.awayOdds.toFixed(2)} (Fair @${fair.toFixed(2)} · ${ev > 0 ? `+${ev}% EV` : `${ev}% EV`})`,
      });
    }

    if (customOdds.over25Odds && customOdds.over25Odds > 1) {
      const fair = Number((100 / simulation.over25Prob).toFixed(2));
      const edge = Number(((customOdds.over25Odds / fair - 1) * 100).toFixed(1));
      const ev = Number((((simulation.over25Prob / 100) * customOdds.over25Odds - 1) * 100).toFixed(1));
      list.push({
        market: 'Over 2.5 Gol',
        userOdd: customOdds.over25Odds,
        fairOdd: fair,
        edgePct: edge,
        evPct: ev,
        isPositiveEv: ev > 0,
        tipPhrase: `Punta Over 2.5 @${customOdds.over25Odds.toFixed(2)} (Fair @${fair.toFixed(2)} · ${ev > 0 ? `+${ev}% EV` : `${ev}% EV`})`,
      });
    }

    if (customOdds.bttsYesOdds && customOdds.bttsYesOdds > 1) {
      const fair = Number((100 / simulation.bothTeamsScoreProb).toFixed(2));
      const edge = Number(((customOdds.bttsYesOdds / fair - 1) * 100).toFixed(1));
      const ev = Number((((simulation.bothTeamsScoreProb / 100) * customOdds.bttsYesOdds - 1) * 100).toFixed(1));
      list.push({
        market: 'Goal (BTTS Sì)',
        userOdd: customOdds.bttsYesOdds,
        fairOdd: fair,
        edgePct: edge,
        evPct: ev,
        isPositiveEv: ev > 0,
        tipPhrase: `Punta Goal (BTTS) @${customOdds.bttsYesOdds.toFixed(2)} (Fair @${fair.toFixed(2)} · ${ev > 0 ? `+${ev}% EV` : `${ev}% EV`})`,
      });
    }

    return list;
  }, [customOdds, simulation, homeTeam, awayTeam]);

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
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
                  Risultati Esatti Più Probabili
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Distribuzione di frequenza multivariata calcolata tramite matrice di Poisson.
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
