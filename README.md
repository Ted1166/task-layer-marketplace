# Ledger - Trust-Layer Agent Marketplace

**A BNB Agent Studio marketplace where every listed agent carries a live, visible trust score** - built from onchain identity/reputation, session compliance history, and verified community reports - on top of the required rebalancing / grid trading / yield optimization / health factor monitoring catalog.

Built for BNB Chain's "Build the Era" hackathon (Smart Money Era track).

---

## Why this exists

Every team in this hackathon builds search, listings, and filtering across BSC's registered agents - that's the baseline. What's missing from "hire an agent" today is the thing people are actually scared of: *will this agent overspend, misuse its permissions, or misbehave?* Ledger answers that with a trust score built from three real signals, and backs the whole thing with real integrations rather than mock data wherever it was possible to get real data.

## What's real here - read this before assuming it's all seed data

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

- **Live Altana session issuance.** Qualifying for Altana's own prize track requires agents operating from their own Altana wallets with sessions registered in Altana's Keystore - a materially bigger, separate integration from what's here.
- **TermiX's Agent Advantage Report.** Requires running real tasks both with and without a hired agent and comparing outcomes — needs to be planned from day one if pursued, not retrofitted.
- **Rebalancing/health-factor live data for every agent.** The RPC plumbing is proven correct (see above), but wiring it into every seeded agent would require those agents to be real wallets with real positions, which they aren't.

## Architecture

8004scan API ─┐
Altana keystore (session compliance) ─┼─→ Trust score engine ─→ Marketplace platform ─→ BNB Smart Chain
Community reports ─┘ (catalog, hire flow) (agent wallets, DeFi protocols)

- **Trust score** = 40% identity/reputation (8004scan) + 35% session compliance + 25% verified community reports. See `lib/trustScore.ts`.
- **Category classification** matches agent tags/description/OASF skill fields against keyword rules — see `lib/classification.ts`.
- **Live data integrations** live in `lib/integrations/` — `scan8004.ts` (identity), `liveData.ts` (Venus APY, Binance price, Comptroller RPC read), `altana.ts` (session compliance, currently mocked pending API access), `agentExecutor.ts` (real signed testnet transactions).

## Running this locally — recommended over deploying, at least during development

**Local development has been the far smoother path throughout this build.** The deployed version (Vercel + Supabase) works, but getting there involved working through a real IPv6/pooler connectivity issue specific to some local networks, Vercel's dependency-caching quirks with Prisma, and Next.js's breaking `params` API change — none of which show up when running locally against SQLite. Unless you specifically need a public URL (e.g. for hackathon judging), **local + SQLite is faster to iterate on and has fewer moving parts to break.**

\`\`\`bash
git clone <your-repo-url>
cd task-layer-marketplace
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
\`\`\`

Open http://localhost:3000.

### Getting real data instead of mocks

Set these in `.env` (see `.env` for full comments on each):

\`\`\`
SCAN8004_API_KEY=       # https://8004scan.io/developers
BSC_CHAIN_ID=97          # 97 = testnet, 56 = mainnet
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
AGENT_TESTNET_PRIVATE_KEY=   # testnet-only throwaway wallet — see lib/integrations/agentExecutor.ts
\`\`\`

Then:
\`\`\`bash
npm run refresh-live-data      # pulls real Venus APY + Binance price into the catalog
npm run test-agent             # confirms the real 8004scan pipeline resolves your registered agent
npm run test-health-factor <address>   # tests the real Comptroller RPC read
\`\`\`

## Deploying (Vercel + Supabase)

If you do need a public deployment:

1. Create a Postgres database on Supabase, and change `prisma/schema.prisma`'s datasource `provider` to `"postgresql"`. You'll need both `DATABASE_URL` (pooled connection) and `DIRECT_URL` (for schema pushes) — Supabase's "Connect → ORM → Prisma" panel gives you both.
2. Set the **Install Command** in Vercel to `npm install` (not `npm run dev` — that starts a server, it doesn't install anything).
3. Set the **Build Command** to `npx prisma generate && npm run build` — Vercel caches dependencies between builds, which skips Prisma's normal auto-generation unless forced like this.
4. Add every `.env` variable to Vercel's Environment Variables, including `DATABASE_URL` and `DIRECT_URL`.
5. Push your schema and seed data to the *production* database specifically — this is a common trip-up, since a local `npm run seed` only touches whichever `DATABASE_URL` your local `.env` currently points at.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind v4 · Prisma · SQLite (dev) / Postgres via Supabase (prod) · viem

## Hackathon submission notes

- **Live registered agent:** BSC Testnet, ERC-8004 token ID 2076
- **Sub-prize tracks:** main track focus; Altana/TermiX tracks intentionally out of scope given the build timeline (see "What's not built")
