import type { Metadata } from "next";
import { VerdictScreen } from "@/components/verdict";
export const metadata: Metadata = { title: "Claim Verdict" };
export default async function VerdictPage({ params }: { params: Promise<{ claimId: string }> }) { const { claimId } = await params; return <VerdictScreen claimId={claimId} />; }
