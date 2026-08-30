import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { McpGuide } from "@/components/Integrations/McpGuide";

export default function McpDocsPage() {
  return <DocsLayout><DocsSidebar /><main className="min-w-0 py-8"><div className="mx-auto max-w-3xl space-y-8">
    <div className="space-y-3"><h1 className="text-4xl font-bold tracking-tight">MCP integration</h1><p className="text-muted-foreground">Use Zenex from an AI client with stdio or Streamable HTTP. Both transports use the same scoped API keys and editorial operations.</p></div>
    <McpGuide />
  </div></main></DocsLayout>;
}
