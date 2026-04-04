import { CONTRACTS, EXPLORER_URL } from "./chains";

// Re-export for convenience
export { CONTRACTS, EXPLORER_URL };

// Minimal ABIs for read operations
export const AgentRegistryABI = [
  {
    inputs: [{ name: "ensName", type: "string" }],
    name: "getAgent",
    outputs: [
      { name: "ensName", type: "string" },
      { name: "wallet", type: "address" },
      { name: "agentType", type: "uint8" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveAgents",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "agentCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const PricingOracleABI = [
  {
    inputs: [{ name: "ensName", type: "string" }],
    name: "getPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const PaymentAccumulatorABI = [
  {
    inputs: [],
    name: "totalSettled",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "batchCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CONTRACT_META: {
  name: string;
  key: keyof typeof CONTRACTS;
  desc: string;
}[] = [
  { name: "AgentRegistry", key: "agentRegistry", desc: "50 agents, CRE-compatible" },
  { name: "PaymentAccumulator", key: "paymentAccumulator", desc: "Payment tracking + CRE events" },
  { name: "PricingOracle", key: "pricingOracle", desc: "CRE dynamic pricing" },
  { name: "AgenticCommerce", key: "agenticCommerce", desc: "ERC-8183 job escrow" },
  { name: "ReputationHook", key: "reputationHook", desc: "IACPHook reputation" },
  { name: "USDC", key: "usdc", desc: "Payment token" },
];
