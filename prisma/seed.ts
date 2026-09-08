import { PrismaClient } from "@prisma/client";
import type { Category } from "../lib/categories";

const prisma = new PrismaClient();

interface SeedAgent {
  chainId: number;
  tokenId: string;
  address: string;
  name: string;
  category: Category;
  description: string;
  liveMetricLabel: string;
  liveMetricValue: string;
  reputationScore: number;
  activityCount: number;
  daysAgo: number;
  session: { spendCap: number; spent: number; exceededCap: boolean; actedAfterExp: boolean };
  reports: { summary: string; verified: boolean }[];
}

// Representative seed set — a small slice per category so the catalog
// demonstrates full category coverage. Swap for a live 8004scan sync once
// the classification pipeline is running against real registry data.
const AGENTS: SeedAgent[] = [
  {
    chainId: 56,
    tokenId: "1001",
    address: "0xA1b2c3D4e5F60718293a4b5c6d7e8f9012345678",
    name: "Meridian Rebalancer",
    category: "REBALANCING",
    description: "Rebalances a multi-asset BSC portfolio back to target weights on a daily cadence.",
    liveMetricLabel: "Last rebalance drift",
    liveMetricValue: "1.8%",
    reputationScore: 88,
    activityCount: 412,
    daysAgo: 140,
    session: { spendCap: 5000, spent: 1240, exceededCap: false, actedAfterExp: false },
    reports: [],
  },
  {
    chainId: 56,
    tokenId: "1002",
    address: "0xB2c3D4e5F60718293a4b5c6d7e8f9012345678A1",
    name: "Tideline Rebalancer",
    category: "REBALANCING",
    description: "Threshold-based rebalancing across four blue-chip BSC pairs.",
    liveMetricLabel: "Last rebalance drift",
    liveMetricValue: "3.1%",
    reputationScore: 61,
    activityCount: 96,
    daysAgo: 40,
    session: { spendCap: 2000, spent: 1890, exceededCap: true, actedAfterExp: false },
    reports: [{ summary: "Rebalanced beyond stated slippage tolerance during high volatility.", verified: true }],
  },
  {
    chainId: 56,
    tokenId: "1003",
    address: "0xC3D4e5F60718293a4b5c6d7e8f9012345678A1B2",
    name: "Latticework Grid",
    category: "GRID_TRADING",
    description: "Runs a bounded-range grid strategy on BNB/USDT with adaptive spacing.",
    liveMetricLabel: "Active grid range",
    liveMetricValue: "$540 - $612",
    reputationScore: 79,
    activityCount: 1305,
    daysAgo: 95,
    session: { spendCap: 8000, spent: 3200, exceededCap: false, actedAfterExp: false },
    reports: [],
  },
  {
    chainId: 56,
    tokenId: "1004",
    address: "0xD4e5F60718293a4b5c6d7e8f9012345678A1B2C3",
    name: "Stepwise Grid",
    category: "GRID_TRADING",
    description: "Tight-range grid bot for CAKE/BNB with hourly rebalancing of grid bounds.",
    liveMetricLabel: "Active grid range",
    liveMetricValue: "$1.92 - $2.10",
    reputationScore: 54,
    activityCount: 812,
    daysAgo: 22,
    session: { spendCap: 3000, spent: 2400, exceededCap: false, actedAfterExp: true },
    reports: [],
  },
  {
    chainId: 56,
    tokenId: "1005",
    address: "0xE5F60718293a4b5c6d7e8f9012345678A1B2C3D4",
    name: "Harvest Yield Router",
    category: "YIELD_OPTIMIZATION",
    description: "Moves stablecoin deposits between lending markets to track the best live APR.",
    liveMetricLabel: "Current APR",
    liveMetricValue: "9.4%",
    reputationScore: 93,
    activityCount: 268,
    daysAgo: 180,
    session: { spendCap: 10000, spent: 4100, exceededCap: false, actedAfterExp: false },
    reports: [],
  },
  {
    chainId: 56,
    tokenId: "1006",
    address: "0xF60718293a4b5c6d7e8f9012345678A1B2C3D4E5",
    name: "Compounder Prime",
    category: "YIELD_OPTIMIZATION",
    description: "Auto-compounds LP rewards across two PancakeSwap farms.",
    liveMetricLabel: "Current APR",
    liveMetricValue: "12.1%",
    reputationScore: 71,
    activityCount: 190,
    daysAgo: 60,
    session: { spendCap: 4000, spent: 3950, exceededCap: false, actedAfterExp: false },
    reports: [{ summary: "Compounding delayed by 6 hours during a fee spike, missed a harvest window.", verified: false }],
  },
  {
    chainId: 56,
    tokenId: "1007",
    address: "0x0718293a4b5c6d7e8f9012345678A1B2C3D4E5F6",
    name: "Sentinel Health Watch",
    category: "HEALTH_FACTOR_MONITORING",
    description: "Monitors lending positions and tops up collateral before liquidation thresholds.",
    liveMetricLabel: "Lowest watched health factor",
    liveMetricValue: "1.62",
    reputationScore: 90,
    activityCount: 530,
    daysAgo: 165,
    session: { spendCap: 6000, spent: 800, exceededCap: false, actedAfterExp: false },
    reports: [],
  },
  {
    chainId: 56,
    tokenId: "1008",
    address: "0x18293a4b5c6d7e8f9012345678A1B2C3D4E5F607",
    name: "Threshold Guard",
    category: "HEALTH_FACTOR_MONITORING",
    description: "Partial-repay defender for leveraged BSC lending positions.",
    liveMetricLabel: "Lowest watched health factor",
    liveMetricValue: "1.21",
    reputationScore: 66,
    activityCount: 214,
    daysAgo: 30,
    session: { spendCap: 5000, spent: 4700, exceededCap: false, actedAfterExp: false },
    reports: [],
  },
];

