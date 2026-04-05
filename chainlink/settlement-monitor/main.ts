// =============================================================================
// PerkMesh — Settlement Monitor CRE Workflow
// =============================================================================
// Trigger:  EVM Log — PaymentThresholdReached event from PaymentAccumulator
// Action:   Read batch stats on-chain, notify backend to record settlement
// Output:   HTTP POST to PerkMesh backend /settle endpoint
// =============================================================================

import {
  cre,
  Runner,
  getNetwork,
  type Runtime,
  type EVMLog,
  bytesToHex,
  encodeCallMsg,
  consensusIdenticalAggregation,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";

import {
  keccak256,
  toHex,
  decodeEventLog,
  encodeFunctionData,
  decodeFunctionResult,
  parseAbi,
  zeroAddress,
} from "viem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EvmConfig = {
  paymentAccumulatorAddress: string;
  chainSelectorName: string;
  gasLimit: string;
};

type Config = {
  backendUrl: string;
  evms: EvmConfig[];
};

// ---------------------------------------------------------------------------
// ABI fragments
// ---------------------------------------------------------------------------

const PAYMENT_THRESHOLD_EVENT_ABI = parseAbi([
  "event PaymentThresholdReached(uint256 indexed batchId, uint256 count, uint256 totalAmount)",
]);

const GET_BATCH_STATS_ABI = parseAbi([
  "function getCurrentBatchStats() view returns (uint256 batchId, uint256 count, uint256 amount, uint256 threshold_)",
]);

// ---------------------------------------------------------------------------
// Event signature for EVM Log Trigger
// ---------------------------------------------------------------------------

const PAYMENT_THRESHOLD_EVENT_HASH = keccak256(
  toHex("PaymentThresholdReached(uint256,uint256,uint256)")
);

// ---------------------------------------------------------------------------
// Settlement callback — triggered by PaymentThresholdReached event
// ---------------------------------------------------------------------------

function onPaymentThreshold(runtime: Runtime<Config>, log: EVMLog): string {
  const config = runtime.config;

  // 1. Decode the PaymentThresholdReached event
  const topics = log.topics.map((t: Uint8Array) => bytesToHex(t)) as [
    `0x${string}`,
    ...`0x${string}`[],
  ];
  const data = bytesToHex(log.data);

  const decoded = decodeEventLog({
    abi: PAYMENT_THRESHOLD_EVENT_ABI,
    data,
    topics,
  });

  const batchId = decoded.args.batchId;
  const count = decoded.args.count;
  const totalAmount = decoded.args.totalAmount;

  runtime.log(
    `PaymentThresholdReached — batch=${batchId}, count=${count}, amount=${totalAmount}`
  );

  // 2. EVM Read: confirm batch stats from PaymentAccumulator
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.evms[0].chainSelectorName,
    isTestnet: true,
  });
  const evmClient = new cre.capabilities.EVMClient(
    network!.chainSelector.selector
  );

  const callData = encodeFunctionData({
    abi: GET_BATCH_STATS_ABI,
    functionName: "getCurrentBatchStats",
  });

  const readResult = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: config.evms[0].paymentAccumulatorAddress as `0x${string}`,
        data: callData,
      }),
    })
    .result();

  const batchStats = decodeFunctionResult({
    abi: GET_BATCH_STATS_ABI,
    functionName: "getCurrentBatchStats",
    data: bytesToHex(readResult.data),
  });

  runtime.log(
    `Confirmed batch stats — id=${batchStats[0]}, count=${batchStats[1]}, amount=${batchStats[2]}, threshold=${batchStats[3]}`
  );

  // 3. HTTP POST: notify backend to record settlement
  const httpClient = new cre.capabilities.HTTPClient();

  const backendResponse = httpClient.sendRequest(
    runtime,
    (sendRequester: HTTPSendRequester) => {
      const payload = JSON.stringify({
        batchId: batchId.toString(),
        paymentCount: count.toString(),
        totalAmount: totalAmount.toString(),
        confirmedOnChain: true,
        batchStats: {
          id: batchStats[0].toString(),
          count: batchStats[1].toString(),
          amount: batchStats[2].toString(),
          threshold: batchStats[3].toString(),
        },
      });

      const resp = sendRequester
        .sendRequest({
          url: `${config.backendUrl}/settle`,
          method: "POST",
          body: Buffer.from(payload).toString("base64"),
          headers: {
            "Content-Type": "application/json",
          },
          cacheSettings: { store: false, maxAge: "0s" },
        })
        .result();

      const bodyText = new TextDecoder().decode(resp.body);
      return { statusCode: resp.statusCode, body: bodyText };
    },
    consensusIdenticalAggregation<{ statusCode: number; body: string }>()
  )().result();

  runtime.log(
    `Backend settlement response: status=${backendResponse.statusCode}`
  );

  return `batch-${batchId}-settlement-recorded`;
}

// ---------------------------------------------------------------------------
// Workflow initialization
// ---------------------------------------------------------------------------

const initWorkflow = (config: Config) => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.evms[0].chainSelectorName,
    isTestnet: true,
  });
  const evmClient = new cre.capabilities.EVMClient(
    network!.chainSelector.selector
  );

  return [
    cre.handler(
      evmClient.logTrigger({
        addresses: [config.evms[0].paymentAccumulatorAddress],
        topics: [{ values: [PAYMENT_THRESHOLD_EVENT_HASH] }],
        confidence: "CONFIDENCE_LEVEL_FINALIZED",
      }),
      onPaymentThreshold
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
