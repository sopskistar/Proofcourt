import type { Metadata } from "next";
import { ClaimFlow } from "@/components/claim-flow";
export const metadata: Metadata = { title: "Submit Claim" };
export default function ClaimPage() { return <ClaimFlow />; }
