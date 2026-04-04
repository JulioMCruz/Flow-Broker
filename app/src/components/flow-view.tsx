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
import { BROKERS, PROVIDERS } from "@/lib/agents";
import type { PaymentEvent } from "@/lib/useWebSocket";
import { brokerLabel, providerLabel } from "@/lib/agents";

interface FlowViewProps {
  payments: PaymentEvent[];
  isRunning: boolean;
}

export function FlowView({ payments, isRunning }: FlowViewProps) {
  const nodes: Node[] = useMemo(() => {
    const brokerNodes: Node[] = BROKERS.map((b, i) => ({
      id: `broker-${b.id}`,
      position: { x: 50, y: 30 + i * 52 },
      data: {
        label: (
          <div className="text-left">
            <div className="font-medium text-[10px]">{b.label}</div>
            <div className="text-[8px] text-gray-400">{b.strategy} · {b.apy}</div>
          </div>
        ),
      },
      sourcePosition: Position.Right,
      style: {
        background: "#f0fdf4",
        border: "1px solid #86efac",
        borderRadius: 8,
        padding: "4px 8px",
        fontSize: 10,
        width: 160,
      },
    }));

    const providerNodes: Node[] = Object.entries(PROVIDERS).map(([key, p], i) => ({
      id: `provider-${key}`,
      position: { x: 500, y: 15 + i * 44 },
      data: {
        label: (
          <div className="text-left">
            <div className="font-medium text-[10px]">{p.label}</div>
            <div className="text-[8px] text-gray-400">{p.type}</div>
          </div>
        ),
      },
      targetPosition: Position.Left,
      style: {
        background: "#eff6ff",
        border: "1px solid #93c5fd",
        borderRadius: 8,
        padding: "4px 8px",
        fontSize: 10,
        width: 155,
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
    <div className="h-[440px] border border-gray-200 rounded-lg overflow-hidden">
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
