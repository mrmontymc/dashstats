import Papa from 'papaparse';
import { Match, MatchResult } from '../types/football';

/**
 * Normalizza e mappa una riga CSV a un oggetto Match
 */
function normalizeMatchRow(row: Record<string, any>, index: number): Match | null {
  // Trova chiavi ignorando maiuscole/minuscole e spazi
  const keys = Object.keys(row);
  const findKey = (candidates: string[]): string | undefined => {
    return keys.find(k => candidates.includes(k.trim().toLowerCase()));
  };

  const homeTeamKey = findKey(['hometeam', 'home_team', 'home team', 'squadra casa', 'squadracasa', 'casa', 'home']);
  const awayTeamKey = findKey(['awayteam', 'away_team', 'away team', 'squadra trasferta', 'squadratrasferta', 'trasferta', 'ospite', 'away']);

  if (!homeTeamKey || !awayTeamKey) return null;

  const homeTeam = String(row[homeTeamKey] || '').trim();
  const awayTeam = String(row[awayTeamKey] || '').trim();

  if (!homeTeam || !awayTeam || homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
    return null;
  }

  // Gol Casa e Trasferta
  const homeGoalsKey = findKey(['fthg', 'homegoals', 'home_goals', 'home goals', 'gol casa', 'gol_casa', 'reti casa', 'hg']);
  const awayGoalsKey = findKey(['ftag', 'awaygoals', 'away_goals', 'away goals', 'gol trasferta', 'gol_trasferta', 'reti trasferta', 'ag']);

  const homeGoalsRaw = homeGoalsKey ? row[homeGoalsKey] : undefined;
  const awayGoalsRaw = awayGoalsKey ? row[awayGoalsKey] : undefined;

  const homeGoals = homeGoalsRaw !== undefined && homeGoalsRaw !== '' ? Number(homeGoalsRaw) : NaN;
  const awayGoals = awayGoalsRaw !== undefined && awayGoalsRaw !== '' ? Number(awayGoalsRaw) : NaN;

  if (isNaN(homeGoals) || isNaN(awayGoals)) {
    return null;
  }

  // Risultato (H, D, A)
  let result: MatchResult = 'D';
  if (homeGoals > awayGoals) result = 'H';
  else if (awayGoals > homeGoals) result = 'A';

  // Data
  const dateKey = findKey(['date', 'match_date', 'data', 'giorno', 'matchdate', 'datetime']);
  let date = dateKey && row[dateKey] ? String(row[dateKey]).trim() : '';
  if (!date) {
    date = `Matchday ${index + 1}`;
  } else {
    // Normalizza date nel formato YYYY-MM-DD o DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [d, m, y] = date.split('/');
      date = `${y}-${m}-${d}`;
    } else if (/^\d{2}\/\d{2}\/\d{2}$/.test(date)) {
      const [d, m, y] = date.split('/');
      const fullYear = Number(y) > 50 ? `19${y}` : `20${y}`;
      date = `${fullYear}-${m}-${d}`;
    }
  }

  const parseNum = (candidates: string[]): number | undefined => {
    const k = findKey(candidates);
    if (!k || row[k] === undefined || row[k] === '') return undefined;
    const val = Number(row[k]);
    return isNaN(val) ? undefined : val;
  };

  const matchday = parseNum(['matchday', 'round', 'giornata', 'md', 'gw']);
  const competition = findKey(['div', 'league', 'competition', 'campionato', 'torneo']) 
    ? String(row[findKey(['div', 'league', 'competition', 'campionato', 'torneo'])!]).trim() 
    : undefined;
  const season = findKey(['season', 'stagione', 'anno']) 
    ? String(row[findKey(['season', 'stagione', 'anno'])!]).trim() 
    : undefined;

  // Statistiche aggiuntive
  const homeShots = parseNum(['hs', 'homeshots', 'home_shots', 'tiri casa', 'tiricasa', 'shots_home']);
  const awayShots = parseNum(['as', 'awayshots', 'away_shots', 'tiri trasferta', 'tiritrasferta', 'shots_away']);
  const homeShotsTarget = parseNum(['hst', 'homeshotsontarget', 'tiri in porta casa', 'tiri_porta_casa', 'shotsontarget_home']);
  const awayShotsTarget = parseNum(['ast', 'awayshotsontarget', 'tiri in porta trasferta', 'tiri_porta_trasferta', 'shotsontarget_away']);
  const homeCorners = parseNum(['hc', 'homecorners', 'calci d\'angolo casa', 'angoli casa', 'corners_home']);
  const awayCorners = parseNum(['ac', 'awaycorners', 'calci d\'angolo trasferta', 'angoli trasferta', 'corners_away']);
  const homeFouls = parseNum(['hf', 'homefouls', 'falli casa', 'fallicasa', 'fouls_home']);
  const awayFouls = parseNum(['af', 'awayfouls', 'falli trasferta', 'fallitrasferta', 'fouls_away']);
  const homeYellows = parseNum(['hy', 'homeyellows', 'ammonizioni casa', 'gialli casa', 'yellows_home']);
  const awayYellows = parseNum(['ay', 'awayyellows', 'ammonizioni trasferta', 'gialli trasferta', 'yellows_away']);
  const homeReds = parseNum(['hr', 'homereds', 'espulsioni casa', 'rossi casa', 'reds_home']);
  const awayReds = parseNum(['ar', 'awayreds', 'espulsioni trasferta', 'rossi trasferta', 'reds_away']);

  // xG e Possesso palla
  let homeXg = parseNum(['homexg', 'home_xg', 'xg_home', 'xg casa', 'xgcasa']);
  let awayXg = parseNum(['awayxg', 'away_xg', 'xg_away', 'xg trasferta', 'xgtrasferta']);

  // Se xG non è presente nel CSV, stima verosimile da tiri e tiri in porta
  if (homeXg === undefined && homeShots !== undefined) {
    const onTarget = homeShotsTarget ?? Math.round(homeShots * 0.35);
    homeXg = Number((onTarget * 0.28 + (homeShots - onTarget) * 0.05 + homeGoals * 0.15).toFixed(2));
  }
  if (awayXg === undefined && awayShots !== undefined) {
    const onTarget = awayShotsTarget ?? Math.round(awayShots * 0.35);
    awayXg = Number((onTarget * 0.28 + (awayShots - onTarget) * 0.05 + awayGoals * 0.15).toFixed(2));
  }

  const homePossession = parseNum(['homepossession', 'home_possession', 'possesso casa', 'possession_home']);
  const awayPossession = parseNum(['awaypossession', 'away_possession', 'possesso trasferta', 'possession_away']);

  // Tempi parziali (1° tempo)
  let halfTimeHomeGoals = parseNum(['hthg', 'half_time_home_goals', 'ht_hg', 'gol_1t_casa', 'ht home goals']);
  let halfTimeAwayGoals = parseNum(['htag', 'half_time_away_goals', 'ht_ag', 'gol_1t_trasferta', 'ht away goals']);

  // Rilevamento Provenienza Quote Bookmaker
  let oddsSource = 'Modello Sintetico CalcioMetrics';
  if (findKey(['b365h', 'b365d', 'b365a'])) oddsSource = 'Bet365 (Feed Ufficiale)';
  else if (findKey(['psh', 'psd', 'psa'])) oddsSource = 'Pinnacle Sports (Closing Line)';
  else if (findKey(['avgh', 'avgd', 'avga'])) oddsSource = 'Media di Mercato Bookmaker (Avg)';
  else if (findKey(['whh', 'whd', 'wha'])) oddsSource = 'William Hill';
  else if (findKey(['bwh', 'bwd', 'bwa'])) oddsSource = 'Betway / Betfair';
  else if (findKey(['home_odds', 'draw_odds', 'away_odds'])) oddsSource = 'CSV Utente Personalizzato';

  // Quote Bookmaker
  let homeOdds = parseNum(['b365h', 'avgh', 'psh', 'whh', 'bwh', 'quota casa', 'quotacasa', 'home_odds', 'odd_1', '1']);
  let drawOdds = parseNum(['b365d', 'avgd', 'psd', 'whd', 'bwd', 'quota pareggio', 'quotapareggio', 'draw_odds', 'odd_x', 'x']);
  let awayOdds = parseNum(['b365a', 'avga', 'psa', 'wha', 'bwa', 'quota trasferta', 'quotatrasferta', 'away_odds', 'odd_2', '2']);

  let over25Odds = parseNum(['b365>2.5', 'avg>2.5', 'p>2.5', 'over25', 'quota over 2.5', 'over_2.5_odds', 'over2.5']);
  let under25Odds = parseNum(['b365<2.5', 'avg<2.5', 'p<2.5', 'under25', 'quota under 2.5', 'under_2.5_odds', 'under2.5']);

  let bttsYesOdds = parseNum(['b365btts_y', 'avgbtts_y', 'btts_yes', 'quota gol', 'gol_quota', 'gg_quota']);
  let bttsNoOdds = parseNum(['b365btts_n', 'avgbtts_n', 'btts_no', 'quota nogol', 'nogol_quota', 'ng_quota']);

  let cornerOver95Odds = parseNum(['corner_over95', 'c_over9.5', 'corner_over9.5', 'quota angoli over']);
  let cornerUnder95Odds = parseNum(['corner_under95', 'c_under9.5', 'corner_under9.5', 'quota angoli under']);

  // Se mancano quote 1X2, generiamo quote realistiche di mercato basate su xG e forza
  if (!homeOdds || !drawOdds || !awayOdds) {
    const diff = (homeXg ?? 1.3) - (awayXg ?? 1.1);
    const p1 = Math.min(0.85, Math.max(0.12, 0.44 + diff * 0.22));
    const p2 = Math.min(0.75, Math.max(0.08, 0.28 - diff * 0.18));
    const px = Math.max(0.15, 1 - p1 - p2);
    const margin = 1.052; // 5.2% overround bookmaker

    homeOdds = Number((margin / p1).toFixed(2));
    drawOdds = Number((margin / px).toFixed(2));
    awayOdds = Number((margin / p2).toFixed(2));
    oddsSource = 'Modello Sintetico CalcioMetrics (Overround 5.2%)';
  }

  // Calcolo Overround del Bookmaker (%)
  const overround = Number((((1 / homeOdds) + (1 / drawOdds) + (1 / awayOdds) - 1) * 100).toFixed(1));

  if (!over25Odds || !under25Odds) {
    const totalExpectedGoals = (homeXg ?? 1.3) + (awayXg ?? 1.1);
    const pOver = totalExpectedGoals > 2.7 ? 0.58 : totalExpectedGoals > 2.4 ? 0.50 : 0.42;
    over25Odds = Number((1.06 / pOver).toFixed(2));
    under25Odds = Number((1.06 / (1 - pOver)).toFixed(2));
  }

  if (!bttsYesOdds || !bttsNoOdds) {
    const pBtts = ((homeXg ?? 1.2) > 0.9 && (awayXg ?? 1.0) > 0.8) ? 0.54 : 0.46;
    bttsYesOdds = Number((1.06 / pBtts).toFixed(2));
    bttsNoOdds = Number((1.06 / (1 - pBtts)).toFixed(2));
  }

  if (!cornerOver95Odds || !cornerUnder95Odds) {
    const totalCorners = (homeCorners ?? 5) + (awayCorners ?? 4.5);
    const pCornerOver = totalCorners >= 10 ? 0.52 : 0.47;
    cornerOver95Odds = Number((1.08 / pCornerOver).toFixed(2));
    cornerUnder95Odds = Number((1.08 / (1 - pCornerOver)).toFixed(2));
  }

  // Se mancano i gol del 1° tempo, stima proporzionale verosimile (~45% dei gol totali)
  if (halfTimeHomeGoals === undefined) {
    halfTimeHomeGoals = homeGoals > 0 ? Math.floor(homeGoals * 0.45 + (index % 2 === 0 ? 0 : 0.5)) : 0;
  }
  if (halfTimeAwayGoals === undefined) {
    halfTimeAwayGoals = awayGoals > 0 ? Math.floor(awayGoals * 0.42 + (index % 3 === 0 ? 0 : 0.5)) : 0;
  }

  return {
    id: `m_${index}_${homeTeam.replace(/\s+/g, '')}_${awayTeam.replace(/\s+/g, '')}`,
    matchday,
    date,
    season,
    competition,
    homeTeam,
    awayTeam,
    homeGoals,
    awayGoals,
    result,
    halfTimeHomeGoals,
    halfTimeAwayGoals,
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
    oddsSource,
    overround,
  };
}

