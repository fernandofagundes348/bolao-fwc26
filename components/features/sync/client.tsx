"use client";

import { Badge, Button, Card, toast } from "@/components/ui/index";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";

interface SyncResult {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "finished";
  matchDate: Date;
}

type ProviderStatus = "idle" | "connecting" | "success" | "error";

const PROVIDERS = [
  {
    id: "mock",
    name: "Mock Provider",
    description: "Dados de demonstração para desenvolvimento e testes",
    url: "—",
    badge: "Demo",
    badgeVariant: "gray" as const,
    envKey: "SPORTS_PROVIDER=mock",
    free: true,
  },
  {
    id: "api-football",
    name: "API-Football",
    description: "Resultados em tempo real para ligas e torneios mundiais via RapidAPI",
    url: "https://rapidapi.com/api-sports/api/api-football",
    badge: "RapidAPI",
    badgeVariant: "blue" as const,
    envKey: "SPORTS_PROVIDER=api-football",
    free: false,
  },
];

export function SyncClient() {
  const [status, setStatus] = useState<ProviderStatus>("idle");
  const [results, setResults] = useState<SyncResult[]>([]);
  const [activeProvider, setActiveProvider] = useState("mock");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleTestConnection = async () => {
    setStatus("connecting");
    setResults([]);

    try {
      // Chama a rota de API que usa o SportsProvider no servidor
      const res = await fetch("/api/sports/sync", { method: "POST" });

      if (!res.ok) throw new Error(`Erro ${res.status}`);

      const data = await res.json();
      setResults(data.matches ?? []);
      setStatus("success");
      setLastSync(new Date());
      toast.success(`${data.matches?.length ?? 0} jogos sincronizados`);
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Erro ao sincronizar");
    }
  };

  const statusIcon = {
    idle: <Server className="h-5 w-5 text-[#9CA3AF]" />,
    connecting: <RefreshCw className="h-5 w-5 text-[#64C832] animate-spin" />,
    success: <CheckCircle2 className="h-5 w-5 text-[#64C832]" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
  };

  const statusLabel = {
    idle: "Aguardando sincronização",
    connecting: "Conectando ao provider...",
    success: "Sincronizado com sucesso",
    error: "Falha na conexão",
  };

  const matchStatusMap = {
    scheduled: { label: "Agendado", variant: "gray" as const },
    live: { label: "Ao Vivo", variant: "yellow" as const },
    finished: { label: "Finalizado", variant: "green" as const },
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status Banner */}
      <div
        className={`flex items-center gap-4 p-4 rounded-2xl border ${
          status === "success"
            ? "bg-[#F4FBF0] border-[#B8D9A0]"
            : status === "error"
            ? "bg-red-50 border-red-200"
            : status === "connecting"
            ? "bg-blue-50 border-blue-200"
            : "bg-[#F4F7F2] border-[#E5EDE0]"
        }`}
      >
        {statusIcon[status]}
        <div className="flex-1">
          <p className="text-sm font-bold text-[#1A1F16]">{statusLabel[status]}</p>
          {lastSync && (
            <p className="text-xs text-[#9CA3AF]">
              Última sincronização: {lastSync.toLocaleTimeString("pt-BR")}
            </p>
          )}
        </div>
        <Button
          onClick={handleTestConnection}
          loading={status === "connecting"}
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
          Sincronizar Agora
        </Button>
      </div>

      {/* Provider Selection */}
      <Card>
        <h2
          className="text-lg font-bold text-[#1A1F16] mb-5"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          Providers Disponíveis
        </h2>

        <div className="space-y-3">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              onClick={() => setActiveProvider(provider.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                activeProvider === provider.id
                  ? "border-[#64C832] bg-[#F4FBF0]"
                  : "border-[#E5EDE0] hover:border-[#B8D9A0] hover:bg-[#FAFCF8]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${
                  activeProvider === provider.id
                    ? "border-[#64C832] bg-[#64C832]"
                    : "border-[#D1D5DB]"
                }`}
              >
                {activeProvider === provider.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-[#1A1F16]">{provider.name}</p>
                  <Badge variant={provider.badgeVariant}>{provider.badge}</Badge>
                  {provider.free && (
                    <Badge variant="green">Gratuito</Badge>
                  )}
                </div>
                <p className="text-sm text-[#4A5568] mb-2">{provider.description}</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-[#F4F7F2] text-[#4A5568] px-2 py-1 rounded-lg font-mono">
                    {provider.envKey}
                  </code>
                  {provider.url !== "—" && (
                    <a
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-[#64C832] hover:text-[#146E37] transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Documentação
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Architecture Info */}
      <Card>
        <h2
          className="text-base font-bold text-[#1A1F16] mb-4"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          Arquitetura de Integração
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            {
              icon: <Activity className="h-4 w-4 text-[#64C832]" />,
              label: "getMatches()",
              desc: "Lista jogos por período",
            },
            {
              icon: <CheckCircle2 className="h-4 w-4 text-[#64C832]" />,
              label: "getMatchResult()",
              desc: "Resultado de um jogo",
            },
            {
              icon: <RefreshCw className="h-4 w-4 text-[#64C832]" />,
              label: "syncResults()",
              desc: "Atualiza múltiplos jogos",
            },
          ].map((m) => (
            <div key={m.label} className="p-4 rounded-xl bg-[#F4F7F2] border border-[#E5EDE0]">
              <div className="flex items-center gap-2 mb-2">
                {m.icon}
                <code className="text-xs font-mono font-bold text-[#1A1F16]">{m.label}</code>
              </div>
              <p className="text-xs text-[#9CA3AF]">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#1A1F16] font-mono text-xs text-[#A8E07A] space-y-1 leading-relaxed">
          <p><span className="text-[#9CA3AF]">// services/sports-provider.ts</span></p>
          <p><span className="text-[#64C832]">interface</span> ISportsProvider {"{"}</p>
          <p>{"  "}getMatches(from: Date, to: Date): <span className="text-[#A8E07A]">Promise{"<"}MatchResult[]{">"}</span></p>
          <p>{"  "}getMatchResult(id: string): <span className="text-[#A8E07A]">Promise{"<"}MatchResult | null{">"}</span></p>
          <p>{"  "}syncResults(ids: string[]): <span className="text-[#A8E07A]">Promise{"<"}MatchResult[]{">"}</span></p>
          <p>{"}"}</p>
          <p className="pt-1"><span className="text-[#9CA3AF]">// Troque o provider via .env sem mudar nenhum código</span></p>
          <p><span className="text-[#64C832]">SPORTS_PROVIDER</span>=api-football</p>
        </div>
      </Card>

      {/* Sync Results */}
      {results.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Wifi className="h-4 w-4 text-[#64C832]" />
            <h2
              className="text-base font-bold text-[#1A1F16]"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              Jogos Recebidos ({results.length})
            </h2>
          </div>

          <div className="space-y-2">
            {results.map((match) => {
              const s = matchStatusMap[match.status];
              return (
                <div
                  key={match.externalId}
                  className="flex items-center justify-between p-4 rounded-xl border border-[#E5EDE0] bg-[#FAFCF8]"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1A1F16]">
                      {match.homeTeam} × {match.awayTeam}
                    </p>
                    <p className="text-xs text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(match.matchDate).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {match.status === "finished" && (
                      <span
                        className="text-lg font-bold text-[#146E37]"
                        style={{ fontFamily: "'Exo 2', sans-serif" }}
                      >
                        {match.homeScore} × {match.awayScore}
                      </span>
                    )}
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
