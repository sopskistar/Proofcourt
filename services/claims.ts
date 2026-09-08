import type { Claim, ClaimDraft, Evidence, Verdict } from "@/types/claims";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `Request failed (${response.status})`) as Error & { status?: number; data?: unknown };
    error.status = response.status; error.data = body; throw error;
  }
  return response.json() as Promise<T>;
}
export const claimApi = {
  create: (draft: ClaimDraft, idempotencyKey: string) => request<Claim>("/api/claims", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(draft) }),
  uploadEvidence: (claimId: string, file: File) => { const data = new FormData(); data.append("file", file); return request<Evidence>(`/api/claims/${claimId}/evidence`, { method: "POST", body: data }); },
  adjudicate: (claimId: string, idempotencyKey: string) => request<Claim>(`/api/claims/${claimId}/adjudicate`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify({}) }),
  get: (claimId: string) => request<Claim>(`/api/claims/${claimId}`),
  getVerdict: (claimId: string) => request<Verdict>(`/api/claims/${claimId}/verdict`),
};
