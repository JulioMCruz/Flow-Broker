// =============================================================================
// PerkMesh — Dynamic Pricing Oracle CRE Workflow
// =============================================================================
// Trigger:  Cron (every 30 minutes)
// Action:   1. HTTP fetch ETH/USD from CoinGecko
//           2. Calculate fair agent prices based on compute cost index
//           3. EVM Write to PricingOracle on-chain (via KeystoneForwarder)
//           4. HTTP POST to backend /change-price → updates ENS text records
//              so agents read the new prices within 30s
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
  basePrice: number;
  costMultiplier: number;
};

type EvmConfig = {
  pricingOracleAddress: string;
  chainSelectorName: string;
  gasLimit: string;
};

type Config = {
  pricingApiUrl: string;
  backendUrl: string;
  agents: AgentPriceConfig[];
  evms: EvmConfig[];
};

// ---------------------------------------------------------------------------
// Price calculation
// ---------------------------------------------------------------------------

function calculatePrices(
  agents: AgentPriceConfig[],
  ethPriceUsd: number
): bigint[] {
  const priceAdjustment = Math.max(
    -0.5,
    Math.min(0.5, (ethPriceUsd - 2000) / 20000)
  );

  return agents.map((agent) => {
    const adjusted = Math.round(
      agent.basePrice * agent.costMultiplier * (1 + priceAdjustment)
    );
    return BigInt(Math.max(1, adjusted));
  });
}

// Convert atomic USDC (6 decimals) to dollar string for ENS
function atomicToUsd(atomic: bigint): string {
  const n = Number(atomic) / 1_000_000;
  return n.toFixed(6);
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
  )().result();

  runtime.log(`ETH/USD price: $${priceData}`);

  // 2. Calculate new agent prices based on market data
  const agentIds = config.agents.map((a) => BigInt(a.id));
  const newPrices = calculatePrices(config.agents, priceData);

  runtime.log(
    `Calculated prices for ${agentIds.length} agents: [${newPrices.join(", ")}]`
  );

  // 3. Encode report matching PricingOracle._processReport() format
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
    network!.chainSelector.selector
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

  if (writeResult.txStatus !== TxStatus.SUCCESS) {
    runtime.log("Failed to update PricingOracle");
    return "price-update-failed";
  }

  const txHash = bytesToHex(writeResult.txHash!);
  runtime.log(`PricingOracle updated on-chain — tx: ${txHash}`);

  // 5. HTTP POST: batch update ENS text records via backend /update-prices
  //    Closes the loop: CRE → PricingOracle (on-chain) → ENS (Sepolia) → Agents
  const priceUpdates = config.agents.map((agent, idx) => ({
    agent: agent.name,
    price: atomicToUsd(newPrices[idx]),
  }));

  const ensResult = httpClient.sendRequest(
    runtime,
    (sendRequester: HTTPSendRequester) => {
      const payload = JSON.stringify({
        prices: priceUpdates,
        ethPrice: priceData,
        txHash,
      });

      const resp = sendRequester
        .sendRequest({
          url: `${config.backendUrl}/update-prices`,
          method: "POST",
          body: Buffer.from(payload).toString("base64"),
          headers: { "Content-Type": "application/json" },
          cacheSettings: { store: false, maxAge: "0s" },
        })
        .result();

      const bodyText = new TextDecoder().decode(resp.body);
      return { statusCode: resp.statusCode, body: bodyText };
    },
    consensusIdenticalAggregation<{ statusCode: number; body: string }>()
  )().result();

  runtime.log(`ENS batch update response: status=${ensResult.statusCode}`);
  runtime.log(`Updated ${config.agents.length} agent prices via ENS`);

  return `prices-updated-tx-${txHash}`;
}

// ---------------------------------------------------------------------------
// Workflow initialization
// ---------------------------------------------------------------------------

const initWorkflow = (config: Config) => {
  const cron = new cre.capabilities.CronCapability();

  return [
    cre.handler(
      cron.trigger({ schedule: "0 */30 * * * *" }),
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
