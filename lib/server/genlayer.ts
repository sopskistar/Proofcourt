import type { Claim, Transaction } from "@/types/claims";
import { ApiError } from "@/lib/server/errors";

const rpcUrl = () => process.env.GENLAYER_RPC_URL || "https://rpc-bradbury.genlayer.com";
const configured = () => Boolean(process.env.GENLAYER_PRIVATE_KEY && process.env.GENLAYER_CONTRACT_ADDRESS);
export async function refreshAdjudication(claim: Claim): Promise<Transaction | undefined> {
  const tx = claim.adjudication; if (!tx?.genlayerTransactionId) return tx;
  try { const response = await fetch(rpcUrl(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "gen_getTransactionLifecycle", params: [tx.genlayerTransactionId] }), signal: AbortSignal.timeout(8_000) }); const payload = await response.json() as { result?: unknown }; if (!response.ok || !payload.result) return tx; const lifecycle = String((payload.result as { status?: string }).status || payload.result).toUpperCase(); return { ...tx, finalizationStatus: lifecycle }; } catch { return tx; }
}
export async function submitAdjudication(claim: Claim, canonical: string, hash: string): Promise<Transaction> {
  void claim; void canonical; void hash;
  if (!configured()) throw new ApiError(503, "GENLAYER_NOT_CONFIGURED", "Live GenLayer adjudication is not configured. Set server-side contract and signer values after deploying InsuranceCourt.");
  throw new ApiError(503, "GENLAYER_SIGNER_UNAVAILABLE", "Live submission is disabled until the verified GenLayerJS signer adapter is installed and configured. No transaction was submitted.");
}
