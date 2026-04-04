"use client";

import { useState, useEffect } from "react";

export function WalletButton() {
  const [state, setState] = useState<{ isConnected: boolean; address?: string; open?: () => void } | null>(null);

  useEffect(() => {
    import("wagmi").then(({ useAccount, useConnect }) => {
      // We need to use hooks inside a component — create inner component
    });

    // Simple approach: render a custom button that calls the global ethereum provider
    setState({ isConnected: false });
  }, []);

  if (!state) return null;

  return <ConnectWalletInner />;
}

function ConnectWalletInner() {
  const [mod, setMod] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import("wagmi"),
      import("@rainbow-me/rainbowkit"),
    ]).then(([w, r]) => setMod({ w, r }));
  }, []);

  if (!mod) return (
    <button
      style={{ backgroundColor: "#00D26A", color: "#000", borderRadius: "6px", padding: "8px 16px", fontSize: "14px", fontWeight: "500", border: "none", cursor: "pointer" }}
    >
      Connect Wallet
    </button>
  );

  return (
    <mod.r.ConnectButton.Custom>
      {({ account, openConnectModal, openAccountModal, mounted }: any) => (
        <div {...(!mounted && { style: { opacity: 0, pointerEvents: "none" } })}>
          {account ? (
            <button onClick={openAccountModal}
              style={{ backgroundColor: "#00D26A", color: "#000", borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: "500", border: "none", cursor: "pointer", fontFamily: "monospace" }}>
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </button>
          ) : (
            <button onClick={openConnectModal}
              style={{ backgroundColor: "#00D26A", color: "#000", borderRadius: "6px", padding: "8px 16px", fontSize: "14px", fontWeight: "500", border: "none", cursor: "pointer" }}>
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </mod.r.ConnectButton.Custom>
  );
}
