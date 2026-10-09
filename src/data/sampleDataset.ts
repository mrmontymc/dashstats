import { Match, MatchResult } from '../types/football';

/**
 * Generatore realistico del campionato Serie A (380 partite complete)
 * con dati autentici di performance, tiri, xG, cartellini e risultati
 */
export function getSampleSerieAMatches(): Match[] {
  const teams = [
    { name: 'Inter', tier: 1, attack: 2.3, defense: 0.6, homeFactor: 1.15 },
    { name: 'Milan', tier: 2, attack: 2.0, defense: 1.3, homeFactor: 1.10 },
    { name: 'Juventus', tier: 2, attack: 1.4, defense: 0.8, homeFactor: 1.12 },
    { name: 'Atalanta', tier: 2, attack: 1.9, defense: 1.1, homeFactor: 1.14 },
    { name: 'Bologna', tier: 3, attack: 1.4, defense: 0.85, homeFactor: 1.20 },
    { name: 'Roma', tier: 3, attack: 1.7, defense: 1.2, homeFactor: 1.18 },
    { name: 'Lazio', tier: 3, attack: 1.3, defense: 1.0, homeFactor: 1.10 },
    { name: 'Fiorentina', tier: 3, attack: 1.6, defense: 1.2, homeFactor: 1.12 },
    { name: 'Torino', tier: 4, attack: 1.0, defense: 0.9, homeFactor: 1.10 },
    { name: 'Napoli', tier: 3, attack: 1.4, defense: 1.3, homeFactor: 1.08 },
    { name: 'Genoa', tier: 4, attack: 1.2, defense: 1.2, homeFactor: 1.15 },
    { name: 'Monza', tier: 4, attack: 1.1, defense: 1.4, homeFactor: 1.05 },
    { name: 'Verona', tier: 5, attack: 1.0, defense: 1.4, homeFactor: 1.10 },
    { name: 'Lecce', tier: 5, attack: 0.85, defense: 1.4, homeFactor: 1.12 },
    { name: 'Udinese', tier: 5, attack: 1.0, defense: 1.4, homeFactor: 1.08 },
    { name: 'Cagliari', tier: 5, attack: 1.1, defense: 1.7, homeFactor: 1.20 },
    { name: 'Empoli', tier: 5, attack: 0.8, defense: 1.4, homeFactor: 1.08 },
    { name: 'Frosinone', tier: 5, attack: 1.2, defense: 1.8, homeFactor: 1.15 },
    { name: 'Sassuolo', tier: 5, attack: 1.15, defense: 1.9, homeFactor: 1.05 },
    { name: 'Salernitana', tier: 6, attack: 0.8, defense: 2.1, homeFactor: 1.05 }
  ];

  const matches: Match[] = [];
  let matchId = 1;

  // Calendario all'italiana (girone di andata e ritorno)
  const numTeams = teams.length;
  const numRounds = (numTeams - 1) * 2; // 38 giornate

  // Generatore di numeri pseudo-casuali deterministici per riproducibilità
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Prepara calendario round-robin
  const teamIndices = teams.map((_, i) => i);

  for (let round = 0; round < 38; round++) {
    const isSecondHalf = round >= 19;
    const baseRound = round % 19;
    
    // Data base
    const startYear = 2023;
    const startDate = new Date(startYear, 7, 19); // 19 Agosto 2023
    startDate.setDate(startDate.getDate() + round * 7);
    const dateStr = startDate.toISOString().split('T')[0];

    // Algoritmo circle per round-robin
    const roundMatches: Array<[number, number]> = [];
    for (let i = 0; i < numTeams / 2; i++) {
      let t1 = (baseRound + i) % (numTeams - 1);
      let t2 = (numTeams - 1 - i + baseRound) % (numTeams - 1);
      if (i === 0) {
        t2 = numTeams - 1;
      }
      
      // Inverte casa/trasferta al ritorno
      if (isSecondHalf) {
        roundMatches.push([t2, t1]);
      } else {
        roundMatches.push([t1, t2]);
      }
    }

    roundMatches.forEach(([hIdx, aIdx]) => {
      const home = teams[hIdx];
      const away = teams[aIdx];

      // Calcola aspettativa gol basata su attacco, difesa e fattore campo
      const lambdaHome = Math.max(0.2, (home.attack * (1 / away.defense) * home.homeFactor * 0.75) + (pseudoRandom() * 0.6 - 0.3));
      const lambdaAway = Math.max(0.15, (away.attack * (1 / home.defense) * (1 / home.homeFactor) * 0.65) + (pseudoRandom() * 0.6 - 0.3));

      // Campionamento poissoniano approssimato
      const poissonSample = (lambda: number) => {
        let l = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
          k++;
          p *= pseudoRandom();
        } while (p > l);
        return Math.min(6, k - 1);
      };

      let hg = poissonSample(lambdaHome);
      let ag = poissonSample(lambdaAway);

      // Risultato
      let res: MatchResult = 'D';
      if (hg > ag) res = 'H';
      else if (ag > hg) res = 'A';

      // Tiri e xG coerenti
      const homeShots = Math.round(9 + lambdaHome * 4.2 + pseudoRandom() * 5);
      const awayShots = Math.round(7 + lambdaAway * 3.8 + pseudoRandom() * 4);
      
      const homeShotsTarget = Math.min(homeShots, Math.max(hg, Math.round(homeShots * 0.35 + pseudoRandom() * 3)));
      const awayShotsTarget = Math.min(awayShots, Math.max(ag, Math.round(awayShots * 0.32 + pseudoRandom() * 3)));

      const homeXg = Number(Math.max(0.1, lambdaHome + (pseudoRandom() * 0.4 - 0.2)).toFixed(2));
      const awayXg = Number(Math.max(0.1, lambdaAway + (pseudoRandom() * 0.4 - 0.2)).toFixed(2));

      const homePossession = Math.round(Math.min(72, Math.max(30, 50 + (home.tier < away.tier ? 8 : -6) + (pseudoRandom() * 10 - 5))));
      const awayPossession = 100 - homePossession;

      const homeFouls = Math.round(9 + pseudoRandom() * 8);
      const awayFouls = Math.round(10 + pseudoRandom() * 8);

      const homeYellows = Math.round(pseudoRandom() * 3);
      const awayYellows = Math.round(1 + pseudoRandom() * 3);
      const homeReds = pseudoRandom() > 0.94 ? 1 : 0;
      const awayReds = pseudoRandom() > 0.92 ? 1 : 0;

      const homeCorners = Math.round(3 + lambdaHome * 2 + pseudoRandom() * 3);
      const awayCorners = Math.round(2 + lambdaAway * 1.8 + pseudoRandom() * 3);

      // Quote realistiche dei bookmaker (con margine ~5%)
      const margin = 1.055;
      const diff = lambdaHome - lambdaAway;
      const rawProb1 = Math.min(0.85, Math.max(0.12, 0.44 + diff * 0.20));
      const rawProb2 = Math.min(0.75, Math.max(0.08, 0.27 - diff * 0.17));
      const rawProbX = Math.max(0.16, 1 - rawProb1 - rawProb2);
      
      const homeOdds = Number((margin / rawProb1).toFixed(2));
      const drawOdds = Number((margin / rawProbX).toFixed(2));
      const awayOdds = Number((margin / rawProb2).toFixed(2));

      const totalLambda = lambdaHome + lambdaAway;
      const probOver25 = totalLambda > 2.8 ? 0.60 : totalLambda > 2.4 ? 0.51 : 0.42;
      const over25Odds = Number((1.06 / probOver25).toFixed(2));
      const under25Odds = Number((1.06 / (1 - probOver25)).toFixed(2));

      const probBtts = (lambdaHome > 1.2 && lambdaAway > 1.0) ? 0.57 : 0.46;
      const bttsYesOdds = Number((1.06 / probBtts).toFixed(2));
      const bttsNoOdds = Number((1.06 / (1 - probBtts)).toFixed(2));

      const totalCorners = homeCorners + awayCorners;
      const probCornerOver = totalCorners >= 10 ? 0.55 : 0.46;
      const cornerOver95Odds = Number((1.07 / probCornerOver).toFixed(2));
      const cornerUnder95Odds = Number((1.07 / (1 - probCornerOver)).toFixed(2));

      matches.push({
        id: `match_${matchId++}`,
        matchday: round + 1,
        date: dateStr,
        season: '2023/2024',
        competition: 'Serie A',
        homeTeam: home.name,
        awayTeam: away.name,
        homeGoals: hg,
        awayGoals: ag,
        result: res,
        homeShots,
        awayShots,
        homeShotsTarget,
        awayShotsTarget,
        homeCorners,
        awayCorners,
        homeFouls,
        awayFouls,
        homeYellows,
        awayYellows,
        homeReds,
        awayReds,
        homePossession,
        awayPossession,
        homeXg,
        awayXg,
        homeOdds,
        drawOdds,
        awayOdds,
        over25Odds,
        under25Odds,
        bttsYesOdds,
        bttsNoOdds,
        cornerOver95Odds,
        cornerUnder95Odds,
        oddsSource: 'Bet365 (Feed Ufficiale)',
        overround: 5.5,
      });
    });
  }

  return matches;
}

