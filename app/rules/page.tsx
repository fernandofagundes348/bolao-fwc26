import { getRules } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { RulesClient } from "@/components/features/rules/client";

export default async function RulesPage() {
  const rulesList = await getRules(); // Traz a lista de todas as fases

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Regras de Negócio"
        subtitle="Configure a pontuação do bolão por fases. Alterações recalculam a classificação."
      />

      <div className="w-full">
        <RulesClient rules={rulesList} />
      </div>
    </div>
  );
}