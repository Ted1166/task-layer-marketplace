/**
 * Executes real, signed transactions on BSC Testnet on behalf of a hired
 * agent's session. This is genuinely real — a real private key signs a
 * real transaction, submitted to a real testnet RPC, producing a real tx
 * hash you can look up on testnet.bscscan.com.
 *
 * SECURITY — read before setting AGENT_TESTNET_PRIVATE_KEY:
 *  - Testnet only. Never put a mainnet private key here.
 *  - Use a throwaway wallet created specifically for this, funded with a
 *    small amount of testnet BNB from a faucet — not a wallet holding
 *    anything of real value, even on testnet.
 *  - .env must be gitignored (already checked earlier in this project) —
 *    never commit this key.
 *
 * Each real action moves a fixed nominal amount of testnet BNB and is
 * charged a fixed nominal USD cost against the session's spend cap. If
 * that would exceed the cap, the action is refused before signing anything
 * — a real compliance gate, not just a number shown after the fact.
 */
import { createWalletClient, http, parseEther, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

export const ACTION_COST_USD = 2; // nominal cost charged per real action
const ACTION_AMOUNT_BNB = "0.0001"; // tiny, real testnet BNB moved per action

// Where the tiny testnet BNB goes each action — a fixed, harmless address
// (this project's own address is fine; it's testnet BNB with no real value).
const ACTION_RECIPIENT: Hex = "0x9E2d2c2522a904EF07DC61F88D189833476D4A58";

function getAccount() {
  const key = process.env.AGENT_TESTNET_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "AGENT_TESTNET_PRIVATE_KEY is not set. See lib/integrations/agentExecutor.ts for setup — testnet-only, throwaway wallet."
    );
  }
  return privateKeyToAccount(key as Hex);
}

export async function executeRealAction(): Promise<{ txHash: string }> {
  const account = getAccount();
  const client = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545"),
  });

  const txHash = await client.sendTransaction({
    to: ACTION_RECIPIENT,
    value: parseEther(ACTION_AMOUNT_BNB),
  });

  return { txHash };
}
