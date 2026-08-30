import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { API_SCOPES } from "@/lib/integrations/scopes";
import { draftExample } from "@/lib/integrations/examples";

const state = vi.hoisted(() => ({ db: null as unknown as PrismaClient, session: null as null | { user: { id: string; email: string } } }));
vi.mock("@/lib/prisma", () => ({ get prisma() { return state.db; } }));
vi.mock("@/lib/get-session", () => ({ getSession: async () => state.session }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
import * as rest from "@/app/api/v1/blogs/[blogId]/[[...path]]/route";
import { POST as mcpPost, GET as mcpGet } from "@/app/api/mcp/route";
import { GET as publicPosts } from "@/app/api/blogs/[blogId]/posts/route";
import { NextRequest } from "next/server";
import { generateApiKey, authenticateApiKey } from "@/lib/integrations/auth";
import { createApiKey, listApiKeys, revokeApiKey } from "@/src/server/services/api-keys/actions";
import { executeOperation } from "@/src/server/services/content/service";
import { createPost, updatePost } from "@/src/server/services/posts/mutations";

const connection = process.env.ZENEX_TEST_DATABASE_URL;
describe.runIf(!!connection)("isolated PostgreSQL management integration", () => {
  let blog: { id: string; blogId: string };
  let other: { id: string; blogId: string };
  let owner: { id: string; email: string };
  let token: string;
  let keyId: string;
  beforeAll(async () => {
    const url = new URL(connection!);
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== "/zenex_integration_test") throw new Error("Tests require the dedicated local zenex_integration_test database");
    state.db = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: connection, max: 10 })) });
  });
  beforeEach(async () => {
    await state.db.user.deleteMany({ where: { email: { endsWith: "@zenex.test" } } });
    owner = await state.db.user.create({ data: { email: "owner@zenex.test", name: "Owner" } });
    blog = await state.db.blog.create({ data: { userId: owner.id, name: "Test", slug: "test" } });
    other = await state.db.blog.create({ data: { userId: owner.id, name: "Other", slug: "other" } });
    state.session = { user: owner };
    const result = await createApiKey(blog.id, { name: "Test client", scopes: [...API_SCOPES], expiresInDays: 1 });
    expect(result.error).toBeUndefined();
    token = result.token!;
    keyId = (await listApiKeys(blog.id))[0].id;
  });
  afterAll(async () => {
    if (state.db) {
      await state.db.user.deleteMany({ where: { email: { endsWith: "@zenex.test" } } });
      await state.db.$disconnect();
    }
  });
  const request = (tokenValue: string | null = token) => new Request("http://localhost/api/mcp", { headers: tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {} });
  const call = async (method: "GET" | "POST" | "PATCH" | "DELETE", path = "", body?: unknown, key: string | null = token, target = blog.blogId, query = "") => {
    const req = new Request(`http://localhost/api/v1/blogs/${target}${path}${query}`, {
      method, headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return rest[method](req, { params: Promise.resolve({ blogId: target, path: path.split("/").filter(Boolean) }) });
  };
  const principal = () => ({ blogId: blog.id, publicBlogId: blog.blogId, keyId, scopes: [...API_SCOPES] });
  const rpc = (body: unknown, key = token) => mcpPost(new Request("http://localhost/api/mcp", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify(body) }));

  it("issues only hashes; owners can revoke and members cannot mint/list/revoke keys", async () => {
    const stored = await state.db.apiKey.findUniqueOrThrow({ where: { id: keyId } });
    expect(stored.tokenHash).not.toBe(token);
    expect(JSON.stringify(await listApiKeys(blog.id))).not.toContain(stored.tokenHash);
    const member = await state.db.user.create({ data: { email: "member@zenex.test" } });
    await state.db.blogMember.create({ data: { blogId: blog.id, userEmail: member.email } });
    state.session = { user: member };
    expect((await createApiKey(blog.id, { name: "bad", scopes: ["content:read"] })).error).toContain("owner");
    await expect(listApiKeys(blog.id)).rejects.toMatchObject({ status: 403 });
    expect((await revokeApiKey(blog.id, keyId)).error).toContain("owner");
    state.session = { user: owner };
    expect((await revokeApiKey(other.id, keyId)).error).toBe("Active API key not found");
    expect((await revokeApiKey(blog.id, keyId)).success).toBe(true);
    expect((await call("GET")).status).toBe(401);
  });
  it("rejects missing, unknown, expired and wrong-blog credentials without session fallback", async () => {
    expect((await call("GET", "", undefined, null)).status).toBe(401);
    expect((await call("GET", "", undefined, generateApiKey().token)).status).toBe(401);
    expect((await call("GET", "", undefined, token, other.blogId)).status).toBe(403);
    await state.db.apiKey.update({ where: { id: keyId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await call("GET")).status).toBe(401);
  });
  it("checks expiry in UTC even when PostgreSQL has a non-UTC timezone", async () => {
    await state.db.apiKey.update({ where: { id: keyId }, data: { expiresAt: new Date(Date.now() + 60_000) } });
    expect((await call("GET")).status).toBe(200);
  });
  it("enforces the shared 120-request limit atomically under concurrency and resets its window", async () => {
    await state.db.apiKey.update({ where: { id: keyId }, data: { rateCount: 118, rateWindow: new Date() } });
    const attempts = await Promise.all(Array.from({ length: 8 }, () => call("GET")));
    expect(attempts.filter(r => r.status === 200)).toHaveLength(2);
    expect(attempts.filter(r => r.status === 429)).toHaveLength(6);
    expect(attempts.find(r => r.status === 429)?.headers.get("retry-after")).toBe("60");
    await state.db.apiKey.update({ where: { id: keyId }, data: { rateWindow: new Date(Date.now() - 61_000) } });
    expect((await call("GET")).status).toBe(200);
  });
  it("provides CRUD for taxonomy/authors and protects cross-blog IDs", async () => {
    for (const [resource, fields] of [["categories", { description: "Example" }], ["tags", {}], ["authors", { email: "author@zenex.test" }]] as const) {
      const created = await call("POST", `/${resource}`, { name: "Example", slug: "example", ...fields });
      expect(created.status).toBe(201);
      const { data } = await created.json();
      expect((await call("GET", `/${resource}/${data.id}`)).status).toBe(200);
      expect((await call("PATCH", `/${resource}/${data.id}`, { name: "Renamed" })).status).toBe(200);
      expect((await call("GET", `/${resource}`, undefined, token, blog.blogId, "?limit=1")).status).toBe(200);
      expect((await call("DELETE", `/${resource}/${data.id}`)).status).toBe(200);
    }
    const foreign = await state.db.category.create({ data: { blogId: other.id, name: "Secret", slug: "secret" } });
    expect((await call("PATCH", `/categories/${foreign.id}`, { name: "Hacked" })).status).toBe(404);
    expect((await call("DELETE", `/categories/${foreign.id}`)).status).toBe(404);
  });
  it("keeps drafts private and requires publish scope to create/edit/delete published posts", async () => {
    const draftKey = (await createApiKey(blog.id, { name: "Drafting", scopes: ["content:read", "content:write", "content:delete"] })).token!;
    const created = await call("POST", "/posts", { ...draftExample, language: "es" }, draftKey);
    expect(created.status).toBe(201);
    const { data } = await created.json();
    expect((await call("POST", "/posts", { ...draftExample, slug: "no-publish", status: "published" }, draftKey)).status).toBe(403);
    expect((await call("PATCH", `/posts/${data.id}`, { title: "Revised" }, draftKey)).status).toBe(200);
    expect(await state.db.post.findUnique({ where: { id: data.id } })).toMatchObject({ language: "es", status: "draft" });
    const publicResult = await publicPosts(new NextRequest(`http://localhost/api/blogs/${blog.blogId}/posts`), { params: Promise.resolve({ blogId: blog.blogId }) });
    expect((await publicResult.json()).data).toEqual([]);
    expect((await call("PATCH", `/posts/${data.id}`, { status: "published" }, draftKey)).status).toBe(403);
    expect((await call("PATCH", `/posts/${data.id}`, { status: "published" })).status).toBe(200);
    expect((await call("PATCH", `/posts/${data.id}`, { title: "Live edit" }, draftKey)).status).toBe(403);
    expect((await call("PATCH", `/posts/${data.id}`, { status: "draft" }, draftKey)).status).toBe(403);
    expect((await call("DELETE", `/posts/${data.id}`, undefined, draftKey)).status).toBe(403);
    expect((await call("DELETE", `/posts/${data.id}`)).status).toBe(200);
  });
  it("rejects foreign relations and preserves old relations after a failed patch", async () => {
    const local = await state.db.category.create({ data: { blogId: blog.id, name: "Local", slug: "local" } });
    const foreign = await state.db.category.create({ data: { blogId: other.id, name: "Foreign", slug: "foreign" } });
    const { data } = await (await call("POST", "/posts", { ...draftExample, categoryIds: [local.id] })).json();
    expect((await call("PATCH", `/posts/${data.id}`, { categoryIds: [foreign.id] })).status).toBe(400);
    expect(await state.db.postCategory.findMany({ where: { postId: data.id } })).toMatchObject([{ categoryId: local.id }]);
    const author = await state.db.author.create({ data: { blogId: other.id, name: "Foreign", slug: "foreign", email: "foreign@zenex.test" } });
    expect((await call("PATCH", `/posts/${data.id}`, { authorId: author.id })).status).toBe(400);
    const tag = await state.db.tag.create({ data: { blogId: other.id, name: "Foreign", slug: "foreign" } });
    expect((await call("PATCH", `/posts/${data.id}`, { tagIds: [tag.id] })).status).toBe(400);
    expect((await call("PATCH", `/posts/${data.id}`, { categoryIds: [] })).status).toBe(200);
    expect(await state.db.postCategory.count({ where: { postId: data.id } })).toBe(0);
  });
  it("rolls back relation replacements if a unique slug constraint fails", async () => {
    const category = await state.db.category.create({ data: { blogId: blog.id, name: "Keep", slug: "keep" } });
    await call("POST", "/posts", { ...draftExample, slug: "taken" });
    const { data } = await (await call("POST", "/posts", { ...draftExample, categoryIds: [category.id] })).json();
    expect((await call("PATCH", `/posts/${data.id}`, { slug: "taken", categoryIds: [] })).status).toBe(409);
    expect(await state.db.postCategory.count({ where: { postId: data.id } })).toBe(1);
  });
  it("links translations only inside this blog and validates field/query boundaries", async () => {
    const { data } = await (await call("POST", "/posts", draftExample)).json();
    expect((await call("POST", "/posts", { ...draftExample, language: "es", translationGroupId: data.translationGroupId })).status).toBe(201);
    const foreign = await state.db.post.create({ data: { blogId: other.id, title: "Secret", slug: "secret", content: {}, translationGroupId: "e13a94e8-6b17-4a01-9f3e-f15777c67162" } });
    expect((await call("PATCH", `/posts/${data.id}`, { translationGroupId: foreign.translationGroupId })).status).toBe(400);
    expect((await call("PATCH", `/posts/${data.id}`, { blogId: other.id })).status).toBe(400);
    expect((await call("PATCH", `/posts/${data.id}`, {})).status).toBe(400);
    expect((await call("GET", "/posts", undefined, token, blog.blogId, "?limit=101")).status).toBe(400);
    expect((await call("GET", "/posts", undefined, token, blog.blogId, "?orderBy=password")).status).toBe(400);
    const response = await call("GET", "/posts");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
  it("uses the same guarded service for dashboard editing", async () => {
    const created = await createPost({ ...draftExample, blogId: blog.id });
    expect(created.error).toBeUndefined();
    expect((await updatePost(created.post!.id, { title: "From dashboard" })).error).toBeUndefined();
    state.session = null;
    expect((await updatePost(created.post!.id, { title: "Unauthorized" })).error).toBe("Unauthorized");
  });
  it("MCP negotiates with the SDK, filters tools by scope and rejects forbidden calls", async () => {
    const initialized = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    expect(initialized.status).toBe(200);
    expect((await initialized.json()).result.serverInfo.name).toBe("zenex-cms");
    const readKey = (await createApiKey(blog.id, { name: "Reader", scopes: ["content:read"] })).token!;
    const listed = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }, readKey);
    const tools = (await listed.json()).result.tools;
    expect(tools.some((t: { name: string }) => t.name === "list_posts")).toBe(true);
    expect(tools.some((t: { name: string }) => t.name === "create_posts")).toBe(false);
    const forbidden = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "create_posts", arguments: draftExample } }, readKey);
    expect((await forbidden.json()).result.isError).toBe(true);
    expect((await mcpGet(request())).status).toBe(405);
    const wrongOrigin = new Request("http://localhost/api/mcp", { method: "POST", headers: { Origin: "https://evil.example" } });
    expect((await mcpPost(wrongOrigin)).status).toBe(403);
  });
  it("runs a real local stdio bridge against the HTTP MCP transport", async () => {
    const http = createServer(async (req, res) => {
      try {
        if (req.url !== "/api/mcp") { res.writeHead(404).end(); return; }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) if (typeof value === "string") headers.set(key, value);
        const request = new Request(`http://127.0.0.1${req.url}`, { method: req.method, headers, ...(req.method === "POST" ? { body: Buffer.concat(chunks) } : {}) });
        const response = req.method === "POST" ? await mcpPost(request) : await mcpGet(request);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch { res.writeHead(500).end(); }
    });
    await new Promise<void>(done => http.listen(0, "127.0.0.1", done));
    const address = http.address() as { port: number };
    const client = new Client({ name: "integration-test", version: "1" });
    const transport = new StdioClientTransport({ command: process.execPath, args: [resolve("scripts/mcp-stdio.mjs")], env: { ZENEX_CMS_URL: `http://127.0.0.1:${address.port}`, ZENEX_API_KEY: token }, stderr: "pipe" });
    try {
      await client.connect(transport);
      expect((await client.listTools()).tools).toHaveLength(23);
      const result = await client.callTool({ name: "create_posts", arguments: draftExample });
      expect(result.isError).not.toBe(true);
      expect(await state.db.post.count({ where: { blogId: blog.id } })).toBe(1);
      await revokeApiKey(blog.id, keyId);
      expect((await client.callTool({ name: "get_blog", arguments: {} })).isError).toBe(true);
    } finally {
      await client.close();
      await new Promise<void>(done => http.close(() => done()));
    }
  }, 20_000);
  it("does not allow a missing scope when calling the service directly", async () => {
    await expect(executeOperation({ ...principal(), scopes: ["content:read"] }, "create_posts", draftExample)).rejects.toMatchObject({ status: 403 });
    await expect(authenticateApiKey(request(null))).rejects.toMatchObject({ status: 401 });
  });
});