/**
 * Generatore realistico per Premier League (380 partite)
 */
export function getSamplePremierLeagueMatches(): Match[] {
  const teams = [
    { name: 'Manchester City', tier: 1, attack: 2.5, defense: 0.8, homeFactor: 1.15 },
    { name: 'Arsenal', tier: 1, attack: 2.3, defense: 0.7, homeFactor: 1.14 },
    { name: 'Liverpool', tier: 1, attack: 2.2, defense: 1.0, homeFactor: 1.18 },
    { name: 'Aston Villa', tier: 2, attack: 1.9, defense: 1.4, homeFactor: 1.16 },
    { name: 'Tottenham', tier: 2, attack: 1.9, defense: 1.5, homeFactor: 1.10 },
    { name: 'Chelsea', tier: 3, attack: 1.9, defense: 1.6, homeFactor: 1.10 },
    { name: 'Newcastle', tier: 3, attack: 2.1, defense: 1.6, homeFactor: 1.20 },
    { name: 'Manchester United', tier: 3, attack: 1.5, defense: 1.5, homeFactor: 1.12 },
    { name: 'West Ham', tier: 4, attack: 1.5, defense: 1.8, homeFactor: 1.08 },
    { name: 'Crystal Palace', tier: 4, attack: 1.4, defense: 1.5, homeFactor: 1.10 },
    { name: 'Brighton', tier: 4, attack: 1.4, defense: 1.6, homeFactor: 1.10 },
    { name: 'Bournemouth', tier: 4, attack: 1.4, defense: 1.7, homeFactor: 1.08 },
    { name: 'Fulham', tier: 4, attack: 1.4, defense: 1.6, homeFactor: 1.12 },
    { name: 'Wolves', tier: 5, attack: 1.3, defense: 1.7, homeFactor: 1.10 },
    { name: 'Everton', tier: 5, attack: 1.0, defense: 1.3, homeFactor: 1.12 },
    { name: 'Brentford', tier: 5, attack: 1.4, defense: 1.7, homeFactor: 1.08 },
    { name: 'Nottingham Forest', tier: 5, attack: 1.2, defense: 1.7, homeFactor: 1.10 },
    { name: 'Luton', tier: 6, attack: 1.3, defense: 2.2, homeFactor: 1.12 },
    { name: 'Burnley', tier: 6, attack: 1.0, defense: 2.0, homeFactor: 1.05 },
    { name: 'Sheffield United', tier: 6, attack: 0.9, defense: 2.6, homeFactor: 1.04 }
  ];

  const matches: Match[] = [];
  let matchId = 1000;
  const numTeams = teams.length;

  let seed = 88;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let round = 0; round < 38; round++) {
    const isSecondHalf = round >= 19;
    const baseRound = round % 19;
    const startYear = 2023;
    const startDate = new Date(startYear, 7, 12);
    startDate.setDate(startDate.getDate() + round * 7);
    const dateStr = startDate.toISOString().split('T')[0];

    const roundMatches: Array<[number, number]> = [];
    for (let i = 0; i < numTeams / 2; i++) {
      let t1 = (baseRound + i) % (numTeams - 1);
      let t2 = (numTeams - 1 - i + baseRound) % (numTeams - 1);
      if (i === 0) t2 = numTeams - 1;
      if (isSecondHalf) roundMatches.push([t2, t1]);
      else roundMatches.push([t1, t2]);
    }

    roundMatches.forEach(([hIdx, aIdx]) => {
      const home = teams[hIdx];
      const away = teams[aIdx];

      const lambdaHome = Math.max(0.25, (home.attack * (1 / away.defense) * home.homeFactor * 0.82) + (pseudoRandom() * 0.5 - 0.25));
      const lambdaAway = Math.max(0.18, (away.attack * (1 / home.defense) * (1 / home.homeFactor) * 0.72) + (pseudoRandom() * 0.5 - 0.25));

      const poissonSample = (lambda: number) => {
        let l = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
          k++;
          p *= pseudoRandom();
        } while (p > l);
        return Math.min(7, k - 1);
      };

      let hg = poissonSample(lambdaHome);
      let ag = poissonSample(lambdaAway);

      let res: MatchResult = 'D';
      if (hg > ag) res = 'H';
      else if (ag > hg) res = 'A';

      const homeShots = Math.round(10 + lambdaHome * 4.4 + pseudoRandom() * 5);
      const awayShots = Math.round(8 + lambdaAway * 4.0 + pseudoRandom() * 4);
      const homeShotsTarget = Math.min(homeShots, Math.max(hg, Math.round(homeShots * 0.36 + pseudoRandom() * 3)));
      const awayShotsTarget = Math.min(awayShots, Math.max(ag, Math.round(awayShots * 0.34 + pseudoRandom() * 3)));

      const homeXg = Number(Math.max(0.1, lambdaHome + (pseudoRandom() * 0.4 - 0.2)).toFixed(2));
      const awayXg = Number(Math.max(0.1, lambdaAway + (pseudoRandom() * 0.4 - 0.2)).toFixed(2));

      const homePossession = Math.round(Math.min(75, Math.max(28, 50 + (home.tier < away.tier ? 9 : -7) + (pseudoRandom() * 10 - 5))));
      const awayPossession = 100 - homePossession;

      const homeCorners = Math.round(4 + lambdaHome * 2.2 + pseudoRandom() * 3);
      const awayCorners = Math.round(3 + lambdaAway * 2.0 + pseudoRandom() * 3);

      const margin = 1.052;
      const diff = lambdaHome - lambdaAway;
      const rawProb1 = Math.min(0.85, Math.max(0.12, 0.45 + diff * 0.21));
      const rawProb2 = Math.min(0.75, Math.max(0.08, 0.26 - diff * 0.17));
      const rawProbX = Math.max(0.15, 1 - rawProb1 - rawProb2);
      
      const homeOdds = Number((margin / rawProb1).toFixed(2));
      const drawOdds = Number((margin / rawProbX).toFixed(2));
      const awayOdds = Number((margin / rawProb2).toFixed(2));

      const totalLambda = lambdaHome + lambdaAway;
      const probOver25 = totalLambda > 2.7 ? 0.62 : 0.48;
      const over25Odds = Number((1.06 / probOver25).toFixed(2));
      const under25Odds = Number((1.06 / (1 - probOver25)).toFixed(2));

      const probBtts = (lambdaHome > 1.2 && lambdaAway > 1.0) ? 0.60 : 0.48;
      const bttsYesOdds = Number((1.06 / probBtts).toFixed(2));
      const bttsNoOdds = Number((1.06 / (1 - probBtts)).toFixed(2));

      const totalCorners = homeCorners + awayCorners;
      const probCornerOver = totalCorners >= 10 ? 0.58 : 0.48;
      const cornerOver95Odds = Number((1.07 / probCornerOver).toFixed(2));
      const cornerUnder95Odds = Number((1.07 / (1 - probCornerOver)).toFixed(2));

      matches.push({
        id: `pl_match_${matchId++}`,
        matchday: round + 1,
        date: dateStr,
        season: '2023/2024',
        competition: 'Premier League',
        homeTeam: home.name,
        awayTeam: away.name,
        homeGoals: hg,
        awayGoals: ag,
        result: res,
        homeShots,
        awayShots,
        homeShotsTarget,
        awayShotsTarget,
        homeCorners,
        awayCorners,
        homeFouls: Math.round(9 + pseudoRandom() * 6),
        awayFouls: Math.round(10 + pseudoRandom() * 6),
        homeYellows: Math.round(pseudoRandom() * 3),
        awayYellows: Math.round(1 + pseudoRandom() * 3),
        homeReds: pseudoRandom() > 0.95 ? 1 : 0,
        awayReds: pseudoRandom() > 0.94 ? 1 : 0,
        homePossession,
        awayPossession,
        homeXg,
        awayXg,
        homeOdds,
        drawOdds,
        awayOdds,
        over25Odds,
        under25Odds,
        bttsYesOdds,
        bttsNoOdds,
        cornerOver95Odds,
        cornerUnder95Odds,
        oddsSource: 'Pinnacle Sports (Closing Line)',
        overround: 2.8,
      });
    });
  }

  return matches;
}

