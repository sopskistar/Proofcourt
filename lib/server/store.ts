import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Claim, ClaimDraft, Evidence, Transaction } from "@/types/claims";

type StoredClaim = Claim & { idempotencyKey?: string; evidence: Evidence[]; files: Record<string, string>; claimHash?: string };
type Database = { claims: StoredClaim[] };
type PublicClaim = Omit<StoredClaim, "files" | "idempotencyKey">;
const dataDir = process.env.PROOFCOURT_DATA_DIR || join(process.cwd(), ".proofcourt-data");
const databasePath = join(dataDir, "claims.json");
let lock = Promise.resolve();
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));
const evidenceKeys = ["id", "claimId", "filename", "mimeType", "size", "hash", "status", "createdAt"] as const;
const claimKeys = ["id", "type", "incidentCategory", "title", "description", "incidentAt", "lossAmount", "currency", "agentIdentifier", "referenceId", "policyId", "status", "createdAt", "updatedAt", "claimHash", "evidence", "adjudication", "verdict", "idempotencyKey", "files"] as const;
const isEvidence = (value: unknown): value is Evidence => isRecord(value) && hasOnlyKeys(value, evidenceKeys) && typeof value.id === "string" && typeof value.filename === "string" && typeof value.mimeType === "string" && typeof value.size === "number" && typeof value.status === "string";
const isFiles = (value: unknown): value is Record<string, string> => isRecord(value) && Object.values(value).every(path => typeof path === "string");
function isStoredClaim(value: unknown): value is StoredClaim {
  return isRecord(value) && hasOnlyKeys(value, claimKeys) && typeof value.id === "string" && typeof value.type === "string" && typeof value.title === "string" && typeof value.description === "string" && typeof value.incidentAt === "string" && typeof value.lossAmount === "number" && typeof value.currency === "string" && typeof value.status === "string" && typeof value.createdAt === "string" && Array.isArray(value.evidence) && value.evidence.every(isEvidence) && isFiles(value.files) && (value.idempotencyKey === undefined || typeof value.idempotencyKey === "string");
}
function validateDatabase(value: unknown): Database {
  if (!isRecord(value) || !hasOnlyKeys(value, ["claims"]) || !Array.isArray(value.claims) || !value.claims.every(isStoredClaim)) throw new Error("ProofCourt persistence data is invalid.");
  return { claims: value.claims };
}
async function load(): Promise<Database> { try { return validateDatabase(JSON.parse(await readFile(databasePath, "utf8"))); } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { claims: [] }; throw error; } }
async function save(data: Database) { await mkdir(dataDir, { recursive: true }); const next = `${databasePath}.${randomUUID()}.tmp`; await writeFile(next, JSON.stringify(data), { mode: 0o600 }); await rename(next, databasePath); }
async function transaction<T>(fn: (data: Database) => Promise<T> | T): Promise<T> { const previous = lock; let unlock!: () => void; lock = new Promise<void>(resolve => { unlock = resolve; }); await previous; try { const data = await load(); const value = await fn(data); await save(data); return value; } finally { unlock(); } }
async function read<T>(fn: (data: Database) => T): Promise<T> { await lock; return fn(await load()); }
const clone = <T>(value: T) => JSON.parse(JSON.stringify(value)) as T;
const publicClaim = (claim: StoredClaim): PublicClaim => { const { files, idempotencyKey, ...safe } = clone(claim); void files; void idempotencyKey; return safe; };

export const store = {
  create(draft: ClaimDraft, idempotencyKey?: string) { return transaction(data => { const existing = idempotencyKey && data.claims.find(claim => claim.idempotencyKey === idempotencyKey); if (existing) return publicClaim(existing); const now = new Date().toISOString(); const claim: StoredClaim = { id: `PC-${randomUUID()}`, type: draft.type, incidentCategory: draft.incidentCategory, title: draft.title, description: draft.description, incidentAt: new Date(draft.incidentAt).toISOString(), lossAmount: Number(draft.lossAmount), currency: draft.currency, agentIdentifier: draft.agentIdentifier || undefined, referenceId: draft.referenceId || undefined, policyId: draft.policyId || undefined, status: "SUBMITTED", createdAt: now, updatedAt: now, idempotencyKey, evidence: [], files: {} }; data.claims.push(claim); return publicClaim(claim); }); },
  get(id: string) { return read(data => { const claim = data.claims.find(item => item.id === id); return claim ? publicClaim(claim) : undefined; }); },
  evidence(id: string) { return read(data => { const claim = data.claims.find(item => item.id === id); return claim ? clone(claim.evidence) : undefined; }); },
  addEvidence(id: string, item: Evidence, bytes: Buffer) { return transaction(async data => { const claim = data.claims.find(value => value.id === id); if (!claim) return undefined; const duplicate = claim.evidence.find(value => value.hash === item.hash); if (duplicate) return clone(duplicate); const evidenceDir = join(dataDir, "evidence", id); await mkdir(evidenceDir, { recursive: true }); const path = join(evidenceDir, item.id); await writeFile(path, bytes, { mode: 0o600 }); claim.files[item.id] = path; claim.evidence.push(item); claim.updatedAt = new Date().toISOString(); return clone(item); }); },
  setAdjudication(id: string, adjudication: Transaction, hash: string) { return transaction(data => { const claim = data.claims.find(item => item.id === id); if (!claim) return undefined; claim.adjudication = adjudication; claim.claimHash = hash; claim.status = "ADJUDICATION_PENDING"; claim.updatedAt = new Date().toISOString(); return publicClaim(claim); }); },
  update(id: string, values: Partial<Pick<StoredClaim, "status" | "adjudication" | "verdict">>) { return transaction(data => { const claim = data.claims.find(item => item.id === id); if (!claim) return undefined; Object.assign(claim, values, { updatedAt: new Date().toISOString() }); return publicClaim(claim); }); },
  dataDirectory: dataDir,
};
