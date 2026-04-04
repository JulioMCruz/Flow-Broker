"use client";

import { useEffect, useState } from "react";

export function AgentList() {
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();
        setPrices(data);
      } catch {}
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const agents = ["search", "llm", "sentiment", "classify", "data", "embeddings", "translate", "summarize", "vision", "code"];

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="p-3 border-b border-gray-100">
        <h3 className="font-medium text-sm">Agents</h3>
        <p className="text-xs text-gray-400 mt-0.5">Prices from ENS</p>
      </div>
      <div className="divide-y divide-gray-50">
        {agents.map((a) => (
          <div key={a} className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs font-mono">{a}</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">{prices[a] || "..."}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
