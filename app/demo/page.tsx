import type { Metadata } from "next";
import { DemoScreen } from "@/components/demo";
export const metadata: Metadata = { title: "Demo Mode" };
export default function DemoPage() { return <DemoScreen />; }
