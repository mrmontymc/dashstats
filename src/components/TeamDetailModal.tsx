import React from 'react';
import { X, Shield, Target, Gauge, TrendingUp, AlertTriangle, ChevronRight, Swords } from 'lucide-react';
import { Match, TeamStats, TeamPredictiveProfile } from '../types/football';

interface TeamDetailModalProps {
  team: string;
  isOpen: boolean;
  onClose: () => void;
  teamStats?: TeamStats;
  profile?: TeamPredictiveProfile;
  teamMatches: Match[];
  onSimulateTeam: (team: string) => void;
}

export const TeamDetailModal: React.FC<TeamDetailModalProps> = ({
  team,
  isOpen,
  onClose,
  teamStats,
  profile,
  teamMatches,
  onSimulateTeam,
}) => {
  if (!isOpen || !teamStats) return null;

  const sortedTeamMatches = [...teamMatches]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{team}</h2>
              {profile && (
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  {profile.archetype}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
              <span>{teamStats.points} Punti</span>
              <span>·</span>
              <span>{teamStats.won}V - {teamStats.drawn}N - {teamStats.lost}P</span>
              <span>·</span>
              <span>Diff. Reti {teamStats.goalDiff > 0 ? `+${teamStats.goalDiff}` : teamStats.goalDiff}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSimulateTeam(team);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/80 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Simula Match</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Diagnostic Profile Banner */}
          {profile && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <span className="text-slate-400">Diagnosi Statistica & Tattica</span>
                <span className="text-emerald-400 font-semibold">
                  Momentum: {profile.momentumStatus} ({profile.momentumScore > 0 ? `+${profile.momentumScore}` : profile.momentumScore})
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {profile.archetypeDescription}
              </p>
              {profile.regressionAlert && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{profile.regressionAlert} (xG Delta: {profile.xgDelta > 0 ? `+${profile.xgDelta}` : profile.xgDelta})</span>
                </div>
              )}
            </div>
          )}

          {/* Metric Comparison: Home vs Away */}
          <div>
            <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 tracking-wider">
              Rendimento Casa vs Trasferta
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Casa */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg font-mono text-xs">
                <div className="flex items-center justify-between text-slate-200 font-bold mb-2">
                  <span>In Casa</span>
                  <span className="text-emerald-400">{teamStats.homePoints} pt</span>
                </div>
                <div className="space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Partite / Vittorie:</span>
                    <span className="text-slate-200">{teamStats.homePlayed} ({teamStats.homeWon}V-{teamStats.homeDrawn}N-{teamStats.homeLost}P)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gol Fatti / Subiti:</span>
                    <span className="text-slate-200">{teamStats.homeGf} / {teamStats.homeGa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentuale Vittoria:</span>
                    <span className="text-slate-200">
                      {teamStats.homePlayed > 0 ? ((teamStats.homeWon / teamStats.homePlayed) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Trasferta */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg font-mono text-xs">
                <div className="flex items-center justify-between text-slate-200 font-bold mb-2">
                  <span>In Trasferta</span>
                  <span className="text-cyan-400">{teamStats.awayPoints} pt</span>
                </div>
                <div className="space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Partite / Vittorie:</span>
                    <span className="text-slate-200">{teamStats.awayPlayed} ({teamStats.awayWon}V-{teamStats.awayDrawn}N-{teamStats.awayLost}P)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gol Fatti / Subiti:</span>
                    <span className="text-slate-200">{teamStats.awayGf} / {teamStats.awayGa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentuale Vittoria:</span>
                    <span className="text-slate-200">
                      {teamStats.awayPlayed > 0 ? ((teamStats.awayWon / teamStats.awayPlayed) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Key Indicators */}
          <div>
            <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 tracking-wider">
              Indicatori di Efficienza Avanzati
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Tiri a Partita</span>
                <span className="text-base font-bold text-white mt-0.5">{teamStats.shotsPerGame}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Conversione Tiri</span>
                <span className="text-base font-bold text-cyan-400 mt-0.5">{teamStats.shotConversionRate}%</span>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Clean Sheet</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5">{teamStats.cleanSheets} gare</span>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Possesso Palla Medio</span>
                <span className="text-base font-bold text-white mt-0.5">{teamStats.avgPossession}%</span>
              </div>
            </div>
          </div>

          {/* Recent Match Log */}
          <div>
            <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 tracking-wider">
              Ultime Gare Registrate ({sortedTeamMatches.length})
            </h3>
            <div className="space-y-2">
              {sortedTeamMatches.map((m) => {
                const isHome = m.homeTeam === team;
                const opponent = isHome ? m.awayTeam : m.homeTeam;
                const teamGoals = isHome ? m.homeGoals : m.awayGoals;
                const oppGoals = isHome ? m.awayGoals : m.homeGoals;
                const isWin = teamGoals > oppGoals;
                const isLoss = oppGoals > teamGoals;

                let outcomeBadge = 'N';
                let outcomeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
                if (isWin) {
                  outcomeBadge = 'V';
                  outcomeStyle = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60';
                } else if (isLoss) {
                  outcomeBadge = 'P';
                  outcomeStyle = 'bg-rose-950/70 text-rose-400 border-rose-800/60';
                }

                return (
                  <div
                    key={m.id}
                    className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded font-bold text-[11px] flex items-center justify-center border ${outcomeStyle}`}>
                        {outcomeBadge}
                      </span>
                      <span className="text-slate-400 text-[11px]">{m.date}</span>
                      <span className="font-sans font-medium text-slate-200">
                        {isHome ? 'vs' : '@'} {opponent}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-100 font-bold">
                        {teamGoals} - {oppGoals}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        xG {isHome ? m.homeXg : m.awayXg} vs {isHome ? m.awayXg : m.homeXg}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
