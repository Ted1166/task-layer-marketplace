import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Community incident reports. New reports land unverified — they do not
 * affect an agent's trust score until a reviewer (or an automated evidence
 * check, e.g. a valid tx hash on the given evidenceUrl) marks them verified.
 * This gate is what keeps the report channel from being used to grief a
 * competitor's agent.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { agentId, summary, evidenceUrl } = body;

  if (!agentId || !summary || typeof summary !== "string" || summary.trim().length < 10) {
    return NextResponse.json(
      { error: "agentId and a summary of at least 10 characters are required" },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const report = await prisma.communityReport.create({
    data: {
      agentId,
      summary: summary.trim(),
      evidenceUrl: evidenceUrl || null,
      verified: false, // always starts unverified — see note above
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}
