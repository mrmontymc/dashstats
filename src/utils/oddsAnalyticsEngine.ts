import { Match, OddsBracketAnalysis, CornerMarketStats, ProfitableMarketPattern, TeamStats, AnalysisConfig, ValueBetMatch, TeamPredictiveProfile, MatchCustomOdds, HistoricalOddsStats, HistoricalOddsMatchRecord } from '../types/football';

/**
 * Fasce di quota standard per l'analisi dei range
 */
const DEFAULT_1X2_BRACKETS = [
  { label: 'Ultra Favorita (1.10 - 1.40)', min: 1.10, max: 1.40 },
  { label: 'Favorita Solida (1.41 - 1.75)', min: 1.41, max: 1.75 },
  { label: 'Favorita Moderata (1.76 - 2.15)', min: 1.76, max: 2.15 },
  { label: 'In Equilibrio (2.16 - 2.80)', min: 2.16, max: 2.80 },
  { label: 'Outsider Moderata (2.81 - 3.80)', min: 2.81, max: 3.80 },
  { label: 'Sfavorita Marcata (3.81 - 6.00)', min: 3.81, max: 6.00 },
  { label: 'Longshot (> 6.00)', min: 6.01, max: 99.00 },
];

const DEFAULT_GOALS_BRACKETS = [
  { label: 'Quote Basse (1.30 - 1.65)', min: 1.30, max: 1.65 },
  { label: 'Quote Medie (1.66 - 2.05)', min: 1.66, max: 2.05 },
  { label: 'Quote Alte (2.06 - 2.70)', min: 2.06, max: 2.70 },
  { label: 'Quote Molto Alte (> 2.70)', min: 2.71, max: 99.00 },
];

/**
 * Calcola l'analisi per fasce di quota sui mercati 1X2 e Goal/NoGoal/Over-Under
 */
export function computeOddsBrackets(
  matches: Match[],
  market: '1' | 'X' | '2' | 'Over25' | 'Under25' | 'BTTS_Yes' | 'BTTS_No' | 'CornerOver95',
  flatStake = 100
): OddsBracketAnalysis[] {
  const brackets = market === '1' || market === 'X' || market === '2' 
    ? DEFAULT_1X2_BRACKETS 
    : DEFAULT_GOALS_BRACKETS;

  const validMatches = matches.filter((m) => {
    if (market === '1') return !!m.homeOdds;
    if (market === 'X') return !!m.drawOdds;
    if (market === '2') return !!m.awayOdds;
    if (market === 'Over25') return !!m.over25Odds;
    if (market === 'Under25') return !!m.under25Odds;
    if (market === 'BTTS_Yes') return !!m.bttsYesOdds;
    if (market === 'BTTS_No') return !!m.bttsNoOdds;
    if (market === 'CornerOver95') return !!m.cornerOver95Odds;
    return false;
  });

  return brackets.map((b) => {
    let totalBets = 0;
    let wonBets = 0;
    let sumOdds = 0;
    let sumImplied = 0;
    let totalPayout = 0;

    validMatches.forEach((m) => {
      let odd = 0;
      let won = false;

      if (market === '1') {
        odd = m.homeOdds || 0;
        won = m.homeGoals > m.awayGoals;
      } else if (market === 'X') {
        odd = m.drawOdds || 0;
        won = m.homeGoals === m.awayGoals;
      } else if (market === '2') {
        odd = m.awayOdds || 0;
        won = m.awayGoals > m.homeGoals;
      } else if (market === 'Over25') {
        odd = m.over25Odds || 0;
        won = m.homeGoals + m.awayGoals > 2.5;
      } else if (market === 'Under25') {
        odd = m.under25Odds || 0;
        won = m.homeGoals + m.awayGoals <= 2.5;
      } else if (market === 'BTTS_Yes') {
        odd = m.bttsYesOdds || 0;
        won = m.homeGoals > 0 && m.awayGoals > 0;
      } else if (market === 'BTTS_No') {
        odd = m.bttsNoOdds || 0;
        won = m.homeGoals === 0 || m.awayGoals === 0;
      } else if (market === 'CornerOver95') {
        odd = m.cornerOver95Odds || 0;
        won = (m.homeCorners || 0) + (m.awayCorners || 0) > 9.5;
      }

      if (odd >= b.min && odd <= b.max) {
        totalBets++;
        sumOdds += odd;
        sumImplied += (1 / odd) * 100;
        if (won) {
          wonBets++;
          totalPayout += odd * flatStake;
        }
      }
    });

    const totalStaked = totalBets * flatStake;
    const totalProfitFlat = totalBets > 0 ? Number((totalPayout - totalStaked).toFixed(2)) : 0;
    const actualHitRatePct = totalBets > 0 ? Number(((wonBets / totalBets) * 100).toFixed(1)) : 0;
    const impliedProbPct = totalBets > 0 ? Number((sumImplied / totalBets).toFixed(1)) : 0;
    const probDeltaPct = Number((actualHitRatePct - impliedProbPct).toFixed(1));
    const avgOdds = totalBets > 0 ? Number((sumOdds / totalBets).toFixed(2)) : 0;
    const roiPct = totalStaked > 0 ? Number(((totalProfitFlat / totalStaked) * 100).toFixed(1)) : 0;

    return {
      bracketLabel: b.label,
      minOdds: b.min,
      maxOdds: b.max,
      market,
      totalBets,
      wonBets,
      actualHitRatePct,
      impliedProbPct,
      probDeltaPct,
      avgOdds,
      totalProfitFlat,
      roiPct,
      profitable: totalProfitFlat > 0,
    };
  });
}

