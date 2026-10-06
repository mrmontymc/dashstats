import React from 'react';
import { Target, Shield, Gauge, Goal, Layers } from 'lucide-react';
import { Match, TeamStats } from '../types/football';
import { computeLeagueMetrics } from '../utils/predictiveEngine';

interface MetricCardsProps {
  matches: Match[];
  selectedTeam?: string;
  teamStats?: TeamStats;
  venue?: 'all' | 'home' | 'away';
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  matches,
  selectedTeam,
  teamStats,
  venue = 'all',
}) => {
  const league = computeLeagueMetrics(matches);

  if (matches.length === 0) {
    return null;
  }

  // Se è selezionata una squadra specifica, mostra le metriche focalizzate su di essa (con rispetto del filtro Casa/Trasferta)
  if (selectedTeam && teamStats) {
    const pts = venue === 'home' ? teamStats.homePoints : venue === 'away' ? teamStats.awayPoints : teamStats.points;
    const played = venue === 'home' ? teamStats.homePlayed : venue === 'away' ? teamStats.awayPlayed : teamStats.played;
    const won = venue === 'home' ? teamStats.homeWon : venue === 'away' ? teamStats.awayWon : teamStats.won;
    const drawn = venue === 'home' ? teamStats.homeDrawn : venue === 'away' ? teamStats.awayDrawn : teamStats.drawn;
    const lost = venue === 'home' ? teamStats.homeLost : venue === 'away' ? teamStats.awayLost : teamStats.lost;
    const gf = venue === 'home' ? teamStats.homeGf : venue === 'away' ? teamStats.awayGf : teamStats.goalsFor;
    const ga = venue === 'home' ? teamStats.homeGa : venue === 'away' ? teamStats.awayGa : teamStats.goalsAgainst;
    const diff = gf - ga;
    const ppg = played > 0 ? (pts / played).toFixed(2) : '0.00';
    const venueLabel = venue === 'home' ? 'in Casa' : venue === 'away' ? 'in Trasferta' : 'Totali';

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {/* Punti e Posizione */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Punti {venueLabel}</span>
            <Layers className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {pts}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">
            Media {ppg} PPG {venue === 'home' ? 'Casa' : venue === 'away' ? 'Trasf.' : ''}
          </div>
        </div>

        {/* Record V - N - P */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Record V-N-P {venueLabel}</div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
            {won}-{drawn}-{lost}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">
            {played} gare {venue === 'home' ? 'casalinghe' : venue === 'away' ? 'esterne' : 'disputate'}
          </div>
        </div>

        {/* Gol Fatti vs Subiti */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Gol F / S ({venue === 'home' ? 'Casa' : venue === 'away' ? 'Trasf.' : 'Tot'})</span>
            <Goal className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {gf} <span className="text-slate-500 font-normal">/</span> {ga}
          </div>
          <div className="text-xs font-mono mt-1 text-slate-400">
            Diff. Reti {diff > 0 ? `+${diff}` : diff}
          </div>
        </div>

        {/* Efficienza Tiri */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Conversione Tiri</span>
            <Target className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            {teamStats.shotConversionRate}%
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">
            {teamStats.shotsPerGame} tiri/gara
          </div>
        </div>

        {/* xG Totale vs xG Subito */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>xG Prodotti / Subiti</span>
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {teamStats.totalXg} <span className="text-slate-500 font-normal">/</span> {teamStats.totalXgAgainst}
          </div>
          <div className="text-xs font-mono mt-1 text-slate-400">
            xPTS: {teamStats.xPts}
          </div>
        </div>

        {/* Clean Sheet */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Clean Sheet</span>
            <Shield className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {teamStats.cleanSheets}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">
            {((teamStats.cleanSheets / (teamStats.played || 1)) * 100).toFixed(0)}% delle gare
          </div>
        </div>
      </div>
    );
  }

  // Vista globale (con supporto dinamico ai filtri Casa / Trasferta)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Totale Gare e Gol */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
          <span>Gare {venue === 'home' ? 'in Casa' : venue === 'away' ? 'in Trasferta' : 'Analizzate'}</span>
          <Layers className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tabular-nums">
          {league.totalMatches}
        </div>
        <div className="text-xs text-slate-500 font-mono mt-1">
          {league.totalGoals} reti totali
        </div>
      </div>

      {/* Media Gol a Partita */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
          <span>{venue === 'home' ? 'Media Gol Casa' : venue === 'away' ? 'Media Gol Ospiti' : 'Media Gol/Gara'}</span>
          <Goal className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
          {venue === 'home' ? league.avgHomeGoals : venue === 'away' ? league.avgAwayGoals : league.avgGoalsPerMatch}
        </div>
        <div className="text-xs text-slate-500 font-mono mt-1">
          {venue === 'home' 
            ? `Reti casalinghe (${(league.avgHomeGoals * league.totalMatches).toFixed(0)})` 
            : venue === 'away' 
            ? `Reti esterne (${(league.avgAwayGoals * league.totalMatches).toFixed(0)})` 
            : `Casa ${league.avgHomeGoals} · Trasf. ${league.avgAwayGoals}`}
        </div>
      </div>

      {/* Fattore Campo (% 1X2) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-1">
          {venue === 'home' ? 'Successo Casa (1)' : venue === 'away' ? 'Successo Trasf. (2)' : 'Distribuzione 1X2'}
        </div>
        <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
          {venue === 'home' ? `${league.homeWinPct}%` : venue === 'away' ? `${league.awayWinPct}%` : `${league.homeWinPct}%`}
          <span className="text-xs text-slate-500 font-normal ml-1">
            {venue === 'home' ? 'Vittoria Casa' : venue === 'away' ? 'Vittoria 2' : 'Casa'}
          </span>
        </div>
        <div className="text-xs text-slate-500 font-mono mt-1">
          N {league.drawPct}% · 2 {league.awayWinPct}%
        </div>
      </div>

      {/* Entrambe a Segno (BTTS) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-1">Goal / No Goal</div>
        <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
          {league.bothTeamsScorePct}%
        </div>
        <div className="text-xs text-slate-500 font-mono mt-1">
          Entrambe a segno
        </div>
      </div>

      {/* Over 2.5 Gol */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
          <span>Over 2.5 Gol</span>
          <Gauge className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
          {league.over25Pct}%
        </div>
        <div className="text-xs text-slate-500 font-mono mt-1">
          Under 2.5: {(100 - league.over25Pct).toFixed(1)}%
        </div>
      </div>

      {/* Cartellini e Disciplina */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
          <span>Disciplina Media</span>
          <Shield className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tabular-nums">
          {league.avgYellows}
        </div>
        <div className="text-xs text-slate-500 font-mono mt-1">
          Gialli/gara · Rossi {league.avgReds}
        </div>
      </div>
    </div>
  );
};
