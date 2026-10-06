import { Match, MatchResult, TeamStats, TeamPredictiveProfile, TeamArchetype, MatchSimulationResult, AnalysisConfig, BettingAdviceTip } from '../types/football';

/**
 * Calcola la classifica e le statistiche aggregate per ogni squadra
 */
export function computeTeamStats(matches: Match[], config?: Partial<AnalysisConfig>): TeamStats[] {
  const teamMap = new Map<string, {
    played: number; won: number; drawn: number; lost: number;
    gf: number; ga: number; points: number;
    homePlayed: number; homeWon: number; homeDrawn: number; homeLost: number; homeGf: number; homeGa: number; homePoints: number;
    awayPlayed: number; awayWon: number; awayDrawn: number; awayLost: number; awayGf: number; awayGa: number; awayPoints: number;
    shotsTotal: number; shotsTargetTotal: number; shotsConcededTotal: number; shotsTargetConcededTotal: number;
    cornersTaken: number; cornersConceded: number;
    foulsTotal: number; yellowsTotal: number; redsTotal: number;
    cleanSheets: number; failedToScore: number;
    totalXg: number; totalXgAgainst: number;
    possessionSum: number; possessionCount: number;
    firstHalfGf: number; secondHalfGf: number;
    firstHalfGa: number; secondHalfGa: number;
    comebacks: number;
    eloRating: number;
    matchHistory: Array<{ date: string; result: MatchResult; xPts: number }>;
  }>();

  const getOrCreate = (team: string) => {
    if (!teamMap.has(team)) {
      teamMap.set(team, {
        played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0,
        homePlayed: 0, homeWon: 0, homeDrawn: 0, homeLost: 0, homeGf: 0, homeGa: 0, homePoints: 0,
        awayPlayed: 0, awayWon: 0, awayDrawn: 0, awayLost: 0, awayGf: 0, awayGa: 0, awayPoints: 0,
        shotsTotal: 0, shotsTargetTotal: 0, shotsConcededTotal: 0, shotsTargetConcededTotal: 0,
        cornersTaken: 0, cornersConceded: 0,
        foulsTotal: 0, yellowsTotal: 0, redsTotal: 0,
        cleanSheets: 0, failedToScore: 0,
        totalXg: 0, totalXgAgainst: 0,
        possessionSum: 0, possessionCount: 0,
        firstHalfGf: 0, secondHalfGf: 0,
        firstHalfGa: 0, secondHalfGa: 0,
        comebacks: 0,
        eloRating: 1500,
        matchHistory: []
      });
    }
    return teamMap.get(team)!;
  };

  // Ordina per data per avere la forma e l'evoluzione Elo corrette
  const sortedMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date));

  sortedMatches.forEach(m => {
    const h = getOrCreate(m.homeTeam);
    const a = getOrCreate(m.awayTeam);

    h.played++;
    h.homePlayed++;
    h.gf += m.homeGoals;
    h.ga += m.awayGoals;
    h.homeGf += m.homeGoals;
    h.homeGa += m.awayGoals;

    a.played++;
    a.awayPlayed++;
    a.gf += m.awayGoals;
    a.ga += m.homeGoals;
    a.awayGf += m.awayGoals;
    a.awayGa += m.homeGoals;

    // Tempi parziali
    const htHome = m.halfTimeHomeGoals ?? (m.homeGoals > 0 ? Math.floor(m.homeGoals * 0.45) : 0);
    const htAway = m.halfTimeAwayGoals ?? (m.awayGoals > 0 ? Math.floor(m.awayGoals * 0.42) : 0);
    const secondHome = m.homeGoals - htHome;
    const secondAway = m.awayGoals - htAway;

    h.firstHalfGf += htHome;
    h.secondHalfGf += secondHome;
    h.firstHalfGa += htAway;
    h.secondHalfGa += secondAway;

    a.firstHalfGf += htAway;
    a.secondHalfGf += secondAway;
    a.firstHalfGa += htHome;
    a.secondHalfGa += secondHome;

    // Rimonte da svantaggio al 1° tempo
    if (htHome < htAway && m.homeGoals >= m.awayGoals) {
      h.comebacks++;
    }
    if (htAway < htHome && m.awayGoals >= m.homeGoals) {
      a.comebacks++;
    }

    // Calci d'angolo
    if (m.homeCorners !== undefined) {
      h.cornersTaken += m.homeCorners;
      a.cornersConceded += m.homeCorners;
    }
    if (m.awayCorners !== undefined) {
      a.cornersTaken += m.awayCorners;
      h.cornersConceded += m.awayCorners;
    }

    // Aggiornamento dinamico Elo Rating
    const hElo = h.eloRating;
    const aElo = a.eloRating;
    const homeAdvantagePts = Math.round(65 * ((config?.homeAdvantageFactor ?? 1.12) / 1.12));
    const expectedHome = 1 / (1 + Math.pow(10, (aElo - (hElo + homeAdvantagePts)) / 400));
    const actualHome = m.homeGoals > m.awayGoals ? 1.0 : m.homeGoals === m.awayGoals ? 0.5 : 0.0;
    const goalDiff = Math.abs(m.homeGoals - m.awayGoals);
    const gdMultiplier = goalDiff <= 1 ? 1.0 : goalDiff === 2 ? 1.5 : (1.75 + (goalDiff - 3) / 8);
    const kFactor = 24;
    const eloDelta = kFactor * gdMultiplier * (actualHome - expectedHome);
    h.eloRating = Math.round(hElo + eloDelta);
    a.eloRating = Math.round(aElo - eloDelta);

    // Statistiche tiri e xG
    if (m.homeShots !== undefined) h.shotsTotal += m.homeShots;
    if (m.homeShotsTarget !== undefined) h.shotsTargetTotal += m.homeShotsTarget;
    if (m.awayShots !== undefined) {
      h.shotsConcededTotal += m.awayShots;
      a.shotsTotal += m.awayShots;
    }
    if (m.awayShotsTarget !== undefined) {
      h.shotsTargetConcededTotal += m.awayShotsTarget;
      a.shotsTargetTotal += m.awayShotsTarget;
    }
    if (m.homeShots !== undefined) a.shotsConcededTotal += m.homeShots;
    if (m.homeShotsTarget !== undefined) a.shotsTargetConcededTotal += m.homeShotsTarget;

    // xG
    const hXg = m.homeXg ?? 1.2;
    const aXg = m.awayXg ?? 1.0;
    h.totalXg += hXg;
    h.totalXgAgainst += aXg;
    a.totalXg += aXg;
    a.totalXgAgainst += hXg;

    // Possesso
    if (m.homePossession !== undefined) {
      h.possessionSum += m.homePossession;
      h.possessionCount++;
    }
    if (m.awayPossession !== undefined) {
      a.possessionSum += m.awayPossession;
      a.possessionCount++;
    }

    // Falli e cartellini
    if (m.homeFouls) h.foulsTotal += m.homeFouls;
    if (m.awayFouls) a.foulsTotal += m.awayFouls;
    if (m.homeYellows) h.yellowsTotal += m.homeYellows;
    if (m.awayYellows) a.yellowsTotal += m.awayYellows;
    if (m.homeReds) h.redsTotal += m.homeReds;
    if (m.awayReds) a.redsTotal += m.awayReds;

    // Clean sheet e reti inviolate
    if (m.awayGoals === 0) h.cleanSheets++;
    if (m.homeGoals === 0) {
      h.failedToScore++;
      a.cleanSheets++;
    }
    if (m.awayGoals === 0) {
      a.failedToScore++;
    }

    // Risultato e Punti
    let hRes: MatchResult = 'D';
    let aRes: MatchResult = 'D';

    if (m.homeGoals > m.awayGoals) {
      h.won++;
      h.homeWon++;
      h.points += 3;
      h.homePoints += 3;
      a.lost++;
      a.awayLost++;
      hRes = 'H';
      aRes = 'A';
    } else if (m.awayGoals > m.homeGoals) {
      a.won++;
      a.awayWon++;
      a.points += 3;
      a.awayPoints += 3;
      h.lost++;
      h.homeLost++;
      hRes = 'A';
      aRes = 'H';
    } else {
      h.drawn++;
      h.homeDrawn++;
      h.points += 1;
      h.homePoints += 1;
      a.drawn++;
      a.awayDrawn++;
      a.points += 1;
      a.awayPoints += 1;
      hRes = 'D';
      aRes = 'D';
    }

    // Calcolo xPts basato su xG del match
    const xgDiff = hXg - aXg;
    const hWinProb = 1 / (1 + Math.exp(-1.6 * xgDiff));
    const aWinProb = 1 / (1 + Math.exp(1.6 * xgDiff));
    const drawProb = Math.max(0.15, 1 - (hWinProb + aWinProb) * 0.7);
    const hXPts = hWinProb * 3 + drawProb * 1;
    const aXPts = aWinProb * 3 + drawProb * 1;

    h.matchHistory.push({ date: m.date, result: hRes, xPts: hXPts });
    a.matchHistory.push({ date: m.date, result: aRes, xPts: aXPts });
  });

  const statsList: TeamStats[] = [];

  teamMap.forEach((data, team) => {
    const recent = data.matchHistory.slice(-5);
    const form: MatchResult[] = recent.map(r => r.result);
    const totalXPts = Number(data.matchHistory.reduce((acc, m) => acc + m.xPts, 0).toFixed(1));
    const xPtsDelta = Number((data.points - totalXPts).toFixed(1));

    const shotsPerGame = data.played > 0 ? Number((data.shotsTotal / data.played).toFixed(1)) : 0;
    const shotConversionRate = data.shotsTotal > 0 ? Number(((data.gf / data.shotsTotal) * 100).toFixed(1)) : 0;
    const shotAccuracy = data.shotsTotal > 0 ? Number(((data.shotsTargetTotal / data.shotsTotal) * 100).toFixed(1)) : 0;
    const avgPossession = data.possessionCount > 0 ? Number((data.possessionSum / data.possessionCount).toFixed(1)) : 50;
    const xgPerShot = data.shotsTotal > 0 ? Number((data.totalXg / data.shotsTotal).toFixed(2)) : 0.10;

    statsList.push({
      team,
      played: data.played,
      won: data.won,
      drawn: data.drawn,
      lost: data.lost,
      goalsFor: data.gf,
      goalsAgainst: data.ga,
      goalDiff: data.gf - data.ga,
      points: data.points,
      form,
      homePlayed: data.homePlayed,
      homeWon: data.homeWon,
      homeDrawn: data.homeDrawn,
      homeLost: data.homeLost,
      homeGf: data.homeGf,
      homeGa: data.homeGa,
      homePoints: data.homePoints,
      awayPlayed: data.awayPlayed,
      awayWon: data.awayWon,
      awayDrawn: data.awayDrawn,
      awayLost: data.awayLost,
      awayGf: data.awayGf,
      awayGa: data.awayGa,
      awayPoints: data.awayPoints,
      shotsTotal: data.shotsTotal,
      shotsTargetTotal: data.shotsTargetTotal,
      shotsConcededTotal: data.shotsConcededTotal,
      shotsTargetConcededTotal: data.shotsTargetConcededTotal,
      shotsPerGame,
      shotConversionRate,
      shotAccuracy,
      avgPossession,
      cleanSheets: data.cleanSheets,
      failedToScore: data.failedToScore,
      foulsTotal: data.foulsTotal,
      yellowsTotal: data.yellowsTotal,
      redsTotal: data.redsTotal,
      totalXg: Number(data.totalXg.toFixed(2)),
      totalXgAgainst: Number(data.totalXgAgainst.toFixed(2)),
      xPts: totalXPts,
      xPtsDelta,
      xgPerShot,
      firstHalfGf: data.firstHalfGf,
      secondHalfGf: data.secondHalfGf,
      firstHalfGa: data.firstHalfGa,
      secondHalfGa: data.secondHalfGa,
      eloRating: data.eloRating,
      eloRank: 1,
      homeDominanceRatio: data.points > 0 ? Number(((data.homePoints / data.points) * 100).toFixed(1)) : 50,
      cornerDifferential: data.cornersTaken - data.cornersConceded,
      comebacksCount: data.comebacks,
    });
  });

  // Assegna posizioni nel ranking Elo
  const eloSorted = [...statsList].sort((a, b) => b.eloRating - a.eloRating);
  eloSorted.forEach((s, idx) => {
    s.eloRank = idx + 1;
  });

  return statsList.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

