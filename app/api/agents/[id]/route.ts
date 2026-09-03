import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: {
      scoreHistory: { orderBy: { computedAt: "desc" }, take: 12 },
      sessions: { orderBy: { createdAt: "desc" } },
      reports: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const latest = agent.scoreHistory[0];

  return NextResponse.json({
    id: agent.id,
    address: agent.address,
    name: agent.name,
    category: agent.category,
    description: agent.description,
    registeredAt: agent.registeredAt,
    liveMetricLabel: agent.liveMetricLabel,
    liveMetricValue: agent.liveMetricValue,
    trustScore: latest
      ? {
          score: latest.score,
          identityReputationScore: latest.identityReputationScore,
          sessionComplianceScore: latest.sessionComplianceScore,
          communityReportScore: latest.communityReportScore,
        }
      : null,
    scoreHistory: agent.scoreHistory.map((s: (typeof agent.scoreHistory)[number]) => ({
      score: s.score,
      computedAt: s.computedAt,
    })),
    sessions: agent.sessions,
    reports: agent.reports.map((r: (typeof agent.reports)[number]) => ({
      summary: r.summary,
      verified: r.verified,
      createdAt: r.createdAt,
    })),
  });
}
