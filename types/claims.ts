export type ClaimType = "AGENT_FAILURE" | "WALLET_RECOVERY" | "DIGITAL_CONTINUITY";
export type ClaimStatus = "DRAFT" | "SUBMITTED" | "EVIDENCE_PROCESSING" | "ADJUDICATION_PENDING" | "VALIDATING" | "CONSENSUS_REACHED" | "FINALIZED" | "APPROVED" | "DENIED" | "ESCALATED" | "FAILED" | "UNDETERMINED";
export type EvidenceStatus = "READY" | "UPLOADING" | "HASHING" | "UPLOADED" | "FAILED";
export type VerdictName = "APPROVED" | "DENIED" | "ESCALATED";

export interface Evidence { id: string; claimId?: string; filename: string; mimeType: string; size: number; hash?: string; status: EvidenceStatus; createdAt?: string; }
export interface Transaction { evmTransactionId?: string; genlayerTransactionId?: string; contractAddress?: string; network?: string; chainId?: number; finalizationStatus?: string; explorerUrl?: string; submittedAt?: string; finalizedAt?: string; }
export interface Verdict { verdict: VerdictName; confidence?: number; coveredEvent?: boolean; evidenceSufficient?: boolean; lossSupported?: boolean; policyMatch?: boolean; reasonCode?: string; recommendedAction?: string; recommendedPayout?: number; reasoningSummary?: string; timestamp?: string; }
export interface Claim { id: string; type: ClaimType; title: string; description: string; incidentAt: string; lossAmount: number; currency: string; agentIdentifier?: string; referenceId?: string; policyId?: string; status: ClaimStatus; createdAt: string; evidence?: Evidence[]; adjudication?: Transaction; verdict?: Verdict; }
export interface ClaimDraft { type: ClaimType; title: string; description: string; incidentAt: string; lossAmount: string; currency: string; agentIdentifier: string; referenceId: string; policyId: string; }
