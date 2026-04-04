# Backend

Express server with 10 x402-protected intelligence services, 8 worker broker agents, and WebSocket broadcaster.

## x402 Integration

Uses Circle Gateway SDK for real nanopayments on Arc Testnet:

```
Seller: createGatewayMiddleware({ sellerAddress })  ->  gateway.require("$0.001")
Buyer:  new GatewayClient({ chain: "arcTestnet", privateKey })  ->  client.pay(url)
```

- SDK: `@circle-fin/x402-batching` (server + client)
- Each `client.pay()` signs an EIP-3009 TransferWithAuthorization (gas-free)
- Middleware verifies signature and attaches `req.payment` (payer, amount, verified, transaction)
- Circle Gateway batches all authorizations -> settles as 1 on-chain tx
- `transaction` field is a gateway reference, NOT an on-chain tx hash

## Services (10 providers)

| Service | Endpoint | Price | Method |
|---------|----------|-------|--------|
| search | /api/search | $0.001 | GET |
| sentiment | /api/sentiment | $0.0003 | GET |
| classify | /api/classify | $0.0004 | GET |
| data | /api/data | $0.001 | GET |
| embeddings | /api/embeddings | $0.0005 | GET |
| llm | /api/llm | $0.015 | POST |
| translate | /api/translate | $0.005 | POST |
| summarize | /api/summarize | $0.015 | POST |
| vision | /api/vision | $0.03 | POST |
| code | /api/code | $0.03 | POST |

Prices come from ENS text records (`com.x402.price` on flowbroker.eth). Refreshed every 30s.

## Worker Orchestration

POST `/start` launches 8 parallel broker workers. Each worker:
1. Creates a `GatewayClient` with its own private key
2. Checks balance, deposits USDC if needed
3. Loops N cycles: picks random service from its provider list, calls `client.pay()`
4. Risk manager validation every 5 calls
5. Broadcasts payment events via WebSocket

Broker profiles determine which services each worker calls (Guardian = search only, Titan = all 10).

## WebSocket Events

Port 3002 (configurable via WS_PORT). Broadcasts:
- `payment` -- each x402 nanopayment (worker, service, amount, scheme, protocol, verified, transaction, fee)
- `stats` -- aggregate metrics (totalPayments, totalVolume, paymentsPerMin, gasSaved, activeWorkers)
- `worker_joined` / `worker_finished` -- worker lifecycle
- `complete` -- all workers done
- `cre_log` / `cre_result` -- CRE workflow events
- `ens_update` -- ENS price changes

## Run

```bash
cd arc/backend
npm install
cp .env.example .env  # add wallet keys
PORT=3001 WS_PORT=3002 npm run server
```

## Environment

```
SELLER_KEY=0x...          # seller wallet private key (funded with USDC on Arc Testnet)
BUYER_KEY=0x...           # buyer wallet (for single agent tests)
WORKER_1_KEY=0x...        # worker wallets (up to 8)
...
WORKER_8_KEY=0x...
DEPLOYER_KEY=0x...        # for ENS price changes (Sepolia signer)
```

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /health | GET | Server status |
| /prices | GET | Current ENS-resolved prices |
| /start | POST | Launch 8 worker agents (body: { cycles, profile }) |
| /stop | POST | Stop workers |
| /gateway-status | GET | Circle Gateway balance, batch info, recent payments |
| /cre-run | POST | Execute CRE workflows |
| /cre-logs | GET | CRE execution logs |
| /change-price | POST | Update ENS text record on Sepolia |
| /registry | GET | On-chain agent count from AgentRegistry |
| /api/{service} | GET/POST | x402-protected intelligence services |

## Scripts

```bash
npm run server        # Express API + WebSocket
npm run seller        # Standalone seller (10 services)
npm run buyer         # Single buyer agent
npm run orchestrator  # 8 workers + WebSocket
npm run jobs          # ERC-8183 job lifecycle demo
```

## Key Addresses

- Arc Testnet RPC: https://rpc.testnet.arc.network
- USDC: 0x3600000000000000000000000000000000000000
- Gateway Wallet: 0x0077777d7EBA4688BDeF3E311b846F25870A19B9
