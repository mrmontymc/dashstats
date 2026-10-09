import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Calculator,
  Percent,
  TrendingUp,
  Scale,
  Coins,
  Shield,
  Target,
  Layers,
  Flag,
  HelpCircle,
  Search,
  CheckCircle2,
  ChevronRight,
  Info,
  Sliders,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface MetricItem {
  id: string;
  category: 'modelli' | 'xg' | 'quote' | 'corner' | 'bancatura';
  title: string;
  badge: string;
  shortDesc: string;
  formula?: string;
  detailedExplanation: string[];
  practicalApplication: string;
  example: string;
}

export const MetricsGuideView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('poisson-dixon');

  const metrics: MetricItem[] = [
    {
      id: 'poisson-dixon',
      category: 'modelli',
      title: 'Distribuzione di Poisson Bivariata & Correzione Dixon-Coles',
      badge: 'Modello Fondamentale',
      shortDesc:
        'Modello probabilistico per la previsione dei gol esatti e dei risultati attraverso distribuzioni di eventi rari e discreti, corretto per la dipendenza a basso punteggio.',
      formula: 'P(X = x, Y = y) = Poisson(x, λ_H) · Poisson(y, λ_A) · τ(x, y, λ_H, λ_A, ρ)',
      detailedExplanation: [
        'Il modello assume che i gol segnati in una partita di calcio seguano un processo di Poisson indipendente, dove ogni squadra ha un valore atteso di gol (λ_Home e λ_Away) determinato dalla propria forza offensiva, dalla difesa avversaria e dal fattore campo.',
        'La formula di Poisson classica P(k, λ) = (λ^k · e^(-λ)) / k! sottostima la frequenza dei pareggi con pochi gol (0-0, 1-1) e delle vittorie di misura (1-0, 0-1) tipiche del calcio professionistico.',
        'La correzione di Dixon-Coles introduce il parametro di correlazione empirica ρ = -0.13 attraverso la funzione moltiplicativa τ. Questo aggiustamento redistribuisce la probabilità congiunta nei punteggi bassi senza alterare i valori marginali, garantendo proiezioni estremamente aderenti alla realtà.',
      ],
      practicalApplication:
        'Genera la matrice di probabilità per tutti i punteggi da 0-0 a 7-7. Da questa matrice vengono derivati in modo rigoroso tutti i mercati derivati: 1X2, Under/Over da 1.5 a 4.5, Goal/No Goal, Doppia Chance e Risultato Esatto.',
      example:
        'Se Inter (λ_H = 1.95) affronta Verona (λ_A = 0.75), la matrice assegna al Risultato Esatto 2-0 una probabilità del 14.8%, all’1-0 il 13.2% e all’Under 2.5 complessivo il 48.3%.',
    },
    {
      id: 'monte-carlo-simulation',
      category: 'modelli',
      title: 'Simulazione Stocastica Monte Carlo (10.000+ Iterazioni) & Telemetria',
      badge: 'Metodo Alternativo Stocastico',
      shortDesc:
        'Alternativa computazionale avanzata che simula migliaia di scenari di gara indipendenti incorporando sovradispersione del ritmo, dinamiche di punteggio in-game ed espulsioni.',
      formula: 'P_MC(Esito) = (1 / N) · Σ_{i=1}^{N} \mathbb{I}_{match_i \in Esito}, con N \in [5.000, 50.000]',
      detailedExplanation: [
        'A differenza dei modelli in forma chiusa (come Poisson), il metodo Monte Carlo genera una popolazione empirica di migliaia di partite simulate (default 10.000 run), estraendo frequenze dirette non vincolate a presupposti di linearità.',
        'Sovradispersione & Shock di Ritmo: ogni partita simulata subisce variazioni stocastiche di ritmo e forma giornaliera, catturando l’overdispersion reale del calcio in cui la varianza supera la media.',
        'Dinamica di Punteggio (Game-State Momentum): modella il comportamento tra primo e secondo tempo. Se una squadra va in svantaggio, aumenta la propria propensione offensiva (+15%) esponendosi a un maggior rischio di contropiede (+18%). Se il match è in parità, subentra maggiore disciplina tattica.',
        'Imprevisti & Cartellini Rossi: introduce la probabilità stocastica di espulsione (~8.5% di incidenza), che riduce del 32-35% la capacità realizzativa della squadra penalizzata e aumenta le concessioni difensive.',
        'Validazione & Intervalli di Confidenza: restituisce per ogni squadra la media gol, la deviazione standard (volatilità delle reti), l’intervallo di confidenza al 95% e il margine di errore di convergenza (SE ≤ ±0.35%).',
      ],
      practicalApplication:
        'Fornisce allo scommettitore una seconda opinione quantitativa indipendente. Quando il modello Poisson e la simulazione Monte Carlo convergono sullo stesso pronostico, l’affidabilità statistica della selezione raggiunge il massimo livello possibile.',
      example:
        'Su 10.000 iterazioni, una squadra favorita vince 4.820 volte (48.2%), con 2.620 pareggi (26.2%) e 2.560 sconfitte (25.6%). La quota equa calcolata è @2.07 con intervallo di confidenza dei gol interni tra [1.79 e 1.85].',
    },
    {
      id: 'xg-xpoints',
      category: 'xg',
      title: 'Expected Goals (xG), Differenziale xG & Punti Attesi (xPoints)',
      badge: 'Metrica Prestazionale',
      shortDesc:
        'Misura quantitativa della qualità delle occasioni create e concesse, convertita in probabilità di vittoria e punti attesi su scala continua.',
      formula: 'xPoints = P(Win) · 3 + P(Draw) · 1, con P(Win) = 1 / (1 + e^(-1.6 · ΔxG))',
      detailedExplanation: [
        'L’Expected Goal (xG) assegna a ogni tiro un valore compreso tra 0.01 e 0.99, rappresentante la probabilità che quel tentativo si trasformi in rete, considerando parametri quali distanza, angolo, parte del corpo e pressione difensiva.',
        'Il Differenziale xG (ΔxG = xG Fatti - xG Subiti) sintetizza il dominio territoriale e la solidità della squadra prescindendo dalla casualità delle deviazioni e degli errori arbitrali.',
        'I Punti Attesi (xPoints) vengono calcolati trasformando il ΔxG tramite funzione sigmoide logistica. Confrontando i Punti Reali con i Punti Attesi si individua l’Indice di Regressione (xPts Delta).',
      ],
      practicalApplication:
        'Permette di smascherare squadre temporaneamente sovrastimate dalla classifica per fortuna realizzativa (overperformance), o squadre sottovalutate dal mercato che creano molte occasioni ma hanno raccolto meno punti del dovuto (underperformance).',
      example:
        'Una squadra con 35 punti reali ma solo 26.4 xPoints presenta un delta di +8.6 pt (Regressione Negativa Imminente), indicando che a lungo termine subirà un calo dei risultati.',
    },
    {
      id: 'power-form-decay',
      category: 'modelli',
      title: 'Power Ranking Offensivo/Difensivo & Decadimento di Forma Recente',
      badge: 'Calibrazione Parametri',
      shortDesc:
        'Indici normalizzati di attacco e difesa calcolati sul benchmark di lega, con peso dinamico sulle ultime 5 partite rispetto allo storico dei 50 record recenti.',
      formula: 'λ_Home = MediaGolLega_Casa · Att_Casa · Def_Ospite · FattoreCampo',
      detailedExplanation: [
        'L’Indice di Attacco (Att) misura la capacità realizzativa rapportata alla media del campionato (valore 1.00 = perfettamente in media, 1.45 = attacco del 45% superiore alla media).',
        'L’Indice di Difesa (Def) misura i gol subiti rispetto alla media di lega (valore 0.70 = difesa d’élite che concede il 30% in meno della media).',
        'La ponderazione temporale (Recent Form Weight, default 40%) attribuisce un peso specifico alle prestazioni delle ultime 5 gare, catturando cambi di allenatore, infortuni e momentum positivo, mantenendo il restante 60% ancorato al trend solido dei 50 record più recenti.',
      ],
      practicalApplication:
        'Consente di adattare istantaneamente il modello alle reali condizioni di salute della squadra, evitando bias dovuti a partite disputate mesi prima in contesti tattici differenti.',
      example:
        'Una squadra che ha segnato 12 gol nelle ultime 5 partite vedrà il proprio Attacco corretto al rialzo del +18% rispetto alla sola media dei 50 match storici.',
    },
    {
      id: 'novig-methods',
      category: 'quote',
      title: 'De-Biasing No-Vig (Shin, Power, Proporzionale) & Margine del Banco',
      badge: 'Analisi Finanziaria Quote',
      shortDesc:
        'Tecniche matematiche avanzate per rimuovere l’aggio (overround) applicato dal bookmaker e risalire alle quote eque ("True Odds").',
      formula: 'Overround = (Σ (1 / Quota_i) - 1) · 100',
      detailedExplanation: [
        'I bookmaker inseriscono un margine artificiale (solitamente tra il 4% e il 8%) affinché la somma delle probabilità implicite superi il 100%.',
        'Metodo Proporzionale: divide la probabilità implicita di ciascun esito per la somma totale delle probabilità implicite. È il metodo più comune ma non tiene conto del Favorite-Longshot Bias.',
        'Modello di Shin: scompone il volume delle scommesse in scommettitori con informazioni privilegiate (insider volume z) e scommettitori ordinari. Riconosce che il bookmaker carica un margine asimmetrico più elevato sulle quote alte (sfavorite), garantendo una depurazione superiore.',
        'Power Method: eleva le probabilità a un esponente k < 1 tale che la somma risulti esattamente 1.00.',
      ],
      practicalApplication:
        'Consente allo scommettitore di conoscere il prezzo di pareggio matematico (Zero-Profit Point) per ciascun mercato prima di valutare se la quota offerta possiede valore atteso positivo.',
      example:
        'Con quote 1.80 / 3.60 / 4.50 (Overround 5.55%), la quota equa Shin per il Segno 1 è 1.88, per la X è 3.82 e per il Segno 2 è 4.88.',
    },
    {
      id: 'ev-kelly',
      category: 'quote',
      title: 'Valore Atteso (Expected Value EV%), Quota di Riferimento & Quota Utile Minima',
      badge: 'Strategia di Scommessa',
      shortDesc:
        'Quantificazione del rendimento matematico a lungo termine e applicazione del filtro di esclusione per quote sotto 1.30.',
      formula: 'EV% = [ (Probabilità / 100) · Quota - 1 ] · 100',
      detailedExplanation: [
        'Un esito presenta Valore Atteso Positivo (+EV) quando la probabilità stimata dal modello predittivo supera la probabilità implicita nella quota offerta dal bookmaker.',
        'La Quota di Riferimento Minima (+EV Buffer) include un margine di sicurezza (4% - 12%) sopra la quota fair per proteggere il capitale dalla varianza naturale.',
        'Regola di Esclusione Quota Utile < 1.30: le scommesse con quote inferiori a 1.30 vengono scartate automaticamente dall’offerta completa dei pronostici, poiché anche con alta frequenza presentano un rapporto rischio/rendimento inadeguato che distrugge il bankroll a fronte di imprevisti rari.',
      ],
      practicalApplication:
        'Fornisce la guida operativa per piazzare scommesse solo quando il mercato sottovaluta un esito, trasformando il betting in un investimento statistico quantitativo.',
      example:
        'Se il modello assegna all’Over 2.5 il 60% (Fair Odd = 1.67) e il bookmaker quota a 1.85, l’EV% è +11.0%. Se la quota fosse 1.25, verrebbe esclusa dal sistema.',
    },
    {
      id: 'corner-laboratory',
      category: 'corner',
      title: 'Laboratorio Calci d’Angolo ad Ampio Range (6.5 - 14.5)',
      badge: 'Mercati Speciali',
      shortDesc:
        'Modellazione statistica indipendente del volume corner per singolo team e totale match su linee estese da 6.5 a 14.5.',
      formula: 'λ_Corners = BaseLega · (Att_Tiri / MediaTiri) · AmpiezzaFasce · Possesso',
      detailedExplanation: [
        'I calci d’angolo non sono casuali: dipendono fortemente dall’indice di ampiezza laterale, dal numero di cross effettuati, dai tiri verso la porta respinti dai difensori e dal baricentro tattico.',
        'Il sistema calcola i λ_Corner attesi per la squadra di casa e per quella ospite, aggregando la distribuzione congiunta per le linee Under/Over da 6.5 a 14.5.',
        'Vengono inoltre elaborate le fasce aggregate di mercato (0-8 corner, 9-11 mediana, 12-14, 15+) e il mercato 1X2 Corner (chi batterà più corner).',
      ],
      practicalApplication:
        'Individua opportunità ad alto valore sui mercati secondari spesso trascurati o prezzati in modo poco efficiente dai bookmaker.',
      example:
        'Se una squadra gioca con baricentro offensivo e 16 tiri/partita, il modello proietta 6.2 corner interni con l’Over 4.5 Corner Casa al 68.4%.',
    },
    {
      id: 'odds-tolerance-min2',
      category: 'bancatura',
      title: 'Analisi Storica nel Database con Tolleranza Stringente & Vincolo dei 2 Esiti',
      badge: 'Verifica Empirica Mirata',
      shortDesc:
        'Ricerca retrospettiva su tutto il database di partite con quadro quote affine sul mercato 1X2 (o esteso a Over/Under e Goal su scelta utente), con tolleranze stringenti e vincolo di concordanza di almeno 2 quote contemporanee.',
      formula: 'Partita Qualificata ⇔ Conteggio_MercatiSelezionati( |QuotaDB_i - QuotaTarget_i| ≤ Tolleranza_i ) ≥ 2',
      detailedExplanation: [
        'Per convalidare una simulazione, il sistema interroga l’intero archivio storico alla ricerca di partite reali in cui i bookmaker avevano fissato quote simili con parametri di controllo stringenti.',
        'Mercato Base 1X2: il confronto avviene di default esclusivamente sul mercato 1X2. La coppia di valori entro la tolleranza viene cercata strettamente tra le quote 1, X e 2 (es. Quota 1 e Quota X, oppure Quota 1 e Quota 2).',
        'Inclusione Opzionale di Under/Over e Goal: l’utente può scegliere interattivamente se includere nella valutazione e nel vincolo di concordanza anche i mercati Over/Under 2.5 e Goal/No Goal (BTTS).',
        'Tolleranze Stringenti e Mirate: Ultra-Stretta / Rigorosa (±0.05 per 1, ±0.08 per X, ±0.10 per 2), Stretta Mirata (±0.10/0.12/0.15), Moderata Controllata (±0.18/0.22/0.26) o Fascia Ristretta Dinamica (scarti minimi proporzionati alla quota favorita). Le vecchie tolleranze permissive sono state sostituite per garantire campioni storici estremamente fedeli.',
        'Vincolo Vincolante dei 2 Esiti: una partita storica viene considerata affine solo se almeno 2 delle sue quote nei mercati attivi rientrano entro i limiti di tolleranza rispetto alle quote analizzate, eliminando i falsi positivi dovuti a una singola quota fortuita.',
      ],
      practicalApplication:
        'Fornisce la percentuale empirica di successo reale registrata sul campo in match con lo stesso profilo quote 1X2 (e opzionalmente O/U e GG), confrontando la teoria del modello con la storia reale del database in un intorno ristretto.',
      example:
        'Confrontando un match con Quota 1 @1.90, X @3.40 e 2 @4.00 sul mercato 1X2 in modalità Stretta, il DB estrae tutte le partite storiche aventi almeno 2 quote compatibili (es. 1 tra 1.80-2.00 e X tra 3.28-3.52), calcolando frequenze effettive e ROI reale.',
    },
    {
      id: 'profitable-patterns',
      category: 'bancatura',
      title: 'Pattern Profittevoli & Odds Bracket Analysis a Range Ridotto',
      badge: 'Market Anomalies Mirate',
      shortDesc:
        'Rilevazione automatica di anomalie di quota, fasce di mercato a range ridotto con ROI storico positivo e correlazioni condizionate tra mercati.',
      formula: 'Edge = FrequenzaReale% - ProbabilitàImplicita% | ROI% = (ProfittoNetto / StakeTotale) · 100',
      detailedExplanation: [
        'Il motore esamina l’intero dataset aggregando i risultati per fasce di quota ravvicinate e mirate (1.10-1.25, 1.26-1.40, 1.41-1.55, 1.56-1.70, 1.71-1.90, 1.91-2.10, fino a >5.50 per 1X2; 1.20-1.35, 1.36-1.50 fino a >3.30 per gol e angoli) riducendo i range analizzati per evitare raggruppamenti generici.',
        'Analisi Condizionata: calcola la probabilità congiunta che un evento si verifichi dato il verificarsi di un altro (es. P(Over 2.5 | Segno 1) o P(GG | Segno 2)).',
        'I Pattern Profittevoli vengono salvati solo se superano la soglia di significatività statistica (minimo 8 scommesse campionarie con ROI positivo nel range specifico).',
      ],
      practicalApplication:
        'Permette di sfruttare le tendenze storiche consolidate di squadre specifiche o di fasce di prezzo ravvicinate in cui i bookmaker tendono a sovraprezzare determinati esiti.',
      example:
        'Nelle partite con quota compresa nella specifica fascia ravvicinata 1.71 - 1.90, il mercato ha evidenziato una sistematica sottostima del segno 1 con un ROI medio del +14.8%.',
    },
    {
      id: 'web-scraping-palinsesto',
      category: 'quote',
      title: 'Web Scraping Quote & Screening Palinsesto (+EV Ranking)',
      badge: 'Integrazione Live Bookmaker',
      shortDesc:
        'Modulo di acquisizione e scraping automatico delle quote da URL del bookmaker (es. SNAI Liga, Serie A, Premier League) con screening istantaneo delle partite a più alta discrepanza statistica.',
      formula: 'Score_{Interesse} = 0.40 · EV_{max} + 0.25 · |Edge| + 0.20 · N_{DB} + 0.15 · Anomalia_{OU/1X2}',
      detailedExplanation: [
        'L’utente può incollare direttamente l’URL del palinsesto (es. SNAI La Liga spagnola, Serie A, Premier League) o il testo/tabella copiato dalla pagina per estrarre in tempo reale tutte le gare con relative quote 1X2, Under/Over 2.5 e Goal/NoGoal.',
        'Ogni partita estratta viene immediatamente incrociata con il database storico di CalcioMetrics, calcolando per ciascun mercato le quote eque (Fair Odds) tramite il modello Dixon-Coles e la simulazione Monte Carlo.',
        'Screening & Ranking: l’algoritmo calcola l’Expected Value (+EV%) e l’Indice di Interesse (da 1 a 100), evidenziando e ordinando in cima le partite con anomalie statistiche più marcate (Value Bets, discrepanze Under/Over, solidità difensive o pareggi sottovalutati).',
        'Un click su "Simula & Approfondisci" carica istantaneamente squadre e quote nel Simulatore Match per l’ispezione approfondita.',
      ],
      practicalApplication:
        'Permette di monitorare l’intero turno di campionato in pochi secondi e individuare all’istante le 2-3 migliori opportunità matematiche della giornata da approfondire nel dettaglio.',
      example:
        'Su un palinsesto di 10 partite de La Liga, il sistema identifica Atletico Madrid vs Siviglia con una Value Bet del +16.8% EV su quota 1 (@1.52 vs equa @1.38), classificandola al 1° posto per indice di interesse.',
    },
    {
      id: 'coerenza-scenari-simulatore',
      category: 'bancatura',
      title: 'Filtro di Coerenza Contestuale: Mercati, Correlazioni & Pattern Applicabili',
      badge: 'Filtro Anti-Rumore Rigoroso',
      shortDesc:
        'Meccanismo di selezione contestuale che mostra nel simulatore solo le correlazioni tra mercati e i pattern profittevoli rigorosamente compatibili con lo scenario di quote e le squadre della partita selezionata.',
      formula: 'Pattern_{attivo} \iff Quota_{match} \in [Min_{pattern} - 0.05, Max_{pattern} + 0.05] \land Scope_{team} = Match_{team}',
      detailedExplanation: [
        'A differenza dei software generici che mostrano elenchi statici di pattern dell’intero campionato, CalcioMetrics applica un filtro di coerenza dinamico.',
        'Correlazioni di Mercato Coerenti: una probabilità condizionata come P(Over 2.5 | 1) viene mostrata solo se la squadra di casa è effettivamente favorita dalle quote inserite (es. quota 1 <= 2.50). Se invece è l’ospite a essere favorito, il sistema attiva esclusivamente gli scenari pertinenti (es. P(Over 2.5 | 2)).',
        'Pattern Profittevoli Applicabili: i pattern basati su fasce di quota vengono visualizzati SOLO se le quote correnti della gara rientrano precisamente in quell’intervallo di prezzo, escludendo tutto il rumore di mercato irrilevante.',
      ],
      practicalApplication:
        'Elimina i falsi positivi cognitivi per lo scommettitore, assicurando che ogni statistica, correlazione e strategia visualizzata sia direttamente attinente e sfruttabile per l’incontro in esame.',
      example:
        'Se si simula Real Madrid vs Barcellona con quota 1 a @1.85, vengono mostrati solo i pattern registrati per la fascia favorita moderata (1.71-1.90) e le correlazioni con vittoria interna, oscurando pattern incompatibili per quote @3.50.',
    },
  ];

  const filteredMetrics = metrics.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.practicalApplication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Guida Metodologica & Glossario Metriche</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Architettura Matematica e Modelli Predittivi di CalcioMetrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Spiegazione scientifica e approfondita di tutti gli algoritmi statistici, delle distribuzioni probabilistiche,
            dei modelli di de-biasing delle quote e delle regole di Money Management utilizzate per generare i pronostici ad alto valore atteso (+EV).
          </p>
        </div>

        {/* Decorative Grid Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-emerald-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cerca metrica, formula o modello..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tutte le Metriche' },
            { id: 'modelli', label: 'Modelli & Poisson' },
            { id: 'xg', label: 'xG & xPoints' },
            { id: 'quote', label: 'Quote & De-biasing' },
            { id: 'corner', label: 'Corner Lab' },
            { id: 'bancatura', label: 'Pattern & DB Storico' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics List Accordion */}
      <div className="space-y-4">
        {filteredMetrics.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">Nessuna metrica trovata</div>
            <p className="text-xs text-slate-500">Prova a modificare i termini di ricerca o la categoria selezionata.</p>
          </div>
        ) : (
          filteredMetrics.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-slate-900/70 border rounded-xl overflow-hidden transition-all duration-200 ${
                  isExpanded
                    ? 'border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 bg-slate-950/40 hover:bg-slate-950/80 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.shortDesc}</p>
                  </div>

                  <div className="shrink-0 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-emerald-400' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Accordion Expanded Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 space-y-5 bg-slate-900/40">
                    {/* Formula Box */}
                    {item.formula && (
                      <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                        <span className="text-[10px] uppercase text-emerald-400 font-bold block mb-1">
                          Espressione / Formula di Riferimento:
                        </span>
                        <div className="text-slate-200 bg-slate-900/80 px-3 py-2 rounded border border-slate-800/80 overflow-x-auto">
                          <code>{item.formula}</code>
                        </div>
                      </div>
                    )}

                    {/* Scientific Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Approfondimento Matematico & Statistico</span>
                      </h4>
                      <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                        {item.detailedExplanation.map((paragraph, idx) => (
                          <p key={idx} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Practical & Example Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                      {/* Practical Application */}
                      <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg space-y-1.5">
                        <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          <span>Applicazione Operativa nei Pronostici</span>
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.practicalApplication}
                        </p>
                      </div>

                      {/* Real Example */}
                      <div className="p-3.5 bg-cyan-950/20 border border-cyan-900/40 rounded-lg space-y-1.5">
                        <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Esempio Pratico sul Campo</span>
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono text-[11px]">
                          {item.example}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Summary Card with Golden Rules */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">
          <Flame className="w-4 h-4" />
          <span>I 4 Pilastri di CalcioMetrics per il Valore Atteso (+EV)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold block">1. Campionamento Recente</span>
            <p className="text-slate-400 text-[11px]">
              Tutti i profili statistici analizzano gli ultimi <strong>50 record</strong> per squadra per massimizzare la rilevanza e ridurre il rumore storico.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold block">2. Vincolo 2 Quote DB</span>
            <p className="text-slate-400 text-[11px]">
              La ricerca storico nel database richiede <strong>almeno 2 esiti concordi</strong> entro la tolleranza per convalidare similarità tattica.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-purple-400 font-bold block">3. Filtro Quota Utile ≥ 1.30</span>
            <p className="text-slate-400 text-[11px]">
              Esclusione automatica di tutte le selezioni con quota utile <strong>inferiore a 1.30</strong> per preservare il bankroll da asimmetrie negative.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold block">4. De-biasing No-Vig</span>
            <p className="text-slate-400 text-[11px]">
              Depurazione continua del margine del bookmaker tramite i modelli <strong>Shin</strong>, <strong>Power</strong> e <strong>Proporzionale</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
