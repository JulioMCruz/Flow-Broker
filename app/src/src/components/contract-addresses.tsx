"use client";

const EXPLORER = "https://testnet.arcscan.app/address";
const contracts = [
  { name: "AgentRegistry", addr: "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0" },
  { name: "PaymentAccumulator", addr: "0x627eE346183AB858c581A8F234ADA37579Ff1b13" },
  { name: "PricingOracle", addr: "0xdF5e936A36A190859C799754AAC848D9f5Abf958" },
  { name: "AgenticCommerce", addr: "0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A" },
  { name: "ReputationHook", addr: "0x18d9a536932168bCd066609FB47AB5c1F55b0153" },
  { name: "USDC", addr: "0x3600000000000000000000000000000000000000" },
];

export function ContractAddresses() {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Deployed Contracts · Arc Testnet</p>
      <div className="grid grid-cols-3 gap-2">
        {contracts.map((c) => (
          <a key={c.name} href={`${EXPLORER}/${c.addr}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 text-xs">
            <span className="text-gray-600">{c.name}</span>
            <span className="text-blue-600 font-mono text-[10px]">{c.addr.slice(0, 6)}..{c.addr.slice(-4)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
