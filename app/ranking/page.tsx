import { getRankingData } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { RankingTable } from "@/components/features/ranking/table";

export default async function RankingPage() {
  const ranking = await getRankingData();

  return (
    <section className="animate-fade-in space-y-6">
      <PageHeader
        title="Ranking"
        subtitle={`${ranking.length} participantes classificados`}
      />

      <RankingTable data={ranking} />
    </section>
  );
}