// PerkMesh — ENS Service Discovery
// Resolves agent endpoints, prices, and capabilities from ENS text records on Sepolia

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import type { ServiceConfig } from "./services.js";

const ensClient = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

export interface ENSAgentRecord {
  name: string;
  ensName: string;
  endpoint: string;
  price: string;
  priceUsd: number;
  capabilities: string;
  status: string;
}

const AGENT_NAMES = [
  "search", "llm", "sentiment", "classify", "data",
  "embeddings", "translate", "summarize", "vision", "code",
];

/**
 * Resolve a single agent's text records from ENS
 */
export async function resolveAgent(agentName: string): Promise<ENSAgentRecord | null> {
  const ensName = `${agentName}.perkmesh.eth`;

  try {
    const [endpoint, price, capabilities, status] = await Promise.all([
      ensClient.getEnsText({ name: normalize(ensName), key: "com.x402.endpoint" }),
      ensClient.getEnsText({ name: normalize(ensName), key: "com.x402.price" }),
      ensClient.getEnsText({ name: normalize(ensName), key: "com.agent.capabilities" }),
      ensClient.getEnsText({ name: normalize(ensName), key: "com.agent.status" }),
    ]);

    if (!endpoint || !price || status !== "active") {
      console.log(`  ⚠️ ${ensName}: inactive or missing records`);
      return null;
    }

    return {
      name: agentName,
      ensName,
      endpoint,
      price: `$${price}`,
      priceUsd: parseFloat(price),
      capabilities: capabilities || "",
      status: status || "unknown",
    };
  } catch (err: any) {
    console.error(`  ❌ Failed to resolve ${ensName}: ${err.message}`);
    return null;
  }
}

/**
 * Discover all active agents from ENS
 */
export async function discoverAgents(): Promise<ENSAgentRecord[]> {
  console.log("🔍 Discovering agents via ENS (perkmesh.eth)...\n");

  const results = await Promise.all(
    AGENT_NAMES.map((name) => resolveAgent(name))
  );

  const active = results.filter((r): r is ENSAgentRecord => r !== null);

  console.log(`\n✅ Discovered ${active.length}/${AGENT_NAMES.length} active agents:`);
  for (const agent of active) {
    console.log(`   ${agent.ensName} → ${agent.price} | ${agent.capabilities}`);
  }
  console.log("");

  return active;
}

/**
 * Convert ENS records to ServiceConfig format (for orchestrator compatibility)
 */
export function toServiceConfigs(agents: ENSAgentRecord[], localBaseUrl: string): ServiceConfig[] {
  return agents.map((agent) => ({
    name: agent.name,
    ensName: agent.ensName,
    endpoint: `/api/${agent.name}`, // local endpoint (ENS stores the public URL)
    price: agent.price,
    priceUsd: agent.priceUsd,
    method: ["llm", "translate", "summarize", "vision", "code"].includes(agent.name)
      ? "POST" as const
      : "GET" as const,
  }));
}
