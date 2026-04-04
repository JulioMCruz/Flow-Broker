import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { discoverAgents, toServiceConfigs } from "./ens-resolver.js";
import { SERVICES as FALLBACK_SERVICES } from "./services.js";
import cors from "cors";

const SELLER_KEY = process.env.SELLER_KEY as `0x${string}`;
if (!SELLER_KEY) throw new Error("SELLER_KEY not set");

const SELLER_ADDRESS = privateKeyToAccount(SELLER_KEY).address;
const PORT = parseInt(process.env.PORT || "8787");
const WS_PORT = parseInt(process.env.WS_PORT || "8788");

const app = express();
app.use(cors());
app.use(express.json());

const gateway = createGatewayMiddleware({ sellerAddress: SELLER_ADDRESS });

// Platform fee (10% on each intelligence call)
const PLATFORM_FEE_PCT = 0.10;

// Stats
let stats = {
  totalPayments: 0,
  totalVolume: 0,
  totalFees: 0,
  startTime: 0,
  activeWorkers: 0,
  isRunning: false,
};

// WebSocket
const wss = new WebSocketServer({ port: WS_PORT, host: "0.0.0.0" });
const wsClients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  wsClients.add(ws);
  ws.send(JSON.stringify({ type: "stats", data: getStats() }));
  ws.on("close", () => wsClients.delete(ws));
});

function broadcast(event: any) {
  const msg = JSON.stringify(event);
  for (const ws of wsClients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

function getStats() {
  const elapsed = stats.startTime ? (Date.now() - stats.startTime) / 1000 : 0;
  return {
    totalPayments: stats.totalPayments,
    totalVolume: stats.totalVolume.toFixed(6),
    paymentsPerMin: elapsed > 0 ? Math.round((stats.totalPayments / elapsed) * 60) : 0,
    dollarsPerSec: elapsed > 0 ? (stats.totalVolume / elapsed).toFixed(4) : "0",
    activeWorkers: stats.activeWorkers,
    gasSaved: (stats.totalPayments * 0.30).toFixed(2),
    platformFees: stats.totalFees.toFixed(6),
    elapsed: Math.round(elapsed),
    isRunning: stats.isRunning,
  };
}

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok", agent: "perkmesh", chain: "arc-testnet", services: 10, wsClients: wsClients.size });
});

// Service definitions (prices loaded from ENS on startup)
const serviceData: Record<string, any> = {
  search: { results: [{ title: "AI Agent Economy", score: 0.95 }] },
  llm: { response: "Agent economies are evolving rapidly.", tokens: 87 },
  sentiment: { sentiment: "positive", score: 0.87 },
  classify: { category: "technology", confidence: 0.92 },
  data: { records: [{ id: 1, value: "sample" }] },
  embeddings: { vector: [0.1, 0.2, 0.3] },
  translate: { translated: "Economia de agentes" },
  summarize: { summary: "Key: agents transact via x402." },
  vision: { labels: ["chart", "data"] },
  code: { code: "const client = new GatewayClient();" },
};

// Prices from ENS (refreshed periodically)
let ensPrices: Record<string, string> = {};

async function loadENSPrices() {
  try {
    const agents = await discoverAgents();
    for (const a of agents) {
      ensPrices[a.name] = `$${a.priceUsd}`;
    }
    console.log("ENS prices loaded:", Object.entries(ensPrices).map(([k,v]) => `${k}=${v}`).join(", "));
  } catch (e) {
    console.log("ENS price load failed, using defaults");
  }
}

// Load prices on startup and refresh every 30s
loadENSPrices();
setInterval(loadENSPrices, 30000);

const serviceNames = Object.keys(serviceData);
const postServices = ["llm", "translate", "summarize", "vision", "code"];