async function main() {
  console.log("Seeding database...");
  await prisma.trustScoreSnapshot.deleteMany();
  await prisma.communityReport.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.session.deleteMany();
  await prisma.agent.deleteMany();

  for (const a of AGENTS) {
    const agent = await prisma.agent.create({
      data: {
        chainId: a.chainId,
        tokenId: a.tokenId,
        address: a.address,
        name: a.name,
        category: a.category,
        description: a.description,
        registeredAt: new Date(Date.now() - a.daysAgo * 86400000),
        reputationScore: a.reputationScore,
        activityCount: a.activityCount,
        liveMetricLabel: a.liveMetricLabel,
        liveMetricValue: a.liveMetricValue,
      },
    });

    await prisma.session.create({
      data: {
        agentId: agent.id,
        spendCap: a.session.spendCap,
        spent: a.session.spent,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        exceededCap: a.session.exceededCap,
        actedAfterExp: a.session.actedAfterExp,
      },
    });

    for (const r of a.reports) {
      await prisma.communityReport.create({
        data: { agentId: agent.id, summary: r.summary, verified: r.verified },
      });
    }

    // session compliance score: penalize violations
    const sessionComplianceScore = Math.max(
      0,
      100 - (a.session.exceededCap ? 25 : 0) - (a.session.actedAfterExp ? 20 : 0)
    );
    const verifiedReports = a.reports.filter((r) => r.verified).length;
    const communityReportScore = Math.max(0, 100 - verifiedReports * 30);
    const score =
      0.4 * a.reputationScore + 0.35 * sessionComplianceScore + 0.25 * communityReportScore;

    await prisma.trustScoreSnapshot.create({
      data: {
        agentId: agent.id,
        score: Math.round(score * 10) / 10,
        identityReputationScore: a.reputationScore,
        sessionComplianceScore,
        communityReportScore,
      },
    });
  }

  console.log(`Seeded ${AGENTS.length} agents across 4 categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });