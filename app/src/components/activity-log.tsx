"use client";

import { useEffect, useRef, useState } from "react";
import { EXPLORER_URL } from "@/lib/chains";

export interface LogEntry {
  id: string;
  timestamp: number;
  type:
    | "payment"
    | "batch-settled"
    | "job-created"
    | "job-funded"
    | "job-submitted"
    | "job-completed"
    | "job-rejected"
    | "agent-status"
    | "cre-health"
    | "cre-pricing"
    | "ens-update";
  message: string;
  txHash?: string;
  links?: { label: string; url: string }[];
}

// Seed entries shown before WebSocket connects
const seedLog: LogEntry[] = [
  {
    id: "seed-1",
    timestamp: Date.now() - 1000,
    type: "payment",
    message: "worker-07 → llm.flowbroker.eth | $0.0142 USDC (142 tokens, streaming)",
    txHash: "0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
  },
  {
    id: "seed-2",
    timestamp: Date.now() - 3000,
    type: "batch-settled",
    message: "Batch #3 settled: 1,247 payments → $6.23 USDC in 1 tx | Gas saved: $374",
    txHash: "0xdef0123456789abcdef0123456789abcdef01234",
  },
  {
    id: "seed-3",
    timestamp: Date.now() - 8000,
    type: "job-completed",
    message: "Job #41 completed: CRE evaluator verified ✓ | $0.015 USDC released to llm.flowbroker.eth",
    txHash: "0xfedcba9876543210fedcba9876543210fedcba98",
  },
];

const typeStyles: Record<string, { icon: string; color: string }> = {
  payment: { icon: "💸", color: "text-green-400" },
  "batch-settled": { icon: "📦", color: "text-blue-400" },
  "job-created": { icon: "📋", color: "text-yellow-400" },
  "job-funded": { icon: "🔒", color: "text-yellow-400" },
  "job-submitted": { icon: "📤", color: "text-orange-400" },
  "job-completed": { icon: "✅", color: "text-green-400" },
  "job-rejected": { icon: "❌", color: "text-red-400" },
  "agent-status": { icon: "🤖", color: "text-purple-400" },
  "cre-health": { icon: "⛓️", color: "text-cyan-400" },
  "cre-pricing": { icon: "💰", color: "text-cyan-400" },
  "ens-update": { icon: "🔗", color: "text-indigo-400" },
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

const MAX_ENTRIES = 100;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";

export function ActivityLog() {
  const [entries, setEntries] = useState<LogEntry[]>(seedLog);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!WS_URL) return;

    let cancelled = false;

    function connect() {
      if (cancelled) return;
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => {
          setConnected(false);
          if (!cancelled) {
            reconnectTimer.current = setTimeout(connect, 3000);
          }
        };
        ws.onerror = () => ws.close();

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            // Accept both raw LogEntry and wrapped { type: "activity", payload }
            const entry: LogEntry | undefined =
              msg.type && msg.message
                ? (msg as LogEntry)
                : msg.payload
                  ? (msg.payload as LogEntry)
                  : undefined;
            if (!entry) return;
            if (!entry.id) entry.id = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            if (!entry.timestamp) entry.timestamp = Date.now();

            setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
          } catch {
            // ignore non-JSON messages
          }
        };
      } catch {
        if (!cancelled) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">📜 Activity Log</h2>
          <p className="text-xs text-muted-foreground">
            Every action is on-chain and verifiable — click any tx to verify on ArcScan
          </p>
        </div>
        <div className="flex gap-1">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              connected ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {connected ? "live" : WS_URL ? "reconnecting…" : "demo"}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border max-h-[350px] overflow-y-auto font-mono text-xs">
        {entries.map((entry) => {
          const style = typeStyles[entry.type] || { icon: "•", color: "text-muted-foreground" };
          return (
            <div key={entry.id} className="px-4 py-2 hover:bg-muted/20">
              <div className="flex items-start gap-2">
                <span className="text-sm shrink-0">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(entry.timestamp)}
                    </span>
                    <span className={`text-[10px] px-1 py-0.5 rounded ${style.color} bg-current/10`}>
                      {entry.type}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 text-foreground/90 break-words">{entry.message}</p>
                  {entry.txHash && (
                    <a
                      href={`${EXPLORER_URL}/tx/${entry.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline mt-0.5 inline-flex items-center gap-1"
                    >
                      🔗 {truncateHash(entry.txHash)}
                      <span className="text-[8px]">↗</span>
                    </a>
                  )}
                  {entry.links && (
                    <div className="flex gap-2 mt-0.5">
                      {entry.links.map((link) => (
                        <a
                          key={link.label}
                          href={`${EXPLORER_URL}${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-muted-foreground hover:text-blue-400 hover:underline"
                        >
                          [{link.label}] ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
