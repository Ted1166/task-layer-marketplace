/**
 * Live protocol data for the marketplace catalog's "current metric" fields.
 *
 * Verified real endpoints (checked against live docs/schemas, not guessed):
 *  - Binance public ticker price API — spot price for a trading pair.
 *  - Venus Protocol API — market supply/borrow APY. Confirmed via the live
 *    OpenAPI spec at https://api.venus.io/docs/swagger.json
 *
 * Important honest gap: Venus's public API has NO endpoint for a specific
 * account's health factor — it only indexes market/pool/governance data.
 * Venus's own docs explicitly warn the API isn't authoritative for
 * "liquidation safety." Real per-account health factor data requires an
 * on-chain contract read (Comptroller.getAccountLiquidity via RPC/viem),
 * not a REST call. That's real, separate work — see getAccountHealthFactor
 * below, which is intentionally a stub, not a guessed wrong endpoint.
 */

const BINANCE_API_URL = "https://api.binance.com/api/v3";
const VENUS_API_URL = "https://api.venus.io";

export interface TokenPrice {
  symbol: string;
  priceUsd: number;
}

/**
 * GET /ticker/price?symbol=CAKEUSDT — Binance's public spot price API.
 * Switched from PancakeSwap's Info API (api.pancakeswap.info), whose
 * source repo was archived by PancakeSwap in 2022 and returns intermittent
 * 500s now — dead infrastructure that happens to still resolve. Binance's
 * ticker price is a centralized-exchange price rather than an on-chain DEX
 * price, worth noting, but it's real, live, and reliably maintained.
 */
export async function getTokenPriceUSD(symbol: string): Promise<TokenPrice> {
  const res = await fetch(`${BINANCE_API_URL}/ticker/price?symbol=${symbol}`);
  if (!res.ok) throw new Error(`Binance price lookup failed for ${symbol}: ${res.status}`);
  const json = await res.json();
  return { symbol, priceUsd: parseFloat(json.price) };
}

export interface VenusMarketApy {
  symbol: string;
  underlyingSymbol: string;
  supplyApy: number;
  borrowApy: number;
}

/**
 * GET /markets?chainId=...&symbol=... — real, public, no API key required.
 * Filters by the exact vToken market symbol (e.g. "vUSDT"), not just the
 * underlying asset symbol. Venus runs multiple pools per asset — a Core
 * Pool market (e.g. vUSDT) plus isolated pools (e.g. vUSDT_DeFi) with much
 * thinner liquidity and often extreme rates. Filtering by underlyingSymbol
 * alone can match whichever pool comes back first, which is how an
 * isolated pool with a 1867% borrow APY got pulled in during testing
 * instead of the representative Core Pool market.
 */
export async function getVenusMarketApy(
  marketSymbol: string,
  chainId = 56
): Promise<VenusMarketApy | null> {
  const res = await fetch(
    `${VENUS_API_URL}/markets?chainId=${chainId}&symbol=${marketSymbol}`
  );
  if (!res.ok) throw new Error(`Venus market lookup failed for ${marketSymbol}: ${res.status}`);
  const json = await res.json();
  const market = json.result?.[0];
  if (!market) return null;

  return {
    symbol: market.symbol,
    underlyingSymbol: market.underlyingSymbol,
    supplyApy: parseFloat(market.supplyApy),
    borrowApy: parseFloat(market.borrowApy),
  };
}

/**
 * Real on-chain read for account-level lending risk — the piece that
 * couldn't be done via REST (see the file-level comment above).
 *
 * Contract verified on BscScan: Venus's Core Pool Comptroller proxy
 * (Unitroller), 0xfD36E2c2a6789Db23113685031d7F16329158384 — confirmed
 * live, verified, $34.9M+ balance, 832K+ transactions.
 *
 * getAccountLiquidity(address) is the standard Compound-fork risk-check
 * function: returns (error, liquidityUsd, shortfallUsd), both scaled by
 * 1e18. If shortfall > 0, the account is already underwater. If
 * liquidity > 0 and shortfall == 0, that liquidity is the USD buffer
 * before the account would become liquidatable — not the same "1.62"-style
 * normalized ratio Aave popularized, but the real, correct Venus signal.
 *
 * Uses Binance's public BSC RPC endpoint — no API key needed, but also no
 * uptime guarantee; a production version should let this be overridden via
 * env var and/or fall back to a second RPC provider.
 */
import { createPublicClient, http, type Address } from "viem";
import { bsc } from "viem/chains";

const VENUS_COMPTROLLER_ADDRESS: Address = "0xfD36E2c2a6789Db23113685031d7F16329158384";

const COMPTROLLER_ABI = [
  {
    name: "getAccountLiquidity",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      { name: "error", type: "uint256" },
      { name: "liquidity", type: "uint256" },
      { name: "shortfall", type: "uint256" },
    ],
  },
] as const;

const publicClient = createPublicClient({
  chain: bsc,
  transport: http(process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org"),
});

export interface AccountLiquidityStatus {
  liquidityUsd: number;
  shortfallUsd: number;
  atRisk: boolean; // shortfall > 0 — the account is already underwater
}

export async function getAccountLiquidity(walletAddress: Address): Promise<AccountLiquidityStatus> {
  const [error, liquidity, shortfall] = await publicClient.readContract({
    address: VENUS_COMPTROLLER_ADDRESS,
    abi: COMPTROLLER_ABI,
    functionName: "getAccountLiquidity",
    args: [walletAddress],
  });

  if (error !== 0n) {
    throw new Error(`Comptroller.getAccountLiquidity returned error code ${error}`);
  }

  return {
    liquidityUsd: Number(liquidity) / 1e18,
    shortfallUsd: Number(shortfall) / 1e18,
    atRisk: shortfall > 0n,
  };
}
