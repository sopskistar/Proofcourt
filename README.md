# ProofCourt

**Evidence. Consensus. Verdict.**

ProofCourt is an AI agent liability insurance court built on GenLayer consensus. A user submits a claim and off-chain evidence; the backend validates and canonicalizes that material, then a GenLayer Intelligent Contract is the sole authority for a final structured adjudication.

## Architecture

```
Frontend → Next.js API → durable local MVP store → evidence hashing/canonicalization
         → GenLayer InsuranceCourt → leader + independent validators
         → Equivalence Principle → Optimistic Democracy → final verdict
```

The backend never computes or overrides `APPROVED`, `DENIED`, or `ESCALATED`. It handles validation, persistence, off-chain files, SHA-256 hashing, canonical serialization, submission, and transaction monitoring. The frontend only renders the backend's authoritative final result.

## Current implementation status

The local MVP API, evidence pipeline, canonicalization, contract source, and server-only GenLayerJS signer adapter are present. Live Bradbury submission is fail-closed whenever `GENLAYER_PRIVATE_KEY`, `GENLAYER_CONTRACT_ADDRESS`, or the expected chain configuration is absent. It never manufactures a transaction ID or business verdict.

`contracts/InsuranceCourt.py` applies a deterministic policy matrix to the canonical claim and evidence-hash record. All decision-bearing fields, confidence, reason code, action, and summary are derived from that canonical input, so GenLayer validators execute equivalent logic rather than comparing independent LLM prose. A majority acceptance is handled by GenLayer's Optimistic Democracy; an undetermined transaction must not update contract state. See the current [Equivalence Principle documentation](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle).

## API

- `POST /api/claims` — validates a claim. Send `Idempotency-Key` to make retries return the same claim.
- `POST /api/claims/:id/evidence` — multipart `file`; accepts PDF, JPG/JPEG, PNG, TXT up to 10 MB. Files are private/off-chain and SHA-256 hashed server-side. Duplicate bytes within a claim return existing metadata.
- `GET /api/claims/:id/evidence` — evidence metadata only; never raw files.
- `POST /api/claims/:id/adjudicate` — requires uploaded evidence, creates deterministic canonical input and claim hash, and submits only when live GenLayer configuration is complete. An active adjudication is returned rather than duplicated.
- `GET /api/claims/:id` — resumable claim state, evidence metadata, transaction references, and final verdict when authoritative.
- `GET /api/claims/:id/verdict` — returns only a final authoritative verdict; otherwise `409 VERDICT_NOT_READY`.

## Canonicalization

`lib/server/canonicalize.ts` normalizes string whitespace and line endings, serializes a fixed schema with fixed field order, normalizes the incident timestamp to ISO-8601, fixes loss amounts to two decimals, uppercases currency, and sorts evidence by hash/MIME type/size. SHA-256 is then taken over that canonical JSON. UI-only fields, generated IDs, filenames, storage paths, timestamps, and insertion order do not affect the claim hash.

## Persistence and recovery

For this self-hosted MVP, `.proofcourt-data/claims.json` and private evidence files provide restart persistence with atomic database replacement. Set `PROOFCOURT_DATA_DIR` to a durable mounted volume in deployment. This filesystem store is not appropriate for stateless/serverless production; replace it with a transactional database and private object storage before production. The directory is ignored by Git.

## Environment

Copy `.env.example` to `.env.local`. All GenLayer values are server-only; never use `NEXT_PUBLIC_` for them and never commit `.env.local`.

```bash
GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
GENLAYER_PRIVATE_KEY=
GENLAYER_CONTRACT_ADDRESS=
GENLAYER_CHAIN_ID=4221
PROOFCOURT_DATA_DIR=
```

Bradbury currently uses the GenLayer RPC above, chain ID `4221`, and `GEN`; verify this against the [official network documentation](https://docs.genlayer.com/developers/networks) before deployment.

## Development and deployment

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

Deploy `contracts/InsuranceCourt.py` through the current GenLayer CLI or Studio workflow, record the verified address in `.env.local`, and configure the server-side signer before enabling live submission. Do not treat EVM submission as finality; monitor the GenLayer lifecycle and persist only the authoritative finalized contract result.

## Demo versus live mode

Demo mode is explicitly simulated and client-only. It never calls these APIs, submits a transaction, or changes live data. Live submission occurs only when a user completes the claim flow and presses Submit Claim.

## Security

- Raw evidence stays off-chain and is never logged or returned through metadata endpoints.
- Private keys, seed phrases, credentials, evidence contents, and internal paths are never returned by the API.
- Request validation, supported-type limits, content size limits, SHA-256 deduplication, idempotency, and safe error envelopes are enforced server-side.
- The contract stores a canonical claim hash and structured result, not raw evidence.

## Known limitations

The MVP filesystem store is for self-hosted development only. A production deployment needs transactional persistence, private object storage, operational monitoring, and an insurance-policy/legal review. A GenLayer transaction that reaches `UNDETERMINED`, timeout, or another infrastructure lifecycle state is displayed as such and is never converted into a business verdict.
