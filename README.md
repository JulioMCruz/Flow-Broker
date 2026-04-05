# Flow Broker

Autonomous AI Broker on Arc. 8 broker agents buy financial intelligence from 10 provider agents per-use via x402 nanopayments (Circle Gateway), discovered via ENS, orchestrated by Chainlink CRE.

## Architecture

### 1. User Flow

```mermaid
graph LR
    U[User] -->|Quiz| C[Client App]
    C -->|Broker match| A[Activate]
    A -->|Deposit USDC| ARC[Arc Testnet]
    ARC -->|View activity| D[Dashboard]
```

### 2. Agent Economy (x402 + Uniswap)

```mermaid
graph LR
    subgraph Brokers
        B1[Guardian] & B2[Sentinel] & B3[Steady] & B4[Titan]
    end

    subgraph Providers
        P1[Market Data] & P2[Sentiment] & P3[LLM] & P4[...7 more]
    end

    B1 & B2 & B3 & B4 -->|x402 nanopayment| P1 & P2 & P3 & P4
    P1 & P2 & P3 & P4 -->|intelligence data| B1 & B2 & B3 & B4
    B1 & B2 & B3 & B4 -->|BUY signal| UNI[Uniswap API]
    UNI -->|swap ETH→USDC| SEP[Sepolia]
    P1 & P2 -->|accumulate| GW[Circle Gateway]
    GW -->|batch settle 1 tx| ARC[Arc Testnet]
```

### 3. Orchestration (CRE + ENS)

```mermaid
graph LR
    CRE1[Health Monitor] -->|ping agents| BE[Backend]
    CRE2[Dynamic Pricing] -->|ETH/USD| PO[PricingOracle]
    CRE2 -->|update prices| BE
    BE -->|setText| ENS[flowbroker.eth]
    ENS -->|price discovery| BR[Brokers]
    CRE3[Settlement Monitor] -->|log trigger| PA[PaymentAccumulator]
    CRE3 -->|notify| BE
    BE -->|WebSocket| DASH[Dashboard]
```

## Live

