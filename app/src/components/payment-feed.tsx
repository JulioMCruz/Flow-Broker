"use client";

import { useState } from "react";
import type { PaymentEvent } from "@/lib/useWebSocket";
import { providerLabel, brokerLabel } from "@/lib/agents";

interface PaymentFeedProps {
  isRunning: boolean;
  payments?: PaymentEvent[];
}

const EXPLORER = "https://testnet.arcscan.app/address";

export function PaymentFeed({ isRunning, payments = [] }: PaymentFeedProps) {
  const [selected, setSelected] = useState<PaymentEvent | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? payments.filter(p =>
        brokerLabel(p.worker).toLowerCase().includes(filter.toLowerCase()) ||
        providerLabel(p.service).toLowerCase().includes(filter.toLowerCase()) ||
        p.worker.toLowerCase().includes(filter.toLowerCase())
      )
    : payments;

  return (
    <div className="border border-gray-200 rounded-lg h-[580px] flex flex-col">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <h3 className="font-medium text-sm">Intelligence Calls</h3>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="filter broker or provider"
          className="flex-1 max-w-[200px] border border-gray-200 rounded px-2 py-1 text-xs"
        />
        <span className="text-xs text-gray-400">{filtered.length}</span>
      </div>

      {selected ? (
        <div className="flex-1 p-4 space-y-3 text-xs overflow-y-auto">
          <button onClick={() => setSelected(null)} className="text-blue-600 hover:underline">← back</button>
          <h4 className="font-medium">Call Details</h4>
          <div className="space-y-2 bg-gray-50 rounded-lg p-3 font-mono">
            <div className="flex justify-between"><span className="text-gray-400">broker</span><span className="font-semibold">{brokerLabel(selected.worker)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">provider</span><span>{providerLabel(selected.service)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">cost</span><span>{selected.amount}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">network</span><span>{selected.network || "eip155:5042002"}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">verified</span><span className="text-green-600">{String(selected.verified ?? true)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">scheme</span><span>GatewayWalletBatched</span></div>
            <div className="flex justify-between"><span className="text-gray-400">protocol</span><span>x402</span></div>
            <div>
              <span className="text-gray-400">wallet</span>
              <a href={`${EXPLORER}/${selected.worker}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block truncate">{selected.worker}</a>
            </div>
            {selected.transaction && (
              <div>
                <span className="text-gray-400">gateway ref</span>
                <span className="block truncate text-gray-600">{selected.transaction}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              {isRunning ? "Waiting..." : filter ? "No matches" : "Click Start Broker"}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((p, i) => (
                <div
                  key={`${p.timestamp}-${i}`}
                  onClick={() => setSelected(p)}
                  className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 cursor-pointer font-mono text-xs"
                >
                  <span className="text-gray-300 w-14">{new Date(p.timestamp).toLocaleTimeString()}</span>
                  <span className="text-gray-700 w-20 font-medium truncate">{brokerLabel(p.worker)}</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-gray-600 w-20 truncate">{providerLabel(p.service)}</span>
                  <span className="text-green-500 text-[10px]">✓</span>
                  <span className="text-gray-500 ml-auto">{p.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
