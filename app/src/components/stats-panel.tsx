"use client";
import type { StatsData } from "@/lib/useWebSocket";

interface StatsPanelProps {
  isRunning: boolean;
  stats?: StatsData;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const items = [
    { label: "Intel Calls", value: stats?.totalPayments.toLocaleString() || "0" },
    { label: "Volume", value: `$${stats?.totalVolume || "0"}` },
    { label: "Fees (10%)", value: `$${stats?.platformFees || "0"}` },
    { label: "Agents", value: `${stats?.activeWorkers || 0}` },
    { label: "Gas Saved", value: `$${stats?.gasSaved || "0"}` },
    { label: "Rate", value: `${stats?.paymentsPerMin || 0}/min` },
  ];

  return (
    <div className="grid grid-cols-6 gap-4">
      {items.map((s) => (
        <div key={s.label} className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
          <p className="text-2xl font-bold font-mono">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
