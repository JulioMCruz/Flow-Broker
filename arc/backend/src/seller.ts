// PerkMesh Seller Agent — Express + x402 Nanopayments on Arc Testnet
// Serves all 10 agent services discovered via ENS
import express from "express";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { privateKeyToAccount } from "viem/accounts";
import { SELLER_PORT } from "./config.js";

const SELLER_KEY = process.env.SELLER_KEY as `0x${string}`;
if (!SELLER_KEY) throw new Error("SELLER_KEY not set in .env");

const SELLER_ADDRESS = privateKeyToAccount(SELLER_KEY).address;
console.log(`🏪 Seller address: ${SELLER_ADDRESS}`);

const app = express();
app.use(express.json());

const gateway = createGatewayMiddleware({
  sellerAddress: SELLER_ADDRESS,
});

// Health check (free)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", agent: "perkmesh-seller", chain: "arc-testnet", services: 10 });
});

// ============================================================
// 10 Agent Services (prices match ENS text records)
// ============================================================

// 1. Search — $0.001
app.get("/api/search", gateway.require("$0.001"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 search: ${amount} from ${payer.slice(0,10)}...`);
  res.json({
    service: "search", query: req.query.q || "default",
    results: [
      { title: "AI Agent Economy Report 2026", score: 0.95 },
      { title: "Nanopayments for Machine Commerce", score: 0.87 },
      { title: "ENS as Service Discovery Layer", score: 0.82 },
    ],
  });
});

// 2. LLM — $0.015
app.post("/api/llm", gateway.require("$0.015"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 llm: ${amount} from ${payer.slice(0,10)}...`);
  res.json({
    service: "llm", prompt: req.body?.prompt || "",
    response: "Agent economies are evolving rapidly with x402 nanopayments enabling sub-cent transactions.",
    tokens: 87,
  });
});

// 3. Sentiment — $0.0003
app.get("/api/sentiment", gateway.require("$0.0003"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 sentiment: ${amount} from ${payer.slice(0,10)}...`);
  res.json({ service: "sentiment", text: req.query.t || "", sentiment: "positive", score: 0.87 });
});

// 4. Classify — $0.0004
app.get("/api/classify", gateway.require("$0.0004"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 classify: ${amount} from ${payer.slice(0,10)}...`);
  res.json({ service: "classify", text: req.query.t || "", category: "technology", confidence: 0.92 });
});

// 5. Data — $0.001
app.get("/api/data", gateway.require("$0.001"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 data: ${amount} from ${payer.slice(0,10)}...`);
  res.json({ service: "data", query: req.query.q || "", records: [{ id: 1, value: "sample" }] });
});

// 6. Embeddings — $0.0005
app.get("/api/embeddings", gateway.require("$0.0005"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 embeddings: ${amount} from ${payer.slice(0,10)}...`);
  res.json({ service: "embeddings", text: req.query.t || "", vector: Array(8).fill(0).map(() => Math.random()) });
});

// 7. Translate — $0.005
app.post("/api/translate", gateway.require("$0.005"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 translate: ${amount} from ${payer.slice(0,10)}...`);
  res.json({ service: "translate", source: req.body?.text || "", target_lang: "es", translated: "Economía de agentes" });
});

// 8. Summarize — $0.015
app.post("/api/summarize", gateway.require("$0.015"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 summarize: ${amount} from ${payer.slice(0,10)}...`);
  res.json({ service: "summarize", text: req.body?.text || "", summary: "Key findings: agents transact autonomously via x402." });
});

// 9. Vision — $0.03
app.post("/api/vision", gateway.require("$0.03"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 vision: ${amount} from ${payer.slice(0,10)}...`);
  res.json({ service: "vision", image: req.body?.image || "", labels: ["chart", "data", "trend"], confidence: 0.89 });
});

// 10. Code — $0.03
app.post("/api/code", gateway.require("$0.03"), (req: any, res) => {
  const { payer, amount } = req.payment!;
  console.log(`💰 code: ${amount} from ${payer.slice(0,10)}...`);
  res.json({ service: "code", prompt: req.body?.prompt || "", code: "const agent = new GatewayClient({ chain: 'arcTestnet' });", language: "typescript" });
});

app.listen(SELLER_PORT, () => {
  console.log(`\n🚀 PerkMesh Seller — 10 services on http://localhost:${SELLER_PORT}`);
  console.log(`   GET  /api/search     $0.001   GET  /api/sentiment  $0.0003`);
  console.log(`   GET  /api/classify    $0.0004  GET  /api/data       $0.001`);
  console.log(`   GET  /api/embeddings  $0.0005  POST /api/llm        $0.015`);
  console.log(`   POST /api/translate   $0.005   POST /api/summarize  $0.015`);
  console.log(`   POST /api/vision      $0.03    POST /api/code       $0.03\n`);
});
