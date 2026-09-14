export type ClaimType = "AGENT_FAILURE" | "WALLET_RECOVERY" | "DIGITAL_CONTINUITY";
export type ClaimStatus = "DRAFT" | "SUBMITTED" | "EVIDENCE_PROCESSING" | "ADJUDICATION_PENDING" | "VALIDATING" | "CONSENSUS_REACHED" | "FINALIZED" | "APPROVED" | "DENIED" | "ESCALATED" | "FAILED" | "UNDETERMINED";
export type EvidenceStatus = "READY" | "UPLOADING" | "HASHING" | "UPLOADED" | "FAILED";
export type VerdictName = "APPROVED" | "DENIED" | "ESCALATED";
export type OnchainVerificationStatus = "NOT_PROVIDED" | "LOCATED" | "INVALID_REFERENCE" | "UNAVAILABLE";

export interface Evidence { id: string; claimId?: string; filename: string; mimeType: string; size: number; hash?: string; status: EvidenceStatus; createdAt?: string; }
/** Objective transaction metadata. It does not establish that claim evidence is truthful or related to the transaction. */
export interface OnchainVerification { method: "GENLAYER_TRANSACTION_LOOKUP"; status: OnchainVerificationStatus; reference?: string; transactionId?: string; sender?: string; recipient?: string; value?: string; lifecycle?: string; executionResult?: string; observedAt: string; message: string; }
export interface Transaction { id?: string; evmTransactionId?: string; genlayerTransactionId?: string; contractAddress?: string; network?: string; chainId?: number; finalizationStatus?: string; explorerUrl?: string; submittedAt?: string; finalizedAt?: string; claimHash?: string; failureCode?: string; failureMessage?: string; }
export interface Verdict { verdict: VerdictName; confidence?: number; coveredEvent?: boolean; evidenceSufficient?: boolean; lossSupported?: boolean; policyMatch?: boolean; reasonCode?: string; recommendedAction?: string; recommendedPayout?: number; reasoningSummary?: string; timestamp?: string; }
export interface Claim { id: string; type: ClaimType; incidentCategory?: string; title: string; description: string; incidentAt: string; lossAmount: number; currency: string; agentIdentifier?: string; referenceId?: string; policyId?: string; status: ClaimStatus; createdAt: string; updatedAt?: string; claimHash?: string; evidence?: Evidence[]; onchainVerification?: OnchainVerification; adjudication?: Transaction; verdict?: Verdict; }
export interface ClaimDraft { type: ClaimType; incidentCategory: string; title: string; description: string; incidentAt: string; lossAmount: string; currency: string; agentIdentifier: string; referenceId: string; policyId: string; }
