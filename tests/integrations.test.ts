import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }));
import { generateApiKey, hashApiKey, requireScope } from "@/lib/integrations/auth";
import { apiError } from "@/lib/integrations/errors";
import { checkOrigin, readJson, MAX_JSON_BYTES } from "@/lib/integrations/http";
import { postCreateSchema, postUpdateSchema, createKeySchema } from "@/lib/integrations/schemas";
import { operationSchemas } from "@/src/server/services/content/service";
import { OPERATIONS } from "@/lib/integrations/catalog";
import { managementOpenApi } from "@/lib/integrations/openapi";
import { imageExtension } from "@/src/server/services/media/upload";
import { draftExample } from "@/lib/integrations/examples";
import { connectionConfig } from "@/scripts/mcp-stdio.mjs";

describe("integration schemas and secrets", () => {
  it("uses unique 256-bit tokens and stores only a digest", () => {
    const key = generateApiKey();
    expect(key.token).toMatch(/^znx_[A-Za-z0-9_-]{43}$/);
    expect(key.tokenHash).toBe(hashApiKey(key.token));
    expect(key.tokenHash).toHaveLength(64);
    expect(key.prefix).toHaveLength(12);
    expect(generateApiKey().token).not.toBe(key.token);
    expect(() => requireScope({ scopes: ["content:read"] }, "content:write")).toThrow("Missing scope");
  });
  it("defaults creates to drafts but never adds defaults to PATCH", () => {
    expect(postCreateSchema.parse({ title: "Hello", slug: "hello", content: { blocks: [] } })).toMatchObject({ language: "en", status: "draft" });
    expect(postUpdateSchema.parse({ title: "Changed" })).toEqual({ title: "Changed" });
    expect(postUpdateSchema.safeParse({}).success).toBe(false);
  });
  it.each([
    { userId: "other" }, { blogId: "other" }, { content: "markdown" },
    { categoryIds: ["one", "one"] }, { coverImage: "javascript:alert(1)" },
    { status: "hidden" }, { language: "invalid" }, { slug: "../../admin" },
    { publishedAt: "tomorrow" }, { publishedAt: "2026-01-01" },
  ])("rejects unsafe or ambiguous post fields %j", fields => {
    expect(postCreateSchema.safeParse({ ...draftExample, ...fields }).success).toBe(false);
  });
  it("validates key scope names and bounded expiry", () => {
    expect(createKeySchema.safeParse({ name: "a", scopes: ["admin"] }).success).toBe(false);
    expect(createKeySchema.safeParse({ name: "a", scopes: ["content:read"], expiresInDays: 366 }).success).toBe(false);
    expect(createKeySchema.safeParse({ name: "a", scopes: [] }).success).toBe(false);
  });
  it("has a schema and OpenAPI operation for every REST/MCP operation", () => {
    const spec = managementOpenApi();
    expect(new Set(OPERATIONS.map(o => o.name)).size).toBe(23);
    for (const op of OPERATIONS) {
      expect(operationSchemas[op.name]).toBeInstanceOf(z.ZodType);
      expect(spec.paths[`/api/v1/blogs/{blogId}${op.path}`][op.method.toLowerCase()]).toMatchObject({ operationId: op.name });
    }
    const patch = spec.paths["/api/v1/blogs/{blogId}/posts/{id}"].patch as { requestBody: { content: { "application/json": { schema: { properties: Record<string, unknown> } } } } };
    expect(patch.requestBody.content["application/json"].schema.properties).not.toHaveProperty("id");
  });
  it("does not expose internal database errors", () => {
    expect(apiError(new Error("connection with secret=password"))).toEqual({ status: 500, error: "Internal server error" });
    expect(apiError({ code: "P2002", meta: "private" }).status).toBe(409);
  });
});

describe("HTTP input protections", () => {
  const json = (body: string, headers = {}) => new Request("https://cms.example/api/mcp", { method: "POST", body, headers: { "Content-Type": "application/json", ...headers } });
  it("rejects cross-origin requests including null origins", () => {
    for (const origin of ["https://evil.example", "null"]) expect(() => checkOrigin(json("{}", { Origin: origin }))).toThrow("Origin not allowed");
    expect(() => checkOrigin(json("{}", { Origin: "https://cms.example" }))).not.toThrow();
    expect(() => checkOrigin(json("{}"))).not.toThrow();
  });
  it("rejects malformed JSON and non-JSON content types", async () => {
    await expect(readJson(json("{"))).rejects.toMatchObject({ status: 400 });
    await expect(readJson(json("{}", { "Content-Type": "text/plain" }))).rejects.toMatchObject({ status: 415 });
    await expect(readJson(json("{\"valid\":true}"))).resolves.toEqual({ valid: true });
  });
  it("bounds both declared and actual body size", async () => {
    await expect(readJson(json("{}", { "Content-Length": String(MAX_JSON_BYTES + 1) }))).rejects.toMatchObject({ status: 413 });
    await expect(readJson(json("a".repeat(MAX_JSON_BYTES + 1)))).rejects.toMatchObject({ status: 413 });
  });
});

describe("local bridge and media validation", () => {
  const key = generateApiKey().token;
  it.each(["http://cms.example", "https://user:pass@cms.example", "https://cms.example/?key=secret", "https://cms.example/path", "file:///etc/passwd"])("refuses credential-unsafe CMS URL %s", url => {
    expect(() => connectionConfig({ ZENEX_CMS_URL: url, ZENEX_API_KEY: key })).toThrow();
  });
  it("allows HTTPS and explicit local development", () => {
    expect(connectionConfig({ ZENEX_CMS_URL: "https://cms.example", ZENEX_API_KEY: key }).url.href).toBe("https://cms.example/api/mcp");
    expect(connectionConfig({ ZENEX_CMS_URL: "http://127.0.0.1:4444", ZENEX_API_KEY: key }).url.protocol).toBe("http:");
  });
  it("rejects content-type spoofing and SVG", () => {
    expect(() => imageExtension(Buffer.from("<svg onload='alert(1)'/>"), "image/png")).toThrow();
    expect(() => imageExtension(Buffer.from("<svg/>"), "image/svg+xml")).toThrow();
    expect(imageExtension(Buffer.from("89504e470d0a1a0a", "hex"), "image/png")).toBe("png");
  });
});
