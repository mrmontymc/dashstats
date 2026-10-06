import React, { useState } from 'react';
import { Match } from '../types/football';
import { ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';
import { exportMatchesToCSV } from '../utils/csvParser';

interface MatchTableViewProps {
  matches: Match[];
  onSelectTeam: (team: string) => void;
}

export const MatchTableView: React.FC<MatchTableViewProps> = ({
  matches,
  onSelectTeam,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const totalPages = Math.ceil(matches.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentMatches = matches.slice(startIndex, startIndex + pageSize);

  const handleExport = () => {
    exportMatchesToCSV(matches, `partite_filtrate_${matches.length}.csv`);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Archivio Dettagliato Gare ({matches.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Elenco completo delle partite con parametri di tiro, xG e disciplina.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Esporta Gare CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Data</th>
              <th className="py-2.5 px-2 text-center">G</th>
              <th className="py-2.5 px-3 text-right min-w-[130px]">Squadra Casa</th>
              <th className="py-2.5 px-3 text-center min-w-[70px]">Risultato</th>
              <th className="py-2.5 px-3 text-left min-w-[130px]">Squadra Trasferta</th>
              <th className="py-2.5 px-2.5 text-center">Tiri (In Porta)</th>
              <th className="py-2.5 px-2.5 text-center">xG</th>
              <th className="py-2.5 px-2.5 text-center">Possesso</th>
              <th className="py-2.5 px-2.5 text-center">Quote 1-X-2</th>
              <th className="py-2.5 px-2.5 text-center hidden lg:table-cell">Feed / Margine</th>
              <th className="py-2.5 px-2.5 text-center">Falli</th>
              <th className="py-2.5 px-2.5 text-center">Cartellini</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {currentMatches.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-500 font-sans text-xs">
                  Nessuna partita corrisponde ai criteri di filtro correnti.
                </td>
              </tr>
            ) : (
              currentMatches.map((m) => {
                const isHomeWin = m.homeGoals > m.awayGoals;
                const isAwayWin = m.awayGoals > m.homeGoals;
                const isDraw = m.homeGoals === m.awayGoals;

                return (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-400 text-xs tabular-nums">
                      {m.date}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-500 tabular-nums">
                      {m.matchday || '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-sans font-medium">
                      <button
                        onClick={() => onSelectTeam(m.homeTeam)}
                        className={`hover:text-emerald-400 transition-colors ${
                          isHomeWin ? 'text-white font-bold' : 'text-slate-300'
                        }`}
                      >
                        {m.homeTeam}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-slate-950 border border-slate-800 text-emerald-400 tabular-nums">
                        {m.homeGoals} - {m.awayGoals}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-left font-sans font-medium">
                      <button
                        onClick={() => onSelectTeam(m.awayTeam)}
                        className={`hover:text-emerald-400 transition-colors ${
                          isAwayWin ? 'text-white font-bold' : 'text-slate-300'
                        }`}
                      >
                        {m.awayTeam}
                      </button>
                    </td>
                    <td className="py-2 px-2.5 text-center text-slate-400 tabular-nums">
                      {m.homeShots !== undefined && m.awayShots !== undefined ? (
                        <span>
                          {m.homeShots} ({m.homeShotsTarget ?? '-'}) - {m.awayShots} ({m.awayShotsTarget ?? '-'})
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center text-cyan-400 tabular-nums">
                      {m.homeXg !== undefined && m.awayXg !== undefined ? (
                        <span>
                          {m.homeXg.toFixed(2)} - {m.awayXg.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center text-slate-400 tabular-nums">
                      {m.homePossession !== undefined ? (
                        <span>
                          {m.homePossession}% - {m.awayPossession}%
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center text-slate-300 font-mono text-[11px] tabular-nums">
                      {m.homeOdds && m.drawOdds && m.awayOdds ? (
                        <span className="flex items-center justify-center gap-1">
                          <span className={m.homeGoals > m.awayGoals ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {m.homeOdds.toFixed(2)}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className={m.homeGoals === m.awayGoals ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {m.drawOdds.toFixed(2)}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className={m.awayGoals > m.homeGoals ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {m.awayOdds.toFixed(2)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center hidden lg:table-cell">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400">
                        {m.oddsSource ? m.oddsSource.split('(')[0].trim() : 'Fair'}
                        {m.overround ? ` · ${m.overround}%` : ''}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-center text-slate-400 tabular-nums">
                      {m.homeFouls !== undefined ? (
                        <span>
                          {m.homeFouls} - {m.awayFouls}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center tabular-nums">
                      <span className="text-amber-400 font-semibold">
                        {(m.homeYellows ?? 0) + (m.awayYellows ?? 0)}
                      </span>
                      {(m.homeReds || 0) + (m.awayReds || 0) > 0 && (
                        <span className="text-rose-400 ml-1 font-semibold">
                          ({(m.homeReds || 0) + (m.awayReds || 0)}R)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Pagina <span className="text-slate-200 font-semibold">{currentPage}</span> di{' '}
            <span className="text-slate-200">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
