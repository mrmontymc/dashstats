import React, { useState } from 'react';
import { Match, TeamStats } from '../types/football';
import { TrendingUp, Crosshair, BarChart3 } from 'lucide-react';

interface PerformanceChartsProps {
  matches: Match[];
  standings: TeamStats[];
  selectedTeam?: string;
  onSelectTeam: (team: string) => void;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  matches,
  standings,
  selectedTeam,
  onSelectTeam,
}) => {
  const [activeChart, setActiveChart] = useState<'trajectory' | 'quadrant' | 'shots'>('trajectory');
  const [comparedTeams, setComparedTeams] = useState<string[]>(() => {
    if (selectedTeam) return [selectedTeam];
    return standings.slice(0, 4).map((s) => s.team);
  });

  // Aggiorna comparedTeams se selectedTeam cambia
  React.useEffect(() => {
    if (selectedTeam && !comparedTeams.includes(selectedTeam)) {
      setComparedTeams((prev) => [selectedTeam, ...prev.slice(0, 3)]);
    }
  }, [selectedTeam]);

  if (matches.length === 0 || standings.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center text-slate-500 font-sans text-xs">
        Nessun dato sufficiente per generare i grafici di performance con i criteri di filtro correnti.
      </div>
    );
  }

  const toggleTeamComparison = (team: string) => {
    if (comparedTeams.includes(team)) {
      if (comparedTeams.length > 1) {
        setComparedTeams(comparedTeams.filter((t) => t !== team));
      }
    } else {
      if (comparedTeams.length < 5) {
        setComparedTeams([...comparedTeams, team]);
      } else {
        setComparedTeams([...comparedTeams.slice(1), team]);
      }
    }
  };

  // Calcola cumulativo punti per giornata per ciascuna squadra selezionata
  const sortedMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  const maxMatchday = Math.max(1, ...matches.map((m) => m.matchday || 0));

  const teamTrajectories = comparedTeams.map((teamName) => {
    let currentPts = 0;
    const pointsProgression: Array<{ round: number; points: number }> = [{ round: 0, points: 0 }];

    sortedMatches.forEach((m, idx) => {
      if (m.homeTeam === teamName) {
        if (m.homeGoals > m.awayGoals) currentPts += 3;
        else if (m.homeGoals === m.awayGoals) currentPts += 1;
        pointsProgression.push({ round: m.matchday || idx + 1, points: currentPts });
      } else if (m.awayTeam === teamName) {
        if (m.awayGoals > m.homeGoals) currentPts += 3;
        else if (m.awayGoals === m.homeGoals) currentPts += 1;
        pointsProgression.push({ round: m.matchday || idx + 1, points: currentPts });
      }
    });

    return {
      team: teamName,
      data: pointsProgression,
      finalPts: currentPts,
    };
  });

  const chartColors = ['#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#a855f7'];

  // Massimo punti per scala Y
  const maxPts = Math.max(10, ...teamTrajectories.map((t) => t.finalPts), 30);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 mb-6">
      {/* Chart Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setActiveChart('trajectory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeChart === 'trajectory'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Traiettoria Punti</span>
          </button>
          <button
            onClick={() => setActiveChart('quadrant')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeChart === 'quadrant'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Quadrante Attacco / Difesa</span>
          </button>
          <button
            onClick={() => setActiveChart('shots')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeChart === 'shots'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Volume & Conversione</span>
          </button>
        </div>

        {/* Selector for Trajectory Comparison */}
        {activeChart === 'trajectory' && (
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-slate-500 mr-1 text-[11px]">Confronta:</span>
            {standings.slice(0, 10).map((s) => {
              const isComp = comparedTeams.includes(s.team);
              return (
                <button
                  key={s.team}
                  onClick={() => toggleTeamComparison(s.team)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    isComp
                      ? 'bg-slate-800 text-slate-100 border-slate-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  {s.team}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Trajectory Line Chart */}
      {activeChart === 'trajectory' && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Andamento progressivo punti gara per gara</span>
            <div className="flex items-center gap-3">
              {teamTrajectories.map((t, idx) => (
                <div key={t.team} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                  ></span>
                  <span className="text-slate-200 font-sans">{t.team}</span>
                  <span className="text-slate-500 font-mono">({t.finalPts} pt)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full h-64 bg-slate-950/60 rounded-lg border border-slate-800/80 p-3 flex flex-col justify-between">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <line
                  key={i}
                  x1="30"
                  y1={180 - pct * 160}
                  x2="590"
                  y2={180 - pct * 160}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Y Axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <text
                  key={i}
                  x="22"
                  y={184 - pct * 160}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="end"
                >
                  {Math.round(pct * maxPts)}
                </text>
              ))}

              {/* Trajectory PolyLines */}
              {teamTrajectories.map((t, tIdx) => {
                const color = chartColors[tIdx % chartColors.length];
                const pointsStr = t.data
                  .map((p, idx) => {
                    const totalMatches = Math.max(t.data.length - 1, 1);
                    const x = 35 + (idx / totalMatches) * 550;
                    const y = 180 - (p.points / maxPts) * 160;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <g key={t.team}>
                    <polyline
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                    />
                    {/* Final point marker */}
                    {t.data.length > 0 && (() => {
                      const last = t.data[t.data.length - 1];
                      const totalMatches = Math.max(t.data.length - 1, 1);
                      const x = 35 + ((t.data.length - 1) / totalMatches) * 550;
                      const y = 180 - (last.points / maxPts) * 160;
                      return (
                        <circle cx={x} cy={y} r="4" fill={color} stroke="#090d16" strokeWidth="2" />
                      );
                    })()}
                  </g>
                );
              })}
            </svg>

            {/* Bottom X Axis */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
              <span>Inizio</span>
              <span>Metà Campionato</span>
              <span>Giornata Attuale ({maxMatchday})</span>
            </div>
          </div>
        </div>
      )}

      {/* Quadrant Attack vs Defense Chart */}
      {activeChart === 'quadrant' && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Distribuzione per Gol Fatti vs Gol Subiti a partita</span>
            <span className="text-[11px] font-mono text-slate-500">
              In alto a sinistra: zona élite (tanti gol fatti, pochi subiti)
            </span>
          </div>

          <div className="relative w-full h-72 bg-slate-950/60 rounded-lg border border-slate-800/80 p-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 240">
              {/* Quadrant backgrounds */}
              <rect x="250" y="20" width="230" height="95" fill="rgba(245, 158, 11, 0.04)" />
              <rect x="40" y="20" width="210" height="95" fill="rgba(16, 185, 129, 0.05)" />
              <rect x="40" y="115" width="210" height="95" fill="rgba(56, 189, 248, 0.04)" />
              <rect x="250" y="115" width="230" height="95" fill="rgba(239, 68, 68, 0.05)" />

              {/* Axes */}
              <line x1="250" y1="20" x2="250" y2="210" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="40" y1="115" x2="480" y2="115" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Quadrant Labels */}
              <text x="50" y="38" fill="#10b981" fontSize="10" fontWeight="600">ÉLITE / ALTO RENDIMENTO</text>
              <text x="260" y="38" fill="#f59e0b" fontSize="10" fontWeight="600">SPETTACOLARE / VULNERABILE</text>
              <text x="50" y="200" fill="#38bdf8" fontSize="10" fontWeight="600">DIFESA CHIUSA / BASSO VOLUME</text>
              <text x="260" y="200" fill="#f43f5e" fontSize="10" fontWeight="600">ZONA CRITICA / RETROCESSIONE</text>

              {/* Scatter Points */}
              {standings.map((s) => {
                const gfPerGame = s.played > 0 ? s.goalsFor / s.played : 1;
                const gaPerGame = s.played > 0 ? s.goalsAgainst / s.played : 1;

                // X: Conceded (min 0.4 to max 2.2) mapped to [50, 470]
                const x = 50 + ((gaPerGame - 0.4) / 1.8) * 420;
                // Y: Scored (min 0.5 to max 2.5) mapped to [200, 30]
                const y = 205 - ((gfPerGame - 0.5) / 2.0) * 175;

                const isSelected = selectedTeam === s.team;

                return (
                  <g
                    key={s.team}
                    onClick={() => onSelectTeam(s.team)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? '#10b981' : '#94a3b8'}
                      stroke={isSelected ? '#ffffff' : '#090d16'}
                      strokeWidth="1.5"
                      className="group-hover:fill-emerald-400 group-hover:scale-125 transition-all"
                    />
                    <text
                      x={x + 7}
                      y={y + 3}
                      fill={isSelected ? '#ffffff' : '#cbd5e1'}
                      fontSize="9"
                      fontWeight={isSelected ? '700' : '500'}
                      className="group-hover:fill-white"
                    >
                      {s.team}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800">
              <span>← Minori gol subiti (Difesa migliore)</span>
              <span>Maggiori gol subiti →</span>
            </div>
          </div>
        </div>
      )}

      {/* Shots Volume & Conversion Rate Bar Comparison */}
      {activeChart === 'shots' && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Volume di Tiri a partita vs Tasso di Conversione in Gol (%)</span>
            <span className="text-[11px] font-mono text-slate-500">Primi 12 club in classifica</span>
          </div>

          <div className="space-y-2.5">
            {standings.slice(0, 12).map((s) => {
              const maxShots = 20;
              const shotsPct = Math.min(100, (s.shotsPerGame / maxShots) * 100);
              const convPct = Math.min(100, (s.shotConversionRate / 20) * 100);
              const isSelected = selectedTeam === s.team;

              return (
                <div
                  key={s.team}
                  onClick={() => onSelectTeam(s.team)}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-medium ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {s.team}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-400">
                        {s.shotsPerGame} <span className="text-slate-600">tiri/g</span>
                      </span>
                      <span className="text-cyan-400 font-semibold">
                        {s.shotConversionRate}% <span className="text-slate-600">conv.</span>
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Shots Volume Bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full"
                        style={{ width: `${shotsPct}%` }}
                      ></div>
                    </div>
                    {/* Conversion Rate Bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${convPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
