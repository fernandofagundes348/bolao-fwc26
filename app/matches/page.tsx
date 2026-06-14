import { getMatches } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { MatchesClient } from "@/components/features/matches/client";

export default async function MatchesPage() {
  const matches = await getMatches();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Jogos"
        subtitle="Gerencie os jogos do bolão e registre os resultados oficiais"
      />
      <MatchesClient matches={matches} />
    </div>
  );
}
