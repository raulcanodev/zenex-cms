import { BlogIntegrationLayout, integrationBlog } from "@/components/Integrations/BlogIntegrationLayout";
import { ApiKeysManager } from "@/components/Integrations/ApiKeysManager";
import { listApiKeys } from "@/src/server/services/api-keys/actions";

export default async function ApiKeysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { blog, isOwner } = await integrationBlog(id);
  const keys = isOwner ? await listApiKeys(id) : [];
  return <BlogIntegrationLayout blog={blog} title="API keys" description="Control how agents and applications access this blog. The same key works with the private REST API and MCP.">
    {isOwner ? <ApiKeysManager blogId={id} keys={keys.map(key => ({ ...key, createdAt: key.createdAt.toISOString(), expiresAt: key.expiresAt?.toISOString() ?? null, revokedAt: key.revokedAt?.toISOString() ?? null, lastUsedAt: key.lastUsedAt?.toISOString() ?? null }))} /> :
      <p className="rounded-xl border p-6 text-sm text-muted-foreground">Only the blog owner can manage API keys. Ask the owner to create a scoped key for your client.</p>}
  </BlogIntegrationLayout>;
}
