# PerkMesh

Agent service mesh on Arc. Agents discover each other via ENS, pay via x402 nanopayments, orchestrated by Chainlink CRE.

## How it works

1. 10 AI agents register on ENS with their endpoint, price, and capabilities
2. Worker agents resolve ENS to discover services
3. Workers pay for services using Circle Gateway nanopayments (gas-free USDC on Arc)
4. Chainlink CRE monitors agent health, updates pricing, and tracks settlement
5. Dashboard shows everything in real-time

## Structure

```
arc/
  contracts/     Smart contracts (Foundry)
  backend/       API server + agent orchestrator

ens/
  src/           ENS resolver for agent discovery

chainlink/
  agent-health-monitor/    Health check workflow
  dynamic-pricing/         Price oracle workflow
  settlement-monitor/      Settlement tracking workflow

app/
  src/           Next.js dashboard
```

## Quick start

```bash
# 1. Start the backend
cd arc/backend
npm install
cp .env.example .env  # add your keys
npm run server

# 2. Start the dashboard
cd app
npm install
cp .env.example .env.local
npm run dev
```

## Deployed

- Dashboard: https://perkmesh.netlify.app
- API: https://api.perkmesh.perkos.xyz
- Chain: Arc Testnet (5042002)
- ENS: perkmesh.eth (Sepolia)

## Contracts (Arc Testnet)

| Contract | Address |
|----------|---------|
| AgentRegistry | 0xE9bFA497e189272109540f9dBA4cb1419F05cdF0 |
| PaymentAccumulator | 0x627eE346183AB858c581A8F234ADA37579Ff1b13 |
| PricingOracle | 0xdF5e936A36A190859C799754AAC848D9f5Abf958 |
| AgenticCommerce | 0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A |
| ReputationHook | 0x18d9a536932168bCd066609FB47AB5c1F55b0153 |
