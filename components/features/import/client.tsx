"use client";

import { Badge, Button, Card, ConfirmDialog, EmptyState, toast } from "@/components/ui/index";
import { deleteImportHistory, importCSVData } from "@/lib/actions";
import { extractScore, formatDateTime, parseGameHeader } from "@/lib/utils";
import { AlertCircle, CheckCircle2, FileText, Trash2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";

interface ImportHistory {
  id: string;
  fileName: string;
  importedAt: Date;
  totalRecords: number;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  errorMessage: string | null;
}

interface ParsedPrediction {
  round: string | null;
  homeTeam: string;
  awayTeam: string;
  prediction: string;
}

interface ParsedRow {
  name: string;
  email: string;
  predictions: ParsedPrediction[];
}

interface GameColumn {
  header: string;
  round: string | null;
  homeTeam: string;
  awayTeam: string;
}

interface CSVPreview {
  fileName: string;
  rows: ParsedRow[];
  games: GameColumn[];
  ignoredColumns: string[];
  errors: string[];
}

export function ImportCSVClient({ history }: { history: ImportHistory[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CSVPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importHistory, setImportHistory] = useState(history);

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const errors: string[] = [];

        // Detecta colunas de Nome e Email (tolerando quebras de linha no cabeçalho)
        const nameCol = headers.find((h) => /nome|name/i.test(h));
        const emailCol = headers.find((h) => /email/i.test(h));

        if (!nameCol) errors.push("Coluna 'Nome' não encontrada");
        if (!emailCol) errors.push("Coluna 'Email' não encontrada");

        // Colunas que não são nome/email/timestamp são candidatas a jogos
        const candidateColumns = headers.filter(
          (h) => h !== nameCol && h !== emailCol && !/(timestamp|carimbo|data\/hora)/i.test(h)
        );

        const games: GameColumn[] = [];
        const ignoredColumns: string[] = [];

        for (const col of candidateColumns) {
          const parsed = parseGameHeader(col);
          if (parsed) {
            games.push({ header: col, ...parsed });
          } else if (col.trim()) {
            ignoredColumns.push(col);
          }
        }

        if (games.length === 0) {
          errors.push("Nenhuma coluna de jogo reconhecida (formato esperado: 'Time A x Time B')");
        }

        const rows: ParsedRow[] = (results.data as Record<string, string>[])
          .filter((r) => emailCol && r[emailCol]?.includes("@"))
          .map((r) => ({
            name: (nameCol ? r[nameCol] : "")?.trim() ?? "",
            email: (emailCol ? r[emailCol] : "")?.toLowerCase().trim() ?? "",
            predictions: games
              .map((g) => {
                const raw = r[g.header] ?? "";
                const score = extractScore(raw);
                if (!score) return null;
                return {
                  round: g.round,
                  homeTeam: g.homeTeam,
                  awayTeam: g.awayTeam,
                  prediction: score,
                } as ParsedPrediction;
              })
              .filter((p): p is ParsedPrediction => p !== null),
          }));

        setPreview({
          fileName: file.name,
          rows,
          games,
          ignoredColumns,
          errors,
        });
      },
      error: (err) => {
        toast.error(`Erro ao ler arquivo: ${err.message}`);
      },
    });
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Apenas arquivos .csv são aceitos");
      return;
    }
    parseCSV(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const result = await importCSVData(
        preview.fileName,
        preview.rows.map((r) => ({
          name: r.name,
          email: r.email,
          predictions: r.predictions,
        }))
      );

      if (result.matchesCreated > 0) {
        toast.success(
          `Importação concluída — ${result.totalRecords} palpites processados, ${result.matchesCreated} jogos criados automaticamente`
        );
      } else {
        toast.success(`Importação concluída — ${result.totalRecords} palpites processados`);
      }

      setPreview(null);
      setImportHistory((prev) => [
        {
          id: Math.random().toString(),
          fileName: preview.fileName,
          importedAt: new Date(),
          totalRecords: result.totalRecords,
          status: "SUCCESS",
          errorMessage: null,
        },
        ...prev,
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteImportHistory(deleteTarget);
      setImportHistory((prev) => prev.filter((h) => h.id !== deleteTarget));
      toast.success("Importação removida");
    } catch {
      toast.error("Erro ao remover importação");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const totalPredictions = preview?.rows.reduce((sum, r) => sum + r.predictions.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <h2 className="text-lg font-bold text-[#1A1F16] mb-5" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          Selecionar Arquivo
        </h2>

        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-[#64C832] bg-[#E8F8DC]"
                : "border-[#B8D9A0] hover:border-[#64C832] hover:bg-[#F4FBF0]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="w-14 h-14 rounded-2xl bg-[#E8F8DC] flex items-center justify-center mx-auto mb-4">
              <Upload className="h-7 w-7 text-[#64C832]" />
            </div>
            <p className="text-base font-bold text-[#1A1F16] mb-1">
              Arraste o arquivo CSV aqui
            </p>
            <p className="text-sm text-[#9CA3AF]">
              ou <span className="text-[#64C832] font-semibold underline underline-offset-2">clique para selecionar</span>
            </p>
            <p className="text-xs text-[#9CA3AF] mt-3">Aceita CSV exportado do Google Forms (separador ; ou ,)</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* File info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F4FBF0] border border-[#B8D9A0]">
              <div className="w-10 h-10 rounded-xl bg-[#E8F8DC] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#64C832]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1A1F16]">{preview.fileName}</p>
                <p className="text-xs text-[#9CA3AF]">
                  {preview.rows.length} participantes • {preview.games.length} jogos detectados • {totalPredictions} palpites no total
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="p-2 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Errors */}
            {preview.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-bold text-red-700">Problemas detectados</p>
                </div>
                {preview.errors.map((e, i) => (
                  <p key={i} className="text-sm text-red-600">• {e}</p>
                ))}
              </div>
            )}

            {/* Ignored columns warning */}
            {preview.ignoredColumns.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-bold text-amber-800">
                    {preview.ignoredColumns.length} coluna(s) ignorada(s)
                  </p>
                </div>
                <p className="text-xs text-amber-700">
                  Não reconhecidas como "Time A x Time B": {preview.ignoredColumns.join(", ")}
                </p>
              </div>
            )}

            {/* Detected matches */}
            <div>
              <p className="text-sm font-bold text-[#1A1F16] mb-3">
                Jogos detectados — {preview.games.length}
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                {preview.games.map((g) => (
                  <div key={g.header} className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5EDE0] bg-[#FAFCF8]">
                    {g.round && <Badge variant="green">{g.round}</Badge>}
                    <span className="text-xs font-semibold text-[#1A1F16] truncate">
                      {g.homeTeam} × {g.awayTeam}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#9CA3AF] mt-2">
                Jogos que ainda não existirem no sistema serão <strong>criados automaticamente</strong>.
                Você pode ajustar data e rodada depois em "Jogos".
              </p>
            </div>

            {/* Preview table */}
            <div>
              <p className="text-sm font-bold text-[#1A1F16] mb-3">
                Preview — primeiras 5 linhas
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#E5EDE0]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F4F7F2] border-b border-[#E5EDE0]">
                      <th className="text-left px-4 py-2.5 text-[#9CA3AF] font-bold uppercase tracking-wider">Nome</th>
                      <th className="text-left px-4 py-2.5 text-[#9CA3AF] font-bold uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-2.5 text-[#9CA3AF] font-bold uppercase tracking-wider">Palpites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-[#E5EDE0] last:border-0">
                        <td className="px-4 py-2.5 font-semibold text-[#1A1F16] whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-2.5 text-[#9CA3AF] whitespace-nowrap">{row.email}</td>
                        <td className="px-4 py-2.5 text-[#4A5568]">
                          {row.predictions.slice(0, 4).map((p) => (
                            <span key={`${p.homeTeam}-${p.awayTeam}`} className="inline-flex items-center gap-1 mr-3">
                              <span className="text-[#9CA3AF]">{p.homeTeam}×{p.awayTeam}:</span>
                              <span className="font-semibold">{p.prediction}</span>
                            </span>
                          ))}
                          {row.predictions.length > 4 && (
                            <span className="text-[#9CA3AF]">+{row.predictions.length - 4}</span>
                          )}
                          {row.predictions.length === 0 && (
                            <span className="text-[#9CA3AF]">Nenhum palpite reconhecido</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setPreview(null)}>
                Cancelar
              </Button>
              <Button onClick={handleImport} loading={importing} disabled={preview.games.length === 0}>
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Importação
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Import History */}
      <Card>
        <h2 className="text-lg font-bold text-[#1A1F16] mb-5" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          Histórico de Importações
        </h2>

        {importHistory.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="Nenhuma importação realizada"
            description="Faça upload de um arquivo CSV para começar"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5EDE0]">
                  <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3">Arquivo</th>
                  <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3">Data</th>
                  <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3">Registros</th>
                  <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((imp) => (
                  <tr key={imp.id} className="border-b border-[#E5EDE0] last:border-0 hover:bg-[#FAFCF8]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F8DC] flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[#64C832]" />
                        </div>
                        <span className="text-sm font-semibold text-[#1A1F16]">{imp.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#9CA3AF]">{formatDateTime(imp.importedAt)}</td>
                    <td className="px-4 py-3.5 text-center text-sm font-semibold text-[#1A1F16]">{imp.totalRecords}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge
                        variant={
                          imp.status === "SUCCESS" ? "green"
                            : imp.status === "FAILED" ? "red"
                            : "yellow"
                        }
                      >
                        {imp.status === "SUCCESS" ? "Sucesso" : imp.status === "FAILED" ? "Falhou" : "Parcial"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(imp.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remover Importação"
        description="Tem certeza que deseja remover este registro de importação? Os dados importados não serão excluídos."
        confirmLabel="Remover"
        loading={deleteLoading}
      />
    </div>
  );
}