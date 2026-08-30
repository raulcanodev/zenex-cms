import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "./errors";
import type { ApiScope } from "./scopes";

export type ApiPrincipal = { blogId: string; publicBlogId: string; keyId: string; scopes: string[] };
export function hashApiKey(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function generateApiKey() {
  const token = `znx_${randomBytes(32).toString("base64url")}`;
  return { token, tokenHash: hashApiKey(token), prefix: token.slice(0, 12) };
}
export function requireScope(principal: Pick<ApiPrincipal, "scopes">, scope: ApiScope) {
  if (!principal.scopes.includes(scope)) throw new ApiError(403, `Missing scope: ${scope}`);
}

// An atomic database counter is shared across replicas; no process-local limiter.
export async function authenticateApiKey(request: Request, publicBlogId?: string): Promise<ApiPrincipal> {
  const match = /^Bearer (znx_[A-Za-z0-9_-]{43})$/i.exec(request.headers.get("authorization") || "");
  if (!match) throw new ApiError(401, "A valid Bearer API key is required");
  const key = await prisma.apiKey.findUnique({
    where: { tokenHash: hashApiKey(match[1]) },
    include: { blog: { select: { blogId: true } } },
  });
  if (!key || key.revokedAt || key.expiresAt <= new Date()) throw new ApiError(401, "Invalid or expired API key");
  if (publicBlogId && key.blog.blogId !== publicBlogId) throw new ApiError(403, "API key does not grant access to this blog");
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE "ApiKey" SET
      "rateCount" = CASE WHEN "rateWindow" <= NOW() - INTERVAL '1 minute' THEN 1 ELSE "rateCount" + 1 END,
      "rateWindow" = CASE WHEN "rateWindow" <= NOW() - INTERVAL '1 minute' THEN NOW() ELSE "rateWindow" END,
      "lastUsedAt" = NOW()
    WHERE "id" = ${key.id} AND "revokedAt" IS NULL AND "expiresAt" > NOW()
      AND ("rateWindow" <= NOW() - INTERVAL '1 minute' OR "rateCount" < 120)
    RETURNING "id"
  `;
  if (!rows.length) throw new ApiError(429, "Rate limit exceeded or key no longer active; retry in 60 seconds");
  return { blogId: key.blogId, publicBlogId: key.blog.blogId, keyId: key.id, scopes: key.scopes };
}
