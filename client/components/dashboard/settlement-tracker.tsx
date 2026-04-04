"use client";

import { api } from "@/lib/dashboard/api";

import { useEffect, useState } from "react";

const EXPLORER = "https://testnet.arcscan.app/address";

interface GatewayStatus {
  seller: string;
  wallet: { balance: string };
  gateway: { total: string; available: string };
  lifetimePayments: number;
  batchSettlement: {
    status: string;
    mechanism: string;
    proof: string;
    gasSavedPerPayment: string;
    totalGasSaved: string;
  };
  recentPayments: any[];
  verifyOnChain: { seller: string; gatewayWallet: string; usdcContract: string };
}

interface CREWorkflow {
  name: string;
  trigger: string;
  action: string;
  status: string;
  contract: string;
  lastResult: string;
}

export function SettlementTracker() {
  const [gw, setGw] = useState<GatewayStatus | null>(null);
  const [cre, setCre] = useState<CREWorkflow[]>([]);
  const [creLogs, setCreLogs] = useState<any[]>([]);
  const [priceAgent, setPriceAgent] = useState("search");
  const [newPrice, setNewPrice] = useState("0.002");
  const [priceResult, setPriceResult] = useState("");
  const [tab, setTab] = useState<"batch" | "ens" | "cre">("batch");
  const [creRunning, setCreRunning] = useState(false);

  // Auto-run CRE every 30s when on CRE tab
  useEffect(() => {
    if (tab !== "cre") return;
    const runCRE = async () => {
      setCreRunning(true);
      try {
        const res = await fetch(api("/cre-run"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow: "all" }) });
        const data = await res.json();
        if (data.workflows && data.workflows.length > 0) {
          setCre(data.workflows);
        }
        const logsRes = await fetch(api("/cre-logs"));
        const logsData = await logsRes.json();
        if (logsData.logs) setCreLogs(logsData.logs);
      } catch {}
      setCreRunning(false);
    };
    runCRE();
    const interval = setInterval(runCRE, 30000);
    return () => clearInterval(interval);
  }, [tab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gwRes, creRes] = await Promise.all([
          fetch(api("/gateway-status")).then(r => r.json()),
          fetch(api("/cre-status")).then(r => r.json()),
        ]);
        setGw(gwRes);
        if (creRes.workflows) setCre(creRes.workflows);
      } catch {}
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const changePrice = async () => {
    setPriceResult("updating...");
    try {
      const res = await fetch(api("/change-price"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: priceAgent, newPrice }),
      });
      const data = await res.json();
      setPriceResult(data.success ? `tx: ${data.tx.slice(0, 16)}...` : data.error || "failed");
    } catch (err: any) {
      setPriceResult(err.message);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg h-[580px] flex flex-col">
      <div className="p-3 border-b border-gray-100 flex gap-1">
        {(["batch", "ens", "cre"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2 py-1 rounded text-xs ${tab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
            {t === "batch" ? "Settlement" : t === "ens" ? "ENS" : "CRE"}
          </button>
        ))}
      </div>

      <div className="flex-1 p-3 text-xs overflow-y-auto">

        {tab === "batch" && (
          <div className="space-y-3">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">Circle Gateway Batch Settlement</p>
            {gw ? (
              <>
                <div className="bg-gray-50 rounded p-3 space-y-2 font-mono">
                  <div className="flex justify-between"><span className="text-gray-400">gateway earned</span><span className="text-green-600 font-semibold">${gw.gateway.available} USDC</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">wallet balance</span><span>${gw.wallet.balance} USDC</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">lifetime payments</span><span>{gw.lifetimePayments}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">gas saved</span><span className="text-green-600">{gw.batchSettlement.totalGasSaved}</span></div>
                </div>
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-blue-700 text-[10px]">{gw.batchSettlement.proof}</p>
                </div>
                <div className="space-y-1">
                  <a href={gw.verifyOnChain.seller} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[10px] block">Seller wallet on ArcScan →</a>
                  <a href={gw.verifyOnChain.gatewayWallet} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[10px] block">Gateway contract on ArcScan →</a>
                </div>
                {gw.recentPayments.length > 0 && (
                  <div>
                    <p className="text-gray-400 uppercase tracking-wide text-[10px] mt-2 mb-1">Recent Payments</p>
                    <div className="space-y-0.5 font-mono">
                      {gw.recentPayments.slice(0, 8).map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-1 text-[10px]">
                          <span className="text-gray-300">{new Date(p.timestamp).toLocaleTimeString()}</span>
                          <span className="text-gray-500">{p.worker?.slice(0,6)}..→{p.service}</span>
                          <span className="text-green-500 ml-auto">✓ {p.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <p className="text-gray-400">loading...</p>}
          </div>
        )}

        {tab === "ens" && (
          <div className="space-y-3">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">ENS Live Price Change</p>
            <p className="text-gray-500 text-[10px]">Update an agent price on Sepolia ENS. Workers discover new price within 30 seconds.</p>
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-gray-400 text-[10px]">agent</label>
                <select value={priceAgent} onChange={e => setPriceAgent(e.target.value)}
                  className="block w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white">
                  {["search","llm","sentiment","classify","data","embeddings","translate","summarize","vision","code"].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-[10px]">price (USDC)</label>
                <input value={newPrice} onChange={e => setNewPrice(e.target.value)}
                  className="block w-20 border border-gray-200 rounded px-2 py-1 text-xs" />
              </div>
              <button onClick={changePrice}
                className="px-3 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800">
                Update
              </button>
            </div>
            {priceResult && <p className="text-gray-500 mt-1 text-[10px] font-mono">{priceResult}</p>}
            <div className="mt-2">
              <a href="https://sepolia.app.ens.domains/flowbroker.eth" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-[10px]">View flowbroker.eth on ENS →</a>
            </div>
          </div>
        )}

        {tab === "cre" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 uppercase tracking-wide text-[10px]">Chainlink CRE Orchestration</p>
              <div className="flex items-center gap-1.5">
                {creRunning && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                <span className="text-[10px] text-gray-400">{creRunning ? "running..." : "auto-refresh 30s"}</span>
              </div>
            </div>
            {creLogs.length > 0 && (
              <div className="bg-gray-900 rounded p-2 max-h-[180px] overflow-y-auto font-mono text-[10px] text-green-400 space-y-0.5">
                {creLogs.slice(-25).map((log: any, i: number) => (
                  <div key={i} className={log.level === "ERROR" ? "text-red-400" : log.level === "WARN" ? "text-yellow-400" : log.level === "DEBUG" ? "text-gray-500" : "text-green-400"}>
                    <span className="text-gray-600">{log.timestamp?.slice(11, 19)}</span>{" "}
                    <span className="text-blue-400">[{log.workflow}]</span>{" "}
                    {log.message}
                  </div>
                ))}
              </div>
            )}
            {cre.length > 0 ? cre.map((w: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded p-2">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${w.error ? "bg-red-400" : "bg-green-400"}`} />
                  <span className="font-medium text-xs">{w.workflow}</span>
                </div>
                {w.trigger && <p className="text-gray-400 text-[10px] mt-0.5">{w.trigger}</p>}
                <p className="text-gray-600 font-mono text-[10px] mt-1">{w.summary || w.error}</p>
                {w.ethPrice && <p className="text-gray-500 text-[10px]">ETH: {w.ethPrice}</p>}
                {w.result && Array.isArray(w.result) && (
                  <div className="mt-1 space-y-0.5">
                    {w.result.slice(0, 5).map((r: any, j: number) => (
                      <div key={j} className="flex justify-between text-[10px] font-mono">
                        <span className="text-gray-500">{r.agent || r.name}</span>
                        <span className={r.status === "active" || r.status === "settlement-ok" ? "text-green-600" : r.status === "down" ? "text-red-500" : "text-gray-600"}>
                          {r.status || r.currentPrice || r.gatewayBalance || ""}
                        </span>
                      </div>
                    ))}
                    {w.result.length > 5 && <p className="text-gray-400 text-[10px]">+{w.result.length - 5} more</p>}
                  </div>
                )}
                {w.result && !Array.isArray(w.result) && (
                  <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                    {Object.entries(w.result).map(([k, v]: [string, any]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-400">{k}</span>
                        <span className="text-gray-600">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <p className="text-gray-400 text-[10px]">{creRunning ? "executing workflows..." : "loading..."}</p>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
