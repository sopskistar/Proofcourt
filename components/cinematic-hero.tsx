"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const stages = ["Evidence", "Verification", "Consensus", "Verdict", "Finality"];

/** Decorative, lightweight CSS/SVG product illustration; it has no live claim state. */
export function CinematicHero() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) { setActive(stages.length - 1); return; }
    const timer = window.setInterval(() => setActive(value => (value + 1) % stages.length), 1800);
    return () => window.clearInterval(timer);
  }, []);
  return <section className="pc-hero"><div className="pc-shell pc-hero-grid"><div className="pc-hero-copy"><p className="pc-kicker">ProofCourt <i /> GenLayer intelligent contract</p><h1>The decentralized<br />adjudication layer<br />for the agentic economy.</h1><p className="pc-hero-tagline">Evidence. Consensus. Verdict.</p><p className="pc-hero-summary">ProofCourt turns disputed digital events into an evidence-based adjudication workflow powered by GenLayer.</p><div className="pc-hero-actions"><Link className="button" href="/claim">Submit a claim <ArrowRight size={17} /></Link><Link className="pc-text-link" href="/#how-it-works">See how it works <ArrowDownRight size={17} /></Link></div></div><div className="pc-core-wrap" aria-label="Illustrative adjudication core"><div className="pc-core-grid" aria-hidden="true" /><div className="pc-core-orbit pc-orbit-one" aria-hidden="true" /><div className="pc-core-orbit pc-orbit-two" aria-hidden="true" /><div className="pc-core"><span>PC</span><i /><i /><i /><i /></div><div className="pc-core-card pc-core-evidence"><small>01 / INPUT</small><strong>Evidence packet</strong><em>SHA-256</em></div><div className="pc-core-card pc-core-verdict"><small>04 / OUTPUT</small><strong>Verdict</strong><em>AUTHORITATIVE</em></div><div className="pc-core-route" aria-hidden="true"><i /><i /><i /></div><ol className="pc-core-stages">{stages.map((stage, index) => <li className={index <= active ? "is-active" : ""} key={stage}><span>{String(index + 1).padStart(2, "0")}</span>{stage}</li>)}</ol></div></div></section>;
}
