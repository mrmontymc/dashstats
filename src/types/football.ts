export type MatchResult = 'H' | 'D' | 'A'; // Home, Draw, Away

export interface Match {
  id: string;
  matchday?: number;
  date: string;
  season?: string;
  competition?: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  result: MatchResult;
  halfTimeHomeGoals?: number;
  halfTimeAwayGoals?: number;
  homeShots?: number;
  awayShots?: number;
  homeShotsTarget?: number;
  awayShotsTarget?: number;
  homeCorners?: number;
  awayCorners?: number;
  homeFouls?: number;
  awayFouls?: number;
  homeYellows?: number;
  awayYellows?: number;
  homeReds?: number;
  awayReds?: number;
  homePossession?: number; // e.g. 54 (%)
  awayPossession?: number; // e.g. 46 (%)
  homeXg?: number;
  awayXg?: number;

  // Quote dei Bookmaker
  homeOdds?: number;      // Quota 1 (Vittoria Casa)
  drawOdds?: number;      // Quota X (Pareggio)
  awayOdds?: number;      // Quota 2 (Vittoria Ospite)
  over25Odds?: number;    // Quota Over 2.5
  under25Odds?: number;   // Quota Under 2.5
  bttsYesOdds?: number;   // Quota Entrambe a Segno (Sì)
  bttsNoOdds?: number;    // Quota Entrambe a Segno (No)
  cornerOver95Odds?: number; // Quota Over 9.5 Corner
  cornerUnder95Odds?: number; // Quota Under 9.5 Corner
  oddsSource?: string;        // Provenienza delle quote (es. Bet365, Pinnacle, Media Mercato)
  overround?: number;         // Margine del bookmaker (%)
}

export interface AnalysisConfig {
  recentFormWeight: number;    // Peso forma recente (0.1 - 0.85, default 0.40)
  homeAdvantageFactor: number; // Fattore campo (1.0 = disattivato, 1.12 = normale, 1.25 = forte)
  metricBasis: 'goals' | 'xg'; // Modello basato su Gol Reali o Expected Goals (xG)
  flatStake: number;           // Puntata fissa per calcolo rendimenti (es. 100€)
  minEvThreshold: number;      // Soglia minima ROI per mercati profittevoli (es. 4.0%)
  minSampleBets: number;       // Minimo partite/scommesse per validare un pattern (es. 8)
  preferredOddsSource?: string; // Filtro provenienza quote ('all' o specifico bookmaker)
  simulationsCount?: number;   // Iterazioni Monte Carlo (default 2000)
}

export interface ValueBetMatch {
  id: string;
  matchId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  market: '1' | 'X' | '2' | 'Over25' | 'Under25' | 'BTTS_Yes';
  marketLabel: string;
  bookmakerOdd: number;
  impliedProbPct: number;
  modelProbPct: number;
  edgePct: number;
  evPct: number;
  kellyStakePct: number;
  actualWon: boolean;
  oddsSource: string;
  profitFlat: number;
}

export interface OddsBracketAnalysis {
  bracketLabel: string;
  minOdds: number;
  maxOdds: number;
  market: '1' | 'X' | '2' | 'Over25' | 'Under25' | 'BTTS_Yes' | 'BTTS_No' | 'CornerOver95';
  totalBets: number;
  wonBets: number;
  actualHitRatePct: number;  // Frequenza reale %
  impliedProbPct: number;    // Probabilità implicita media dalla quota %
  probDeltaPct: number;       // actualHitRatePct - impliedProbPct (+ = bookmaker sottostima esito)
  avgOdds: number;
  totalProfitFlat: number;   // Con puntata fissa 100€
  roiPct: number;            // ROI %
  profitable: boolean;
}

export interface CornerMarketStats {
  totalMatches: number;
  totalCorners: number;
  avgCornersPerMatch: number;
  avgHomeCorners: number;
  avgAwayCorners: number;
  over85Pct: number;
  over95Pct: number;
  over105Pct: number;
  over115Pct: number;
  homeMostCornersPct: number;
  awayMostCornersPct: number;
  equalCornersPct: number;
  teamCornerRankings: Array<{
    team: string;
    avgCornersTaken: number;
    avgCornersConceded: number;
    avgTotalMatchCorners: number;
    over95Pct: number;
    homeCornersTakenAvg: number;
    awayCornersTakenAvg: number;
  }>;
}

export interface ProfitableMarketPattern {
  id: string;
  title: string;
  category: '1X2' | 'Gol / Under-Over' | 'Goal-NoGoal' | 'Calci d\'Angolo' | 'Squadra Specifica';
  description: string;
  marketType: string;
  teamScope?: string;
  filterCriteria: string;
  totalBets: number;
  wonBets: number;
  winRatePct: number;
  avgOdds: number;
  totalProfitFlat: number; // Flat stake 100€
  roiPct: number;
  confidenceScore: 'Molto Alto' | 'Alto' | 'Moderato';
}