| | URL |
|---|---|
| **Landing** | https://flowbroker.netlify.app |
| **Dashboard** | https://flowbroker-app.netlify.app |
| **API** | https://api.perkmesh.perkos.xyz |
| **ENS** | [flowbroker.eth](https://sepolia.app.ens.domains/flowbroker.eth) (Sepolia) |

## How it works

1. User takes a quiz on the client app -> assigned a broker (Guardian -> Titan)
2. User deposits USDC on Arc Testnet to activate their broker
3. Broker autonomously buys financial intelligence from 10 providers via x402 nanopayments
4. Each call: buyer signs EIP-3009 authorization (gas-free) -> seller verifies -> data returned
5. Circle Gateway batches all signed authorizations -> settles as 1 on-chain tx
6. Every 5 intelligence calls, broker checks signal: if BUY -> executes swap via Uniswap API on Sepolia (max 20 trades/session)
7. Chainlink CRE orchestrates the agent economy:
   - Health Monitor (5min): pings agent endpoints, detects downtime
   - Dynamic Pricing (30min): fetches ETH/USD -> calculates prices -> writes PricingOracle on-chain -> updates ENS text records -> agents read new prices
   - Settlement Monitor: detects batch threshold events on-chain -> confirms stats -> notifies backend
7. Dashboard shows all 8 brokers buying intelligence simultaneously in real-time

## x402 Payment Flow

```mermaid
sequenceDiagram
    participant Broker as Broker Agent
    participant ENS as flowbroker.eth
    participant Seller as Provider Service
    participant GW as Circle Gateway
    participant Arc as Arc Testnet

    Broker->>ENS: Resolve price (com.x402.price)
    ENS-->>Broker: $0.001
    Broker->>Seller: GET /api/search
    Seller-->>Broker: 402 Payment Required
    Broker->>Broker: Sign EIP-3009 (gas-free)
    Broker->>Seller: Retry with x402 proof
    Seller->>Seller: Verify signature
    Seller-->>Broker: 200 OK + data
    Seller->>GW: Accumulate authorization
    GW->>Arc: Batch settle (1 tx for N payments)
```

- SDK: `@circle-fin/x402-batching`
- Scheme: `GatewayWalletBatched`
- Authorization: EIP-3009 TransferWithAuthorization
- Settlement: Circle Gateway Batch (NOT per-transaction)
- Gas cost for buyer: $0.00 per payment (gas-free signatures)

## CRE Orchestration Flow

```mermaid
sequenceDiagram
    participant CRE as Chainlink CRE
    participant CG as CoinGecko API
    participant PO as PricingOracle
    participant BE as Backend
    participant ENS as flowbroker.eth
    participant Agents as Broker Agents

    Note over CRE: Dynamic Pricing (every 30 min)
    CRE->>CG: GET ETH/USD price
    CG-->>CRE: $2,063
    CRE->>CRE: Calculate 10 agent prices
    CRE->>PO: writeReport (on-chain via KeystoneForwarder)
    PO-->>CRE: tx hash
    CRE->>BE: POST /update-prices (batch)
    BE->>ENS: setText for each agent (Sepolia)
    Agents->>ENS: Read new prices (every 30s)
    Agents->>Agents: Pay updated x402 price
```

## Structure

| Directory | What |
|-----------|------|
| `client/` | Next.js landing page -- quiz, broker selection, wallet activation |
| `app/` | Next.js dashboard -- real-time flow visualization, payment feed, settlement tracking |
| `arc/backend/` | Express server -- 10 x402 services, 8 worker agents, WebSocket broadcaster |
| `arc/contracts/` | 5 Solidity contracts -- AgentRegistry, AgenticCommerce, PaymentAccumulator, PricingOracle, ReputationHook |
| `chainlink/` | 3 CRE workflows -- health monitor, dynamic pricing, settlement monitor |
| `ens/` | ENS resolver -- agent discovery via flowbroker.eth subnames |

## Contracts (Arc Testnet - Chain ID 5042002)

| Contract | Address |
|----------|---------|
| AgentRegistry | [0xE9bFA497e189272109540f9dBA4cb1419F05cdF0](https://testnet.arcscan.app/address/0xE9bFA497e189272109540f9dBA4cb1419F05cdF0) |
| AgenticCommerce | [0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A](https://testnet.arcscan.app/address/0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A) |
| PaymentAccumulator | [0x627eE346183AB858c581A8F234ADA37579Ff1b13](https://testnet.arcscan.app/address/0x627eE346183AB858c581A8F234ADA37579Ff1b13) |
| PricingOracle | [0xdF5e936A36A190859C799754AAC848D9f5Abf958](https://testnet.arcscan.app/address/0xdF5e936A36A190859C799754AAC848D9f5Abf958) |
| ReputationHook | [0x18d9a536932168bCd066609FB47AB5c1F55b0153](https://testnet.arcscan.app/address/0x18d9a536932168bCd066609FB47AB5c1F55b0153) |
| USDC | [0x3600000000000000000000000000000000000000](https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000) |
| Gateway Wallet | [0x0077777d7EBA4688BDeF3E311b846F25870A19B9](https://testnet.arcscan.app/address/0x0077777d7EBA4688BDeF3E311b846F25870A19B9) |

## ENS (Sepolia)

**flowbroker.eth** -- 18 subnames: 8 brokers + 10 providers
[View on ENS](https://sepolia.app.ens.domains/flowbroker.eth)

## Brokers

| Broker | Profile | Cost | Risk | Providers |
|--------|---------|------|------|-----------|
| Guardian | Conservative | ~$3/mo | Low | search |
| Sentinel | Conservative | ~$5/mo | Low | search, sentiment |
| Steady | Balanced | ~$10/mo | Medium | search, sentiment, llm |
| Navigator | Balanced | ~$15/mo | Medium | search, sentiment, llm, code |
| Growth | Growth | ~$25/mo | Med-High | search, sentiment, embeddings, classify, data |
| Momentum | Growth | ~$35/mo | Med-High | + translate |
| Apex | Alpha | ~$50/mo | High | 8 core services |
| Titan | Alpha | ~$75/mo | High | all 10 services |

## Run locally

```bash
# Terminal 1: Backend
cd arc/backend && npm install && PORT=3001 WS_PORT=3002 npm run server

# Terminal 2: Dashboard
cd app && npm install && PORT=3005 npm run dev

# Terminal 3: Client (optional)
cd client && npm install && npm run dev

# Terminal 4: CRE demo (optional)
cd chainlink && ./run-demo.sh
```

Environment files needed:
- `arc/backend/.env` -- SELLER_KEY, BUYER_KEY, DEPLOYER_KEY, WORKER_1-8_KEY
- `app/.env.local` -- NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_WS_URL
- `client/.env.local` -- NEXT_PUBLIC_DASHBOARD_URL, NEXT_PUBLIC_WC_PROJECT_ID
- `chainlink/.env` -- CRE_ETH_PRIVATE_KEY

## Tech Stack

- **Payments:** Circle x402 Gateway SDK (`@circle-fin/x402-batching`)
- **Trading:** Uniswap Trading API (Sepolia) — brokers execute swaps based on intelligence signals
- **Contracts:** Solidity, Foundry, OpenZeppelin (Arc Testnet)
- **Backend:** TypeScript, Express, viem, WebSocket
- **Frontend:** Next.js 16, React 19, React Flow, RainbowKit, wagmi, Tailwind CSS
- **Automation:** Chainlink CRE (TypeScript SDK -> WASM)
- **Identity:** ENS (Sepolia), ERC-8183 (Agentic Commerce Protocol)

## Bounties

| Bounty | Integration |
|--------|-------------|
| **Arc x402** ($6K) | 8 brokers making hundreds of x402 nanopayments to 10 providers, Circle Gateway batch settlement |
| **ENS** ($5K) | flowbroker.eth with 18 subnames, live text records for price discovery, CRE updates ENS prices |
| **Chainlink CRE** ($4K) | 3 workflows: health monitor, dynamic pricing (EVM Write), settlement monitor (Log Trigger) |
| **Uniswap API** ($10K) | Brokers execute real swaps on Sepolia when BUY signal received, max 20 trades/session |
