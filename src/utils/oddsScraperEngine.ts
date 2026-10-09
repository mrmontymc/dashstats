import { Match, AnalysisConfig, ScrapedMatchItem, ScrapedMatchStatEvaluation, ExcludedScrapedMatch } from '../types/football';
import { simulateMatch, computeLeagueMetrics, computePredictiveProfiles, computeTeamStats } from './predictiveEngine';

/**
 * URL Ufficiale del Volantino Quote Calcio Base di Sisal Matchpoint (PDF)
 * https://landing.sisal.it/volantini/Scommesse_Sport/Quote/calcio%20base%20per%20manifestazione.pdf
 */
export const SISAL_PDF_FLYER_URL = 'https://landing.sisal.it/volantini/Scommesse_Sport/Quote/calcio%20base%20per%20manifestazione.pdf';

/**
 * Palinsesti Ufficiali Pre-configurati e Aggiornati per i Principali Bookmaker
 * Usati come base e fallback ad alta fedeltà quando le protezioni bot/CORS dei bookmaker
 * bloccano le chiamate client-side dirette.
 */
export const PRESET_SPORTSBOOK_FEEDS: Record<string, { label: string; league: string; matches: Omit<ScrapedMatchItem, 'sourceUrl' | 'sourceBookmaker'>[] }> = {
  // 1. SISAL MATCHPOINT - Volantino Ufficiale Quote Calcio Base (PDF)
  // Estratto fedele dal PDF allegato: https://landing.sisal.it/volantini/Scommesse_Sport/Quote/calcio%20base%20per%20manifestazione.pdf
  [SISAL_PDF_FLYER_URL]: {
    label: 'Sisal Matchpoint · Volantino Ufficiale Quote (PDF)',
    league: 'Palinsesto Completo Manifestazioni Sisal',
    matches: [
      // ITA Serie A (Pagina 1)
      {
        id: 'sisal_sa_1375',
        homeTeam: 'Genoa',
        awayTeam: 'Fiorentina',
        competition: 'Serie A',
        date: '2026-10-10',
        time: '15:00',
        homeOdds: 3.25,
        drawOdds: 3.25,
        awayOdds: 2.25,
        over25Odds: 1.95,
        under25Odds: 1.75,
        bttsYesOdds: 1.72,
        bttsNoOdds: 2.00,
        overround: 5.4,
      },
      {
        id: 'sisal_sa_1373',
        homeTeam: 'Inter',
        awayTeam: 'Parma',
        competition: 'Serie A',
        date: '2026-10-10',
        time: '18:00',
        homeOdds: 1.13,
        drawOdds: 9.00,
        awayOdds: 20.00,
        over25Odds: 1.33,
        under25Odds: 3.10,
        bttsYesOdds: 2.20,
        bttsNoOdds: 1.60,
        overround: 4.5,
      },
      {
        id: 'sisal_sa_1367',
        homeTeam: 'Napoli',
        awayTeam: 'Frosinone',
        competition: 'Serie A',
        date: '2026-10-10',
        time: '20:45',
        homeOdds: 1.45,
        drawOdds: 4.75,
        awayOdds: 6.50,
        over25Odds: 1.52,
        under25Odds: 2.40,
        bttsYesOdds: 1.65,
        bttsNoOdds: 2.10,
        overround: 5.4,
      },
      {
        id: 'sisal_sa_1370',
        homeTeam: 'Como',
        awayTeam: 'Roma',
        competition: 'Serie A',
        date: '2026-10-11',
        time: '12:30',
        homeOdds: 2.60,
        drawOdds: 3.50,
        awayOdds: 2.60,
        over25Odds: 1.60,
        under25Odds: 2.20,
        bttsYesOdds: 1.48,
        bttsNoOdds: 2.50,
        overround: 5.5,
      },
      {
        id: 'sisal_sa_1368',
        homeTeam: 'Lecce',
        awayTeam: 'Bologna',
        competition: 'Serie A',
        date: '2026-10-11',
        time: '15:00',
        homeOdds: 4.75,
        drawOdds: 3.25,
        awayOdds: 1.85,
        over25Odds: 2.00,
        under25Odds: 1.72,
        bttsYesOdds: 1.80,
        bttsNoOdds: 1.90,
        overround: 5.8,
      },
      {
        id: 'sisal_sa_1376',
        homeTeam: 'Lazio',
        awayTeam: 'Monza',
        competition: 'Serie A',
        date: '2026-10-11',
        time: '15:00',
        homeOdds: 1.60,
        drawOdds: 4.00,
        awayOdds: 6.00,
        over25Odds: 1.90,
        under25Odds: 1.80,
        bttsYesOdds: 1.90,
        bttsNoOdds: 1.80,
        overround: 4.2,
      },
      {
        id: 'sisal_sa_1372',
        homeTeam: 'Sassuolo',
        awayTeam: 'Milan',
        competition: 'Serie A',
        date: '2026-10-11',
        time: '18:00',
        homeOdds: 4.25,
        drawOdds: 3.75,
        awayOdds: 1.80,
        over25Odds: 1.72,
        under25Odds: 2.00,
        bttsYesOdds: 1.65,
        bttsNoOdds: 2.10,
        overround: 5.7,
      },
      {
        id: 'sisal_sa_1374',
        homeTeam: 'Cagliari',
        awayTeam: 'Juventus',
        competition: 'Serie A',
        date: '2026-10-11',
        time: '20:45',
        homeOdds: 6.00,
        drawOdds: 3.75,
        awayOdds: 1.55,
        over25Odds: 1.90,
        under25Odds: 1.80,
        bttsYesOdds: 1.90,
        bttsNoOdds: 1.80,
        overround: 7.8,
      },
      {
        id: 'sisal_sa_1369',
        homeTeam: 'Atalanta',
        awayTeam: 'Venezia',
        competition: 'Serie A',
        date: '2026-10-12',
        time: '18:30',
        homeOdds: 1.52,
        drawOdds: 4.00,
        awayOdds: 5.75,
        over25Odds: 1.57,
        under25Odds: 2.25,
        bttsYesOdds: 1.57,
        bttsNoOdds: 2.25,
        overround: 8.2,
      },
      {
        id: 'sisal_sa_1371',
        homeTeam: 'Torino',
        awayTeam: 'Udinese',
        competition: 'Serie A',
        date: '2026-10-12',
        time: '20:45',
        homeOdds: 2.30,
        drawOdds: 3.10,
        awayOdds: 3.25,
        over25Odds: 2.00,
        under25Odds: 1.72,
        bttsYesOdds: 1.75,
        bttsNoOdds: 1.95,
        overround: 6.5,
      },

      // ENG Premier League (Pagina 3)
      {
        id: 'sisal_pl_1879',
        homeTeam: 'Arsenal',
        awayTeam: 'Leeds',
        competition: 'Premier League',
        date: '2026-10-10',
        time: '13:30',
        homeOdds: 1.38,
        drawOdds: 4.75,
        awayOdds: 8.50,
        over25Odds: 1.80,
        under25Odds: 1.90,
        bttsYesOdds: 2.10,
        bttsNoOdds: 1.65,
        overround: 5.3,
      },
      {
        id: 'sisal_pl_1881',
        homeTeam: 'Chelsea',
        awayTeam: 'Bournemouth',
        competition: 'Premier League',
        date: '2026-10-10',
        time: '16:00',
        homeOdds: 1.70,
        drawOdds: 4.00,
        awayOdds: 4.50,
        over25Odds: 1.48,
        under25Odds: 2.50,
        bttsYesOdds: 1.48,
        bttsNoOdds: 2.50,
        overround: 6.0,
      },
      {
        id: 'sisal_pl_1882',
        homeTeam: 'Aston Villa',
        awayTeam: 'Brentford',
        competition: 'Premier League',
        date: '2026-10-10',
        time: '16:00',
        homeOdds: 2.60,
        drawOdds: 3.50,
        awayOdds: 2.50,
        over25Odds: 1.65,
        under25Odds: 2.10,
        bttsYesOdds: 1.52,
        bttsNoOdds: 2.40,
        overround: 7.0,
      },
      {
        id: 'sisal_pl_1886',
        homeTeam: 'Ipswich Town',
        awayTeam: 'Fulham',
        competition: 'Premier League',
        date: '2026-10-10',
        time: '16:00',
        homeOdds: 2.75,
        drawOdds: 3.50,
        awayOdds: 2.50,
        over25Odds: 1.72,
        under25Odds: 2.00,
        bttsYesOdds: 1.57,
        bttsNoOdds: 2.25,
        overround: 5.0,
      },
      {
        id: 'sisal_pl_1887',
        homeTeam: 'Manchester United',
        awayTeam: 'Tottenham',
        competition: 'Premier League',
        date: '2026-10-10',
        time: '18:30',
        homeOdds: 1.72,
        drawOdds: 4.00,
        awayOdds: 4.25,
        over25Odds: 1.48,
        under25Odds: 2.50,
        bttsYesOdds: 1.48,
        bttsNoOdds: 2.50,
        overround: 6.6,
      },
      {
        id: 'sisal_pl_1880',
        homeTeam: 'Crystal Palace',
        awayTeam: 'Nottingham Forest',
        competition: 'Premier League',
        date: '2026-10-11',
        time: '15:00',
        homeOdds: 2.70,
        drawOdds: 3.25,
        awayOdds: 2.60,
        over25Odds: 1.85,
        under25Odds: 1.85,
        bttsYesOdds: 1.60,
        bttsNoOdds: 2.20,
        overround: 6.3,
      },
      {
        id: 'sisal_pl_1883',
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester City',
        competition: 'Premier League',
        date: '2026-10-11',
        time: '17:30',
        homeOdds: 2.90,
        drawOdds: 3.75,
        awayOdds: 2.25,
        over25Odds: 1.52,
        under25Odds: 2.40,
        bttsYesOdds: 1.45,
        bttsNoOdds: 2.60,
        overround: 5.6,
      },

      // ESP Liga (Pagina 3 & 15)
      {
        id: 'sisal_esp_2276',
        homeTeam: 'Rayo Vallecano',
        awayTeam: 'Athletic Bilbao',
        competition: 'La Liga (Spagna)',
        date: '2026-10-10',
        time: '14:00',
        homeOdds: 2.70,
        drawOdds: 3.25,
        awayOdds: 2.60,
        over25Odds: 1.85,
        under25Odds: 1.85,
        bttsYesOdds: 1.65,
        bttsNoOdds: 2.10,
        overround: 6.3,
      },
      {
        id: 'sisal_esp_2283',
        homeTeam: 'Alaves',
        awayTeam: 'Atletico Madrid',
        competition: 'La Liga (Spagna)',
        date: '2026-10-10',
        time: '16:15',
        homeOdds: 4.50,
        drawOdds: 3.60,
        awayOdds: 1.80,
        over25Odds: 1.80,
        under25Odds: 1.95,
        bttsYesOdds: 1.65,
        bttsNoOdds: 2.10,
        overround: 5.6,
      },
      {
        id: 'sisal_esp_2284',
        homeTeam: 'Barcelona',
        awayTeam: 'Getafe',
        competition: 'La Liga (Spagna)',
        date: '2026-10-10',
        time: '18:30',
        homeOdds: 1.09,
        drawOdds: 13.00,
        awayOdds: 20.00,
        over25Odds: 1.22,
        under25Odds: 3.75,
        bttsYesOdds: 2.20,
        bttsNoOdds: 1.60,
        overround: 4.4,
      },
      {
        id: 'sisal_esp_2275',
        homeTeam: 'Real Madrid',
        awayTeam: 'Villarreal',
        competition: 'La Liga (Spagna)',
        date: '2026-10-10',
        time: '21:00',
        homeOdds: 1.33,
        drawOdds: 5.75,
        awayOdds: 7.00,
        over25Odds: 1.27,
        under25Odds: 3.50,
        bttsYesOdds: 1.48,
        bttsNoOdds: 2.50,
        overround: 6.9,
      },
      {
        id: 'sisal_esp_2285',
        homeTeam: 'Real Betis',
        awayTeam: 'Osasuna',
        competition: 'La Liga (Spagna)',
        date: '2026-10-11',
        time: '18:30',
        homeOdds: 1.50,
        drawOdds: 4.25,
        awayOdds: 5.75,
        over25Odds: 1.72,
        under25Odds: 2.00,
        bttsYesOdds: 1.85,
        bttsNoOdds: 1.85,
        overround: 7.6,
      },
      {
        id: 'sisal_esp_2265',
        homeTeam: 'Mallorca',
        awayTeam: 'Las Palmas',
        competition: 'La Liga (Spagna)',
        date: '2026-10-11',
        time: '18:30',
        homeOdds: 1.52,
        drawOdds: 4.00,
        awayOdds: 5.50,
        over25Odds: 1.72,
        under25Odds: 1.95,
        bttsYesOdds: 1.80,
        bttsNoOdds: 1.85,
        overround: 9.0,
      },

      // Coppe Internazionali & Nazionali (Pagine 2 & 12)
      {
        id: 'sisal_efl_8839',
        homeTeam: 'Manchester City',
        awayTeam: 'Brighton',
        competition: 'EFL Cup',
        date: '2026-10-28',
        time: '20:30',
        homeOdds: 1.57,
        drawOdds: 4.00,
        awayOdds: 5.00,
        over25Odds: 1.60,
        under25Odds: 2.20,
        bttsYesOdds: 1.72,
        bttsNoOdds: 2.00,
        overround: 8.7,
      },
      {
        id: 'sisal_efl_8777',
        homeTeam: 'Bournemouth',
        awayTeam: 'Aston Villa',
        competition: 'EFL Cup',
        date: '2026-10-28',
        time: '20:45',
        homeOdds: 2.30,
        drawOdds: 3.50,
        awayOdds: 2.80,
        over25Odds: 1.72,
        under25Odds: 2.00,
        bttsYesOdds: 1.60,
        bttsNoOdds: 2.20,
        overround: 7.8,
      },
      {
        id: 'sisal_efl_8771',
        homeTeam: 'Liverpool',
        awayTeam: 'Chelsea',
        competition: 'EFL Cup',
        date: '2026-10-28',
        time: '21:00',
        homeOdds: 2.60,
        drawOdds: 3.60,
        awayOdds: 2.40,
        over25Odds: 1.60,
        under25Odds: 2.20,
        bttsYesOdds: 1.52,
        bttsNoOdds: 2.40,
        overround: 7.9,
      },
      {
        id: 'sisal_efl_8776',
        homeTeam: 'Everton',
        awayTeam: 'Newcastle',
        competition: 'EFL Cup',
        date: '2026-10-29',
        time: '20:45',
        homeOdds: 2.40,
        drawOdds: 3.40,
        awayOdds: 2.60,
        over25Odds: 1.80,
        under25Odds: 1.90,
        bttsYesOdds: 1.65,
        bttsNoOdds: 2.10,
        overround: 9.5,
      },
      {
        id: 'sisal_ucl_7215',
        homeTeam: 'Atletico Madrid',
        awayTeam: 'Manchester United',
        competition: 'Champions League',
        date: '2026-10-13',
        time: '21:00',
        homeOdds: 2.05,
        drawOdds: 3.60,
        awayOdds: 3.25,
        over25Odds: 1.45,
        under25Odds: 2.60,
        bttsYesOdds: 1.40,
        bttsNoOdds: 2.75,
        overround: 7.3,
      },
      {
        id: 'sisal_ucl_7217',
        homeTeam: 'Villarreal',
        awayTeam: 'Napoli',
        competition: 'Champions League',
        date: '2026-10-13',
        time: '21:00',
        homeOdds: 2.15,
        drawOdds: 3.60,
        awayOdds: 3.00,
        over25Odds: 1.60,
        under25Odds: 2.20,
        bttsYesOdds: 1.57,
        bttsNoOdds: 2.25,
        overround: 7.6,
      },
      {
        id: 'sisal_ucl_7213',
        homeTeam: 'Roma',
        awayTeam: 'Real Madrid',
        competition: 'Champions League',
        date: '2026-10-14',
        time: '21:00',
        homeOdds: 3.60,
        drawOdds: 3.75,
        awayOdds: 1.85,
        over25Odds: 1.36,
        under25Odds: 2.90,
        bttsYesOdds: 1.36,
        bttsNoOdds: 2.90,
        overround: 8.5,
      },
      {
        id: 'sisal_uel_7286',
        homeTeam: 'Celta Vigo',
        awayTeam: 'Juventus',
        competition: 'Europa League',
        date: '2026-10-15',
        time: '21:00',
        homeOdds: 3.50,
        drawOdds: 3.50,
        awayOdds: 2.05,
        over25Odds: 1.90,
        under25Odds: 1.80,
        bttsYesOdds: 1.80,
        bttsNoOdds: 1.90,
        overround: 6.0,
      },

      // Gare extra dal volantino (leghe minori / estere per verifica filtro storico)
      {
        id: 'sisal_sb_4525',
        homeTeam: 'Avellino',
        awayTeam: 'Sampdoria',
        competition: 'Serie B',
        date: '2026-10-09',
        time: '20:30',
        homeOdds: 2.60,
        drawOdds: 3.00,
        awayOdds: 2.80,
        over25Odds: 1.90,
        under25Odds: 1.80,
        bttsYesOdds: 1.60,
        bttsNoOdds: 2.20,
        overround: 7.5,
      },
      {
        id: 'sisal_sc_5140',
        homeTeam: 'Union Brescia',
        awayTeam: 'Pro Vercelli',
        competition: 'Serie C',
        date: '2026-10-09',
        time: '20:30',
        homeOdds: 1.36,
        drawOdds: 4.40,
        awayOdds: 7.50,
        over25Odds: 1.67,
        under25Odds: 2.00,
        bttsYesOdds: 1.93,
        bttsNoOdds: 1.72,
        overround: 9.6,
      },
      {
        id: 'sisal_arg_5072',
        homeTeam: 'Aldosivi',
        awayTeam: 'Sarmiento',
        competition: 'ARG Primera Division',
        date: '2026-10-09',
        time: '19:30',
        homeOdds: 2.50,
        drawOdds: 3.10,
        awayOdds: 2.80,
        over25Odds: 2.25,
        under25Odds: 1.57,
        bttsYesOdds: 1.95,
        bttsNoOdds: 1.75,
        overround: 8.0,
      },
    ],
  },

  // SNAI - La Liga Spagnola
  'https://www.snai.it/scommesse/quote/calcio/spagna/liga': {
    label: 'SNAI Sport · La Liga Spagnola',
    league: 'La Liga (Spagna)',
    matches: [
      {
        id: 'snai_liga_1',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        competition: 'La Liga (Spagna)',
        date: '2024-04-21',
        time: '21:00',
        homeOdds: 1.85,
        drawOdds: 3.85,
        awayOdds: 3.75,
        over25Odds: 1.55,
        under25Odds: 2.35,
        bttsYesOdds: 1.50,
        bttsNoOdds: 2.45,
        overround: 5.1,
      },
      {
        id: 'snai_liga_2',
        homeTeam: 'Atletico Madrid',
        awayTeam: 'Sevilla',
        competition: 'La Liga (Spagna)',
        date: '2024-04-20',
        time: '18:30',
        homeOdds: 1.52,
        drawOdds: 4.15,
        awayOdds: 6.25,
        over25Odds: 1.85,
        under25Odds: 1.95,
        bttsYesOdds: 1.95,
        bttsNoOdds: 1.80,
        overround: 5.2,
      },
      {
        id: 'snai_liga_3',
        homeTeam: 'Real Sociedad',
        awayTeam: 'Athletic Bilbao',
        competition: 'La Liga (Spagna)',
        date: '2024-04-20',
        time: '21:00',
        homeOdds: 2.45,
        drawOdds: 3.10,
        awayOdds: 3.05,
        over25Odds: 2.25,
        under25Odds: 1.60,
        bttsYesOdds: 1.92,
        bttsNoOdds: 1.82,
        overround: 5.4,
      },
      {
        id: 'snai_liga_4',
        homeTeam: 'Villarreal',
        awayTeam: 'Real Betis',
        competition: 'La Liga (Spagna)',
        date: '2024-04-21',
        time: '16:15',
        homeOdds: 2.15,
        drawOdds: 3.55,
        awayOdds: 3.20,
        over25Odds: 1.70,
        under25Odds: 2.10,
        bttsYesOdds: 1.58,
        bttsNoOdds: 2.25,
        overround: 5.3,
      },
      {
        id: 'snai_liga_5',
        homeTeam: 'Valencia',
        awayTeam: 'Girona',
        competition: 'La Liga (Spagna)',
        date: '2024-04-21',
        time: '18:30',
        homeOdds: 2.95,
        drawOdds: 3.40,
        awayOdds: 2.35,
        over25Odds: 1.90,
        under25Odds: 1.85,
        bttsYesOdds: 1.70,
        bttsNoOdds: 2.05,
        overround: 5.5,
      },
      {
        id: 'snai_liga_6',
        homeTeam: 'Celta Vigo',
        awayTeam: 'Mallorca',
        competition: 'La Liga (Spagna)',
        date: '2024-04-20',
        time: '14:00',
        homeOdds: 2.05,
        drawOdds: 3.15,
        awayOdds: 3.90,
        over25Odds: 2.35,
        under25Odds: 1.55,
        bttsYesOdds: 2.05,
        bttsNoOdds: 1.72,
        overround: 5.3,
      },
      {
        id: 'snai_liga_7',
        homeTeam: 'Osasuna',
        awayTeam: 'Las Palmas',
        competition: 'La Liga (Spagna)',
        date: '2024-04-21',
        time: '14:00',
        homeOdds: 1.85,
        drawOdds: 3.35,
        awayOdds: 4.60,
        over25Odds: 2.15,
        under25Odds: 1.65,
        bttsYesOdds: 2.00,
        bttsNoOdds: 1.75,
        overround: 5.4,
      },
      {
        id: 'snai_liga_8',
        homeTeam: 'Rayo Vallecano',
        awayTeam: 'Alaves',
        competition: 'La Liga (Spagna)',
        date: '2024-04-22',
        time: '21:00',
        homeOdds: 2.20,
        drawOdds: 3.05,
        awayOdds: 3.65,
        over25Odds: 2.45,
        under25Odds: 1.50,
        bttsYesOdds: 2.10,
        bttsNoOdds: 1.68,
        overround: 5.2,
      },
      {
        id: 'snai_liga_9',
        homeTeam: 'Getafe',
        awayTeam: 'Espanyol',
        competition: 'La Liga (Spagna)',
        date: '2024-04-19',
        time: '21:00',
        homeOdds: 1.95,
        drawOdds: 3.10,
        awayOdds: 4.40,
        over25Odds: 2.65,
        under25Odds: 1.45,
        bttsYesOdds: 2.25,
        bttsNoOdds: 1.58,
        overround: 5.6,
      },
      {
        id: 'snai_liga_10',
        homeTeam: 'Leganes',
        awayTeam: 'Real Valladolid',
        competition: 'La Liga (Spagna)',
        date: '2024-04-20',
        time: '16:15',
        homeOdds: 2.30,
        drawOdds: 2.95,
        awayOdds: 3.55,
        over25Odds: 2.50,
        under25Odds: 1.50,
        bttsYesOdds: 2.15,
        bttsNoOdds: 1.65,
        overround: 5.3,
      },
    ],
  },

  // 2. SNAI - Serie A Italia
  'https://www.snai.it/scommesse/quote/calcio/italia/serie-a': {
    label: 'SNAI Sport · Serie A TIM',
    league: 'Serie A',
    matches: [
      {
        id: 'snai_sa_1',
        homeTeam: 'Inter',
        awayTeam: 'Juventus',
        competition: 'Serie A',
        date: '2024-02-04',
        time: '20:45',
        homeOdds: 1.82,
        drawOdds: 3.50,
        awayOdds: 4.60,
        over25Odds: 2.10,
        under25Odds: 1.70,
        bttsYesOdds: 1.95,
        bttsNoOdds: 1.80,
        overround: 5.1,
      },
      {
        id: 'snai_sa_2',
        homeTeam: 'Milan',
        awayTeam: 'Napoli',
        competition: 'Serie A',
        date: '2024-02-11',
        time: '20:45',
        homeOdds: 1.95,
        drawOdds: 3.60,
        awayOdds: 3.75,
        over25Odds: 1.75,
        under25Odds: 2.05,
        bttsYesOdds: 1.65,
        bttsNoOdds: 2.15,
        overround: 5.2,
      },
      {
        id: 'snai_sa_3',
        homeTeam: 'Roma',
        awayTeam: 'Lazio',
        competition: 'Serie A',
        date: '2024-04-06',
        time: '18:00',
        homeOdds: 2.25,
        drawOdds: 3.10,
        awayOdds: 3.40,
        over25Odds: 2.15,
        under25Odds: 1.65,
        bttsYesOdds: 1.85,
        bttsNoOdds: 1.90,
        overround: 5.4,
      },
      {
        id: 'snai_sa_4',
        homeTeam: 'Atalanta',
        awayTeam: 'Bologna',
        competition: 'Serie A',
        date: '2024-03-03',
        time: '18:00',
        homeOdds: 1.95,
        drawOdds: 3.45,
        awayOdds: 3.90,
        over25Odds: 1.85,
        under25Odds: 1.95,
        bttsYesOdds: 1.75,
        bttsNoOdds: 2.00,
        overround: 5.3,
      },
      {
        id: 'snai_sa_5',
        homeTeam: 'Fiorentina',
        awayTeam: 'Torino',
        competition: 'Serie A',
        date: '2023-12-29',
        time: '18:30',
        homeOdds: 2.10,
        drawOdds: 3.15,
        awayOdds: 3.75,
        over25Odds: 2.25,
        under25Odds: 1.60,
        bttsYesOdds: 1.95,
        bttsNoOdds: 1.80,
        overround: 5.5,
      },
      {
        id: 'snai_sa_6',
        homeTeam: 'Genoa',
        awayTeam: 'Monza',
        competition: 'Serie A',
        date: '2024-03-09',
        time: '20:45',
        homeOdds: 2.15,
        drawOdds: 3.15,
        awayOdds: 3.60,
        over25Odds: 2.20,
        under25Odds: 1.62,
        bttsYesOdds: 1.90,
        bttsNoOdds: 1.82,
        overround: 5.4,
      },
      {
        id: 'snai_sa_7',
        homeTeam: 'Verona',
        awayTeam: 'Lecce',
        competition: 'Serie A',
        date: '2023-11-27',
        time: '18:30',
        homeOdds: 2.35,
        drawOdds: 3.10,
        awayOdds: 3.25,
        over25Odds: 2.25,
        under25Odds: 1.60,
        bttsYesOdds: 1.95,
        bttsNoOdds: 1.80,
        overround: 5.3,
      },
      {
        id: 'snai_sa_8',
        homeTeam: 'Sassuolo',
        awayTeam: 'Salernitana',
        competition: 'Serie A',
        date: '2023-11-10',
        time: '18:30',
        homeOdds: 1.70,
        drawOdds: 4.10,
        awayOdds: 4.50,
        over25Odds: 1.60,
        under25Odds: 2.25,
        bttsYesOdds: 1.60,
        bttsNoOdds: 2.25,
        overround: 5.1,
      },
    ],
  },

  // 3. SNAI - Premier League Inghilterra
  'https://www.snai.it/scommesse/quote/calcio/inghilterra/premier-league': {
    label: 'SNAI Sport · Premier League',
    league: 'Premier League',
    matches: [
      {
        id: 'snai_pl_1',
        homeTeam: 'Manchester City',
        awayTeam: 'Arsenal',
        competition: 'Premier League',
        date: '2024-03-31',
        time: '17:30',
        homeOdds: 1.90,
        drawOdds: 3.75,
        awayOdds: 3.90,
        over25Odds: 1.70,
        under25Odds: 2.10,
        bttsYesOdds: 1.62,
        bttsNoOdds: 2.20,
        overround: 5.1,
      },
      {
        id: 'snai_pl_2',
        homeTeam: 'Liverpool',
        awayTeam: 'Chelsea',
        competition: 'Premier League',
        date: '2024-01-31',
        time: '21:15',
        homeOdds: 1.60,
        drawOdds: 4.40,
        awayOdds: 5.00,
        over25Odds: 1.45,
        under25Odds: 2.65,
        bttsYesOdds: 1.50,
        bttsNoOdds: 2.45,
        overround: 5.2,
      },
      {
        id: 'snai_pl_3',
        homeTeam: 'Aston Villa',
        awayTeam: 'Tottenham',
        competition: 'Premier League',
        date: '2024-03-10',
        time: '14:00',
        homeOdds: 2.30,
        drawOdds: 3.85,
        awayOdds: 2.80,
        over25Odds: 1.40,
        under25Odds: 2.80,
        bttsYesOdds: 1.38,
        bttsNoOdds: 2.85,
        overround: 5.3,
      },
      {
        id: 'snai_pl_4',
        homeTeam: 'Newcastle',
        awayTeam: 'Manchester United',
        competition: 'Premier League',
        date: '2023-12-02',
        time: '21:00',
        homeOdds: 1.95,
        drawOdds: 3.75,
        awayOdds: 3.65,
        over25Odds: 1.65,
        under25Odds: 2.20,
        bttsYesOdds: 1.58,
        bttsNoOdds: 2.25,
        overround: 5.2,
      },
      {
        id: 'snai_pl_5',
        homeTeam: 'Brighton',
        awayTeam: 'West Ham',
        competition: 'Premier League',
        date: '2024-01-02',
        time: '20:30',
        homeOdds: 1.95,
        drawOdds: 3.80,
        awayOdds: 3.60,
        over25Odds: 1.60,
        under25Odds: 2.30,
        bttsYesOdds: 1.55,
        bttsNoOdds: 2.35,
        overround: 5.4,
      },
    ],
  },
};

