import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  Trash2,
  Layers,
  Plus
} from 'lucide-react';
import { parseFootballCSV, ParseResult } from '../utils/csvParser';
import { generateSampleCsvString, getMultiLeagueSampleMatches } from '../data/sampleDataset';
import { Match } from '../types/football';

interface ParsedFileItem {
  file: File;
  id: string;
  matches: Match[];
  validRows: number;
  totalRows: number;
  error?: string;
}

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (matches: Match[], sourceName: string, append: boolean) => void;
  onLoadSample: () => void;
  onLoadMultiLeague: () => void;
  currentMatchCount: number;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  onLoadSample,
  onLoadMultiLeague,
  currentMatchCount,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedFileItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [deduplicate, setDeduplicate] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = async (files: File[]) => {
    setIsLoading(true);
    setGlobalError(null);

    const newParsedList: ParsedFileItem[] = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const result = await parseFootballCSV(text);

        if (result.matches.length > 0) {
          newParsedList.push({
            file,
            id: `${file.name}_${Date.now()}_${Math.random()}`,
            matches: result.matches,
            validRows: result.validRows,
            totalRows: result.totalRows,
          });
        } else {
          newParsedList.push({
            file,
            id: `${file.name}_${Date.now()}_${Math.random()}`,
            matches: [],
            validRows: 0,
            totalRows: result.totalRows,
            error: 'Nessuna riga valida trovata (verifica colonne squadra casa/ospite e gol).',
          });
        }
      } catch (err: any) {
        newParsedList.push({
          file,
          id: `${file.name}_${Date.now()}_${Math.random()}`,
          matches: [],
          validRows: 0,
          totalRows: 0,
          error: err.message || 'Errore di decodifica file',
        });
      }
    }

    setParsedFiles((prev) => [...prev, ...newParsedList]);
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      processFiles(filesArray);
      // Reset input value per permettere di ricaricare lo stesso file se necessario
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      processFiles(filesArray);
    }
  };

  const removeFile = (id: string) => {
    setParsedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllFiles = () => {
    setParsedFiles([]);
    setGlobalError(null);
  };

  const handleConfirm = () => {
    // Unisci tutte le partite dei file validi
    const allMatchesToLoad: Match[] = [];
    const fileNames: string[] = [];

    parsedFiles.forEach((item) => {
      if (item.matches.length > 0) {
        allMatchesToLoad.push(...item.matches);
        fileNames.push(item.file.name);
      }
    });

    if (allMatchesToLoad.length === 0) {
      setGlobalError('Nessuna partita valida trovata nei file caricati.');
      return;
    }

    // Deduplicazione opzionale (stessa data, squadra casa e squadra trasferta)
    let finalMatches = allMatchesToLoad;
    if (deduplicate) {
      const seen = new Set<string>();
      finalMatches = allMatchesToLoad.filter((m) => {
        const key = `${m.date.toLowerCase()}_${m.homeTeam.toLowerCase()}_${m.awayTeam.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const sourceLabel =
      fileNames.length === 1
        ? fileNames[0]
        : `${fileNames.length} file CSV uniti (${fileNames.slice(0, 2).join(', ')}${
            fileNames.length > 2 ? '...' : ''
          })`;

    onDataLoaded(finalMatches, sourceLabel, importMode === 'append');
    onClose();
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateSampleCsvString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calciometrics_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalValidMatchesCount = parsedFiles.reduce((acc, f) => acc + f.matches.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Carica File CSV Multipli
              </h2>
              <p className="text-xs text-slate-400">
                Importa più stagioni o campionati per ampliare la serie storica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Multi-file Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,text/csv,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-200">
              Trascina qui uno o più file CSV oppure clicca per selezionare
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Supporta selezione multipla di file (es. stagione 2021/22, 2022/23, 2023/24 o leghe multiple)
            </p>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-2 text-center text-xs text-slate-400 font-mono animate-pulse">
              Analisi e normalizzazione dei file CSV in corso...
            </div>
          )}

          {/* Error Message */}
          {globalError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Avviso</span>
                <span>{globalError}</span>
              </div>
            </div>
          )}

          {/* List of Uploaded Files */}
          {parsedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="font-semibold text-slate-200">
                  File Pronti per l'Importazione ({parsedFiles.length})
                </span>
                <button
                  onClick={clearAllFiles}
                  className="text-slate-400 hover:text-rose-400 transition-colors text-[11px]"
                >
                  Rimuovi tutti
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {parsedFiles.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono transition-colors ${
                      item.error
                        ? 'bg-rose-950/30 border-rose-800/60'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.error ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-sans font-medium text-slate-200 truncate">
                          {item.file.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.error ? (
                            <span className="text-rose-400">{item.error}</span>
                          ) : (
                            <span>{item.matches.length} partite valide rilevate</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(item.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors ml-2"
                      title="Rimuovi file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Summary Badge */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Totale complessivo gare:</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {totalValidMatchesCount} partite
                </span>
              </div>

              {/* Options: Replace vs Append + Deduplication */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-slate-300 font-medium">Modalità di importazione:</span>
                  <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-0.5">
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        importMode === 'replace'
                          ? 'bg-slate-800 text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Sostituisci dataset
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        importMode === 'append'
                          ? 'bg-slate-800 text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Aggiungi al dataset ({currentMatchCount} gare attuali)
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deduplicate}
                    onChange={(e) => setDeduplicate(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span>Rimuovi automaticamente partite duplicate (stessa data e formazioni)</span>
                </label>
              </div>
            </div>
          )}

          {/* Quick Preloaded Multi-League Sample Option */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onLoadMultiLeague();
                  onClose();
                }}
                className="text-slate-300 hover:text-emerald-400 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Carica Serie A + Premier League (760 gare)</span>
              </button>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica Template CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Annulla
          </button>
          <button
            disabled={totalValidMatchesCount === 0}
            onClick={handleConfirm}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-md shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {importMode === 'replace'
                ? `Importa ${totalValidMatchesCount} gare`
                : `Unisci ${totalValidMatchesCount} gare`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
