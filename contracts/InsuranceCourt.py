# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""ProofCourt GenLayer Intelligent Contract.

Raw evidence remains off-chain. This contract accepts a canonical claim hash and
evidence SHA-256 hashes. Its leader and validators independently evaluate the
same structured policy record; only an accepted GenLayer result changes state.
"""
from genlayer import *


class InsuranceCourt(gl.Contract):
    verdicts: dict[str, dict]

    def __init__(self):
        self.verdicts = {}

    @gl.public.write
    def adjudicate(self, claim_hash: str, canonical_claim: str):
        if claim_hash in self.verdicts:
            return self.verdicts[claim_hash]

        def evaluate():
            prompt = """You are adjudicating an AI agent liability insurance claim.
Evaluate the canonical claim below. Return JSON only with: verdict (APPROVED,
DENIED, or ESCALATED), covered_event (boolean), evidence_sufficient (boolean),
loss_supported (boolean), policy_match (boolean), confidence (integer 0-100),
reason_code (short stable code), recommended_action (short action), and
reasoning_summary (brief non-sensitive explanation). ESCALATED is required for
missing or contradictory evidence. Do not infer facts not represented here.
Canonical claim: """ + canonical_claim
            # response_format="json" returns a parsed dictionary in the current SDK.
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def valid_decision(value):
            required = {"verdict", "covered_event", "evidence_sufficient", "loss_supported", "policy_match", "confidence", "reason_code", "recommended_action", "reasoning_summary"}
            return (
                isinstance(value, dict)
                and set(value.keys()) == required
                and value["verdict"] in ("APPROVED", "DENIED", "ESCALATED")
                and all(type(value[field]) is bool for field in ("covered_event", "evidence_sufficient", "loss_supported", "policy_match"))
                and type(value["confidence"]) is int
                and 0 <= value["confidence"] <= 100
                and all(isinstance(value[field], str) and value[field].strip() for field in ("reason_code", "recommended_action", "reasoning_summary"))
            )

        def validate(leader_result):
            if not isinstance(leader_result, gl.vm.Return):
                return False
            leader = leader_result.calldata
            if not valid_decision(leader):
                return False
            validator = evaluate()
            if not valid_decision(validator):
                return False
            # Decision fields must independently match. Free-form summary is deliberately excluded.
            fields = ("verdict", "covered_event", "evidence_sufficient", "loss_supported", "policy_match", "reason_code", "recommended_action")
            # Confidence is an LLM quality score, so a 10-point absolute tolerance
            # allows minor calibration differences without changing the verdict.
            return all(leader[field] == validator[field] for field in fields) and abs(leader["confidence"] - validator["confidence"]) <= 10

        result = gl.vm.run_nondet_unsafe(evaluate, validate)
        self.verdicts[claim_hash] = result
        return result