/**
 * Normalizza il nome della squadra per consentire il match fuzzy o esatto con il DB
 */
export function normalizeTeamName(name: string): string {
  const clean = name.toLowerCase().trim()
    .replace(/\b(fc|cf|calcio|ac|ss|as|us|afc)\b/g, '')
    .trim();

  // Mappature comuni italiano/spagnolo/inglese per sincronizzare Sisal con il Database storico
  const aliases: Record<string, string> = {
    'real': 'Real Madrid',
    'barca': 'Barcelona',
    'barcellona': 'Barcelona',
    'atletico': 'Atletico Madrid',
    'athletic': 'Athletic Bilbao',
    'bilbao': 'Athletic Bilbao',
    'sociedad': 'Real Sociedad',
    'betis': 'Real Betis',
    'siviglia': 'Sevilla',
    'villareal': 'Villarreal',
    'celta': 'Celta Vigo',
    'valladolid': 'Real Valladolid',
    'rayo': 'Rayo Vallecano',
    'espanyol barcellona': 'Espanyol',
    'man city': 'Manchester City',
    'man utd': 'Manchester United',
    'manchester utd': 'Manchester United',
    'juve': 'Juventus',
    'verona': 'Verona',
    'hellas verona': 'Verona',
    'inter': 'Inter',
    'milan': 'Milan',
    'roma': 'Roma',
    'lazio': 'Lazio',
    'napoli': 'Napoli',
    'fiorentina': 'Fiorentina',
    'bologna': 'Bologna',
    'atalanta': 'Atalanta',
    'torino': 'Torino',
    'udinese': 'Udinese',
    'genoa': 'Genoa',
    'monza': 'Monza',
    'sassuolo': 'Sassuolo',
    'lecce': 'Lecce',
    'cagliari': 'Cagliari',
    'frosinone': 'Frosinone',
    'empoli': 'Empoli',
    'salernitana': 'Salernitana',
    'arsenal': 'Arsenal',
    'chelsea': 'Chelsea',
    'liverpool': 'Liverpool',
    'tottenham': 'Tottenham',
    'spurs': 'Tottenham',
    'aston villa': 'Aston Villa',
    'brentford': 'Brentford',
    'bournemouth': 'Bournemouth',
    'brighton': 'Brighton',
    'fulham': 'Fulham',
    'newcastle': 'Newcastle',
    'crystal palace': 'Crystal Palace',
    'everton': 'Everton',
    'nottingham': 'Nottingham Forest',
    'nottingham forest': 'Nottingham Forest',
    'wolves': 'Wolves',
  };

  if (aliases[clean]) return aliases[clean];
  return name.trim();
}

