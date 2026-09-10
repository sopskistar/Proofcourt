import { createAccount, createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { ExecutionResult } from "genlayer-js/types";
import type { Claim, ClaimStatus, Transaction, Verdict } from "@/types/claims";
import { ApiError } from "@/lib/server/errors";

const BRADBURY_CHAIN_ID = 4221;
const explorerBase = "https://explorer-bradbury.genlayer.com";
type Refresh = { adjudication: Transaction; status: ClaimStatus; verdict?: Verdict };

function settings() {
  // Environment files copied between systems can retain harmless surrounding
  // whitespace. Normalize it server-side; secrets never leave this module.
  const rpcUrl = process.env.GENLAYER_RPC_URL?.trim();
  const privateKey = process.env.GENLAYER_PRIVATE_KEY?.trim();
  const contractAddress = process.env.GENLAYER_CONTRACT_ADDRESS?.trim();
  const configuredChainId = process.env.GENLAYER_CHAIN_ID?.trim();
  if (!rpcUrl || !privateKey || !contractAddress || !configuredChainId) throw new ApiError(503, "GENLAYER_NOT_CONFIGURED", "Live GenLayer adjudication requires GENLAYER_RPC_URL, GENLAYER_PRIVATE_KEY, GENLAYER_CONTRACT_ADDRESS, and GENLAYER_CHAIN_ID on the server.");
  if (Number(configuredChainId) !== BRADBURY_CHAIN_ID) throw new ApiError(503, "GENLAYER_CHAIN_MISMATCH", "ProofCourt is configured for Bradbury chain ID 4221.");
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) throw new ApiError(503, "GENLAYER_INVALID_SIGNER", "GENLAYER_PRIVATE_KEY must be a server-side 32-byte hexadecimal key.");
  if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) throw new ApiError(503, "GENLAYER_INVALID_CONTRACT", "GENLAYER_CONTRACT_ADDRESS must be a deployed contract address.");
  return { rpcUrl, privateKey: privateKey as `0x${string}`, contractAddress: contractAddress as `0x${string}` };
}
function client(rpcUrl: string, privateKey?: `0x${string}`) { return createClient({ chain: testnetBradbury, endpoint: rpcUrl, ...(privateKey ? { account: createAccount(privateKey) } : {}) }); }
function statusFor(lifecycle: string, execution: unknown): ClaimStatus {
  if (lifecycle === "FINALIZED") return execution === ExecutionResult.FINISHED_WITH_RETURN ? "FINALIZED" : "FAILED";
  if (lifecycle === "UNDETERMINED") return "UNDETERMINED";
  if (["CANCELED", "VALIDATORS_TIMEOUT", "LEADER_TIMEOUT"].includes(lifecycle)) return "FAILED";
  if (["ACCEPTED", "READY_TO_FINALIZE"].includes(lifecycle)) return "CONSENSUS_REACHED";
  if (["PROPOSING", "COMMITTING", "REVEALING", "APPEAL_COMMITTING", "APPEAL_REVEALING"].includes(lifecycle)) return "VALIDATING";
  return "ADJUDICATION_PENDING";
}
function verdictFrom(value: unknown): Verdict | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result = value as Record<string, unknown>; const verdict = result.verdict;
  if (verdict !== "APPROVED" && verdict !== "DENIED" && verdict !== "ESCALATED") return undefined;
  const boolean = (name: string) => typeof result[name] === "boolean" ? result[name] : undefined;
  const string = (name: string) => typeof result[name] === "string" ? result[name] : undefined;
  return { verdict, confidence: typeof result.confidence === "number" ? result.confidence : undefined, coveredEvent: boolean("covered_event"), evidenceSufficient: boolean("evidence_sufficient"), lossSupported: boolean("loss_supported"), policyMatch: boolean("policy_match"), reasonCode: string("reason_code"), recommendedAction: string("recommended_action"), reasoningSummary: string("reasoning_summary"), timestamp: new Date().toISOString() };
}
/** Submit only; final state is subsequently recovered through refreshAdjudication. */
export async function submitAdjudication(_claim: Claim, canonical: string, hash: string): Promise<Transaction> {
  const { rpcUrl, privateKey, contractAddress } = settings();
  try {
    const result = await client(rpcUrl, privateKey).writeContract({ address: contractAddress, functionName: "adjudicate", args: [hash, canonical], value: BigInt(0) });
    const genlayerTransactionId = typeof result === "string" ? result : undefined;
    if (!genlayerTransactionId) throw new Error("GenLayerJS did not return a transaction ID.");
    return { genlayerTransactionId, contractAddress, network: "Bradbury", chainId: BRADBURY_CHAIN_ID, finalizationStatus: "PENDING", submittedAt: new Date().toISOString(), claimHash: hash, explorerUrl: `${explorerBase}/transactions/${genlayerTransactionId}` };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "GENLAYER_SUBMISSION_FAILED", "GenLayer did not accept the adjudication transaction. No verdict was created.", { cause: error instanceof Error ? error.message : "Unknown GenLayer error" });
  }
}
/** Polls authoritative transaction state. It never derives a business verdict itself. */
export async function refreshAdjudication(claim: Claim): Promise<Refresh | undefined> {
  const prior = claim.adjudication; if (!prior?.genlayerTransactionId) return undefined;
  let config: ReturnType<typeof settings>; try { config = settings(); } catch { return { adjudication: prior, status: claim.status }; }
  try {
    const live = await client(config.rpcUrl).getTransaction({ hash: prior.genlayerTransactionId as never });
    const lifecycle = typeof (live.statusName ?? live.status) === "string" ? (live.statusName ?? live.status) as string : String(live.status || "PENDING");
    const execution = live.txExecutionResultName; const next: Transaction = { ...prior, genlayerTransactionId: live.txId || live.hash || prior.genlayerTransactionId, finalizationStatus: lifecycle };
    const status = statusFor(lifecycle, execution);
    if (status !== "FINALIZED") { if (status === "FAILED") next.failureCode = execution === ExecutionResult.FINISHED_WITH_ERROR ? "EXECUTION_FAILED" : lifecycle; return { adjudication: next, status }; }
    const value = await client(config.rpcUrl).readContract({ address: config.contractAddress, functionName: "get_verdict", args: [claim.claimHash || prior.claimHash || ""] });
    const verdict = verdictFrom(value);
    if (!verdict) return { adjudication: { ...next, failureCode: "FINAL_VERDICT_UNAVAILABLE", failureMessage: "The transaction finalized but the contract did not return a valid structured verdict." }, status: "FAILED" };
    return { adjudication: { ...next, finalizedAt: new Date().toISOString() }, status: verdict.verdict, verdict };
  } catch { return { adjudication: prior, status: claim.status }; }
}
