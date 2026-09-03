/**
 * One-off script to confirm the real 8004scan API pipeline resolves the
 * "Sentinel Health Guard" test agent registered on BSC Testnet.
 *
 * Run with: npx tsx scripts/test-real-agent.ts
 * Requires SCAN8004_API_KEY to be set in .env (mock mode will just echo
 * back fake data and won't prove anything).
 */
import "dotenv/config";
import { getAgentIdentity } from "../lib/integrations/scan8004";
import { classifyAgent } from "../lib/classification";

async function main() {
    const identity = await getAgentIdentity(97, "2076");
    console.log("Fetched identity:", identity);

    const category = classifyAgent(identity);
    console.log("Classified as:", category ?? "UNCLASSIFIED");

    if (category === "HEALTH_FACTOR_MONITORING") {
        console.log("✅ Classification matches intent — the pipeline works end to end.");
    } else {
        console.log(
            "⚠️  Classifier didn't return HEALTH_FACTOR_MONITORING — check whether tags/description came through as expected from the API."
        );
    }
}

main().catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
});