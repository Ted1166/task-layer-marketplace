import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");

  const agents = await prisma.agent.findMany({
    where: category ? { category: category as any } : undefined,
    include: {
      scoreHistory: { orderBy: { computedAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const payload = agents.map((a: (typeof agents)[number]) => ({
    id: a.id,
    address: a.address,
    name: a.name,
    category: a.category,
    description: a.description,
    liveMetricLabel: a.liveMetricLabel,
    liveMetricValue: a.liveMetricValue,
    trustScore: a.scoreHistory[0]?.score ?? null,
  }));

  return NextResponse.json({ agents: payload });
}
