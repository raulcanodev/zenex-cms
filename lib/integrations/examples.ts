export function stdioConfig(origin: string) {
  return JSON.stringify({ mcpServers: { zenex: {
    command: "node", args: ["/absolute/path/to/zenex-cms/scripts/mcp-stdio.mjs"],
    env: { ZENEX_CMS_URL: origin, ZENEX_API_KEY: "znx_REPLACE_WITH_YOUR_KEY" },
  } } }, null, 2);
}
export const draftExample = { title: "Hello from an agent", slug: "hello-from-an-agent", language: "en", status: "draft" as const, content: { blocks: [{ type: "paragraph", data: { text: "A draft ready for review." } }] } };
