"use client";

import { Badge, Button, Card, Drawer, EmptyState, Input } from "@/components/ui/index";
import { formatDate, formatPercentage } from "@/lib/utils";
import { Download, Search, Trophy, User } from "lucide-react";
import { useState, useMemo } from "react";
import { generateRankingPDF } from "@/lib/pdf";

interface RankingEntry {
  id: string;
  position: number;
  participant: { id: string; name: string; email: string; createdAt: Date };
  totalScore: number;
  totalHits: number;
  totalErrors: number;
  hitPercentage: number;
  predictions: Array<{
    id: string;
    prediction: string;
    score: number;
    match: {
      id: string;
      homeTeam: string;
      awayTeam: string;
      matchDate: Date;
      officialResult: string | null;
      round: string | null;
    };
  }>;
}

interface RankingTableProps {
  data: RankingEntry[];
}

export function RankingTable({ data }: RankingTableProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RankingEntry | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (e) =>
        e.participant.name.toLowerCase().includes(q) ||
        e.participant.email.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      await generateRankingPDF(data);
    } finally {
      setExportLoading(false);
    }
  };

  const getMedalOrPosition = (pos: number) => {
    if (pos === 1) return <span className="text-xl">🥇</span>;
    if (pos === 2) return <span className="text-xl">🥈</span>;
    if (pos === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-bold text-[#9CA3AF]">{pos}º</span>;
  };

  return (
    <>
      <Card padding={false}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5EDE0]">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5EDE0] bg-[#F4F7F2] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportPDF}
            loading={exportLoading}
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-7 w-7" />}
            title="Nenhum resultado encontrado"
            description={search ? "Tente buscar por outro termo" : "Importe um CSV para ver o ranking"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFCF8] border-b border-[#E5EDE0]">
                  <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-5 py-3.5 w-16">Pos.</th>
                  <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Participante</th>
                  <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Pontos</th>
                  <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Acertos</th>
                  <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Erros</th>
                  <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">% Acerto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className={`border-b border-[#E5EDE0] last:border-0 cursor-pointer hover:bg-[#F4F7F2] transition-colors ${
                      entry.position === 1 ? "bg-[#F9FDF5]" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-4 w-16 text-center">{getMedalOrPosition(entry.position)}</td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-bold text-[#1A1F16]">{entry.participant.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{entry.participant.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-xl font-bold text-[#1A1F16]"
                        style={{ fontFamily: "'Exo 2', sans-serif" }}
                      >
                        {entry.totalScore}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant="green">{entry.totalHits}</Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant="red">{entry.totalErrors}</Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#64C832]"
                            style={{ width: `${entry.hitPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#4A5568]">
                          {formatPercentage(entry.hitPercentage)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Participant Drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.participant.name ?? ""}
        subtitle={selected?.participant.email}
      >
        {selected && (
          <div className="p-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#E8F8DC] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#146E37]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {selected.totalScore}
                </p>
                <p className="text-xs font-semibold text-[#146E37] mt-1">Pontos</p>
              </div>
              <div className="bg-[#F4F7F2] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#1A1F16]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {selected.totalHits}
                </p>
                <p className="text-xs font-semibold text-[#9CA3AF] mt-1">Acertos</p>
              </div>
              <div className="bg-[#F4F7F2] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#1A1F16]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {formatPercentage(selected.hitPercentage)}
                </p>
                <p className="text-xs font-semibold text-[#9CA3AF] mt-1">Precisão</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded bg-[#64C832] flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-sm font-bold text-[#1A1F16]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                Histórico de Palpites
              </h3>
            </div>

            {/* Predictions History */}
            <div className="space-y-2">
              {selected.predictions.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-6">Nenhum palpite registrado</p>
              ) : (
                selected.predictions.map((pred) => (
                  <div
                    key={pred.id}
                    className="p-4 rounded-xl border border-[#E5EDE0] bg-[#FAFCF8]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1F16]">
                          {pred.match.homeTeam} × {pred.match.awayTeam}
                        </p>
                        {pred.match.round && (
                          <p className="text-xs text-[#9CA3AF]">{pred.match.round}</p>
                        )}
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          {formatDate(pred.match.matchDate)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <span className="text-xs text-[#9CA3AF]">Palpite:</span>
                          <span className="text-sm font-bold text-[#1A1F16]">{pred.prediction}</span>
                        </div>
                        {pred.match.officialResult ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-[#9CA3AF]">Resultado:</span>
                            <span className="text-sm font-semibold text-[#4A5568]">{pred.match.officialResult}</span>
                            <Badge variant={pred.score > 0 ? "green" : "red"}>
                              {pred.score > 0 ? `+${pred.score}` : "0"}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="gray">Aguardando</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
