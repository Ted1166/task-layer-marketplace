# Ledger — Trust-Layer Agent Marketplace

**A BNB Agent Studio marketplace where every listed agent carries a live, visible trust score** — built from onchain identity/reputation, session compliance history, and verified community reports — on top of the required rebalancing / grid trading / yield optimization / health factor monitoring catalog.

Built for BNB Chain's "Build the Era" hackathon (Smart Money Era track).

---

## Why this exists

Every team in this hackathon builds search, listings, and filtering across BSC's registered agents — that's the baseline. What's missing from "hire an agent" today is the thing people are actually scared of: *will this agent overspend, misuse its permissions, or misbehave?* Ledger answers that with a trust score built from three real signals, and backs the whole thing with real integrations rather than mock data wherever it was possible to get real data.

## What's real here — read this before assuming it's all seed data

This project has been built with a hard rule throughout: **verify before shipping, and say plainly when something is a stub.** Here's the honest breakdown.

| Piece | Status |
|---|---|
| Agent identity/reputation (8004scan) | **Real.** Live API, real base URL, real auth header, verified against the actual OpenAPI spec. |
| A registered test agent | **Real.** "Sentinel Health Guard," ERC-8004 token ID 2076, live on BSC Testnet — check it on [8004scan](https://testnet.8004scan.io) or [BscScan Testnet](https://testnet.bscscan.com). |
| Yield APY data | **Real.** Live Venus Protocol Core Pool market data (`vUSDT`, `vBNB`), fetched from Venus's public API. |
| Grid trading price data | **Real.** Live spot price from Binance's public ticker API. |
| Health factor RPC read | **Real.** `getAccountLiquidity()` read directly from Venus's Comptroller contract on BSC via `viem` — no guessed contract addresses, verified on BscScan first. |
| Hire / session flow | **Real**, but scoped to this marketplace's own database — not yet a live Altana Keystore session (that's a separate, heavier integration; see "What's not built" below). |
| Real signed transactions | **Real.** The "Run real agent action" button signs and submits an actual transaction on BSC Testnet with a real tx hash, gated by a genuine spend-cap compliance check — not cosmetic, it actually refuses to sign once a session's cap would be exceeded. |
| Rebalancing drift / other agents' health factor | **Seed data**, honestly. Real per-wallet data here needs on-chain balance reads for wallets that don't actually exist (the seed agents' addresses are fabricated) — see "What's not built." |
| Community reports | **Real** submission flow with an unverified-by-default gate, but no reports have been externally verified yet since this is a fresh project. |

## What's not built (by design, not oversight)

- **Live Altana session issuance.** Qualifying for Altana's own prize track requires agents operating from their own Altana wallets with sessions registered in Altana's Keystore — a materially bigger, separate integration from what's here.
- **TermiX's Agent Advantage Report.** Requires running real tasks both with and without a hired agent and comparing outcomes — needs to be planned from day one if pursued, not retrofitted.
- **Rebalancing/health-factor live data for every agent.** The RPC plumbing is proven correct (see above), but wiring it into every seeded agent would require those agents to be real wallets with real positions, which they aren't.

## Architecture
