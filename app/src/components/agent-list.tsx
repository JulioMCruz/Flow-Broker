"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BROKERS, PROVIDERS } from "@/lib/agents";

export function AgentList() {
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try { setPrices(await (await fetch(api("/prices"))).json()); } catch {}
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="p-3 border-b border-gray-100">
        <h3 className="font-medium text-sm">Brokers</h3>
        <p className="text-xs text-gray-400 mt-0.5">Strategy agents</p>
      </div>
      <div className="divide-y divide-gray-50">
        {BROKERS.map((b) => (
          <div key={b.id} className="px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${b.id === "risk-manager" ? "bg-amber-400" : "bg-green-400"}`} />
              <div>
                <span className="text-xs font-medium">{b.label}</span>
                {b.id === "risk-manager" && <span className="text-[9px] text-amber-600 ml-1">validates all</span>}
              </div>
            </div>
            <span className="text-[10px] text-gray-400">{b.providers.length} calls</span>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-100 border-b border-gray-100">
        <h3 className="font-medium text-sm">Providers</h3>
        <p className="text-xs text-gray-400 mt-0.5">Intelligence services via ENS</p>
      </div>
      <div className="divide-y divide-gray-50">
        {Object.entries(PROVIDERS).map(([key, p]) => (
          <div key={key} className="px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-xs">{p.label}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">{prices[key] || "..."}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
