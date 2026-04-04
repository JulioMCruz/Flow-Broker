"use client";

import { useState } from "react";
import type { PaymentEvent } from "@/lib/useWebSocket";

interface PaymentFeedProps {
  isRunning: boolean;
  payments?: PaymentEvent[];
}

const EXPLORER = "https://testnet.arcscan.app/address";

const WORKER_NAMES: Record<string, string> = {
  "0xea108a5074772f700dc84c76f180b11285be6d8d": "worker-01",
  "0x225f28e9c6d4e9a2db8e2b007bec91716e331efb": "worker-02",
  "0xbe3359304457a8c0c443ad412e65f7d4aadc405e": "worker-03",
  "0x1ee2cfc2b77d388b451f7dd74982391e0bb3bad5": "worker-04",
  "0xa9624b279640f36adcad3845447d40bbe6eb7e5b": "worker-05",
  "0x92cd4862e054e3f426818d1883b92a9321ae6ba5": "worker-06",
  "0x5c10adf159d45d1a3874882d36cdaca722c000c9": "worker-07",
  "0x3004b4add68c3753ecd5f18edd93ee999ffaff3e": "worker-08",
};

function getWorkerName(addr: string) {
  return WORKER_NAMES[addr.toLowerCase()] || addr.slice(0, 8);
}

export function PaymentFeed({ isRunning, payments = [] }: PaymentFeedProps) {
  const [selected, setSelected] = useState<PaymentEvent | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? payments.filter(p =>
        getWorkerName(p.worker).includes(filter.toLowerCase()) ||
        p.service.includes(filter.toLowerCase()) ||
        p.worker.toLowerCase().includes(filter.toLowerCase())
      )
    : payments;

  return (
    <div className="border border-gray-200 rounded-lg h-[420px] flex flex-col">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <h3 className="font-medium text-sm">Payments</h3>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="filter by worker or service"
          className="flex-1 max-w-[200px] border border-gray-200 rounded px-2 py-1 text-xs"
        />
        <span className="text-xs text-gray-400">{filtered.length}</span>
      </div>

      {selected ? (
        <div className="flex-1 p-4 space-y-3 text-xs overflow-y-auto">
          <button onClick={() => setSelected(null)} className="text-blue-600 hover:underline">← back</button>
          <h4 className="font-medium">Payment Details</h4>
          <div className="space-y-2 bg-gray-50 rounded-lg p-3 font-mono">
            <div className="flex justify-between"><span className="text-gray-400">worker</span><span className="font-semibold">{getWorkerName(selected.worker)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">service</span><span>{selected.service}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">amount</span><span>{selected.amount}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">network</span><span>{selected.network || "eip155:5042002"}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">verified</span><span className="text-green-600">{String(selected.verified ?? true)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">scheme</span><span>GatewayWalletBatched</span></div>
            <div className="flex justify-between"><span className="text-gray-400">protocol</span><span>x402</span></div>
            <div>
              <span className="text-gray-400">address</span>
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
              {isRunning ? "Waiting..." : filter ? "No matches" : "Click Start Demo"}
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
                  <span className="text-gray-700 w-16 font-medium">{getWorkerName(p.worker)}</span>
                  <a href={`${EXPLORER}/${p.worker}`} target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600 w-16 truncate text-[10px]" onClick={(e) => e.stopPropagation()}>
                    {p.worker.slice(0, 6)}..{p.worker.slice(-3)}
                  </a>
                  <span className="text-gray-300">→</span>
                  <span className="text-gray-600 w-14">{p.service}</span>
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
