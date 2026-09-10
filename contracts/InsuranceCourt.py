# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""ProofCourt GenLayer Intelligent Contract.

Raw evidence remains off-chain. This contract accepts a canonical claim hash and
evidence SHA-256 hashes. Its leader and validators independently evaluate the
same structured policy record; only an accepted GenLayer result changes state.
"""
from genlayer import *
import json
from dataclasses import dataclass


@allow_storage
@dataclass
class VerdictRecord:
    verdict: str
    covered_event: bool
    evidence_sufficient: bool
    loss_supported: bool
    policy_match: bool
    confidence: u8
    reason_code: str
    recommended_action: str
    reasoning_summary: str


def record_from_decision(value):
    return VerdictRecord(
        verdict=value["verdict"],
        covered_event=value["covered_event"],
        evidence_sufficient=value["evidence_sufficient"],
        loss_supported=value["loss_supported"],
        policy_match=value["policy_match"],
        confidence=value["confidence"],
        reason_code=value["reason_code"],
        recommended_action=value["recommended_action"],
        reasoning_summary=value["reasoning_summary"],
    )


def decision_from_record(record):
    return {
        "verdict": record.verdict,
        "covered_event": record.covered_event,
        "evidence_sufficient": record.evidence_sufficient,
        "loss_supported": record.loss_supported,
        "policy_match": record.policy_match,
        "confidence": record.confidence,
        "reason_code": record.reason_code,
        "recommended_action": record.recommended_action,
        "reasoning_summary": record.reasoning_summary,
    }


class InsuranceCourt(gl.Contract):
    # TreeMap is GenVM persistent storage; raw evidence is never stored on-chain.
    verdicts: TreeMap[str, VerdictRecord]

    def __init__(self):
        self.verdicts = TreeMap()

    @gl.public.view
    def get_verdict(self, claim_hash: str) -> dict | None:
        if claim_hash not in self.verdicts:
            return None
        return decision_from_record(self.verdicts[claim_hash])

    @gl.public.write
    def adjudicate(self, claim_hash: str, canonical_claim: str):
        if claim_hash in self.verdicts:
            return decision_from_record(self.verdicts[claim_hash])

        # The claim and evidence hashes are canonicalized by the server before
        # submission. Adjudication therefore uses a deterministic policy matrix:
        # every GenVM replica sees the same input and derives the same decision.
        #
        # The former implementation re-ran an LLM in every validator and compared
        # model-generated verdict labels, reason codes, and actions. Those fields
        # are inherently non-deterministic, so correct validators rejected valid
        # but differently worded model answers. Do not place LLM output on this
        # decision-bearing path unless it is validated through an appropriate
        # GenLayer equivalence principle.
        payload = json.loads(canonical_claim)
        claim = payload["claim"]
        evidence = payload["evidence"]

        claim_type = claim["type"]
        category = claim["incidentCategory"]
        loss_amount = claim["lossAmount"]
        policy_id = claim["policyId"]

        covered_event = claim_type in (
            "AGENT_FAILURE", "WALLET_RECOVERY", "DIGITAL_CONTINUITY"
        ) and category != ""
        evidence_sufficient = len(evidence) > 0 and all(
            item["hash"] != "" and item["size"] > 0 for item in evidence
        )
        # Avoid floating-point parsing in consensus code. Canonicalization emits a
        # fixed two-decimal string, and this deterministic check also rejects
        # malformed direct contract calls.
        loss_supported = (
            loss_amount != ""
            and all(character in "0123456789." for character in loss_amount)
            and loss_amount.count(".") <= 1
            and any(character in "123456789" for character in loss_amount)
        )
        policy_match = policy_id != ""

        if not covered_event:
            result = {
                "verdict": "DENIED",
                "covered_event": False,
                "evidence_sufficient": evidence_sufficient,
                "loss_supported": loss_supported,
                "policy_match": policy_match,
                "confidence": 96,
                "reason_code": "EVENT_OUT_OF_SCOPE",
                "recommended_action": "Review claim category and policy scope.",
                "reasoning_summary": "The submitted event is outside the supported ProofCourt claim categories.",
            }
        elif not evidence_sufficient:
            result = {
                "verdict": "ESCALATED",
                "covered_event": True,
                "evidence_sufficient": False,
                "loss_supported": loss_supported,
                "policy_match": policy_match,
                "confidence": 88,
                "reason_code": "EVIDENCE_INSUFFICIENT",
                "recommended_action": "Submit at least one complete hashed evidence record.",
                "reasoning_summary": "The claim cannot be resolved because the evidence record is incomplete.",
            }
        elif not loss_supported:
            result = {
                "verdict": "ESCALATED",
                "covered_event": True,
                "evidence_sufficient": True,
                "loss_supported": False,
                "policy_match": policy_match,
                "confidence": 88,
                "reason_code": "LOSS_UNSUPPORTED",
                "recommended_action": "Provide a positive, documented claimed loss amount.",
                "reasoning_summary": "The claim cannot be resolved because the loss amount is not supported.",
            }
        elif not policy_match:
            result = {
                "verdict": "ESCALATED",
                "covered_event": True,
                "evidence_sufficient": True,
                "loss_supported": True,
                "policy_match": False,
                "confidence": 88,
                "reason_code": "POLICY_REFERENCE_REQUIRED",
                "recommended_action": "Provide the applicable policy reference for review.",
                "reasoning_summary": "The claim cannot be resolved until the applicable policy reference is supplied.",
            }
        else:
            result = {
                "verdict": "APPROVED",
                "covered_event": True,
                "evidence_sufficient": True,
                "loss_supported": True,
                "policy_match": True,
                "confidence": 94,
                "reason_code": "COVERED_EVIDENCE_SUFFICIENT",
                "recommended_action": "Proceed with the documented policy claim process.",
                "reasoning_summary": "The canonical claim meets the configured coverage, evidence, loss, and policy-reference requirements.",
            }

        self.verdicts[claim_hash] = record_from_decision(result)
        return result
