"use client";

import { Button, Card, Input, toast } from "@/components/ui/index";
import { updateRules } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";
import { AlertCircle, CheckCircle2, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";

interface RuleConfig {
  id: string;
  exactScorePoints: number;
  winnerPoints: number;
  drawPoints: number;
  wrongPoints: number;
  updatedAt: Date;
}

const ruleDescriptions = [
  {
    key: "exactScorePoints" as const,
    label: "Placar Exato",
    description: "Pontos por acertar o placar exato do jogo",
    example: "Ex: Brasil 2 × 1 Argentina → palpitou 2x1 ✓",
    color: "green" as const,
  },
  {
    key: "winnerPoints" as const,
    label: "Vencedor Correto",
    description: "Pontos por acertar apenas o time vencedor",
    example: "Ex: Brasil 2 × 1 Argentina → palpitou 1x0 (Brasil vence) ✓",
    color: "blue" as const,
  },
  {
    key: "drawPoints" as const,
    label: "Empate Correto",
    description: "Pontos por acertar que o jogo terminou empatado",
    example: "Ex: Brasil 1 × 1 Argentina → palpitou 0x0 (empate) ✓",
    color: "yellow" as const,
  },
  {
    key: "wrongPoints" as const,
    label: "Palpite Errado",
    description: "Pontos (geralmente 0) por palpites incorretos",
    example: "Ex: Brasil 2 × 1 Argentina → palpitou Argentina vencendo",
    color: "red" as const,
  },
];

const colorMap = {
  green: "border-l-[#64C832] bg-[#F4FBF0]",
  blue: "border-l-blue-400 bg-blue-50",
  yellow: "border-l-yellow-400 bg-yellow-50",
  red: "border-l-red-400 bg-red-50",
};

export function RulesClient({ rules: initial }: { rules: RuleConfig }) {
  const [values, setValues] = useState({
    exactScorePoints: initial.exactScorePoints,
    winnerPoints: initial.winnerPoints,
    drawPoints: initial.drawPoints,
    wrongPoints: initial.wrongPoints,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(initial.updatedAt);

  const hasChanges =
    values.exactScorePoints !== initial.exactScorePoints ||
    values.winnerPoints !== initial.winnerPoints ||
    values.drawPoints !== initial.drawPoints ||
    values.wrongPoints !== initial.wrongPoints;

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateRules(values);
      setLastUpdated(updated.updatedAt);
      toast.success("Regras atualizadas — ranking recalculado com sucesso");
    } catch {
      toast.error("Erro ao salvar regras");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setValues({
      exactScorePoints: initial.exactScorePoints,
      winnerPoints: initial.winnerPoints,
      drawPoints: initial.drawPoints,
      wrongPoints: initial.wrongPoints,
    });
  };

  return (
    <div className="max-w-3xl">
      {/* Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Atenção</p>
          <p className="text-sm text-amber-700">
            Ao salvar, todos os palpites com resultado registrado serão recalculados automaticamente.
            Isso afeta o ranking imediatamente.
          </p>
        </div>
      </div>

      {/* Rules Cards */}
      <div className="space-y-4 mb-6">
        {ruleDescriptions.map((rule) => (
          <Card key={rule.key}>
            <div className={`flex items-start gap-5 border-l-4 -m-6 p-6 rounded-2xl ${colorMap[rule.color]}`}>
              <div className="flex-1">
                <h3
                  className="text-base font-bold text-[#1A1F16] mb-1"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                >
                  {rule.label}
                </h3>
                <p className="text-sm text-[#4A5568] mb-1">{rule.description}</p>
                <p className="text-xs text-[#9CA3AF]">{rule.example}</p>
              </div>
              <div className="flex-shrink-0 w-28">
                <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5 block">
                  Pontos
                </label>
                <input
                  type="number"
                  min={-10}
                  max={100}
                  value={values[rule.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [rule.key]: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full text-center text-2xl font-bold rounded-xl border border-[#E5EDE0] bg-white py-2.5 text-[#1A1F16] focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="mb-6">
        <h3 className="text-sm font-bold text-[#1A1F16] mb-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          Resumo da Pontuação
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {ruleDescriptions.map((rule) => (
            <div key={rule.key} className="text-center p-3 rounded-xl bg-[#F4F7F2]">
              <p
                className="text-2xl font-bold text-[#1A1F16]"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                {values[rule.key]}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">{rule.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <CheckCircle2 className="h-4 w-4 text-[#64C832]" />
          Última atualização: {formatDateTime(lastUpdated)}
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
              Descartar
            </Button>
          )}
          <Button onClick={handleSave} loading={loading} disabled={!hasChanges}>
            <Settings className="h-4 w-4" />
            Salvar e Recalcular
          </Button>
        </div>
      </div>
    </div>
  );
}
