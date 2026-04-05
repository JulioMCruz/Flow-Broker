"use client";

import { useEffect, useRef, useState } from "react";

// Animated number that counts up smoothly
function AnimatedNumber({ value, decimals = 0, prefix = "" }: { value: number; decimals?: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;

    const duration = 400;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prev.current = to;
  }, [value]);

  return <>{prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}</>;
}

interface LiveTickerProps {
  totalPayments: number;
  totalVolume: string;
  gasSaved: string;
  paymentsPerMin: number;
  activeWorkers: number;
  totalTrades: number;
  isRunning: boolean;
}

export function LiveTicker({ totalPayments, totalVolume, gasSaved, paymentsPerMin, activeWorkers, totalTrades, isRunning }: LiveTickerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isRunning && totalPayments === 0) return null;

  const vol = parseFloat(totalVolume) || 0;
  const gas = parseFloat(gasSaved) || 0;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="relative overflow-hidden bg-gray-900 rounded-xl px-6 py-4">
      {/* Animated background pulse */}
      {isRunning && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 animate-pulse" />
        </div>
      )}

      <div className="relative flex items-center justify-between">
        {/* Left: Main counter */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">x402 Nanopayments</p>
            <p className="text-4xl font-bold font-mono text-white tracking-tight">
              <AnimatedNumber value={totalPayments} />
            </p>
          </div>
          <div className="h-10 w-px bg-gray-700" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Volume</p>
            <p className="text-2xl font-bold font-mono text-blue-400">
              $<AnimatedNumber value={vol} decimals={4} />
            </p>
          </div>
          <div className="h-10 w-px bg-gray-700" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gas Saved</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              $<AnimatedNumber value={gas} decimals={2} />
            </p>
          </div>
        </div>

        {/* Right: Rate + status */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Trades</p>
            <p className="text-2xl font-bold font-mono text-orange-400">
              <AnimatedNumber value={totalTrades} />
            </p>
          </div>
          <div className="h-10 w-px bg-gray-700" />
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rate</p>
            <p className="text-2xl font-bold font-mono text-purple-400">
              <AnimatedNumber value={paymentsPerMin} /><span className="text-sm text-gray-500">/min</span>
            </p>
          </div>
          <div className="h-10 w-px bg-gray-700" />
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              {isRunning && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                {isRunning ? "Live" : "Completed"}
              </p>
            </div>
            <p className="text-lg font-mono text-gray-400">
              {mins > 0 ? `${mins}m ` : ""}{secs}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
