// PerkMesh — Arc Testnet Configuration

export const ARC_TESTNET = {
  chainId: 5042002,
  rpc: "https://rpc.testnet.arc.network",
  ws: "wss://rpc.testnet.arc.network",
  explorer: "https://testnet.arcscan.app",
  gatewayChain: "arcTestnet" as const,
};

export const CONTRACTS = {
  usdc: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" as `0x${string}`,
  agentRegistry: "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0" as `0x${string}`,
  paymentAccumulator: "0x627eE346183AB858c581A8F234ADA37579Ff1b13" as `0x${string}`,
  pricingOracle: "0xdF5e936A36A190859C799754AAC848D9f5Abf958" as `0x${string}`,
  agenticCommerce: "0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A" as `0x${string}`,
  reputationHook: "0x18d9a536932168bCd066609FB47AB5c1F55b0153" as `0x${string}`,
};

export const SELLER_PORT = 3001;
