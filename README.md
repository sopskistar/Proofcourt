# ProofCourt

ProofCourt is a Next.js frontend for AI-agent liability claims adjudicated by a GenLayer-backed backend.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and supply server-side values in the backend environment only. `GENLAYER_PRIVATE_KEY` must never be placed in `NEXT_PUBLIC_*` variables or browser code.

The frontend uses Bradbury display configuration from `lib/network.ts` (RPC `https://rpc-bradbury.genlayer.com`, chain ID `4221`). It does not submit GenLayer transactions directly: production writes remain server-side.

## Backend contract

This repository was initialized without a backend. The live UI expects these authoritative routes:

- `POST /api/claims` — accepts the claim draft and `Idempotency-Key`
- `POST /api/claims/:id/evidence` — multipart `file`; backend validates, stores off-chain, and returns authoritative hash
- `POST /api/claims/:id/adjudicate` — accepts `Idempotency-Key`; returns an existing active adjudication on conflict
- `GET /api/claims/:id` — returns claim, evidence, adjudication transaction IDs/status, and final verdict where available
- `GET /api/claims/:id/verdict` — optional structured final verdict route

The UI deliberately does not manufacture a verdict or infer finality from an EVM transaction. It polls the claim resource with backoff and stops only at terminal backend states.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Scope

Demo mode is deterministic, client-only, and labelled `SIMULATED`; it never writes to the live API or GenLayer.
