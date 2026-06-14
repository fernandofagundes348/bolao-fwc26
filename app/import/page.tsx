import { getImportHistory } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { ImportCSVClient } from "@/components/features/import/client";

export default async function ImportPage() {
  const history = await getImportHistory();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Importar CSV"
        subtitle="Importe os palpites dos participantes a partir de arquivos CSV"
      />

      <div className="w-full">
        <ImportCSVClient history={history} />
      </div>
    </div>
  );
}