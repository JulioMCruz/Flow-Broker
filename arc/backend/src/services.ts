// PerkMesh — 10 Agent Services Configuration
// 2 sellers (search + llm) + 8 buyers

export interface ServiceConfig {
  name: string;
  ensName: string;
  endpoint: string;
  price: string;
  priceUsd: number;
  method: "GET" | "POST";
}

export const SERVICES: ServiceConfig[] = [
  {
    name: "search",
    ensName: "search.perkmesh.eth",
    endpoint: "/api/search",
    price: "$0.001",
    priceUsd: 0.001,
    method: "GET",
  },
  {
    name: "llm",
    ensName: "llm.perkmesh.eth",
    endpoint: "/api/llm",
    price: "$0.015",
    priceUsd: 0.015,
    method: "POST",
  },
];

export const NUM_WORKERS = 8;
export const WORKER_DEPOSIT = "0.50"; // $0.50 USDC each
export const CYCLES_PER_WORKER = 10;
