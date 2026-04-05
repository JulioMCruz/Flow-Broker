# Flow Broker

8 AI broker agents that autonomously buy financial intelligence, execute trades via Uniswap, and report back to users — paying per API call using Circle Arc nanopayments.

Think of it as your personal AI hedge fund. Pick a risk profile, deposit USDC, and your broker goes to work.

---

## How it works

A user picks a broker (Guardian → safe, Titan → aggressive). The broker pays for intelligence from 10 specialized providers using x402 nanopayments on Arc. When all signals align — it executes a real trade on Uniswap.

```
User → picks broker → broker buys intelligence → AI decides → Uniswap trade
```

Each intelligence call is a real USDC micropayment. Each trade is a real Uniswap swap.

---

## Tech stack

**Circle Arc + x402**
Brokers pay providers per call — $0.000002 for market data, $0.015 for AI analysis. Gas-free, batched by Circle Gateway. All payments verifiable on ArcScan.

**ENS (flowbroker.eth)**
18 subnames (8 brokers + 10 providers). Each subname has text records storing price, capabilities, and identity. Brokers read provider prices from ENS before every call. Change a price in ENS → brokers adapt in 30 seconds.

**Chainlink CRE**
3 automated workflows running on-schedule:
- Health Monitor (every 5 min) — pings all providers, marks down ones inactive
- Dynamic Pricing (every 30 min) — fetches ETH/USD, recalculates provider prices
- Settlement Monitor (every 10 min) — checks Circle Gateway batch status

**Uniswap**
Brokers execute real trades after accumulating signals. Different brokers use different strategies:
- Guardian / Sentinel → ETH → USDC (preserve capital)
- Navigator / Momentum → ETH → UNI (trend + governance)
- Growth / Apex / Titan → ETH → UNI (aggressive alpha)

When a broker buys a risk-on asset (UNI/WETH), it broadcasts a coordination signal to the network. Other brokers can react — emergent coordination without a central coordinator.

**ERC-8004**
All 8 broker agents have registered identities on Arc's official IdentityRegistry. Token IDs #1448–1455.

---

## Live

| | URL |
|---|---|
| User app | https://flowbroker.netlify.app |
| Dashboard | https://flowbroker-app.netlify.app |
| API | https://api.perkmesh.perkos.xyz |
| ENS | [flowbroker.eth](https://sepolia.app.ens.domains/flowbroker.eth) |

---

## Contracts (Arc Testnet — chain 5042002)

| Contract | Address |
|----------|---------|
| AgentRegistry | [0xE9bFA497...](https://testnet.arcscan.app/address/0xE9bFA497e189272109540f9dBA4cb1419F05cdF0) |
| PaymentAccumulator | [0x627eE346...](https://testnet.arcscan.app/address/0x627eE346183AB858c581A8F234ADA37579Ff1b13) |
| PricingOracle | [0xdF5e936A...](https://testnet.arcscan.app/address/0xdF5e936A36A190859C799754AAC848D9f5Abf958) |
| AgenticCommerce | [0xDA5352c2...](https://testnet.arcscan.app/address/0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A) |
| ReputationHook | [0x18d9a536...](https://testnet.arcscan.app/address/0x18d9a536932168bCd066609FB47AB5c1F55b0153) |
| ERC-8004 IdentityRegistry | [0x8004A818...](https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) |

---

## Project structure

```
client/       User-facing app — quiz, broker selection, USDC payment
app/          Dashboard — live React Flow, trades, CRE logs, ENS demo
arc/          Smart contracts (Foundry) + backend (Express + x402)
ens/          ENS resolver for flowbroker.eth
chainlink/    3 CRE workflows with simulation results
```

---

## Uniswap integration

See `arc/backend/src/server.ts` — `BROKER_STRATEGIES` and `executeUniswapTrade`.

Each broker has a defined token pair strategy. The Routing API (`/quote` with `routingPreference: BEST_PRICE`) finds optimal paths. Coordination signals fire when risk-on assets are bought.

Real trades on Sepolia: see `arc/backend/trade-history.json`.
