"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BROKERS, PROVIDERS } from "@/lib/dashboard/agents";
import type { PaymentEvent } from "@/lib/dashboard/useWebSocket";
import { brokerLabel, providerLabel } from "@/lib/dashboard/agents";

interface FlowViewProps {
  payments: PaymentEvent[];
  isRunning: boolean;
}

export function FlowView({ payments, isRunning }: FlowViewProps) {
  const nodes: Node[] = useMemo(() => {
    const brokerNodes: Node[] = BROKERS.map((b, i) => ({
      id: `broker-${b.id}`,
      position: { x: 50, y: 20 + i * 68 },
      data: {
        label: (
          <div className="text-left">
            <div className="flex justify-between items-center">
              <span className="font-medium text-xs">{b.label}</span>
              <span className={`text-[7px] px-1 rounded ${b.profile === "Conservative" ? "bg-blue-100 text-blue-600" : b.profile === "Balanced" ? "bg-green-100 text-green-600" : b.profile === "Growth" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>{b.profile}</span>
            </div>
            <div className="text-[10px] text-gray-400">{b.cost} · {b.desc}</div>
          </div>
        ),
      },
      sourcePosition: Position.Right,
      style: {
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 11,
        width: 200,
      },
    }));

    const providerNodes: Node[] = Object.entries(PROVIDERS).map(([key, p], i) => ({
      id: `provider-${key}`,
      position: { x: 500, y: 10 + i * 58 },
      data: {
        label: (
          <div className="text-left">
            <div className="flex justify-between items-center">
              <span className="font-medium text-xs">{p.label}</span>
              <span className="text-[8px] text-green-600 font-mono ml-1">{p.price}</span>
            </div>
            <div className="text-[10px] text-gray-400">{p.type}</div>
            <div className="text-[9px] text-blue-400 font-mono">{p.ens}</div>
          </div>
        ),
      },
      targetPosition: Position.Left,
      style: {
        background: "#f0fdf4",
        border: "1px solid #86efac",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 11,
        width: 260,
      },
    }));

    return [...brokerNodes, ...providerNodes];
  }, []);

  const edges: Edge[] = useMemo(() => {
    if (!isRunning && payments.length === 0) return [];

    const edgeMap = new Map<string, { count: number; amount: string }>();

    for (const p of payments.slice(0, 50)) {
      const bName = brokerLabel(p.worker);
      const pName = providerLabel(p.service);
      const broker = BROKERS.find(b => b.label === bName);
      const provider = Object.entries(PROVIDERS).find(([, v]) => v.label === pName);
      if (!broker || !provider) continue;

      const key = `${broker.id}-${provider[0]}`;
      const existing = edgeMap.get(key);
      edgeMap.set(key, { count: (existing?.count || 0) + 1, amount: p.amount });
    }

    return Array.from(edgeMap.entries()).map(([key, val]) => {
      const [brokerId, providerId] = key.split("-");
      return {
        id: `e-${key}`,
        source: `broker-${brokerId}`,
        target: `provider-${providerId}`,
        animated: true,
        style: { stroke: "#22c55e", strokeWidth: Math.min(1 + val.count * 0.3, 3) },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e", width: 12, height: 12 },
        label: `${val.count}x`,
        labelStyle: { fontSize: 8, fill: "#9ca3af" },
      };
    });
  }, [payments, isRunning]);

  return (
    <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={0.5} color="#f1f5f9" />
      </ReactFlow>
    </div>
  );
}
