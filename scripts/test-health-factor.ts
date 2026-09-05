/**
 * Tests the real getAccountLiquidity() RPC read against a wallet address.
 * Run with: npx tsx scripts/test-health-factor.ts <walletAddress>
 *
 * Honest note: our seeded health-factor-monitoring agents (Sentinel Health
 * Watch, Threshold Guard) use fabricated addresses with no real on-chain
 * activity — running this against them will correctly return
 * liquidity=0, shortfall=0 (an empty account has no risk, trivially).
 * That's the RPC read working correctly, not a bug. To see a genuinely
 * non-trivial result, pass a real wallet address that actually has an
 * open Venus borrow position.
 */
import "dotenv/config";
import { getAccountLiquidity } from "../lib/integrations/liveData";

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error("Usage: npx tsx scripts/test-health-factor.ts <walletAddress>");
    process.exit(1);
  }

  const status = await getAccountLiquidity(address as `0x${string}`);
  console.log(`Account: ${address}`);
  console.log(`Liquidity buffer: $${status.liquidityUsd.toFixed(2)}`);
  console.log(`Shortfall: $${status.shortfallUsd.toFixed(2)}`);
  console.log(`At risk: ${status.atRisk}`);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
