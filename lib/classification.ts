import type { AgentIdentity } from "./integrations/scan8004";

export type Category =
  | "REBALANCING"
  | "GRID_TRADING"
  | "YIELD_OPTIMIZATION"
  | "HEALTH_FACTOR_MONITORING";

interface CategoryKeywords {
  category: Category;
  keywords: string[];
}

// Matched against 8004scan's tags, categories, oasf_skill, oasf_domain, and
// description — these are the real signal fields the API exposes (see
// api.8004scan.io/openapi.json). There's no raw on-chain interaction log
// exposed via the API, so this is a text/tag heuristic rather than a
// behavioral one. Tune the keyword lists once real BSC agent data is synced
// (Day 2) and you can see which words agents actually self-describe with.
const CATEGORY_RULES: CategoryKeywords[] = [
  {
    category: "HEALTH_FACTOR_MONITORING",
    keywords: ["health factor", "liquidation", "collateral", "repay", "risk monitoring", "defender"],
  },
  {
    category: "GRID_TRADING",
    keywords: ["grid", "market making", "range order", "bounded range"],
  },
  {
    category: "YIELD_OPTIMIZATION",
    keywords: ["yield", "apr", "apy", "farm", "compound", "lending", "liquid staking"],
  },
  {
    category: "REBALANCING",
    keywords: ["rebalanc", "portfolio management", "asset allocation", "drift"],
  },
];

/**
 * Classifies an agent into one of the four hackathon-required categories by
 * matching keywords against its 8004scan tags/categories/OASF skill+domain
 * fields and its description. Returns null rather than guessing when
 * nothing matches — an "unclassified" agent is more honest than a
 * mistagged one, and judges notice sloppy tagging.
 */
export function classifyAgent(identity: AgentIdentity): Category | null {
  const haystack = [
    ...identity.tags,
    ...identity.categories,
    ...identity.oasfSkill,
    ...identity.oasfDomain,
    identity.description,
    identity.name,
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.category;
    }
  }
  return null;
}
