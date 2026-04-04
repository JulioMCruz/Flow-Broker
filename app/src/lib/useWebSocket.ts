"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface PaymentEvent {
  worker: string;
  service: string;
  amount: string;
  network?: string;
  verified?: boolean;
  transaction?: string;
  cycle?: number;
  timestamp: number;
}

export interface StatsData {
  totalPayments: number;
  totalVolume: string;
  paymentsPerMin: number;
  dollarsPerSec: string;
  activeWorkers: number;
  gasSaved: string;
  elapsed: number;
}

export interface WorkerEvent {
  name: string;
  address?: string;
}

export type WSEvent =
  | { type: "payment"; data: PaymentEvent }
  | { type: "stats"; data: StatsData }
  | { type: "worker_joined"; data: WorkerEvent }
  | { type: "worker_finished"; data: WorkerEvent }
  | { type: "complete"; data: StatsData };

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002";

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    totalPayments: 0,
    totalVolume: "0",
    paymentsPerMin: 0,
    dollarsPerSec: "0",
    activeWorkers: 0,
    gasSaved: "0",
    elapsed: 0,
  });
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [workers, setWorkers] = useState<Map<string, WorkerEvent>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setIsComplete(false);
      console.log("🔌 Connected to PerkMesh orchestrator");
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("🔌 Disconnected from orchestrator");
    };

    ws.onmessage = (event) => {
      const msg: WSEvent = JSON.parse(event.data);

      switch (msg.type) {
        case "payment":
          setPayments((prev) => [msg.data, ...prev].slice(0, 100)); // keep last 100
          break;
        case "stats":
          setStats(msg.data);
          break;
        case "worker_joined":
          setWorkers((prev) => new Map(prev).set(msg.data.name, msg.data));
          break;
        case "worker_finished":
          setWorkers((prev) => {
            const next = new Map(prev);
            next.delete(msg.data.name);
            return next;
          });
          break;
        case "complete":
          setStats(msg.data);
          setIsComplete(true);
          break;
      }
    };

    ws.onerror = () => {
      console.log("🔌 WebSocket error — orchestrator may not be running");
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    connected,
    stats,
    payments,
    workers,
    isComplete,
    connect,
    disconnect,
  };
}
