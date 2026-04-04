// ENS cross-chain bridge
// Resolves ENS text records from Sepolia and makes them available on Arc Testnet
// In production, this would use CCIP Read (EIP-3668) for trustless cross-chain resolution
// For demo, the backend bridges the data between chains

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { normalize } from "viem/ens";

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

export async function resolveENSOnArc(ensName: string, key: string): Promise<string | null> {
  try {
    const value = await sepoliaClient.getEnsText({
      name: normalize(ensName),
      key,
    });
    return value;
  } catch {
    return null;
  }
}

export async function bridgeENSToArc(agentNames: string[]): Promise<Record<string, Record<string, string>>> {
  const results: Record<string, Record<string, string>> = {};
  const keys = ["com.x402.endpoint", "com.x402.price", "com.agent.capabilities", "com.agent.status"];

  for (const name of agentNames) {
    const ensName = `${name}.flowbroker.eth`;
    results[name] = {};
    for (const key of keys) {
      const value = await resolveENSOnArc(ensName, key);
      if (value) results[name][key] = value;
    }
  }

  return results;
}
