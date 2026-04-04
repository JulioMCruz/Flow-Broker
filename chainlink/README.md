# Chainlink CRE Workflows

3 CRE workflows that orchestrate the agent economy. Built with TypeScript SDK, compiled to WASM, simulated on CRE CLI v1.9.0.

## Workflows

### Agent Health Monitor
- **Trigger:** Cron (every 5 min)
- **What:** HTTP pings each agent endpoint, marks unresponsive agents as inactive
- **Contract:** AgentRegistry on Arc Testnet
- **Simulation result:** "1-agents-down" (correctly detected 404)

### Dynamic Pricing Oracle
- **Trigger:** Cron (every 30 min)
- **What:** Fetches ETH/USD from CoinGecko, calculates fair prices for each agent
- **Contract:** PricingOracle on Arc Testnet
- **Simulation result:** "ETH/USD: $2,052.16 → Prices: [100, 802]"

### Settlement Monitor
- **Trigger:** Cron (every 10 min)
- **What:** Checks backend health and Gateway settlement status
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

## Key details

- All workflows target Arc Testnet (chain selector: arc-testnet)
- Contracts use ReceiverTemplate for secure CRE writes
- Chainlink team can deploy to live DON at the hackathon
- CRE CLI v1.9.0, TS SDK v1.5.0
