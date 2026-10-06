import React, { useState } from 'react';
import { Search, X, RotateCcw, Calendar, Sliders, ChevronDown } from 'lucide-react';
import { FilterState } from '../types/football';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  teams: string[];
  competitions?: string[];
  totalMatchesCount: number;
  filteredMatchesCount: number;
  onOpenConfig?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  teams,
  competitions = [],
  totalMatchesCount,
  filteredMatchesCount,
  onOpenConfig,
}) => {
  const [showDateFilters, setShowDateFilters] = useState<boolean>(
    Boolean(filters.dateFrom || filters.dateTo)
  );

  const hasActiveFilters =
    filters.team !== '' ||
    filters.venue !== 'all' ||
    filters.outcome !== 'all' ||
    filters.searchQuery !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.competition !== '';

  const handleReset = () => {
    onFilterChange({
      team: '',
      venue: 'all',
      outcome: 'all',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
      competition: '',
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 sm:p-4 mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca squadra o match (es. Inter, Milan vs Juve)..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Competition Dropdown */}
          {competitions.length > 1 && (
            <div className="relative">
              <select
                value={filters.competition}
                onChange={(e) => onFilterChange({ ...filters, competition: e.target.value })}
                aria-label="Filtra per campionato"
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-md text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Tutti i campionati ({competitions.length})</option>
                {competitions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Team Dropdown */}
          <div className="relative">
            <select
              value={filters.team}
              onChange={(e) => onFilterChange({ ...filters, team: e.target.value })}
              aria-label="Filtra per squadra"
              className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Tutte le squadre ({teams.length})</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Venue Segmented Control */}
          <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-0.5">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, venue: 'all' })}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                filters.venue === 'all'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tutte
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, venue: 'home' })}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                filters.venue === 'home'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Casa
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, venue: 'away' })}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                filters.venue === 'away'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trasferta
            </button>
          </div>

          {/* Outcome Segmented Control */}
          <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-0.5">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, outcome: 'all' })}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filters.outcome === 'all'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, outcome: 'W' })}
              title="Vittorie"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filters.outcome === 'W'
                  ? 'bg-emerald-950/70 text-emerald-300 font-medium border border-emerald-800/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              V
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, outcome: 'D' })}
              title="Pareggi"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filters.outcome === 'D'
                  ? 'bg-slate-800 text-slate-200 font-medium border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              N
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, outcome: 'L' })}
              title="Sconfitte"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filters.outcome === 'L'
                  ? 'bg-rose-950/60 text-rose-300 font-medium border border-rose-800/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              P
            </button>
          </div>

          {/* Toggle Date Range button */}
          <button
            type="button"
            onClick={() => setShowDateFilters(!showDateFilters)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${
              filters.dateFrom || filters.dateTo
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 font-medium'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Date</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDateFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Personalizza Analisi button */}
          {onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              title="Personalizza parametri e modelli previsionali"
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Personalizza</span>
            </button>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Azzera</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Date Range Bar */}
      {showDateFilters && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Intervallo Temporale:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-mono text-[11px]">Dal:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
              className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-mono text-[11px]">Al:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
              className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {(filters.dateFrom || filters.dateTo) && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, dateFrom: '', dateTo: '' })}
              className="text-slate-400 hover:text-rose-400 text-[11px] underline underline-offset-2 ml-1"
            >
              Azzera date
            </button>
          )}
        </div>
      )}

      {/* Filter status summary line */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono gap-2">
        <div>
          <span>Mostrate </span>
          <span className="text-slate-200 font-semibold tabular-nums">{filteredMatchesCount}</span>
          <span> di </span>
          <span className="text-slate-200 tabular-nums">{totalMatchesCount}</span>
          <span> gare registrate</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {filters.competition && (
            <span className="text-emerald-400 font-sans">
              Lega: <strong className="font-semibold">{filters.competition}</strong>
            </span>
          )}
          {filters.team && (
            <span className="text-cyan-400 font-sans">
              Squadra: <strong className="font-semibold">{filters.team}</strong>
            </span>
          )}
          {filters.venue !== 'all' && (
            <span className="text-slate-400 font-sans">
              Sede: {filters.venue === 'home' ? 'Casa' : 'Trasferta'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