/**
 * Calcola medie complessive della lega
 */
export function computeLeagueMetrics(matches: Match[]) {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      totalGoals: 0,
      avgGoalsPerMatch: 0,
      avgHomeGoals: 1.4,
      avgAwayGoals: 1.1,
      homeWinPct: 45,
      drawPct: 25,
      awayWinPct: 30,
      bothTeamsScorePct: 50,
      over25Pct: 50,
      avgYellows: 4.2,
      avgReds: 0.18
    };
  }

  let totalHomeGoals = 0;
  let totalAwayGoals = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let bttsCount = 0;
  let over25Count = 0;
  let yellows = 0;
  let reds = 0;

  matches.forEach(m => {
    totalHomeGoals += m.homeGoals;
    totalAwayGoals += m.awayGoals;
    if (m.homeGoals > m.awayGoals) homeWins++;
    else if (m.awayGoals > m.homeGoals) awayWins++;
    else draws++;

    if (m.homeGoals > 0 && m.awayGoals > 0) bttsCount++;
    if (m.homeGoals + m.awayGoals > 2.5) over25Count++;

    yellows += (m.homeYellows || 0) + (m.awayYellows || 0);
    reds += (m.homeReds || 0) + (m.awayReds || 0);
  });

  const totalMatches = matches.length;
  const totalGoals = totalHomeGoals + totalAwayGoals;

  return {
    totalMatches,
    totalGoals,
    avgGoalsPerMatch: Number((totalGoals / totalMatches).toFixed(2)),
    avgHomeGoals: Number((totalHomeGoals / totalMatches).toFixed(2)),
    avgAwayGoals: Number((totalAwayGoals / totalMatches).toFixed(2)),
    homeWinPct: Number(((homeWins / totalMatches) * 100).toFixed(1)),
    drawPct: Number(((draws / totalMatches) * 100).toFixed(1)),
    awayWinPct: Number(((awayWins / totalMatches) * 100).toFixed(1)),
    bothTeamsScorePct: Number(((bttsCount / totalMatches) * 100).toFixed(1)),
    over25Pct: Number(((over25Count / totalMatches) * 100).toFixed(1)),
    avgYellows: Number((yellows / totalMatches).toFixed(2)),
    avgReds: Number((reds / totalMatches).toFixed(2)),
  };
}

