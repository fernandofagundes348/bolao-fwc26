import { createSportsProvider } from "@/services/sports-provider";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const provider = createSportsProvider();

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 30);

    const matches = await provider.getMatches(from, to);

    return NextResponse.json({
      provider: provider.name,
      matches,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao sincronizar" },
      { status: 500 }
    );
  }
}
