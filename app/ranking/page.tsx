import { getRankingData } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { RankingTable } from "@/components/features/ranking/table";

export default async function RankingPage() {
  const ranking = await getRankingData();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ranking"
        subtitle={`${ranking.length} participantes classificados`}
      />
      <RankingTable data={ranking} />
    </div>
  );
}
