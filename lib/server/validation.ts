import { ApiError } from "@/lib/server/errors";
import type { ClaimDraft, ClaimType } from "@/types/claims";
const types = new Set<ClaimType>(["AGENT_FAILURE", "WALLET_RECOVERY", "DIGITAL_CONTINUITY"]);
const immutableGithubRaw = /^https:\/\/raw\.githubusercontent\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/[0-9a-fA-F]{40}\/[A-Za-z0-9_./-]+$/;

/** Public sources are opt-in and immutable; the backend never fetches them. */
export function validatePublicEvidenceSource(url: unknown, assertion: unknown) {
  const source = typeof url === "string" ? url.trim() : "";
  const claim = typeof assertion === "string" ? assertion.trim() : "";
  if (!source && !claim) return { source: "", assertion: "" };
  if (!immutableGithubRaw.test(source)) throw new ApiError(422, "INVALID_PUBLIC_EVIDENCE_SOURCE", "Use an immutable HTTPS raw.githubusercontent.com URL pinned to a 40-character commit hash.");
  if (!claim || claim.length > 800) throw new ApiError(422, "INVALID_VERIFICATION_ASSERTION", "A public evidence source requires a verification assertion of up to 800 characters.");
  return { source, assertion: claim };
}
export function validateDraft(value: unknown): ClaimDraft {
  if (!value || typeof value !== "object") throw new ApiError(400, "INVALID_BODY", "A claim body is required.");
  const draft = value as Record<string, unknown>;
  const text = (key: keyof ClaimDraft, max: number, required = false) => { const item = draft[key]; if (typeof item !== "string" || (required && !item.trim()) || item.length > max) throw new ApiError(422, "INVALID_CLAIM", `Invalid ${key}.`); return item.trim(); };
  const type = text("type", 40, true) as ClaimType; if (!types.has(type)) throw new ApiError(422, "INVALID_CLAIM_TYPE", "Unsupported claim type.");
  const incidentAt = text("incidentAt", 64, true); if (Number.isNaN(Date.parse(incidentAt))) throw new ApiError(422, "INVALID_INCIDENT_DATE", "Incident date is invalid.");
  const lossAmount = text("lossAmount", 32, true); if (!/^\d+(\.\d{1,2})?$/.test(lossAmount) || Number(lossAmount) <= 0) throw new ApiError(422, "INVALID_LOSS_AMOUNT", "Loss amount must be positive.");
  const currency = text("currency", 3, true).toUpperCase(); if (!/^[A-Z]{3}$/.test(currency)) throw new ApiError(422, "INVALID_CURRENCY", "Currency must be a three-letter code.");
  const referenceId = text("referenceId", 200); const onchainExpectedSender = text("onchainExpectedSender", 42); const onchainExpectedRecipient = text("onchainExpectedRecipient", 42); const onchainExpectedValue = text("onchainExpectedValue", 80);
  if ((onchainExpectedSender || onchainExpectedRecipient || onchainExpectedValue) && !/^0x[0-9a-fA-F]{64}$/.test(referenceId)) throw new ApiError(422, "ONCHAIN_REFERENCE_REQUIRED", "Expected on-chain fields require a 32-byte GenLayer transaction reference.");
  if (onchainExpectedSender && !/^0x[0-9a-fA-F]{40}$/.test(onchainExpectedSender)) throw new ApiError(422, "INVALID_ONCHAIN_SENDER", "Expected sender must be an EVM address.");
  if (onchainExpectedRecipient && !/^0x[0-9a-fA-F]{40}$/.test(onchainExpectedRecipient)) throw new ApiError(422, "INVALID_ONCHAIN_RECIPIENT", "Expected recipient must be an EVM address.");
  if (onchainExpectedValue && !/^\d+(\.\d+)?$/.test(onchainExpectedValue)) throw new ApiError(422, "INVALID_ONCHAIN_VALUE", "Expected on-chain value must be a non-negative decimal string.");
  return { type, incidentCategory: text("incidentCategory", 120, true), title: text("title", 120, true), description: text("description", 4000, true), incidentAt, lossAmount, currency, agentIdentifier: text("agentIdentifier", 200), referenceId, onchainExpectedSender, onchainExpectedRecipient, onchainExpectedValue, policyId: text("policyId", 200) };
}