/**
 * Calcola l'analisi completa del mercato Calci d'Angolo
 */
export function computeCornerMarketStats(matches: Match[], teams: string[]): CornerMarketStats {
  const matchesWithCorners = matches.filter(
    (m) => m.homeCorners !== undefined && m.awayCorners !== undefined
  );

  const totalMatches = matchesWithCorners.length;
  if (totalMatches === 0) {
    return {
      totalMatches: 0,
      totalCorners: 0,
      avgCornersPerMatch: 0,
      avgHomeCorners: 0,
      avgAwayCorners: 0,
      over85Pct: 0,
      over95Pct: 0,
      over105Pct: 0,
      over115Pct: 0,
      homeMostCornersPct: 0,
      awayMostCornersPct: 0,
      equalCornersPct: 0,
      teamCornerRankings: [],
    };
  }

  let totalCorners = 0;
  let totalHomeCorners = 0;
  let totalAwayCorners = 0;
  let over85 = 0;
  let over95 = 0;
  let over105 = 0;
  let over115 = 0;
  let homeMostCorners = 0;
  let awayMostCorners = 0;
  let equalCorners = 0;

  // Statistiche per singola squadra
  const teamCornerMap = new Map<string, {
    matches: number;
    homeMatches: number;
    awayMatches: number;
    cornersTaken: number;
    cornersConceded: number;
    homeCornersTaken: number;
    awayCornersTaken: number;
    over95Count: number;
  }>();

  const getTeamCorners = (team: string) => {
    if (!teamCornerMap.has(team)) {
      teamCornerMap.set(team, {
        matches: 0,
        homeMatches: 0,
        awayMatches: 0,
        cornersTaken: 0,
        cornersConceded: 0,
        homeCornersTaken: 0,
        awayCornersTaken: 0,
        over95Count: 0,
      });
    }
    return teamCornerMap.get(team)!;
  };

  matchesWithCorners.forEach((m) => {
    const hc = m.homeCorners || 0;
    const ac = m.awayCorners || 0;
    const matchCorners = hc + ac;

    totalCorners += matchCorners;
    totalHomeCorners += hc;
    totalAwayCorners += ac;

    if (matchCorners > 8.5) over85++;
    if (matchCorners > 9.5) over95++;
    if (matchCorners > 10.5) over105++;
    if (matchCorners > 11.5) over115++;

    if (hc > ac) homeMostCorners++;
    else if (ac > hc) awayMostCorners++;
    else equalCorners++;

    // Singole squadre
    const hTeam = getTeamCorners(m.homeTeam);
    const aTeam = getTeamCorners(m.awayTeam);

    hTeam.matches++;
    hTeam.homeMatches++;
    hTeam.cornersTaken += hc;
    hTeam.cornersConceded += ac;
    hTeam.homeCornersTaken += hc;
    if (matchCorners > 9.5) hTeam.over95Count++;

    aTeam.matches++;
    aTeam.awayMatches++;
    aTeam.cornersTaken += ac;
    aTeam.cornersConceded += hc;
    aTeam.awayCornersTaken += ac;
    if (matchCorners > 9.5) aTeam.over95Count++;
  });

  const teamCornerRankings = Array.from(teamCornerMap.entries()).map(([team, data]) => {
    const avgTaken = data.matches > 0 ? Number((data.cornersTaken / data.matches).toFixed(2)) : 0;
    const avgConceded = data.matches > 0 ? Number((data.cornersConceded / data.matches).toFixed(2)) : 0;
    const avgTotal = Number((avgTaken + avgConceded).toFixed(2));
    const over95Pct = data.matches > 0 ? Number(((data.over95Count / data.matches) * 100).toFixed(1)) : 0;
    const homeCornersTakenAvg = data.homeMatches > 0 ? Number((data.homeCornersTaken / data.homeMatches).toFixed(2)) : 0;
    const awayCornersTakenAvg = data.awayMatches > 0 ? Number((data.awayCornersTaken / data.awayMatches).toFixed(2)) : 0;

    return {
      team,
      avgCornersTaken: avgTaken,
      avgCornersConceded: avgConceded,
      avgTotalMatchCorners: avgTotal,
      over95Pct,
      homeCornersTakenAvg,
      awayCornersTakenAvg,
    };
  }).sort((a, b) => b.avgTotalMatchCorners - a.avgTotalMatchCorners);

  return {
    totalMatches,
    totalCorners,
    avgCornersPerMatch: Number((totalCorners / totalMatches).toFixed(2)),
    avgHomeCorners: Number((totalHomeCorners / totalMatches).toFixed(2)),
    avgAwayCorners: Number((totalAwayCorners / totalMatches).toFixed(2)),
    over85Pct: Number(((over85 / totalMatches) * 100).toFixed(1)),
    over95Pct: Number(((over95 / totalMatches) * 100).toFixed(1)),
    over105Pct: Number(((over105 / totalMatches) * 100).toFixed(1)),
    over115Pct: Number(((over115 / totalMatches) * 100).toFixed(1)),
    homeMostCornersPct: Number(((homeMostCorners / totalMatches) * 100).toFixed(1)),
    awayMostCornersPct: Number(((awayMostCorners / totalMatches) * 100).toFixed(1)),
    equalCornersPct: Number(((equalCorners / totalMatches) * 100).toFixed(1)),
    teamCornerRankings,
  };
}

