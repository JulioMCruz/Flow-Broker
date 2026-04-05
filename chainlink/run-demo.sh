#!/bin/bash
# =============================================================================
# Flow Broker — CRE Workflow Demo for Hackathon Judges
# =============================================================================
# Runs all 3 Chainlink CRE workflows in sequence.
# Prerequisites: cre login, bun installed, dependencies installed
# =============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

CHAINLINK_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$CHAINLINK_DIR"

echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}  Flow Broker — Chainlink CRE Workflow Demo${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Chain:    ${GREEN}Arc Testnet (eip155:5042002)${NC}"
echo -e "  CRE CLI:  $(cre version 2>/dev/null || echo 'not installed')"
echo -e "  SDK:      @chainlink/cre-sdk ^1.5.0"
echo ""

# ─── Install dependencies ───
echo -e "${YELLOW}Installing dependencies...${NC}"
cd agent-health-monitor && bun install --silent 2>/dev/null && cd ..
cd dynamic-pricing && bun install --silent 2>/dev/null && cd ..
cd settlement-monitor && bun install --silent 2>/dev/null && cd ..
echo -e "${GREEN}Done${NC}"
echo ""

# ─── Workflow 1: Agent Health Monitor ───
echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}  1/3  Agent Health Monitor${NC}"
echo -e "  Trigger:  Cron (every 5 min)"
echo -e "  Action:   HTTP pings all agent endpoints"
echo -e "  Contract: AgentRegistry"
echo -e "${CYAN}───────────────────────────────────────────────────────────${NC}"
echo ""
cre workflow simulate agent-health-monitor --target staging-settings
echo ""

# ─── Workflow 2: Dynamic Pricing Oracle ───
echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}  2/3  Dynamic Pricing Oracle ${RED}(EVM WRITE — BROADCAST)${NC}"
echo -e "  Trigger:  Cron (every 30 min)"
echo -e "  Action:   Fetch ETH/USD → calculate prices → write to PricingOracle"
echo -e "  Contract: PricingOracle"
echo -e "  ${YELLOW}This will submit a REAL transaction to Arc Testnet${NC}"
echo -e "${CYAN}───────────────────────────────────────────────────────────${NC}"
echo ""
cre workflow simulate dynamic-pricing --target staging-settings --broadcast
echo ""

# ─── Workflow 3: Settlement Monitor ───
echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}  3/3  Settlement Monitor ${YELLOW}(LOG TRIGGER — Interactive)${NC}"
echo -e "  Trigger:  EVM Log (PaymentThresholdReached event)"
echo -e "  Action:   Read batch stats on-chain → notify backend"
echo -e "  Contract: PaymentAccumulator"
echo -e ""
echo -e "  ${YELLOW}Use this tx hash when prompted:${NC}"
echo -e "  ${GREEN}0x3df46a6d0c4f6a4327fb1669def606fb0a2a48315923d6700691a8627a05e88d${NC}"
echo -e "  ${YELLOW}Event index: 1${NC}"
echo -e "${CYAN}───────────────────────────────────────────────────────────${NC}"
echo ""
cre workflow simulate settlement-monitor --target staging-settings
echo ""

# ─── Summary ───
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  All 3 CRE workflows executed successfully${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Verify on ArcScan: ${CYAN}https://testnet.arcscan.app${NC}"
echo -e "  Dashboard:         ${CYAN}https://flowbroker-app.netlify.app${NC}"
echo ""
