import { createPublicClient, createWalletClient, http, parseAbi, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET, CONTRACTS } from "./config.js";

const ARC_RPC = "https://rpc.testnet.arc.network";
const CHAIN_ID = 5042002;

const chain = {
  id: CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [ARC_RPC] } },
} as const;

const COMMERCE_ABI = parseAbi([
  "function createJob(address provider, address evaluator, uint256 expiredAt, string description, address hook) external returns (uint256)",
  "function setBudget(uint256 jobId, uint256 amount, bytes optParams) external",
  "function fund(uint256 jobId, uint256 expectedBudget, bytes optParams) external",
  "function submit(uint256 jobId, bytes32 deliverable, bytes optParams) external",
  "function complete(uint256 jobId, bytes32 reason, bytes optParams) external",
  "function reject(uint256 jobId, bytes32 reason, bytes optParams) external",
  "function jobs(uint256) view returns (address client, address provider, address evaluator, address hook, uint256 budget, uint256 expiredAt, uint8 status, string description, bytes32 deliverable)",
  "function jobCount() view returns (uint256)",
  "event JobCreated(uint256 indexed jobId, address indexed client, address provider, address evaluator, string description)",
  "event JobFunded(uint256 indexed jobId, uint256 budget)",
  "event JobSubmitted(uint256 indexed jobId, bytes32 deliverable)",
  "event JobCompleted(uint256 indexed jobId, bytes32 reason)",
  "event JobRejected(uint256 indexed jobId, bytes32 reason)",
]);

const USDC_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address) view returns (uint256)",
]);

const publicClient = createPublicClient({ chain, transport: http(ARC_RPC) });

function getWallet(key: `0x${string}`) {
  return createWalletClient({
    chain,
    transport: http(ARC_RPC),
    account: privateKeyToAccount(key),
  });
}

export async function createAndRunJob(
  clientKey: `0x${string}`,
  providerKey: `0x${string}`,
  description: string,
  budgetUsdc: number,
) {
  const clientWallet = getWallet(clientKey);
  const providerWallet = getWallet(providerKey);
  const clientAddr = clientWallet.account.address;
  const providerAddr = providerWallet.account.address;
  const commerce = CONTRACTS.agenticCommerce as `0x${string}`;
  const hook = "0x0000000000000000000000000000000000000000" as `0x${string}`; // no hook for now
  const usdc = CONTRACTS.usdc as `0x${string}`;

  const budget = BigInt(budgetUsdc * 1_000_000); // 6 decimals
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

  console.log(`\n📋 Creating job: "${description}"`);
  console.log(`   Client: ${clientAddr}`);
  console.log(`   Provider: ${providerAddr}`);
  console.log(`   Budget: ${budgetUsdc} USDC`);

  // 1. Create job
  const createHash = await clientWallet.writeContract({
    address: commerce,
    abi: COMMERCE_ABI,
    functionName: "createJob",
    args: [providerAddr, clientAddr, expiry, description, hook],
  });
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
  
  const jobCreatedLog = createReceipt.logs.find(l => l.topics[0] === "0x7c7a8b1f3b0d2567c7c67a6b5e8e6a23ac78d8e82768a0e7e0c1addf43e2c3b5");
  const jobId = createReceipt.logs[0]?.topics[1] ? BigInt(createReceipt.logs[0].topics[1]) : 0n;
  
  const jobCount = await publicClient.readContract({
    address: commerce,
    abi: COMMERCE_ABI,
    functionName: "jobCount",
  });
  const currentJobId = jobCount - 1n;
  
  console.log(`   ✅ Job #${currentJobId} created (tx: ${createHash.slice(0, 14)}...)`);

  // 2. Set budget
  const budgetHash = await clientWallet.writeContract({
    address: commerce,
    abi: COMMERCE_ABI,
    functionName: "setBudget",
    args: [currentJobId, budget, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: budgetHash });
  console.log(`   ✅ Budget set: ${budgetUsdc} USDC`);

  // 3. Approve USDC
  const approveHash = await clientWallet.writeContract({
    address: usdc,
    abi: USDC_ABI,
    functionName: "approve",
    args: [commerce, budget],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  // 4. Fund escrow
  const fundHash = await clientWallet.writeContract({
    address: commerce,
    abi: COMMERCE_ABI,
    functionName: "fund",
    args: [currentJobId, budget, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  console.log(`   ✅ Funded: ${budgetUsdc} USDC locked in escrow`);

  // 5. Provider submits work
  const deliverable = `0x${Buffer.from("task-completed-" + Date.now()).toString("hex").padEnd(64, "0")}` as `0x${string}`;
  const submitHash = await providerWallet.writeContract({
    address: commerce,
    abi: COMMERCE_ABI,
    functionName: "submit",
    args: [currentJobId, deliverable, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: submitHash });
  console.log(`   ✅ Work submitted`);

  // 6. Client evaluates and completes
  const reason = `0x${Buffer.from("quality-verified").toString("hex").padEnd(64, "0")}` as `0x${string}`;
  const completeHash = await clientWallet.writeContract({
    address: commerce,
    abi: COMMERCE_ABI,
    functionName: "complete",
    args: [currentJobId, reason, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: completeHash });
  console.log(`   ✅ Job completed — USDC released to provider`);

  // 7. Check final state
  const job = await publicClient.readContract({
    address: commerce,
    abi: COMMERCE_ABI,
    functionName: "jobs",
    args: [currentJobId],
  });
  const statusNames = ["Open", "Funded", "Submitted", "Completed", "Rejected", "Expired"];
  console.log(`   📊 Final status: ${statusNames[Number(job[6])]}`);
  console.log(`   🔗 https://testnet.arcscan.app/tx/${completeHash}\n`);

  return {
    jobId: Number(currentJobId),
    status: statusNames[Number(job[6])],
    txHash: completeHash,
  };
}

// Run if called directly
if (process.argv[1]?.includes("job-manager")) {
  const clientKey = process.env.BUYER_KEY as `0x${string}`;
  const providerKey = process.env.SELLER_KEY as `0x${string}`;
  if (!clientKey || !providerKey) {
    console.error("Need BUYER_KEY and SELLER_KEY in .env");
    process.exit(1);
  }

  console.log("🏗️ ERC-8183 Job Lifecycle Demo\n");

  createAndRunJob(clientKey, providerKey, "Analyze market trends for Q2 2026", 0.05)
    .then(r => console.log("Done:", r))
    .catch(console.error);
}
