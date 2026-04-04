"use client";

import { useState } from "react";
import { useWebSocket } from "@/lib/useWebSocket";
import { api } from "@/lib/api";
import { BROKERS, PROVIDERS, providerLabel, brokerLabel } from "@/lib/agents";
import { FlowView } from "@/components/flow-view";
import { BountyPanel } from "@/components/bounty-panel";

const PROFILES = [
  { id: "conservative", label: "Conservative", color: "bg-blue-500/10 text-blue-600 border-blue-300" },
  { id: "balanced", label: "Balanced", color: "bg-green-500/10 text-green-600 border-green-300" },
  { id: "alpha", label: "Alpha", color: "bg-red-500/10 text-red-600 border-red-300" },
];

export function Dashboard() {
  const { connected, stats, payments, isComplete, connect, disconnect } = useWebSocket();
  const isRunning = connected && !isComplete;
  const [txCount, setTxCount] = useState("200");
  const [profile, setProfile] = useState("balanced");
  const [tab, setTab] = useState<"flow" | "calls" | "settlement" | "cre" | "verify" | "bounty">("flow");
  const [creLogs, setCreLogs] = useState<any[]>([]);
  const [creResults, setCreResults] = useState<any[]>([]);
  const [gwStatus, setGwStatus] = useState<any>(null);

  const handleStart = async () => {
    if (connected) { disconnect(); return; }
    connect();
    try {
      await fetch(api("/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycles: Math.ceil(parseInt(txCount) / 8), profile }),
      });
    } catch {}
  };

  const TABS = [
    { id: "flow", label: "Flow" },
    { id: "calls", label: "Calls" },
    { id: "settlement", label: "Settlement" },
    { id: "cre", label: "CRE" },
    { id: "verify", label: "Verify" },
    { id: "bounty", label: "Protocols" },
  ] as const;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flow Broker</h1>
          <p className="text-sm text-gray-400">Autonomous AI Broker on Arc</p>
        </div>
        <div className="flex items-center gap-3">
          {!connected && (
            <>
              {PROFILES.map(p => (
                <button key={p.id} onClick={() => setProfile(p.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    profile === p.id ? p.color + " border-current" : "text-gray-400 border-gray-200 hover:border-gray-300"
                  }`}>
                  {p.label}
                </button>
              ))}
              <input value={txCount} onChange={e => setTxCount(e.target.value)}
                className="w-16 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-center font-mono focus:outline-none focus:ring-2 focus:ring-gray-200" />
            </>
          )}
          <button onClick={handleStart}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              connected
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}>
            {connected ? (isComplete ? "Done" : "Stop") : "Start"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { l: "CALLS", v: stats.totalPayments.toLocaleString(), color: "text-gray-900" },
          { l: "VOLUME", v: `$${stats.totalVolume}`, color: "text-blue-600" },
          { l: "FEES (10%)", v: `$${stats.platformFees || "0"}`, color: "text-amber-600" },
          { l: "BROKERS", v: String(stats.activeWorkers), color: "text-gray-900" },
          { l: "GAS SAVED", v: `$${stats.gasSaved}`, color: "text-emerald-600" },
          { l: "RATE", v: `${stats.paymentsPerMin}/min`, color: "text-purple-600" },
        ].map(s => (
          <div key={s.l} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{s.l}</p>
            <p className={`text-xl font-bold font-mono mt-1 ${s.color}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={async () => {
            setTab(t.id);
            if (t.id === "settlement") {
              try { setGwStatus(await (await fetch(api("/gateway-status"))).json()); } catch {}
            }
            if (t.id === "cre") {
              try {
                const res = await fetch(api("/cre-run"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow: "all" }) });
                const data = await res.json();
                if (data.workflows) setCreResults(data.workflows);
                const logs = await (await fetch(api("/cre-logs"))).json();
                if (logs.logs) setCreLogs(logs.logs);
              } catch {}
            }
          }}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[2px] ${
              tab === t.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "flow" && (
        <div className="space-y-4">
          <FlowView payments={payments} isRunning={isRunning} />

          {/* Live Transaction Log */}
          {payments.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                  <p className="text-xs font-medium text-gray-700">Live Transactions</p>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{payments.length} calls</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[200px] overflow-y-auto">
                {payments.slice(0, 30).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-1.5 font-mono text-[11px] hover:bg-gray-50">
                    <span className="text-gray-300 w-16 text-[10px]">{new Date(p.timestamp).toLocaleTimeString()}</span>
                    <span className="text-gray-800 w-24 font-medium truncate">{brokerLabel(p.worker)}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-blue-600 w-32 truncate">{providerLabel(p.service)}</span>
                    <span className="text-emerald-500 text-[10px]">verified</span>
                    <span className="text-gray-600 ml-auto font-semibold">{p.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRE Status Bar */}
          <div className="flex items-center gap-6 px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Chainlink CRE</p>
            {[
              { label: "Health Check", interval: "5min" },
              { label: "Price Update", interval: "10min" },
              { label: "Settlement", interval: "30min" },
            ].map(w => (
              <div key={w.label} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {w.label} <span className="text-gray-400">({w.interval})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calls Tab */}
      {tab === "calls" && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-700">x402 Payment Log</p>
            <span className="text-[10px] text-gray-400 font-mono">{payments.length} payments · Arc Testnet</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {payments.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Click Start to begin</div>
            ) : payments.map((p, i) => (
              <div key={i} className="px-4 py-2 font-mono text-xs hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-300 w-16">{new Date(p.timestamp).toLocaleTimeString()}</span>
                  <span className="text-[9px] text-amber-600 border border-amber-200 rounded px-1.5 py-0.5 bg-amber-50">x402</span>
                  <span className="text-gray-800 w-24 font-semibold truncate">{brokerLabel(p.worker)}</span>
                  <span className="text-gray-300 text-[10px]">→</span>
                  <span className="text-blue-600 w-32 truncate">{providerLabel(p.service)}</span>
                  <span className="text-emerald-500 text-[10px]">verified</span>
                  <span className="text-emerald-700 font-semibold ml-auto">{p.amount}</span>
                </div>
                {p.insight && (
                  <div className="flex items-center gap-2 mt-1 ml-20">
                    <span className="text-[9px] text-gray-300">returns:</span>
                    <span className="text-[10px] text-blue-500 font-sans truncate">{p.insight}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settlement Tab */}
      {tab === "settlement" && (
        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          <p className="text-sm font-medium text-gray-700">Circle Gateway Batch Settlement</p>
          {gwStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gateway Earned</p>
                  <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">${gwStatus.gateway?.available}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Wallet Balance</p>
                  <p className="text-2xl font-bold font-mono mt-1">${gwStatus.wallet?.balance}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Lifetime Payments</p>
                  <p className="text-2xl font-bold text-blue-700 font-mono mt-1">{gwStatus.lifetimePayments}</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-700 font-mono">
                {gwStatus.batchSettlement?.proof}
              </div>
              <div className="text-xs space-y-1.5">
                <a href={gwStatus.verifyOnChain?.seller} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Seller wallet on ArcScan →</a>
                <a href={gwStatus.verifyOnChain?.gatewayWallet} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Gateway contract on ArcScan →</a>
              </div>
              {gwStatus.recentPayments?.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Recent Payments</p>
                  <div className="space-y-1 font-mono text-[11px]">
                    {gwStatus.recentPayments.slice(0, 10).map((p: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-gray-300">{new Date(p.timestamp).toLocaleTimeString()}</span>
                        <span className="text-gray-500">{p.worker?.slice(0,8)}→{p.service}</span>
                        <span className="text-emerald-500 ml-auto">+{p.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-8">Loading gateway status...</p>}
        </div>
      )}

      {/* CRE Tab */}
      {tab === "cre" && (
        <div className="space-y-4">
          {creLogs.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 max-h-[250px] overflow-y-auto font-mono text-[11px] text-green-400 space-y-0.5">
              {creLogs.slice(-30).map((log: any, i: number) => (
                <div key={i} className={log.level === "ERROR" ? "text-red-400" : log.level === "WARN" ? "text-yellow-400" : log.level === "DEBUG" ? "text-gray-600" : "text-green-400"}>
                  <span className="text-gray-600">{log.timestamp?.slice(11, 19)}</span>{" "}
                  <span className="text-blue-400">[{log.workflow}]</span>{" "}
                  {log.message}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            {creResults.map((w: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium">{w.workflow}</span>
                </div>
                <p className="text-[11px] text-gray-400">{w.trigger}</p>
                <p className="text-[11px] text-gray-600 font-mono mt-1">{w.summary}</p>
              </div>
            ))}
          </div>
          {creResults.length === 0 && creLogs.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-12">Click the CRE tab to execute workflows</p>
          )}
        </div>
      )}

      {/* Verify Tab */}
      {tab === "verify" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="border border-gray-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-medium">On-Chain Contracts (Arc Testnet)</p>
            {[
              { n: "AgentRegistry", a: "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0" },
              { n: "AgenticCommerce", a: "0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A" },
              { n: "PaymentAccumulator", a: "0x627eE346183AB858c581A8F234ADA37579Ff1b13" },
              { n: "PricingOracle", a: "0xdF5e936A36A190859C799754AAC848D9f5Abf958" },
              { n: "Gateway Wallet", a: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" },
            ].map(c => (
              <div key={c.n} className="flex justify-between text-xs">
                <span className="text-gray-600">{c.n}</span>
                <a href={`https://testnet.arcscan.app/address/${c.a}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono text-[11px]">{c.a.slice(0,8)}..{c.a.slice(-4)}</a>
              </div>
            ))}
          </div>
          <div className="border border-gray-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-medium">ENS (Sepolia)</p>
            <a href="https://sepolia.app.ens.domains/flowbroker.eth" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs block">flowbroker.eth →</a>
            <p className="text-xs text-gray-500">18 subnames: 8 brokers + 10 providers</p>
            <p className="text-xs text-gray-500">72+ text records (prices, capabilities, roles)</p>
            <p className="text-sm font-medium mt-4">CRE Workflows</p>
            <p className="text-xs text-gray-500">3 workflows simulated on CRE CLI v1.9.0</p>
            <p className="text-xs text-gray-500">Health Monitor, Dynamic Pricing, Settlement</p>
          </div>
        </div>
      )}

      {/* Protocols Tab */}
      {tab === "bounty" && (
        <BountyPanel
          totalPayments={stats.totalPayments}
          totalVolume={stats.totalVolume}
          gasSaved={stats.gasSaved}
        />
      )}
    </div>
  );
}