/**
 * Analizza e scopre le serie di mercati profittevoli (+EV) nel dataset
 */
export function findProfitableMarketPatterns(
  matches: Match[],
  teams: string[],
  config?: Partial<AnalysisConfig>
): ProfitableMarketPattern[] {
  const patterns: ProfitableMarketPattern[] = [];
  const flatStake = config?.flatStake ?? 100;
  const minBetsThreshold = config?.minSampleBets ?? 8;
  const minRoiThreshold = config?.minEvThreshold ?? 4.0;

  // 1. Analisi 1X2 per fasce di quota generali
  const marketTypes: Array<'1' | 'X' | '2' | 'Over25' | 'Under25' | 'BTTS_Yes' | 'CornerOver95'> = [
    '1', 'X', '2', 'Over25', 'Under25', 'BTTS_Yes', 'CornerOver95'
  ];

  marketTypes.forEach((mkt) => {
    const brackets = computeOddsBrackets(matches, mkt, flatStake);
    brackets.forEach((b) => {
      // Considera solo campioni con almeno minBetsThreshold partite e ROI positivo
      if (b.totalBets >= minBetsThreshold && b.roiPct >= minRoiThreshold) {
        let cat: ProfitableMarketPattern['category'] = '1X2';
        let desc = '';
        if (mkt === '1') {
          cat = '1X2';
          desc = `Vittoria Casa quando la quota iniziale è in fascia ${b.bracketLabel}. Il mercato ha sottostimato la frequenza di ${b.probDeltaPct}%.`;
        } else if (mkt === 'X') {
          cat = '1X2';
          desc = `Pareggio (X) in fascia ${b.bracketLabel}. Alta incidenza statistica rispetto alla lavagna del bookmaker.`;
        } else if (mkt === '2') {
          cat = '1X2';
          desc = `Vittoria Trasferta (2) in fascia ${b.bracketLabel}. Valore positivo e over-performance esterna.`;
        } else if (mkt === 'Over25') {
          cat = 'Gol / Under-Over';
          desc = `Over 2.5 gol in fascia di quota ${b.bracketLabel}. Percentuale di successo del ${b.actualHitRatePct}%.`;
        } else if (mkt === 'Under25') {
          cat = 'Gol / Under-Over';
          desc = `Under 2.5 gol in fascia di quota ${b.bracketLabel}. Ottima tenuta delle difese in questo intervallo.`;
        } else if (mkt === 'BTTS_Yes') {
          cat = 'Goal-NoGoal';
          desc = `Entrambe le squadre a segno (Gol/GG) in fascia ${b.bracketLabel}.`;
        } else if (mkt === 'CornerOver95') {
          cat = 'Calci d\'Angolo';
          desc = `Over 9.5 Calci d'Angolo in fascia di quota ${b.bracketLabel}.`;
        }

        patterns.push({
          id: `pattern_bracket_${mkt}_${b.minOdds}_${b.maxOdds}`,
          title: `${mkt === '1' ? 'Esito 1' : mkt === 'X' ? 'Esito X' : mkt === '2' ? 'Esito 2' : mkt} · Fascia ${b.bracketLabel}`,
          category: cat,
          description: desc,
          marketType: mkt,
          filterCriteria: `Quota tra ${b.minOdds.toFixed(2)} e ${b.maxOdds.toFixed(2)}`,
          totalBets: b.totalBets,
          wonBets: b.wonBets,
          winRatePct: b.actualHitRatePct,
          avgOdds: b.avgOdds,
          totalProfitFlat: b.totalProfitFlat,
          roiPct: b.roiPct,
          confidenceScore: b.totalBets >= 30 ? 'Molto Alto' : b.totalBets >= 18 ? 'Alto' : 'Moderato',
        });
      }
    });
  });

  // 2. Analisi Squadra Specifica (Trend di squadra ad alto rendimento)
  teams.forEach((team) => {
    const teamMatches = matches.filter((m) => m.homeTeam === team || m.awayTeam === team);
    if (teamMatches.length < Math.max(6, minBetsThreshold)) return;

    // A. Vittoria Casa per team dominante
    const homeMatches = matches.filter((m) => m.homeTeam === team);
    if (homeMatches.length >= Math.max(5, Math.floor(minBetsThreshold * 0.7))) {
      const homeWins = homeMatches.filter((m) => m.homeGoals > m.awayGoals);
      const homeWinOdds = homeMatches.reduce((acc, m) => acc + (m.homeOdds || 1.8), 0) / homeMatches.length;
      const profitHome = homeWins.reduce((acc, m) => acc + (m.homeOdds || 1.8) * flatStake, 0) - homeMatches.length * flatStake;
      const roiHome = Number(((profitHome / (homeMatches.length * flatStake)) * 100).toFixed(1));

      if (roiHome >= minRoiThreshold && homeWins.length / homeMatches.length >= 0.55) {
        patterns.push({
          id: `team_home_win_${team}`,
          title: `${team} · Vittoria Casalinga (1)`,
          category: 'Squadra Specifica',
          description: `Rendimento costante tra le mura amiche: ${homeWins.length} vittorie su ${homeMatches.length} gare interne.`,
          marketType: '1 (Casa)',
          teamScope: team,
          filterCriteria: `Partite casalinghe di ${team}`,
          totalBets: homeMatches.length,
          wonBets: homeWins.length,
          winRatePct: Number(((homeWins.length / homeMatches.length) * 100).toFixed(1)),
          avgOdds: Number(homeWinOdds.toFixed(2)),
          totalProfitFlat: Number(profitHome.toFixed(2)),
          roiPct: roiHome,
          confidenceScore: homeMatches.length >= 14 ? 'Molto Alto' : 'Alto',
        });
      }
    }

    // B. Over 2.5 per squadre con attacchi prolifici o difese aperte
    const over25Matches = teamMatches.filter((m) => m.homeGoals + m.awayGoals > 2.5);
    const avgOverOdds = teamMatches.reduce((acc, m) => acc + (m.over25Odds || 1.85), 0) / teamMatches.length;
    const profitOver = over25Matches.reduce((acc, m) => acc + (m.over25Odds || 1.85) * flatStake, 0) - teamMatches.length * flatStake;
    const roiOver = Number(((profitOver / (teamMatches.length * flatStake)) * 100).toFixed(1));

    if (roiOver >= minRoiThreshold && over25Matches.length / teamMatches.length >= 0.55) {
      patterns.push({
        id: `team_over25_${team}`,
        title: `${team} · Over 2.5 Gol`,
        category: 'Gol / Under-Over',
        description: `Partite ad alta intensità e molti gol: verificatosi in ${over25Matches.length} gare su ${teamMatches.length}.`,
        marketType: 'Over 2.5',
        teamScope: team,
        filterCriteria: `Gare di ${team} (Casa + Trasferta)`,
        totalBets: teamMatches.length,
        wonBets: over25Matches.length,
        winRatePct: Number(((over25Matches.length / teamMatches.length) * 100).toFixed(1)),
        avgOdds: Number(avgOverOdds.toFixed(2)),
        totalProfitFlat: Number(profitOver.toFixed(2)),
        roiPct: roiOver,
        confidenceScore: teamMatches.length >= 18 ? 'Molto Alto' : 'Alto',
      });
    }

    // C. Under 2.5 per squadre con difese solide e baricentro basso
    const under25Matches = teamMatches.filter((m) => m.homeGoals + m.awayGoals <= 2.5);
    const avgUnderOdds = teamMatches.reduce((acc, m) => acc + (m.under25Odds || 1.85), 0) / teamMatches.length;
    const profitUnder = under25Matches.reduce((acc, m) => acc + (m.under25Odds || 1.85) * flatStake, 0) - teamMatches.length * flatStake;
    const roiUnder = Number(((profitUnder / (teamMatches.length * flatStake)) * 100).toFixed(1));

    if (roiUnder >= minRoiThreshold && under25Matches.length / teamMatches.length >= 0.55) {
      patterns.push({
        id: `team_under25_${team}`,
        title: `${team} · Under 2.5 Gol`,
        category: 'Gol / Under-Over',
        description: `Partite con difese ermetiche o pochi spazi: verificatosi in ${under25Matches.length} gare su ${teamMatches.length}.`,
        marketType: 'Under 2.5',
        teamScope: team,
        filterCriteria: `Gare di ${team}`,
        totalBets: teamMatches.length,
        wonBets: under25Matches.length,
        winRatePct: Number(((under25Matches.length / teamMatches.length) * 100).toFixed(1)),
        avgOdds: Number(avgUnderOdds.toFixed(2)),
        totalProfitFlat: Number(profitUnder.toFixed(2)),
        roiPct: roiUnder,
        confidenceScore: teamMatches.length >= 18 ? 'Molto Alto' : 'Alto',
      });
    }

    // D. Calci d'angolo Over 9.5 per squadra
    const cornerMatches = teamMatches.filter((m) => m.homeCorners !== undefined && m.awayCorners !== undefined);
    if (cornerMatches.length >= Math.max(6, minBetsThreshold)) {
      const over95Corners = cornerMatches.filter((m) => (m.homeCorners || 0) + (m.awayCorners || 0) > 9.5);
      const avgCornerOdds = cornerMatches.reduce((acc, m) => acc + (m.cornerOver95Odds || 1.90), 0) / cornerMatches.length;
      const profitCorner = over95Corners.reduce((acc, m) => acc + (m.cornerOver95Odds || 1.90) * flatStake, 0) - cornerMatches.length * flatStake;
      const roiCorner = Number(((profitCorner / (cornerMatches.length * flatStake)) * 100).toFixed(1));

      if (roiCorner >= minRoiThreshold && over95Corners.length / cornerMatches.length >= 0.55) {
        patterns.push({
          id: `team_corner_over95_${team}`,
          title: `${team} · Over 9.5 Calci d'Angolo`,
          category: 'Calci d\'Angolo',
          description: `Spinta laterale marcata e volume di angoli: ${over95Corners.length} volte oltre i 9.5 corner su ${cornerMatches.length} partite.`,
          marketType: 'Over 9.5 Corner',
          teamScope: team,
          filterCriteria: `Tutte le partite di ${team}`,
          totalBets: cornerMatches.length,
          wonBets: over95Corners.length,
          winRatePct: Number(((over95Corners.length / cornerMatches.length) * 100).toFixed(1)),
          avgOdds: Number(avgCornerOdds.toFixed(2)),
          totalProfitFlat: Number(profitCorner.toFixed(2)),
          roiPct: roiCorner,
          confidenceScore: cornerMatches.length >= 18 ? 'Molto Alto' : 'Alto',
        });
      }
    }
  });

  return patterns.sort((a, b) => b.roiPct - a.roiPct);
}