export interface TeamStats {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: MatchResult[]; // Last 5 matches: H/D/A relative to this team: 'W' | 'D' | 'L'
  
  // Home record
  homePlayed: number;
  homeWon: number;
  homeDrawn: number;
  homeLost: number;
  homeGf: number;
  homeGa: number;
  homePoints: number;

  // Away record
  awayPlayed: number;
  awayWon: number;
  awayDrawn: number;
  awayLost: number;
  awayGf: number;
  awayGa: number;
  awayPoints: number;

  // Advanced metrics
  shotsTotal: number;
  shotsTargetTotal: number;
  shotsConcededTotal: number;
  shotsTargetConcededTotal: number;
  shotsPerGame: number;
  shotConversionRate: number; // goals / shots (%)
  shotAccuracy: number; // shots on target / total shots (%)
  avgPossession: number;
  cleanSheets: number;
  failedToScore: number;
  foulsTotal: number;
  yellowsTotal: number;
  redsTotal: number;
  totalXg: number;
  totalXgAgainst: number;
  xPts: number; // Expected points based on match xG
  xPtsDelta: number; // Points - xPts (indice di sovra/sotto performance o fortuna)
  xgPerShot: number; // Qualità media conclusione (xG / tiro)
  firstHalfGf: number; // Gol segnati nel 1° tempo
  secondHalfGf: number; // Gol segnati nel 2° tempo
  firstHalfGa: number; // Gol subiti nel 1° tempo
  secondHalfGa: number; // Gol subiti nel 2° tempo

  // Metriche avanzate elaborate
  eloRating: number;   // Rating Elo dinamico (base 1500)
  eloRank: number;     // Posizione nel ranking Elo
  homeDominanceRatio: number; // % punti conquistati in casa sul totale
  cornerDifferential: number; // Angoli battuti - Angoli subiti
  cornersTotal?: number;       // Calci d'angolo battuti
  cornersConcededTotal?: number; // Calci d'angolo concessi
  comebacksCount: number;     // Partite rimontate (punti ottenuti dopo essere stati in svantaggio al 1T)
}

export type TeamArchetype = 
  | 'Dominante ad Alto Volume'
  | 'Cinica in Transizione'
  | 'Fortezza Difensiva'
  | 'Equilibrata / Controllo'
  | 'Fragile / A Visto Aperto'
  | 'In Crisi Realizzativa';

export interface TeamPredictiveProfile {
  team: string;
  attackRating: number;      // Relativo alla media lega (es. 1.25 = +25% gol segnati)
  defenseRating: number;     // Relativo alla media lega (es. 0.80 = subisce 20% in meno)
  homeAttackAdvantage: number;
  homeDefenseAdvantage: number;
  
  // Momentum & Trend
  momentumScore: number;     // Indice tra -100 e +100
  momentumStatus: 'In ascesa forte' | 'Positivo' | 'Stabile' | 'In flessione' | 'Critico';
  recentPpg: number;         // Punti a partita ultime 5 gare
  seasonPpg: number;         // Punti a partita media stagionale
  ppgDelta: number;          // recentPpg - seasonPpg
  
  // Statistiche e affidabilità
  scoringConsistency: number; // 0-100 (inverso della deviazione standard)
  cleanSheetProb: number;     // %
  bttsProb: number;           // Both Teams To Score %
  over25Prob: number;         // Over 2.5 goals %
  
  // Regressione xG
  xgDelta: number;            // Goals - xG (positivo = overperforming/cinismo, negativo = sfortuna/spreco)
  regressionAlert?: 'Rischio flessione realizzativa' | 'Probabile ripresa realizzativa' | 'Rendimento conforme';

  // Archetipo tattico
  archetype: TeamArchetype;
  archetypeDescription: string;
  
  // Proiezione Monte Carlo estesa: Punti, Gol Fatti, Gol Subiti e Calci d'Angolo
  projectedPointsMedian: number;
  projectedPointsRange: [number, number]; // 10th - 90th percentile
  projectedGoalsForMedian: number;        // GF mediano simulato
  projectedGoalsForRange: [number, number];
  projectedGoalsAgainstMedian: number;    // GS mediano simulato
  projectedGoalsAgainstRange: [number, number];
  projectedGoalDiffMedian: number;        // DR mediana
  projectedCornersMedian: number;         // Calci d'angolo totali mediani simulati
  projectedCornersRange: [number, number];
  titleProbability: number;     // %
  top4Probability: number;      // %
  relegationProbability: number;// %
}

