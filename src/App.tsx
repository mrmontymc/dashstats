import React, { useState, useMemo } from 'react';
import { Match, FilterState, TeamStats, AnalysisConfig } from './types/football';
import { getSampleSerieAMatches, getMultiLeagueSampleMatches } from './data/sampleDataset';
import { computeTeamStats } from './utils/predictiveEngine';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { MetricCards } from './components/MetricCards';
import { StandingsTable } from './components/StandingsTable';
import { PerformanceCharts } from './components/PerformanceCharts';
import { PredictiveSection } from './components/PredictiveSection';
import { OddsAnalyticsSection } from './components/OddsAnalyticsSection';
import { MatchSimulatorView } from './components/MatchSimulatorView';
import { MatchTableView } from './components/MatchTableView';
import { MetricsGuideView } from './components/MetricsGuideView';
import { TeamDetailModal } from './components/TeamDetailModal';
import { CsvUploadModal } from './components/CsvUploadModal';
import { AnalysisConfigModal } from './components/AnalysisConfigModal';
import { exportMatchesToCSV } from './utils/csvParser';
import { computePredictiveProfiles } from './utils/predictiveEngine';
import { computeOddsSourceSummary } from './utils/oddsAnalyticsEngine';
import { Plus, Layers } from 'lucide-react';

