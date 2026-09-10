import { NextRequest, NextResponse } from "next/server";
import { ApiError, fail } from "@/lib/server/errors";
import { refreshAdjudication } from "@/lib/server/genlayer";
import { store } from "@/lib/server/store";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) { try { const claim = await store.get((await params).claimId); if (!claim) throw new ApiError(404, "CLAIM_NOT_FOUND", "Claim not found."); const next = await refreshAdjudication(claim); if (next && (JSON.stringify(next.adjudication) !== JSON.stringify(claim.adjudication) || next.status !== claim.status || JSON.stringify(next.verdict) !== JSON.stringify(claim.verdict))) return NextResponse.json(await store.update(claim.id, { adjudication: next.adjudication, status: next.status, verdict: next.verdict })); return NextResponse.json(claim); } catch (error) { return fail(error); } }