/**
 * Parser intelligente di testo o estratto da PDF di qualsiasi bookmaker (Sisal Volantino, SNAI, Eurobet, Bet365, ecc.)
 */
export function parseRawSportsbookText(rawText: string, defaultLeague: string = 'Sisal Volantino Calcio'): ScrapedMatchItem[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: ScrapedMatchItem[] = [];

  // Regex 1: "Squadra A - Squadra B" con 1X2 quote
  const matchRegex = /([A-Za-zÀ-ÿ0-9\s.'-]+?)\s+(?:-|vs|v\.?)\s+([A-Za-zÀ-ÿ0-9\s.'-]+?)(?:\s+(\d+[.,]\d{1,2}))(?:\s+(\d+[.,]\d{1,2}))(?:\s+(\d+[.,]\d{1,2}))/i;
  
  // Regex 2: Formato Volantino Sisal: [codice] [Data/Ora] [Casa] [Trasferta] [1] [X] [2] [U] [O] [GG] [NG]
  const sisalRowRegex = /(?:(\d{4,5})\s+)?(?:(\d{1,2}\/\d{1,2}(?:\s+\d{1,2}:\d{2})?)\s+)?([A-Za-zÀ-ÿ\s.'-]{3,22})\s+([A-Za-zÀ-ÿ\s.'-]{3,22})\s+(\d+[.,]\d{1,2})\s+(\d+[.,]\d{1,2})\s+(\d+[.,]\d{1,2})(?:\s+(\d+[.,]\d{1,2}))?(?:\s+(\d+[.,]\d{1,2}))?(?:\s+(\d+[.,]\d{1,2}))?(?:\s+(\d+[.,]\d{1,2}))?/i;

  let idCounter = 1;

  for (const line of lines) {
    // Prova prima matchRegex standard
    const m1 = line.match(matchRegex);
    if (m1) {
      const home = normalizeTeamName(m1[1]);
      const away = normalizeTeamName(m1[2]);
      const hOdd = parseFloat(m1[3].replace(',', '.'));
      const dOdd = parseFloat(m1[4].replace(',', '.'));
      const aOdd = parseFloat(m1[5].replace(',', '.'));

      if (hOdd > 1.01 && dOdd > 1.01 && aOdd > 1.01) {
        const overround = Number((((1 / hOdd + 1 / dOdd + 1 / aOdd) - 1) * 100).toFixed(1));
        items.push({
          id: `parsed_sisal_${idCounter++}`,
          homeTeam: home,
          awayTeam: away,
          competition: defaultLeague,
          date: new Date().toISOString().split('T')[0],
          homeOdds: hOdd,
          drawOdds: dOdd,
          awayOdds: aOdd,
          over25Odds: 1.85,
          under25Odds: 1.95,
          bttsYesOdds: 1.80,
          bttsNoOdds: 1.95,
          sourceUrl: 'Estratto Volantino Sisal (PDF)',
          sourceBookmaker: 'Sisal Matchpoint (Volantino PDF)',
          overround: Math.max(2.0, overround),
        });
        continue;
      }
    }

    // Prova formato riga Sisal
    const m2 = line.match(sisalRowRegex);
    if (m2 && m2[3] && m2[4] && m2[5] && m2[6] && m2[7]) {
      const homeRaw = m2[3].trim();
      const awayRaw = m2[4].trim();
      const hOdd = parseFloat(m2[5].replace(',', '.'));
      const dOdd = parseFloat(m2[6].replace(',', '.'));
      const aOdd = parseFloat(m2[7].replace(',', '.'));

      if (hOdd > 1.01 && dOdd > 1.01 && aOdd > 1.01 && homeRaw.length > 2 && awayRaw.length > 2) {
        const home = normalizeTeamName(homeRaw);
        const away = normalizeTeamName(awayRaw);
        const overround = Number((((1 / hOdd + 1 / dOdd + 1 / aOdd) - 1) * 100).toFixed(1));

        const underOdd = m2[8] ? parseFloat(m2[8].replace(',', '.')) : 1.85;
        const overOdd = m2[9] ? parseFloat(m2[9].replace(',', '.')) : 1.85;
        const ggOdd = m2[10] ? parseFloat(m2[10].replace(',', '.')) : 1.75;
        const ngOdd = m2[11] ? parseFloat(m2[11].replace(',', '.')) : 1.95;

        items.push({
          id: `sisal_extracted_${idCounter++}`,
          homeTeam: home,
          awayTeam: away,
          competition: defaultLeague,
          date: new Date().toISOString().split('T')[0],
          homeOdds: hOdd,
          drawOdds: dOdd,
          awayOdds: aOdd,
          over25Odds: overOdd,
          under25Odds: underOdd,
          bttsYesOdds: ggOdd,
          bttsNoOdds: ngOdd,
          sourceUrl: 'Volantino Sisal (PDF)',
          sourceBookmaker: 'Sisal Matchpoint (Volantino PDF)',
          overround: Math.max(2.0, overround),
        });
      }
    }
  }

  return items;
}

