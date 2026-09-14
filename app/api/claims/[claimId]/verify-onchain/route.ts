import { NextRequest, NextResponse } from "next/server";
import { ApiError, fail } from "@/lib/server/errors";
import { verifyOnchainReference } from "@/lib/server/genlayer";
import { store } from "@/lib/server/store";

export const runtime = "nodejs";

/** Read-only, server-side Phase 2 transaction verification. It never submits a claim. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
  try {
    const claim = await store.get((await params).claimId);
    if (!claim) throw new ApiError(404, "CLAIM_NOT_FOUND", "Claim not found.");
    const onchainVerification = await verifyOnchainReference(claim.referenceId, claim);
    const updated = await store.update(claim.id, { onchainVerification });
    if (!updated) throw new ApiError(404, "CLAIM_NOT_FOUND", "Claim not found.");
    return NextResponse.json(updated.onchainVerification);
  } catch (error) {
    return fail(error);
  }
}
