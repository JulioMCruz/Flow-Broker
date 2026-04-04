import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "Flow Broker",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "flowbroker-demo",
  chains: [arcTestnet],
  ssr: true,
});

// Subscription prices in USDC (6 decimals)
export const SUBSCRIPTION_PRICES: Record<string, bigint> = {
  guardian: 3_000_000n,     // $3
  sentinel: 5_000_000n,     // $5
  steady: 10_000_000n,      // $10
  navigator: 15_000_000n,   // $15
  growth: 25_000_000n,      // $25
  momentum: 35_000_000n,    // $35
  apex: 50_000_000n,        // $50
  titan: 75_000_000n,       // $75
};

export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
export const PLATFORM_ADDRESS = "0x44ACAb497e28c6F700528FE7C281A4A1e557d155" as `0x${string}`;
