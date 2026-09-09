import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/server/errors";
import { store } from "@/lib/server/store";
import { validateDraft } from "@/lib/server/validation";
export const runtime = "nodejs";
export async function POST(request: NextRequest) { try { const key = request.headers.get("Idempotency-Key") || undefined; return NextResponse.json(await store.create(validateDraft(await request.json()), key), { status: 201 }); } catch (error) { return fail(error); } }
