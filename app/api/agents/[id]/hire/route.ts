import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Creates a session record in our own DB — spend cap, expiry, revocation
 * tracking. This mirrors Altana's session model conceptually but is NOT a
 * live Altana Keystore session yet (that requires real wallet/session
 * issuance credentials — see implementation-plan.md section 6). This is
 * the marketplace's own tracked "hire" record, honest about that scope.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await params;
  const body = await req.json();
  const { spendCap, durationDays } = body;

  if (!spendCap || spendCap <= 0) {
    return NextResponse.json({ error: "spendCap must be a positive number" }, { status: 400 });
  }
  if (!durationDays || durationDays <= 0) {
    return NextResponse.json({ error: "durationDays must be a positive number" }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const session = await prisma.session.create({
    data: {
      agentId,
      spendCap,
      spent: 0,
      expiresAt: new Date(Date.now() + durationDays * 86400000),
      revoked: false,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
