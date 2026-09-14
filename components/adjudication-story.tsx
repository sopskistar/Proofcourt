"use client";

import { useEffect, useRef, useState } from "react";

const stages = ["Claim", "Evidence", "Verification", "Consensus", "Verdict", "Finality"];

/** A decorative explainer only — it does not represent a live claim. */
export function AdjudicationStory() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      const bounds = node.getBoundingClientRect();
      const travel = Math.max(1, bounds.height - window.innerHeight);
      const next = Math.min(1, Math.max(0, -bounds.top / travel));
      setProgress(previous => Math.abs(previous - next) > 0.012 ? next : previous);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [reducedMotion]);

  const active = reducedMotion ? 5 : Math.min(5, Math.round(progress * 5));
  return <section ref={ref} className="story" aria-label="How ProofCourt adjudication works">
    <div className="story-sticky container">
      <div className="story-copy"><p className="eyebrow">The adjudication path</p><h2>From a claim to authoritative finality.</h2><p className="lede">A visual explanation of ProofCourt’s process. It is not a live claim status.</p></div>
      <div className="story-visual glass-panel" style={{ "--story-progress": progress } as React.CSSProperties}>
        <span className="story-kicker">SYSTEM EXPLAINER</span>
        <div className="story-rail" aria-hidden="true"><i /></div>
        <ol>{stages.map((stage, index) => <li className={index <= active ? "active" : ""} key={stage}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage}</strong><em>{index === active ? "Current chapter" : index < active ? "Explained" : "Next"}</em></li>)}</ol>
        <div className="validator-constellation" aria-label="Illustrative independent validator network"><span>Independent validator review</span><div aria-hidden="true"><i /><i /><i /><i /></div></div>
        <p className="story-note">ProofCourt renders authoritative outcomes only when they are returned by the existing claim workflow.</p>
      </div>
    </div>
  </section>;
}
