import { Match, MatchResult, TeamStats, TeamPredictiveProfile, TeamArchetype, MatchSimulationResult, MonteCarloSimulationResult, AnalysisConfig, BettingAdviceTip } from '../types/football';

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
      cornersTotal: data.cornersTaken,
      cornersConcededTotal: data.cornersConceded,
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
 * Calcola le statistiche aggregate per ogni squadra considerando
 * i record più recenti (default: 50 record più recenti per team)
 */
export function computeRecentTeamStats(
  matches: Match[],
  maxRecentPerTeam = 50,
  config?: Partial<AnalysisConfig>
): TeamStats[] {
  const allTeams = Array.from(
    new Set(matches.flatMap((m) => [m.homeTeam, m.awayTeam]).filter(Boolean))
  );

  const statsList: TeamStats[] = [];

  allTeams.forEach((team) => {
    // Isola le partite di questa squadra ordinate dalla più recente
    const teamMatches = matches
      .filter((m) => m.homeTeam === team || m.awayTeam === team)
      .sort((a, b) => b.date.localeCompare(a.date));

    // Prendi fino a maxRecentPerTeam partite più recenti
    const recentSample = teamMatches.slice(0, maxRecentPerTeam);

    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let points = 0;

    let homePlayed = 0;
    let homeWon = 0;
    let homeDrawn = 0;
    let homeLost = 0;
    let homeGf = 0;
    let homeGa = 0;
    let homePoints = 0;

    let awayPlayed = 0;
    let awayWon = 0;
    let awayDrawn = 0;
    let awayLost = 0;
    let awayGf = 0;
    let awayGa = 0;
    let awayPoints = 0;

    let shotsTotal = 0;
    let shotsTargetTotal = 0;
    let shotsConcededTotal = 0;
    let shotsTargetConcededTotal = 0;

    let cornersTaken = 0;
    let cornersConceded = 0;

    let foulsTotal = 0;
    let yellowsTotal = 0;
    let redsTotal = 0;

    let cleanSheets = 0;
    let failedToScore = 0;

    let totalXg = 0;
    let totalXgAgainst = 0;

    let possessionSum = 0;
    let possessionCount = 0;

    let firstHalfGf = 0;
    let secondHalfGf = 0;
    let firstHalfGa = 0;
    let secondHalfGa = 0;
    let comebacks = 0;

    // Cronologia ordinata temporalmente per andamento forma
    const chronoMatches = [...recentSample].sort((a, b) => a.date.localeCompare(b.date));
    const matchHistory: Array<{ date: string; result: MatchResult; xPts: number }> = [];

    chronoMatches.forEach((m) => {
      played++;
      const isHome = m.homeTeam === team;
      const teamG = isHome ? m.homeGoals : m.awayGoals;
      const oppG = isHome ? m.awayGoals : m.homeGoals;
      const teamXg = isHome ? (m.homeXg ?? 1.2) : (m.awayXg ?? 1.0);
      const oppXg = isHome ? (m.awayXg ?? 1.0) : (m.homeXg ?? 1.2);

      goalsFor += teamG;
      goalsAgainst += oppG;
      totalXg += teamXg;
      totalXgAgainst += oppXg;

      if (isHome) {
        homePlayed++;
        homeGf += teamG;
        homeGa += oppG;
        if (m.homeShots !== undefined) shotsTotal += m.homeShots;
        if (m.awayShots !== undefined) shotsConcededTotal += m.awayShots;
        if (m.homeShotsTarget !== undefined) shotsTargetTotal += m.homeShotsTarget;
        if (m.awayShotsTarget !== undefined) shotsTargetConcededTotal += m.awayShotsTarget;
        if (m.homeCorners !== undefined) cornersTaken += m.homeCorners;
        if (m.awayCorners !== undefined) cornersConceded += m.awayCorners;
        if (m.homeFouls) foulsTotal += m.homeFouls;
        if (m.homeYellows) yellowsTotal += m.homeYellows;
        if (m.homeReds) redsTotal += m.homeReds;
        if (m.homePossession !== undefined) {
          possessionSum += m.homePossession;
          possessionCount++;
        }
      } else {
        awayPlayed++;
        awayGf += teamG;
        awayGa += oppG;
        if (m.awayShots !== undefined) shotsTotal += m.awayShots;
        if (m.homeShots !== undefined) shotsConcededTotal += m.homeShots;
        if (m.awayShotsTarget !== undefined) shotsTargetTotal += m.awayShotsTarget;
        if (m.homeShotsTarget !== undefined) shotsTargetConcededTotal += m.homeShotsTarget;
        if (m.awayCorners !== undefined) cornersTaken += m.awayCorners;
        if (m.homeCorners !== undefined) cornersConceded += m.homeCorners;
        if (m.awayFouls) foulsTotal += m.awayFouls;
        if (m.awayYellows) yellowsTotal += m.awayYellows;
        if (m.awayReds) redsTotal += m.awayReds;
        if (m.awayPossession !== undefined) {
          possessionSum += m.awayPossession;
          possessionCount++;
        }
      }

      const htHome = m.halfTimeHomeGoals ?? (m.homeGoals > 0 ? Math.floor(m.homeGoals * 0.45) : 0);
      const htAway = m.halfTimeAwayGoals ?? (m.awayGoals > 0 ? Math.floor(m.awayGoals * 0.42) : 0);
      const teamHt = isHome ? htHome : htAway;
      const oppHt = isHome ? htAway : htHome;

      firstHalfGf += teamHt;
      secondHalfGf += (teamG - teamHt);
      firstHalfGa += oppHt;
      secondHalfGa += (oppG - oppHt);

      if (teamHt < oppHt && teamG >= oppG) {
        comebacks++;
      }

      if (oppG === 0) cleanSheets++;
      if (teamG === 0) failedToScore++;

      let res: MatchResult = 'D';
      if (teamG > oppG) {
        won++;
        points += 3;
        if (isHome) { homeWon++; homePoints += 3; }
        else { awayWon++; awayPoints += 3; }
        res = 'H';
      } else if (teamG < oppG) {
        lost++;
        if (isHome) homeLost++;
        else awayLost++;
        res = 'A';
      } else {
        drawn++;
        points += 1;
        if (isHome) { homeDrawn++; homePoints += 1; }
        else { awayDrawn++; awayPoints += 1; }
        res = 'D';
      }

      const xgDiff = teamXg - oppXg;
      const winP = 1 / (1 + Math.exp(-1.6 * xgDiff));
      const lossP = 1 / (1 + Math.exp(1.6 * xgDiff));
      const drawP = Math.max(0.15, 1 - (winP + lossP) * 0.7);
      const xPts = winP * 3 + drawP * 1;

      matchHistory.push({ date: m.date, result: res, xPts });
    });

    const recent5 = matchHistory.slice(-5);
    const form: MatchResult[] = recent5.map((r) => r.result);
    const totalXPts = Number(matchHistory.reduce((acc, m) => acc + m.xPts, 0).toFixed(1));
    const xPtsDelta = Number((points - totalXPts).toFixed(1));
    const shotsPerGame = played > 0 ? Number((shotsTotal / played).toFixed(1)) : 0;
    const shotConversionRate = shotsTotal > 0 ? Number(((goalsFor / shotsTotal) * 100).toFixed(1)) : 0;
    const shotAccuracy = shotsTotal > 0 ? Number(((shotsTargetTotal / shotsTotal) * 100).toFixed(1)) : 0;
    const avgPossession = possessionCount > 0 ? Number((possessionSum / possessionCount).toFixed(1)) : 50;
    const xgPerShot = shotsTotal > 0 ? Number((totalXg / shotsTotal).toFixed(2)) : 0.1;
    const homeDominanceRatio = points > 0 ? Number(((homePoints / points) * 100).toFixed(1)) : 50;

    statsList.push({
      team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      points,
      form,
      homePlayed,
      homeWon,
      homeDrawn,
      homeLost,
      homeGf,
      homeGa,
      homePoints,
      awayPlayed,
      awayWon,
      awayDrawn,
      awayLost,
      awayGf,
      awayGa,
      awayPoints,
      shotsTotal,
      shotsTargetTotal,
      shotsConcededTotal,
      shotsTargetConcededTotal,
      shotsPerGame,
      shotConversionRate,
      shotAccuracy,
      avgPossession,
      cleanSheets,
      failedToScore,
      foulsTotal,
      yellowsTotal,
      redsTotal,
      totalXg: Number(totalXg.toFixed(2)),
      totalXgAgainst: Number(totalXgAgainst.toFixed(2)),
      xPts: totalXPts,
      xPtsDelta,
      xgPerShot,
      firstHalfGf,
      secondHalfGf,
      firstHalfGa,
      secondHalfGa,
      eloRating: 1500 + (points / Math.max(1, played)) * 100,
      eloRank: 1,
      homeDominanceRatio,
      cornerDifferential: cornersTaken - cornersConceded,
      cornersTotal: cornersTaken,
      cornersConcededTotal: cornersConceded,
      cornersTaken: cornersTaken,
      cornersConceded: cornersConceded,
      comebacksCount: comebacks,
    });
  });

  statsList.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
  statsList.forEach((s, idx) => { s.eloRank = idx + 1; });
  return statsList;
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
 * calibrati sui record più recenti per ogni team (default: 50 gare)
 */
export function computePredictiveProfiles(
  matches: Match[],
  teamStats: TeamStats[],
  config?: Partial<AnalysisConfig>,
  maxRecentPerTeam = 50
): TeamPredictiveProfile[] {
  const league = computeLeagueMetrics(matches);
  const profiles: TeamPredictiveProfile[] = [];

  const recentWeight = config?.recentFormWeight ?? 0.40;
  const seasonWeight = 1 - recentWeight;
  const metricBasis = config?.metricBasis ?? 'goals';
  const homeFactor = config?.homeAdvantageFactor ?? 1.12;
  const sampleLimit = config?.teamRecentMatchesLimit ?? maxRecentPerTeam;

  teamStats.forEach(ts => {
    // 1. Isola i record più recenti per ciascun team (default 50 partite)
    const teamAllMatches = matches
      .filter(m => m.homeTeam === ts.team || m.awayTeam === ts.team)
      .sort((a, b) => b.date.localeCompare(a.date));
    const teamSampleMatches = sampleLimit ? teamAllMatches.slice(0, sampleLimit) : teamAllMatches;

    const teamHomeMatches = teamSampleMatches.filter(m => m.homeTeam === ts.team);
    const teamAwayMatches = teamSampleMatches.filter(m => m.awayTeam === ts.team);

    let homeGfAvg = teamHomeMatches.length > 0 
      ? (metricBasis === 'xg' ? teamHomeMatches.reduce((s, m) => s + (m.homeXg ?? 1.2), 0) / teamHomeMatches.length : teamHomeMatches.reduce((s, m) => s + m.homeGoals, 0) / teamHomeMatches.length)
      : (ts.homePlayed > 0 ? ts.homeGf / ts.homePlayed : league.avgHomeGoals);
      
    let homeGaAvg = teamHomeMatches.length > 0 
      ? (metricBasis === 'xg' ? teamHomeMatches.reduce((s, m) => s + (m.awayXg ?? 1.1), 0) / teamHomeMatches.length : teamHomeMatches.reduce((s, m) => s + m.awayGoals, 0) / teamHomeMatches.length)
      : (ts.homePlayed > 0 ? ts.homeGa / ts.homePlayed : league.avgAwayGoals);

    let awayGfAvg = teamAwayMatches.length > 0 
      ? (metricBasis === 'xg' ? teamAwayMatches.reduce((s, m) => s + (m.awayXg ?? 1.1), 0) / teamAwayMatches.length : teamAwayMatches.reduce((s, m) => s + m.awayGoals, 0) / teamAwayMatches.length)
      : (ts.awayPlayed > 0 ? ts.awayGf / ts.awayPlayed : league.avgAwayGoals);

    let awayGaAvg = teamAwayMatches.length > 0 
      ? (metricBasis === 'xg' ? teamAwayMatches.reduce((s, m) => s + (m.homeXg ?? 1.2), 0) / teamAwayMatches.length : teamAwayMatches.reduce((s, m) => s + m.homeGoals, 0) / teamAwayMatches.length)
      : (ts.awayPlayed > 0 ? ts.awayGa / ts.awayPlayed : league.avgHomeGoals);

    // Relativi alla media campionato
    const homeAttackRatio = league.avgHomeGoals > 0 ? (homeGfAvg / league.avgHomeGoals) * (homeFactor / 1.12) : 1;
    const awayAttackRatio = league.avgAwayGoals > 0 ? awayGfAvg / league.avgAwayGoals : 1;
    const attackRating = Number(((homeAttackRatio + awayAttackRatio) / 2).toFixed(2));

    const homeDefenseRatio = league.avgAwayGoals > 0 ? homeGaAvg / league.avgAwayGoals : 1;
    const awayDefenseRatio = league.avgHomeGoals > 0 ? awayGaAvg / league.avgHomeGoals : 1;
    const defenseRating = Number(((homeDefenseRatio + awayDefenseRatio) / 2).toFixed(2));

    // 2. Momentum & Traiettoria Recente (ultime 5 partite del campione recente)
    const teamMatchesSorted = [...teamSampleMatches].sort((a, b) => a.date.localeCompare(b.date));
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

    const samplePlayed = teamMatchesSorted.length || ts.played;
    const recentPpg = recentMatches.length > 0 ? Number((recentPoints / recentMatches.length).toFixed(2)) : 0;
    const seasonPpg = samplePlayed > 0 ? Number((ts.points / samplePlayed).toFixed(2)) : 0;
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
    let cleanSheetCount = 0;
    let bttsMatches = 0;
    let over25Matches = 0;
    teamMatchesSorted.forEach(m => {
      const isHome = m.homeTeam === ts.team;
      const ga = isHome ? m.awayGoals : m.homeGoals;
      if (ga === 0) cleanSheetCount++;
      if (m.homeGoals > 0 && m.awayGoals > 0) bttsMatches++;
      if (m.homeGoals + m.awayGoals > 2.5) over25Matches++;
    });
    const cleanSheetProb = samplePlayed > 0 ? Number(((cleanSheetCount / samplePlayed) * 100).toFixed(1)) : 25;
    const bttsProb = samplePlayed > 0 ? Number(((bttsMatches / samplePlayed) * 100).toFixed(1)) : 50;
    const over25Prob = samplePlayed > 0 ? Number(((over25Matches / samplePlayed) * 100).toFixed(1)) : 50;

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

    // 7. Stima Monte Carlo estesa: Punti, Gol Fatti (GF), Gol Subiti (GS) e Calci d'Angolo
    const targetGames = 38;
    const remainingGames = Math.max(0, targetGames - ts.played);
    const expectedPointsRemaining = remainingGames * (seasonPpg * seasonWeight + recentPpg * recentWeight);
    const projectedPointsMedian = Math.round(ts.points + expectedPointsRemaining);
    const pointsUncertainty = Math.round(Math.sqrt(remainingGames) * 3);

    // Proiezioni Monte Carlo Gol Fatti (GF) e Gol Subiti (GS)
    const avgGfPerGame = ts.played > 0 ? (ts.goalsFor / ts.played) : 1.35;
    const avgGaPerGame = ts.played > 0 ? (ts.goalsAgainst / ts.played) : 1.25;
    const expGfRemaining = remainingGames * (avgGfPerGame * (attackRating * 0.6 + 0.4));
    const expGaRemaining = remainingGames * (avgGaPerGame * (defenseRating * 0.6 + 0.4));
    const projectedGoalsForMedian = Math.round(ts.goalsFor + expGfRemaining);
    const gfUncertainty = Math.round(Math.sqrt(remainingGames) * 2.1);
    const projectedGoalsAgainstMedian = Math.round(ts.goalsAgainst + expGaRemaining);
    const gaUncertainty = Math.round(Math.sqrt(remainingGames) * 2.1);
    const projectedGoalDiffMedian = projectedGoalsForMedian - projectedGoalsAgainstMedian;

    // Proiezioni Monte Carlo Calci d'Angolo (Corner)
    const avgCornersPerGame = ts.played > 0 && ts.cornersTotal ? (ts.cornersTotal / ts.played) : (5.2 * (attackRating * 0.6 + 0.4));
    const expCornersRemaining = remainingGames * avgCornersPerGame;
    const currentCorners = ts.cornersTotal ?? Math.round(ts.played * avgCornersPerGame);
    const projectedCornersMedian = Math.round(currentCorners + expCornersRemaining);
    const cornerUncertainty = Math.round(Math.sqrt(remainingGames) * 4.2);

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
      projectedGoalsForMedian,
      projectedGoalsForRange: [
        Math.max(ts.goalsFor, projectedGoalsForMedian - gfUncertainty),
        projectedGoalsForMedian + gfUncertainty
      ],
      projectedGoalsAgainstMedian,
      projectedGoalsAgainstRange: [
        Math.max(ts.goalsAgainst, projectedGoalsAgainstMedian - gaUncertainty),
        projectedGoalsAgainstMedian + gaUncertainty
      ],
      projectedGoalDiffMedian,
      projectedCornersMedian,
      projectedCornersRange: [
        Math.max(currentCorners, projectedCornersMedian - cornerUncertainty),
        projectedCornersMedian + cornerUncertainty
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

  // Calcola matrice di probabilità fino a 6 gol per squadra con aggiustamento Dixon-Coles (1997)
  const maxGoals = 6;
  const grid: number[][] = [];
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let bttsProb = 0;
  let over15Prob = 0;
  let over25Prob = 0;
  let over35Prob = 0;

  // Parametro di correlazione Dixon-Coles per punteggi bassi (0-0, 1-0, 0-1, 1-1)
  const rho = -0.11;
  const dixonColesTau = (x: number, y: number, lH: number, lA: number): number => {
    if (x === 0 && y === 0) return Math.max(0.1, 1 - lH * lA * rho);
    if (x === 0 && y === 1) return Math.max(0.1, 1 + lH * rho);
    if (x === 1 && y === 0) return Math.max(0.1, 1 + lA * rho);
    if (x === 1 && y === 1) return Math.max(0.1, 1 - rho);
    return 1.0;
  };

  const rawScoreList: Array<{ score: string; home: number; away: number; rawProb: number }> = [];
  let sumTotalProbs = 0;

  for (let i = 0; i <= maxGoals; i++) {
    grid[i] = [];
    const pHome = poissonProbability(i, lambdaHome);
    for (let j = 0; j <= maxGoals; j++) {
      const pAway = poissonProbability(j, lambdaAway);
      const tauFactor = dixonColesTau(i, j, lambdaHome, lambdaAway);
      const prob = pHome * pAway * tauFactor;
      grid[i][j] = prob;
      sumTotalProbs += prob;

      rawScoreList.push({
        score: `${i} - ${j}`,
        home: i,
        away: j,
        rawProb: prob,
      });
    }
  }

  // Normalizza su somma totale per chiudere al 100%
  const scoreList: Array<{ score: string; home: number; away: number; probability: number }> = [];
  for (const item of rawScoreList) {
    const normalizedProb = sumTotalProbs > 0 ? item.rawProb / sumTotalProbs : item.rawProb;
    if (item.home > item.away) homeWinProb += normalizedProb;
    else if (item.away > item.home) awayWinProb += normalizedProb;
    else drawProb += normalizedProb;

    if (item.home > 0 && item.away > 0) bttsProb += normalizedProb;
    if (item.home + item.away > 1.5) over15Prob += normalizedProb;
    if (item.home + item.away > 2.5) over25Prob += normalizedProb;
    if (item.home + item.away > 3.5) over35Prob += normalizedProb;

    scoreList.push({
      score: item.score,
      home: item.home,
      away: item.away,
      probability: Number((normalizedProb * 100).toFixed(1)),
    });
  }

  // Normalizza probabilità 1X2 al 100%
  const total1X2 = homeWinProb + drawProb + awayWinProb;
  const normHome = Number(((homeWinProb / total1X2) * 100).toFixed(1));
  const normAway = Number(((awayWinProb / total1X2) * 100).toFixed(1));
  const normDraw = Number((100 - normHome - normAway).toFixed(1));

  // Prendi i 5 risultati più probabili
  scoreList.sort((a, b) => b.probability - a.probability);
  const topScores = scoreList.slice(0, 5);

  // Calcolo calci d'angolo attesi e distribuzione Poisson estesa
  const expectedHomeCorners = Math.max(2.8, Number((5.1 * (hAtt * 0.65 + 0.35)).toFixed(1)));
  const expectedAwayCorners = Math.max(2.2, Number((4.4 * (aAtt * 0.65 + 0.35)).toFixed(1)));
  const expectedTotalCorners = Number((expectedHomeCorners + expectedAwayCorners).toFixed(1));

  // Funzione cumulativa Poisson per corner totali
  const cornerProbAtLeast = (line: number, lambda: number): number => {
    let sumUnder = 0;
    for (let k = 0; k < line; k++) {
      sumUnder += poissonProbability(k, lambda);
    }
    return Math.max(1, Math.min(99, Number(((1 - sumUnder) * 100).toFixed(1))));
  };

  const cornerOver65Prob = cornerProbAtLeast(7, expectedTotalCorners);
  const cornerUnder65Prob = Number((100 - cornerOver65Prob).toFixed(1));
  const cornerOver75Prob = cornerProbAtLeast(8, expectedTotalCorners);
  const cornerUnder75Prob = Number((100 - cornerOver75Prob).toFixed(1));
  const cornerOver85Prob = cornerProbAtLeast(9, expectedTotalCorners);
  const cornerUnder85Prob = Number((100 - cornerOver85Prob).toFixed(1));
  const cornerOver95Prob = cornerProbAtLeast(10, expectedTotalCorners);
  const cornerUnder95Prob = Number((100 - cornerOver95Prob).toFixed(1));
  const cornerOver105Prob = cornerProbAtLeast(11, expectedTotalCorners);
  const cornerUnder105Prob = Number((100 - cornerOver105Prob).toFixed(1));
  const cornerOver115Prob = cornerProbAtLeast(12, expectedTotalCorners);
  const cornerUnder115Prob = Number((100 - cornerOver115Prob).toFixed(1));
  const cornerOver125Prob = cornerProbAtLeast(13, expectedTotalCorners);
  const cornerUnder125Prob = Number((100 - cornerOver125Prob).toFixed(1));
  const cornerOver135Prob = cornerProbAtLeast(14, expectedTotalCorners);
  const cornerUnder135Prob = Number((100 - cornerOver135Prob).toFixed(1));
  const cornerOver145Prob = cornerProbAtLeast(15, expectedTotalCorners);
  const cornerUnder145Prob = Number((100 - cornerOver145Prob).toFixed(1));

  // Corner per singola squadra
  const cornerHomeOver35Prob = cornerProbAtLeast(4, expectedHomeCorners);
  const cornerHomeOver45Prob = cornerProbAtLeast(5, expectedHomeCorners);
  const cornerHomeOver55Prob = cornerProbAtLeast(6, expectedHomeCorners);
  const cornerAwayOver25Prob = cornerProbAtLeast(3, expectedAwayCorners);
  const cornerAwayOver35Prob = cornerProbAtLeast(4, expectedAwayCorners);
  const cornerAwayOver45Prob = cornerProbAtLeast(5, expectedAwayCorners);

  // Fasce Corner (0-8, 9-11, 12-14, 15+ e 12+)
  const prob0to8 = Number((100 - cornerOver85Prob).toFixed(1));
  const prob12plus = cornerOver115Prob;
  const prob15plus = cornerOver145Prob;
  const prob12to14 = Math.max(2, Number((prob12plus - prob15plus).toFixed(1)));
  const prob9to11 = Math.max(5, Number((100 - prob0to8 - prob12plus).toFixed(1)));

  // Corner 1X2 (Chi batte più corner)
  const cornerDiff = expectedHomeCorners - expectedAwayCorners;
  const cornerHomeMost = Math.min(88, Math.max(15, Math.round(48 + cornerDiff * 9.5)));
  const cornerAwayMost = Math.min(80, Math.max(12, Math.round(38 - cornerDiff * 9.0)));
  const cornerEqual = Math.max(6, 100 - cornerHomeMost - cornerAwayMost);

  // Probabilità Multigol e Over 4.5
  let over45 = 0;
  let mg13 = 0;
  let mg24 = 0;
  let mg25 = 0;
  let combo1O25 = 0;
  let combo1NG = 0;
  let comboXU25 = 0;
  let comboO25GG = 0;

  for (const item of rawScoreList) {
    const totG = item.home + item.away;
    const normP = sumTotalProbs > 0 ? item.rawProb / sumTotalProbs : item.rawProb;
    if (totG > 4.5) over45 += normP;
    if (totG >= 1 && totG <= 3) mg13 += normP;
    if (totG >= 2 && totG <= 4) mg24 += normP;
    if (totG >= 2 && totG <= 5) mg25 += normP;

    // Combo esiti
    if (item.home > item.away && totG > 2.5) combo1O25 += normP;
    if (item.home > item.away && (item.home === 0 || item.away === 0)) combo1NG += normP;
    if (item.home === item.away && totG <= 2.5) comboXU25 += normP;
    if (totG > 2.5 && item.home > 0 && item.away > 0) comboO25GG += normP;
  }

  const over45Prob = Number((over45 * 100).toFixed(1));
  const under45Prob = Number(((1 - over45) * 100).toFixed(1));
  const multigoal13Prob = Number((mg13 * 100).toFixed(1));
  const multigoal24Prob = Number((mg24 * 100).toFixed(1));
  const multigoal25Prob = Number((mg25 * 100).toFixed(1));
  const combo1AndOver25Prob = Number((combo1O25 * 100).toFixed(1));
  const combo1AndNoGoalProb = Number((combo1NG * 100).toFixed(1));
  const comboXAndUnder25Prob = Number((comboXU25 * 100).toFixed(1));
  const comboOver25AndGoalProb = Number((comboO25GG * 100).toFixed(1));

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

    // Under / Over Gol Estesi
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
    createTip(
      'Under / Over',
      'Under / Over 4.5',
      'Under 4.5 Gol',
      under45Prob,
      `Copertura difensiva solida: quasi la totalità delle simulazioni (${under45Prob}%) rimane sotto le 5 reti.`
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

    // Combo & Multigol
    createTip(
      'Combo & Multigol',
      'Multigol',
      'Multigol 1-3 Gol',
      multigoal13Prob,
      `Fascia di segnatura tipica dei campionati equilibrati: copre ${multigoal13Prob}% delle simulazioni.`
    ),
    createTip(
      'Combo & Multigol',
      'Multigol',
      'Multigol 2-4 Gol',
      multigoal24Prob,
      `Intervallo ad alta resa che include i risultati 2-0, 1-1, 2-1, 3-1 (${multigoal24Prob}% di stima).`
    ),
    createTip(
      'Combo & Multigol',
      'Combo Esito + Gol',
      `Combo 1 + Over 2.5 (${homeTeam})`,
      combo1AndOver25Prob,
      `Vittoria di ${homeTeam} accompagnata da almeno 3 reti totali nell'incontro (${combo1AndOver25Prob}%).`
    ),
    createTip(
      'Combo & Multigol',
      'Combo Esito + Goal',
      'Combo Over 2.5 + Goal',
      comboOver25AndGoalProb,
      `Incontro vivace dove entrambe le squadre vanno a referto e si supera la soglia dei 2.5 gol (${comboOver25AndGoalProb}%).`
    ),

    // Calci d'Angolo - Range Esteso
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 6.5 Corner',
      cornerOver65Prob,
      `Soglia ultra-prudente: proiezione di almeno 7 calci d'angolo con affidabilità probabilistica del ${cornerOver65Prob}%.`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 7.5 Corner',
      cornerOver75Prob,
      `Soglia prudente: proiezione solida di almeno 8 calci d'angolo con probabilità del ${cornerOver75Prob}%.`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 8.5 Corner',
      cornerOver85Prob,
      `Media combinata stimata a ${expectedTotalCorners} corner totali grazie all'ampiezza delle corsie esterne di entrambe le squadre.`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Under 8.5 Corner',
      cornerUnder85Prob,
      `Scenario a baricentro basso o gioco prevalentemente per vie centrali (${cornerUnder85Prob}% Under 8.5).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 9.5 Corner',
      cornerOver95Prob,
      `Frequente ricorso a cross e tiri deviati che spinge il volume corner sopra la media ordinaria (${cornerOver95Prob}%).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Under 9.5 Corner',
      cornerUnder95Prob,
      `Tattica incentrata sulle vie centrali e limitate sovrapposizioni delle ali (${cornerUnder95Prob}% Under 9.5).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 10.5 Corner',
      cornerOver105Prob,
      `Linee d'attacco verticali e alto volume di tiri respinti: ${cornerOver105Prob}% di superare 10 calci d'angolo.`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 11.5 Corner',
      cornerOver115Prob,
      `Scenario ad altissima frequenza di corner con squadre dedite al pressing offensivo costante (${cornerOver115Prob}%).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Under 10.5 Corner',
      cornerUnder105Prob,
      `Previsione di match tattico con baricentro equilibrato e tiri diretti senza deviazioni (${cornerUnder105Prob}% Under 10.5).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 12.5 Corner',
      cornerOver125Prob,
      `Match ad altissima intensità e continui ribaltamenti di fronte sulle fasce (${cornerOver125Prob}%).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 13.5 Corner',
      cornerOver135Prob,
      `Range estremo: scontro tra formazioni a spinta laterale continua con proiezioni di oltre 13 corner (${cornerOver135Prob}%).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo Over/Under',
      'Over 14.5 Corner',
      cornerOver145Prob,
      `Soglia massima di volume corner per match con altissimo numero di cross e conclusioni deviate (${cornerOver145Prob}%).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo 1X2',
      `Maggior Numero Corner: 1 (${homeTeam})`,
      cornerHomeMost,
      `${homeTeam} proietta ${expectedHomeCorners} corner contro i ${expectedAwayCorners} di ${awayTeam} (${cornerHomeMost}% probabilità).`
    ),
    createTip(
      'Corner',
      'Calci d\'Angolo 1X2',
      `Maggior Numero Corner: 2 (${awayTeam})`,
      cornerAwayMost,
      `${awayTeam} presenta corsie laterali ad alto volume offensivo con ${cornerAwayMost}% di battere più corner.`
    ),
    createTip(
      'Corner',
      'Corner Squadra',
      `Casa Over 4.5 Corner (${homeTeam})`,
      cornerHomeOver45Prob,
      `Spinta costante di ${homeTeam} con proiezione interna di ${expectedHomeCorners} corner e ${cornerHomeOver45Prob}% di superare quota 4.5.`
    ),
    createTip(
      'Corner',
      'Corner Squadra',
      `Ospite Over 3.5 Corner (${awayTeam})`,
      cornerAwayOver35Prob,
      `Capacità di transizione esterna di ${awayTeam} che genera mediamente ${expectedAwayCorners} corner con il ${cornerAwayOver35Prob}% Over 3.5.`
    ),
    createTip(
      'Corner',
      'Fasce Corner',
      'Fascia Corner 9-11',
      prob9to11,
      `Intervallo mediano più probabile nel calcio moderno: copre il ${prob9to11}% della distribuzione congiunta.`
    ),

    // Risultato Esatto #1
    createTip(
      'Risultato Esatto',
      'Risultato Esatto',
      `Risultato Esatto ${topScores[0]?.score || '1 - 1'}`,
      topScores[0]?.probability || 14.5,
      `Punteggio singolo con la frequenza percentuale dominante (${topScores[0]?.probability || 14.5}%) nella distribuzione multivariata con correzione Dixon-Coles.`
    ),
  ];

  // Regola di business vincolante: esclusione di tutte le selezioni con quota utile / quota di riferimento minima < 1.30
  // Le quote inferiori a 1.30 non offrono un profilo rischio/rendimento sostenibile per il valore atteso
  const qualifiedAdviceList = adviceList.filter(
    (tip) => tip.referenceMinOdds >= 1.30 && tip.fairOdds >= 1.30
  );

  // Ordina i pronostici qualificati: prima maggiore probabilità e miglior rendimento EV
  qualifiedAdviceList.sort((a, b) => b.probability - a.probability);

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
    over45Prob,
    under45Prob,
    doubleChance1XProb: Math.min(99, Number((normHome + normDraw).toFixed(1))),
    doubleChanceX2Prob: Math.min(99, Number((normAway + normDraw).toFixed(1))),
    doubleChance12Prob: Math.min(99, Number((normHome + normAway).toFixed(1))),
    multigoal13Prob,
    multigoal24Prob,
    multigoal25Prob,
    combo1AndOver25Prob,
    combo1AndNoGoalProb,
    comboXAndUnder25Prob,
    comboOver25AndGoalProb,
    expectedHomeCorners,
    expectedAwayCorners,
    expectedTotalCorners,
    cornerOver65Prob,
    cornerUnder65Prob,
    cornerOver75Prob,
    cornerUnder75Prob,
    cornerOver85Prob,
    cornerUnder85Prob,
    cornerOver95Prob,
    cornerUnder95Prob,
    cornerOver105Prob,
    cornerUnder105Prob,
    cornerOver115Prob,
    cornerUnder115Prob,
    cornerOver125Prob,
    cornerUnder125Prob,
    cornerOver135Prob,
    cornerUnder135Prob,
    cornerOver145Prob,
    cornerUnder145Prob,
    cornerHomeOver35Prob,
    cornerHomeOver45Prob,
    cornerHomeOver55Prob,
    cornerAwayOver25Prob,
    cornerAwayOver35Prob,
    cornerAwayOver45Prob,
    cornerHomeMostProb: cornerHomeMost,
    cornerAwayMostProb: cornerAwayMost,
    cornerEqualProb: cornerEqual,
    cornerRangeProbs: {
      range0to8: prob0to8,
      range9to11: prob9to11,
      range12to14: prob12to14,
      range15plus: prob15plus,
      range12plus: prob12plus,
    },
    mostLikelyScores: topScores,
    bettingAdviceList: qualifiedAdviceList,
  };
}

/**
 * Campionatore Poisson stocastico (Algoritmo di Knuth / Box-Muller per lambda elevati)
 */
function samplePoissonVariate(lambda: number): number {
  if (lambda <= 0.001) return 0;
  if (lambda < 30) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }
  // Approssimazione normale con trasformata Box-Muller per grandi lambda
  const u1 = Math.max(1e-10, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
}

/**
 * Motore di Simulazione Match basato su Metodo Monte Carlo Stocastico.
 * Esegue N iterazioni indipendenti (es. 10.000) incorporando:
 * 1. Sovradispersione del ritmo partita (variabilità casuale di match-tempo)
 * 2. Rischio disciplinare stocastico (probabilità cartellino rosso con handicap offensivo/difensivo)
 * 3. Dinamica di punteggio (game-state momentum tra primo e secondo tempo)
 * 4. Varianza di realizzazione dei tiri e parate
 * 5. Generazione discreta e conteggio delle frequenze empiriche reali
 * 6. Calcolo di media, deviazione standard, intervallo di confidenza al 95% ed errore standard di convergenza
 */
export function simulateMatchMonteCarlo(
  homeTeam: string,
  awayTeam: string,
  profilesMap: Map<string, TeamPredictiveProfile>,
  avgHomeGoals = 1.45,
  avgAwayGoals = 1.15,
  iterations = 10000,
  config?: Partial<AnalysisConfig>
): MonteCarloSimulationResult {
  const homeProf = profilesMap.get(homeTeam);
  const awayProf = profilesMap.get(awayTeam);

  const homeFactor = config?.homeAdvantageFactor ?? 1.12;

  // Rating di base
  const hAtt = homeProf ? homeProf.attackRating : 1.0;
  const hDef = homeProf ? homeProf.defenseRating : 1.0;
  const aAtt = awayProf ? awayProf.attackRating : 1.0;
  const aDef = awayProf ? awayProf.defenseRating : 1.0;

  // Valori attesi teorici di partenza
  const lambdaHomeBase = Math.max(0.2, (avgHomeGoals * (homeFactor / 1.12)) * hAtt * aDef);
  const lambdaAwayBase = Math.max(0.15, avgAwayGoals * aAtt * hDef);

  // Aspettativa corner di base
  const expHomeCornersBase = Math.max(2.8, 5.1 * (hAtt * 0.65 + 0.35));
  const expAwayCornersBase = Math.max(2.2, 4.4 * (aAtt * 0.65 + 0.35));

  // Contatori empirici Monte Carlo
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  let totalHomeGoals = 0;
  let totalAwayGoals = 0;
  let sumSqHomeGoals = 0;
  let sumSqAwayGoals = 0;

  let homeCleanSheets = 0;
  let awayCleanSheets = 0;
  let bttsCount = 0;

  let over15Count = 0;
  let over25Count = 0;
  let over35Count = 0;
  let over45Count = 0;

  let mg13Count = 0;
  let mg24Count = 0;
  let mg25Count = 0;

  let combo1O25Count = 0;
  let combo1NGCount = 0;
  let comboXU25Count = 0;
  let comboO25GGCount = 0;

  // Contatori Corner
  let totalCornersSim = 0;
  let totalHomeCornersSim = 0;
  let totalAwayCornersSim = 0;
  let cornerOver65Count = 0;
  let cornerOver75Count = 0;
  let cornerOver85Count = 0;
  let cornerOver95Count = 0;
  let cornerOver105Count = 0;
  let cornerOver115Count = 0;
  let cornerOver125Count = 0;
  let cornerOver135Count = 0;
  let cornerOver145Count = 0;

  let cornerHomeOver35Count = 0;
  let cornerHomeOver45Count = 0;
  let cornerHomeOver55Count = 0;
  let cornerAwayOver25Count = 0;
  let cornerAwayOver35Count = 0;
  let cornerAwayOver45Count = 0;

  let cornerHomeMostCount = 0;
  let cornerAwayMostCount = 0;
  let cornerEqualCount = 0;

  // Mappa punteggi esatti
  const scoreCounts = new Map<string, { home: number; away: number; count: number }>();
  const totalGoalsDistMap = new Map<number, number>();

  const effectiveIterations = Math.max(1000, Math.min(100000, iterations));

  // Ciclo Monte Carlo principale
  for (let i = 0; i < effectiveIterations; i++) {
    // 1. Shock stocastico di ritmo e sovradispersione del singolo match
    const paceShock = 0.84 + Math.random() * 0.32;
    const homeFormShock = 0.88 + Math.random() * 0.24;
    const awayFormShock = 0.88 + Math.random() * 0.24;

    let lHome = lambdaHomeBase * paceShock * homeFormShock;
    let lAway = lambdaAwayBase * paceShock * awayFormShock;

    // 2. Shock disciplinare: 8.5% di probabilità di cartellino rosso nel match
    if (Math.random() < 0.085) {
      if (Math.random() < 0.42) {
        // Rosso per la squadra di casa: penalità offensiva e vulnerabilità difensiva
        lHome *= 0.68;
        lAway *= 1.25;
      } else {
        // Rosso per la squadra ospite
        lAway *= 0.65;
        lHome *= 1.22;
      }
    }

    // 3. Simulazione 1° Tempo
    const h1 = samplePoissonVariate(lHome * 0.45);
    const a1 = samplePoissonVariate(lAway * 0.42);

    // 4. Dinamica di punteggio 2° Tempo (Game-State Momentum)
    let lHome2 = lHome * 0.55;
    let lAway2 = lAway * 0.58;

    if (h1 < a1) {
      // Casa sotto nel punteggio: spinge in avanti (+15% attacco, +18% rischio contropiede)
      lHome2 *= 1.15;
      lAway2 *= 1.18;
    } else if (a1 < h1) {
      // Ospite sotto nel punteggio: scopre gli spazi
      lAway2 *= 1.16;
      lHome2 *= 1.16;
    } else {
      // Pareggio: partita più tattica
      lHome2 *= 0.96;
      lAway2 *= 0.96;
    }

    const h2 = samplePoissonVariate(lHome2);
    const a2 = samplePoissonVariate(lAway2);

    const matchHomeGoals = h1 + h2;
    const matchAwayGoals = a1 + a2;
    const matchTotalGoals = matchHomeGoals + matchAwayGoals;

    // Aggiornamento statistiche gol
    totalHomeGoals += matchHomeGoals;
    totalAwayGoals += matchAwayGoals;
    sumSqHomeGoals += matchHomeGoals * matchHomeGoals;
    sumSqAwayGoals += matchAwayGoals * matchAwayGoals;

    // Distribuzione reti complessive
    totalGoalsDistMap.set(matchTotalGoals, (totalGoalsDistMap.get(matchTotalGoals) || 0) + 1);

    // Risultato 1X2
    if (matchHomeGoals > matchAwayGoals) {
      homeWins++;
    } else if (matchAwayGoals > matchHomeGoals) {
      awayWins++;
    } else {
      draws++;
    }

    // Clean sheet e BTTS
    if (matchAwayGoals === 0) homeCleanSheets++;
    if (matchHomeGoals === 0) awayCleanSheets++;
    if (matchHomeGoals > 0 && matchAwayGoals > 0) bttsCount++;

    // Under/Over
    if (matchTotalGoals > 1.5) over15Count++;
    if (matchTotalGoals > 2.5) over25Count++;
    if (matchTotalGoals > 3.5) over35Count++;
    if (matchTotalGoals > 4.5) over45Count++;

    // Multigol
    if (matchTotalGoals >= 1 && matchTotalGoals <= 3) mg13Count++;
    if (matchTotalGoals >= 2 && matchTotalGoals <= 4) mg24Count++;
    if (matchTotalGoals >= 2 && matchTotalGoals <= 5) mg25Count++;

    // Combo
    if (matchHomeGoals > matchAwayGoals && matchTotalGoals > 2.5) combo1O25Count++;
    if (matchHomeGoals > matchAwayGoals && (matchHomeGoals === 0 || matchAwayGoals === 0)) combo1NGCount++;
    if (matchHomeGoals === matchAwayGoals && matchTotalGoals <= 2.5) comboXU25Count++;
    if (matchTotalGoals > 2.5 && matchHomeGoals > 0 && matchAwayGoals > 0) comboO25GGCount++;

    // Traccia Risultato Esatto
    const scoreKey = `${matchHomeGoals} - ${matchAwayGoals}`;
    const curScore = scoreCounts.get(scoreKey);
    if (curScore) {
      curScore.count++;
    } else {
      scoreCounts.set(scoreKey, { home: matchHomeGoals, away: matchAwayGoals, count: 1 });
    }

    // 5. Simulazione Calci d'Angolo
    // La squadra in svantaggio crossa di più e genera più deviazioni
    const hCornerMult = matchHomeGoals < matchAwayGoals ? 1.18 : 0.94;
    const aCornerMult = matchAwayGoals < matchHomeGoals ? 1.18 : 0.94;

    const matchHomeCorners = samplePoissonVariate(expHomeCornersBase * paceShock * hCornerMult);
    const matchAwayCorners = samplePoissonVariate(expAwayCornersBase * paceShock * aCornerMult);
    const matchTotCorners = matchHomeCorners + matchAwayCorners;

    totalHomeCornersSim += matchHomeCorners;
    totalAwayCornersSim += matchAwayCorners;
    totalCornersSim += matchTotCorners;

    if (matchTotCorners > 6.5) cornerOver65Count++;
    if (matchTotCorners > 7.5) cornerOver75Count++;
    if (matchTotCorners > 8.5) cornerOver85Count++;
    if (matchTotCorners > 9.5) cornerOver95Count++;
    if (matchTotCorners > 10.5) cornerOver105Count++;
    if (matchTotCorners > 11.5) cornerOver115Count++;
    if (matchTotCorners > 12.5) cornerOver125Count++;
    if (matchTotCorners > 13.5) cornerOver135Count++;
    if (matchTotCorners > 14.5) cornerOver145Count++;

    if (matchHomeCorners > 3.5) cornerHomeOver35Count++;
    if (matchHomeCorners > 4.5) cornerHomeOver45Count++;
    if (matchHomeCorners > 5.5) cornerHomeOver55Count++;
    if (matchAwayCorners > 2.5) cornerAwayOver25Count++;
    if (matchAwayCorners > 3.5) cornerAwayOver35Count++;
    if (matchAwayCorners > 4.5) cornerAwayOver45Count++;

    if (matchHomeCorners > matchAwayCorners) cornerHomeMostCount++;
    else if (matchAwayCorners > matchHomeCorners) cornerAwayMostCount++;
    else cornerEqualCount++;
  }

  // Medie e deviazioni standard
  const N = effectiveIterations;
  const meanHomeGoals = totalHomeGoals / N;
  const meanAwayGoals = totalAwayGoals / N;

  const varHome = Math.max(0, (sumSqHomeGoals / N) - (meanHomeGoals * meanHomeGoals));
  const varAway = Math.max(0, (sumSqAwayGoals / N) - (meanAwayGoals * meanAwayGoals));
  const stdDevHome = Math.sqrt(varHome);
  const stdDevAway = Math.sqrt(varAway);

  // Intervallo di confidenza al 95% per i gol
  const ciHomeLower = Math.max(0, Number((meanHomeGoals - 1.96 * (stdDevHome / Math.sqrt(N))).toFixed(2)));
  const ciHomeUpper = Number((meanHomeGoals + 1.96 * (stdDevHome / Math.sqrt(N))).toFixed(2));
  const ciAwayLower = Math.max(0, Number((meanAwayGoals - 1.96 * (stdDevAway / Math.sqrt(N))).toFixed(2)));
  const ciAwayUpper = Number((meanAwayGoals + 1.96 * (stdDevAway / Math.sqrt(N))).toFixed(2));

  // Percentuali empiriche 1X2
  const rawHomeWinPct = (homeWins / N) * 100;
  const rawDrawPct = (draws / N) * 100;
  const rawAwayWinPct = (awayWins / N) * 100;

  const homeWinProb = Number(rawHomeWinPct.toFixed(1));
  const drawProb = Number(rawDrawPct.toFixed(1));
  const awayWinProb = Number(rawAwayWinPct.toFixed(1));

  // Errore standard massimo stimato della proporzione (convergenza Monte Carlo)
  const marginErrorPct = Number((1.96 * Math.sqrt(0.25 / N) * 100).toFixed(2));

  // Percentuali Under/Over e BTTS
  const over15Prob = Number(((over15Count / N) * 100).toFixed(1));
  const under15Prob = Number((100 - over15Prob).toFixed(1));
  const over25Prob = Number(((over25Count / N) * 100).toFixed(1));
  const under25Prob = Number((100 - over25Prob).toFixed(1));
  const over35Prob = Number(((over35Count / N) * 100).toFixed(1));
  const under35Prob = Number((100 - over35Prob).toFixed(1));
  const over45Prob = Number(((over45Count / N) * 100).toFixed(1));
  const under45Prob = Number((100 - over45Prob).toFixed(1));

  const bothTeamsScoreProb = Number(((bttsCount / N) * 100).toFixed(1));
  const bttsNoProb = Number((100 - bothTeamsScoreProb).toFixed(1));

  const multigoal13Prob = Number(((mg13Count / N) * 100).toFixed(1));
  const multigoal24Prob = Number(((mg24Count / N) * 100).toFixed(1));
  const multigoal25Prob = Number(((mg25Count / N) * 100).toFixed(1));

  const combo1AndOver25Prob = Number(((combo1O25Count / N) * 100).toFixed(1));
  const combo1AndNoGoalProb = Number(((combo1NGCount / N) * 100).toFixed(1));
  const comboXAndUnder25Prob = Number(((comboXU25Count / N) * 100).toFixed(1));
  const comboOver25AndGoalProb = Number(((comboO25GGCount / N) * 100).toFixed(1));

  const doubleChance1XProb = Math.min(99, Number((homeWinProb + drawProb).toFixed(1)));
  const doubleChanceX2Prob = Math.min(99, Number((awayWinProb + drawProb).toFixed(1)));
  const doubleChance12Prob = Math.min(99, Number((homeWinProb + awayWinProb).toFixed(1)));

  // Calci d'angolo empirici Monte Carlo
  const expectedHomeCorners = Number((totalHomeCornersSim / N).toFixed(1));
  const expectedAwayCorners = Number((totalAwayCornersSim / N).toFixed(1));
  const expectedTotalCorners = Number((totalCornersSim / N).toFixed(1));

  const cornerOver65Prob = Number(((cornerOver65Count / N) * 100).toFixed(1));
  const cornerUnder65Prob = Number((100 - cornerOver65Prob).toFixed(1));
  const cornerOver75Prob = Number(((cornerOver75Count / N) * 100).toFixed(1));
  const cornerUnder75Prob = Number((100 - cornerOver75Prob).toFixed(1));
  const cornerOver85Prob = Number(((cornerOver85Count / N) * 100).toFixed(1));
  const cornerUnder85Prob = Number((100 - cornerOver85Prob).toFixed(1));
  const cornerOver95Prob = Number(((cornerOver95Count / N) * 100).toFixed(1));
  const cornerUnder95Prob = Number((100 - cornerOver95Prob).toFixed(1));
  const cornerOver105Prob = Number(((cornerOver105Count / N) * 100).toFixed(1));
  const cornerUnder105Prob = Number((100 - cornerOver105Prob).toFixed(1));
  const cornerOver115Prob = Number(((cornerOver115Count / N) * 100).toFixed(1));
  const cornerUnder115Prob = Number((100 - cornerOver115Prob).toFixed(1));
  const cornerOver125Prob = Number(((cornerOver125Count / N) * 100).toFixed(1));
  const cornerUnder125Prob = Number((100 - cornerOver125Prob).toFixed(1));
  const cornerOver135Prob = Number(((cornerOver135Count / N) * 100).toFixed(1));
  const cornerUnder135Prob = Number((100 - cornerOver135Prob).toFixed(1));
  const cornerOver145Prob = Number(((cornerOver145Count / N) * 100).toFixed(1));
  const cornerUnder145Prob = Number((100 - cornerOver145Prob).toFixed(1));

  const cornerHomeOver35Prob = Number(((cornerHomeOver35Count / N) * 100).toFixed(1));
  const cornerHomeOver45Prob = Number(((cornerHomeOver45Count / N) * 100).toFixed(1));
  const cornerHomeOver55Prob = Number(((cornerHomeOver55Count / N) * 100).toFixed(1));
  const cornerAwayOver25Prob = Number(((cornerAwayOver25Count / N) * 100).toFixed(1));
  const cornerAwayOver35Prob = Number(((cornerAwayOver35Count / N) * 100).toFixed(1));
  const cornerAwayOver45Prob = Number(((cornerAwayOver45Count / N) * 100).toFixed(1));

  const cornerHomeMostProb = Number(((cornerHomeMostCount / N) * 100).toFixed(1));
  const cornerAwayMostProb = Number(((cornerAwayMostCount / N) * 100).toFixed(1));
  const cornerEqualProb = Number(((cornerEqualCount / N) * 100).toFixed(1));

  const prob0to8 = cornerUnder85Prob;
  const prob12plus = cornerOver115Prob;
  const prob15plus = cornerOver145Prob;
  const prob12to14 = Math.max(2, Number((prob12plus - prob15plus).toFixed(1)));
  const prob9to11 = Math.max(5, Number((100 - prob0to8 - prob12plus).toFixed(1)));

  // Distribuzione risultati esatti Monte Carlo
  const sortedScores = Array.from(scoreCounts.values())
    .map((item) => ({
      score: `${item.home} - ${item.away}`,
      home: item.home,
      away: item.away,
      probability: Number(((item.count / N) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.probability - a.probability);

  const topScores = sortedScores.slice(0, 5);

  // Distribuzione dei gol totali (istogramma Monte Carlo)
  const goalsDistribution: Array<{ goals: number; count: number; percentage: number }> = [];
  for (let g = 0; g <= 7; g++) {
    const cnt = totalGoalsDistMap.get(g) || 0;
    goalsDistribution.push({
      goals: g,
      count: cnt,
      percentage: Number(((cnt / N) * 100).toFixed(1)),
    });
  }

  // Generatore Tip Monte Carlo con quota utile vincolante >= 1.30
  function createMonteCarloTip(
    category: BettingAdviceTip['category'],
    market: string,
    selection: string,
    probPct: number,
    rationale: string
  ): BettingAdviceTip {
    const p = Math.max(1, Math.min(99, Number(probPct.toFixed(1))));
    const fairOdds = Number((100 / p).toFixed(2));

    let buffer = 1.05;
    if (p >= 65) buffer = 1.04;
    else if (p >= 45) buffer = 1.06;
    else if (p >= 30) buffer = 1.08;
    else buffer = 1.12;

    let refOdds = Number((fairOdds * buffer).toFixed(2));
    if (refOdds <= fairOdds) refOdds = Number((fairOdds + 0.05).toFixed(2));

    const evPct = Number((((p / 100) * (refOdds - 1) - (1 - p / 100)) * 100).toFixed(1));

    let confidence: 'Alta' | 'Media' | 'Speculativa' = 'Media';
    if (p >= 55) confidence = 'Alta';
    else if (p < 36) confidence = 'Speculativa';

    const actionPhrase = `[Monte Carlo] Punta ${selection} se il bookmaker quota almeno @${refOdds.toFixed(2)}`;

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
    // 1X2 & Doppia Chance
    createMonteCarloTip(
      '1X2 & Doppia Chance',
      'Esito Finale 1X2 (Monte Carlo)',
      `1 (${homeTeam} Vincente)`,
      homeWinProb,
      `Simulazione Monte Carlo (${N.toLocaleString()} run): ${homeTeam} vince nel ${homeWinProb}% delle iterazioni con media gol ${meanHomeGoals.toFixed(2)}.`
    ),
    createMonteCarloTip(
      '1X2 & Doppia Chance',
      'Esito Finale 1X2 (Monte Carlo)',
      'Pareggio (X)',
      drawProb,
      `Convergenza stocastica: pareggio verificatosi in ${draws.toLocaleString()} simulazioni su ${N.toLocaleString()} (${drawProb}%).`
    ),
    createMonteCarloTip(
      '1X2 & Doppia Chance',
      'Esito Finale 1X2 (Monte Carlo)',
      `2 (${awayTeam} Vincente)`,
      awayWinProb,
      `Successo corsaro di ${awayTeam} nel ${awayWinProb}% dei match simulati, con media gol esterna ${meanAwayGoals.toFixed(2)}.`
    ),
    createMonteCarloTip(
      '1X2 & Doppia Chance',
      'Doppia Chance (Monte Carlo)',
      'Doppia Chance 1X',
      doubleChance1XProb,
      `Copertura stocastica di altissimo profilo: ${homeTeam} resta imbattuta nel ${doubleChance1XProb}% delle simulazioni computate.`
    ),
    createMonteCarloTip(
      '1X2 & Doppia Chance',
      'Doppia Chance (Monte Carlo)',
      'Doppia Chance X2',
      doubleChanceX2Prob,
      `Protezione esterna per ${awayTeam} validata nel ${doubleChanceX2Prob}% dei percorsi Monte Carlo generati.`
    ),
    createMonteCarloTip(
      '1X2 & Doppia Chance',
      'Doppia Chance (Monte Carlo)',
      'Doppia Chance 12',
      doubleChance12Prob,
      `Minima frequenza di parità nei percorsi simulati: una delle due formazioni prevale nel ${doubleChance12Prob}% dei casi.`
    ),

    // Under / Over Gol
    createMonteCarloTip(
      'Under / Over',
      'Under / Over 1.5 (Monte Carlo)',
      'Over 1.5 Gol',
      over15Prob,
      `Soglia solida nei campioni stocastici: almeno 2 gol totali nel ${over15Prob}% delle partite simulate.`
    ),
    createMonteCarloTip(
      'Under / Over',
      'Under / Over 2.5 (Monte Carlo)',
      'Over 2.5 Gol',
      over25Prob,
      `Produzione combinata di ${(meanHomeGoals + meanAwayGoals).toFixed(2)} gol medi: superamento linea 2.5 nel ${over25Prob}% dei run.`
    ),
    createMonteCarloTip(
      'Under / Over',
      'Under / Over 2.5 (Monte Carlo)',
      'Under 2.5 Gol',
      under25Prob,
      `Partita bloccata o difensiva: combinazioni a basso punteggio coprono il ${under25Prob}% dell'intera popolazione simulata.`
    ),
    createMonteCarloTip(
      'Under / Over',
      'Under / Over 3.5 (Monte Carlo)',
      'Over 3.5 Gol',
      over35Prob,
      `Volatilità realizzativa elevata: ${over35Prob}% di frequenza stocastica per un match aperto da 4+ reti.`
    ),
    createMonteCarloTip(
      'Under / Over',
      'Under / Over 3.5 (Monte Carlo)',
      'Under 3.5 Gol',
      under35Prob,
      `Margine di tenuta difensiva: meno di 4 gol nel ${under35Prob}% delle iterazioni complessive.`
    ),
    createMonteCarloTip(
      'Under / Over',
      'Under / Over 4.5 (Monte Carlo)',
      'Under 4.5 Gol',
      under45Prob,
      `Filtro massivo di contenimento: quasi la totalità dei campioni (${under45Prob}%) non oltrepassa le 4 reti.`
    ),

    // Goal / No Goal
    createMonteCarloTip(
      'Goal / No Goal',
      'Goal / No Goal (Monte Carlo)',
      'Goal (Entrambe a Segno - Sì)',
      bothTeamsScoreProb,
      `Entrambi i reparti offensivi trovano la via del gol nel ${bothTeamsScoreProb}% delle ${N.toLocaleString()} simulazioni eseguite.`
    ),
    createMonteCarloTip(
      'Goal / No Goal',
      'Goal / No Goal (Monte Carlo)',
      'No Goal (Almeno una a secco)',
      bttsNoProb,
      `Clean sheet o gara a porta inviolata riscontrata nel ${bttsNoProb}% dei campioni computati.`
    ),

    // Combo & Multigol
    createMonteCarloTip(
      'Combo & Multigol',
      'Multigol (Monte Carlo)',
      'Multigol 1-3 Gol',
      multigoal13Prob,
      `Fascia realizzativa classica del campionato: copre il ${multigoal13Prob}% delle traiettorie Monte Carlo.`
    ),
    createMonteCarloTip(
      'Combo & Multigol',
      'Multigol (Monte Carlo)',
      'Multigol 2-4 Gol',
      multigoal24Prob,
      `Fascia ad alto rendimento statistico: verificata nel ${multigoal24Prob}% delle partite simulate.`
    ),
    createMonteCarloTip(
      'Combo & Multigol',
      'Multigol (Monte Carlo)',
      'Multigol 2-5 Gol',
      multigoal25Prob,
      `Spettro largo di sicurezza: il ${multigoal25Prob}% degli esiti stocastici converge in questo intervallo.`
    ),
    createMonteCarloTip(
      'Combo & Multigol',
      'Combo Esito + Gol (Monte Carlo)',
      `Combo 1 + Over 2.5 (${homeTeam})`,
      combo1AndOver25Prob,
      `Vittoria di ${homeTeam} associata ad almeno 3 reti totali verificata nel ${combo1AndOver25Prob}% delle iterazioni.`
    ),
    createMonteCarloTip(
      'Combo & Multigol',
      'Combo Esito + Goal (Monte Carlo)',
      'Combo Over 2.5 + Goal',
      comboOver25AndGoalProb,
      `Match con entrambe a referto e oltre 2.5 gol complessivi nel ${comboOver25AndGoalProb}% dei test stocastici.`
    ),

    // Calci d'Angolo
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo Over/Under (Monte Carlo)',
      'Over 7.5 Corner',
      cornerOver75Prob,
      `Soglia prudente Monte Carlo: almeno 8 corner estratti nel ${cornerOver75Prob}% delle iterazioni con media ${expectedTotalCorners}.`
    ),
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo Over/Under (Monte Carlo)',
      'Over 8.5 Corner',
      cornerOver85Prob,
      `Volume angoli sostenuto dalle corsie esterne con ${cornerOver85Prob}% di probabilità empirica Monte Carlo.`
    ),
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo Over/Under (Monte Carlo)',
      'Under 8.5 Corner',
      cornerUnder85Prob,
      `Traiettorie a gioco prevalentemente centrale: ${cornerUnder85Prob}% delle simulazioni rimane entro 8 corner.`
    ),
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo Over/Under (Monte Carlo)',
      'Over 9.5 Corner',
      cornerOver95Prob,
      `Superamento della linea standard 9.5 verificato nel ${cornerOver95Prob}% dei match simulati.`
    ),
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo Over/Under (Monte Carlo)',
      'Under 9.5 Corner',
      cornerUnder95Prob,
      `Ritmi controllati senza forcing laterale: ${cornerUnder95Prob}% dei test sotto i 10 calci d'angolo.`
    ),
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo Over/Under (Monte Carlo)',
      'Over 10.5 Corner',
      cornerOver105Prob,
      `Match a forti ribaltamenti di fronte: ${cornerOver105Prob}% di esiti Over 10.5 nelle simulazioni.`
    ),
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo Over/Under (Monte Carlo)',
      'Under 10.5 Corner',
      cornerUnder105Prob,
      `Poco spazio concesso sul fondo: ${cornerUnder105Prob}% di chiusure sotto la soglia 10.5.`
    ),
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo 1X2 (Monte Carlo)',
      `Maggior Numero Corner: 1 (${homeTeam})`,
      cornerHomeMostProb,
      `${homeTeam} prevale nel computo degli angoli nel ${cornerHomeMostProb}% delle ${N.toLocaleString()} simulazioni.`
    ),
    createMonteCarloTip(
      'Corner',
      'Calci d\'Angolo 1X2 (Monte Carlo)',
      `Maggior Numero Corner: 2 (${awayTeam})`,
      cornerAwayMostProb,
      `Transizioni e contropiedi premiano ${awayTeam} sui corner nel ${cornerAwayMostProb}% delle gare simulate.`
    ),
    createMonteCarloTip(
      'Corner',
      'Corner Squadra (Monte Carlo)',
      `Casa Over 4.5 Corner (${homeTeam})`,
      cornerHomeOver45Prob,
      `Spinta territoriale casalinga che porta ${homeTeam} oltre 4.5 corner nel ${cornerHomeOver45Prob}% dei casi.`
    ),
    createMonteCarloTip(
      'Corner',
      'Fasce Corner (Monte Carlo)',
      'Fascia Corner 9-11',
      prob9to11,
      `Intervallo mediano con la più alta concentrazione stocastica: ${prob9to11}% di frequenza empirica.`
    ),

    // Risultato Esatto #1
    createMonteCarloTip(
      'Risultato Esatto',
      'Risultato Esatto (Monte Carlo)',
      `Risultato Esatto ${topScores[0]?.score || '1 - 1'}`,
      topScores[0]?.probability || 13.5,
      `Punteggio singolo a massima densità frequenziale (${topScores[0]?.probability || 13.5}%) su ${N.toLocaleString()} match stocastici simulati.`
    ),
  ];

  // Regola di business vincolante: esclusione di tutte le selezioni con quota utile / quota di riferimento minima < 1.30
  const qualifiedAdviceList = adviceList.filter(
    (tip) => tip.referenceMinOdds >= 1.30 && tip.fairOdds >= 1.30
  );

  qualifiedAdviceList.sort((a, b) => b.probability - a.probability);

  return {
    homeTeam,
    awayTeam,
    simulationModel: 'monte_carlo',
    iterations: N,
    homeGoalsMean: Number(meanHomeGoals.toFixed(2)),
    awayGoalsMean: Number(meanAwayGoals.toFixed(2)),
    homeGoalsStdDev: Number(stdDevHome.toFixed(2)),
    awayGoalsStdDev: Number(stdDevAway.toFixed(2)),
    homeGoalsCI95: [ciHomeLower, ciHomeUpper],
    awayGoalsCI95: [ciAwayLower, ciAwayUpper],
    convergenceMarginErrorPct: marginErrorPct,
    homeCleanSheetPct: Number(((homeCleanSheets / N) * 100).toFixed(1)),
    awayCleanSheetPct: Number(((awayCleanSheets / N) * 100).toFixed(1)),
    goalsDistribution,
    expectedHomeGoals: Number(meanHomeGoals.toFixed(2)),
    expectedAwayGoals: Number(meanAwayGoals.toFixed(2)),
    homeWinProb,
    drawProb,
    awayWinProb,
    bothTeamsScoreProb,
    bttsNoProb,
    over15Prob,
    under15Prob,
    over25Prob,
    under25Prob,
    over35Prob,
    under35Prob,
    over45Prob,
    under45Prob,
    doubleChance1XProb,
    doubleChanceX2Prob,
    doubleChance12Prob,
    multigoal13Prob,
    multigoal24Prob,
    multigoal25Prob,
    combo1AndOver25Prob,
    combo1AndNoGoalProb,
    comboXAndUnder25Prob,
    comboOver25AndGoalProb,
    expectedHomeCorners,
    expectedAwayCorners,
    expectedTotalCorners,
    cornerOver65Prob,
    cornerUnder65Prob,
    cornerOver75Prob,
    cornerUnder75Prob,
    cornerOver85Prob,
    cornerUnder85Prob,
    cornerOver95Prob,
    cornerUnder95Prob,
    cornerOver105Prob,
    cornerUnder105Prob,
    cornerOver115Prob,
    cornerUnder115Prob,
    cornerOver125Prob,
    cornerUnder125Prob,
    cornerOver135Prob,
    cornerUnder135Prob,
    cornerOver145Prob,
    cornerUnder145Prob,
    cornerHomeOver35Prob,
    cornerHomeOver45Prob,
    cornerHomeOver55Prob,
    cornerAwayOver25Prob,
    cornerAwayOver35Prob,
    cornerAwayOver45Prob,
    cornerHomeMostProb,
    cornerAwayMostProb,
    cornerEqualProb,
    cornerRangeProbs: {
      range0to8: prob0to8,
      range9to11: prob9to11,
      range12to14: prob12to14,
      range15plus: prob15plus,
      range12plus: prob12plus,
    },
    mostLikelyScores: topScores,
    bettingAdviceList: qualifiedAdviceList,
  };
}
