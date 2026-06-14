import { getParticipants } from "@/lib/actions";
import { PageHeader } from "@/components/layout/sidebar";
import { ParticipantsClient } from "@/components/features/participants/client";

export default async function ParticipantsPage() {
  const participants = await getParticipants();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Participantes"
        subtitle={`${participants.length} participantes cadastrados`}
      />

      <div className="w-full">
        <ParticipantsClient participants={participants} />
      </div>
    </div>
  );
}