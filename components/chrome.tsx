"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
export function Brand() { return <Link href="/" className="brand" aria-label="ProofCourt home"><span className="brand-mark"><Scale size={18} /></span>ProofCourt</Link>; }
const links = [["How it works", "/#how-it-works"], ["Claim types", "/#claim-types"], ["Why GenLayer", "/#why-genlayer"], ["Roadmap", "/#roadmap"], ["Demo", "/demo"]] as const;
export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  useEffect(() => { document.body.classList.toggle("menu-open", open); return () => document.body.classList.remove("menu-open"); }, [open]);
  return <header className="site-header"><div className="container nav"><Brand /><button className={`menu-toggle ${open ? "is-open" : ""}`} onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="main-menu" aria-label={open ? "Close menu" : "Open menu"}><i /><i /></button><nav id="main-menu" className={open ? "is-open" : ""} aria-label="Main navigation">{links.map(([label, href]) => <Link href={href} onClick={() => setOpen(false)} key={label}>{label}</Link>)}<Link className="button button-small" href="/claim" onClick={() => setOpen(false)}>Submit claim</Link></nav></div></header>;
}
export function Footer() { return <footer className="footer"><div className="container footer-grid"><div><Brand /><p>Agent Liability Insurance powered by GenLayer Consensus.</p></div><div><strong>Explore</strong><Link href="/#how-it-works">How It Works</Link><Link href="/#claim-types">Claim Types</Link><Link href="/claim">Submit Claim</Link><Link href="/demo">Demo</Link></div><div><strong>Contact</strong><a href="https://github.com/sopskistar" target="_blank" rel="noreferrer">GitHub</a><a href="https://x.com/sopskistar" target="_blank" rel="noreferrer">X</a><a href="https://t.me/Sopski" target="_blank" rel="noreferrer">Telegram</a></div></div></footer>; }
