"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const stages = ["Claim", "Evidence", "Verification", "Consensus", "Verdict", "Finality"];

/** Decorative product narrative only. It is deliberately separate from live claim state. */
export function CinematicHero() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 760px)");
    const updateMode = () => setStaticMode(reduced.matches || compact.matches);
    updateMode();
    reduced.addEventListener("change", updateMode);
    compact.addEventListener("change", updateMode);
    return () => { reduced.removeEventListener("change", updateMode); compact.removeEventListener("change", updateMode); };
  }, []);

  useEffect(() => {
    if (staticMode) { setProgress(1); return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      const bounds = node.getBoundingClientRect();
      const travel = Math.max(1, bounds.height - window.innerHeight);
      const next = Math.min(1, Math.max(0, -bounds.top / travel));
      setProgress(previous => Math.abs(previous - next) > .006 ? next : previous);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [staticMode]);

  const active = Math.min(stages.length - 1, Math.round(progress * (stages.length - 1)));
  const visualStyle = {
    "--hero-progress": progress,
    "--hero-visible": .25 + progress * .75,
    "--hero-orbit": `${115 * progress}deg`,
    "--hero-core-scale": .85 + progress * .15,
    "--ring-one-offset": `${560 * (1 - progress)}px`,
    "--ring-two-offset": `${390 * (1 - progress)}px`,
    "--fragment-one": `translate(${(1 - progress) * -45}px, ${(1 - progress) * 18}px) rotate(-13deg)`,
    "--fragment-two": `translate(${(1 - progress) * 45}px, ${(1 - progress) * -14}px) rotate(16deg)`,
    "--fragment-three": `translate(${(1 - progress) * 40}px, ${(1 - progress) * 25}px) rotate(8deg)`,
  } as CSSProperties;
  return <section ref={ref} className="hero-scene" aria-label="ProofCourt adjudication overview" style={visualStyle}>
    <div className="hero-scene-sticky container">
      <div className="hero-copy hero-choreography">
        <p className="eyebrow">ProofCourt</p>
        <h1><span>Evidence.</span> <span>Consensus.</span><br /><em>Verdict.</em></h1>
        <p className="lede">AI-powered insurance adjudication built on GenLayer.</p>
        <p className="lede hero-subhead">Submit evidence. Let GenLayer validators review. Receive a transparent verdict.</p>
        <div className="hero-actions"><Link className="button button-quiet" href="/demo">Run Demo</Link><Link className="button" href="/claim">Submit Claim <ArrowRight size={17} /></Link></div>
      </div>
      <div className="hero-cinematic glass-panel" aria-label="Illustrative ProofCourt adjudication visual">
        <span className="cinematic-caption">ILLUSTRATIVE ADJUDICATION VISUAL</span>
        <div className="cinematic-orbit" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <div className="cinematic-core" aria-hidden="true">
          <svg viewBox="0 0 240 240" role="presentation"><circle className="core-ring ring-one" cx="120" cy="120" r="89" /><circle className="core-ring ring-two" cx="120" cy="120" r="62" /><path className="core-path" d="M55 120 94 81l26 23 26-23 39 39-39 39-26-23-26 23z" /><path className="core-path core-path-small" d="M88 120h64M120 88v64" /></svg>
          <span className="core-seal">PC</span>
        </div>
        <div className="evidence-fragments" aria-hidden="true"><i /><i /><i /></div>
        <ol className="cinematic-stages">{stages.map((stage, index) => <li className={index <= active ? "active" : ""} key={stage}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage}</strong></li>)}</ol>
        <div className="cinematic-status"><span>SCROLL-DRIVEN PRODUCT EXPLAINER</span><b>{stages[active]}</b></div>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true"><i /> Scroll to trace the path</div>
    </div>
  </section>;
}
