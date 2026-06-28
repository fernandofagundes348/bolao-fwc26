import { getRules } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { RulesClient } from "@/components/features/rules/client";
import { ResetDatabaseButton } from "@/components/features/rules/ResetDatabaseButton"; // Importe aqui

export default async function RulesPage() {
  const rulesList = await getRules(); // Traz a lista de todas as fases

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Regras de Negócio"
        subtitle="Configure a pontuação do bolão por fases. Alterações recalculam a classificação."
      />

      <div className="w-full flex flex-col gap-8">
        <RulesClient rules={rulesList} />
        
        {/* Componente isolado para não poluir o layout principal */}
        <ResetDatabaseButton />
      </div>
    </div>
  );
}