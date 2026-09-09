import { NextRequest, NextResponse } from "next/server";
import { canonicalAdjudication, claimHash } from "@/lib/server/canonicalize";
import { ApiError, fail } from "@/lib/server/errors";
import { submitAdjudication } from "@/lib/server/genlayer";
import { store } from "@/lib/server/store";
export const runtime = "nodejs";
const active = new Set(["ADJUDICATION_PENDING", "VALIDATING", "CONSENSUS_REACHED"]);
export async function POST(_request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) { try { const claim = await store.get((await params).claimId); if (!claim) throw new ApiError(404, "CLAIM_NOT_FOUND", "Claim not found."); if (active.has(claim.status) && claim.adjudication) return NextResponse.json(claim); if (claim.status !== "SUBMITTED") throw new ApiError(409, "CLAIM_NOT_READY", "This claim cannot be adjudicated in its current state."); const evidence = claim.evidence || []; if (!evidence.length || evidence.some(item => !item.hash || item.status !== "UPLOADED")) throw new ApiError(422, "EVIDENCE_REQUIRED", "Upload processed evidence before requesting adjudication."); const canonical = canonicalAdjudication(claim, evidence); const hash = claimHash(claim, evidence); const transaction = await submitAdjudication(claim, canonical, hash); return NextResponse.json(await store.setAdjudication(claim.id, transaction, hash)); } catch (error) { return fail(error); } }
