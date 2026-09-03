/**
 * Altana keystore client — reads session compliance history for an agent
 * (spend caps, expiries, revocations). This is READ-ONLY: it checks whether
 * an agent has ever exceeded its own declared limits. Issuing live sessions
 * from this marketplace (required to qualify for the Altana prize track) is
 * a separate, heavier integration — see the implementation plan, section 6.
 *
 * TODO before demo/submission: replace MOCK_MODE with a real call against
 * Altana's Keystore read API once credentials are available.
 */

export interface SessionRecord {
  spendCap: number;
  spent: number;
  expiresAt: string;
  revoked: boolean;
}

export interface SessionComplianceSummary {
  totalSessions: number;
  exceededCapCount: number;
  actedAfterExpiryCount: number;
  sessions: SessionRecord[];
}

const MOCK_MODE = !process.env.ALTANA_API_KEY;

export async function getSessionCompliance(address: string): Promise<SessionComplianceSummary> {
  if (MOCK_MODE) {
    return mockCompliance(address);
  }

  const res = await fetch(`https://api.altana.dev/v1/keystore/agents/${address}/sessions`, {
    headers: { Authorization: `Bearer ${process.env.ALTANA_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Altana lookup failed for ${address}: ${res.status}`);
  return res.json();
}

function mockCompliance(address: string): SessionComplianceSummary {
  const seed = hashCode(address);
  const totalSessions = 3 + (seed % 12);
  // Most agents behave; a minority have a violation, matching a realistic distribution.
  const exceededCapCount = seed % 10 === 0 ? 1 : 0;
  const actedAfterExpiryCount = seed % 17 === 0 ? 1 : 0;

  return {
    totalSessions,
    exceededCapCount,
    actedAfterExpiryCount,
    sessions: Array.from({ length: Math.min(totalSessions, 5) }).map((_, i) => ({
      spendCap: 500 + i * 100,
      spent: 100 + ((seed + i) % 450),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      revoked: false,
    })),
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