/**
 * Funzione di Poisson esatta: P(X = k) = (lambda^k * e^-lambda) / k!
 */
export function poissonProbability(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

/**
 * Elabora tutti i dati per estrarre insight predittivi e trend futuri
 */
export function computePredictiveProfiles(
  matches: Match[],
  teamStats: TeamStats[],
  config?: Partial<AnalysisConfig>
): TeamPredictiveProfile[] {
  const league = computeLeagueMetrics(matches);
  const profiles: TeamPredictiveProfile[] = [];

  const recentWeight = config?.recentFormWeight ?? 0.40;
  const seasonWeight = 1 - recentWeight;
  const metricBasis = config?.metricBasis ?? 'goals';
  const homeFactor = config?.homeAdvantageFactor ?? 1.12;

  teamStats.forEach(ts => {
    // 1. Indici di attacco e difesa pesati
    const teamHomeMatches = matches.filter(m => m.homeTeam === ts.team);
    const teamAwayMatches = matches.filter(m => m.awayTeam === ts.team);

    let homeGfAvg = teamHomeMatches.length > 0 ? ts.homeGf / teamHomeMatches.length : league.avgHomeGoals;
    let homeGaAvg = teamHomeMatches.length > 0 ? ts.homeGa / teamHomeMatches.length : league.avgAwayGoals;
    let awayGfAvg = teamAwayMatches.length > 0 ? ts.awayGf / teamAwayMatches.length : league.avgAwayGoals;
    let awayGaAvg = teamAwayMatches.length > 0 ? ts.awayGa / teamAwayMatches.length : league.avgHomeGoals;

    // Se l'utente ha configurato il modello su metricBasis === 'xg'
    if (metricBasis === 'xg') {
      homeGfAvg = ts.played > 0 ? ts.totalXg / ts.played : homeGfAvg;
      homeGaAvg = ts.played > 0 ? ts.totalXgAgainst / ts.played : homeGaAvg;
      awayGfAvg = ts.played > 0 ? (ts.totalXg / ts.played) * 0.9 : awayGfAvg;
      awayGaAvg = ts.played > 0 ? (ts.totalXgAgainst / ts.played) * 1.1 : awayGaAvg;
    }

    // Relativi alla media campionato
    const homeAttackRatio = league.avgHomeGoals > 0 ? (homeGfAvg / league.avgHomeGoals) * (homeFactor / 1.12) : 1;
    const awayAttackRatio = league.avgAwayGoals > 0 ? awayGfAvg / league.avgAwayGoals : 1;
    const attackRating = Number(((homeAttackRatio + awayAttackRatio) / 2).toFixed(2));

    const homeDefenseRatio = league.avgAwayGoals > 0 ? homeGaAvg / league.avgAwayGoals : 1;
    const awayDefenseRatio = league.avgHomeGoals > 0 ? awayGaAvg / league.avgHomeGoals : 1;
    const defenseRating = Number(((homeDefenseRatio + awayDefenseRatio) / 2).toFixed(2));

    // 2. Momentum & Traiettoria Recente (ultime 5 partite vs media campionato)
    const teamMatchesSorted = matches
      .filter(m => m.homeTeam === ts.team || m.awayTeam === ts.team)
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentMatches = teamMatchesSorted.slice(-5);
    let recentPoints = 0;
    const goalsPerMatchList: number[] = [];

    teamMatchesSorted.forEach(m => {
      const isHome = m.homeTeam === ts.team;
      const gf = isHome ? m.homeGoals : m.awayGoals;
      goalsPerMatchList.push(gf);
    });

    recentMatches.forEach(m => {
      const isHome = m.homeTeam === ts.team;
      const gf = isHome ? m.homeGoals : m.awayGoals;
      const ga = isHome ? m.awayGoals : m.homeGoals;
      if (gf > ga) recentPoints += 3;
      else if (gf === ga) recentPoints += 1;
    });

    const recentPpg = recentMatches.length > 0 ? Number((recentPoints / recentMatches.length).toFixed(2)) : 0;
    const seasonPpg = ts.played > 0 ? Number((ts.points / ts.played).toFixed(2)) : 0;
    const ppgDelta = Number((recentPpg - seasonPpg).toFixed(2));

    // Momentum Score [-100, +100] pesato
    let momentumScore = Math.round(ppgDelta * 40 * (recentWeight / 0.40));
    if (recentMatches.length >= 3) {
      // Bonus per serie di vittorie
      const last3Wins = recentMatches.slice(-3).every(m => {
        const isHome = m.homeTeam === ts.team;
        return isHome ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals;
      });
      if (last3Wins) momentumScore += 25;
    }
    momentumScore = Math.max(-100, Math.min(100, momentumScore));

    let momentumStatus: TeamPredictiveProfile['momentumStatus'] = 'Stabile';
    if (momentumScore >= 45) momentumStatus = 'In ascesa forte';
    else if (momentumScore >= 15) momentumStatus = 'Positivo';
    else if (momentumScore <= -45) momentumStatus = 'Critico';
    else if (momentumScore <= -15) momentumStatus = 'In flessione';

    // 3. Deviazione standard e consistenza gol
    const meanGoals = goalsPerMatchList.length > 0 
      ? goalsPerMatchList.reduce((a, b) => a + b, 0) / goalsPerMatchList.length 
      : 1;
    const variance = goalsPerMatchList.length > 0 
      ? goalsPerMatchList.reduce((acc, val) => acc + Math.pow(val - meanGoals, 2), 0) / goalsPerMatchList.length
      : 0.5;
    const stdDev = Math.sqrt(variance);
    const scoringConsistency = Math.max(10, Math.min(98, Math.round(100 - (stdDev / (meanGoals || 1)) * 40)));

    // 4. Clean Sheet % & BTTS %
    const cleanSheetProb = ts.played > 0 ? Number(((ts.cleanSheets / ts.played) * 100).toFixed(1)) : 25;
    let bttsMatches = 0;
    let over25Matches = 0;
    teamMatchesSorted.forEach(m => {
      if (m.homeGoals > 0 && m.awayGoals > 0) bttsMatches++;
      if (m.homeGoals + m.awayGoals > 2.5) over25Matches++;
    });
    const bttsProb = ts.played > 0 ? Number(((bttsMatches / ts.played) * 100).toFixed(1)) : 50;
    const over25Prob = ts.played > 0 ? Number(((over25Matches / ts.played) * 100).toFixed(1)) : 50;

    // 5. Regressione xG vs Gol Effettivi
    const xgDelta = Number((ts.goalsFor - ts.totalXg).toFixed(2));
    let regressionAlert: TeamPredictiveProfile['regressionAlert'] = 'Rendimento conforme';
    if (xgDelta > 4.5 && ts.played >= 10) {
      regressionAlert = 'Rischio flessione realizzativa';
    } else if (xgDelta < -4.5 && ts.played >= 10) {
      regressionAlert = 'Probabile ripresa realizzativa';
    }

    // 6. Archetipo Tattico
    let archetype: TeamArchetype = 'Equilibrata / Controllo';
    let archetypeDescription = 'Profilo con parametri equilibrati tra fase di possesso e copertura difensiva.';

    if (ts.avgPossession >= 54 && ts.shotsPerGame >= 14 && ts.totalXg > ts.played * 1.5) {
      archetype = 'Dominante ad Alto Volume';
      archetypeDescription = 'Monopolizza il possesso e produce un volume cospicuo di occasioni con pressione costante.';
    } else if (ts.goalsAgainst / (ts.played || 1) <= 0.95 && ts.cleanSheets >= ts.played * 0.38) {
      archetype = 'Fortezza Difensiva';
      archetypeDescription = 'Assetto ermetico con baricentro compatto, concede pochissime chance pulite all\'avversario.';
    } else if (ts.shotConversionRate >= 13.5 && ts.avgPossession < 52) {
      archetype = 'Cinica in Transizione';
      archetypeDescription = 'Letale nelle ripartenze veloci: converte le opportunità con un\'efficienza superiore alla media.';
    } else if (ts.goalsFor / (ts.played || 1) >= 1.5 && ts.goalsAgainst / (ts.played || 1) >= 1.4) {
      archetype = 'Fragile / A Visto Aperto';
      archetypeDescription = 'Partite spettacolari e ad alto punteggio: grande potenziale d\'attacco a scapito della tenuta difensiva.';
    } else if (ts.totalXg - ts.goalsFor > 3 && ts.shotConversionRate < 8.5) {
      archetype = 'In Crisi Realizzativa';
      archetypeDescription = 'Costruisce buone trame offensive ma paga una finalizzazione deficitaria e scarsa freddezza sotto porta.';
    }

    // 7. Stima punti finali (Monte Carlo rapido su calendario standard 38 gare) con peso personalizzato
    const targetGames = 38;
    const remainingGames = Math.max(0, targetGames - ts.played);
    const expectedPointsRemaining = remainingGames * (seasonPpg * seasonWeight + recentPpg * recentWeight);
    const projectedPointsMedian = Math.round(ts.points + expectedPointsRemaining);
    const pointsUncertainty = Math.round(Math.sqrt(remainingGames) * 3);

    // Stima probabilità indicative per i traguardi principali
    let titleProb = 0;
    let top4Prob = 0;
    let relProb = 0;

    if (projectedPointsMedian >= 84) titleProb = 65;
    else if (projectedPointsMedian >= 78) titleProb = 25;
    else if (projectedPointsMedian >= 72) titleProb = 5;

    if (projectedPointsMedian >= 72) top4Prob = 85;
    else if (projectedPointsMedian >= 65) top4Prob = 55;
    else if (projectedPointsMedian >= 58) top4Prob = 20;

    if (projectedPointsMedian <= 34) relProb = 75;
    else if (projectedPointsMedian <= 38) relProb = 45;
    else if (projectedPointsMedian <= 41) relProb = 15;

    profiles.push({
      team: ts.team,
      attackRating,
      defenseRating,
      homeAttackAdvantage: Number(homeAttackRatio.toFixed(2)),
      homeDefenseAdvantage: Number(homeDefenseRatio.toFixed(2)),
      momentumScore,
      momentumStatus,
      recentPpg,
      seasonPpg,
      ppgDelta,
      scoringConsistency,
      cleanSheetProb,
      bttsProb,
      over25Prob,
      xgDelta,
      regressionAlert,
      archetype,
      archetypeDescription,
      projectedPointsMedian,
      projectedPointsRange: [
        Math.max(ts.points, projectedPointsMedian - pointsUncertainty),
        projectedPointsMedian + pointsUncertainty
      ],
      titleProbability: titleProb,
      top4Probability: top4Prob,
      relegationProbability: relProb
    });
  });

  return profiles;
}

/**
 * Simula una sfida testa a testa (Team A vs Team B) con matrice Poisson bivariate
 */
export function simulateMatch(
  homeTeam: string,
  awayTeam: string,
  profilesMap: Map<string, TeamPredictiveProfile>,
  avgHomeGoals = 1.45,
  avgAwayGoals = 1.15,
  config?: Partial<AnalysisConfig>
): MatchSimulationResult {
  const homeProf = profilesMap.get(homeTeam);
  const awayProf = profilesMap.get(awayTeam);

  const homeFactor = config?.homeAdvantageFactor ?? 1.12;

  // Calcola aspettativa gol (lambda) con correzione per forza attacco/difesa avversaria
  const hAtt = homeProf ? homeProf.attackRating : 1.0;
  const hDef = homeProf ? homeProf.defenseRating : 1.0;
  const aAtt = awayProf ? awayProf.attackRating : 1.0;
  const aDef = awayProf ? awayProf.defenseRating : 1.0;

  // Gol attesi: media_casa * attacco_casa * difesa_trasferta * fattore campo
  const lambdaHome = Math.max(0.2, (avgHomeGoals * (homeFactor / 1.12)) * hAtt * aDef);
  const lambdaAway = Math.max(0.15, avgAwayGoals * aAtt * hDef);

  // Calcola matrice di probabilità fino a 6 gol per squadra
  const maxGoals = 6;
  const grid: number[][] = [];
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let bttsProb = 0;
  let over15Prob = 0;
  let over25Prob = 0;
  let over35Prob = 0;

  const scoreList: Array<{ score: string; home: number; away: number; probability: number }> = [];

  for (let i = 0; i <= maxGoals; i++) {
    grid[i] = [];
    const pHome = poissonProbability(i, lambdaHome);
    for (let j = 0; j <= maxGoals; j++) {
      const pAway = poissonProbability(j, lambdaAway);
      const prob = pHome * pAway;
      grid[i][j] = prob;

      if (i > j) homeWinProb += prob;
      else if (j > i) awayWinProb += prob;
      else drawProb += prob;

      if (i > 0 && j > 0) bttsProb += prob;
      if (i + j > 1.5) over15Prob += prob;
      if (i + j > 2.5) over25Prob += prob;
      if (i + j > 3.5) over35Prob += prob;

      scoreList.push({
        score: `${i} - ${j}`,
        home: i,
        away: j,
        probability: Number((prob * 100).toFixed(1))
      });
    }
  }

  // Normalizza probabilità 1X2 al 100%
  const total1X2 = homeWinProb + drawProb + awayWinProb;
  const normHome = Number(((homeWinProb / total1X2) * 100).toFixed(1));
  const normAway = Number(((awayWinProb / total1X2) * 100).toFixed(1));
  const normDraw = Number((100 - normHome - normAway).toFixed(1));

  // Prendi i 5 risultati più probabili
  scoreList.sort((a, b) => b.probability - a.probability);
  const topScores = scoreList.slice(0, 5);

  // Calcolo calci d'angolo attesi
  const expectedHomeCorners = Math.max(3.2, 5.1 * (hAtt * 0.7 + 0.3));
  const expectedAwayCorners = Math.max(2.8, 4.3 * (aAtt * 0.7 + 0.3));
  const expectedTotalCorners = Number((expectedHomeCorners + expectedAwayCorners).toFixed(1));
  const cornerOver85Prob = Math.min(88, Math.max(25, Math.round(52 + (expectedTotalCorners - 9.4) * 8.5)));
  const cornerOver95Prob = Math.min(82, Math.max(18, Math.round(42 + (expectedTotalCorners - 9.4) * 8.5)));

  // Helper per generare pronostici con quota di riferimento consigliata (+EV)
  function createTip(
    category: BettingAdviceTip['category'],
    market: string,
    selection: string,
    rawProb: number,
    rationale: string
  ): BettingAdviceTip {
    const p = Math.max(1, Math.min(99, Number(rawProb.toFixed(1))));
    const fairOdds = Number((100 / p).toFixed(2));

    // Margine di buffer +EV consigliato in base alla probabilità dell'evento
    let buffer = 1.05;
    if (p >= 65) buffer = 1.04;
    else if (p >= 45) buffer = 1.06;
    else if (p >= 30) buffer = 1.08;
    else buffer = 1.12;

    let refOdds = Number((fairOdds * buffer).toFixed(2));
    if (refOdds <= fairOdds) {
      refOdds = Number((fairOdds + 0.05).toFixed(2));
    }

    const evPct = Number((((p / 100) * (refOdds - 1) - (1 - p / 100)) * 100).toFixed(1));

    let confidence: 'Alta' | 'Media' | 'Speculativa' = 'Media';
    if (p >= 55) confidence = 'Alta';
    else if (p < 36) confidence = 'Speculativa';

    const actionPhrase = `Punta l'esito ${selection} se il bookmaker offre almeno @${refOdds.toFixed(2)}`;

    return {
      market,
      selection,
      probability: p,
      fairOdds,
      referenceMinOdds: refOdds,
      expectedValuePct: evPct,
      confidence,
      actionPhrase,
      rationale,
      category,
    };
  }

  const adviceList: BettingAdviceTip[] = [
    // 1X2
    createTip(
      '1X2 & Doppia Chance',
      'Esito Finale 1X2',
      `1 (${homeTeam} Vincente)`,
      normHome,
      `${homeTeam} proietta ${lambdaHome.toFixed(2)} xG con vantaggio territoriale casalingo e ${normHome}% di successo atteso.`
    ),
    createTip(
      '1X2 & Doppia Chance',
      'Esito Finale 1X2',
      'Pareggio (X)',
      normDraw,
      `Equilibrio statistico con scarto xG contenuto (${Math.abs(lambdaHome - lambdaAway).toFixed(2)}) e convergenza verso il pareggio al ${normDraw}%.`
    ),
    createTip(
      '1X2 & Doppia Chance',
      'Esito Finale 1X2',
      `2 (${awayTeam} Vincente)`,
      normAway,
      `${awayTeam} presenta un indice di efficienza esterna idoneo a superare la difesa interna con il ${normAway}% di successo stimato.`
    ),

    // Doppia Chance
    createTip(
      '1X2 & Doppia Chance',
      'Doppia Chance',
      'Doppia Chance 1X',
      normHome + normDraw,
      `Copertura elevata (${(normHome + normDraw).toFixed(1)}%): ${homeTeam} esce imbattuta nelle simulazioni nella quasi totalità degli scenari.`
    ),
    createTip(
      '1X2 & Doppia Chance',
      'Doppia Chance',
      'Doppia Chance X2',
      normAway + normDraw,
      `Copertura del ${(normAway + normDraw).toFixed(1)}% a tutela della trasferta di ${awayTeam} contro la compagine casalinga.`
    ),
    createTip(
      '1X2 & Doppia Chance',
      'Doppia Chance',
      'Doppia Chance 12',
      normHome + normAway,
      `Bassa frequenza di pareggio stimata, match aperto che favorisce una vittoria da una delle due parti (${(normHome + normAway).toFixed(1)}%).`
    ),

    // Under / Over
    createTip(
      'Under / Over',
      'Under / Over 1.5',
      'Over 1.5 Gol',
      over15Prob * 100,
      `Soglia prudente: proiezione di almeno 2 reti complessive nel ${(over15Prob * 100).toFixed(1)}% dei casi secondo la matrice Poisson.`
    ),
    createTip(
      'Under / Over',
      'Under / Over 2.5',
      'Over 2.5 Gol',
      over25Prob * 100,
      `Produzione offensiva combinata di ${(lambdaHome + lambdaAway).toFixed(2)} xG con il ${(over25Prob * 100).toFixed(1)}% di superare 2.5 gol.`
    ),
    createTip(
      'Under / Over',
      'Under / Over 2.5',
      'Under 2.5 Gol',
      (1 - over25Prob) * 100,
      `Ritmi controllati e baricentri bassi: combinazione 0-0, 1-0, 0-1 e 1-1 copre il ${((1 - over25Prob) * 100).toFixed(1)}% degli esiti attesi.`
    ),
    createTip(
      'Under / Over',
      'Under / Over 3.5',
      'Over 3.5 Gol',
      over35Prob * 100,
      `Scenario ad alto punteggio con due attacchi prolifici e difese propense a concedere varchi.`
    ),
    createTip(
      'Under / Over',
      'Under / Over 3.5',
      'Under 3.5 Gol',
      (1 - over35Prob) * 100,
      `Margine di sicurezza elevato: meno di 4 reti complessive attese nell'${((1 - over35Prob) * 100).toFixed(1)}% delle simulazioni.`
    ),

    // Goal / No Goal
    createTip(
      'Goal / No Goal',
      'Goal / No Goal (BTTS)',
      'Goal (Entrambe a Segno - Sì)',
      bttsProb * 100,
      `Entrambe le formazioni presentano un potenziale offensivo adeguato a trovare la via della rete (${(bttsProb * 100).toFixed(1)}%).`
    ),
    createTip(
      'Goal / No Goal',
      'Goal / No Goal (BTTS)',
      'No Goal (Almeno una squadra a secco)',
      (1 - bttsProb) * 100,
      `Clean sheet atteso da parte di una delle due difese o pareggio a reti bianche (${((1 - bttsProb) * 100).toFixed(1)}%).`
    ),

    // Calci d'Angolo
    createTip(
      'Corner',
      'Calci d\'Angolo',
      'Over 8.5 Calci d\'Angolo',
      cornerOver85Prob,
      `Media combinata stimata a ${expectedTotalCorners} corner totali grazie all'ampiezza delle corsie esterne di entrambe le squadre.`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo',
      'Over 9.5 Calci d\'Angolo',
      cornerOver95Prob,
      `Frequente ricorso a cross e tiri deviati che spinge il volume corner sopra la media ordinaria (${cornerOver95Prob}%).`
    ),

    // Risultato Esatto #1
    createTip(
      'Risultato Esatto',
      'Risultato Esatto',
      `Risultato Esatto ${topScores[0]?.score || '1 - 1'}`,
      topScores[0]?.probability || 14.5,
      `Punteggio singolo con la frequenza percentuale dominante (${topScores[0]?.probability || 14.5}%) nella distribuzione multivariata.`
    ),
  ];

  // Ordina i pronostici: prima alta probabilità / migliore EV%
  adviceList.sort((a, b) => b.probability - a.probability);

  return {
    homeTeam,
    awayTeam,
    expectedHomeGoals: Number(lambdaHome.toFixed(2)),
    expectedAwayGoals: Number(lambdaAway.toFixed(2)),
    homeWinProb: normHome,
    drawProb: normDraw,
    awayWinProb: normAway,
    bothTeamsScoreProb: Number((bttsProb * 100).toFixed(1)),
    bttsNoProb: Number(((1 - bttsProb) * 100).toFixed(1)),
    over15Prob: Number((over15Prob * 100).toFixed(1)),
    under15Prob: Number(((1 - over15Prob) * 100).toFixed(1)),
    over25Prob: Number((over25Prob * 100).toFixed(1)),
    under25Prob: Number(((1 - over25Prob) * 100).toFixed(1)),
    over35Prob: Number((over35Prob * 100).toFixed(1)),
    under35Prob: Number(((1 - over35Prob) * 100).toFixed(1)),
    doubleChance1XProb: Math.min(99, Number((normHome + normDraw).toFixed(1))),
    doubleChanceX2Prob: Math.min(99, Number((normAway + normDraw).toFixed(1))),
    doubleChance12Prob: Math.min(99, Number((normHome + normAway).toFixed(1))),
    expectedTotalCorners,
    cornerOver85Prob,
    cornerOver95Prob,
    mostLikelyScores: topScores,
    bettingAdviceList: adviceList,
  };
}
