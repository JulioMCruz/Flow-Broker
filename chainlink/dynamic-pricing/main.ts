// =============================================================================
// PerkMesh — Dynamic Pricing Oracle CRE Workflow
// =============================================================================
// Trigger:  Cron (every 30 minutes)
// Action:   HTTP fetch external pricing data (CoinGecko ETH/USDC),
//           calculate fair agent prices based on compute cost index
// Output:   EVM Write to PricingOracle — batch price update via writeReport
// Bounty:   Chainlink CRE — "integrate blockchain with external API/system"
// =============================================================================

import {
  cre,
  Runner,
  getNetwork,
  type Runtime,
  bytesToHex,
  hexToBase64,
  TxStatus,
  consensusIdenticalAggregation,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";

import { encodeAbiParameters, parseAbiParameters } from "viem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgentPriceConfig = {
  id: number;
  name: string;
  basePrice: number; // USDC atomic units (6 decimals) — base cost
  costMultiplier: number; // scale factor based on compute intensity
};

type EvmConfig = {
  pricingOracleAddress: string;
  chainSelectorName: string;
  gasLimit: string;
};

type Config = {
  pricingApiUrl: string;
  agents: AgentPriceConfig[];
  evms: EvmConfig[];
};

// ---------------------------------------------------------------------------
// Price calculation
// ---------------------------------------------------------------------------

/**
 * Adjusts agent prices based on external market data.
 *
 * Strategy: fetch ETH/USD price as a proxy for network compute cost.
 * When ETH is expensive, on-chain operations cost more, so agent prices
 * scale up. Each agent has a base price and a cost multiplier reflecting
 * its compute intensity.
 *
 * Formula: finalPrice = basePrice * costMultiplier * (1 + priceAdjustment)
 *   where priceAdjustment = (ethPrice - 2000) / 20000  (clamped to +/- 50%)
 *
 * This ensures prices stay responsive to market conditions while bounded.
 */
function calculatePrices(
  agents: AgentPriceConfig[],
  ethPriceUsd: number
): bigint[] {
  // Compute a cost adjustment factor from ETH price
  // Baseline: $2000 ETH = 0% adjustment
  // $4000 ETH = +10% adjustment, $1000 ETH = -5% adjustment
  const priceAdjustment = Math.max(
    -0.5,
    Math.min(0.5, (ethPriceUsd - 2000) / 20000)
  );

  return agents.map((agent) => {
    const adjusted = Math.round(
      agent.basePrice * agent.costMultiplier * (1 + priceAdjustment)
    );
    // Ensure minimum price of 1 atomic unit
    return BigInt(Math.max(1, adjusted));
  });
}

// ---------------------------------------------------------------------------
// Pricing callback
// ---------------------------------------------------------------------------

function onPriceUpdate(runtime: Runtime<Config>): string {
  const config = runtime.config;

  // 1. HTTP: fetch current ETH/USD price from CoinGecko
  const httpClient = new cre.capabilities.HTTPClient();

  const priceData = httpClient.sendRequest(
    runtime,
    (sendRequester: HTTPSendRequester) => {
      const resp = sendRequester
        .sendRequest({
          url: `${config.pricingApiUrl}?ids=ethereum&vs_currencies=usd`,
          method: "GET",
          headers: { Accept: "application/json" },
          cacheSettings: { store: true, maxAge: "60s" },
        })
        .result();

      const bodyText = new TextDecoder().decode(resp.body);
      const parsed = JSON.parse(bodyText) as {
        ethereum: { usd: number };
      };
      return parsed.ethereum.usd;
    },
    consensusIdenticalAggregation<number>()
  )(config).result();

  runtime.log(`ETH/USD price: $${priceData}`);

  // 2. Calculate new agent prices based on market data
  const agentIds = config.agents.map((a) => BigInt(a.id));
  const newPrices = calculatePrices(config.agents, priceData);

  runtime.log(
    `Calculated prices for ${agentIds.length} agents: [${newPrices.join(", ")}]`
  );

  // 3. Encode report matching PricingOracle._processReport() format:
  //    abi.encode(uint256[] agentIds, uint256[] prices)
  const reportData = encodeAbiParameters(
    parseAbiParameters("uint256[] agentIds, uint256[] prices"),
    [agentIds, newPrices]
  );

  // 4. EVM Write: send report to PricingOracle via KeystoneForwarder
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.evms[0].chainSelectorName,
    isTestnet: true,
  });
  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: config.evms[0].pricingOracleAddress,
      report: reportResponse,
      gasConfig: { gasLimit: config.evms[0].gasLimit },
    })
    .result();

  if (writeResult.txStatus === TxStatus.SUCCESS) {
    const txHash = bytesToHex(writeResult.txHash);
    runtime.log(`PricingOracle updated — tx: ${txHash}`);
    return `prices-updated-tx-${txHash}`;
  }

  runtime.log("Failed to update PricingOracle");
  return "price-update-failed";
}

// ---------------------------------------------------------------------------
// Workflow initialization
// ---------------------------------------------------------------------------

const initWorkflow = (config: Config) => {
  const cron = new cre.capabilities.CronCapability();

  return [
    cre.handler(
      cron.trigger({ schedule: "0 */30 * * * *" }), // every 30 minutes
      onPriceUpdate
    ),
  ];
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
main();
