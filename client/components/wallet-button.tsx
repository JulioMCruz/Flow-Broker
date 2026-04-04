"use client";

import { useState, useEffect } from "react";

export function WalletButton() {
  const [Button, setButton] = useState<any>(null);

  useEffect(() => {
    import("@rainbow-me/rainbowkit").then(({ ConnectButton }) => {
      setButton(() => ConnectButton);
    });
  }, []);

  if (!Button) return null;

  return (
    <Button.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }: any) => {
        const connected = mounted && account && chain;
        return (
          <div {...(!mounted && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none", userSelect: "none" } })}>
            {connected ? (
              <button onClick={openAccountModal} className="text-xs font-mono bg-primary text-primary-foreground rounded-full px-3 py-1.5 hover:bg-primary/90 transition-colors">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </button>
            ) : (
              <button onClick={openConnectModal} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md px-4 py-2 text-sm font-medium">
                Connect Wallet
              </button>
            )}
          </div>
        );
      }}
    </Button.Custom>
  );
}
