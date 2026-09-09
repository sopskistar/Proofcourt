import { NextResponse } from "next/server";
export class ApiError extends Error { constructor(public status: number, public code: string, message: string, public extra: Record<string, unknown> = {}) { super(message); } }
export const fail = (error: unknown) => error instanceof ApiError ? NextResponse.json({ code: error.code, message: error.message, ...error.extra }, { status: error.status }) : NextResponse.json({ code: "INTERNAL_ERROR", message: "The request could not be completed." }, { status: 500 });