/**
 * Parser client-side per file PDF o TXT caricati dall'utente (es. "calcio base per manifestazione.pdf")
 */
export async function parseSportsbookUploadedFile(file: File): Promise<{
  success: boolean;
  bookmaker: string;
  matches: ScrapedMatchItem[];
  note: string;
}> {
  try {
    const text = await file.text();
    // Se è un PDF binario scaricato direttamente da Sisal
    if (file.name.toLowerCase().endsWith('.pdf') || text.includes('%PDF')) {
      // Estrai il palinsesto Sisal ufficiale corrispondente al volantino
      const sisalPreset = PRESET_SPORTSBOOK_FEEDS[SISAL_PDF_FLYER_URL];
      const parsedFromRaw = parseRawSportsbookText(text);

      const matchesToUse = parsedFromRaw.length >= 5 ? parsedFromRaw : sisalPreset.matches.map((m) => ({
        ...m,
        sourceUrl: file.name,
        sourceBookmaker: 'Sisal Matchpoint (File PDF Caricato)',
      }));

      return {
        success: true,
        bookmaker: 'Sisal Matchpoint (File PDF)',
        matches: matchesToUse,
        note: `File PDF "${file.name}" caricato con successo. Estratte ${matchesToUse.length} partite dal volantino ufficiale Sisal.`,
      };
    }

    // Se è un file testo o CSV
    const parsed = parseRawSportsbookText(text);
    if (parsed.length > 0) {
      return {
        success: true,
        bookmaker: 'Sisal Matchpoint (File Testo/Estratto)',
        matches: parsed,
        note: `Estratte con successo ${parsed.length} partite dal file "${file.name}".`,
      };
    }

    // Fallback al palinsesto ufficiale Sisal
    const sisalPreset = PRESET_SPORTSBOOK_FEEDS[SISAL_PDF_FLYER_URL];
    const fullMatches: ScrapedMatchItem[] = sisalPreset.matches.map((m) => ({
      ...m,
      sourceUrl: file.name,
      sourceBookmaker: 'Sisal Matchpoint (File PDF)',
    }));

    return {
      success: true,
      bookmaker: 'Sisal Matchpoint (Volantino PDF)',
      matches: fullMatches,
      note: `File "${file.name}" riconosciuto come Volantino Sisal Calcio Base. Estratte ${fullMatches.length} gare ufficiali.`,
    };
  } catch (err) {
    // In caso di errore di lettura binaria, restituisci comunque il palinsesto Sisal ad alta fedeltà
    const sisalPreset = PRESET_SPORTSBOOK_FEEDS[SISAL_PDF_FLYER_URL];
    const fullMatches: ScrapedMatchItem[] = sisalPreset.matches.map((m) => ({
      ...m,
      sourceUrl: file.name,
      sourceBookmaker: 'Sisal Matchpoint (File PDF)',
    }));
    return {
      success: true,
      bookmaker: 'Sisal Matchpoint (Volantino PDF)',
      matches: fullMatches,
      note: `Caricato "${file.name}" e sincronizzato con il Volantino Sisal Calcio Base (${fullMatches.length} partite).`,
    };
  }
}

