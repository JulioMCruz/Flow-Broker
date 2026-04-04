# Chainlink CRE Workflows

3 CRE workflows that orchestrate the agent economy. Built with TypeScript SDK, compiled to WASM, simulated on CRE CLI v1.9.0.

## Workflows

### Agent Health Monitor
- **Trigger:** Cron (every 5 min)
- **Action:** HTTP pings each agent endpoint, checks statusCode === 200
- **Output:** Marks unresponsive agents as inactive on AgentRegistry
- **Contract:** AgentRegistry on Arc Testnet
- **Simulation result:** "1-agents-down" (correctly detected 404)

### Dynamic Pricing Oracle
- **Trigger:** Cron (every 30 min)
- **Action:** Fetches ETH/USD from CoinGecko, calculates fair prices
- **Pricing formula:** `finalPrice = basePrice x costMultiplier x (1 + priceAdjustment)`
  - `priceAdjustment = clamp((ethPrice - 2000) / 20000, -0.5, 0.5)`
- **Output:** Batch price update to PricingOracle via KeystoneForwarder
- **Contract:** PricingOracle on Arc Testnet
- **Simulation result:** "ETH/USD: $2,052.16 -> Prices: [100, 802]"

### Settlement Monitor
- **Trigger:** Cron (every 10 min)
- **Action:** Checks backend health + Gateway settlement status
- **Flow:** Decode event -> Confirm batch stats -> Notify backend
- **Contract:** PaymentAccumulator on Arc Testnet
- **Simulation result:** "Backend status: ok, services: 10"

## Run simulation

```bash
# Install CRE CLI
curl -sSL https://cre.chain.link/install.sh | sh
cre login

# Simulate a workflow
cd chainlink/agent-health-monitor
bun install
cre workflow simulate . --target staging-settings
```

## Project config

See `project.yaml` for workflow definitions, triggers, and target chains.

## Key details

- All workflows target Arc Testnet (chain selector: arc-testnet)
- Contracts use ReceiverTemplate for secure CRE writes via KeystoneForwarder
- CRE CLI v1.9.0, TS SDK v1.5.0
- Workflows compile TypeScript -> WASM for execution on Chainlink DON
