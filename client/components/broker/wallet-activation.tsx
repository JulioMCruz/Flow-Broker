"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { USDC_ADDRESS, PLATFORM_ADDRESS, arcTestnet } from "@/lib/web3";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";

const USDC_ABI = [{ name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }] as const;

interface Props { brokerName: string; depositAmount: string; }

export function WalletActivation({ brokerName, depositAmount }: Props) {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleActivate = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    writeContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: "transfer", args: [PLATFORM_ADDRESS, parseUnits(depositAmount, 6)], chainId: arcTestnet.id });
  };

  if ((isSuccess || done) && !done) {
    setDone(true);
    setTimeout(() => window.open("https://flowbroker-app.netlify.app", "_blank"), 1500);
  }

  if (done || isSuccess) return (
    <div className="w-full h-14 flex items-center justify-center gap-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
      <CheckCircle className="w-5 h-5" /><span className="font-medium">Activated! Opening dashboard...</span>
    </div>
  );

  if (!isConnected) return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-muted-foreground">Connect your wallet on Arc Testnet</p>
      <ConnectButton chainStatus="full" showBalance={false} />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{address?.slice(0, 8)}...{address?.slice(-4)}</span>
        <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
      </div>
      <Button onClick={handleActivate} disabled={!depositAmount || Number(depositAmount) <= 0 || isPending || isConfirming} className="w-full bg-primary text-primary-foreground h-14 text-lg">
        {isPending || isConfirming
          ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isConfirming ? "Confirming on Arc..." : "Confirm in wallet..."}</>
          : <>Pay ${depositAmount} USDC · Activate {brokerName}<ArrowRight className="w-5 h-5 ml-2" /></>
        }
      </Button>
      {txHash && <p className="text-xs text-center font-mono">tx: <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" className="text-blue-600 hover:underline">{txHash.slice(0, 20)}...</a></p>}
    </div>
  );
}