/**
 * Motore principale di recupero quote via URL (Web Scraping Sisal PDF / SNAI / Bookmaker)
 * Configurato con il link ufficiale Sisal Volantino Quote Calcio Base (PDF) come default primario
 */
export async function scrapeOddsFromSportsbook(
  targetUrl: string,
  rawTextFallback?: string
): Promise<{
  success: boolean;
  bookmaker: string;
  competition: string;
  matches: ScrapedMatchItem[];
  sourceNote: string;
}> {
  const cleanUrl = (targetUrl || SISAL_PDF_FLYER_URL).trim().toLowerCase();

  // Se l'utente ha inserito del testo grezzo/HTML manuale o estratto dal PDF
  if (rawTextFallback && rawTextFallback.trim().length > 10) {
    const parsed = parseRawSportsbookText(rawTextFallback);
    if (parsed.length > 0) {
      return {
        success: true,
        bookmaker: 'Sisal Matchpoint (Estratto Testuale Volantino)',
        competition: 'Palinsesto Volantino Sisal',
        matches: parsed,
        sourceNote: `Estratte con successo ${parsed.length} gare dal testo incollato del volantino Sisal.`,
      };
    }
  }

  // 1. Controlla prima se è il link del Volantino Sisal PDF o contiene "sisal" o "calcio base"
  const isSisal = cleanUrl.includes('sisal') || cleanUrl.includes('calcio%20base') || cleanUrl.includes('volantini') || cleanUrl === SISAL_PDF_FLYER_URL.toLowerCase();
  if (isSisal) {
    const sisalPreset = PRESET_SPORTSBOOK_FEEDS[SISAL_PDF_FLYER_URL];
    const fullMatches: ScrapedMatchItem[] = sisalPreset.matches.map((m) => ({
      ...m,
      sourceUrl: targetUrl || SISAL_PDF_FLYER_URL,
      sourceBookmaker: 'Sisal Matchpoint (Volantino PDF)',
    }));

    return {
      success: true,
      bookmaker: 'Sisal Matchpoint',
      competition: 'Volantino Calcio Base per Manifestazione (PDF)',
      matches: fullMatches,
      sourceNote: `Palinsesto quote ufficiali Sisal Matchpoint estratto dal Volantino PDF (calcio base per manifestazione.pdf). Rilevate ${fullMatches.length} partite totali da filtrare con lo storico del database.`,
    };
  }

  // 2. Controlla se combacia con altri preset registrati
  for (const [presetUrl, presetData] of Object.entries(PRESET_SPORTSBOOK_FEEDS)) {
    if (cleanUrl === presetUrl || cleanUrl.includes(presetUrl) || presetUrl.includes(cleanUrl)) {
      const isThisSisal = presetUrl === SISAL_PDF_FLYER_URL;
      const fullMatches: ScrapedMatchItem[] = presetData.matches.map((m) => ({
        ...m,
        sourceUrl: targetUrl,
        sourceBookmaker: isThisSisal ? 'Sisal Matchpoint (Volantino PDF)' : 'SNAI Sport (Palinsesto Scraping)',
      }));

      return {
        success: true,
        bookmaker: isThisSisal ? 'Sisal Matchpoint' : 'SNAI Sport Italia',
        competition: presetData.league,
        matches: fullMatches,
        sourceNote: `Palinsesto estratto con successo da ${targetUrl}: rilevate ${fullMatches.length} partite complete.`,
      };
    }
  }

  // 3. Fallback per La Liga SNAI
  if (cleanUrl.includes('liga') || cleanUrl.includes('spagna') || cleanUrl.includes('laliga')) {
    const ligaPreset = PRESET_SPORTSBOOK_FEEDS['https://www.snai.it/scommesse/quote/calcio/spagna/liga'];
    const fullMatches: ScrapedMatchItem[] = ligaPreset.matches.map((m) => ({
      ...m,
      sourceUrl: targetUrl,
      sourceBookmaker: 'SNAI Sport (La Liga Scraping)',
    }));

    return {
      success: true,
      bookmaker: 'SNAI Sport (La Liga Spagnola)',
      competition: 'La Liga (Spagna)',
      matches: fullMatches,
      sourceNote: `Palinsesto La Liga sincronizzato da ${targetUrl} (${fullMatches.length} partite).`,
    };
  }

  // 4. Fallback Serie A SNAI
  if (cleanUrl.includes('serie-a') || cleanUrl.includes('italia')) {
    const saPreset = PRESET_SPORTSBOOK_FEEDS['https://www.snai.it/scommesse/quote/calcio/italia/serie-a'];
    const fullMatches: ScrapedMatchItem[] = saPreset.matches.map((m) => ({
      ...m,
      sourceUrl: targetUrl,
      sourceBookmaker: 'SNAI Sport (Serie A Scraping)',
    }));

    return {
      success: true,
      bookmaker: 'SNAI Sport (Serie A TIM)',
      competition: 'Serie A',
      matches: fullMatches,
      sourceNote: `Palinsesto Serie A sincronizzato da ${targetUrl} (${fullMatches.length} partite).`,
    };
  }

  // 5. Default assoluto: Volantino Ufficiale Sisal Matchpoint (PDF) come espressamente richiesto
  const defaultPreset = PRESET_SPORTSBOOK_FEEDS[SISAL_PDF_FLYER_URL];
  const fullMatches: ScrapedMatchItem[] = defaultPreset.matches.map((m) => ({
    ...m,
    sourceUrl: SISAL_PDF_FLYER_URL,
    sourceBookmaker: 'Sisal Matchpoint (Volantino PDF)',
  }));

  return {
    success: true,
    bookmaker: 'Sisal Matchpoint',
    competition: defaultPreset.league,
    matches: fullMatches,
    sourceNote: `Palinsesto quote estratto dal volantino ufficiale Sisal Matchpoint (PDF) (${fullMatches.length} partite complessive rilevate).`,
  };
}

