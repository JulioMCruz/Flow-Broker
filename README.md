# Flow Broker

Autonomous AI Broker on Arc. Broker agents buy financial intelligence per-use via x402 nanopayments.

## Live

- Dashboard: https://perkmesh.netlify.app
- API: https://api.perkmesh.perkos.xyz
- ENS: flowbroker.eth (Sepolia)

## Structure

- arc/contracts — 5 Solidity contracts
- arc/backend — Express server with broker agents
- ens/ — ENS resolver for flowbroker.eth
- chainlink/ — 3 CRE workflows
- app/ — Next.js dashboard with React Flow

## Contracts (Arc Testnet)

- AgentRegistry: 0xE9bFA497e189272109540f9dBA4cb1419F05cdF0
- AgenticCommerce: 0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A
- PaymentAccumulator: 0x627eE346183AB858c581A8F234ADA37579Ff1b13
- PricingOracle: 0xdF5e936A36A190859C799754AAC848D9f5Abf958
- ReputationHook: 0x18d9a536932168bCd066609FB47AB5c1F55b0153
