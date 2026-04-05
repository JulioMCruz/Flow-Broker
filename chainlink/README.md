# Chainlink CRE Workflows

3 CRE workflows that orchestrate the Flow Broker agent economy. Built with TypeScript SDK, compiled to WASM.

## Prerequisites

```bash
# Install CRE CLI v1.9.0+
curl -sSL https://cre.chain.link/install.sh | sh
exec /bin/zsh  # reload shell to get cre in PATH

# Login (opens browser)
cre login

# Verify
cre version  # should show v1.9.0+

# Bun required for TypeScript workflows
bun --version  # should show >= 1.0.0
```

## Workflows

### 1. Agent Health Monitor
- **Trigger:** Cron (every 5 min)
- **Capabilities:** HTTP Client
- **Chain Write:** No (read-only health checks)
- **What it does:** HTTP pings each agent endpoint, marks unresponsive agents
- **Contract:** AgentRegistry (`0xE9bFA497e189272109540f9dBA4cb1419F05cdF0`)

```bash
cd chainlink/agent-health-monitor
bun install
cre workflow simulate . --target staging-settings
```

### 2. Dynamic Pricing Oracle
- **Trigger:** Cron (every 30 min)
- **Capabilities:** HTTP Client + EVM Write
- **Chain Write:** YES -- writes price updates to PricingOracle via KeystoneForwarder
- **What it does:** Fetches ETH/USD from CoinGecko, calculates fair prices, writes to contract
- **Contract:** PricingOracle (`0xdF5e936A36A190859C799754AAC848D9f5Abf958`)
- **Pricing formula:** `finalPrice = basePrice x costMultiplier x (1 + clamp((ethPrice - 2000) / 20000, -0.5, 0.5))`

```bash
cd chainlink/dynamic-pricing
bun install

# Dry-run simulation
cre workflow simulate . --target staging-settings

# With actual on-chain write (generates real tx hash on Arc Testnet)
cre workflow simulate . --target staging-settings --broadcast
```

### 3. Settlement Monitor
- **Trigger:** EVM Log (PaymentThresholdReached event)
- **Capabilities:** EVM Read + HTTP Client
- **Chain Write:** No (reads on-chain, routes via HTTP to Circle Gateway)
- **What it does:** Listens for batch threshold events, confirms stats on-chain, triggers Circle settlement
- **Contract:** PaymentAccumulator (`0x627eE346183AB858c581A8F234ADA37579Ff1b13`)

```bash
cd chainlink/settlement-monitor
bun install
cre workflow simulate . --target staging-settings
```

## Running all simulations

```bash
cd chainlink

# Install all dependencies
cd agent-health-monitor && bun install && cd ..
cd dynamic-pricing && bun install && cd ..
cd settlement-monitor && bun install && cd ..

# Run simulations (requires cre login first)
cd agent-health-monitor && cre workflow simulate . --target staging-settings && cd ..
cd dynamic-pricing && cre workflow simulate . --target staging-settings && cd ..
cd settlement-monitor && cre workflow simulate . --target staging-settings && cd ..

# Run dynamic-pricing with broadcast (actual on-chain tx)
cd dynamic-pricing && cre workflow simulate . --target staging-settings --broadcast && cd ..
```

## Capturing simulation logs for dashboard

The dashboard shows CRE simulation logs. To capture real CLI output:

```bash
# Run simulation and save output
cd dynamic-pricing
cre workflow simulate . --target staging-settings 2>&1 | tee ../simulation-output.log
```

The backend at `/cre-run` simulates the same workflow logic internally and broadcasts logs via WebSocket to the dashboard in real-time.

## Project structure

```
chainlink/
  project.yaml              # RPC endpoints (Arc Testnet)
  agent-health-monitor/
    main.ts                  # Workflow logic
    workflow.yaml            # CRE settings with staging/production targets
    config.staging.json      # Runtime config (agent endpoints)
    package.json             # @chainlink/cre-sdk ^1.5.0
  dynamic-pricing/
    main.ts                  # Workflow logic + writeReport
    workflow.yaml            # CRE settings
    config.staging.json      # Agent pricing config (10 agents)
  settlement-monitor/
    main.ts                  # Workflow logic + logTrigger
    workflow.yaml            # CRE settings
    config.staging.json      # Circle Gateway + backend URLs
```

## Key details

- All workflows target Arc Testnet (chain: arc-testnet, ID: 5042002)
- CRE CLI v1.9.0, TypeScript SDK @chainlink/cre-sdk ^1.5.0
- Contracts use ReceiverTemplate for secure CRE writes via KeystoneForwarder
- Only dynamic-pricing uses `--broadcast` (EVM Write via `writeReport()`)
- Settlement monitor uses Log Trigger (event-based), not Cron
- Simulation output is captured and displayed in the dashboard CRE tab

## For hackathon judges

To verify CRE integration:

1. `cre login` (authenticate)
2. `cd chainlink/dynamic-pricing && cre workflow simulate . --target staging-settings --broadcast`
3. Copy the tx hash from output
4. Verify on ArcScan: `https://testnet.arcscan.app/tx/{hash}`
5. The dashboard CRE tab shows the same workflow execution logs in real-time
