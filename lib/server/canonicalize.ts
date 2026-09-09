import { createHash } from "node:crypto";
import type { Claim, Evidence } from "@/types/claims";

type CanonicalClaim = { version: 1; claim: { agentIdentifier: string; currency: string; description: string; incidentAt: string; lossAmount: string; policyId: string; referenceId: string; title: string; type: string }; evidence: { hash: string; mimeType: string; size: number }[] };
const normalize = (value?: string) => (value || "").trim().replace(/\r\n/g, "\n");
const decimal = (value: number) => value.toFixed(2);
export function canonicalAdjudication(claim: Claim, evidence: Evidence[]): string {
  const canonical: CanonicalClaim = { version: 1, claim: { type: claim.type, title: normalize(claim.title), description: normalize(claim.description), incidentAt: new Date(claim.incidentAt).toISOString(), lossAmount: decimal(claim.lossAmount), currency: normalize(claim.currency).toUpperCase(), agentIdentifier: normalize(claim.agentIdentifier), referenceId: normalize(claim.referenceId), policyId: normalize(claim.policyId) }, evidence: evidence.map(item => ({ hash: item.hash || "", mimeType: item.mimeType.toLowerCase(), size: item.size })).sort((a, b) => a.hash.localeCompare(b.hash) || a.mimeType.localeCompare(b.mimeType) || a.size - b.size) };
  return JSON.stringify(canonical);
}
export const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
export const claimHash = (claim: Claim, evidence: Evidence[]) => sha256(canonicalAdjudication(claim, evidence));