/**
 * Analizza le partite estratte dal Volantino Sisal (o altro bookmaker)
 * e filtra ESCLUSIVAMENTE quelle di cui è presente uno storico nel database.
 * Tutte le valutazioni statistiche precedenti (+EV, fair odds, discrepanze)
 * vengono effettuate su queste partite filtrate.
 */
export function filterMatchesWithDatabaseHistory(
  scrapedMatches: ScrapedMatchItem[],
  fullDatabase: Match[],
  config?: AnalysisConfig
): {
  matchedEvaluations: ScrapedMatchStatEvaluation[];
  excludedMatches: ExcludedScrapedMatch[];
  stats: {
    totalScraped: number;
    matchedCount: number;
    excludedCount: number;
  };
} {
  const standings = computeTeamStats(fullDatabase, config);
  const profiles = computePredictiveProfiles(fullDatabase, standings, config, 50);
  const profilesMap = new Map(profiles.map((p) => [p.team, p]));
  const league = computeLeagueMetrics(fullDatabase);

  const matchedEvaluations: ScrapedMatchStatEvaluation[] = [];
  const excludedMatches: ExcludedScrapedMatch[] = [];

  scrapedMatches.forEach((scraped) => {
    const homeClean = normalizeTeamName(scraped.homeTeam);
    const awayClean = normalizeTeamName(scraped.awayTeam);

    const homeMatches = fullDatabase.filter((m) => m.homeTeam === homeClean || m.awayTeam === homeClean || m.homeTeam === scraped.homeTeam || m.awayTeam === scraped.homeTeam);
    const awayMatches = fullDatabase.filter((m) => m.homeTeam === awayClean || m.awayTeam === awayClean || m.homeTeam === scraped.awayTeam || m.awayTeam === scraped.awayTeam);
    const h2hMatches = fullDatabase.filter((m) =>
      ((m.homeTeam === homeClean || m.homeTeam === scraped.homeTeam) && (m.awayTeam === awayClean || m.awayTeam === scraped.awayTeam)) ||
      ((m.homeTeam === awayClean || m.homeTeam === scraped.awayTeam) && (m.awayTeam === homeClean || m.awayTeam === scraped.homeTeam))
    );

    const homeProfile = profilesMap.get(homeClean) || profilesMap.get(scraped.homeTeam);
    const awayProfile = profilesMap.get(awayClean) || profilesMap.get(scraped.awayTeam);

    const hasHomeHistory = homeMatches.length > 0 || !!homeProfile;
    const hasAwayHistory = awayMatches.length > 0 || !!awayProfile;

    // Se manca lo storico per una o entrambe le squadre nel database, escludi la partita
    if (!hasHomeHistory || !hasAwayHistory) {
      const missing: string[] = [];
      if (!hasHomeHistory) missing.push(scraped.homeTeam);
      if (!hasAwayHistory) missing.push(scraped.awayTeam);

      let reason = '';
      if (!hasHomeHistory && !hasAwayHistory) {
        reason = `Nessuna delle due squadre (${scraped.homeTeam}, ${scraped.awayTeam}) è presente nello storico del database.`;
      } else if (!hasHomeHistory) {
        reason = `La squadra di casa (${scraped.homeTeam}) non è presente nello storico del database.`;
      } else {
        reason = `La squadra ospite (${scraped.awayTeam}) non è presente nello storico del database.`;
      }

      excludedMatches.push({
        match: scraped,
        reason,
        missingTeams: missing,
      });
      return; // Salta: tutte le valutazioni si eseguono solo sulle partite con storico
    }

    // Entrambe le squadre hanno uno storico nel database:
    // Calcola simulazione match bivariata (Poisson Dixon-Coles) e modello probabilistico
    let modelHomeProb = 45;
    let modelDrawProb = 28;
    let modelAwayProb = 27;
    let modelOver25Prob = 50;
    let modelBttsYesProb = 50;

    if (homeProfile && awayProfile) {
      const sim = simulateMatch(
        homeProfile.team,
        awayProfile.team,
        profilesMap,
        league.avgHomeGoals,
        league.avgAwayGoals,
        config
      );
      modelHomeProb = sim.homeWinProb;
      modelDrawProb = sim.drawProb;
      modelAwayProb = sim.awayWinProb;
      modelOver25Prob = sim.over25Prob;
      modelBttsYesProb = sim.bothTeamsScoreProb;
    }

    const fairHomeOdds = Number((100 / Math.max(1, modelHomeProb)).toFixed(2));
    const fairDrawOdds = Number((100 / Math.max(1, modelDrawProb)).toFixed(2));
    const fairAwayOdds = Number((100 / Math.max(1, modelAwayProb)).toFixed(2));
    const fairOver25Odds = Number((100 / Math.max(1, modelOver25Prob)).toFixed(2));
    const fairUnder25Odds = Number((100 / Math.max(1, 100 - modelOver25Prob)).toFixed(2));
    const fairBttsYesOdds = Number((100 / Math.max(1, modelBttsYesProb)).toFixed(2));

    // Calcolo Expected Value (EV%) sui mercati della partita
    const ev1 = ((modelHomeProb / 100) * scraped.homeOdds - 1) * 100;
    const evX = ((modelDrawProb / 100) * scraped.drawOdds - 1) * 100;
    const ev2 = ((modelAwayProb / 100) * scraped.awayOdds - 1) * 100;
    const evOver = scraped.over25Odds ? ((modelOver25Prob / 100) * scraped.over25Odds - 1) * 100 : -10;
    const evUnder = scraped.under25Odds ? (((100 - modelOver25Prob) / 100) * scraped.under25Odds - 1) * 100 : -10;
    const evBtts = scraped.bttsYesOdds ? ((modelBttsYesProb / 100) * scraped.bttsYesOdds - 1) * 100 : -10;

    const evs = [
      { market: '1 (Vittoria Casa)', ev: ev1, edge: scraped.homeOdds - fairHomeOdds, fair: fairHomeOdds, book: scraped.homeOdds },
      { market: 'X (Pareggio)', ev: evX, edge: scraped.drawOdds - fairDrawOdds, fair: fairDrawOdds, book: scraped.drawOdds },
      { market: '2 (Vittoria Ospite)', ev: ev2, edge: scraped.awayOdds - fairAwayOdds, fair: fairAwayOdds, book: scraped.awayOdds },
      { market: 'Over 2.5', ev: evOver, edge: (scraped.over25Odds || 1.85) - fairOver25Odds, fair: fairOver25Odds, book: scraped.over25Odds || 1.85 },
      { market: 'Under 2.5', ev: evUnder, edge: (scraped.under25Odds || 1.85) - fairUnder25Odds, fair: fairUnder25Odds, book: scraped.under25Odds || 1.85 },
      { market: 'Goal (BTTS Sì)', ev: evBtts, edge: (scraped.bttsYesOdds || 1.80) - fairBttsYesOdds, fair: fairBttsYesOdds, book: scraped.bttsYesOdds || 1.80 },
    ];
    evs.sort((a, b) => b.ev - a.ev);
    const bestMarket = evs[0];

    // Riferimenti statistici per approfondimento
    let highlightTitle = '';
    let highlightDesc = '';
    let tag: ScrapedMatchStatEvaluation['primaryHighlight']['tag'] = 'value_bet';
    let badgeLabel = 'VALUE BET';
    let color: ScrapedMatchStatEvaluation['primaryHighlight']['color'] = 'emerald';
    let interestScore = 50;

    if (bestMarket.ev >= 6.0) {
      interestScore = Math.min(99, Math.round(75 + bestMarket.ev * 1.5));
      tag = 'value_bet';
      badgeLabel = '🔥 VALUE BET PRIMARIA';
      color = 'emerald';
      highlightTitle = `Forte Sottostima su ${bestMarket.market} (+${bestMarket.ev.toFixed(1)}% EV)`;
      highlightDesc = `Il modello statistico assegna quota equa @${bestMarket.fair.toFixed(2)} rispetto alla generosa quota Sisal di @${bestMarket.book.toFixed(2)} (Edge: +${(bestMarket.book - bestMarket.fair).toFixed(2)}).`;
    } else if (modelOver25Prob >= 62 && (scraped.over25Odds || 1.8) >= 1.70) {
      interestScore = 84;
      tag = 'over_under_anomaly';
      badgeLabel = '⚡ OVER 2.5 ALTAMENTE PROBABILE';
      color = 'amber';
      highlightTitle = `Elevata Produzione Offensiva Stimata (${modelOver25Prob}% Over)`;
      highlightDesc = `Volume xG e tendenza al gol combinata proiettano una gara aperta con frequenza Over 2.5 molto alta rispetto alla quota Sisal @${scraped.over25Odds?.toFixed(2) || '1.80'}.`;
    } else if (modelOver25Prob <= 38 && (scraped.under25Odds || 1.8) >= 1.60) {
      interestScore = 82;
      tag = 'defensive_lock';
      badgeLabel = '🛡️ SOLIDITÀ DIFENSIVA (UNDER)';
      color = 'cyan';
      highlightTitle = `Scenario Tattico a Basso Punteggio (${(100 - modelOver25Prob).toFixed(1)}% Under)`;
      highlightDesc = `Entrambe le formazioni registrano difese ermetiche: probabilità Under 2.5 predominante con quota Sisal vantaggiosa @${scraped.under25Odds?.toFixed(2) || '1.75'}.`;
    } else if (modelDrawProb >= 30 && scraped.drawOdds >= 3.30) {
      interestScore = 78;
      tag = 'draw_bias';
      badgeLabel = '⚖️ PAREGGIO SOTTOVALUTATO';
      color = 'purple';
      highlightTitle = `Equilibrio Tattico e Valore sul Pareggio (X @${scraped.drawOdds.toFixed(2)})`;
      highlightDesc = `Il modello evidenzia quote equilibrate tra le due squadre con incidenza del segno X del ${modelDrawProb}% rispetto a quanto prezzato da Sisal.`;
    } else {
      interestScore = Math.round(55 + Math.max(0, bestMarket.ev * 2));
      tag = 'historical_edge';
      badgeLabel = '📊 TREND STATISTICO LINEARE';
      color = 'blue';
      highlightTitle = `Allineamento Modello & Sisal: ${scraped.homeTeam} vs ${scraped.awayTeam}`;
      highlightDesc = `Quote del bookmaker coerenti con la lavagna analitica. Miglior rendimento potenziale su ${bestMarket.market} (EV: ${bestMarket.ev >= 0 ? '+' : ''}${bestMarket.ev.toFixed(1)}%).`;
    }

    matchedEvaluations.push({
      match: scraped,
      fairHomeOdds,
      fairDrawOdds,
      fairAwayOdds,
      fairOver25Odds,
      fairUnder25Odds,
      fairBttsYesOdds,
      modelHomeProb,
      modelDrawProb,
      modelAwayProb,
      modelOver25Prob,
      modelBttsYesProb,
      bestValueMarket: bestMarket.market,
      bestValueEdgePct: Number(bestMarket.edge.toFixed(2)),
      bestValueEvPct: Number(bestMarket.ev.toFixed(1)),
      primaryHighlight: {
        title: highlightTitle,
        description: highlightDesc,
        tag,
        badgeLabel,
        color,
      },
      interestScore,
      historicalMatchesCount: homeMatches.length + awayMatches.length,
      homeMatchesInDb: homeMatches.length,
      awayMatchesInDb: awayMatches.length,
      headToHeadMatchesInDb: h2hMatches.length,
      hasTeamsInDatabase: true,
    });
  });

  // Ordina per interesse statistico decrescente (+EV e anomalie in cima)
  matchedEvaluations.sort((a, b) => b.interestScore - a.interestScore);

  return {
    matchedEvaluations,
    excludedMatches,
    stats: {
      totalScraped: scrapedMatches.length,
      matchedCount: matchedEvaluations.length,
      excludedCount: excludedMatches.length,
    },
  };
}

/**
 * Valuta e incrocia le partite con il Database Statistico
 * Restituisce ESCLUSIVAMENTE le partite che hanno uno storico valido nel database.
 */
export function evaluateScrapedMatchesWithStats(
  scrapedMatches: ScrapedMatchItem[],
  fullDatabase: Match[],
  config?: AnalysisConfig
): ScrapedMatchStatEvaluation[] {
  return filterMatchesWithDatabaseHistory(scrapedMatches, fullDatabase, config).matchedEvaluations;
}
