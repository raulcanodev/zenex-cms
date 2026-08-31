"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";
import { stdioConfig } from "@/lib/integrations/examples";
import { editorGuide } from "@/lib/integrations/editor-guide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const serverOrigin = () => "https://your-cms.example";

export function McpGuide({ dashboardId }: { dashboardId?: string }) {
  const origin = useSyncExternalStore(subscribe, getOrigin, serverOrigin);
  return <div className="space-y-8">
    <Card><CardHeader><CardTitle>1. Create a scoped API key</CardTitle><CardDescription>Start with content:read and content:write to let your agent prepare drafts. Publication and deletion are separate permissions.</CardDescription></CardHeader>
      <CardContent><Link className="text-sm underline underline-offset-4" href={dashboardId ? `/dashboard/blogs/${dashboardId}/api-keys` : "/dashboard"}>Open API keys in your blog →</Link></CardContent></Card>
    <Card><CardHeader><CardTitle>2. Connect a local client with stdio</CardTitle><CardDescription>For clients that launch MCP servers as local processes. Install Node.js 24 and run npm ci in your local Zenex checkout first; no database or CMS environment file is needed for the bridge.</CardDescription></CardHeader>
      <CardContent className="space-y-4"><DocsCodeBlock language="json" code={stdioConfig(origin)} filename="Generic mcpServers configuration" />
        <p className="text-sm text-muted-foreground">Replace the absolute script path and key locally. This format is accepted by clients using mcpServers JSON; other clients need the same command, args and environment in their own format. Use your client’s secret store when available. Restart or reconnect the integration after saving.</p>
        <p className="text-sm text-muted-foreground">The bridge connects to your hosted CMS using HTTPS and authenticates every request. It does not run a local database or expose a listening port. Use the direct node command above; package-manager banners must not be written to MCP stdout.</p>
      </CardContent></Card>
    <Card><CardHeader><CardTitle>Or connect directly over Streamable HTTP</CardTitle><CardDescription>For clients that support a remote MCP endpoint and a custom Authorization header.</CardDescription></CardHeader>
      <CardContent className="space-y-4"><DocsCodeBlock language="text" code={`URL: ${origin}/api/mcp\nTransport: Streamable HTTP\nAuthorization: Bearer znx_REPLACE_WITH_YOUR_KEY`} />
        <p className="text-sm text-muted-foreground">This is API-key authentication, not OAuth. Clients that require OAuth-only remote servers need the stdio bridge if they support local servers. Legacy SSE-only clients are not supported. Stateless JSON responses do not provide background notifications.</p>
      </CardContent></Card>
    <Card><CardHeader><CardTitle>3. Test the editorial workflow</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-muted-foreground">
      <ol className="list-decimal space-y-2 pl-5"><li>Ask the agent to call get_blog and list_categories.</li><li>Create a category, then use its ID in create_posts with status draft.</li><li>Review the draft in the dashboard. Publish only after approval and with content:publish + content:write.</li></ol>
      <p>Tools cover posts, categories, tags, authors, image upload and blog metadata. Translations use separate posts linked by translationGroupId. New blogs, ownership, members, API keys and paid automatic translation remain dashboard-only.</p>
      <Link href="/docs/api/management" className="inline-block text-foreground underline underline-offset-4">REST endpoints, fields and permissions →</Link>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Rich content: every editor block</CardTitle><CardDescription>Agents use the same Editor.js JSON as the dashboard through create_posts and update_posts, over either transport.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm text-muted-foreground">
      <p>Ask the agent to call <code>get_editor_guide</code> for examples of paragraphs, headings, nested lists, quotes, code, tables, images, link cards, safe HTML and separators.</p>
      <p>For a table with a bold, shaded header row, send this block inside <code>content.blocks</code>. Use <code>withHeadings: false</code> for a table without a header.</p>
      <DocsCodeBlock language="json" code={JSON.stringify(editorGuide.blocks.find(block => block.type === "table")!.example, null, 2)} filename="Table block" />
      <p><strong>Editing:</strong> supplying content replaces all blocks. Read the post first and preserve everything outside the requested edit. Raw HTML is sanitized; scripts and arbitrary iframes do not execute. Public blogs need the shared zenex-cms.css stylesheet or equivalent styles.</p>
    </CardContent></Card>
    <section className="space-y-3 text-sm text-muted-foreground"><h2 className="text-lg font-semibold text-foreground">Troubleshooting</h2>
      <p><strong>401:</strong> missing, expired or revoked key. <strong>403:</strong> missing scope, wrong blog or disallowed browser origin. <strong>429:</strong> wait 60 seconds. <strong>500:</strong> ask the operator to check database connectivity and apply the API-key migration.</p>
      <p>Keep secrets out of prompts, repositories, browser bundles and public environment variables. Use one key per client and revoke it if compromised. Do not automatically retry a failed write: first check whether it was saved.</p>
    </section>
  </div>;
}
