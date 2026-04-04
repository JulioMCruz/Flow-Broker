# Smart Contracts

5 Solidity contracts deployed on Arc Testnet. Built with Foundry + OpenZeppelin.

## Contracts

### AgentRegistry
Stores metadata for 50 agents (8 brokers + 10 providers + 32 reserved). Tracks wallet, ENS name, endpoint, price, payment model, capabilities, and reputation. CRE writes status/price updates via ReceiverTemplate.

### AgenticCommerce (ERC-8183)
Job escrow with 6-state FSM: Open -> Funded -> Submitted -> Completed/Rejected/Expired. Client creates job, funds USDC, provider submits work, evaluator approves. Supports optional hooks (beforeAction/afterAction).

### PaymentAccumulator
Tracks x402 nanopayment volume. Emits `PaymentThresholdReached` event when count hits threshold, triggering CRE Settlement Monitor. Records batch settlement confirmations.

### PricingOracle
Receives dynamic price updates from CRE Dynamic Pricing workflow. Calculates prices based on ETH/USD feed with per-agent cost multipliers and bounded adjustments (+-50%).

### ReputationHook (ERC-8183 Hook)
Called by AgenticCommerce on job completion/rejection. Increments completed/rejected counts on AgentRegistry. Uses inline assembly for efficient calldata decoding.

## Deployed Addresses (Arc Testnet)

| Contract | Address |
|----------|---------|
| AgentRegistry | 0xE9bFA497e189272109540f9dBA4cb1419F05cdF0 |
| AgenticCommerce | 0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A |
| PaymentAccumulator | 0x627eE346183AB858c581A8F234ADA37579Ff1b13 |
| PricingOracle | 0xdF5e936A36A190859C799754AAC848D9f5Abf958 |
| ReputationHook | 0x18d9a536932168bCd066609FB47AB5c1F55b0153 |

## Interfaces

- `IReceiver` -- Minimal interface for CRE report writes
- `ReceiverTemplate` -- Abstract base with KeystoneForwarder permission controls
- `IACPHook` -- ERC-8183 hook interface (beforeAction, afterAction)

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
- USDC: 0x3600000000000000000000000000000000000000
- CRE Forwarder: 0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1
- ReceiverTemplate contracts accept reports from CRE via KeystoneForwarder
- AgenticCommerce fee: configurable basis points to treasury address