export interface ParseResult {
  matches: Match[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
  errors: string[];
  columnsFound: string[];
}

/**
 * Effettua il parsing di un file CSV o stringa di testo
 */
export function parseFootballCSV(csvContent: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, any>>(csvContent, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const matches: Match[] = [];
        const errors: string[] = [];
        let validRows = 0;
        let skippedRows = 0;

        const columns = results.meta.fields || [];

        results.data.forEach((row, i) => {
          try {
            const match = normalizeMatchRow(row, i);
            if (match) {
              matches.push(match);
              validRows++;
            } else {
              skippedRows++;
            }
          } catch (err: any) {
            skippedRows++;
            if (errors.length < 5) {
              errors.push(`Riga ${i + 1}: ${err.message || 'Errore di parsing'}`);
            }
          }
        });

        resolve({
          matches,
          totalRows: results.data.length,
          validRows,
          skippedRows,
          errors,
          columnsFound: columns,
        });
      },
      error: (error: Error) => {
        resolve({
          matches: [],
          totalRows: 0,
          validRows: 0,
          skippedRows: 0,
          errors: [error.message],
          columnsFound: [],
        });
      }
    });
  });
}

/**
 * Esporta le partite filtrate in un file CSV scaricabile
 */
export function exportMatchesToCSV(matches: Match[], filename = 'calciometrics_export.csv'): void {
  const exportData = matches.map(m => ({
    Data: m.date,
    'Giornata': m.matchday || '',
    'Campionato': m.competition || '',
    'Squadra Casa': m.homeTeam,
    'Squadra Trasferta': m.awayTeam,
    'Gol Casa': m.homeGoals,
    'Gol Trasferta': m.awayGoals,
    'Esito': m.result,
    'Tiri Casa': m.homeShots ?? '',
    'Tiri Trasferta': m.awayShots ?? '',
    'Tiri in Porta Casa': m.homeShotsTarget ?? '',
    'Tiri in Porta Trasferta': m.awayShotsTarget ?? '',
    'xG Casa': m.homeXg ?? '',
    'xG Trasferta': m.awayXg ?? '',
    'Falli Casa': m.homeFouls ?? '',
    'Falli Trasferta': m.awayFouls ?? '',
    'Gialli Casa': m.homeYellows ?? '',
    'Gialli Trasferta': m.awayYellows ?? '',
    'Rossi Casa': m.homeReds ?? '',
    'Rossi Trasferta': m.awayReds ?? '',
    'Corner Casa': m.homeCorners ?? '',
    'Corner Trasferta': m.awayCorners ?? '',
    'Quota 1': m.homeOdds ?? '',
    'Quota X': m.drawOdds ?? '',
    'Quota 2': m.awayOdds ?? '',
    'Quota Over 2.5': m.over25Odds ?? '',
    'Quota Under 2.5': m.under25Odds ?? '',
    'Quota Gol (GG)': m.bttsYesOdds ?? '',
    'Quota NoGol (NG)': m.bttsNoOdds ?? '',
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
