"use client";

import { useAccount, useConnect } from "wagmi";
import { Button } from "@/components/ui/button";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  if (isConnected) {
    return (
      <span className="text-xs font-mono border border-primary/30 text-primary rounded-full px-3 py-1.5">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
    );
  }

  return (
    <Button
      onClick={() => connect({ connector: connectors[0] })}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      Connect Wallet
    </Button>
  );
}