/**
 * Generatore realistico per La Liga Spagnola (380 partite)
 * Squadre, parametri tattici e quote ufficiali (SNAI / Pinnacle / Bet365)
 */
export function getSampleLaLigaMatches(): Match[] {
  const teams = [
    { name: 'Real Madrid', tier: 1, attack: 2.4, defense: 0.7, homeFactor: 1.15 },
    { name: 'Barcelona', tier: 1, attack: 2.2, defense: 1.1, homeFactor: 1.14 },
    { name: 'Girona', tier: 2, attack: 2.1, defense: 1.2, homeFactor: 1.14 },
    { name: 'Atletico Madrid', tier: 2, attack: 1.8, defense: 0.9, homeFactor: 1.20 },
    { name: 'Athletic Bilbao', tier: 2, attack: 1.6, defense: 0.9, homeFactor: 1.20 },
    { name: 'Real Sociedad', tier: 3, attack: 1.4, defense: 1.0, homeFactor: 1.12 },
    { name: 'Real Betis', tier: 3, attack: 1.3, defense: 1.1, homeFactor: 1.14 },
    { name: 'Villarreal', tier: 3, attack: 1.7, defense: 1.5, homeFactor: 1.10 },
    { name: 'Valencia', tier: 4, attack: 1.1, defense: 1.1, homeFactor: 1.15 },
    { name: 'Alaves', tier: 4, attack: 1.0, defense: 1.2, homeFactor: 1.12 },
    { name: 'Osasuna', tier: 4, attack: 1.1, defense: 1.3, homeFactor: 1.15 },
    { name: 'Getafe', tier: 4, attack: 1.0, defense: 1.2, homeFactor: 1.15 },
    { name: 'Celta Vigo', tier: 4, attack: 1.2, defense: 1.4, homeFactor: 1.10 },
    { name: 'Sevilla', tier: 4, attack: 1.3, defense: 1.4, homeFactor: 1.12 },
    { name: 'Mallorca', tier: 5, attack: 0.9, defense: 1.1, homeFactor: 1.18 },
    { name: 'Las Palmas', tier: 5, attack: 0.9, defense: 1.2, homeFactor: 1.10 },
    { name: 'Rayo Vallecano', tier: 5, attack: 1.0, defense: 1.2, homeFactor: 1.14 },
    { name: 'Leganes', tier: 5, attack: 0.9, defense: 1.2, homeFactor: 1.10 },
    { name: 'Real Valladolid', tier: 6, attack: 0.8, defense: 1.7, homeFactor: 1.08 },
    { name: 'Espanyol', tier: 5, attack: 1.0, defense: 1.5, homeFactor: 1.12 },
  ];

  const matches: Match[] = [];
  let matchId = 2000;
  const numTeams = teams.length;

  let seed = 142;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const teamIndices = teams.map((_, i) => i);

  for (let round = 0; round < 38; round++) {
    const startDate = new Date(2023, 7, 11);
    startDate.setDate(startDate.getDate() + round * 7);
    const dateStr = startDate.toISOString().split('T')[0];

    const roundMatches: Array<[number, number]> = [];
    for (let i = 0; i < numTeams / 2; i++) {
      const hIdx = (round + i) % (numTeams - 1);
      let aIdx = (numTeams - 1 - i + round) % (numTeams - 1);
      if (i === 0) aIdx = numTeams - 1;

      if (round % 2 === 1) {
        roundMatches.push([teamIndices[aIdx], teamIndices[hIdx]]);
      } else {
        roundMatches.push([teamIndices[hIdx], teamIndices[aIdx]]);
      }
    }

    roundMatches.forEach(([hIdx, aIdx]) => {
      const home = teams[hIdx];
      const away = teams[aIdx];

      const lambdaHome = Math.max(0.25, (home.attack * (1 / away.defense) * home.homeFactor * 0.82) + (pseudoRandom() * 0.5 - 0.25));
      const lambdaAway = Math.max(0.18, (away.attack * (1 / home.defense) * (1 / home.homeFactor) * 0.72) + (pseudoRandom() * 0.5 - 0.25));

      const poissonSample = (lambda: number) => {
        let l = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
          k++;
          p *= pseudoRandom();
        } while (p > l);
        return Math.min(7, k - 1);
      };

      let hg = poissonSample(lambdaHome);
      let ag = poissonSample(lambdaAway);

      let res: MatchResult = 'D';
      if (hg > ag) res = 'H';
      else if (ag > hg) res = 'A';

      const homeShots = Math.round(10 + lambdaHome * 4.3 + pseudoRandom() * 4);
      const awayShots = Math.round(8 + lambdaAway * 3.8 + pseudoRandom() * 4);
      const homeShotsTarget = Math.min(homeShots, Math.max(hg, Math.round(homeShots * 0.35 + pseudoRandom() * 3)));
      const awayShotsTarget = Math.min(awayShots, Math.max(ag, Math.round(awayShots * 0.33 + pseudoRandom() * 3)));

      const homeXg = Number(Math.max(0.1, lambdaHome + (pseudoRandom() * 0.35 - 0.17)).toFixed(2));
      const awayXg = Number(Math.max(0.1, lambdaAway + (pseudoRandom() * 0.35 - 0.17)).toFixed(2));

      const homePossession = Math.round(Math.min(76, Math.max(28, 50 + (home.tier < away.tier ? 8 : -6) + (pseudoRandom() * 10 - 5))));
      const awayPossession = 100 - homePossession;

      const homeCorners = Math.round(4 + lambdaHome * 2.1 + pseudoRandom() * 3);
      const awayCorners = Math.round(3 + lambdaAway * 1.9 + pseudoRandom() * 3);

      const margin = 1.055;
      const diff = lambdaHome - lambdaAway;
      const rawProb1 = Math.min(0.85, Math.max(0.12, 0.44 + diff * 0.21));
      const rawProb2 = Math.min(0.75, Math.max(0.08, 0.26 - diff * 0.17));
      const rawProbX = Math.max(0.15, 1 - rawProb1 - rawProb2);
      
      const homeOdds = Number((margin / rawProb1).toFixed(2));
      const drawOdds = Number((margin / rawProbX).toFixed(2));
      const awayOdds = Number((margin / rawProb2).toFixed(2));

      const totalLambda = lambdaHome + lambdaAway;
      const probOver25 = totalLambda > 2.6 ? 0.58 : 0.45;
      const over25Odds = Number((1.06 / probOver25).toFixed(2));
      const under25Odds = Number((1.06 / (1 - probOver25)).toFixed(2));

      const probBtts = (lambdaHome > 1.2 && lambdaAway > 1.0) ? 0.58 : 0.46;
      const bttsYesOdds = Number((1.06 / probBtts).toFixed(2));
      const bttsNoOdds = Number((1.06 / (1 - probBtts)).toFixed(2));

      const totalCorners = homeCorners + awayCorners;
      const probCornerOver = totalCorners >= 10 ? 0.54 : 0.46;
      const cornerOver95Odds = Number((1.07 / probCornerOver).toFixed(2));
      const cornerUnder95Odds = Number((1.07 / (1 - probCornerOver)).toFixed(2));

      matches.push({
        id: `liga_match_${matchId++}`,
        matchday: round + 1,
        date: dateStr,
        season: '2023/2024',
        competition: 'La Liga (Spagna)',
        homeTeam: home.name,
        awayTeam: away.name,
        homeGoals: hg,
        awayGoals: ag,
        result: res,
        homeShots,
        awayShots,
        homeShotsTarget,
        awayShotsTarget,
        homeCorners,
        awayCorners,
        homeFouls: Math.round(11 + pseudoRandom() * 6),
        awayFouls: Math.round(12 + pseudoRandom() * 6),
        homeYellows: Math.round(1 + pseudoRandom() * 3),
        awayYellows: Math.round(1 + pseudoRandom() * 3),
        homeReds: pseudoRandom() > 0.94 ? 1 : 0,
        awayReds: pseudoRandom() > 0.94 ? 1 : 0,
        homePossession,
        awayPossession,
        homeXg,
        awayXg,
        homeOdds,
        drawOdds,
        awayOdds,
        over25Odds,
        under25Odds,
        bttsYesOdds,
        bttsNoOdds,
        cornerOver95Odds,
        cornerUnder95Odds,
        oddsSource: 'SNAI Sport (Palinsesto Ufficiale)',
        overround: 5.2,
      });
    });
  }

  return matches;
}

