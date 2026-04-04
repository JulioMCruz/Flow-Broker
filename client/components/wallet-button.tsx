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
  return <Button chainStatus="icon" showBalance={false} accountStatus="avatar" />;
}
