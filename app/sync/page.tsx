import { PageHeader } from "@/components/layout/sidebar";
import { SyncClient } from "@/components/features/sync/client";

export default function SyncPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Sincronização de Resultados"
        subtitle="Integração com APIs esportivas para atualização automática de resultados"
      />
      <SyncClient />
    </div>
  );
}