export default function App() {
  // Dataset primario (inizializzato con Serie A realistica da 380 gare)
  const [matches, setMatches] = useState<Match[]>(() => getSampleSerieAMatches());
  const [datasetName, setDatasetName] = useState<string>('Serie A TIM 2023/24');

  // Navigazione schede (dashboard rimossa, aggiunta guida metodologica alle metriche)
  const [activeTab, setActiveTab] = useState<'standings' | 'predictions' | 'odds' | 'simulator' | 'matches' | 'guide'>('standings');

  // Stato filtri real-time
  const [filters, setFilters] = useState<FilterState>({
    team: '',
    venue: 'all',
    outcome: 'all',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
    competition: '',
  });

  // Configurazione personalizzabile dei modelli analitici e parametri scommesse
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    recentFormWeight: 0.40,
    homeAdvantageFactor: 1.12,
    metricBasis: 'goals',
    flatStake: 100,
    minEvThreshold: 4.0,
    minSampleBets: 8,
    preferredOddsSource: 'all',
    simulationsCount: 2000,
  });

  // Squadra selezionata per il modal di ispezione approfondita
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Lista di tutti i campionati / competizioni presenti
  const allCompetitions = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.competition) set.add(m.competition);
    });
    return Array.from(set).sort();
  }, [matches]);

  // Lista di tutte le squadre distinte nel dataset
  const allTeams = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (!filters.competition || m.competition === filters.competition) {
        set.add(m.homeTeam);
        set.add(m.awayTeam);
      }
    });
    return Array.from(set).sort();
  }, [matches, filters.competition]);

  // Calcolo della classifica complessiva su TUTTE le gare del dataset
  const overallStandings = useMemo(() => {
    return computeTeamStats(matches, analysisConfig);
  }, [matches, analysisConfig]);

  // Filtro in tempo reale delle partite con controllo rigoroso date, esiti, sede e competizione
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // 0. Filtro Campionato / Competizione
      if (filters.competition && m.competition !== filters.competition) {
        return false;
      }

      // 1. Filtro Temporale (Data Dal / Data Al)
      if (filters.dateFrom && m.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && m.date > filters.dateTo) {
        return false;
      }

      // 2. Ricerca testuale
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchString = `${m.homeTeam} ${m.awayTeam} ${m.date} ${m.competition || ''}`.toLowerCase();
        if (!matchString.includes(q)) return false;
      }

      // 3. Filtro Squadra
      if (filters.team) {
        const isHome = m.homeTeam.toLowerCase() === filters.team.toLowerCase();
        const isAway = m.awayTeam.toLowerCase() === filters.team.toLowerCase();
        if (!isHome && !isAway) return false;

        // 4. Filtro Sede (Casa/Trasferta) rispetto alla squadra selezionata
        if (filters.venue === 'home' && !isHome) return false;
        if (filters.venue === 'away' && !isAway) return false;

        // 5. Filtro Esito rispetto alla squadra selezionata
        if (filters.outcome !== 'all') {
          const teamGoals = isHome ? m.homeGoals : m.awayGoals;
          const oppGoals = isHome ? m.awayGoals : m.homeGoals;
          let outcomeRes: 'W' | 'D' | 'L' = 'D';
          if (teamGoals > oppGoals) outcomeRes = 'W';
          else if (teamGoals < oppGoals) outcomeRes = 'L';

          if (outcomeRes !== filters.outcome) return false;
        }
      } else {
        // Se non è selezionata una singola squadra ma è impostato un filtro esito
        if (filters.outcome === 'W' && m.homeGoals <= m.awayGoals) return false;
        if (filters.outcome === 'L' && m.awayGoals <= m.homeGoals) return false;
        if (filters.outcome === 'D' && m.homeGoals !== m.awayGoals) return false;
      }

      return true;
    });
  }, [matches, filters]);

  // Flag indicatori filtri attivi
  const hasActiveFilters = Boolean(
    filters.team ||
    filters.venue !== 'all' ||
    filters.outcome !== 'all' ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.searchQuery ||
    filters.competition
  );

  // Classifica calcolata strettamente sul sottoinsieme filtrato
  const filteredStandings = useMemo(() => {
    return computeTeamStats(filteredMatches, analysisConfig);
  }, [filteredMatches, analysisConfig]);

  // Profili predittivi calcolati coerentemente sui dati filtrati e sulla classifica filtrata
  const predictiveProfiles = useMemo(() => {
    const targetMatches = filteredMatches.length > 0 ? filteredMatches : matches;
    const targetStandings = filteredStandings.length > 0 ? filteredStandings : overallStandings;
    return computePredictiveProfiles(targetMatches, targetStandings, analysisConfig);
  }, [filteredMatches, matches, filteredStandings, overallStandings, analysisConfig]);

  // Sintesi provenienza quote e margine del banco
  const oddsSummary = useMemo(() => {
    return computeOddsSourceSummary(filteredMatches.length > 0 ? filteredMatches : matches);
  }, [filteredMatches, matches]);

  const activeTeam = filters.team || selectedTeam;

  const activeTeamStats = useMemo(() => {
    if (!activeTeam) return undefined;
    return filteredStandings.find((s) => s.team.toLowerCase() === activeTeam.toLowerCase()) || 
           overallStandings.find((s) => s.team.toLowerCase() === activeTeam.toLowerCase());
  }, [activeTeam, filteredStandings, overallStandings]);

  const activeTeamProfile = useMemo(() => {
    if (!activeTeam) return undefined;
    return predictiveProfiles.find((p) => p.team.toLowerCase() === activeTeam.toLowerCase());
  }, [activeTeam, predictiveProfiles]);

  const activeTeamMatches = useMemo(() => {
    if (!activeTeam) return [];
    return (filteredMatches.length > 0 ? filteredMatches : matches).filter(
      (m) => m.homeTeam.toLowerCase() === activeTeam.toLowerCase() || m.awayTeam.toLowerCase() === activeTeam.toLowerCase()
    );
  }, [filteredMatches, matches, activeTeam]);

  // Gestione click su squadra per aprire il dettaglio
  const handleOpenTeamModal = (teamName: string) => {
    setSelectedTeam(teamName);
    setIsTeamModalOpen(true);
  };

  const handleSimulateTeam = (teamName: string) => {
    setSelectedTeam(teamName);
    setActiveTab('simulator');
  };

  const handleDataLoaded = (newMatches: Match[], sourceName: string, append = false) => {
    if (append) {
      const seen = new Set<string>();
      const combined: Match[] = [];

      [...matches, ...newMatches].forEach((m) => {
        const key = `${m.date.toLowerCase()}_${m.homeTeam.toLowerCase()}_${m.awayTeam.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(m);
        }
      });

      setMatches(combined);
      setDatasetName(`Archivio Unificato (${combined.length} gare)`);
    } else {
      setMatches(newMatches);
      setDatasetName(sourceName);
    }

    // Reset filtri all'importazione
    setFilters({
      team: '',
      venue: 'all',
      outcome: 'all',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
      competition: '',
    });
    setSelectedTeam(undefined);
  };

  const handleLoadSample = () => {
    const sample = getSampleSerieAMatches();
    setMatches(sample);
    setDatasetName('Serie A TIM 2023/24');
    setFilters({
      team: '',
      venue: 'all',
      outcome: 'all',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
      competition: '',
    });
    setSelectedTeam(undefined);
  };

  const handleLoadMultiLeague = () => {
    const multi = getMultiLeagueSampleMatches();
    setMatches(multi);
    setDatasetName('Archivio Multi-Campionato (Serie A + Premier League · 760 gare)');
    setFilters({
      team: '',
      venue: 'all',
      outcome: 'all',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
      competition: '',
    });
    setSelectedTeam(undefined);
  };

  const handleExportData = () => {
    exportMatchesToCSV(filteredMatches, `calciometrics_${datasetName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onLoadSample={handleLoadSample}
        onLoadMultiLeague={handleLoadMultiLeague}
        onExport={handleExportData}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        matchCount={matches.length}
        teamsCount={allTeams.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Source and Provenance metadata banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 mb-4 pb-2 border-b border-slate-900 font-mono gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span>Sorgente attiva:</span>
            <span className="text-slate-300 font-semibold">{datasetName}</span>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-sans font-medium flex items-center gap-1 ml-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi altri CSV</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={hasActiveFilters ? 'text-emerald-400 font-bold' : ''}>
              {filteredMatches.length} gare filtrate
            </span>
            <span>·</span>
            <span>{allTeams.length} squadre</span>
            <span>·</span>
            <span className="text-slate-400">
              Quote: <strong className="text-slate-200">{oddsSummary.primarySource.split('(')[0].trim()}</strong>
              <span className="text-slate-500 text-[11px] ml-1">({oddsSummary.avgOverround}% ag.)</span>
            </span>
            {allCompetitions.length > 1 && (
              <>
                <span>·</span>
                <span className="text-cyan-400 font-semibold">{allCompetitions.length} campionati</span>
              </>
            )}
          </div>
        </div>

        {/* Global Real-time Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          teams={allTeams}
          competitions={allCompetitions}
          totalMatchesCount={matches.length}
          filteredMatchesCount={filteredMatches.length}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />

        {/* Dynamic Metric Cards (nascosti nella guida metodologica per massimizzare la leggibilità) */}
        {activeTab !== 'guide' && (
          <MetricCards
            matches={filteredMatches}
            selectedTeam={activeTeam}
            teamStats={activeTeamStats}
            venue={filters.venue}
          />
        )}

        {/* View Routing */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            <StandingsTable
              standings={filteredStandings.length > 0 ? filteredStandings : overallStandings}
              selectedTeam={activeTeam}
              onSelectTeam={handleOpenTeamModal}
              isFiltered={hasActiveFilters}
              venue={filters.venue}
              onVenueChange={(v) => setFilters((prev) => ({ ...prev, venue: v }))}
            />

            <PerformanceCharts
              matches={filteredMatches}
              standings={filteredStandings.length > 0 ? filteredStandings : overallStandings}
              selectedTeam={activeTeam}
              onSelectTeam={handleOpenTeamModal}
            />
          </div>
        )}

        {activeTab === 'predictions' && (
          <PredictiveSection
            matches={filteredMatches.length > 0 ? filteredMatches : matches}
            standings={filteredStandings.length > 0 ? filteredStandings : overallStandings}
            selectedTeam={selectedTeam}
            onSelectTeam={handleOpenTeamModal}
            config={analysisConfig}
            onOpenConfig={() => setIsConfigModalOpen(true)}
            isFiltered={hasActiveFilters}
          />
        )}

        {activeTab === 'odds' && (
          <OddsAnalyticsSection
            matches={filteredMatches.length > 0 ? filteredMatches : matches}
            teams={allTeams}
            onSelectTeam={handleOpenTeamModal}
            config={analysisConfig}
            onOpenConfig={() => setIsConfigModalOpen(true)}
            isFiltered={hasActiveFilters}
          />
        )}

        {activeTab === 'simulator' && (
          <MatchSimulatorView
            matches={filteredMatches.length >= 6 ? filteredMatches : matches}
            standings={filteredStandings.length >= 2 ? filteredStandings : overallStandings}
            config={analysisConfig}
            allMatches={matches}
          />
        )}

        {activeTab === 'matches' && (
          <MatchTableView
            matches={filteredMatches}
            onSelectTeam={handleOpenTeamModal}
          />
        )}

        {activeTab === 'guide' && (
          <MetricsGuideView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>CalcioMetrics</span>
            <span> · </span>
            <span>Piattaforma Statistica e Analisi Predittiva</span>
          </div>
          <div>
            <span>Elaborazione Dati CSV Locale & Client-side</span>
          </div>
        </div>
      </footer>

      {/* Team Detail Inspection Modal */}
      <TeamDetailModal
        team={selectedTeam || ''}
        isOpen={isTeamModalOpen && !!selectedTeam}
        onClose={() => setIsTeamModalOpen(false)}
        teamStats={activeTeamStats}
        profile={activeTeamProfile}
        teamMatches={activeTeamMatches}
        onSimulateTeam={handleSimulateTeam}
      />

      {/* CSV File Upload Modal */}
      <CsvUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataLoaded={handleDataLoaded}
        onLoadSample={handleLoadSample}
        onLoadMultiLeague={handleLoadMultiLeague}
        currentMatchCount={matches.length}
      />

      {/* Custom Analysis Configuration Modal */}
      <AnalysisConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={analysisConfig}
        onSaveConfig={setAnalysisConfig}
        onResetDefault={() =>
          setAnalysisConfig({
            recentFormWeight: 0.40,
            homeAdvantageFactor: 1.12,
            metricBasis: 'goals',
            flatStake: 100,
            minEvThreshold: 4.0,
            minSampleBets: 8,
            preferredOddsSource: 'all',
            simulationsCount: 2000,
          })
        }
      />
    </div>
  );
}
