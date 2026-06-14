import { getDashboardStats, getRankingData } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { Card, StatCard, Badge } from "@/components/ui/index";
import { Users, Gamepad2, Trophy, FileText } from "lucide-react";
import { formatDateTime, formatPercentage } from "@/lib/utils";
import { DashboardChart } from "@/components/features/dashboard/chart";

export default async function DashboardPage() {
  const [stats, ranking] = await Promise.all([getDashboardStats(), getRankingData()]);

  const top5 = ranking.slice(0, 5);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`Visão geral do bolão — ${new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Participantes"
          value={stats.totalParticipants}
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          label="Palpites"
          value={stats.totalPredictions}
          icon={<FileText className="h-5 w-5" />}
          color="dark"
        />
        <StatCard
          label="Jogos Cadastrados"
          value={stats.totalMatches}
          icon={<Gamepad2 className="h-5 w-5" />}
          color="neutral"
        />
        <StatCard
          label="Pontos Totais"
          value={stats.totalScore}
          icon={<Trophy className="h-5 w-5" />}
          color="neutral"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Ranking Top 5 */}
        <div className="col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold text-[#1A1F16]"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                Top 5 Ranking
              </h2>
              <a
                href="/ranking"
                className="text-sm font-semibold text-[#64C832] hover:text-[#146E37] transition-colors"
              >
                Ver completo →
              </a>
            </div>

            {top5.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Trophy className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-[#9CA3AF]">Nenhum dado de ranking disponível</p>
              </div>
            ) : (
              <div className="space-y-3">
                {top5.map((entry) => {
                  const medal =
                    entry.position === 1
                      ? "🥇"
                      : entry.position === 2
                      ? "🥈"
                      : entry.position === 3
                      ? "🥉"
                      : null;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        entry.position === 1
                          ? "border-[#64C832]/30 bg-[#F4FBF0]"
                          : "border-[#E5EDE0] bg-[#FAFCF8]"
                      }`}
                    >
                      <div className="w-8 text-center">
                        {medal ? (
                          <span className="text-lg">{medal}</span>
                        ) : (
                          <span className="text-sm font-bold text-[#9CA3AF]">
                            {entry.position}º
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1F16] truncate">
                          {entry.participant.name}
                        </p>
                        <p className="text-xs text-[#9CA3AF] truncate">
                          {entry.participant.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-lg font-bold text-[#1A1F16]"
                          style={{ fontFamily: "'Exo 2', sans-serif" }}
                        >
                          {entry.totalScore} pts
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          {entry.totalHits} acertos • {formatPercentage(entry.hitPercentage)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Imports */}
        <div>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <FileText className="h-4 w-4 text-[#64C832]" />
              <h2
                className="text-base font-bold text-[#1A1F16]"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                Importações Recentes
              </h2>
            </div>

            {stats.recentImports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#9CA3AF]">Nenhuma importação realizada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentImports.map((imp) => (
                  <div
                    key={imp.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#FAFCF8] border border-[#E5EDE0]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E8F8DC] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="h-4 w-4 text-[#64C832]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1A1F16] truncate">{imp.fileName}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{formatDateTime(imp.importedAt)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            imp.status === "SUCCESS"
                              ? "green"
                              : imp.status === "FAILED"
                              ? "red"
                              : "yellow"
                          }
                        >
                          {imp.status === "SUCCESS"
                            ? "Sucesso"
                            : imp.status === "FAILED"
                            ? "Falhou"
                            : "Parcial"}
                        </Badge>
                        <span className="text-[11px] text-[#9CA3AF]">
                          {imp.totalRecords} registros
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <a
              href="/import"
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#B8D9A0] text-sm font-semibold text-[#64C832] hover:bg-[#E8F8DC] transition-colors"
            >
              + Nova importação
            </a>
          </Card>
        </div>
      </div>

      {/* Chart */}
      <Card>
        <h2
          className="text-lg font-bold text-[#1A1F16] mb-6"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          Distribuição de Pontos
        </h2>
        <DashboardChart
          data={top5.map((e) => ({
            name: e.participant.name.split(" ")[0],
            score: e.totalScore,
            hits: e.totalHits,
          }))}
        />
      </Card>
    </div>
  );
}
