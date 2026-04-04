// Broker agents (buyers) — each has a strategy and specific providers it calls
export const BROKERS = [
  { id: "momentum", label: "Momentum", providers: ["search", "sentiment"], apy: "12.4%", risk: "7/10", strategy: "Trend Following", freq: "Hourly", rep: 4 },
  { id: "news-reaction", label: "News Reaction", providers: ["search", "sentiment", "summarize"], apy: "8.7%", risk: "6/10", strategy: "Event Driven", freq: "Real-time", rep: 3 },
  { id: "execution", label: "Execution", providers: ["search"], apy: "6.1%", risk: "4/10", strategy: "Optimal Execution", freq: "Per-trade", rep: 5 },
  { id: "risk-manager", label: "Risk Manager", providers: ["search", "sentiment", "llm"], apy: "—", risk: "1/10", strategy: "Risk Validation", freq: "Every decision", rep: 5 },
  { id: "mean-reversion", label: "Mean Reversion", providers: ["search", "embeddings"], apy: "9.3%", risk: "5/10", strategy: "Mean Reversion", freq: "Daily", rep: 4 },
  { id: "rebalancing", label: "Rebalancing", providers: ["search", "code"], apy: "5.2%", risk: "3/10", strategy: "Portfolio Balance", freq: "Weekly", rep: 4 },
  { id: "yield-strategy", label: "Yield Strategy", providers: ["search", "classify"], apy: "4.8%", risk: "2/10", strategy: "Yield / T-Bills", freq: "Weekly", rep: 5 },
  { id: "cross-market", label: "Cross Market", providers: ["search", "sentiment", "classify"], apy: "11.6%", risk: "8/10", strategy: "Cross-Asset Arb", freq: "Hourly", rep: 3 },
];

// Provider agents (sellers) — intelligence services
export const PROVIDERS: Record<string, { label: string; type: string }> = {
  search: { label: "Market Data", type: "Price, volume, volatility" },
  llm: { label: "AI Analysis", type: "AI reasoning + recommendations" },
  sentiment: { label: "Sentiment", type: "News + social scoring" },
  classify: { label: "Classifier", type: "Event categorization" },
  data: { label: "Portfolio Data", type: "Portfolio state" },
  embeddings: { label: "Embeddings", type: "Semantic similarity" },
  translate: { label: "Translator", type: "Language normalization" },
  summarize: { label: "Summarizer", type: "Content compression" },
  vision: { label: "Chart Analyzer", type: "Visual interpretation" },
  code: { label: "Compute", type: "Calculations + scripts" },
};

export function providerLabel(name: string) {
  return PROVIDERS[name]?.label || name;
}

export function brokerLabel(addr: string) {
  const idx = WORKER_ADDRS.indexOf(addr.toLowerCase());
  return idx >= 0 && idx < BROKERS.length ? BROKERS[idx].label : addr.slice(0, 8);
}

export const WORKER_ADDRS = [
  "0xea108a5074772f700dc84c76f180b11285be6d8d",
  "0x225f28e9c6d4e9a2db8e2b007bec91716e331efb",
  "0xbe3359304457a8c0c443ad412e65f7d4aadc405e",
  "0x1ee2cfc2b77d388b451f7dd74982391e0bb3bad5",
  "0xa9624b279640f36adcad3845447d40bbe6eb7e5b",
  "0x92cd4862e054e3f426818d1883b92a9321ae6ba5",
  "0x5c10adf159d45d1a3874882d36cdaca722c000c9",
  "0x3004b4add68c3753ecd5f18edd93ee999ffaff3e",
];
