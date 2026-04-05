"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BROKERS, PROVIDERS } from "@/lib/agents";
import type { PaymentEvent } from "@/lib/useWebSocket";
import { brokerLabel, providerLabel } from "@/lib/agents";

interface PriceUpdate {
  agent: string;
  value: string;
  tx: string;
  timestamp: number;
}

interface FlowViewProps {
  payments: PaymentEvent[];
  isRunning: boolean;
  priceUpdates?: PriceUpdate[];
}

const profileColor: Record<string, { bg: string; border: string; badge: string }> = {
  Conservative: { bg: "#eff6ff", border: "#93c5fd", badge: "bg-blue-500 text-white" },
  Balanced: { bg: "#f0fdf4", border: "#86efac", badge: "bg-green-500 text-white" },
  Growth: { bg: "#fefce8", border: "#fde047", badge: "bg-amber-500 text-white" },
  Alpha: { bg: "#fef2f2", border: "#fca5a5", badge: "bg-red-500 text-white" },
};

function parseAmount(amount: string): number {
  const n = parseFloat(amount.replace("$", ""));
  return isNaN(n) ? 0 : n;
}

export function FlowView({ payments, isRunning, priceUpdates = [] }: FlowViewProps) {
  // Track which providers had recent price updates (last 15 seconds)
  const recentPriceChanges = useMemo(() => {
    const now = Date.now();
    const recent = new Set<string>();
    for (const pu of priceUpdates) {
      if (now - pu.timestamp < 15000) {
        // Extract agent name from "search.flowbroker.eth" or just "search"
        const name = pu.agent.replace(".flowbroker.eth", "");
        recent.add(name);
      }
    }
    return recent;
  }, [priceUpdates]);
  // Calculate earnings per provider and spending per broker
  const { providerEarnings, brokerSpending } = useMemo(() => {
    const pe: Record<string, number> = {};
    const bs: Record<string, number> = {};
    for (const p of payments) {
      const amt = parseAmount(p.amount);
      // Provider earnings
      pe[p.service] = (pe[p.service] || 0) + amt;
      // Broker spending
      const bName = brokerLabel(p.worker);
      bs[bName] = (bs[bName] || 0) + amt;
    }
    return { providerEarnings: pe, brokerSpending: bs };
  }, [payments]);

  const nodes: Node[] = useMemo(() => {
    const brokerNodes: Node[] = BROKERS.map((b, i) => {
      const colors = profileColor[b.profile] || profileColor.Balanced;
      const spent = brokerSpending[b.label] || 0;
      return {
        id: `broker-${b.id}`,
        position: { x: 0, y: i * 78 },
        data: {
          label: (
            <div className="text-left w-full">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-[15px] text-gray-800">{b.label}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>{b.profile}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[12px] text-gray-500">{b.cost} · {b.desc}</span>
                {spent > 0 && <span className="text-[11px] text-red-500 font-mono font-semibold">-${spent.toFixed(6)}</span>}
              </div>
            </div>
          ),
        },
        sourcePosition: Position.Right,
        style: {
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 11,
          width: 240,
        },
      };
    });

    const providerNodes: Node[] = Object.entries(PROVIDERS).map(([key, p], i) => {
      const earned = providerEarnings[key] || 0;
      const hasEarnings = earned > 0;
      const hasPriceChange = recentPriceChanges.has(key);
      const priceUpdate = priceUpdates.find(pu => pu.agent.replace(".flowbroker.eth", "") === key);
      return {
        id: `provider-${key}`,
        position: { x: 560, y: i * 78 },
        data: {
          label: (
            <div className="text-left w-full">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[15px] text-gray-800">{p.label}</span>
                <span className={`text-[12px] font-mono font-semibold ${hasPriceChange ? "text-purple-600" : "text-emerald-600"}`}>
                  {hasPriceChange && priceUpdate ? `$${priceUpdate.value}` : p.price}
                </span>
              </div>
              {hasPriceChange && (
                <div className="text-[9px] text-purple-500 font-semibold animate-pulse">CRE price update</div>
              )}
              <div className="text-[12px] text-gray-400 mt-0.5">{p.type}</div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-[11px] text-blue-400 font-mono">{p.ens}</span>
                {hasEarnings && (
                  <span className="text-[12px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 rounded">
                    +${earned.toFixed(6)}
                  </span>
                )}
              </div>
            </div>
          ),
        },
        targetPosition: Position.Left,
        style: {
          background: hasPriceChange ? "#faf5ff" : hasEarnings ? "#f0fdf4" : "#f8fafc",
          border: hasPriceChange ? "2px solid #a855f7" : hasEarnings ? "1.5px solid #86efac" : "1.5px solid #cbd5e1",
          boxShadow: hasPriceChange ? "0 0 12px rgba(168, 85, 247, 0.3)" : "none",
          transition: "all 0.5s ease",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 11,
          width: 300,
        },
      };
    });

    return [...brokerNodes, ...providerNodes];
  }, [providerEarnings, brokerSpending, recentPriceChanges, priceUpdates]);

  const edges: Edge[] = useMemo(() => {
    if (!isRunning && payments.length === 0) return [];

    const edgeMap = new Map<string, number>();

    for (const p of payments) {
      const bName = brokerLabel(p.worker);
      const pName = providerLabel(p.service);
      const broker = BROKERS.find(b => b.label === bName);
      const provider = Object.entries(PROVIDERS).find(([, v]) => v.label === pName);
      if (!broker || !provider) continue;

      const key = `${broker.id}-${provider[0]}`;
      edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
    }

    return Array.from(edgeMap.entries()).map(([key, count]) => {
      const [brokerId, providerId] = key.split("-");
      const width = Math.min(1 + count * 0.15, 4);
      return {
        id: `e-${key}`,
        source: `broker-${brokerId}`,
        target: `provider-${providerId}`,
        animated: true,
        style: { stroke: "#22c55e", strokeWidth: width, opacity: Math.min(0.4 + count * 0.05, 1) },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e", width: 10, height: 10 },
        label: count > 1 ? `${count}` : undefined,
        labelStyle: { fontSize: 9, fill: "#6b7280", fontWeight: 600 },
        labelBgStyle: { fill: "#f9fafb", stroke: "#e5e7eb", strokeWidth: 0.5 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      };
    });
  }, [payments, isRunning]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ height: "100%", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.4}
        maxZoom={1.5}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={0.5} color="#f1f5f9" />
      </ReactFlow>
    </div>
  );
}
