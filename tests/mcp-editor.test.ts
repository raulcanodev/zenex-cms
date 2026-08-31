import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }));
import { createMcpServer } from "@/lib/integrations/mcp";
import { editorGuide } from "@/lib/integrations/editor-guide";
import { operationSchemas } from "@/src/server/services/content/service";
import { convertBlocksToHtml } from "@/lib/editorjs-to-html";
import type { ApiScope } from "@/lib/integrations/scopes";

describe("MCP rich content", () => {
  it.each(editorGuide.blocks)("accepts the documented $type block for create and update and renders it", ({ example }) => {
    const content = { blocks: [example] };
    const created = operationSchemas.create_posts.parse({ title: "Rich draft", slug: "rich-draft", content });
    const updated = operationSchemas.update_posts.parse({ id: "post", content });
    expect(created).toMatchObject({ content, status: "draft" });
    expect(updated).toEqual({ id: "post", content });
    expect(convertBlocksToHtml(content)).not.toBe("");
  });

  it.each<ApiScope[]>([["content:read"], ["content:write"], ["content:read", "content:write"]])("discovers and reads the guide over the MCP protocol with scopes %j", async (...scopes) => {
    const server = createMcpServer({ blogId: "blog", publicBlogId: "public", keyId: "test", scopes });
    const client = new Client({ name: "editor-guide-test", version: "1" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const { tools } = await client.listTools();
      expect(tools.find(tool => tool.name === "get_editor_guide")?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
      const result = await client.callTool({ name: "get_editor_guide", arguments: {} });
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toEqual(editorGuide);
      if (scopes.includes("content:write")) {
        for (const name of ["create_posts", "update_posts"]) {
          const contentSchema = tools.find(tool => tool.name === name)?.inputSchema.properties?.content;
          expect(contentSchema).toMatchObject({ description: expect.stringContaining("get_editor_guide") });
          expect(contentSchema).toMatchObject({ description: expect.stringContaining("replaces ALL blocks") });
        }
      } else {
        expect(tools.some(tool => tool.name === "create_posts")).toBe(false);
        expect((await client.callTool({ name: "create_posts", arguments: {} })).isError).toBe(true);
      }
    } finally {
      await client.close();
      await server.close();
    }
  });
});