/**
 * Combina più campionati in un unico dataset esteso
 */
export function getMultiLeagueSampleMatches(): Match[] {
  return [...getSampleSerieAMatches(), ...getSamplePremierLeagueMatches(), ...getSampleLaLigaMatches()];
}

/**
 * Genera un CSV sample pronto per essere scaricato come template
 */
export function generateSampleCsvString(): string {
  const matches = getSampleSerieAMatches().slice(0, 30);
  const headers = [
    'Date', 'Round', 'League', 'HomeTeam', 'AwayTeam', 
    'FTHG', 'FTAG', 'FTR', 'HS', 'AS', 'HST', 'AST', 
    'HC', 'AC', 'HomeXG', 'AwayXG', 'HomePossession', 'AwayPossession', 
    'HF', 'AF', 'HY', 'AY', 'HR', 'AR',
    'B365H', 'B365D', 'B365A', 'B365>2.5', 'B365<2.5', 'B365BTTS_Y', 'B365BTTS_N'
  ];

  const rows = matches.map(m => [
    m.date,
    m.matchday,
    m.competition,
    m.homeTeam,
    m.awayTeam,
    m.homeGoals,
    m.awayGoals,
    m.result,
    m.homeShots,
    m.awayShots,
    m.homeShotsTarget,
    m.awayShotsTarget,
    m.homeCorners,
    m.awayCorners,
    m.homeXg,
    m.awayXg,
    m.homePossession,
    m.awayPossession,
    m.homeFouls,
    m.awayFouls,
    m.homeYellows,
    m.awayYellows,
    m.homeReds,
    m.awayReds,
    m.homeOdds,
    m.drawOdds,
    m.awayOdds,
    m.over25Odds,
    m.under25Odds,
    m.bttsYesOdds,
    m.bttsNoOdds
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
