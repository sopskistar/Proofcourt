import { ApiError } from "@/lib/server/errors";
import type { ClaimDraft, ClaimType } from "@/types/claims";
const types = new Set<ClaimType>(["AGENT_FAILURE", "WALLET_RECOVERY", "DIGITAL_CONTINUITY"]);
export function validateDraft(value: unknown): ClaimDraft {
  if (!value || typeof value !== "object") throw new ApiError(400, "INVALID_BODY", "A claim body is required.");
  const draft = value as Record<string, unknown>;
  const text = (key: keyof ClaimDraft, max: number, required = false) => { const item = draft[key]; if (typeof item !== "string" || (required && !item.trim()) || item.length > max) throw new ApiError(422, "INVALID_CLAIM", `Invalid ${key}.`); return item.trim(); };
  const type = text("type", 40, true) as ClaimType; if (!types.has(type)) throw new ApiError(422, "INVALID_CLAIM_TYPE", "Unsupported claim type.");
  const incidentAt = text("incidentAt", 64, true); if (Number.isNaN(Date.parse(incidentAt))) throw new ApiError(422, "INVALID_INCIDENT_DATE", "Incident date is invalid.");
  const lossAmount = text("lossAmount", 32, true); if (!/^\d+(\.\d{1,2})?$/.test(lossAmount) || Number(lossAmount) <= 0) throw new ApiError(422, "INVALID_LOSS_AMOUNT", "Loss amount must be positive.");
  const currency = text("currency", 3, true).toUpperCase(); if (!/^[A-Z]{3}$/.test(currency)) throw new ApiError(422, "INVALID_CURRENCY", "Currency must be a three-letter code.");
  return { type, incidentCategory: text("incidentCategory", 120, true), title: text("title", 120, true), description: text("description", 4000, true), incidentAt, lossAmount, currency, agentIdentifier: text("agentIdentifier", 200), referenceId: text("referenceId", 200), policyId: text("policyId", 200) };
}
