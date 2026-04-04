"use client";

import { StatsPanel } from "@/components/stats-panel";
import { AgentList } from "@/components/agent-list";
import { PaymentFeed } from "@/components/payment-feed";
import { SettlementTracker } from "@/components/settlement-tracker";
import { ContractAddresses } from "@/components/contract-addresses";
import { useWebSocket } from "@/lib/useWebSocket";

export function Dashboard() {
  const { connected, stats, payments, isComplete, connect, disconnect } = useWebSocket();
  const isRunning = connected && !isComplete;

  const handleToggle = async () => {
    if (connected) {
      disconnect();
    } else {
      connect();
      try {
        await fetch("/api/start", { method: "POST" });
      } catch {}
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">PerkMesh</h1>
          <p className="text-sm text-gray-500 mt-1">Agent service mesh on Arc</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500" : isComplete ? "bg-amber-500" : "bg-gray-300"}`} />
            <span className="text-sm text-gray-500">
              {isRunning ? `${stats.activeWorkers} workers` : isComplete ? `${stats.totalPayments} payments done` : "idle"}
            </span>
          </div>
          <button
            onClick={handleToggle}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              connected
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {connected ? "Disconnect" : "Start Demo"}
          </button>
        </div>
      </div>

      <StatsPanel isRunning={isRunning} stats={stats} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <AgentList />
        </div>
        <div className="col-span-5">
          <PaymentFeed isRunning={isRunning} payments={payments} />
        </div>
        <div className="col-span-4">
          <SettlementTracker />
        </div>
      </div>

      <ContractAddresses />
    </div>
  );
}
