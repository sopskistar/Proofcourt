import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/chrome";
export const metadata: Metadata = { title: { default: "ProofCourt — Agent Liability Insurance", template: "%s | ProofCourt" }, description: "ProofCourt uses GenLayer consensus to evaluate AI agent liability claims and deliver transparent verdicts." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Header /><main>{children}</main><Footer /></body></html>; }
