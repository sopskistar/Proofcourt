import { readFile } from "node:fs/promises";
import { createAccount, createClient, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const contractSource = await readFile(new URL("../contracts/InsuranceCourt.py", import.meta.url), "utf8");
const privateKey = process.env.GENLAYER_PRIVATE_KEY?.trim();

if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey || "")) {
  throw new Error("GENLAYER_PRIVATE_KEY must be provided as a server-side 32-byte hexadecimal key.");
}

const client = createClient({ chain: studioDevnet, account: createAccount(privateKey) });

async function estimateFees() {
  // The RC SDK reads the live Studio-dev policy, prices and caps. No fee amount
  // is hand-maintained in this script; unused deposits settle at finalization.
  const estimate = await client.estimateTransactionFees();
  return { distribution: estimate.distribution, feeValue: estimate.feeValue };
}

function successfulOrThrow(receipt, operation) {
  if (!isSuccessful(receipt)) {
    throw new Error(`${operation} did not succeed: ${receipt.statusName} / ${receipt.txExecutionResultName}`);
  }
}

const deployFees = await estimateFees();
const deploymentTransaction = await client.deployContract({ code: contractSource, args: [], fees: deployFees });
const deploymentReceipt = await client.waitForFinalization({ hash: deploymentTransaction, interval: 5_000, retries: 120 });
successfulOrThrow(deploymentReceipt, "Deployment");

const contractAddress = deploymentReceipt.txDataDecoded?.contractAddress;
if (!contractAddress) throw new Error("Deployment finalized successfully but did not return a contract address.");

const canonicalClaim = JSON.stringify({
  version: 2,
  claim: {
    type: "AGENT_FAILURE", incidentCategory: "Autonomous Execution Error", title: "Studio-dev controlled verification", description: "A single controlled post-deployment verification record.", incidentAt: "2026-09-15T00:00:00.000Z", lossAmount: "1.00", currency: "GEN", agentIdentifier: "proofcourt-migration", referenceId: "", policyId: "STUDIO-DEV-CONTROLLED-TEST",
  },
  evidence: [{ hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", mimeType: "text/plain", size: 1, publicSourceUrl: "", verificationAssertion: "" }],
});
const claimHash = "b".repeat(64);
const writeFees = await estimateFees();
const testTransaction = await client.writeContract({
  address: contractAddress,
  functionName: "adjudicate",
  args: [claimHash, canonicalClaim],
  value: 0n,
  fees: writeFees,
});
const testReceipt = await client.waitForFinalization({ hash: testTransaction, interval: 5_000, retries: 120 });
successfulOrThrow(testReceipt, "Controlled write");

const verdict = await client.readContract({ address: contractAddress, functionName: "get_verdict", args: [claimHash] });
if (!verdict || typeof verdict !== "object" || Array.isArray(verdict)) {
  throw new Error("Controlled write finalized but the stored verdict was unavailable.");
}

console.log(JSON.stringify({
  chainId: studioDevnet.id,
  rpcUrl: studioDevnet.rpcUrls.default.http[0],
  deploymentTransaction,
  deploymentStatus: deploymentReceipt.statusName,
  deploymentExecutionResult: deploymentReceipt.txExecutionResultName,
  contractAddress,
  testTransaction,
  testStatus: testReceipt.statusName,
  testExecutionResult: testReceipt.txExecutionResultName,
  verdict,
}, null, 2));
