import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeRealAction, ACTION_COST_USD } from "@/lib/integrations/agentExecutor";

/**
 * Runs one real, signed testnet action for a session — but only after
 * checking the session is actually still allowed to spend. This is a real
 * enforcement point: if the action would exceed the declared spend cap,
 * nothing gets signed. The session's exceededCap flag is what our trust
 * score's session-compliance signal reads — so a violation recorded here
 * genuinely lowers the agent's trust score on next recompute, not just
 * cosmetically.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.revoked) {
    return NextResponse.json({ error: "Session has been revoked" }, { status: 403 });
  }
  if (new Date(session.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Session has expired" }, { status: 403 });
  }

  const wouldExceedCap = session.spent + ACTION_COST_USD > session.spendCap;
  if (wouldExceedCap) {
    // Real compliance violation — flag it and refuse to sign. This is the
    // exact scenario the whole trust-score pitch is built around.
    await prisma.session.update({ where: { id: sessionId }, data: { exceededCap: true } });
    return NextResponse.json(
      { error: "Action refused: would exceed this session's spend cap." },
      { status: 403 }
    );
  }

  let txHash: string;
  try {
    const result = await executeRealAction();
    txHash = result.txHash;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transaction failed" },
      { status: 500 }
    );
  }

  const [activity] = await prisma.$transaction([
    prisma.activity.create({
      data: { sessionId, txHash, chain: "BSC Testnet", amountUsd: ACTION_COST_USD },
    }),
    prisma.session.update({
      where: { id: sessionId },
      data: { spent: session.spent + ACTION_COST_USD },
    }),
  ]);

  return NextResponse.json({ activity }, { status: 201 });
}
