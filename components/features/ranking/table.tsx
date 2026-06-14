"use client";

import { Badge, Button, Card, Drawer, EmptyState } from "@/components/ui";
import { generateRankingPDF } from "@/lib/pdf";
import { formatDate, formatPercentage } from "@/lib/utils";
import { Download, Search, Trophy, User } from "lucide-react";
import { useMemo, useState } from "react";

interface RankingEntry {
  id: string;
  position: number;
  participant: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
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

const medalMap: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function RankingTable({ data }: RankingTableProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RankingEntry | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data;

    return data.filter(
      ({ participant }) =>
        participant.name.toLowerCase().includes(query) ||
        participant.email.toLowerCase().includes(query)
    );
  }, [data, search]);

  async function handleExportPDF() {
    setExportLoading(true);

    try {
      await generateRankingPDF(data);
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <>
      <Card padding={false}>
        <div className="flex items-center justify-between p-5 border-b border-[#E5EDE0]">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              placeholder="Buscar por nome ou email..."
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5EDE0] bg-[#F4F7F2] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all"
            />
          </div>

          <Button
            size="sm"
            variant="secondary"
            loading={exportLoading}
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-7 w-7" />}
            title="Nenhum resultado encontrado"
            description={
              search
                ? "Tente buscar por outro termo"
                : "Importe um CSV para ver o ranking"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFCF8] border-b border-[#E5EDE0]">
                  <TableHeader className="w-16">Pos.</TableHeader>
                  <TableHeader>Participante</TableHeader>
                  <TableHeader center>Pontos</TableHeader>
                  <TableHeader center>Acertos</TableHeader>
                  <TableHeader center>Erros</TableHeader>
                  <TableHeader center>% Acerto</TableHeader>
                </tr>
              </thead>

              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className={`border-b border-[#E5EDE0] last:border-0 cursor-pointer transition-colors hover:bg-[#F4F7F2] ${
                      entry.position === 1 ? "bg-[#F9FDF5]" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-4 text-center w-16">
                      {medalMap[entry.position] ? (
                        <span className="text-xl">{medalMap[entry.position]}</span>
                      ) : (
                        <span className="text-sm font-bold text-[#9CA3AF]">
                          {entry.position}º
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-[#1A1F16]">
                        {entry.participant.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {entry.participant.email}
                      </p>
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

                    <td className="px-4 py-4">
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

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.participant.name ?? ""}
        subtitle={selected?.participant.email}
      >
        {selected && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatBox
                value={selected.totalScore}
                label="Pontos"
                highlighted
              />

              <StatBox
                value={selected.totalHits}
                label="Acertos"
              />

              <StatBox
                value={formatPercentage(selected.hitPercentage)}
                label="Precisão"
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded bg-[#64C832] flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>

              <h3
                className="text-sm font-bold text-[#1A1F16]"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                Histórico de Palpites
              </h3>
            </div>

            <div className="space-y-2">
              {selected.predictions.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-6">
                  Nenhum palpite registrado
                </p>
              ) : (
                selected.predictions.map((prediction) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function TableHeader({
  children,
  center,
  className = "",
}: {
  children: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#9CA3AF] ${
        center ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

function StatBox({
  value,
  label,
  highlighted = false,
}: {
  value: string | number;
  label: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 text-center ${
        highlighted ? "bg-[#E8F8DC]" : "bg-[#F4F7F2]"
      }`}
    >
      <p
        className={`text-2xl font-bold ${
          highlighted ? "text-[#146E37]" : "text-[#1A1F16]"
        }`}
        style={{ fontFamily: "'Exo 2', sans-serif" }}
      >
        {value}
      </p>

      <p
        className={`text-xs font-semibold mt-1 ${
          highlighted ? "text-[#146E37]" : "text-[#9CA3AF]"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

function PredictionCard({
  prediction,
}: {
  prediction: RankingEntry["predictions"][number];
}) {
  const hasResult = !!prediction.match.officialResult;

  return (
    <div className="p-4 rounded-xl border border-[#E5EDE0] bg-[#FAFCF8]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1F16]">
            {prediction.match.homeTeam} × {prediction.match.awayTeam}
          </p>

          {prediction.match.round && (
            <p className="text-xs text-[#9CA3AF]">
              {prediction.match.round}
            </p>
          )}

          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {formatDate(prediction.match.matchDate)}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-xs text-[#9CA3AF]">Palpite:</span>
            <span className="text-sm font-bold text-[#1A1F16]">
              {prediction.prediction}
            </span>
          </div>

          {hasResult ? (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-[#9CA3AF]">Resultado:</span>

              <span className="text-sm font-semibold text-[#4A5568]">
                {prediction.match.officialResult}
              </span>

              <Badge variant={prediction.score > 0 ? "green" : "red"}>
                {prediction.score > 0 ? `+${prediction.score}` : "0"}
              </Badge>
            </div>
          ) : (
            <Badge variant="gray">Aguardando</Badge>
          )}
        </div>
      </div>
    </div>
  );
}