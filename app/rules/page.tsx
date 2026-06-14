import { getRules } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { RulesClient } from "@/components/features/rules/client";

export default async function RulesPage() {
  const rules = await getRules();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Regras de Negócio"
        subtitle="Configure a pontuação do bolão. Alterações recalculam toda a classificação."
      />
      <RulesClient rules={rules} />
    </div>
  );
}
