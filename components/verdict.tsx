"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, CircleCheck, CircleX, Scale, ShieldAlert } from "lucide-react";
import { claimApi } from "@/services/claims";
import type { Claim } from "@/types/claims";
import { dateTime, money } from "@/lib/format";

const icons = { APPROVED: CircleCheck, DENIED: CircleX, ESCALATED: ShieldAlert };
export function VerdictScreen({ claimId }: { claimId: string }) {
  const [claim, setClaim] = useState<Claim>(); const [error, setError] = useState(""); const [open, setOpen] = useState(false);
  useEffect(() => { claimApi.get(claimId).then(setClaim).catch(e => setError(e.message || "We couldn’t load this verdict.")); }, [claimId]);
  if (error) return <section className="container narrow state"><ShieldAlert /><h1>Verdict unavailable</h1><p>{error}</p><Link className="button" href={`/review/${claimId}`}>Return to review</Link></section>;
  if (!claim || !claim.verdict) return <section className="container narrow state"><Scale className="spin" /><h1>Verdict not ready</h1><p>The backend has not reported an authoritative final verdict yet.</p><Link className="button" href={`/review/${claimId}`}>Continue monitoring</Link></section>;
  const verdict = claim.verdict; const Icon = icons[verdict.verdict];
  return <section className="container verdict"><div className={`verdict-hero ${verdict.verdict.toLowerCase()}`}><Icon size={38} /><div><span>LIVE GENLAYER FINALIZED VERDICT</span><h1>{verdict.verdict}</h1><p>{verdict.reasoningSummary || "The finalized GenLayer contract result did not include a summary."}</p></div></div>
    <div className="verdict-grid"><section className="card"><h2>Court decision</h2><dl><dt>Claim ID</dt><dd>{claim.id}</dd><dt>Claim type</dt><dd>{claim.type.replaceAll("_", " ")}</dd><dt>Incident category</dt><dd>{claim.incidentCategory || "Not recorded"}</dd><dt>Loss amount</dt><dd>{money(claim.lossAmount, claim.currency)}</dd><dt>Evidence status</dt><dd>{claim.evidence?.length || 0} hashed item(s)</dd><dt>Consensus status</dt><dd>{claim.adjudication?.finalizationStatus || claim.status}</dd><dt>Confidence</dt><dd>{verdict.confidence != null ? `${verdict.confidence}%` : "Not provided"}</dd><dt>Reason code</dt><dd>{verdict.reasonCode || "Not provided"}</dd><dt>Recommended action</dt><dd>{verdict.recommendedAction || "Not provided"}</dd></dl></section><section className="card"><h2>Evidence record</h2>{claim.evidence?.length ? <ul className="evidence-list">{claim.evidence.map((item, index) => <li key={item.id}><span className="evidence-number">{index + 1}</span><div><strong>{item.filename}</strong><span>{item.hash ? `SHA-256: ${item.hash}` : "Hash not available"}</span></div></li>)}</ul> : <p>No evidence metadata was supplied.</p>}</section></div>
    <section className="details"><button aria-expanded={open} onClick={() => setOpen(!open)}>Technical details <ChevronDown size={18} className={open ? "rotate" : ""} /></button>{open && <dl><dt>GenLayer transaction ID</dt><dd>{claim.adjudication?.genlayerTransactionId || "Not available"}</dd><dt>EVM transaction hash</dt><dd>{claim.adjudication?.evmTransactionId || "Not available"}</dd><dt>Contract</dt><dd>{claim.adjudication?.contractAddress || "Not available"}</dd><dt>Network</dt><dd>{claim.adjudication?.network || "Not available"}</dd><dt>Finalized at</dt><dd>{dateTime(verdict.timestamp || claim.adjudication?.finalizedAt)}</dd></dl>}</section></section>;
}
