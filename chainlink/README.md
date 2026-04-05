# Chainlink CRE Workflows

3 CRE workflows that orchestrate the Flow Broker agent economy. Built with TypeScript SDK, compiled to WASM, simulated on CRE CLI v1.9.0.

## Prerequisites

```bash
# Install CRE CLI v1.9.0+
curl -sSL https://cre.chain.link/install.sh | sh
exec /bin/zsh  # reload shell

# Login (opens browser)
cre login

# Verify
cre version

# Bun required for TypeScript workflows
bun --version  # >= 1.0.0
```

## Workflows

### 1. Agent Health Monitor
- **Trigger:** Cron (every 5 min)
- **Capabilities:** HTTP Client
- **Chain Write:** No
- **What:** HTTP pings each agent endpoint, detects unresponsive agents
- **Contract:** AgentRegistry (`0xE9bFA497e189272109540f9dBA4cb1419F05cdF0`)

```bash
cd chainlink/agent-health-monitor && bun install
cd .. && cre workflow simulate agent-health-monitor --target staging-settings
```

**Verified result:** `"1-agents-down"` (correctly detected 404)

### 2. Dynamic Pricing Oracle
- **Trigger:** Cron (every 30 min)
- **Capabilities:** HTTP Client + EVM Write (writeReport via KeystoneForwarder)
- **Chain Write:** YES
- **What:** Fetches ETH/USD from CoinGecko, calculates fair prices, writes batch update to PricingOracle contract
- **Contract:** PricingOracle (`0xdF5e936A36A190859C799754AAC848D9f5Abf958`)
- **Formula:** `finalPrice = basePrice x costMultiplier x (1 + clamp((ethPrice - 2000) / 20000, -0.5, 0.5))`

```bash
cd chainlink/dynamic-pricing && bun install

# Dry-run simulation
cd .. && cre workflow simulate dynamic-pricing --target staging-settings

# With actual on-chain write (requires CRE_ETH_PRIVATE_KEY in chainlink/.env)
cre workflow simulate dynamic-pricing --target staging-settings --broadcast
```

**Verified result:** `"prices-updated-tx-0x2b2e9dbfa3dae182843aa82ec591794d93094c521d7b307f855a8d8d0ba89c14"`
**Verify on ArcScan:** https://testnet.arcscan.app/tx/0x2b2e9dbfa3dae182843aa82ec591794d93094c521d7b307f855a8d8d0ba89c14

### 3. Settlement Monitor
- **Trigger:** EVM Log (PaymentThresholdReached event on PaymentAccumulator)
- **Capabilities:** EVM Read (callContract) + HTTP Client
- **Chain Write:** No (calls backend /settle endpoint which handles settlement)
- **What:** Detects batch threshold events on-chain, confirms batch stats via EVM Read, notifies backend to record settlement
- **Contract:** PaymentAccumulator (`0x627eE346183AB858c581A8F234ADA37579Ff1b13`)
- **Backend endpoint:** `POST /settle` on `https://api.perkmesh.perkos.xyz`

```bash
cd chainlink/settlement-monitor && bun install

# Log Trigger requires interactive terminal — it prompts for a tx hash
cd .. && cre workflow simulate settlement-monitor --target staging-settings
# When prompted, enter tx hash: 0x3df46a6d0c4f6a4327fb1669def606fb0a2a48315923d6700691a8627a05e88d
# Event index: 1
```

**Verified result:** Successfully decoded `PaymentThresholdReached(batch=0, count=5, amount=5000000)` and confirmed batch stats on-chain.

## Generating PaymentThresholdReached events

The settlement-monitor needs a real on-chain event. To generate one:

```bash
# 1. Authorize a recorder (requires deployer/owner key)
cast send 0x627eE346183AB858c581A8F234ADA37579Ff1b13 \
  "setRecorder(address,bool)" <RECORDER_ADDRESS> true \
  --rpc-url https://rpc.testnet.arc.network --private-key <DEPLOYER_KEY>

# 2. Set a low threshold for testing
cast send 0x627eE346183AB858c581A8F234ADA37579Ff1b13 \
  "setThreshold(uint256)" 5 \
  --rpc-url https://rpc.testnet.arc.network --private-key <DEPLOYER_KEY>

# 3. Record payments until threshold is reached
for i in {1..5}; do
  cast send 0x627eE346183AB858c581A8F234ADA37579Ff1b13 \
    "recordPayment(address,address,uint256)" <BUYER> <SELLER> 1000000 \
    --rpc-url https://rpc.testnet.arc.network --private-key <RECORDER_KEY>
done
# The 5th tx will emit PaymentThresholdReached — use that tx hash for simulation
```

## Demo script (for hackathon judges)

Run all 3 workflows in sequence with formatted output:

```bash
cd chainlink
./run-demo.sh
```

The script automatically:
1. Installs dependencies for all 3 workflows
2. Runs Agent Health Monitor (automatic)
3. Runs Dynamic Pricing Oracle with `--broadcast` (real on-chain tx)
4. Runs Settlement Monitor (prompts for tx hash — paste `0x3df46a6d0c4f6a4327fb1669def606fb0a2a48315923d6700691a8627a05e88d`, event index `1`)

## Environment

```bash
# chainlink/.env (gitignored)
CRE_ETH_PRIVATE_KEY=your_private_key_without_0x_prefix
```

## Simulation results

All simulation outputs are saved in `simulation-results.json` for the dashboard to display on Netlify without requiring the CRE CLI.

## Integration with backend

The CRE workflows integrate with the live backend at `https://api.perkmesh.perkos.xyz`:

- **Settlement Monitor** calls `POST /settle` to notify the backend when batch threshold is reached
- **Backend** broadcasts CRE events via WebSocket to the dashboard in real-time
- **Dashboard CRE tab** shows workflow execution logs and results

## Project structure

```
chainlink/
  project.yaml              # RPC endpoints (Arc Testnet)
  .env                      # CRE_ETH_PRIVATE_KEY (gitignored)
  .env.example              # Placeholder
  simulation-results.json   # Captured simulation outputs for dashboard
  agent-health-monitor/
    main.ts                 # Cron trigger + HTTP health checks
    workflow.yaml           # CRE settings (staging/production targets)
    config.staging.json     # Agent endpoints
  dynamic-pricing/
    main.ts                 # Cron trigger + HTTP fetch + EVM writeReport
    workflow.yaml           # CRE settings
    config.staging.json     # 10 agent pricing config
  settlement-monitor/
    main.ts                 # Log trigger + EVM Read + HTTP POST to backend
    workflow.yaml           # CRE settings
    config.staging.json     # Backend URL + contract address
```

## Key details

- CRE CLI v1.9.0, TypeScript SDK @chainlink/cre-sdk ^1.5.0
- All workflows target Arc Testnet (chain: arc-testnet, ID: 5042002)
- Contracts use ReceiverTemplate for secure CRE writes via KeystoneForwarder
- Only dynamic-pricing uses `--broadcast` (EVM Write)
- Settlement monitor uses real backend URL (`https://api.perkmesh.perkos.xyz/settle`)
- Simulation results captured in `simulation-results.json` for Netlify dashboard
