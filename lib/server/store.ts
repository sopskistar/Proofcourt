import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { Claim, ClaimDraft, Evidence, Transaction } from "@/types/claims";

type StoredClaim = Claim & { idempotencyKey?: string; evidence: Evidence[]; files: Record<string, string>; claimHash?: string };
type PublicClaim = Omit<StoredClaim, "files" | "idempotencyKey">;
type ClaimRow = { data: StoredClaim };
type EvidenceRow = { data: Evidence };

let schemaPromise: Promise<void> | undefined;

function database() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("ProofCourt persistence is unavailable because DATABASE_URL is not configured.");
  return neon(connectionString);
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = database();
      await sql`
        CREATE TABLE IF NOT EXISTS proofcourt_claims (
          id TEXT PRIMARY KEY,
          idempotency_key TEXT UNIQUE,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS proofcourt_evidence (
          id TEXT PRIMARY KEY,
          claim_id TEXT NOT NULL REFERENCES proofcourt_claims(id) ON DELETE CASCADE,
          evidence_hash TEXT NOT NULL,
          data JSONB NOT NULL,
          bytes BYTEA NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (claim_id, evidence_hash)
        )
      `;
    })().catch(error => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}

const clone = <T>(value: T) => JSON.parse(JSON.stringify(value)) as T;
const publicClaim = (claim: StoredClaim): PublicClaim => {
  const { files, idempotencyKey, ...safe } = clone(claim);
  void files;
  void idempotencyKey;
  return safe;
};

async function evidenceFor(claimId: string): Promise<Evidence[]> {
  const sql = database();
  const rows = await sql`SELECT data FROM proofcourt_evidence WHERE claim_id = ${claimId} ORDER BY created_at ASC` as EvidenceRow[];
  return rows.map(row => clone(row.data));
}

async function storedClaim(id: string): Promise<StoredClaim | undefined> {
  await ensureSchema();
  const sql = database();
  const rows = await sql`SELECT data FROM proofcourt_claims WHERE id = ${id}` as ClaimRow[];
  const claim = rows[0]?.data;
  if (!claim) return undefined;
  return { ...clone(claim), evidence: await evidenceFor(id) };
}

async function saveClaim(claim: StoredClaim) {
  await ensureSchema();
  const sql = database();
  await sql`
    UPDATE proofcourt_claims
    SET data = ${JSON.stringify(claim)}::jsonb, updated_at = NOW()
    WHERE id = ${claim.id}
  `;
}

export const store = {
  async create(draft: ClaimDraft, idempotencyKey?: string) {
    await ensureSchema();
    const sql = database();
    if (idempotencyKey) {
      const existing = await sql`SELECT data FROM proofcourt_claims WHERE idempotency_key = ${idempotencyKey}` as ClaimRow[];
      if (existing[0]?.data) return publicClaim({ ...clone(existing[0].data), evidence: await evidenceFor(existing[0].data.id) });
    }
    const now = new Date().toISOString();
    const claim: StoredClaim = {
      id: `PC-${randomUUID()}`,
      type: draft.type,
      incidentCategory: draft.incidentCategory,
      title: draft.title,
      description: draft.description,
      incidentAt: new Date(draft.incidentAt).toISOString(),
      lossAmount: Number(draft.lossAmount),
      currency: draft.currency,
      agentIdentifier: draft.agentIdentifier || undefined,
      referenceId: draft.referenceId || undefined,
      onchainExpectedSender: draft.onchainExpectedSender || undefined,
      onchainExpectedRecipient: draft.onchainExpectedRecipient || undefined,
      onchainExpectedValue: draft.onchainExpectedValue || undefined,
      policyId: draft.policyId || undefined,
      status: "SUBMITTED",
      createdAt: now,
      updatedAt: now,
      idempotencyKey,
      evidence: [],
      files: {},
    };
    try {
      await sql`
        INSERT INTO proofcourt_claims (id, idempotency_key, data)
        VALUES (${claim.id}, ${idempotencyKey || null}, ${JSON.stringify(claim)}::jsonb)
      `;
    } catch (error: unknown) {
      if (!idempotencyKey || (error as { code?: string }).code !== "23505") throw error;
      const existing = await sql`SELECT data FROM proofcourt_claims WHERE idempotency_key = ${idempotencyKey}` as ClaimRow[];
      if (!existing[0]?.data) throw error;
      return publicClaim({ ...clone(existing[0].data), evidence: await evidenceFor(existing[0].data.id) });
    }
    return publicClaim(claim);
  },

  async get(id: string) {
    const claim = await storedClaim(id);
    return claim ? publicClaim(claim) : undefined;
  },

  async evidence(id: string) {
    const claim = await storedClaim(id);
    return claim ? clone(claim.evidence) : undefined;
  },

  async addEvidence(id: string, item: Evidence, bytes: Buffer) {
    const claim = await storedClaim(id);
    if (!claim) return undefined;
    const duplicate = claim.evidence.find(value => value.hash === item.hash);
    if (duplicate) return clone(duplicate);
    const sql = database();
    const inserted = await sql`
      INSERT INTO proofcourt_evidence (id, claim_id, evidence_hash, data, bytes)
      VALUES (${item.id}, ${id}, ${item.hash || ""}, ${JSON.stringify(item)}::jsonb, ${bytes})
      ON CONFLICT (claim_id, evidence_hash) DO NOTHING
      RETURNING data
    ` as EvidenceRow[];
    if (!inserted[0]?.data) {
      const existing = await sql`SELECT data FROM proofcourt_evidence WHERE claim_id = ${id} AND evidence_hash = ${item.hash || ""}` as EvidenceRow[];
      return existing[0]?.data ? clone(existing[0].data) : undefined;
    }
    claim.evidence.push(item);
    claim.files[item.id] = `postgres:evidence:${item.id}`;
    claim.updatedAt = new Date().toISOString();
    await saveClaim(claim);
    return clone(item);
  },

  async setAdjudication(id: string, adjudication: Transaction, hash: string) {
    const claim = await storedClaim(id);
    if (!claim) return undefined;
    claim.adjudication = adjudication;
    claim.claimHash = hash;
    claim.status = "ADJUDICATION_PENDING";
    claim.updatedAt = new Date().toISOString();
    await saveClaim(claim);
    return publicClaim(claim);
  },

  async update(id: string, values: Partial<Pick<StoredClaim, "status" | "onchainVerification" | "adjudication" | "verdict">>) {
    const claim = await storedClaim(id);
    if (!claim) return undefined;
    Object.assign(claim, values, { updatedAt: new Date().toISOString() });
    await saveClaim(claim);
    return publicClaim(claim);
  },
};