export interface OddsSourceSummary {
  primarySource: string;
  avgOverround: number;
  totalWithOdds: number;
  sourceBreakdown: Array<{
    source: string;
    count: number;
    pct: number;
    avgOverround: number;
  }>;
}

/**
 * Calcola un riepilogo dettagliato sulla provenienza delle quote e sull'aggio (overround) medio
 */
export function computeOddsSourceSummary(matches: Match[]): OddsSourceSummary {
  const matchesWithOdds = matches.filter((m) => !!m.homeOdds);
  if (matchesWithOdds.length === 0) {
    return {
      primarySource: 'Nessuna quota disponibile',
      avgOverround: 0,
      totalWithOdds: 0,
      sourceBreakdown: [],
    };
  }

  const sourceMap = new Map<string, { count: number; sumOverround: number }>();

  matchesWithOdds.forEach((m) => {
    const src = m.oddsSource || 'Feed Non Specificato';
    const overround = m.overround ?? (m.homeOdds && m.drawOdds && m.awayOdds 
      ? Number((((1 / m.homeOdds) + (1 / m.drawOdds) + (1 / m.awayOdds) - 1) * 100).toFixed(1))
      : 5.2);

    const cur = sourceMap.get(src) || { count: 0, sumOverround: 0 };
    cur.count++;
    cur.sumOverround += overround;
    sourceMap.set(src, cur);
  });

  const sourceBreakdown = Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    count: data.count,
    pct: Number(((data.count / matchesWithOdds.length) * 100).toFixed(1)),
    avgOverround: Number((data.sumOverround / data.count).toFixed(2)),
  })).sort((a, b) => b.count - a.count);

  const primarySource = sourceBreakdown[0]?.source || 'Bet365 (Feed Ufficiale)';
  const totalOverroundSum = sourceBreakdown.reduce((acc, s) => acc + s.avgOverround * s.count, 0);
  const avgOverround = Number((totalOverroundSum / matchesWithOdds.length).toFixed(2));

  return {
    primarySource,
    avgOverround,
    totalWithOdds: matchesWithOdds.length,
    sourceBreakdown,
  };
}

