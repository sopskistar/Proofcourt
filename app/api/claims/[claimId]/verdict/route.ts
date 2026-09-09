import { NextRequest, NextResponse } from "next/server";
import { ApiError, fail } from "@/lib/server/errors";
import { store } from "@/lib/server/store";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) { try { const claim = await store.get((await params).claimId); if (!claim) throw new ApiError(404, "CLAIM_NOT_FOUND", "Claim not found."); if (!claim.verdict || !["APPROVED", "DENIED", "ESCALATED"].includes(claim.status)) throw new ApiError(409, "VERDICT_NOT_READY", "An authoritative final verdict is not available yet.", { claimId: claim.id }); const evidence = claim.evidence || []; return NextResponse.json({ ...claim.verdict, claimId: claim.id, claimHash: claim.claimHash, evidenceCount: evidence.length, evidenceHashes: evidence.map(item => item.hash), adjudication: claim.adjudication }); } catch (error) { return fail(error); } }