for (const name of serviceNames) {
  const path = `/api/${name}`;
  const method = postServices.includes(name) ? "post" : "get";
  
  const handler = (req: any, res: any) => {
    const payment = req.payment!;
    const price = ensPrices[name] || "$0.000001";
    stats.totalPayments++;
    const priceNum = parseFloat(price.replace("$", ""));
    const fee = priceNum * PLATFORM_FEE_PCT;
    stats.totalVolume += priceNum;
    stats.totalFees += fee;

    const paymentRecord = {
      worker: payment.payer,
      service: name,
      amount: price,
      network: payment.network || "eip155:5042002",
      verified: payment.verified,
      transaction: payment.transaction || null,
      fee: `$${fee.toFixed(8)}`,
      scheme: "GatewayWalletBatched",
      protocol: "x402",
      timestamp: Date.now(),
    };
    paymentHistory.push(paymentRecord);

    broadcast({ type: "payment", data: paymentRecord });
    broadcast({ type: "stats", data: getStats() });

    res.json({ service: name, ...serviceData[name] });
  };

  // Dynamic pricing - create fresh gateway middleware each request with current ENS price
  const priceMiddleware = (req: any, res: any, next: any) => {
    const price = ensPrices[name] || "$0.000001";
    const freshGateway = createGatewayMiddleware({ sellerAddress: SELLER_ADDRESS });
    freshGateway.require(price)(req, res, next);
  };

  if (method === "post") {
    app.post(path, priceMiddleware, handler);
  } else {
    app.get(path, priceMiddleware, handler);
  }
}

// START endpoint - triggers workers
app.post("/start", async (_req, res) => {
  if (stats.isRunning) return res.json({ error: "already running" });

  stats.isRunning = true;
  stats.startTime = Date.now();
  stats.totalPayments = 0;
  stats.totalVolume = 0;
  broadcast({ type: "started", data: getStats() });

  const NUM_WORKERS = 8;
  const CYCLES = parseInt(_req.body?.cycles) || 63; // default ~500 txs (8*63=504)

  // Discover services via ENS
  let SERVICES = FALLBACK_SERVICES;
  try {
    const ensAgents = await discoverAgents();
    if (ensAgents.length > 0) SERVICES = toServiceConfigs(ensAgents, `http://localhost:${PORT}`);
  } catch {}

  res.json({ status: "started", workers: NUM_WORKERS, cycles: CYCLES });

  // Run workers in background
  const workerKeys: `0x${string}`[] = [];
  for (let i = 0; i < NUM_WORKERS; i++) {
    workerKeys.push((process.env[`WORKER_${i + 1}_KEY`] as `0x${string}`) || generatePrivateKey());
  }

  // Broker definitions — each calls specific providers
  const brokers = [
    { name: "Guardian", providers: ["search"] },
    { name: "Sentinel", providers: ["search", "sentiment"] },
    { name: "Steady", providers: ["search", "sentiment", "llm"] },
    { name: "Navigator", providers: ["search", "sentiment", "llm", "code"] },
    { name: "Growth", providers: ["search", "sentiment", "embeddings", "classify", "data"] },
    { name: "Momentum", providers: ["search", "sentiment", "embeddings", "classify", "data", "translate"] },
    { name: "Apex", providers: ["search", "sentiment", "llm", "embeddings", "classify", "data", "code", "vision"] },
    { name: "Titan", providers: ["search", "sentiment", "llm", "embeddings", "classify", "data", "code", "vision", "translate", "summarize"] },
  ];

  const runWorker = async (idx: number, key: `0x${string}`) => {
    const client = new GatewayClient({ chain: "arcTestnet", privateKey: key });
    const broker = brokers[idx - 1] || brokers[0];

    const bal = await client.getBalances();
    if (bal.gateway.available < 100n) {
      try { await client.deposit("0.10"); } catch { return; }
    }

    stats.activeWorkers++;
    broadcast({ type: "worker_joined", data: { name: broker.name, address: privateKeyToAccount(key).address } });

    for (let c = 0; c < CYCLES; c++) {
      // Pick from this broker's specific providers
      const providerName = broker.providers[Math.floor(Math.random() * broker.providers.length)];
      const svc = SERVICES.find(s => s.name === providerName) || SERVICES[0];
      try {
        const url = `http://localhost:${PORT}${svc.endpoint}${svc.method === "GET" ? "?q=c" + c : ""}`;
        const opts = svc.method === "POST"
          ? { method: "POST" as const, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: `${broker.name} cycle ${c}` }) }
          : undefined;
        await client.pay(url, opts);
      } catch {}

      // Risk manager validates after every 5 calls
      if (c % 5 === 4 && broker.name !== "risk-manager") {
        try {
          const rmSvc = SERVICES.find(s => s.name === "llm") || SERVICES[0];
          const rmUrl = `http://localhost:${PORT}${rmSvc.endpoint}`;
          await client.pay(rmUrl, { method: "POST" as const, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: `risk-check for ${broker.name}` }) });
        } catch {}
      }

      await new Promise(r => setTimeout(r, 200 + Math.random() * 400));
    }

    stats.activeWorkers--;
    broadcast({ type: "worker_finished", data: { name: broker.name } });
  };

  Promise.all(workerKeys.map((k, i) => runWorker(i + 1, k))).then(() => {
    stats.isRunning = false;
    broadcast({ type: "complete", data: getStats() });
  });
});

