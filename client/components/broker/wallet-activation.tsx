"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { USDC_ADDRESS, PLATFORM_ADDRESS, arcTestnet } from "@/lib/web3";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";

const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

interface Props {
  brokerName: string;
  depositAmount: string;
}

export function WalletActivation({ brokerName, depositAmount }: Props) {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "paying" | "done">("idle");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleActivate = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setStep("paying");

    const amount = parseUnits(depositAmount, 6); // USDC 6 decimals
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "transfer",
      args: [PLATFORM_ADDRESS, amount],
      chainId: arcTestnet.id,
    });
  };

  if (isSuccess || step === "done") {
    setTimeout(() => router.push("/dashboard"), 2000);
    return (
      <div className="w-full h-14 flex items-center justify-center gap-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Activated! Launching dashboard...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">Connect your wallet on Arc Testnet to activate</p>
        <div className="flex justify-center">
          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Connected: {address?.slice(0, 8)}...{address?.slice(-4)}</span>
        <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
      </div>
      <Button
        onClick={handleActivate}
        disabled={!depositAmount || Number(depositAmount) <= 0 || isPending || isConfirming}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-lg"
      >
        {isPending || isConfirming ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isConfirming ? "Confirming..." : "Confirm in wallet..."}</>
        ) : (
          <><span>Pay ${depositAmount} USDC & Activate {brokerName}</span><ArrowRight className="w-5 h-5 ml-2" /></>
        )}
      </Button>
      {txHash && (
        <p className="text-xs text-muted-foreground text-center font-mono">
          tx: <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{txHash.slice(0, 20)}...</a>
        </p>
      )}
    </div>
  );
}
