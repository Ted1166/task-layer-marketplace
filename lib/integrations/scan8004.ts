/**
 * 8004scan client — identity, reputation, and category-signal data for
 * ERC-8004 registered agents.
 *
 * Verified against the live OpenAPI spec at https://api.8004scan.io/openapi.json
 * and the hackathon resources page (8004scan Developer Hub).
 *
 * Setup:
 *   1. Create a key at https://8004scan.io/developers
 *   2. Apply for free hackathon Pro-tier access: https://forms.gle/jQevEPCAacBXaKG79
 *   3. Set SCAN8004_API_KEY in .env
 * Until that's set, every function below returns deterministic mock data
 * shaped like the real response, so the rest of the app doesn't change
 * when you flip it on.
 */

const BASE_URL = "https://api.8004scan.io/api/v1";
// Testnet (97) during development; switch to 56 (BSC mainnet) for the real
// submission once agents are registered there instead of testnet.
const BSC_CHAIN_ID = Number(process.env.BSC_CHAIN_ID || 97);

export interface AgentIdentity {
  chainId: number;
  tokenId: string;
  address: string; // owner_address
  name: string;
  description: string;
  registeredAt: string; // ISO date, from created_at
  totalScore: number; // 8004scan's own 5-95 weighted quality/reputation score
  totalFeedbacks: number;
  tags: string[];
  categories: string[];
  oasfSkill: string[];
  oasfDomain: string[];
}

const MOCK_MODE = !process.env.SCAN8004_API_KEY;

function authHeaders(): HeadersInit {
  return { "X-API-Key": process.env.SCAN8004_API_KEY as string };
}

/** GET /api/v1/agents/{chain_id}/{token_id} */
export async function getAgentIdentity(chainId: number, tokenId: string): Promise<AgentIdentity> {
  if (MOCK_MODE) return mockIdentity(chainId, tokenId);

  const res = await fetch(`${BASE_URL}/agents/${chainId}/${tokenId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`8004scan lookup failed for ${chainId}/${tokenId}: ${res.status}`);
  const a = await res.json();

  return {
    chainId,
    tokenId,
    address: a.owner_address ?? "",
    name: a.name ?? `Agent ${tokenId}`,
    description: a.description ?? "",
    registeredAt: a.created_at ?? new Date().toISOString(),
    totalScore: a.total_score ?? 0,
    totalFeedbacks: a.total_feedbacks ?? 0,
    tags: a.tags ?? [],
    categories: a.categories ?? [],
    oasfSkill: a.oasf_skill ?? [],
    oasfDomain: a.oasf_domain ?? [],
  };
}

/**
 * GET /api/v1/agents?owner_address=... — used when we only have a wallet
 * address (e.g. from a session or hire event) and need the agent's
 * chain_id/token_id to do a full lookup.
 */
export async function findAgentsByOwner(ownerAddress: string): Promise<AgentIdentity[]> {
  if (MOCK_MODE) return [mockIdentity(56, ownerAddress.slice(2, 8))];

  const res = await fetch(`${BASE_URL}/agents?owner_address=${ownerAddress}&chain_id=${BSC_CHAIN_ID}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`8004scan owner lookup failed for ${ownerAddress}: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((a: any) => ({
    chainId: a.chain_id,
    tokenId: String(a.token_id),
    address: a.owner_address ?? ownerAddress,
    name: a.name ?? `Agent ${a.token_id}`,
    description: a.description ?? "",
    registeredAt: a.created_at ?? new Date().toISOString(),
    totalScore: a.total_score ?? 0,
    totalFeedbacks: a.total_feedbacks ?? 0,
    tags: a.tags ?? [],
    categories: a.categories ?? [],
    oasfSkill: a.oasf_skill ?? [],
    oasfDomain: a.oasf_domain ?? [],
  }));
}

/**
 * GET /api/v1/agents?chain_id=56&... — bulk listing for the classification
 * pipeline's sync job (Day 2). Paginate with limit/offset (max 100/page).
 */
export async function listBscAgents(limit = 100, offset = 0): Promise<AgentIdentity[]> {
  if (MOCK_MODE) return Array.from({ length: 5 }).map((_, i) => mockIdentity(56, String(1000 + i)));

  const res = await fetch(`${BASE_URL}/agents?chain_id=${BSC_CHAIN_ID}&limit=${limit}&offset=${offset}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`8004scan list failed: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((a: any) => ({
    chainId: a.chain_id,
    tokenId: String(a.token_id),
    address: a.owner_address ?? "",
    name: a.name ?? `Agent ${a.token_id}`,
    description: a.description ?? "",
    registeredAt: a.created_at ?? new Date().toISOString(),
    totalScore: a.total_score ?? 0,
    totalFeedbacks: a.total_feedbacks ?? 0,
    tags: a.tags ?? [],
    categories: a.categories ?? [],
    oasfSkill: a.oasf_skill ?? [],
    oasfDomain: a.oasf_domain ?? [],
  }));
}

function mockIdentity(chainId: number, tokenId: string): AgentIdentity {
  const seed = hashCode(`${chainId}:${tokenId}`);
  const pools = {
    tags: ["defi", "trading", "yield", "rebalancing", "grid", "lending"],
    categories: ["DeFi"],
    oasfSkill: ["Portfolio Management", "Market Making", "Risk Monitoring"],
    oasfDomain: ["finance"],
  };
  return {
    chainId,
    tokenId,
    address: `0x${seed.toString(16).padStart(40, "0")}`,
    name: `Mock Agent ${tokenId}`,
    description: "Mock 8004scan record — set SCAN8004_API_KEY for real data.",
    registeredAt: new Date(Date.now() - (seed % 200) * 86400000).toISOString(),
    totalScore: 40 + (seed % 55),
    totalFeedbacks: seed % 80,
    tags: [pools.tags[seed % pools.tags.length]],
    categories: pools.categories,
    oasfSkill: [pools.oasfSkill[seed % pools.oasfSkill.length]],
    oasfDomain: pools.oasfDomain,
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