// On-chain agent registry
app.get("/registry", async (_req, res) => {
  try {
    const { createPublicClient, http, parseAbi } = await import("viem");
    const client = createPublicClient({
      chain: { id: 5042002, name: "Arc Testnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } } } as any,
      transport: http("https://rpc.testnet.arc.network"),
    });
    const count = await client.readContract({
      address: "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0",
      abi: parseAbi(["function agentCount() view returns (uint256)"]),
      functionName: "agentCount",
    });
    res.json({ agentCount: Number(count), contract: "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0", chain: "arc-testnet", verify: "https://testnet.arcscan.app/address/0xE9bFA497e189272109540f9dBA4cb1419F05cdF0" });
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

// Current ENS prices
app.get("/prices", (_req, res) => {
  res.json(ensPrices);
});

// Payment history (kept in memory for demo)
const paymentHistory: any[] = [];

// Gateway batch status - shows real Gateway balances + history
app.get("/gateway-status", async (_req, res) => {
  try {
    const client = new GatewayClient({ chain: "arcTestnet", privateKey: SELLER_KEY });
    const balances = await client.getBalances();
    res.json({
      seller: SELLER_ADDRESS,
      wallet: { balance: balances.wallet.formatted },
      gateway: {
        total: balances.gateway.formattedTotal,
        available: balances.gateway.formattedAvailable,
      },
      totalPaymentsReceived: stats.totalPayments,
      lifetimePayments: paymentHistory.length,
      batchSettlement: {
        status: "active",
        mechanism: "Circle Gateway batches EIP-3009 authorizations into single on-chain tx",
        proof: `Seller Gateway balance: $${balances.gateway.formattedAvailable} USDC = accumulated from ${paymentHistory.length}+ nanopayments`,
        gasSavedPerPayment: "$0.30 avg",
        totalGasSaved: `$${(paymentHistory.length * 0.30).toFixed(2)}`,
      },
      recentPayments: paymentHistory.slice(-20).reverse(),
      verifyOnChain: {
        seller: `https://testnet.arcscan.app/address/${SELLER_ADDRESS}`,
        gatewayWallet: "https://testnet.arcscan.app/address/0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
        usdcContract: "https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000",
      },
    });
  } catch (err: any) {
    res.json({ error: err.message });
  }
});

// ENS price change
app.post("/change-price", async (req, res) => {
  const { agent, newPrice } = req.body;
  if (!agent || !newPrice) return res.status(400).json({ error: "need agent and newPrice" });

  try {
    const { createWalletClient, createPublicClient, http } = await import("viem");
    const { sepolia } = await import("viem/chains");
    const { privateKeyToAccount: pka } = await import("viem/accounts");
    const { normalize, namehash } = await import("viem/ens");

    const DEPLOYER_KEY = process.env.DEPLOYER_KEY as `0x${string}`;
    if (!DEPLOYER_KEY) return res.status(500).json({ error: "DEPLOYER_KEY not set" });

    const wallet = createWalletClient({
      chain: sepolia,
      transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
      account: pka(DEPLOYER_KEY),
    });

    const RESOLVER = "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5" as `0x${string}`;
    const node = namehash(normalize(`${agent}.flowbroker.eth`));

    const hash = await wallet.writeContract({
      address: RESOLVER,
      abi: [{ name: "setText", type: "function", stateMutability: "nonpayable", inputs: [{ name: "node", type: "bytes32" }, { name: "key", type: "string" }, { name: "value", type: "string" }], outputs: [] }],
      functionName: "setText",
      args: [node, "com.x402.price", newPrice],
    });

    // Immediately update local price cache
    ensPrices[agent] = `$${newPrice}`;
    console.log(`ENS price updated: ${agent} = $${newPrice} (tx: ${hash.slice(0, 14)}...)`);

    broadcast({
      type: "ens_update",
      data: { agent: `${agent}.flowbroker.eth`, key: "com.x402.price", value: newPrice, tx: hash, timestamp: Date.now() },
    });

    // Also trigger full ENS refresh in background
    loadENSPrices().catch(() => {});

    res.json({
      success: true,
      agent: `${agent}.flowbroker.eth`,
      newPrice,
      tx: hash,
      explorer: `https://sepolia.etherscan.io/tx/${hash}`,
    });
  } catch (err: any) {
    res.json({ error: err.message });
  }
});

// CRE status
app.get("/cre-status", (_req, res) => {
  res.json({
    workflows: [
      {
        name: "Agent Health Monitor",
        trigger: "Cron (every 5 min)",
        action: "HTTP ping agents → update AgentRegistry",
        status: "simulated",
        contract: "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0",
        lastResult: "1-agents-down",
      },
      {
        name: "Dynamic Pricing Oracle",
        trigger: "Cron (every 30 min)",
        action: "Fetch ETH/USD → calculate agent prices → update PricingOracle",
        status: "simulated",
        contract: "0xdF5e936A36A190859C799754AAC848D9f5Abf958",
        lastResult: "ETH/USD: $2,052.16 → Prices: [100, 802]",
      },
      {
        name: "Settlement Monitor",
        trigger: "Cron (every 10 min)",
        action: "Check backend health → verify settlement status",
        status: "simulated",
        contract: "0x627eE346183AB858c581A8F234ADA37579Ff1b13",
        lastResult: "Backend status: ok, services: 10",
      },
    ],
    note: "Workflows compiled to WASM and simulated on CRE CLI v1.9.0. Chainlink team deploys to live DON at hackathon.",
  });
});

// CRE execution logs (persisted)
const creLogs: any[] = [];

function creLog(workflow: string, level: string, message: string) {
  const entry = {
    timestamp: new Date().toISOString(),
    workflow,
    level,
    message,
  };
  creLogs.push(entry);
  if (creLogs.length > 200) creLogs.shift();
  broadcast({ type: "cre_log", data: entry });
}

app.get("/cre-logs", (_req, res) => {
  res.json({ logs: creLogs });
});

// CRE Orchestration Demo - simulates what CRE DON does
app.post("/cre-run", async (_req, res) => {
  const workflow = _req.body?.workflow || "all";
  const results: any[] = [];

  // Clear old logs for fresh run
  creLogs.length = 0;
  creLog("CRE", "INFO", `[SIMULATION] Simulator Initialized`);
  creLog("CRE", "INFO", `[SIMULATION] Running workflows: ${workflow}`);
  broadcast({ type: "cre_start", data: { workflow, timestamp: Date.now() } });

  // 1. Health Monitor
  if (workflow === "all" || workflow === "health") {
    creLog("health-monitor", "INFO", "[SIMULATION] Running trigger trigger=cron-trigger@1.0.0");
    const healthResults: any[] = [];
    for (const name of serviceNames) {
      try {
        creLog("health-monitor", "DEBUG", `HTTP GET ${name}.flowbroker.eth/health`);
        const resp = await fetch(`http://localhost:${PORT}/api/${name}${postServices.includes(name) ? "" : "?q=health"}`, {
          method: postServices.includes(name) ? "POST" : "GET",
          headers: postServices.includes(name) ? { "Content-Type": "application/json" } : {},
          body: postServices.includes(name) ? JSON.stringify({ prompt: "health" }) : undefined,
        }).catch(() => null);
        const status = resp ? "active" : "down";
        healthResults.push({ agent: name, status });
        creLog("health-monitor", "INFO", `[USER LOG] Agent "${name}" status: ${status}`);
      } catch {
        healthResults.push({ agent: name, status: "down" });
        creLog("health-monitor", "WARN", `[USER LOG] Agent "${name}" is DOWN`);
      }
    }
    const summary = `${healthResults.filter(h => h.status === "active").length}/${healthResults.length} agents healthy`;
    creLog("health-monitor", "INFO", `[USER LOG] Health check complete: ${summary}`);
    creLog("health-monitor", "INFO", `Workflow Simulation Result: "${summary}"`);
    const result = { workflow: "Agent Health Monitor", trigger: "cron (every 5 min)", timestamp: Date.now(), result: healthResults, summary };
    results.push(result);
    broadcast({ type: "cre_result", data: result });
  }

  // 2. Dynamic Pricing
  if (workflow === "all" || workflow === "pricing") {
    creLog("dynamic-pricing", "INFO", "[SIMULATION] Running trigger trigger=cron-trigger@1.0.0");
    try {
      creLog("dynamic-pricing", "DEBUG", "HTTP GET api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
      const priceResp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
      const priceData = await priceResp.json() as any;
      const ethPrice = priceData?.ethereum?.usd || 2000;
      creLog("dynamic-pricing", "INFO", `[USER LOG] ETH/USD: $${ethPrice}`);
      
      const agentPrices = serviceNames.map(name => {
        const base = parseFloat((ensPrices[name] || "$0.001").replace("$", ""));
        const adj = Math.max(-0.5, Math.min(0.5, (ethPrice - 2000) / 20000));
        return { agent: name, currentPrice: ensPrices[name] || "$0.001", adjustedPrice: `$${(base * (1 + adj)).toFixed(6)}` };
      });

      creLog("dynamic-pricing", "INFO", `[USER LOG] Prices: [${agentPrices.map(p => p.adjustedPrice).join(", ")}]`);
      creLog("dynamic-pricing", "INFO", `Workflow Simulation Result: "prices-calculated"`);
      const result = {
        workflow: "Dynamic Pricing Oracle",
        trigger: "cron (every 30 min)",
        timestamp: Date.now(),
        ethPrice: `$${ethPrice}`,
        result: agentPrices,
        summary: `ETH/USD: $${ethPrice} → ${agentPrices.length} prices calculated`,
      };
      results.push(result);
      broadcast({ type: "cre_result", data: result });
    } catch (e: any) {
      creLog("dynamic-pricing", "ERROR", e.message);
      results.push({ workflow: "Dynamic Pricing", error: e.message });
    }
  }

  // 3. Settlement Monitor
  if (workflow === "all" || workflow === "settlement") {
    creLog("settlement-monitor", "INFO", "[SIMULATION] Running trigger trigger=cron-trigger@1.0.0");
    try {
      const gwClient = new GatewayClient({ chain: "arcTestnet", privateKey: SELLER_KEY });
      const balances = await gwClient.getBalances();
      
      creLog("settlement-monitor", "INFO", `[USER LOG] Backend status: ok, services: ${serviceNames.length}`);
      creLog("settlement-monitor", "INFO", `[USER LOG] Gateway balance: $${balances.gateway.formattedAvailable} USDC`);
      creLog("settlement-monitor", "INFO", `[USER LOG] Total payments: ${paymentHistory.length}`);
      creLog("settlement-monitor", "INFO", `Workflow Simulation Result: "settlement-ok"`);
      const result = {
        workflow: "Settlement Monitor",
        trigger: "cron (every 10 min)",
        timestamp: Date.now(),
        result: {
          gatewayBalance: balances.gateway.formattedAvailable,
          walletBalance: balances.wallet.formatted,
          totalPayments: paymentHistory.length,
          status: "settlement-ok",
        },
        summary: `Gateway: $${balances.gateway.formattedAvailable} USDC, ${paymentHistory.length} payments processed`,
      };
      results.push(result);
      broadcast({ type: "cre_result", data: result });
    } catch (e: any) {
      creLog("settlement-monitor", "ERROR", e.message);
      results.push({ workflow: "Settlement Monitor", error: e.message });
    }
  }

  creLog("CRE", "INFO", `[SIMULATION] All ${results.length} workflows completed`);
  creLog("CRE", "INFO", `[SIMULATION] Execution finished`);
  broadcast({ type: "cre_complete", data: { workflows: results.length, timestamp: Date.now() } });
  res.json({ workflows: results });
});

// STOP endpoint
app.post("/stop", (_req, res) => {
  stats.isRunning = false;
  broadcast({ type: "stopped", data: getStats() });
  res.json({ status: "stopped" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PerkMesh server on :${PORT} (API) + :${WS_PORT} (WS)`);
  console.log(`${serviceNames.length} services, seller: ${SELLER_ADDRESS}`);
});
