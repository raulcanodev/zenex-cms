import { z } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function apiError(error: unknown): { status: number; error: string } {
  if (error instanceof ApiError) return { status: error.status, error: error.message };
  if (error instanceof z.ZodError) return { status: 400, error: error.issues.map(i => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") };
  // Never return Prisma errors, query parameters or credentials to clients/logs.
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2002") return { status: 409, error: "A record with this slug, language or email already exists" };
    if (error.code === "P2025") return { status: 404, error: "Record not found" };
    if (error.code === "P2003") return { status: 400, error: "Invalid related record" };
  }
  return { status: 500, error: "Internal server error" };
}
