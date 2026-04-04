"use client";

import { useAccount, useConnect } from "wagmi";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const green = { backgroundColor: "#00D26A", color: "#000", borderRadius: "6px", padding: "8px 16px", fontSize: "14px", fontWeight: "500" as const, border: "none", cursor: "pointer" as const };
  const greenPill = { backgroundColor: "#00D26A", color: "#000", borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: "500" as const, border: "none", cursor: "pointer" as const, fontFamily: "monospace" };

  if (isConnected && address) {
    return <button style={greenPill}>{address.slice(0, 6)}...{address.slice(-4)}</button>;
  }

  return (
    <button onClick={() => connect({ connector: connectors[0] })} style={green}>
      Connect Wallet
    </button>
  );
}
