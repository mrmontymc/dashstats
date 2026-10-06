import React, { useState } from 'react';
import { ArrowUpDown, ChevronRight, TrendingUp } from 'lucide-react';
import { TeamStats } from '../types/football';

interface StandingsTableProps {
  standings: TeamStats[];
  onSelectTeam: (team: string) => void;
  selectedTeam?: string;
  isFiltered?: boolean;
  venue?: 'all' | 'home' | 'away';
  onVenueChange?: (venue: 'all' | 'home' | 'away') => void;
}

type SortField = 'points' | 'played' | 'won' | 'drawn' | 'lost' | 'goalsFor' | 'goalsAgainst' | 'goalDiff' | 'totalXg' | 'xPts' | 'shotConversionRate' | 'eloRating' | 'homeDominanceRatio';

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  onSelectTeam,
  selectedTeam,
  isFiltered,
  venue = 'all',
  onVenueChange,
}) => {
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Mappa i dati della squadra in base alla sede attiva (Tutte / Casa / Trasferta)
  const mappedStandings = React.useMemo(() => {
    return standings.map((row) => {
      if (venue === 'home') {
        return {
          ...row,
          played: row.homePlayed,
          won: row.homeWon,
          drawn: row.homeDrawn,
          lost: row.homeLost,
          goalsFor: row.homeGf,
          goalsAgainst: row.homeGa,
          goalDiff: row.homeGf - row.homeGa,
          points: row.homePoints,
        };
      }
      if (venue === 'away') {
        return {
          ...row,
          played: row.awayPlayed,
          won: row.awayWon,
          drawn: row.awayDrawn,
          lost: row.awayLost,
          goalsFor: row.awayGf,
          goalsAgainst: row.awayGa,
          goalDiff: row.awayGf - row.awayGa,
          points: row.awayPoints,
        };
      }
      return row;
    });
  }, [standings, venue]);

  const sortedData = [...mappedStandings].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  const getTableTitle = () => {
    if (venue === 'home') return 'Classifica Casa (Rendimento Interno)';
    if (venue === 'away') return 'Classifica Trasferta (Rendimento Esterno)';
    return 'Classifica Generale e Rendimento';
  };

  const getTableDescription = () => {
    if (venue === 'home') return 'Statistiche e punti conquistati esclusivamente negli incontri disputati sul proprio campo.';
    if (venue === 'away') return 'Statistiche e punti conquistati esclusivamente nelle gare giocate fuori casa.';
    return 'Clicca su una squadra per visualizzare la scheda analitica dettagliata.';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>{getTableTitle()}</span>
            {venue !== 'all' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                {venue === 'home' ? 'Fattore Campo' : 'Esterno'}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {getTableDescription()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Synchronized Venue Switcher */}
          {onVenueChange && (
            <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => onVenueChange('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  venue === 'all'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tutte
              </button>
              <button
                type="button"
                onClick={() => onVenueChange('home')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  venue === 'home'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Casa
              </button>
              <button
                type="button"
                onClick={() => onVenueChange('away')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  venue === 'away'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Trasferta
              </button>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>UCL (1-4)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
              <span>UEL / UECL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              <span>Retrocessione</span>
            </div>
          </div>
        </div>
      </div>

      {isFiltered && (
        <div className="px-4 py-1.5 bg-emerald-950/30 border-b border-emerald-900/40 text-[11px] text-emerald-400 flex items-center justify-between font-mono">
          <span>⚡ Classifica calcolata esclusivamente sul sottoinsieme di partite filtrate</span>
          <span className="text-slate-400">{standings.length} squadre visibili</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[140px]">Squadra</th>
              <th
                onClick={() => handleSort('played')}
                className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-200"
              >
                G
              </th>
              <th
                onClick={() => handleSort('won')}
                className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-200"
              >
                V
              </th>
              <th
                onClick={() => handleSort('drawn')}
                className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-200"
              >
                N
              </th>
              <th
                onClick={() => handleSort('lost')}
                className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-200"
              >
                P
              </th>
              <th
                onClick={() => handleSort('goalsFor')}
                className="py-2.5 px-2.5 text-right cursor-pointer hover:text-slate-200"
              >
                GF
              </th>
              <th
                onClick={() => handleSort('goalsAgainst')}
                className="py-2.5 px-2.5 text-right cursor-pointer hover:text-slate-200"
              >
                GS
              </th>
              <th
                onClick={() => handleSort('goalDiff')}
                className="py-2.5 px-2.5 text-right cursor-pointer hover:text-slate-200"
              >
                DR
              </th>
              <th
                onClick={() => handleSort('totalXg')}
                className="py-2.5 px-2.5 text-right cursor-pointer hover:text-slate-200 hidden md:table-cell"
              >
                xG
              </th>
              <th
                onClick={() => handleSort('xPts')}
                className="py-2.5 px-2.5 text-right cursor-pointer hover:text-slate-200 hidden md:table-cell"
              >
                xPTS
              </th>
              <th
                onClick={() => handleSort('shotConversionRate')}
                className="py-2.5 px-2.5 text-right cursor-pointer hover:text-slate-200 hidden lg:table-cell"
              >
                Conv %
              </th>
              <th
                onClick={() => handleSort('points')}
                className="py-2.5 px-3 text-right cursor-pointer text-emerald-400 font-bold bg-slate-900/40"
              >
                PT
              </th>
              <th
                onClick={() => handleSort('eloRating')}
                className="py-2.5 px-2.5 text-right cursor-pointer hover:text-slate-200 hidden sm:table-cell"
                title="Rating Elo (Power Rank)"
              >
                Elo (Rank)
              </th>
              <th className="py-2.5 px-3 text-center min-w-[110px]">Forma (Ultime 5)</th>
              <th className="py-2.5 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-8 text-center text-slate-500 font-sans text-xs">
                  Nessuna squadra corrispondente ai filtri attivi. Prova a modificare o azzerare i criteri di ricerca.
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => {
                const isSelected = selectedTeam === row.team;
              const pos = index + 1;

              // Border indicator for tournament zones
              let zoneBorder = 'border-l-2 border-transparent';
              if (pos <= 4) zoneBorder = 'border-l-2 border-emerald-500';
              else if (pos <= 6) zoneBorder = 'border-l-2 border-sky-500';
              else if (pos >= sortedData.length - 2) zoneBorder = 'border-l-2 border-rose-500';

              return (
                <tr
                  key={row.team}
                  onClick={() => onSelectTeam(row.team)}
                  className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-800/80' : ''
                  } ${zoneBorder}`}
                >
                  <td className="py-2 px-3 text-center text-slate-500 text-xs tabular-nums">
                    {pos}
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-200">
                    <span className="hover:text-emerald-400 transition-colors">{row.team}</span>
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400 tabular-nums">
                    {row.played}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300 tabular-nums">
                    {row.won}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400 tabular-nums">
                    {row.drawn}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400 tabular-nums">
                    {row.lost}
                  </td>
                  <td className="py-2 px-2.5 text-right text-slate-300 tabular-nums">
                    {row.goalsFor}
                  </td>
                  <td className="py-2 px-2.5 text-right text-slate-400 tabular-nums">
                    {row.goalsAgainst}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    <span
                      className={
                        row.goalDiff > 0
                          ? 'text-emerald-400'
                          : row.goalDiff < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-right text-slate-400 tabular-nums hidden md:table-cell">
                    {row.totalXg}
                  </td>
                  <td className="py-2 px-2.5 text-right text-cyan-400 tabular-nums hidden md:table-cell">
                    {row.xPts}
                  </td>
                  <td className="py-2 px-2.5 text-right text-slate-300 tabular-nums hidden lg:table-cell">
                    {row.shotConversionRate}%
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-100 tabular-nums text-sm bg-slate-900/30">
                    {row.points}
                  </td>
                  <td className="py-2 px-2.5 text-right text-slate-300 tabular-nums hidden sm:table-cell">
                    <span className="font-semibold text-slate-200">{row.eloRating}</span>
                    <span className="text-[10px] text-slate-500 ml-1">#{row.eloRank}</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {row.form.map((res, i) => {
                        let color = 'bg-slate-700 text-slate-300';
                        let label = 'N';
                        if (res === 'H') {
                          color = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
                          label = 'V';
                        } else if (res === 'A') {
                          color = 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
                          label = 'P';
                        }
                        return (
                          <span
                            key={i}
                            title={`Risultato: ${label}`}
                            className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center ${color}`}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-500">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
