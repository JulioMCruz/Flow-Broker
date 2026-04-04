# Flow Broker

Autonomous AI Broker — agents buy financial intelligence per-use via Arc x402 nanopayments, discovered via ENS.

## Live

| | URL |
|---|---|
| **Landing** | https://flowbroker.netlify.app |
| **Dashboard** | https://flowbroker-app.netlify.app |
| **API** | https://api.perkmesh.perkos.xyz |
| **ENS** | flowbroker.eth (Sepolia) |

## How it works

1. User takes a quiz → assigned a broker (Guardian → Titan)
2. User pays USDC to activate broker
3. Broker buys financial intelligence from 10 providers via x402 nanopayments (gas-free, Arc Testnet)
4. Each provider call = real x402 payment + intelligence returned
5. Chainlink CRE orchestrates health, pricing, batch settlement
6. Dashboard shows all brokers buying intelligence simultaneously

## Contracts (Arc Testnet · Chain ID 5042002)

| Contract | Address |
|----------|---------|
| AgentRegistry | [0xE9bFA497e189272109540f9dBA4cb1419F05cdF0](https://testnet.arcscan.app/address/0xE9bFA497e189272109540f9dBA4cb1419F05cdF0) |
| PaymentAccumulator | [0x627eE346183AB858c581A8F234ADA37579Ff1b13](https://testnet.arcscan.app/address/0x627eE346183AB858c581A8F234ADA37579Ff1b13) |
| PricingOracle | [0xdF5e936A36A190859C799754AAC848D9f5Abf958](https://testnet.arcscan.app/address/0xdF5e936A36A190859C799754AAC848D9f5Abf958) |
| AgenticCommerce | [0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A](https://testnet.arcscan.app/address/0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A) |
| ReputationHook | [0x18d9a536932168bCd066609FB47AB5c1F55b0153](https://testnet.arcscan.app/address/0x18d9a536932168bCd066609FB47AB5c1F55b0153) |

## ENS (Sepolia)

**flowbroker.eth** — 18 subnames: 8 brokers + 10 providers
[View →](https://sepolia.app.ens.domains/flowbroker.eth)

## Brokers

| Broker | Profile | APY | Cost | Risk |
|--------|---------|-----|------|------|
| Guardian | Conservative | 4.8% | ~$3/mo | Low |
| Sentinel | Conservative | 6.1% | ~$5/mo | Low |
| Steady | Balanced | 7.5% | ~$10/mo | Medium |
| Navigator | Balanced | 8.7% | ~$15/mo | Medium |
| Growth | Growth | 9.3% | ~$25/mo | Med-High |
| Momentum | Growth | 10.4% | ~$35/mo | Med-High |
| Apex | Alpha | 11.6% | ~$50/mo | High |
| Titan | Alpha | 12.8% | ~$75/mo | High |
