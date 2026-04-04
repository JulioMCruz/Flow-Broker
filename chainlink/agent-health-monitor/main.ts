// =============================================================================
// PerkMesh — Agent Health Monitor CRE Workflow
// =============================================================================
// Trigger:  Cron (every 5 minutes)
// Action:   HTTP GET each agent's /health endpoint
// Output:   Log which agents are up/down (simplified for simulation)
// Chain:    Arc Testnet (chain selector: arc-testnet)
// =============================================================================

import {
  cre,
  Runner,
  type Runtime,
  consensusIdenticalAggregation,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgentEndpoint = {
  id: number;
  name: string;
  endpoint: string;
};

type EvmConfig = {
  agentRegistryAddress: string;
  chainSelectorName: string;
  gasLimit: string;
};

type Config = {
  agents: AgentEndpoint[];
  evms: EvmConfig[];
};

// ---------------------------------------------------------------------------
// Health check callback
// ---------------------------------------------------------------------------

function onHealthCheck(runtime: Runtime<Config>): string {
  const config = runtime.config;
  const httpClient = new cre.capabilities.HTTPClient();
  const downAgents: string[] = [];
  const upAgents: string[] = [];

  // Ping each agent's health endpoint
  for (const agent of config.agents) {
    const statusCode = httpClient.sendRequest(
      runtime,
      (sendRequester: HTTPSendRequester) => {
        const resp = sendRequester
          .sendRequest({
            url: `${agent.endpoint}/health`,
            method: "GET",
            headers: {},
            cacheSettings: { store: false, maxAge: "0s" },
          })
          .result();
        return resp.statusCode;
      },
      consensusIdenticalAggregation<number>()
    )().result();

    if (statusCode === 200) {
      upAgents.push(agent.name);
    } else {
      downAgents.push(agent.name);
      runtime.log(`Agent "${agent.name}" (id=${agent.id}) is DOWN (status: ${statusCode})`);
    }
  }

  runtime.log(
    `Health check complete: ${upAgents.length} healthy, ${downAgents.length} down`
  );

  if (downAgents.length > 0) {
    runtime.log(`Down agents: ${downAgents.join(", ")}`);
  }

  return downAgents.length === 0
    ? "all-healthy"
    : `${downAgents.length}-agents-down`;
}

// ---------------------------------------------------------------------------
// Workflow initialization
// ---------------------------------------------------------------------------

const initWorkflow = (config: Config) => {
  const cron = new cre.capabilities.CronCapability();

  return [
    cre.handler(
      cron.trigger({ schedule: "0 */5 * * * *" }),
      onHealthCheck
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