/**
 * Scansione automatica Value Bets (+EV) calcolate confrontando probabilità equa del modello e quota bookmaker
 */
export function findValueBets(
  matches: Match[],
  profilesMap: Map<string, TeamPredictiveProfile>,
  config?: Partial<AnalysisConfig>
): ValueBetMatch[] {
  const valueBets: ValueBetMatch[] = [];
  const minEdge = 2.5; // Almeno +2.5% di vantaggio statistico
  const flatStake = config?.flatStake ?? 100;

  const validMatches = matches.filter((m) => !!m.homeOdds && !!m.awayOdds);

  validMatches.forEach((m) => {
    const hp = profilesMap.get(m.homeTeam);
    const ap = profilesMap.get(m.awayTeam);
    if (!hp || !ap) return;

    // Calcolo probabilità stimata modello (ponderata Poisson + momentum)
    const homeAtt = hp.attackRating;
    const homeDef = hp.defenseRating;
    const awayAtt = ap.attackRating;
    const awayDef = ap.defenseRating;

    const diff = (homeAtt * awayDef * 1.15) - (awayAtt * homeDef);
    const pHomeEst = Math.min(0.85, Math.max(0.12, 0.44 + diff * 0.22));
    const pAwayEst = Math.min(0.75, Math.max(0.08, 0.28 - diff * 0.18));
    const pDrawEst = Math.max(0.15, 1 - pHomeEst - pAwayEst);

    // Mercato 1
    if (m.homeOdds) {
      const imp1 = (1 / m.homeOdds) * 100;
      const mod1 = pHomeEst * 100;
      const edge = Number((mod1 - imp1).toFixed(1));
      const ev = Number(((pHomeEst * m.homeOdds - 1) * 100).toFixed(1));
      if (edge >= minEdge && ev > 0) {
        const won = m.homeGoals > m.awayGoals;
        const b = m.homeOdds - 1;
        const kelly = b > 0 ? Math.max(0, Number(((((b * pHomeEst - (1 - pHomeEst)) / b) * 100) / 4).toFixed(1))) : 0;
        valueBets.push({
          id: `vb_${m.id}_1`,
          matchId: m.id,
          date: m.date,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          market: '1',
          marketLabel: `1 (${m.homeTeam})`,
          bookmakerOdd: m.homeOdds,
          impliedProbPct: Number(imp1.toFixed(1)),
          modelProbPct: Number(mod1.toFixed(1)),
          edgePct: edge,
          evPct: ev,
          kellyStakePct: kelly,
          actualWon: won,
          oddsSource: m.oddsSource || 'Bookmaker',
          profitFlat: won ? Number(((m.homeOdds - 1) * flatStake).toFixed(2)) : -flatStake,
        });
      }
    }

    // Mercato 2
    if (m.awayOdds) {
      const imp2 = (1 / m.awayOdds) * 100;
      const mod2 = pAwayEst * 100;
      const edge = Number((mod2 - imp2).toFixed(1));
      const ev = Number(((pAwayEst * m.awayOdds - 1) * 100).toFixed(1));
      if (edge >= minEdge && ev > 0) {
        const won = m.awayGoals > m.homeGoals;
        const b = m.awayOdds - 1;
        const kelly = b > 0 ? Math.max(0, Number(((((b * pAwayEst - (1 - pAwayEst)) / b) * 100) / 4).toFixed(1))) : 0;
        valueBets.push({
          id: `vb_${m.id}_2`,
          matchId: m.id,
          date: m.date,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          market: '2',
          marketLabel: `2 (${m.awayTeam})`,
          bookmakerOdd: m.awayOdds,
          impliedProbPct: Number(imp2.toFixed(1)),
          modelProbPct: Number(mod2.toFixed(1)),
          edgePct: edge,
          evPct: ev,
          kellyStakePct: kelly,
          actualWon: won,
          oddsSource: m.oddsSource || 'Bookmaker',
          profitFlat: won ? Number(((m.awayOdds - 1) * flatStake).toFixed(2)) : -flatStake,
        });
      }
    }

    // Over 2.5
    if (m.over25Odds) {
      const totalExpGoals = (homeAtt * awayDef * 1.3) + (awayAtt * homeDef * 1.1);
      const modOver = totalExpGoals > 2.7 ? 58 : totalExpGoals > 2.4 ? 50 : 42;
      const impOver = (1 / m.over25Odds) * 100;
      const edge = Number((modOver - impOver).toFixed(1));
      const ev = Number((((modOver / 100) * m.over25Odds - 1) * 100).toFixed(1));
      if (edge >= minEdge && ev > 0) {
        const won = m.homeGoals + m.awayGoals > 2.5;
        valueBets.push({
          id: `vb_${m.id}_ov`,
          matchId: m.id,
          date: m.date,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          market: 'Over25',
          marketLabel: 'Over 2.5 Gol',
          bookmakerOdd: m.over25Odds,
          impliedProbPct: Number(impOver.toFixed(1)),
          modelProbPct: modOver,
          edgePct: edge,
          evPct: ev,
          kellyStakePct: 2.5,
          actualWon: won,
          oddsSource: m.oddsSource || 'Bookmaker',
          profitFlat: won ? Number(((m.over25Odds - 1) * flatStake).toFixed(2)) : -flatStake,
        });
      }
    }
  });

  return valueBets.sort((a, b) => b.evPct - a.evPct);
}

