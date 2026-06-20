"use client";

import { Button, Card, toast } from "@/components/ui/index";
import { updateRules } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";
import { AlertCircle, CheckCircle2, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";

export interface RuleConfig {
  id: string;
  phase: string;
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

export function RulesClient({ rules: initialRules }: { rules: RuleConfig[] }) {
  const [rules, setRules] = useState<RuleConfig[]>(initialRules);
  const [activeTabId, setActiveTabId] = useState<string>(initialRules[0]?.id || "");
  const [loading, setLoading] = useState(false);

  const activeRule = rules.find((r) => r.id === activeTabId);
  const initialActiveRule = initialRules.find((r) => r.id === activeTabId);

  const hasChanges =
    activeRule &&
    initialActiveRule &&
    (activeRule.exactScorePoints !== initialActiveRule.exactScorePoints ||
      activeRule.winnerPoints !== initialActiveRule.winnerPoints ||
      activeRule.drawPoints !== initialActiveRule.drawPoints ||
      activeRule.wrongPoints !== initialActiveRule.wrongPoints);

  const handleValueChange = (key: keyof RuleConfig, value: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === activeTabId ? { ...r, [key]: value } : r))
    );
  };

  const handleSave = async () => {
    if (!activeRule) return;
    setLoading(true);
    try {
      const updated = await updateRules(activeRule.id, {
        exactScorePoints: activeRule.exactScorePoints,
        winnerPoints: activeRule.winnerPoints,
        drawPoints: activeRule.drawPoints,
        wrongPoints: activeRule.wrongPoints,
      });

      // Atualiza o estado inicial localmente
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Regras da fase "${activeRule.phase}" atualizadas e recalculadas!`);
    } catch {
      toast.error("Erro ao salvar regras");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!initialActiveRule) return;
    setRules((prev) =>
      prev.map((r) => (r.id === activeTabId ? { ...initialActiveRule } : r))
    );
  };

  if (!activeRule || rules.length === 0) return null;

  return (
    <div className="max-w-3xl">
      {/* Seletor de Fases (Tabs) */}
      <div className="flex gap-2 mb-6 border-b border-[#E5EDE0] pb-2 overflow-x-auto scrollbar-thin">
        {rules.map((rule) => (
          <button
            key={rule.id}
            onClick={() => setActiveTabId(rule.id)}
            className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              activeTabId === rule.id
                ? "bg-[#64C832] text-white"
                : "bg-[#F4F7F2] text-[#9CA3AF] hover:bg-[#E8F8DC] hover:text-[#64C832]"
            }`}
          >
            {rule.phase}
          </button>
        ))}
      </div>

      {/* Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">
            Editando: {activeRule.phase}
          </p>
          <p className="text-sm text-amber-700">
            Ao salvar, os palpites de todos os jogos pertencentes a esta fase serão recalculados automaticamente. Isso afeta o ranking imediatamente.
          </p>
        </div>
      </div>

      {/* Rules Cards */}
      <div className="space-y-4 mb-6">
        {ruleDescriptions.map((desc) => (
          <Card key={desc.key}>
            <div className={`flex items-start gap-5 border-l-4 -m-6 p-6 rounded-2xl ${colorMap[desc.color]}`}>
              <div className="flex-1">
                <h3
                  className="text-base font-bold text-[#1A1F16] mb-1"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                >
                  {desc.label}
                </h3>
                <p className="text-sm text-[#4A5568] mb-1">{desc.description}</p>
                <p className="text-xs text-[#9CA3AF]">{desc.example}</p>
              </div>
              <div className="flex-shrink-0 w-28">
                <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5 block">
                  Pontos
                </label>
                <input
                  type="number"
                  min={-10}
                  max={100}
                  value={activeRule[desc.key as keyof typeof activeRule] as number}
                  onChange={(e) => handleValueChange(desc.key, parseInt(e.target.value) || 0)}
                  className="w-full text-center text-2xl font-bold rounded-xl border border-[#E5EDE0] bg-white py-2.5 text-[#1A1F16] focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <CheckCircle2 className="h-4 w-4 text-[#64C832]" />
          Última atualização: {formatDateTime(activeRule.updatedAt)}
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
            Salvar Fase
          </Button>
        </div>
      </div>
    </div>
  );
}