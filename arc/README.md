# Arc — x402 Nanopayments + Smart Contracts

Flow Broker runs on Arc Testnet (chain 5042002), where USDC is the native gas token. Every intelligence call between a broker and a provider is a real USDC payment, gas-free.

## How we use Arc

Brokers pay providers using Circle Gateway's x402 protocol. Each call costs between $0.000002 (market data) and $0.015 (AI analysis). Payments are signed offchain using EIP-3009, then batched by Circle Gateway into a single onchain transaction.

```mermaid
sequenceDiagram
    participant Broker
    participant Provider
    participant Gateway as Circle Gateway (Arc)

    Broker->>Provider: GET /api/market-data
    Provider-->>Broker: 402 Payment Required
    Note over Broker: Signs EIP-3009 authorization (gas-free)
    Broker->>Provider: Retry with PAYMENT-SIGNATURE header
    Provider->>Gateway: Submit authorization
    Provider-->>Broker: 200 OK + market data
    Note over Gateway: Batches 1000s of payments → 1 onchain tx
    Gateway-->>Provider: Funds settled
```

## Payment flow stats

- Every intelligence call = 1 x402 payment on Arc
- 5,800+ real payments executed
- $11+ USDC earned by providers (visible on ArcScan)
- Gas saved vs individual txs: $1,500+

## Smart contracts

All 5 contracts deployed on Arc Testnet:

```mermaid
graph TB
    AR[AgentRegistry<br/>0xE9bFA497...] -->|tracks| Brokers
    PA[PaymentAccumulator<br/>0x627eE346...] -->|logs| Payments
    PO[PricingOracle<br/>0xdF5e936A...] -->|receives| CRE[Chainlink CRE]
    AC[AgenticCommerce<br/>0xDA5352c2...] -->|escrow| Jobs
    RH[ReputationHook<br/>0x18d9a536...] -->|updates| AR
```

## ERC-8004 identity

All 8 broker agents have registered identities on Arc's official IdentityRegistry (`0x8004A818...`). Token IDs #1448–1455. Each identity NFT is owned by the broker's wallet and links to metadata.

## Run locally

```bash
cd arc/backend
npm install
cp .env.example .env   # add SELLER_KEY, WORKER_1-8_KEY, DEPLOYER_KEY
npm run server         # starts on port 3001 (API) + 3002 (WebSocket)
```

```bash
cd arc/contracts
forge install
forge test             # 40 tests, all passing
forge script script/Deploy.s.sol --rpc-url https://rpc.testnet.arc.network --broadcast
```
