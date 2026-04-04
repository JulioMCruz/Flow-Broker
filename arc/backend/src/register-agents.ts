// Register all 10 agents in AgentRegistry contract on Arc Testnet
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ARC_RPC = "https://rpc.testnet.arc.network";
const REGISTRY = "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0" as `0x${string}`;

const chain = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [ARC_RPC] } },
} as const;

const ABI = [
  {
    name: "registerBatchAgents",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{
      name: "paramsList",
      type: "tuple[]",
      components: [
        { name: "wallet", type: "address" },
        { name: "name", type: "string" },
        { name: "ensName", type: "string" },
        { name: "endpoint", type: "string" },
        { name: "price", type: "uint256" },
        { name: "paymentModel", type: "uint8" },
        { name: "capabilities", type: "string" },
      ],
    }],
    outputs: [],
  },
  { name: "agentCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

const agents = [
  { name: "search", price: 1000n, model: 0, caps: "web-search" },
  { name: "llm", price: 15000n, model: 0, caps: "text-generation" },
  { name: "sentiment", price: 300n, model: 0, caps: "sentiment-analysis" },
  { name: "classify", price: 400n, model: 0, caps: "text-classification" },
  { name: "data", price: 1000n, model: 0, caps: "structured-data" },
  { name: "embeddings", price: 500n, model: 0, caps: "vector-embeddings" },
  { name: "translate", price: 5000n, model: 0, caps: "translation" },
  { name: "summarize", price: 15000n, model: 0, caps: "summarization" },
  { name: "vision", price: 30000n, model: 0, caps: "image-analysis" },
  { name: "code", price: 30000n, model: 0, caps: "code-generation" },
];

async function main() {
  const key = process.env.PRIVATE_KEY as `0x${string}`;
  if (!key) { console.error("PRIVATE_KEY not set"); return; }

  const account = privateKeyToAccount(key);
  const publicClient = createPublicClient({ chain, transport: http(ARC_RPC) });
  const wallet = createWalletClient({ chain, transport: http(ARC_RPC), account });

  const count = await publicClient.readContract({ address: REGISTRY, abi: ABI, functionName: "agentCount" });
  console.log(`Current agents: ${count}`);

  if (Number(count) >= 10) {
    console.log("Agents already registered");
    return;
  }

  const batchParams = agents.map(a => ({
    wallet: account.address,
    name: a.name,
    ensName: `${a.name}.flowbroker.eth`,
    endpoint: `https://api.perkmesh.perkos.xyz/api/${a.name}`,
    price: a.price,
    paymentModel: a.model,
    capabilities: a.caps,
  }));

  console.log("Registering 10 agents in batch...");
  const hash = await wallet.writeContract({
    address: REGISTRY,
    abi: ABI,
    functionName: "registerBatchAgents",
    args: [batchParams],
  });
  console.log(`  tx: ${hash}`);
  console.log("All agents registered on-chain");
}

main().catch(console.error);
