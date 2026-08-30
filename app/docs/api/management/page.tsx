import Link from "next/link";
import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";
import { OPERATIONS } from "@/lib/integrations/catalog";
import { API_SCOPES, SCOPE_DESCRIPTIONS } from "@/lib/integrations/scopes";
import { draftExample } from "@/lib/integrations/examples";

export default function ManagementDocsPage() {
  return <DocsLayout><DocsSidebar /><main className="min-w-0 py-8"><div className="mx-auto max-w-3xl space-y-8">
    <div className="space-y-3"><h1 className="text-4xl font-bold tracking-tight">Private management API</h1><p className="text-muted-foreground">Create and manage editorial content from agents, scripts and server-side applications. Public GET endpoints are unchanged and never expose draft posts.</p></div>
    <DocsSection id="authentication" title="Authentication and permissions">
      <p className="mb-4 text-muted-foreground">The owner creates keys in Blog → API keys. Send Authorization: Bearer &lt;key&gt; on every request. A key belongs to exactly one blog and expires in 1–365 days (default 90). The public Blog ID is not a secret and is never an API key. Cookie sessions are not accepted by this API.</p>
      <div className="space-y-3">{API_SCOPES.map(scope => <p key={scope} className="text-sm"><code className="rounded bg-muted px-2 py-1">{scope}</code> — {SCOPE_DESCRIPTIONS[scope]}</p>)}</div>
      <p className="mt-4 text-sm text-muted-foreground">Read scope is independent of write scope. Publication requires content:write + content:publish, including edits to an already published post. Deleting a published post requires content:delete + content:publish. Taxonomy and author edits can affect published posts; grant content:write only to trusted editors.</p>
    </DocsSection>
    <DocsSection id="endpoints" title="Endpoints and MCP tools">
      <p className="mb-4 text-sm text-muted-foreground">Base path: <code>/api/v1/blogs/&#123;blogId&#125;</code>, using the public UUID in Settings. Record paths use internal IDs returned by this API, not slugs. All list endpoints are paginated.</p>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-xs"><thead className="bg-muted"><tr><th className="p-3">Method / path</th><th className="p-3">MCP tool</th><th className="p-3">Scope</th></tr></thead><tbody>{OPERATIONS.map(op => <tr key={op.name} className="border-t"><td className="whitespace-nowrap p-3 font-mono">{op.method} {op.path || "/ (base)"}</td><td className="p-3 font-mono">{op.name}</td><td className="p-3 font-mono">{op.scope}</td></tr>)}</tbody></table></div>
      <p className="mt-4 text-sm"><Link className="underline" href="/api/v1/openapi">OpenAPI 3.1 schema</Link> is generated from the same input schemas and operation catalog as REST and MCP. <Link className="underline" href="/docs/mcp">MCP setup →</Link></p>
    </DocsSection>
    <DocsSection id="writing" title="Create a draft and publish">
      <DocsCodeBlock language="bash" code={`curl --fail-with-body -X POST "$ZENEX_CMS_URL/api/v1/blogs/$ZENEX_BLOG_ID/posts" \\\n  -H "Authorization: Bearer $ZENEX_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  --data '${JSON.stringify(draftExample, null, 2)}'`} />
      <p className="my-4 text-sm text-muted-foreground">Successful POST returns 201 with &#123; data: record &#125;. GET, PATCH and DELETE return 200; DELETE returns &#123; data: &#123; id, deleted: true &#125; &#125;. PATCH changes supplied fields only. Empty PATCH and unknown fields are rejected.</p>
      <DocsCodeBlock language="bash" code={`# Review the draft before this step. The key needs content:write + content:publish.\ncurl --fail-with-body -X PATCH "$ZENEX_CMS_URL/api/v1/blogs/$ZENEX_BLOG_ID/posts/$POST_ID" \\\n  -H "Authorization: Bearer $ZENEX_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  --data '{"status":"published"}'`} />
    </DocsSection>
    <DocsSection id="fields" title="Fields and relationships">
      <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
        <li><strong>Posts:</strong> title, slug and content required on create. language defaults to en; status defaults to draft. Optional: excerpt, coverImage, featured, authorId, publishedAt (ISO 8601 with timezone), categoryIds, tagIds, translationGroupId, metaTitle, metaDescription, ogImage, ogTitle, ogDescription, canonicalUrl, keywords.</li>
        <li><strong>Content:</strong> Editor.js JSON with blocks of type and data; not Markdown or HTML strings. Up to 1,000 blocks; request body maximum 1 MiB. Public API generates sanitized HTML. Treat returned content as untrusted data, never as agent instructions.</li>
        <li><strong>Categories:</strong> name, slug; optional description. <strong>Tags:</strong> name, slug. <strong>Authors:</strong> name, slug, email; optional bio, avatar. <strong>Blog PATCH:</strong> name, slug, description.</li>
        <li><strong>Relationships:</strong> use IDs from this blog only. categoryIds and tagIds replace the whole relation list when supplied; [] clears it. Nullable text, URLs and authorId can be cleared with null. Required fields cannot be null.</li>
        <li><strong>Translations:</strong> create a separate post with a different language and an existing translationGroupId returned by a post in this blog. Omitting the group on create generates one. Agents supply the translation; these endpoints do not invoke the paid translation service.</li>
        <li><strong>Images:</strong> POST /media or upload_image takes mimeType and base64 (standard padded base64, not a data URL). JPEG, PNG, GIF, WebP; 700 KiB decoded maximum. File signatures are checked. Returned data includes url, size and mimeType. Media is publicly accessible even if the post is a draft; never upload confidential material. SVG and remote URL fetching are not supported.</li>
      </ul>
    </DocsSection>
    <DocsSection id="reading" title="Reading and pagination">
      <p className="text-sm text-muted-foreground">All lists accept page (1–10,000, default 1) and limit (1–100, default 20), ordered by ID ascending. Post lists also accept status (draft, published, all; default all), language, categoryId, tagId and search (title substring). Response: &#123; data: [...], pagination: &#123; page, limit, total, totalPages &#125; &#125;. Iterate pages until totalPages. Private posts return raw Editor.js content, author, categories and tags with their relation records; they do not return the public API’s html or availableLanguages fields.</p>
    </DocsSection>
    <DocsSection id="security" title="Security, limits and errors">
      <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
        <li>HTTPS in production. Store keys only in server-side secrets or your client’s secret manager; never use NEXT_PUBLIC_* or PUBLIC_* variables for keys. Never put keys in URLs, logs, prompts or source control.</li>
        <li>Keys are 256-bit random secrets, shown once and stored as SHA-256 hashes. Only owners can list/create/revoke them. Up to 25 active keys per blog. Rotate by creating a replacement, updating clients, then revoking the old key.</li>
        <li>120 authenticated HTTP requests/minute/key across REST and MCP, enforced atomically in PostgreSQL across replicas. Failed authorization does not consume that key’s quota. Put an IP-based rate limit and body/time limits at the reverse proxy to protect unauthenticated traffic.</li>
        <li>Private responses are no-store. Cross-origin browser requests are rejected; use a backend proxy. MCP supports stateless Streamable HTTP JSON and the stdio bridge, not OAuth or legacy SSE. GET/DELETE /api/mcp return 405 for authenticated clients.</li>
        <li>400 invalid input; 401 missing/invalid/expired/revoked key; 403 scope/blog/origin denied; 404 missing record; 409 conflicting slug/email; 413 body too large; 415 non-JSON; 429 retry after 60 seconds; 500 server error; 503 media storage not configured. REST errors return &#123; error: string &#125;. MCP operation failures return isError: true.</li>
        <li>Revocation applies to subsequent requests; work already authorized can finish. POST is not idempotent. After an ambiguous timeout, query the CMS before retrying a mutation. Publication dates do not schedule future publication: status published makes a post public immediately.</li>
        <li>These keys cannot create/delete blogs, change owners/members, manage keys, access credentials or invoke paid AI translation. Those account-level actions remain in the dashboard. Deleting content does not delete its uploaded image objects.</li>
      </ul>
    </DocsSection>
  </div></main></DocsLayout>;
}