/**
 * Verifica lo storico dei risultati nel dataset in base alle quote offerte inserite dall'utente
 */
export function analyzeHistoricalMatchesWithOdds(
  matches: Match[],
  customOdds: MatchCustomOdds,
  toleranceMode: 'tight' | 'standard' | 'wide' | 'bracket' = 'standard',
  flatStake = 100
): HistoricalOddsStats {
  const hOdd = customOdds.homeOdds || 0;
  const dOdd = customOdds.drawOdds || 0;
  const aOdd = customOdds.awayOdds || 0;
  const o25Odd = customOdds.over25Odds || 0;
  const u25Odd = customOdds.under25Odds || 0;
  const bttsYesOdd = customOdds.bttsYesOdds || 0;

  // Determina tolleranza numerica in base alla modalità
  let hTol = 0.20;
  let dTol = 0.25;
  let aTol = 0.35;
  let tolLabel = 'Standard (±0.20)';

  if (toleranceMode === 'tight') {
    hTol = 0.10;
    dTol = 0.15;
    aTol = 0.20;
    tolLabel = 'Stretta (±0.10)';
  } else if (toleranceMode === 'wide') {
    hTol = 0.35;
    dTol = 0.45;
    aTol = 0.60;
    tolLabel = 'Ampia (±0.35)';
  } else if (toleranceMode === 'bracket') {
    // Fascia di quota automatica
    if (hOdd <= 1.45) { hTol = 0.15; dTol = 0.40; aTol = 1.50; }
    else if (hOdd <= 1.85) { hTol = 0.20; dTol = 0.30; aTol = 0.80; }
    else if (hOdd <= 2.40) { hTol = 0.25; dTol = 0.25; aTol = 0.50; }
    else if (hOdd <= 3.20) { hTol = 0.35; dTol = 0.30; aTol = 0.40; }
    else { hTol = 0.80; dTol = 0.40; aTol = 0.25; }
    tolLabel = 'Fascia di Mercato';
  }

  // Filtra le partite con quote analoghe
  const filtered = matches.filter((m) => {
    if (!m.homeOdds) return false;

    // Se inserita quota 1
    if (hOdd > 1.0) {
      if (Math.abs(m.homeOdds - hOdd) > hTol) return false;
    }

    // Se inserita quota X
    if (dOdd > 1.0 && m.drawOdds) {
      if (Math.abs(m.drawOdds - dOdd) > dTol) return false;
    }

    // Se inserita quota 2
    if (aOdd > 1.0 && m.awayOdds) {
      if (Math.abs(m.awayOdds - aOdd) > aTol) return false;
    }

    // Se inserita quota Over 2.5
    if (o25Odd > 1.0 && m.over25Odds) {
      if (Math.abs(m.over25Odds - o25Odd) > 0.25) return false;
    }

    // Se inserita quota Goal
    if (bttsYesOdd > 1.0 && m.bttsYesOdds) {
      if (Math.abs(m.bttsYesOdds - bttsYesOdd) > 0.25) return false;
    }

    return true;
  });

  // Se i filtri combinati restituiscono meno di 4 partite, allarga al solo segno principale
  const sampleMatches = filtered.length >= 4 
    ? filtered 
    : matches.filter((m) => m.homeOdds && hOdd > 1.0 && Math.abs(m.homeOdds - hOdd) <= (hTol * 1.5));

  const totalMatches = sampleMatches.length;

  if (totalMatches === 0) {
    return {
      totalMatches: 0,
      tolerance: hTol,
      toleranceLabel: tolLabel,
      homeWinCount: 0,
      homeWinPct: 0,
      drawCount: 0,
      drawPct: 0,
      awayWinCount: 0,
      awayWinPct: 0,
      over25Count: 0,
      over25Pct: 0,
      under25Count: 0,
      under25Pct: 0,
      bttsYesCount: 0,
      bttsYesPct: 0,
      bttsNoCount: 0,
      bttsNoPct: 0,
      avgTotalGoals: 0,
      avgHomeGoals: 0,
      avgAwayGoals: 0,
      roiHomePct: 0,
      profitHomeFlat: 0,
      roiDrawPct: 0,
      profitDrawFlat: 0,
      roiAwayPct: 0,
      profitAwayFlat: 0,
      bestOutcome: {
        market: 'Nessun dato',
        roiPct: 0,
        hitRatePct: 0,
        profitFlat: 0,
      },
      matchedMatches: [],
    };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let over25 = 0;
  let under25 = 0;
  let bttsYes = 0;
  let bttsNo = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;

  let payoutHome = 0;
  let payoutDraw = 0;
  let payoutAway = 0;
  let payoutOver25 = 0;
  let payoutUnder25 = 0;
  let payoutBttsYes = 0;

  let overMatchesCount = 0;
  let bttsMatchesCount = 0;

  const matchedRecords: HistoricalOddsMatchRecord[] = [];

  sampleMatches.forEach((m) => {
    const isHW = m.homeGoals > m.awayGoals;
    const isD = m.homeGoals === m.awayGoals;
    const isAW = m.awayGoals > m.homeGoals;
    const isOver = m.homeGoals + m.awayGoals > 2.5;
    const isBtts = m.homeGoals > 0 && m.awayGoals > 0;

    if (isHW) {
      homeWins++;
      payoutHome += (m.homeOdds || hOdd) * flatStake;
    }
    if (isD) {
      draws++;
      payoutDraw += (m.drawOdds || dOdd) * flatStake;
    }
    if (isAW) {
      awayWins++;
      payoutAway += (m.awayOdds || aOdd) * flatStake;
    }

    if (isOver) {
      over25++;
    } else {
      under25++;
    }

    if (m.over25Odds || o25Odd > 1.0) {
      overMatchesCount++;
      if (isOver) payoutOver25 += (m.over25Odds || o25Odd) * flatStake;
      if (!isOver) payoutUnder25 += (m.under25Odds || u25Odd || 1.85) * flatStake;
    }

    if (isBtts) {
      bttsYes++;
    } else {
      bttsNo++;
    }

    if (m.bttsYesOdds || bttsYesOdd > 1.0) {
      bttsMatchesCount++;
      if (isBtts) payoutBttsYes += (m.bttsYesOdds || bttsYesOdd) * flatStake;
    }

    totalHomeGoals += m.homeGoals;
    totalAwayGoals += m.awayGoals;

    matchedRecords.push({
      id: m.id,
      date: m.date,
      matchday: m.matchday,
      competition: m.competition,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      result: m.result,
      halfTimeHomeGoals: m.halfTimeHomeGoals,
      halfTimeAwayGoals: m.halfTimeAwayGoals,
      homeOdds: m.homeOdds,
      drawOdds: m.drawOdds,
      awayOdds: m.awayOdds,
      over25Odds: m.over25Odds,
      under25Odds: m.under25Odds,
      bttsYesOdds: m.bttsYesOdds,
      bttsNoOdds: m.bttsNoOdds,
      homeXg: m.homeXg,
      awayXg: m.awayXg,
      oddsSource: m.oddsSource,
    });
  });

  const totalStaked = totalMatches * flatStake;
  const profitHome = Number((payoutHome - totalStaked).toFixed(2));
  const roiHome = Number(((profitHome / totalStaked) * 100).toFixed(1));

  const profitDraw = Number((payoutDraw - totalStaked).toFixed(2));
  const roiDraw = Number(((profitDraw / totalStaked) * 100).toFixed(1));

  const profitAway = Number((payoutAway - totalStaked).toFixed(2));
  const roiAway = Number(((profitAway / totalStaked) * 100).toFixed(1));

  const stakedOver = (overMatchesCount || totalMatches) * flatStake;
  const profitOver = Number((payoutOver25 - stakedOver).toFixed(2));
  const roiOver = Number(((profitOver / stakedOver) * 100).toFixed(1));

  const profitUnder = Number((payoutUnder25 - stakedOver).toFixed(2));
  const roiUnder = Number(((profitUnder / stakedOver) * 100).toFixed(1));

  const stakedBtts = (bttsMatchesCount || totalMatches) * flatStake;
  const profitBtts = Number((payoutBttsYes - stakedBtts).toFixed(2));
  const roiBtts = Number(((profitBtts / stakedBtts) * 100).toFixed(1));

  // Trova il miglior esito storico per rendimento
  const outcomes = [
    { market: 'Segno 1 (Casa)', roiPct: roiHome, hitRatePct: Number(((homeWins / totalMatches) * 100).toFixed(1)), profitFlat: profitHome },
    { market: 'Segno X (Pareggio)', roiPct: roiDraw, hitRatePct: Number(((draws / totalMatches) * 100).toFixed(1)), profitFlat: profitDraw },
    { market: 'Segno 2 (Ospite)', roiPct: roiAway, hitRatePct: Number(((awayWins / totalMatches) * 100).toFixed(1)), profitFlat: profitAway },
    { market: 'Over 2.5 Gol', roiPct: roiOver, hitRatePct: Number(((over25 / totalMatches) * 100).toFixed(1)), profitFlat: profitOver },
    { market: 'Under 2.5 Gol', roiPct: roiUnder, hitRatePct: Number(((under25 / totalMatches) * 100).toFixed(1)), profitFlat: profitUnder },
    { market: 'Goal (BTTS Sì)', roiPct: roiBtts, hitRatePct: Number(((bttsYes / totalMatches) * 100).toFixed(1)), profitFlat: profitBtts },
  ];

  outcomes.sort((a, b) => b.roiPct - a.roiPct);
  const bestOutcome = outcomes[0];

  // Ordina partite storiche dalla più recente
  matchedRecords.sort((a, b) => b.date.localeCompare(a.date));

  return {
    totalMatches,
    tolerance: hTol,
    toleranceLabel: tolLabel,
    homeWinCount: homeWins,
    homeWinPct: Number(((homeWins / totalMatches) * 100).toFixed(1)),
    drawCount: draws,
    drawPct: Number(((draws / totalMatches) * 100).toFixed(1)),
    awayWinCount: awayWins,
    awayWinPct: Number(((awayWins / totalMatches) * 100).toFixed(1)),
    over25Count: over25,
    over25Pct: Number(((over25 / totalMatches) * 100).toFixed(1)),
    under25Count: under25,
    under25Pct: Number(((under25 / totalMatches) * 100).toFixed(1)),
    bttsYesCount: bttsYes,
    bttsYesPct: Number(((bttsYes / totalMatches) * 100).toFixed(1)),
    bttsNoCount: bttsNo,
    bttsNoPct: Number(((bttsNo / totalMatches) * 100).toFixed(1)),
    avgTotalGoals: Number(((totalHomeGoals + totalAwayGoals) / totalMatches).toFixed(2)),
    avgHomeGoals: Number((totalHomeGoals / totalMatches).toFixed(2)),
    avgAwayGoals: Number((totalAwayGoals / totalMatches).toFixed(2)),
    roiHomePct: roiHome,
    profitHomeFlat: profitHome,
    roiDrawPct: roiDraw,
    profitDrawFlat: profitDraw,
    roiAwayPct: roiAway,
    profitAwayFlat: profitAway,
    roiOver25Pct: roiOver,
    profitOver25Flat: profitOver,
    roiUnder25Pct: roiUnder,
    profitUnder25Flat: profitUnder,
    roiBttsYesPct: roiBtts,
    profitBttsYesFlat: profitBtts,
    bestOutcome,
    matchedMatches: matchedRecords,
  };
}