export interface BettingAdviceTip {
  market: string;              // e.g. "Over 2.5", "Esito 1", "Goal (BTTS)", "Corner Over 10.5"
  selection: string;           // e.g. "Over 2.5 Gol", "Vittoria Casa (1)", "Entrambe a Segno (Sì)"
  probability: number;         // e.g. 58.4 (%)
  fairOdds: number;            // e.g. 1.71 (100 / probability)
  referenceMinOdds: number;    // e.g. 1.80 (Quota minima consigliata per valore positivo)
  expectedValuePct: number;    // e.g. +5.3% at referenceMinOdds
  confidence: 'Alta' | 'Media' | 'Speculativa';
  actionPhrase: string;        // e.g. "Punta l'esito Over 2.5 se il bookmaker offre almeno @1.80"
  rationale: string;           // Tactical and statistical motivation
  category: '1X2 & Doppia Chance' | 'Under / Over' | 'Goal / No Goal' | 'Corner' | 'Risultato Esatto' | 'Combo & Multigol';
}

export interface MatchSimulationResult {
  homeTeam: string;
  awayTeam: string;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  bothTeamsScoreProb: number;
  bttsNoProb: number;
  over15Prob: number;
  under15Prob: number;
  over25Prob: number;
  under25Prob: number;
  over35Prob: number;
  under35Prob: number;
  over45Prob: number;
  under45Prob: number;
  doubleChance1XProb: number;
  doubleChanceX2Prob: number;
  doubleChance12Prob: number;
  multigoal13Prob: number;
  multigoal24Prob: number;
  multigoal25Prob: number;
  combo1AndOver25Prob: number;
  combo1AndNoGoalProb: number;
  comboXAndUnder25Prob: number;
  comboOver25AndGoalProb: number;
  
  // Range ampliato Calci d'Angolo
  expectedHomeCorners: number;
  expectedAwayCorners: number;
  expectedTotalCorners: number;
  cornerOver65Prob: number;
  cornerUnder65Prob: number;
  cornerOver75Prob: number;
  cornerUnder75Prob: number;
  cornerOver85Prob: number;
  cornerUnder85Prob: number;
  cornerOver95Prob: number;
  cornerUnder95Prob: number;
  cornerOver105Prob: number;
  cornerUnder105Prob: number;
  cornerOver115Prob: number;
  cornerUnder115Prob: number;
  cornerOver125Prob: number;
  cornerUnder125Prob: number;
  cornerOver135Prob: number;
  cornerUnder135Prob: number;
  cornerOver145Prob: number;
  cornerUnder145Prob: number;
  cornerHomeOver35Prob: number;
  cornerHomeOver45Prob: number;
  cornerHomeOver55Prob: number;
  cornerAwayOver25Prob: number;
  cornerAwayOver35Prob: number;
  cornerAwayOver45Prob: number;
  cornerHomeMostProb: number;
  cornerAwayMostProb: number;
  cornerEqualProb: number;
  cornerRangeProbs: {
    range0to8: number;
    range9to11: number;
    range12to14: number;
    range15plus: number;
    range12plus: number;
  };
  mostLikelyScores: Array<{
    score: string;
    home: number;
    away: number;
    probability: number;
  }>;
  bettingAdviceList: BettingAdviceTip[];
}

export interface MatchCustomOdds {
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  over15Odds?: number;
  under15Odds?: number;
  over25Odds?: number;
  under25Odds?: number;
  over35Odds?: number;
  under35Odds?: number;
  bttsYesOdds?: number;
  bttsNoOdds?: number;
  doubleChance1XOdds?: number;
  doubleChanceX2Odds?: number;
  cornerOver85Odds?: number;
  cornerOver95Odds?: number;
  cornerOver105Odds?: number;
  cornerOver115Odds?: number;
  cornerHomeOdds?: number;
  cornerAwayOdds?: number;
  sourceName?: string;
}

export interface HistoricalOddsMatchRecord {
  id: string;
  date: string;
  matchday?: number;
  competition?: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  result: MatchResult;
  halfTimeHomeGoals?: number;
  halfTimeAwayGoals?: number;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  over25Odds?: number;
  under25Odds?: number;
  bttsYesOdds?: number;
  bttsNoOdds?: number;
  homeXg?: number;
  awayXg?: number;
  oddsSource?: string;
}

