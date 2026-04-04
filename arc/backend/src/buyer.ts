// PerkMesh Buyer Agent — GatewayClient x402 Nanopayments on Arc Testnet
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { ARC_TESTNET, SELLER_PORT } from "./config.js";

const BUYER_KEY = process.env.BUYER_KEY as `0x${string}`;
if (!BUYER_KEY) throw new Error("BUYER_KEY not set in .env");

const SELLER_URL = `http://localhost:${SELLER_PORT}`;

async function main() {
  console.log("🤖 PerkMesh Buyer Agent starting...\n");

  // Initialize Gateway client on Arc Testnet
  const client = new GatewayClient({
    chain: ARC_TESTNET.gatewayChain,
    privateKey: BUYER_KEY,
  });

  console.log(`📍 Buyer address: ${client.address}`);
  console.log(`🔗 Chain: ${client.chainName}\n`);

  // Check initial balances
  let balances = await client.getBalances();
  console.log(`💰 Wallet USDC: ${balances.wallet.formatted}`);
  console.log(`💰 Gateway available: ${balances.gateway.formattedAvailable}\n`);

  // Deposit if gateway balance is low
  if (balances.gateway.available < 500_000n) { // < 0.5 USDC
    console.log("📥 Depositing 1 USDC into Gateway...");
    try {
      const deposit = await client.deposit("1");
      console.log(`✅ Deposited! Tx: ${deposit.depositTxHash}\n`);
    } catch (err: any) {
      console.error(`❌ Deposit failed: ${err.message}`);
      console.log("   Make sure wallet has USDC from faucet.circle.com\n");
      return;
    }

    // Refresh balances after deposit
    balances = await client.getBalances();
    console.log(`💰 Gateway available after deposit: ${balances.gateway.formattedAvailable}\n`);
  }

  // Check if seller supports Gateway
  console.log("🔍 Checking seller supports Gateway...");
  const support = await client.supports(`${SELLER_URL}/api/search`);
  console.log(`   Supported: ${support.supported}\n`);

  if (!support.supported) {
    console.error("❌ Seller doesn't support Gateway payments. Is the seller running?");
    return;
  }

  // Run payment cycles
  const CYCLES = 5;
  console.log(`🔄 Running ${CYCLES} payment cycles...\n`);

  for (let i = 1; i <= CYCLES; i++) {
    console.log(`--- Cycle ${i}/${CYCLES} ---`);

    // 1. Pay for search ($0.001)
    try {
      console.log("  🔎 Calling search service ($0.001)...");
      const search = await client.pay<{ results: any[]; meta: any }>(
        `${SELLER_URL}/api/search?q=agent+economy`
      );
      console.log(`  ✅ Search: ${search.data.results.length} results, paid ${search.formattedAmount} USDC`);
    } catch (err: any) {
      console.error(`  ❌ Search failed: ${err.message}`);
    }

    // 2. Pay for LLM ($0.015)
    try {
      console.log("  🧠 Calling LLM service ($0.015)...");
      const llm = await client.pay<{ response: string; tokens: number; meta: any }>(
        `${SELLER_URL}/api/llm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: "Explain x402 nanopayments" }),
        }
      );
      console.log(`  ✅ LLM: ${llm.data.tokens} tokens, paid ${llm.formattedAmount} USDC`);
    } catch (err: any) {
      console.error(`  ❌ LLM failed: ${err.message}`);
    }

    // Check balance after cycle
    balances = await client.getBalances();
    console.log(`  💰 Remaining: ${balances.gateway.formattedAvailable} USDC\n`);

    // Small delay between cycles
    if (i < CYCLES) await new Promise((r) => setTimeout(r, 1000));
  }

  // Final summary
  console.log("=== SUMMARY ===");
  balances = await client.getBalances();
  console.log(`Total payments: ${CYCLES * 2}`);
  console.log(`Wallet USDC: ${balances.wallet.formatted}`);
  console.log(`Gateway available: ${balances.gateway.formattedAvailable}`);
  console.log(`Gateway total: ${balances.gateway.formattedTotal}`);
  console.log("================\n");
}

main().catch(console.error);
