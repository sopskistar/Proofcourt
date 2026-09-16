"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, Scale, X } from "lucide-react";

export function Brand() { return <Link href="/" className="brand" aria-label="ProofCourt home"><span className="brand-mark"><Scale size={18} /></span>ProofCourt</Link>; }
const links = [["How it works", "/#how-it-works"], ["Claim types", "/#claim-types"], ["Why GenLayer", "/#why-genlayer"], ["Roadmap", "/#roadmap"], ["Demo", "/demo"]] as const;

export function Header() {
  const [open, setOpen] = useState(false); const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  useEffect(() => { const root = document.documentElement; document.body.classList.toggle("menu-open", open); root.classList.toggle("menu-open", open); if (open) requestAnimationFrame(() => closeButton.current?.focus()); return () => { document.body.classList.remove("menu-open"); root.classList.remove("menu-open"); }; }, [open]);
  const drawer = <nav className="mobile-drawer-panel" aria-label="Mobile navigation"><div className="mobile-drawer-head"><span>Navigate</span><button ref={closeButton} type="button" className="mobile-drawer-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button></div><div className="mobile-drawer-links">{links.map(([label, href], index) => <Link href={href} onClick={() => setOpen(false)} key={label}><span>0{index + 1}</span>{label}</Link>)}</div><Link className="button mobile-drawer-cta" href="/claim" onClick={() => setOpen(false)}>Submit a claim</Link><p>Evidence. Consensus. Verdict.</p></nav>;
  return <header className="site-header"><div className="container nav"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{links.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}<Link className="button button-small" href="/claim">Submit claim</Link></nav><button type="button" className="menu-toggle" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-navigation" aria-label="Open menu"><Menu size={21} /></button></div>{open && typeof document !== "undefined" ? createPortal(<div id="mobile-navigation" className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Site navigation"><button type="button" className="mobile-drawer-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />{drawer}</div>, document.body) : null}</header>;
}

export function Footer() { return <footer className="footer"><div className="container footer-grid"><div><Brand /><p>Agent liability adjudication powered by GenLayer Consensus.</p></div><div><strong>Explore</strong><Link href="/#how-it-works">How It Works</Link><Link href="/#claim-types">Claim Types</Link><Link href="/claim">Submit Claim</Link><Link href="/demo">Demo</Link></div><div><strong>Contact</strong><a href="https://github.com/sopskistar" target="_blank" rel="noreferrer">GitHub</a><a href="https://x.com/sopskistar" target="_blank" rel="noreferrer">X</a><a href="https://t.me/Sopski" target="_blank" rel="noreferrer">Telegram</a></div></div></footer>; }
