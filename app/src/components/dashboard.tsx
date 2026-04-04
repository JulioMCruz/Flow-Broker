"use client";

import { useState } from "react";
import { useWebSocket } from "@/lib/useWebSocket";
import { api } from "@/lib/api";
import { BROKERS, PROVIDERS, providerLabel, brokerLabel } from "@/lib/agents";
import { FlowView } from "@/components/flow-view";
import { BountyPanel } from "@/components/bounty-panel";

const PROFILES = [
  { id: "conservative", label: "Conservative", desc: "Low risk, 4 providers", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "balanced", label: "Balanced", desc: "Medium risk, 7 providers", color: "bg-green-100 text-green-700 border-green-200" },
  { id: "alpha", label: "Alpha", desc: "High risk, all providers", color: "bg-red-100 text-red-700 border-red-200" },
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

  const activeBrokers = BROKERS.filter(b => {
    const last = payments.find(p => brokerLabel(p.worker) === b.label);
    return !!last;
  });

  return (
    <div className="w-full px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Flow Broker</h1>
          <p className="text-xs text-gray-400">Autonomous AI Broker on Arc</p>
        </div>
        <div className="flex items-center gap-3">
          {!connected && (
            <>
              {PROFILES.map(p => (
                <button key={p.id} onClick={() => setProfile(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${profile === p.id ? p.color : "text-gray-400 border-gray-200"}`}>
                  {p.label}
                </button>
              ))}
              <input value={txCount} onChange={e => setTxCount(e.target.value)}
                className="w-14 border border-gray-200 rounded px-2 py-1.5 text-xs text-center font-mono" />
            </>
          )}
          <button onClick={handleStart}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${connected ? "bg-gray-100 text-gray-600" : "bg-gray-900 text-white"}`}>
            {connected ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { l: "Calls", v: stats.totalPayments.toLocaleString() },
          { l: "Volume", v: `$${stats.totalVolume}` },
          { l: "Fees (10%)", v: `$${stats.platformFees || "0"}` },
          { l: "Brokers", v: stats.activeWorkers },
          { l: "Gas Saved", v: `$${stats.gasSaved}` },
          { l: "Rate", v: `${stats.paymentsPerMin}/min` },
        ].map(s => (
          <div key={s.l} className="border border-gray-100 rounded p-2 text-center">
            <p className="text-[10px] text-gray-400 uppercase">{s.l}</p>
            <p className="text-sm font-semibold font-mono">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 pb-1">
        {(["flow", "calls", "settlement", "cre", "verify", "bounty"] as const).map(t => (
          <button key={t} onClick={async () => {
            setTab(t);
            if (t === "settlement") {
              try { setGwStatus(await (await fetch(api("/gateway-status"))).json()); } catch {}
            }
            if (t === "cre") {
              try {
                const res = await fetch(api("/cre-run"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow: "all" }) });
                const data = await res.json();
                if (data.workflows) setCreResults(data.workflows);
                const logs = await (await fetch(api("/cre-logs"))).json();
                if (logs.logs) setCreLogs(logs.logs);
              } catch {}
            }
          }}
            className={`px-3 py-1 rounded-t text-xs ${tab === t ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}>
            {t === "flow" ? "Flow" : t === "calls" ? "Calls" : t === "settlement" ? "Settlement" : t === "cre" ? "CRE" : t === "verify" ? "Verify" : "Protocols"}
          </button>
        ))}
      </div>

      {/* Flow View */}
      {tab === "flow" && (
        <div className="space-y-4">
          {/* React Flow: Brokers → Information Providers */}
          <FlowView payments={payments} isRunning={isRunning} />

          {/* Transaction Log */}
          {payments.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">Transaction Log</p>
                <span className="text-[10px] text-gray-400">{payments.length} calls</span>
              </div>
              <div className="space-y-0.5 max-h-[150px] overflow-y-auto font-mono text-[10px]">
                {payments.slice(0, 20).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="text-gray-300 w-14">{new Date(p.timestamp).toLocaleTimeString()}</span>
                    <span className="text-green-600 w-24 truncate">{brokerLabel(p.worker)}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-blue-600 w-28 truncate">{providerLabel(p.service)}</span>
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-400 ml-auto">{p.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* CRE Orchestration */}
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Chainlink CRE Orchestration</p>
            <div className="flex gap-6 text-[10px]">
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Health Check (5min)</div>
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Price Update (10min)</div>
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Batch Settlement (30min)</div>
            </div>
          </div>
        </div>
      )}

      {/* Calls View — x402 transaction log */}
      {tab === "calls" && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-medium">x402 Payment Log — Broker → Information Provider</p>
            <span className="text-[10px] text-gray-400 font-mono">{payments.length} payments · Arc Testnet</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {payments.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Click Start to see x402 payments</div>
            ) : payments.map((p, i) => (
              <div key={i} className="px-3 py-2 font-mono text-xs hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-300 w-14">{new Date(p.timestamp).toLocaleTimeString()}</span>
                  <span className="text-[9px] text-amber-600 border border-amber-200 rounded px-1">x402</span>
                  <span className="text-green-700 w-20 font-medium truncate">{brokerLabel(p.worker)}</span>
                  <span className="text-gray-300 text-[10px]">──pays──→</span>
                  <span className="text-blue-600 w-28 truncate">{providerLabel(p.service)}</span>
                  <span className="text-green-500 text-[10px]">✓ verified</span>
                  <span className="text-green-700 font-semibold ml-auto">{p.amount}</span>
                </div>
                {(p as any).insight && (
                  <div className="flex items-center gap-2 mt-0.5 ml-6">
                    <span className="text-[9px] text-gray-300">↳ returns:</span>
                    <span className="text-[9px] text-blue-500 font-sans truncate">{(p as any).insight}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settlement View */}
      {tab === "settlement" && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <p className="text-xs font-medium">Circle Gateway Batch Settlement</p>
          {gwStatus ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded p-3 text-center">
                  <p className="text-[10px] text-gray-400">Gateway Earned</p>
                  <p className="text-lg font-semibold text-green-700 font-mono">${gwStatus.gateway?.available}</p>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <p className="text-[10px] text-gray-400">Wallet Balance</p>
                  <p className="text-lg font-semibold font-mono">${gwStatus.wallet?.balance}</p>
                </div>
                <div className="bg-blue-50 rounded p-3 text-center">
                  <p className="text-[10px] text-gray-400">Lifetime Payments</p>
                  <p className="text-lg font-semibold font-mono">{gwStatus.lifetimePayments}</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[10px] text-blue-700">
                {gwStatus.batchSettlement?.proof}
              </div>
              <div className="text-xs space-y-1">
                <a href={gwStatus.verifyOnChain?.seller} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Seller wallet on ArcScan →</a>
                <a href={gwStatus.verifyOnChain?.gatewayWallet} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Gateway contract on ArcScan →</a>
              </div>
              {gwStatus.recentPayments?.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Recent Payments</p>
                  <div className="space-y-0.5 font-mono text-[10px]">
                    {gwStatus.recentPayments.slice(0, 10).map((p: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-gray-300">{new Date(p.timestamp).toLocaleTimeString()}</span>
                        <span className="text-gray-500">{p.worker?.slice(0,8)}→{p.service}</span>
                        <span className="text-green-500 ml-auto">✓ {p.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : <p className="text-gray-400 text-xs">Loading...</p>}
        </div>
      )}

      {/* CRE View */}
      {tab === "cre" && (
        <div className="space-y-4">
          {creLogs.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-3 max-h-[200px] overflow-y-auto font-mono text-[10px] text-green-400 space-y-0.5">
              {creLogs.slice(-30).map((log: any, i: number) => (
                <div key={i} className={log.level === "ERROR" ? "text-red-400" : log.level === "WARN" ? "text-yellow-400" : log.level === "DEBUG" ? "text-gray-500" : "text-green-400"}>
                  <span className="text-gray-600">{log.timestamp?.slice(11, 19)}</span>{" "}
                  <span className="text-blue-400">[{log.workflow}]</span>{" "}
                  {log.message}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {creResults.map((w: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs font-medium">{w.workflow}</span>
                </div>
                <p className="text-[10px] text-gray-400">{w.trigger}</p>
                <p className="text-[10px] text-gray-600 font-mono mt-1">{w.summary}</p>
              </div>
            ))}
          </div>
          {creResults.length === 0 && creLogs.length === 0 && (
            <p className="text-gray-400 text-xs text-center py-8">Click CRE tab to execute workflows</p>
          )}
        </div>
      )}

      {/* Verify View */}
      {tab === "verify" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-medium">On-Chain Contracts (Arc Testnet)</p>
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
                  className="text-blue-600 hover:underline font-mono text-[10px]">{c.a.slice(0,8)}..{c.a.slice(-4)}</a>
              </div>
            ))}
          </div>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-medium">ENS (Sepolia)</p>
            <a href="https://sepolia.app.ens.domains/flowbroker.eth" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs block">flowbroker.eth →</a>
            <p className="text-[10px] text-gray-500">18 subnames: 8 brokers + 10 providers</p>
            <p className="text-[10px] text-gray-500">72+ text records (prices, capabilities, roles)</p>

            <p className="text-xs font-medium mt-4">CRE Workflows</p>
            <p className="text-[10px] text-gray-500">3 workflows simulated on CRE CLI v1.9.0</p>
            <p className="text-[10px] text-gray-500">Health Monitor, Dynamic Pricing, Settlement</p>
          </div>
        </div>
      )}
      {/* Bounty View */}
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
