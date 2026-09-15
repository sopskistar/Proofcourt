import { NextResponse } from "next/server";
export class ApiError extends Error { constructor(public status: number, public code: string, message: string, public extra: Record<string, unknown> = {}) { super(message); } }
const safeMessage = (error: unknown) => (error instanceof Error ? `${error.name}: ${error.message}` : String(error)).replace(/(?:postgres(?:ql)?|https?):\/\/[^\s@/]+@/gi, "[REDACTED_CONNECTION]@");
export const fail = (error: unknown) => {
  console.error("ProofCourt API error:", safeMessage(error));
  return error instanceof ApiError ? NextResponse.json({ code: error.code, message: error.message, ...error.extra }, { status: error.status }) : NextResponse.json({ code: "INTERNAL_ERROR", message: "The request could not be completed." }, { status: 500 });
};
