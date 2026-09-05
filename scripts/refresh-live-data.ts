/**
 * Refreshes liveMetricValue for seeded agents using real protocol data.
 * Run with: npx tsx scripts/refresh-live-data.ts
 *
 * Scope, honestly: YIELD_OPTIMIZATION and GRID_TRADING get real live data
 * below (both have genuine public REST sources). REBALANCING and
 * HEALTH_FACTOR_MONITORING are left untouched here — both need per-wallet
 * on-chain state (token balances, account liquidity) that isn't available
 * from any public REST API and requires an RPC integration (viem) instead.
 * That's real follow-up work, not something to fake with a wrong label.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getTokenPriceUSD, getVenusMarketApy } from "../lib/integrations/liveData";

const prisma = new PrismaClient();

async function main() {
  const yieldAgents = await prisma.agent.findMany({ where: { category: "YIELD_OPTIMIZATION" } });
  for (const agent of yieldAgents) {
    // Exact Core Pool market symbols ("vUSDT", "vBNB") — see the comment
    // on getVenusMarketApy for why underlyingSymbol alone isn't safe here.
    const symbol = yieldAgents.indexOf(agent) % 2 === 0 ? "vUSDT" : "vBNB";
    const market = await getVenusMarketApy(symbol);
    if (market) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          liveMetricLabel: `Venus ${market.underlyingSymbol} supply APY`,
          liveMetricValue: `${market.supplyApy.toFixed(2)}%`,
        },
      });
      console.log(`Updated ${agent.name}: ${market.supplyApy.toFixed(2)}% (${market.underlyingSymbol})`);
    } else {
      console.log(`No Venus market found for ${symbol}, leaving ${agent.name} as-is.`);
    }
  }

  const gridAgents = await prisma.agent.findMany({ where: { category: "GRID_TRADING" } });
  for (const agent of gridAgents) {
    const price = await getTokenPriceUSD("CAKEUSDT");
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        liveMetricLabel: "CAKE price (USD)",
        liveMetricValue: `$${price.priceUsd.toFixed(2)}`,
      },
    });
    console.log(`Updated ${agent.name}: $${price.priceUsd.toFixed(2)} CAKE`);
  }

  console.log(
    "\nRebalancing and health-factor-monitoring agents left untouched — both need an RPC integration (wallet balances / Comptroller.getAccountLiquidity), not a REST call. See lib/integrations/liveData.ts for details."
  );
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