export interface HistoricalOddsStats {
  totalMatches: number;
  tolerance: number;
  toleranceLabel: string;
  homeWinCount: number;
  homeWinPct: number;
  drawCount: number;
  drawPct: number;
  awayWinCount: number;
  awayWinPct: number;
  over25Count: number;
  over25Pct: number;
  under25Count: number;
  under25Pct: number;
  bttsYesCount: number;
  bttsYesPct: number;
  bttsNoCount: number;
  bttsNoPct: number;
  avgTotalGoals: number;
  avgHomeGoals: number;
  avgAwayGoals: number;

  // Rendimenti economici con puntata fissa 100€
  roiHomePct: number;
  profitHomeFlat: number;
  roiDrawPct: number;
  profitDrawFlat: number;
  roiAwayPct: number;
  profitAwayFlat: number;
  roiOver25Pct?: number;
  profitOver25Flat?: number;
  roiUnder25Pct?: number;
  profitUnder25Flat?: number;
  roiBttsYesPct?: number;
  profitBttsYesFlat?: number;

  bestOutcome: {
    market: string;
    roiPct: number;
    hitRatePct: number;
    profitFlat: number;
  };

  matchedMatches: HistoricalOddsMatchRecord[];
}

export interface FilterState {
  team: string;               // '' for all
  venue: 'all' | 'home' | 'away';
  outcome: 'all' | 'W' | 'D' | 'L';
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
  competition: string;
}

export interface StatisticalCorrelationPair {
  id: string;
  featureA: string;
  featureB: string;
  targetMarket: string;
  pearsonR: number;           // Correlazione lineare di Pearson (-1 a +1)
  spearmanRho: number;        // Correlazione di rango di Spearman (-1 a +1)
  sampleSize: number;
  strength: 'Forte' | 'Moderata' | 'Debole';
  interpretation: string;     // Spiegazione teorica e tattica
  bettingImplication: string; // Come sfruttarla sul mercato quote
}

export interface MarketConditionalProbability {
  id: string;
  condition: string;          // es. "Se vince la squadra di casa (Esito 1)"
  targetEvent: string;        // es. "Over 2.5 Gol"
  formulaSymbol: string;      // es. "P(Over 2.5 | 1)"
  empiricalPct: number;       // Calcolato sullo storico gare
  modelPct: number;           // Calcolato dalla distribuzione teorica
  sampleMatches: number;      // Quante gare soddisfano la condizione
  deltaPct: number;           // empiricalPct - modelPct
  marketSignal: string;       // Indicazione operativa per il betting
}

export interface NoVigComparisonResult {
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  rawOverroundPct: number;
  
  // Metodo Proporzionale (Standard)
  proportional: {
    homeProb: number;
    drawProb: number;
    awayProb: number;
    fairHome: number;
    fairDraw: number;
    fairAway: number;
  };

  // Metodo Shin (Modello informati z)
  shin: {
    zParameter: number;      // Frazione stimata scommettitori con informazione privata
    homeProb: number;
    drawProb: number;
    awayProb: number;
    fairHome: number;
    fairDraw: number;
    fairAway: number;
  };

  // Metodo Power (Esponenziale)
  power: {
    kExponent: number;
    homeProb: number;
    drawProb: number;
    awayProb: number;
    fairHome: number;
    fairDraw: number;
    fairAway: number;
  };
}

export interface PredictiveValidationMetrics {
  totalEvaluatedMatches: number;
  
  // Brier Scores (inferiore è migliore, 0 = perfetto)
  brierScore1X2: number;
  brierScoreOver25: number;
  brierScoreBtts: number;

  // Ranked Probability Score (per mercati ordinali H-D-A)
  rankedProbabilityScore: number;

  // Log Loss (Cross-Entropy Loss)
  logLoss1X2: number;

  // Overdispersion Check (Varianza vs Media gol per test Binomiale Negativa)
  meanGoals: number;
  varianceGoals: number;
  overdispersionRatio: number; // > 1.15 indica overdispersion (adatto a NegBinomial)
  isOverdispersed: boolean;

  // Bins di calibrazione (frequenza reale vs probabilità implicita/modello)
  calibrationBuckets: Array<{
    bucketLabel: string;
    expectedProbPct: number;
    observedFreqPct: number;
    sampleSize: number;
    calibrationGapPct: number;
  }>;
}

export interface MarketBiasReport {
  favoriteLongshotBias: {
    shortOddsRoiPct: number;   // Quote < 1.60
    longOddsRoiPct: number;    // Quote > 4.50
    gapPct: number;
    verdict: string;
  };
  drawBias: {
    drawActualPct: number;
    drawImpliedPct: number;
    drawRoiPct: number;
    verdict: string;
  };
  homeAdvantageBias: {
    homeWinActualPct: number;
    homeWinImpliedPct: number;
    homeRoiPct: number;
    verdict: string;
  };
}
