import type { Metadata } from "next";
import { ReviewScreen } from "@/components/review";
export const metadata: Metadata = { title: "Claim Review" };
export default async function ReviewPage({ params }: { params: Promise<{ claimId: string }> }) { const { claimId } = await params; return <ReviewScreen claimId={claimId} />; }
