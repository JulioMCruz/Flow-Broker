"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function ActivationsPanel() {
  const [activations, setActivations] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(api("/activations"));
        const data = await res.json();
        if (data.activations) setActivations(data.activations);
      } catch {}
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (activations.length === 0) return null;

  return (
    <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3">
      <p className="text-xs font-medium text-amber-700 mb-2">Recent Activations</p>
      <div className="space-y-1.5">
        {activations.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="font-medium text-gray-700">{a.broker}</span>
            <span className="text-gray-400 font-mono text-[10px]">{a.userAddress?.slice(0, 8)}...</span>
            <a href={a.arcScan} target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:underline font-mono text-[10px] ml-auto">
              {a.txHash?.slice(0, 12)}... →
            </a>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        These users activated brokers from flowbroker.netlify.app
      </p>
    </div>
  );
}
