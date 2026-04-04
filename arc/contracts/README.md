# Smart Contracts

5 Solidity contracts deployed on Arc Testnet. Built with Foundry + OpenZeppelin.

## Contracts

- **AgentRegistry** — stores agent metadata, status, pricing. CRE writes here via ReceiverTemplate.
- **PaymentAccumulator** — tracks nanopayment volume and emits threshold events.
- **PricingOracle** — receives price updates from CRE Dynamic Pricing workflow.
- **AgenticCommerce** — ERC-8183 job escrow. Client creates job, funds USDC, provider submits, evaluator completes.
- **ReputationHook** — ERC-8183 hook that updates agent reputation on job complete/reject.

## Run tests

```bash
cd arc/contracts
forge install
forge test -v
```

All 40 tests pass.

## Deploy

```bash
cp .env.example .env  # add PRIVATE_KEY
forge script script/Deploy.s.sol --rpc-url https://rpc.testnet.arc.network --broadcast --legacy
```

## Key details

- Arc Testnet uses USDC as native gas (no ETH needed)
- USDC address: 0x3600000000000000000000000000000000000000
- CRE Forwarder: 0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1
- ReceiverTemplate contracts accept reports from CRE via KeystoneForwarder
