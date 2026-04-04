# Backend

Express server with x402 nanopayment services + worker orchestrator.

## What it does

- 10 seller services protected by Circle Gateway x402 middleware
- 8 worker agents that discover services via ENS and pay with nanopayments
- WebSocket server for real-time dashboard updates
- Dynamic pricing from ENS text records (refreshed every 30s)
- CRE orchestration demo endpoint

## Run

```bash
cd arc/backend
npm install
cp .env.example .env  # add wallet keys
npm run server         # starts API + WebSocket
```

## Environment

```
SELLER_KEY=0x...          # seller wallet private key
BUYER_KEY=0x...           # buyer wallet (for single agent tests)
WORKER_1_KEY=0x...        # worker wallets (8 total)
DEPLOYER_KEY=0x...        # for ENS price changes
```

## Endpoints

| Endpoint | Method | What |
|----------|--------|------|
| /health | GET | Server status |
| /prices | GET | Current ENS prices |
| /start | POST | Launch worker agents |
| /stop | POST | Stop workers |
| /gateway-status | GET | Circle Gateway balance + batch info |
| /cre-status | GET | CRE workflow status |
| /cre-run | POST | Execute CRE workflows |
| /change-price | POST | Update ENS price (writes to Sepolia) |
| /registry | GET | On-chain agent count |
| /api/{service} | GET/POST | x402 protected services |

## Services (prices from ENS)

search, llm, sentiment, classify, data, embeddings, translate, summarize, vision, code

Each service requires x402 payment via Circle Gateway. Price comes from ENS text records.
