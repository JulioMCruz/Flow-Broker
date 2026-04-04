// PerkMesh — Phase 2 Orchestrator
// Runs 8 buyer agents in parallel against 2 seller services
// WebSocket server pushes payment events to dashboard

import { GatewayClient } from "@circle-fin/x402-batching/client";
import { WebSocketServer, WebSocket } from "ws";
import { ARC_TESTNET, SELLER_PORT } from "./config.js";
import { SERVICES as FALLBACK_SERVICES, NUM_WORKERS, WORKER_DEPOSIT, CYCLES_PER_WORKER } from "./services.js";
import { discoverAgents, toServiceConfigs } from "./ens-resolver.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const SELLER_URL = `http://localhost:${SELLER_PORT}`;
const WS_PORT = 3002;

// Stats
const stats = {
  totalPayments: 0,
  totalVolume: 0,
  startTime: 0,
  activeWorkers: 0,
  payments: [] as any[],
};

// WebSocket server for dashboard
const wss = new WebSocketServer({ port: WS_PORT });
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  // Send current stats on connect
  ws.send(JSON.stringify({ type: "stats", data: getStats() }));
  ws.on("close", () => clients.delete(ws));
});

function broadcast(event: any) {
  const msg = JSON.stringify(event);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

function getStats() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  return {
    totalPayments: stats.totalPayments,
    totalVolume: stats.totalVolume.toFixed(6),
    paymentsPerMin: elapsed > 0 ? Math.round((stats.totalPayments / elapsed) * 60) : 0,
    dollarsPerSec: elapsed > 0 ? (stats.totalVolume / elapsed).toFixed(4) : "0",
    activeWorkers: stats.activeWorkers,
    gasSaved: (stats.totalPayments * 0.30).toFixed(2), // ~$0.30 avg gas per individual tx
    elapsed: Math.round(elapsed),
  };
}

// Worker agent
async function runWorker(workerId: number, key: `0x${string}`, SERVICES: typeof FALLBACK_SERVICES) {
  const client = new GatewayClient({
    chain: ARC_TESTNET.gatewayChain,
    privateKey: key,
  });

  const account = privateKeyToAccount(key);
  const name = `worker-${String(workerId).padStart(2, "0")}`;
  console.log(`  🤖 ${name} → ${account.address}`);

  // Check and deposit
  const balances = await client.getBalances();
  if (balances.gateway.available < 100_000n) { // < $0.10
    console.log(`  📥 ${name} depositing ${WORKER_DEPOSIT} USDC...`);
    try {
      await client.deposit(WORKER_DEPOSIT);
      console.log(`  ✅ ${name} deposited`);
    } catch (err: any) {
      console.error(`  ❌ ${name} deposit failed: ${err.message}`);
      return;
    }
  }

  stats.activeWorkers++;
  broadcast({ type: "worker_joined", data: { name, address: account.address } });

  // Payment loop
  for (let cycle = 1; cycle <= CYCLES_PER_WORKER; cycle++) {
    // Pick a random service
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const url = `${SELLER_URL}${service.endpoint}${service.method === "GET" ? "?q=cycle" + cycle : ""}`;

    try {
      const opts = service.method === "POST"
        ? {
            method: "POST" as const,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: `Task from ${name} cycle ${cycle}` }),
          }
        : undefined;

      const result = await client.pay(url, opts);

      stats.totalPayments++;
      stats.totalVolume += service.priceUsd;

      const payment = {
        worker: name,
        service: service.name,
        amount: service.price,
        cycle,
        timestamp: Date.now(),
      };
      stats.payments.push(payment);

      broadcast({ type: "payment", data: payment });
      broadcast({ type: "stats", data: getStats() });

      // Log every 5th payment per worker
      if (cycle % 5 === 0) {
        const bal = await client.getBalances();
        console.log(`  💰 ${name} cycle ${cycle}/${CYCLES_PER_WORKER} — ${service.name} ${service.price} — bal: ${bal.gateway.formattedAvailable}`);
      }
    } catch (err: any) {
      console.error(`  ❌ ${name} cycle ${cycle} failed: ${err.message}`);
    }

    // Random delay 200-800ms between calls
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 600));
  }

  stats.activeWorkers--;
  console.log(`  🏁 ${name} finished ${CYCLES_PER_WORKER} cycles`);
  broadcast({ type: "worker_finished", data: { name } });
}

async function main() {
  console.log("🌐 PerkMesh Orchestrator — Phase 2\n");
  console.log(`📡 WebSocket server on ws://localhost:${WS_PORT}`);
  console.log(`🎯 ${NUM_WORKERS} workers × ${CYCLES_PER_WORKER} cycles\n`);

  // Generate worker keys (or load from env)
  const workerKeys: `0x${string}`[] = [];
  console.log("🔑 Generating worker wallets...");
  for (let i = 0; i < NUM_WORKERS; i++) {
    const key = (process.env[`WORKER_${i + 1}_KEY`] as `0x${string}`) || generatePrivateKey();
    workerKeys.push(key);
  }

  // Discover agents via ENS (falls back to hardcoded if ENS unavailable)
  let SERVICES = FALLBACK_SERVICES;
  try {
    const ensAgents = await discoverAgents();
    if (ensAgents.length > 0) {
      SERVICES = toServiceConfigs(ensAgents, SELLER_URL);
      console.log(`📡 Using ${SERVICES.length} agents discovered via ENS\n`);
    } else {
      console.log("⚠️ No ENS agents found, using fallback config\n");
    }
  } catch (err: any) {
    console.log(`⚠️ ENS discovery failed (${err.message}), using fallback config\n`);
  }

  // Check seller is running
  try {
    const res = await fetch(`${SELLER_URL}/health`);
    if (!res.ok) throw new Error("Seller not healthy");
    console.log("✅ Seller is running\n");
  } catch {
    console.error("❌ Seller not running! Start it first: npm run seller");
    process.exit(1);
  }

  stats.startTime = Date.now();

  // Launch all workers in parallel (pass discovered services)
  console.log(`🚀 Launching ${NUM_WORKERS} workers...\n`);
  const workers = workerKeys.map((key, i) => runWorker(i + 1, key, SERVICES));

  await Promise.all(workers);

  // Final stats
  console.log("\n=== FINAL STATS ===");
  const finalStats = getStats();
  console.log(`Total payments:   ${finalStats.totalPayments}`);
  console.log(`Total volume:     $${finalStats.totalVolume} USDC`);
  console.log(`Payments/min:     ${finalStats.paymentsPerMin}`);
  console.log(`$/sec:            $${finalStats.dollarsPerSec}`);
  console.log(`Gas saved:        $${finalStats.gasSaved}`);
  console.log(`Duration:         ${finalStats.elapsed}s`);
  console.log("===================\n");

  broadcast({ type: "complete", data: finalStats });

  // Keep WS alive for 10s for dashboard to catch final state
  await new Promise((r) => setTimeout(r, 10000));
  wss.close();
}

main().catch(console.error);
